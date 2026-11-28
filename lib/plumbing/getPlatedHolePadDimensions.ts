import type { PcbPlatedHole } from "circuit-json"
import { rotatePoint } from "../math/rotatePoint"
import { getPolygonBoundingBox } from "./getPolygonBoundingBox"
import { getRotatedBoundingBoxSize } from "./getRotatedBoundingBoxSize"

export interface PlatedHolePadDimensions {
  width: number
  height: number
  centerX: number
  centerY: number
}

export const getPlatedHolePadDimensions = (
  platedHole: PcbPlatedHole,
): PlatedHolePadDimensions | null => {
  switch (platedHole.shape) {
    case "circle": {
      const diameter =
        platedHole.outer_diameter ?? platedHole.hole_diameter ?? 0
      return {
        width: diameter,
        height: diameter,
        centerX: platedHole.x,
        centerY: platedHole.y,
      }
    }
    case "oval":
    case "pill": {
      const size = getRotatedBoundingBoxSize({
        width: platedHole.outer_width,
        height: platedHole.outer_height,
        ccwRotationDegrees: platedHole.ccw_rotation,
      })
      return {
        width: size.width,
        height: size.height,
        centerX: platedHole.x,
        centerY: platedHole.y,
      }
    }
    case "circular_hole_with_rect_pad":
    case "pill_hole_with_rect_pad": {
      return {
        width: platedHole.rect_pad_width,
        height: platedHole.rect_pad_height,
        centerX: platedHole.x,
        centerY: platedHole.y,
      }
    }
    case "rotated_pill_hole_with_rect_pad": {
      const size = getRotatedBoundingBoxSize({
        width: platedHole.rect_pad_width,
        height: platedHole.rect_pad_height,
        ccwRotationDegrees: platedHole.rect_ccw_rotation,
      })
      return {
        width: size.width,
        height: size.height,
        centerX: platedHole.x,
        centerY: platedHole.y,
      }
    }
    case "hole_with_polygon_pad": {
      if (!platedHole.pad_outline || platedHole.pad_outline.length === 0) {
        console.warn(
          `Polygon plated hole ${platedHole.pcb_plated_hole_id} has no pad_outline`,
        )
        return null
      }
      const rotationDegrees =
        "ccw_rotation" in platedHole &&
        typeof platedHole.ccw_rotation === "number"
          ? platedHole.ccw_rotation
          : 0
      const angleRad = (rotationDegrees * Math.PI) / 180
      const rotatedLocalPoints =
        rotationDegrees === 0
          ? platedHole.pad_outline
          : platedHole.pad_outline.map((point) => rotatePoint(point, angleRad))
      const { minX, maxX, minY, maxY } =
        getPolygonBoundingBox(rotatedLocalPoints)
      return {
        width: maxX - minX,
        height: maxY - minY,
        centerX: platedHole.x + (minX + maxX) / 2,
        centerY: platedHole.y + (minY + maxY) / 2,
      }
    }
    default: {
      const unsupportedHole: Record<string, never> = platedHole
      console.warn(
        `Unsupported plated hole shape ${String(unsupportedHole.shape)}`,
      )
      return null
    }
  }
}
