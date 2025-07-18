import type { PackedComponent } from "./types"
import type { Point } from "@tscircuit/math-utils"
import { getComponentBounds } from "./geometry/getComponentBounds"
import { convexHull } from "./geometry/convexHull"
import { cross } from "./math/cross"

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

  // TODO

  return []
}
