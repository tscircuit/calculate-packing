import type { PackedComponent, PackOutput } from "./types"
import type { Point } from "@tscircuit/math-utils"

/**
 * Construct an outline from a list of packed components.
 *
 * The outline is a list of line segments that form a closed polygon.
 *
 * The polygon includes all of the PackedComponents.
 *
 * The left side of the polygon is constructed by looking at the minX of each
 * pad within every packed component. The outline "traces the outside" the
 * outside edge of the packaged components/pads.
 *
 * There is not allowed to be a "sudden change" in the outline that is smaller
 * than minGap, meaning if the y-delta between two minX changes is less than
 * minGap, then we take the smallest (leftmost) of the minX values (draw the
 * outline "over" that small gap)
 *
 */
export const constructOutlineFromPackedComponents = (
  components: PackedComponent[],
  opts: {
    minGap?: number
  } = {},
): Array<[Point, Point]> => {
  const { minGap = 0 } = opts
  // TODO
}
