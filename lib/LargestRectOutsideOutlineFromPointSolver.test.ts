import { test, expect } from "bun:test"
import { LargestRectOutsideOutlineFromPointSolver } from "./LargestRectOutsideOutlineFromPointSolver"
import type {
  Point,
  Rect,
  GlobalBounds,
} from "./LargestRectOutsideOutlineFromPointSolver"

test("LargestRectOutsideOutlineFromPointSolver - basic rectangle outside outline", () => {
  // Create a simple rectangular outline
  const outline: Point[] = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 200 },
    { x: 100, y: 200 },
  ]

  const origin: Point = { x: 50, y: 150 } // Point outside the outline
  const globalBounds: GlobalBounds = { minX: 0, maxX: 300, minY: 0, maxY: 300 }

  const solver = new LargestRectOutsideOutlineFromPointSolver({
    fullOutline: outline,
    origin,
    globalBounds,
  })
  const result = solver.getLargestRect()

  expect(result).not.toBeNull()
  expect(result!.x).toBeLessThanOrEqual(origin.x)
  expect(result!.x + result!.w).toBeGreaterThanOrEqual(origin.x)
  expect(result!.y).toBeLessThanOrEqual(origin.y)
  expect(result!.y + result!.h).toBeGreaterThanOrEqual(origin.y)
})

test("LargestRectOutsideOutlineFromPointSolver - point inside outline returns null", () => {
  // Create a simple rectangular outline
  const outline: Point[] = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 200 },
    { x: 100, y: 200 },
  ]

  const origin: Point = { x: 150, y: 150 } // Point inside the outline
  const globalBounds: GlobalBounds = { minX: 0, maxX: 300, minY: 0, maxY: 300 }

  const solver = new LargestRectOutsideOutlineFromPointSolver({
    fullOutline: outline,
    origin,
    globalBounds,
  })
  const result = solver.getLargestRect()

  // Since the point is inside the outline, there should be no rectangle in the "outside" region
  expect(result).toBeNull()
})

test("LargestRectOutsideOutlineFromPointSolver - complex outline with notches", () => {
  // Create the "Cave Room" outline from the visualization
  const outline: Point[] = [
    { x: 20, y: 20 },
    { x: 420, y: 20 },
    { x: 420, y: 120 },
    { x: 360, y: 120 },
    { x: 360, y: 60 },
    { x: 300, y: 60 },
    { x: 300, y: 200 },
    { x: 420, y: 200 },
    { x: 420, y: 320 },
    { x: 20, y: 320 },
    { x: 20, y: 200 },
    { x: 120, y: 200 },
    { x: 120, y: 260 },
    { x: 180, y: 260 },
    { x: 180, y: 120 },
    { x: 20, y: 120 },
  ]

  const origin: Point = { x: 450, y: 170 } // Point to the right of the outline
  const globalBounds: GlobalBounds = { minX: 0, maxX: 600, minY: 0, maxY: 400 }

  const solver = new LargestRectOutsideOutlineFromPointSolver({
    fullOutline: outline,
    origin,
    globalBounds,
  })
  const result = solver.getLargestRect()

  expect(result).not.toBeNull()
  expect(result!.w).toBeGreaterThan(0)
  expect(result!.h).toBeGreaterThan(0)

  // The rectangle should contain the origin point
  expect(result!.x).toBeLessThanOrEqual(origin.x)
  expect(result!.x + result!.w).toBeGreaterThanOrEqual(origin.x)
  expect(result!.y).toBeLessThanOrEqual(origin.y)
  expect(result!.y + result!.h).toBeGreaterThanOrEqual(origin.y)
})

test("LargestRectOutsideOutlineFromPointSolver - point at global bounds edge", () => {
  const outline: Point[] = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 200 },
    { x: 100, y: 200 },
  ]

  const origin: Point = { x: 0, y: 150 } // Point at the left edge of global bounds
  const globalBounds: GlobalBounds = { minX: 0, maxX: 300, minY: 0, maxY: 300 }

  const solver = new LargestRectOutsideOutlineFromPointSolver({
    fullOutline: outline,
    origin,
    globalBounds,
  })
  const result = solver.getLargestRect()

  expect(result).not.toBeNull()
  expect(result!.x).toBe(0) // Should start at the left edge
  expect(result!.x + result!.w).toBeLessThanOrEqual(100) // Should not overlap with outline
})

test.skip("LargestRectOutsideOutlineFromPointSolver - staircase pattern", () => {
  const outline: Point[] = [
    { x: 40, y: 40 },
    { x: 420, y: 40 },
    { x: 420, y: 100 },
    { x: 360, y: 100 },
    { x: 360, y: 160 },
    { x: 300, y: 160 },
    { x: 300, y: 220 },
    { x: 240, y: 220 },
    { x: 240, y: 280 },
    { x: 40, y: 280 },
    { x: 40, y: 40 },
  ]

  const origin: Point = { x: 500, y: 180 } // Point to the right of the staircase
  const globalBounds: GlobalBounds = { minX: 0, maxX: 600, minY: 0, maxY: 400 }

  const solver = new LargestRectOutsideOutlineFromPointSolver(
    outline,
    origin,
    globalBounds,
  )
  const result = solver.getLargestRect()

  expect(result).not.toBeNull()
  expect(result!.w).toBeGreaterThan(0)
  expect(result!.h).toBeGreaterThan(0)

  // Should contain the origin
  expect(result!.x).toBeLessThanOrEqual(origin.x)
  expect(result!.x + result!.w).toBeGreaterThanOrEqual(origin.x)
  expect(result!.y).toBeLessThanOrEqual(origin.y)
  expect(result!.y + result!.h).toBeGreaterThanOrEqual(origin.y)
})
