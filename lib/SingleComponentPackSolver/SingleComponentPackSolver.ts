import type { GraphicsObject } from "graphics-debug"
import { BaseSolver } from "lib/solver-utils/BaseSolver"
import type { InputComponent, PackedComponent } from "lib/types"

/**
 * Packs a single component given a set of already packed components.
 *
 * Runs subsolvers and operates in several phases:
 * Phase 1: Compute outline (visualization shows outline)
 * Phase 2: Compute candidate point for each segment by finding the optimal
 *          point on each segment of the outline for each rotation-segment pair.
 *          (visualization shows candidate point for active segment using the
 *           visualize method of the OutlineSegmentCandidatePointSolver)
 * Phase 3: Score the points. Show the points in visualization with a "step"
 *          where step=0 is the best point (lowest distance) and step=N is the
 *          worst point.
 */
export class SingleComponentPackSolver extends BaseSolver {
  componentToPack: InputComponent
  packedComponents: PackedComponent[]

  constructor(params: {
    componentToPack: InputComponent
    packedComponents: PackedComponent[]
  }) {
    super()
    this.componentToPack = params.componentToPack
    this.packedComponents = params.packedComponents
  }

  override _setup() {
    super._setup()
  }

  override _step() {
    super._step()
  }

  override visualize(): GraphicsObject {
    return super.visualize()
  }
}
