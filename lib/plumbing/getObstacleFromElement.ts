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
    element.shape === "hole_with_polygon_pad"
  ) {
    if (!element.pad_outline || element.pad_outline.length === 0) {
      return undefined
    }
    const angleRad = ((element.ccw_rotation ?? 0) * Math.PI) / 180
    const snapTrig = (value: number) => {
      if (Math.abs(value) < 1e-12) return 0
      if (Math.abs(Math.abs(value) - 1) < 1e-12) return Math.sign(value)
      return value
    }
    const cos = snapTrig(Math.cos(angleRad))
    const sin = snapTrig(Math.sin(angleRad))
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const point of element.pad_outline) {
      const rx = element.ccw_rotation ? point.x * cos - point.y * sin : point.x
      const ry = element.ccw_rotation ? point.x * sin + point.y * cos : point.y
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
