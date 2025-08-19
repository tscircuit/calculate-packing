import type { Point } from "@tscircuit/math-utils"
import type { GraphicsObject } from "graphics-debug"
import { BaseSolver } from "lib/solver-utils/BaseSolver"
import type { InputComponent, PackedComponent } from "lib/types"

/**
 * Given a single segment on the outline, the component's rotation, compute the
 * optimal position for the rotated component (the position that minimizes the
 * packStrategy, generally minimizing the sum of the distances to other pads in
 * the network)
 */
export class OutlineSegmentCandidatePointSolver extends BaseSolver {
  outlineSegment: [Point, Point]
  componentRotationDegrees: number
  packStrategy:
    | "minimum_sum_squared_distance_to_network"
    | "minimum_sum_distance_to_network"
  minGap: number
  packedComponents: PackedComponent[]
  componentToPack: InputComponent

  constructor(params: {
    outlineSegment: [Point, Point]
    componentRotationDegrees: number
    packStrategy:
      | "minimum_sum_squared_distance_to_network"
      | "minimum_sum_distance_to_network"
    minGap: number
    packedComponents: PackedComponent[]
    componentToPack: InputComponent
  }) {
    super()
    this.outlineSegment = params.outlineSegment
    this.componentRotationDegrees = params.componentRotationDegrees
    this.packStrategy = params.packStrategy
    this.minGap = params.minGap
    this.packedComponents = params.packedComponents
    this.componentToPack = params.componentToPack
  }

  override _step() {
    // TODO
  }

  override visualize(): GraphicsObject {
    throw new Error("Not implemented")
  }
}
