import type { cju } from "@tscircuit/circuit-json-util"
import type { PcbComponent } from "circuit-json"

const getPolygonBoundingBox = (points: Array<{ x: number; y: number }>) => {
  if (!points || points.length === 0)
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  for (const point of points) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }

  return { minX, maxX, minY, maxY }
}

/* ---------- Flattened type helpers and pad extraction ---------- */
type PadInfo = {
  padId: string
  networkId: string
  size: { x: number; y: number }
  absoluteCenter: { x: number; y: number }
  pcbPortId?: string
}

/* pads of one pcb_component – absolute centres only (offset filled in later) */
export const extractPadInfos = (
  pcbComponent: PcbComponent,
  db: ReturnType<typeof cju>,
  getNetworkId: (pcbPortId?: string) => string,
): PadInfo[] => {
  const out: PadInfo[] = []

  const pushPad = ({
    padId,
    pcbPortId,
    sx,
    sy,
    x,
    y,
  }: {
    padId: string
    pcbPortId: string | undefined
    sx: number
    sy: number
    x: number
    y: number
  }) =>
    out.push({
      padId,
      networkId: getNetworkId(pcbPortId),
      size: { x: sx, y: sy },
      absoluteCenter: { x, y },
      pcbPortId,
    })

  for (const via of db.pcb_via.list({
    pcb_component_id: pcbComponent.pcb_component_id,
  })) {
    pushPad({
      padId: via.pcb_via_id,
      pcbPortId: (via as any).pcb_port_id,
      sx: via.outer_diameter ?? via.hole_diameter ?? 0,
      sy: via.outer_diameter ?? via.hole_diameter ?? 0,
      x: via.x,
      y: via.y,
    })
  }

  for (const ph of db.pcb_plated_hole.list({
    pcb_component_id: pcbComponent.pcb_component_id,
  })) {
    switch (ph.shape) {
      case "circle": {
        pushPad({
          padId: ph.pcb_plated_hole_id,
          pcbPortId: ph.pcb_port_id,
          sx: ph.outer_diameter ?? ph.hole_diameter ?? 0,
          sy: ph.outer_diameter ?? ph.hole_diameter ?? 0,
          x: ph.x,
          y: ph.y,
        })
        break
      }
      case "oval": {
        pushPad({
          padId: ph.pcb_plated_hole_id,
          pcbPortId: ph.pcb_port_id,
          sx: ph.outer_width,
          sy: ph.outer_height,
          x: ph.x,
          y: ph.y,
        })
        break
      }
      case "circular_hole_with_rect_pad": {
        pushPad({
          padId: ph.pcb_plated_hole_id,
          pcbPortId: ph.pcb_port_id,
          sx: ph.rect_pad_width,
          sy: ph.rect_pad_height,
          x: ph.x,
          y: ph.y,
        })
        break
      }
      case "pill": {
        pushPad({
          padId: ph.pcb_plated_hole_id,
          pcbPortId: ph.pcb_port_id,
          sx: ph.outer_width,
          sy: ph.outer_height,
          x: ph.x,
          y: ph.y,
        })
        break
      }
      case "pill_hole_with_rect_pad": {
        pushPad({
          padId: ph.pcb_plated_hole_id,
          pcbPortId: ph.pcb_port_id,
          sx: ph.rect_pad_width,
          sy: ph.rect_pad_height,
          x: ph.x,
          y: ph.y,
        })
        break
      }
      default: {
        console.warn(`Unsupported plated hole shape ${(ph as any).shape}`)
        break
      }
    }
  }

  for (const sp of db.pcb_smtpad.list({
    pcb_component_id: pcbComponent.pcb_component_id,
  })) {
    switch (sp.shape) {
      case "rect": {
        pushPad({
          padId: sp.pcb_smtpad_id,
          pcbPortId: sp.pcb_port_id,
          sx: sp.width ?? 0,
          sy: sp.height ?? 0,
          x: sp.x,
          y: sp.y,
        })
        break
      }
      case "circle": {
        pushPad({
          padId: sp.pcb_smtpad_id,
          pcbPortId: sp.pcb_port_id,
          sx: sp.radius * 2, // Convert radius to diameter for width/height
          sy: sp.radius * 2,
          x: sp.x,
          y: sp.y,
        })
        break
      }
      case "polygon": {
        if (sp.points && sp.points.length > 0) {
          const { minX, maxX, minY, maxY } = getPolygonBoundingBox(sp.points)
          const width = maxX - minX
          const height = maxY - minY
          const centerX = (minX + maxX) / 2
          const centerY = (minY + maxY) / 2

          pushPad({
            padId: sp.pcb_smtpad_id,
            pcbPortId: sp.pcb_port_id,
            sx: width,
            sy: height,
            x: centerX,
            y: centerY,
          })
        } else {
          console.warn(`Polygon pad ${sp.pcb_smtpad_id} has no points`)
        }
        break
      }
    }
  }

  return out
}
