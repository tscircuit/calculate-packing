import type { AnyCircuitElement } from "circuit-json"
import type { InputObstacle } from "../types"
import { getPlatedHolePadDimensions } from "./getPlatedHolePadDimensions"
import { getRotatedBoundingBoxSize } from "./getRotatedBoundingBoxSize"

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
    const bounds = getRotatedBoundingBoxSize({
      width: rect_pad_width,
      height: rect_pad_height,
      ccwRotationDegrees: rect_ccw_rotation,
    })
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
    const padDims = getPlatedHolePadDimensions(element)
    if (!padDims) return undefined
    return {
      obstacleId: element.pcb_plated_hole_id,
      absoluteCenter: { x: padDims.centerX, y: padDims.centerY },
      width: padDims.width,
      height: padDims.height,
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
