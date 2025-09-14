import { test, expect } from "bun:test"
import type { Point } from "@tscircuit/math-utils"
import type { InputComponent } from "../lib/types"
import { OutlineSegmentCandidatePointSolver } from "../lib/OutlineSegmentCandidatePointSolver/OutlineSegmentCandidatePointSolver"

// Helper to create a basic outline and component
const outline: [Point, Point][] = [
  [
    { x: 0, y: 100 },
    { x: 400, y: 100 },
  ],
  [
    { x: 400, y: 100 },
    { x: 400, y: 0 },
  ],
  [
    { x: 400, y: 0 },
    { x: 0, y: 0 },
  ],
  [
    { x: 0, y: 0 },
    { x: 0, y: 100 },
  ],
]

const component: InputComponent = {
  componentId: "U1",
  pads: [
    {
      padId: "P1",
      networkId: "N1",
      type: "rect",
      offset: { x: 0, y: 0 },
      size: { x: 10, y: 10 },
    },
  ],
}

test("OutlineSegmentCandidatePointSolver respects globalBounds", () => {
  const solver = new OutlineSegmentCandidatePointSolver({
    outlineSegment: outline[0]!,
    fullOutline: outline,
    componentRotationDegrees: 0,
    packStrategy: "minimum_sum_distance_to_network",
    minGap: 1,
    packedComponents: [],
    componentToPack: component,
    globalBounds: { minX: 50, minY: 0, maxX: 150, maxY: 200 },
  })

  solver.solve()

  expect(solver.viableBounds).toBeDefined()
  expect(solver.viableBounds!.minX).toBeGreaterThanOrEqual(50)
  expect(solver.viableBounds!.maxX).toBeLessThanOrEqual(150)
})

test("OutlineSegmentCandidatePointSolver accepts bounds alias", () => {
  const solver = new OutlineSegmentCandidatePointSolver({
    outlineSegment: outline[0]!,
    fullOutline: outline,
    componentRotationDegrees: 0,
    packStrategy: "minimum_sum_distance_to_network",
    minGap: 1,
    packedComponents: [],
    componentToPack: component,
    bounds: { minX: 60, minY: 0, maxX: 160, maxY: 200 },
  })

  solver.solve()

  expect(solver.viableBounds).toBeDefined()
  expect(solver.viableBounds!.minX).toBeGreaterThanOrEqual(60)
  expect(solver.viableBounds!.maxX).toBeLessThanOrEqual(160)
})
