import type { Bounds, Point } from "@tscircuit/math-utils"

export const pushCenterOutsideOutlineSegment = (opts: {
  center: Point
  componentBounds: Bounds
  outwardNormal: Point
}): Point => {
  const { center, componentBounds, outwardNormal } = opts
  const localMinX = componentBounds.minX - center.x
  const localMaxX = componentBounds.maxX - center.x
  const localMinY = componentBounds.minY - center.y
  const localMaxY = componentBounds.maxY - center.y

  if (Math.abs(outwardNormal.x) > Math.abs(outwardNormal.y)) {
    return {
      x: outwardNormal.x > 0 ? center.x - localMinX : center.x - localMaxX,
      y: center.y,
    }
  }

  return {
    x: center.x,
    y: outwardNormal.y > 0 ? center.y - localMinY : center.y - localMaxY,
  }
}
