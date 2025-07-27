import type { cju } from "@tscircuit/circuit-json-util"
import type { PcbComponent } from "circuit-json"

/* ---------- Flattened type helpers and pad extraction ---------- */
type PadInfo = {
  padId: string
  networkId: string
  size: { x: number; y: number }
  absoluteCenter: { x: number; y: number }
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
    })

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
    }
    console.warn(`Unsupported plated hole shape ${ph.shape}`)
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
        break
      }
      case "pill": {
        break
      }
      case "polygon": {
        break
      }
      case "rotated_rect": {
        break
      }
    }

    console.warn(
      `smtpad shape ${sp.shape} pads are not supported in pack layout yet`,
    )
  }

  return out
}
