import type { cju } from "@tscircuit/circuit-json-util"
import type { PcbComponent } from "circuit-json"
import { getPlatedHolePadDimensions } from "./getPlatedHolePadDimensions"
import { getPolygonBoundingBox } from "./getPolygonBoundingBox"
import { getRotatedBoundingBoxSize } from "./getRotatedBoundingBoxSize"

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

  for (const via of db.pcb_via.list({
    pcb_component_id: pcbComponent.pcb_component_id,
  })) {
    const pcbPortId =
      "pcb_port_id" in via && typeof via.pcb_port_id === "string"
        ? via.pcb_port_id
        : undefined
    const diameter = via.outer_diameter ?? via.hole_diameter ?? 0
    out.push({
      padId: via.pcb_via_id,
      networkId: getNetworkId(pcbPortId),
      size: { x: diameter, y: diameter },
      absoluteCenter: { x: via.x, y: via.y },
      pcbPortId,
    })
  }

  for (const ph of db.pcb_plated_hole.list({
    pcb_component_id: pcbComponent.pcb_component_id,
  })) {
    const padDims = getPlatedHolePadDimensions(ph)
    if (!padDims) continue
    out.push({
      padId: ph.pcb_plated_hole_id,
      networkId: getNetworkId(ph.pcb_port_id),
      size: { x: padDims.width, y: padDims.height },
      absoluteCenter: { x: padDims.centerX, y: padDims.centerY },
      pcbPortId: ph.pcb_port_id,
    })
  }

  for (const sp of db.pcb_smtpad.list({
    pcb_component_id: pcbComponent.pcb_component_id,
  })) {
    switch (sp.shape) {
      case "rect": {
        out.push({
          padId: sp.pcb_smtpad_id,
          networkId: getNetworkId(sp.pcb_port_id),
          size: { x: sp.width ?? 0, y: sp.height ?? 0 },
          absoluteCenter: { x: sp.x, y: sp.y },
          pcbPortId: sp.pcb_port_id,
        })
        break
      }
      case "pill": {
        out.push({
          padId: sp.pcb_smtpad_id,
          networkId: getNetworkId(sp.pcb_port_id),
          size: { x: sp.width, y: sp.height },
          absoluteCenter: { x: sp.x, y: sp.y },
          pcbPortId: sp.pcb_port_id,
        })
        break
      }
      case "rotated_rect":
      case "rotated_pill": {
        const size = getRotatedBoundingBoxSize({
          width: sp.width,
          height: sp.height,
          ccwRotationDegrees: sp.ccw_rotation,
        })
        out.push({
          padId: sp.pcb_smtpad_id,
          networkId: getNetworkId(sp.pcb_port_id),
          size: { x: size.width, y: size.height },
          absoluteCenter: { x: sp.x, y: sp.y },
          pcbPortId: sp.pcb_port_id,
        })
        break
      }
      case "circle": {
        out.push({
          padId: sp.pcb_smtpad_id,
          networkId: getNetworkId(sp.pcb_port_id),
          size: { x: sp.radius * 2, y: sp.radius * 2 },
          absoluteCenter: { x: sp.x, y: sp.y },
          pcbPortId: sp.pcb_port_id,
        })
        break
      }
      case "polygon": {
        if (sp.points && sp.points.length > 0) {
          const { minX, maxX, minY, maxY } = getPolygonBoundingBox(sp.points)
          out.push({
            padId: sp.pcb_smtpad_id,
            networkId: getNetworkId(sp.pcb_port_id),
            size: { x: maxX - minX, y: maxY - minY },
            absoluteCenter: {
              x: (minX + maxX) / 2,
              y: (minY + maxY) / 2,
            },
            pcbPortId: sp.pcb_port_id,
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
