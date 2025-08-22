import { test, expect } from "bun:test"
import {
  MultiOffsetIrlsSolver,
  type OffsetPadPoint,
  type Point,
} from "./MultiOffsetIrlsSolver"

test("MultiOffsetIrlsSolver - basic functionality", () => {
  const offsetPadPoints: OffsetPadPoint[] = [
    { id: "pad1", offsetX: -10, offsetY: -10 },
    { id: "pad2", offsetX: 10, offsetY: 10 },
  ]

  const targetPointMap = new Map<string, Point[]>([
    [
      "pad1",
      [
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ],
    ],
    [
      "pad2",
      [
        { x: 80, y: 80 },
        { x: 90, y: 90 },
      ],
    ],
  ])

  const solver = new MultiOffsetIrlsSolver({
    offsetPadPoints,
    targetPointMap,
    initialPosition: { x: 50, y: 50 },
    epsilon: 1e-6,
    maxIterations: 100,
  })

  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)

  const bestPosition = solver.getBestPosition()
  expect(bestPosition).toBeDefined()

  const offsetPadPositions = solver.getOffsetPadPositions()
  expect(offsetPadPositions.size).toBe(2)
  expect(offsetPadPositions.has("pad1")).toBe(true)
  expect(offsetPadPositions.has("pad2")).toBe(true)

  // The optimal position should minimize distance from offset pads to their targets
  const initialDistance = solver.getTotalDistance({ x: 50, y: 50 })
  const finalDistance = solver.getTotalDistance()
  expect(finalDistance).toBeLessThanOrEqual(initialDistance)
})

test("MultiOffsetIrlsSolver - no target points", () => {
  const offsetPadPoints: OffsetPadPoint[] = [
    { id: "pad1", offsetX: 0, offsetY: 0 },
  ]

  const targetPointMap = new Map<string, Point[]>([
    ["pad1", []], // No target points
  ])

  const solver = new MultiOffsetIrlsSolver({
    offsetPadPoints,
    targetPointMap,
    initialPosition: { x: 50, y: 50 },
  })

  solver.solve()

  expect(solver.solved).toBe(true)
  const bestPosition = solver.getBestPosition()
  expect(bestPosition.x).toBe(50) // Should remain at initial position
  expect(bestPosition.y).toBe(50)
})

test("MultiOffsetIrlsSolver - single target point", () => {
  const offsetPadPoints: OffsetPadPoint[] = [
    { id: "pad1", offsetX: 0, offsetY: 0 },
  ]

  const targetPointMap = new Map<string, Point[]>([
    ["pad1", [{ x: 100, y: 100 }]], // Single target point
  ])

  const solver = new MultiOffsetIrlsSolver({
    offsetPadPoints,
    targetPointMap,
    initialPosition: { x: 0, y: 0 },
  })

  solver.solve()

  expect(solver.solved).toBe(true)
  const bestPosition = solver.getBestPosition()

  // Should move towards the single target point (offset pad at bestPosition + offset should be at target)
  expect(bestPosition.x).toBeCloseTo(100, 3)
  expect(bestPosition.y).toBeCloseTo(100, 3)
})

test("MultiOffsetIrlsSolver - distance calculation", () => {
  const offsetPadPoints: OffsetPadPoint[] = [
    { id: "pad1", offsetX: 0, offsetY: 0 },
  ]

  const targetPointMap = new Map<string, Point[]>([
    ["pad1", [{ x: 3, y: 4 }]], // Distance should be 5 when position is at origin
  ])

  const solver = new MultiOffsetIrlsSolver({
    offsetPadPoints,
    targetPointMap,
    initialPosition: { x: 0, y: 0 },
  })

  // Before solving
  const initialDistance = solver.getTotalDistance()
  expect(initialDistance).toBe(5)

  solver.solve()

  // After solving, distance should be 0 (at the target point)
  const finalDistance = solver.getTotalDistance()
  expect(finalDistance).toBeCloseTo(0, 6)
})

test("MultiOffsetIrlsSolver - with constraint function", () => {
  const offsetPadPoints: OffsetPadPoint[] = [
    { id: "pad1", offsetX: 0, offsetY: 0 },
  ]

  const targetPointMap = new Map<string, Point[]>([
    ["pad1", [{ x: 100, y: 100 }]],
  ])

  // Constraint function keeps points on x-axis (y = 0)
  const constraintFn = (point: Point): Point => ({
    x: point.x,
    y: 0, // Force y to be 0
  })

  const solver = new MultiOffsetIrlsSolver({
    offsetPadPoints,
    targetPointMap,
    initialPosition: { x: 0, y: 0 },
    constraintFn,
  })

  solver.solve()

  const bestPosition = solver.getBestPosition()
  expect(bestPosition.y).toBe(0) // Should be constrained to y=0
  expect(bestPosition.x).toBeGreaterThan(0) // Should move towards target in x direction
})

test("MultiOffsetIrlsSolver - multiple offset pads with different targets", () => {
  const offsetPadPoints: OffsetPadPoint[] = [
    { id: "pad1", offsetX: -5, offsetY: 0 }, // Left of center
    { id: "pad2", offsetX: 5, offsetY: 0 }, // Right of center
  ]

  const targetPointMap = new Map<string, Point[]>([
    ["pad1", [{ x: 0, y: 0 }]], // Target on the left
    ["pad2", [{ x: 100, y: 0 }]], // Target on the right
  ])

  const solver = new MultiOffsetIrlsSolver({
    offsetPadPoints,
    targetPointMap,
    initialPosition: { x: 50, y: 0 },
  })

  solver.solve()

  const bestPosition = solver.getBestPosition()
  // Should find a position that balances the distances
  // pad1 wants to be at x=5 (target 0 + offset 5), pad2 wants to be at x=95 (target 100 - offset 5)
  // Optimal should be around x=50
  expect(bestPosition.x).toBeCloseTo(50, 1)
  expect(bestPosition.y).toBe(0)

  const padPositions = solver.getOffsetPadPositions()
  const pad1Pos = padPositions.get("pad1")!
  const pad2Pos = padPositions.get("pad2")!

  expect(pad1Pos.x).toBeCloseTo(bestPosition.x - 5, 3)
  expect(pad2Pos.x).toBeCloseTo(bestPosition.x + 5, 3)
})

test("MultiOffsetIrlsSolver - visualize method", () => {
  const offsetPadPoints: OffsetPadPoint[] = [
    { id: "pad1", offsetX: 0, offsetY: 0 },
    { id: "pad2", offsetX: 10, offsetY: 10 },
  ]

  const targetPointMap = new Map<string, Point[]>([
    ["pad1", [{ x: 10, y: 10 }]],
    ["pad2", [{ x: 40, y: 40 }]],
  ])

  const solver = new MultiOffsetIrlsSolver({
    offsetPadPoints,
    targetPointMap,
    initialPosition: { x: 20, y: 20 },
  })

  const graphics = solver.visualize()

  expect(graphics.points).toBeDefined()
  expect(graphics.lines).toBeDefined()
  expect(graphics.points!.length).toBeGreaterThan(0) // Should have points
  expect(graphics.lines!.length).toBeGreaterThan(0) // Should have lines
})
