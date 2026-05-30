import { PackSolver2 } from "./PackSolver2/PackSolver2"
import {
  ForceDirectedPackSolver,
  type ForceDirectedOptions,
} from "./ForceDirectedPackSolver/ForceDirectedPackSolver"
import { validatePackedLayout } from "./validatePackedLayout"
import type { PackInput, PackOutput } from "./types"

const DEFAULT_PACK_DIRECTION_FALLBACK = "right"

/** Greedy strategy the force-directed path falls back to when it can't satisfy
 *  the constraints. Matches the strategy matchpack uses for partition packing. */
const GREEDY_FALLBACK_STRATEGY = "minimum_sum_squared_distance_to_network"

export interface PackOptions {
  /** Tuning knobs forwarded to the force-directed solver (spike). */
  forceDirected?: ForceDirectedOptions
  /**
   * When the force-directed strategy is selected, re-validate its output
   * (overlaps + bounds/obstacles/boundaryOutline + component count) and fall
   * back to the greedy packer if it fails. Default true — this is the release
   * safety gate. Set false to get the raw force-directed result (e.g. for
   * benchmarking the solver in isolation).
   */
  forceDirectedFallback?: boolean
}

/**
 * The pack algorithm performs the following steps:
 * 1. Sort the components using the packOrderStrategy
 * 2. Select the next component to pack
 * 3. If the first component, pack at center (0,0) and go to step 2
 * 4. Compute the outline of all packed components with a gap of minGap + max(pad.width, pad.height)/2
 * 5. Find the point along the outline that minimizes the distance of the pad
 *    centers within a networkId. If no shared pads, pack to the defaultPackDirection
 * 6. Add the component at the selected point, with it's pad at the position
 *    minimizing the distance between the pad centers
 * 7. To determine the component rotation, find the minimum distance between pad
 *    centers for the remaining pads at each possible rotation (making sure that
 *    we never pack such that two pads overlap)
 * 8. Go to step 2 until all components are packed
 *
 * When `packPlacementStrategy` is "force_directed", an ADDITIVE alternative
 * analytical / force-directed solver is used instead (see
 * lib/ForceDirectedPackSolver/ForceDirectedPackSolver.ts).
 */
export const pack = (
  input: PackInput,
  options: PackOptions = {},
): PackOutput => {
  if (input.packPlacementStrategy === "force_directed") {
    const solver = new ForceDirectedPackSolver(input, options.forceDirected)
    solver.solve()
    const fdComponents = solver.packedComponents

    // Release safety gate: if FD couldn't satisfy the constraints (e.g. a region
    // below its no-rotation packing limit leaves residual overlaps), fall back
    // to the greedy packer, which honours all constraints. Opt-out for isolated
    // solver benchmarking.
    if (options.forceDirectedFallback === false) {
      return { ...input, components: fdComponents }
    }
    if (validatePackedLayout(fdComponents, input).ok) {
      return { ...input, components: fdComponents }
    }
    const greedyFallback = new PackSolver2({
      ...input,
      packPlacementStrategy: GREEDY_FALLBACK_STRATEGY,
    })
    greedyFallback.solve()
    return { ...input, components: greedyFallback.packedComponents }
  }

  const solver = new PackSolver2(input)
  solver.solve()
  return {
    ...input,
    components: solver.packedComponents,
  }
}
