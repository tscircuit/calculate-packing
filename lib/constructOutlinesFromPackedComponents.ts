import type { PackedComponent, PackOutput } from "./types"
import type { Point } from "@tscircuit/math-utils"

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
  // TODO
}
