import { test, expect } from "bun:test"
import { OutlineSegmentCandidatePointSolver } from "./OutlineSegmentCandidatePointSolver/OutlineSegmentCandidatePointSolver"
import type { InputComponent, PackedComponent } from "./types"
import type { Point } from "@tscircuit/math-utils"

test.skip("OutlineSegmentCandidatePointSolver - should not place component at (0,0)", () => {
  // Define a simple example scenario matching the page
  const outlineSegment: [Point, Point] = [
    { x: 100, y: 200 },
    { x: 500, y: 200 },
  ]

  // Define the full outline containing the segment
  const fullOutline: [Point, Point][] = [
    [
      { x: 100, y: 200 },
      { x: 500, y: 200 },
    ], // bottom edge (our segment)
    [
      { x: 500, y: 200 },
      { x: 500, y: 50 },
    ], // right edge
    [
      { x: 500, y: 50 },
      { x: 100, y: 50 },
    ], // top edge
    [
      { x: 100, y: 50 },
      { x: 100, y: 200 },
    ], // left edge
  ]

  const componentToPack: InputComponent = {
    componentId: "U2",
    pads: [
      {
        padId: "U2.1",
        networkId: "VCC",
        type: "rect",
        offset: { x: -10, y: 0 },
        size: { x: 4, y: 4 },
      },
      {
        padId: "U2.2",
        networkId: "GND",
        type: "rect",
        offset: { x: 10, y: 0 },
        size: { x: 4, y: 4 },
      },
      {
        padId: "U2_body",
        networkId: "U2-disconnected-body",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 25, y: 15 },
      },
    ],
  }

  const packedComponents: PackedComponent[] = [
    {
      componentId: "U1",
      center: { x: 150, y: 100 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "U1.1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -5, y: 0 },
          size: { x: 4, y: 4 },
          absoluteCenter: { x: 145, y: 100 },
        },
        {
          padId: "U1.2",
          networkId: "GND",
          type: "rect",
          offset: { x: 5, y: 0 },
          size: { x: 4, y: 4 },
          absoluteCenter: { x: 155, y: 100 },
        },
      ],
    },
    {
      componentId: "C1",
      center: { x: 400, y: 150 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "C1.1",
          networkId: "VCC",
          type: "rect",
          offset: { x: 0, y: -8 },
          size: { x: 4, y: 4 },
          absoluteCenter: { x: 400, y: 142 },
        },
        {
          padId: "C1.2",
          networkId: "GND",
          type: "rect",
          offset: { x: 0, y: 8 },
          size: { x: 4, y: 4 },
          absoluteCenter: { x: 400, y: 158 },
        },
      ],
    },
  ]

  const solver = new OutlineSegmentCandidatePointSolver({
    outlineSegment,
    fullOutline,
    componentRotationDegrees: 0,
    packStrategy: "minimum_sum_distance_to_network",
    minGap: 1,
    packedComponents,
    componentToPack,
  })

  // Solve completely
  solver.solve()

  // Check that solver didn't fail
  if (solver.failed) {
    console.log("Solver failed with error:", solver.error)
  }

  expect(solver.failed).toBe(false)
  expect(solver.solved).toBe(true)

  // Check that optimal position is not at origin
  const optimalPosition = solver.optimalPosition
  expect(optimalPosition).toBeDefined()

  if (optimalPosition) {
    // The position should not be at (0,0)
    const isAtOrigin =
      Math.abs(optimalPosition.x) < 0.001 && Math.abs(optimalPosition.y) < 0.001
    expect(isAtOrigin).toBe(false)

    // The position should be positioned outside the outline segment (y=200)
    // with component properly placed considering the minGap
    // For a component with half-height 7.5 and minGap 1, center should be at ~208.5
    expect(optimalPosition.y).toBeCloseTo(208.5, 1)

    // The x position should be within the segment bounds
    expect(optimalPosition.x).toBeGreaterThanOrEqual(100)
    expect(optimalPosition.x).toBeLessThanOrEqual(500)
  }

  // Check that viable outline segment was computed
  expect(solver.viableOutlineSegment).toBeDefined()
  expect(solver.largestRectOutside).toBeDefined()
})

test.skip("OutlineSegmentCandidatePointSolver - should compute viable segment correctly", () => {
  // Simple test case to verify viable segment computation
  const outlineSegment: [Point, Point] = [
    { x: 0, y: 100 },
    { x: 200, y: 100 },
  ]

  const fullOutline: [Point, Point][] = [
    [
      { x: 0, y: 100 },
      { x: 200, y: 100 },
    ], // bottom
    [
      { x: 200, y: 100 },
      { x: 200, y: 0 },
    ], // right
    [
      { x: 200, y: 0 },
      { x: 0, y: 0 },
    ], // top
    [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
    ], // left
  ]

  const componentToPack: InputComponent = {
    componentId: "U1",
    pads: [
      {
        padId: "U1.1",
        networkId: "VCC",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 10, y: 10 },
      },
    ],
  }

  const solver = new OutlineSegmentCandidatePointSolver({
    outlineSegment,
    fullOutline,
    componentRotationDegrees: 0,
    packStrategy: "minimum_sum_distance_to_network",
    minGap: 2,
    packedComponents: [],
    componentToPack,
  })

  solver.solve()

  expect(solver.failed).toBe(false)
  expect(solver.viableOutlineSegment).toBeDefined()
  expect(solver.largestRectOutside).toBeDefined()
})
