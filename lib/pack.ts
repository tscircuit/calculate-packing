import { PackSolver2 } from "./PackSolver2/PackSolver2"
import {
  QuadraticPackSolver,
  type QuadraticOptions,
} from "./QuadraticPackSolver/QuadraticPackSolver"
import { validatePackedLayout } from "./validatePackedLayout"
import type { PackInput, PackOutput } from "./types"

/** Greedy strategy the analytical path falls back to when it can't satisfy the
 *  constraints. Matches the strategy matchpack uses for partition packing. */
const GREEDY_FALLBACK_STRATEGY = "minimum_sum_squared_distance_to_network"

export interface PackOptions {
  /** Tuning knobs forwarded to the analytical quadratic solver. */
  quadratic?: QuadraticOptions
  /**
   * When the quadratic strategy is selected, re-validate its output (overlaps +
   * bounds/obstacles/boundaryOutline + component count) and fall back to the
   * greedy packer if it fails. Default true — this is the release safety gate.
   * Set false to get the raw quadratic result (e.g. for benchmarking).
   */
  quadraticFallback?: boolean
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
 * When `packPlacementStrategy` is "quadratic", an ADDITIVE alternative
 * analytical placer is used instead (see
 * lib/QuadraticPackSolver/QuadraticPackSolver.ts). The default strategy and
 * output are unchanged unless a caller opts in.
 */
export const pack = (
  input: PackInput,
  options: PackOptions = {},
): PackOutput => {
  if (input.packPlacementStrategy === "quadratic") {
    const solver = new QuadraticPackSolver(input, options.quadratic)
    solver.solve()
    const quadComponents = solver.packedComponents

    // Release safety gate: ship the analytic result only if it satisfies every
    // constraint, else fall back to the greedy packer (never worse than today).
    // Opt-out for isolated solver benchmarking.
    if (options.quadraticFallback === false) {
      return { ...input, components: quadComponents }
    }
    if (validatePackedLayout(quadComponents, input).ok) {
      return { ...input, components: quadComponents }
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
