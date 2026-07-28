import type { Bounds } from "@tscircuit/math-utils"
import type { PackedComponent } from "../types"
import { getComponentCollisionBoxes } from "../PackSolver2/getComponentCollisionBoxes"

/**
 * Correct axis-aligned bounds of a PACKED component, expanded by `minGap`: the
 * union of its per-pad (or courtyard) collision boxes via
 * getComponentCollisionBoxes, which use the ALREADY-rotated emitted pad sizes.
 *
 * Use this (not getComponentBounds) wherever the bounds must match the true
 * footprint at 90/270 rotations: getComponentBounds double-applies the rotation
 * to pad sizes that setPackedComponentPadCenters already swapped, so for a
 * non-square pad at 90/270 it reports the un-rotated footprint. This helper
 * matches the collision model the packer actually enforces (getComponentCollisionBoxes).
 *
 * Requires the component's pads to have `absoluteCenter` set (i.e. run through
 * setPackedComponentPadCenters / produced by a solver).
 */
export const getComponentCollisionBounds = (
  component: PackedComponent,
  minGap = 0,
): Bounds => {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const b of getComponentCollisionBoxes(component)) {
    minX = Math.min(minX, b.center.x - b.width / 2)
    maxX = Math.max(maxX, b.center.x + b.width / 2)
    minY = Math.min(minY, b.center.y - b.height / 2)
    maxY = Math.max(maxY, b.center.y + b.height / 2)
  }
  return {
    minX: minX - minGap,
    maxX: maxX + minGap,
    minY: minY - minGap,
    maxY: maxY + minGap,
  }
}
