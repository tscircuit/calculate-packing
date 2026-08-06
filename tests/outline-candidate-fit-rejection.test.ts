import { expect, spyOn, test } from "bun:test"
import { LargestRectOutsideOutlineFromPointSolver } from "../lib/LargestRectOutsideOutlineFromPointSolver"
import { OutlineSegmentCandidatePointSolver } from "../lib/OutlineSegmentCandidatePointSolver/OutlineSegmentCandidatePointSolver"
import type { InputComponent } from "../lib/types"

test("rejects an unfit outline candidate before building network targets", () => {
  const componentToPack: InputComponent = {
    componentId: "component-to-pack",
    pads: [
      {
        padId: "pad-to-pack",
        networkId: "signal",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 10, y: 10 },
      },
    ],
  }

  const solver = new OutlineSegmentCandidatePointSolver({
    outlineSegment: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ],
    ccwFullOutline: [
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      [
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
      [
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
      [
        { x: 0, y: 10 },
        { x: 0, y: 0 },
      ],
    ],
    componentRotationDegrees: 0,
    packStrategy: "minimum_sum_distance_to_network",
    minGap: 1,
    packedComponents: [],
    componentToPack,
  })

  let didBuildNetworkTargets = false
  Object.defineProperty(solver, "getNetworkTargetPointMappings", {
    value: () => {
      didBuildNetworkTargets = true
      return { offsetPadPoints: [], targetPointMap: new Map() }
    },
  })

  const getLargestRectBoundsSpy = spyOn(
    LargestRectOutsideOutlineFromPointSolver.prototype,
    "getLargestRectBounds",
  ).mockReturnValue({ minX: 0, minY: 0, maxX: 5, maxY: 5 })

  try {
    solver.setup()

    expect(solver.failed).toBe(true)
    expect(solver.error).toBe(
      "There is nowhere for the component to fit along this outline section",
    )
    expect(didBuildNetworkTargets).toBe(false)
  } finally {
    getLargestRectBoundsSpy.mockRestore()
  }
})
