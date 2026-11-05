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
  const ccwFullOutline: [Point, Point][] = [
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
    ccwFullOutline,
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
})

test.skip("OutlineSegmentCandidatePointSolver - should compute viable segment correctly", () => {
  // Simple test case to verify viable segment computation
  const outlineSegment: [Point, Point] = [
    { x: 0, y: 100 },
    { x: 200, y: 100 },
  ]

  const ccwFullOutline: [Point, Point][] = [
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
    ccwFullOutline,
    componentRotationDegrees: 0,
    packStrategy: "minimum_sum_distance_to_network",
    minGap: 2,
    packedComponents: [],
    componentToPack,
  })

  solver.solve()

  expect(solver.failed).toBe(false)
  expect(solver.viableOutlineSegment).toBeDefined()
})

test("OutlineSegmentCandidatePointSolver - pushes asymmetric courtyard components out by near-edge extent", () => {
  // CCW obstacle outline: box from x=[-5, 5], y=[-5, 5]
  const ccwFullOutline: [Point, Point][] = [
    [
      { x: -5, y: -5 },
      { x: 5, y: -5 },
    ], // bottom (outward normal: 0, -1)
    [
      { x: 5, y: -5 },
      { x: 5, y: 5 },
    ], // right (outward normal: +1, 0)
    [
      { x: 5, y: 5 },
      { x: -5, y: 5 },
    ], // top (outward normal: 0, +1)
    [
      { x: -5, y: 5 },
      { x: -5, y: -5 },
    ], // left (outward normal: -1, 0)
  ]

  // Component whose courtyard extends 8mm in -x and only 2mm in +x (offsetFromCenter.x = -3, width = 10)
  // and 7mm in -y and 1mm in +y (offsetFromCenter.y = -3, height = 8)
  const componentToPack: InputComponent = {
    componentId: "U2",
    pads: [
      {
        padId: "U2.1",
        networkId: "NET1",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 2, y: 2 },
      },
    ],
    courtyard: {
      offsetFromCenter: { x: -3, y: -3 },
      width: 10,
      height: 8,
    },
  }

  const packedComponents: PackedComponent[] = [
    {
      componentId: "U1",
      center: { x: 0, y: 0 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "U1.1",
          networkId: "NET1",
          type: "rect",
          offset: { x: 0, y: 0 },
          size: { x: 2, y: 2 },
          absoluteCenter: { x: 0, y: 0 },
        },
      ],
      courtyard: {
        offsetFromCenter: { x: 0, y: 0 },
        width: 10,
        height: 10,
      },
    },
  ]

  // 1) Right edge (x = 5, outward normal +x):
  // Near edge is localMinX = -3 - 5 = -8, so center.x must be 5 - (-8) = 13
  // (previously bounds.maxX = 5 + 2 = 7, which placed courtyard minX at -1 inside the obstacle!)
  const rightSolver = new OutlineSegmentCandidatePointSolver({
    outlineSegment: ccwFullOutline[1]!,
    ccwFullOutline,
    componentRotationDegrees: 0,
    packStrategy: "minimum_sum_distance_to_network",
    minGap: 0,
    packedComponents,
    componentToPack,
  })
  rightSolver.solve()
  expect(rightSolver.failed).toBe(false)
  expect(rightSolver.optimalPosition?.x).toBeCloseTo(13, 5)

  // 2) Top edge (y = 5, outward normal +y):
  // Near edge is localMinY = -3 - 4 = -7, so center.y must be 5 - (-7) = 12
  const topSolver = new OutlineSegmentCandidatePointSolver({
    outlineSegment: ccwFullOutline[2]!,
    ccwFullOutline,
    componentRotationDegrees: 0,
    packStrategy: "minimum_sum_distance_to_network",
    minGap: 0,
    packedComponents,
    componentToPack,
  })
  topSolver.solve()
  expect(topSolver.failed).toBe(false)
  expect(topSolver.optimalPosition?.y).toBeCloseTo(12, 5)

  // 3) Left edge (x = -5, outward normal -x):
  // Near edge is localMaxX = -3 + 5 = 2, so center.x must be -5 - 2 = -7
  // (previously bounds.minX = -5 - 8 = -13, leaving a 6mm gap!)
  const leftSolver = new OutlineSegmentCandidatePointSolver({
    outlineSegment: ccwFullOutline[3]!,
    ccwFullOutline,
    componentRotationDegrees: 0,
    packStrategy: "minimum_sum_distance_to_network",
    minGap: 0,
    packedComponents,
    componentToPack,
  })
  leftSolver.solve()
  expect(leftSolver.failed).toBe(false)
  expect(leftSolver.optimalPosition?.x).toBeCloseTo(-7, 5)

  // 4) Bottom edge (y = -5, outward normal -y):
  // Near edge is localMaxY = -3 + 4 = 1, so center.y must be -5 - 1 = -6
  const bottomSolver = new OutlineSegmentCandidatePointSolver({
    outlineSegment: ccwFullOutline[0]!,
    ccwFullOutline,
    componentRotationDegrees: 0,
    packStrategy: "minimum_sum_distance_to_network",
    minGap: 0,
    packedComponents,
    componentToPack,
  })
  bottomSolver.solve()
  expect(bottomSolver.failed).toBe(false)
  expect(bottomSolver.optimalPosition?.y).toBeCloseTo(-6, 5)
})
