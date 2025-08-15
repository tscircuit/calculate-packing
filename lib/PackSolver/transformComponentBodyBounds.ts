import type { PackedComponent, ComponentBodyBounds } from "../types"

/**
 * Rotate a point around the origin by the given angle (in radians)
 */
function rotatePoint(point: { x: number; y: number }, angleRad: number) {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }
}

/**
 * Transform component body bounds to account for rotation and translation.
 * This mirrors the transformation logic used for pad positions.
 */
export function transformComponentBodyBounds(
  component: PackedComponent,
): ComponentBodyBounds | null {
  if (!component.bodyBounds) {
    return null
  }

  const originalBounds = component.bodyBounds
  const rotationAngle =
    ((component.ccwRotationDegrees ?? component.ccwRotationOffset ?? 0) *
      Math.PI) /
    180

  // Get the four corners of the original body bounds rectangle
  const corners = [
    { x: originalBounds.minX, y: originalBounds.minY }, // Bottom-left
    { x: originalBounds.maxX, y: originalBounds.minY }, // Bottom-right
    { x: originalBounds.maxX, y: originalBounds.maxY }, // Top-right
    { x: originalBounds.minX, y: originalBounds.maxY }, // Top-left
  ]

  // Transform each corner: rotate around origin, then translate to component center
  const transformedCorners = corners.map((corner) => {
    const rotatedCorner = rotatePoint(corner, rotationAngle)
    return {
      x: component.center.x + rotatedCorner.x,
      y: component.center.y + rotatedCorner.y,
    }
  })

  // Find the axis-aligned bounding box of the transformed corners
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const corner of transformedCorners) {
    minX = Math.min(minX, corner.x)
    maxX = Math.max(maxX, corner.x)
    minY = Math.min(minY, corner.y)
    maxY = Math.max(maxY, corner.y)
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
  }
}
