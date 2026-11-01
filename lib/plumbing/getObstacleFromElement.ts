import type { AnyCircuitElement } from "circuit-json"
import type { InputObstacle } from "../types"

const getRotatedRectBounds = (
  width: number,
  height: number,
  ccwRotationDegrees: number,
) => {
  const angleRad = (ccwRotationDegrees * Math.PI) / 180
  const absCos = Math.abs(Math.cos(angleRad))
  const absSin = Math.abs(Math.sin(angleRad))
  return {
    width: width * absCos + height * absSin,
    height: width * absSin + height * absCos,
  }
}

/**
 * Convert a board-level circuit element into an InputObstacle, or return
 * undefined if the element type is not a recognised obstacle source.
 */
export const getObstacleFromElement = (
  element: AnyCircuitElement,
): InputObstacle | undefined => {
  if (
    element.type === "pcb_plated_hole" &&
    element.shape === "circular_hole_with_rect_pad"
  ) {
    const { rect_pad_height, rect_pad_width, x, y } = element
    return {
      obstacleId: element.pcb_plated_hole_id,
      absoluteCenter: { x, y },
      width: rect_pad_width,
      height: rect_pad_height,
    }
  }

  if (
    element.type === "pcb_plated_hole" &&
    element.shape === "rotated_pill_hole_with_rect_pad"
  ) {
    const { rect_pad_height, rect_pad_width, rect_ccw_rotation, x, y } = element
    const bounds = getRotatedRectBounds(
      rect_pad_width,
      rect_pad_height,
      rect_ccw_rotation,
    )
    return {
      obstacleId: element.pcb_plated_hole_id,
      absoluteCenter: { x, y },
      width: bounds.width,
      height: bounds.height,
    }
  }

  if (
    element.type === "pcb_plated_hole" &&
    element.shape === "hole_with_polygon_pad" &&
    element.pad_outline.length > 0
  ) {
    const angleRad = ((element.ccw_rotation ?? 0) * Math.PI) / 180
    const cos = Math.cos(angleRad)
    const sin = Math.sin(angleRad)
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const pt of element.pad_outline) {
      const rx = pt.x * cos - pt.y * sin
      const ry = pt.x * sin + pt.y * cos
      minX = Math.min(minX, rx)
      maxX = Math.max(maxX, rx)
      minY = Math.min(minY, ry)
      maxY = Math.max(maxY, ry)
    }
    return {
      obstacleId: element.pcb_plated_hole_id,
      absoluteCenter: {
        x: element.x + (minX + maxX) / 2,
        y: element.y + (minY + maxY) / 2,
      },
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  if (element.type === "pcb_hole") {
    const { x, y, pcb_hole_id } = element
    const width =
      "hole_diameter" in element ? element.hole_diameter : element.hole_width
    const height =
      "hole_diameter" in element ? element.hole_diameter : element.hole_height
    return {
      obstacleId: pcb_hole_id,
      absoluteCenter: { x, y },
      width,
      height,
    }
  }

  return undefined
}
