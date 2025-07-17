import type { PackedComponent } from "./types"
import type { Point } from "@tscircuit/math-utils"
import { getComponentBounds } from "./geometry/getComponentBounds"
import { convexHull } from "./geometry/convexHull"

type Outline = Array<[Point, Point]>

/**
 * Construct a set of outlines from a list of packed components.
 *
 * The outline is a list of line segments that form a closed polygon. Surrounding
 * one or more PackedComponents.
 *
 * The outlines are always at least minGap away from the edge of any pad.
 *
 */
export const constructOutlinesFromPackedComponents = (
  components: PackedComponent[],
  opts: {
    minGap?: number
  } = {},
): Outline[] => {
  const { minGap = 0 } = opts
  if (components.length === 0) return []

  // Gather rectangle corners for every component (+minGap).
  const allPoints: Point[] = []
  for (const c of components) {
    const b = getComponentBounds(c, minGap)
    allPoints.push(
      { x: b.minX, y: b.minY },
      { x: b.maxX, y: b.minY },
      { x: b.maxX, y: b.maxY },
      { x: b.minX, y: b.maxY },
    )
  }

  const hull = convexHull(allPoints)
  if (hull.length === 0) return []

  // Convert hull vertices → ordered edge list.
  const outline: Outline = []
  for (let i = 0; i < hull.length; i++) {
    outline.push([hull[i]!, hull[(i + 1) % hull.length]!])
  }

  return [outline]
}
