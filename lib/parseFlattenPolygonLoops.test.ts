import { test, expect } from "bun:test"
import Flatten from "@flatten-js/core"
import { parseFlattenPolygonLoops, type ParsedOutlineLoops } from "./parseFlattenPolygonLoops"

/**
 * This test file verifies our understanding of flatten-js polygon conventions:
 *
 * ACTUAL FLATTEN-JS CONVENTION (verified by tests):
 * - Positive polygons (outer boundary) are stored CCW (positive signed area)
 * - Negative polygons (holes/subtracted areas) are stored CW (negative signed area)
 *
 * Note: face.isHole is NOT reliable (always undefined in our tests)
 * We must use signed area to determine orientation.
 *
 * Semantic mapping for our use case:
 * - CCW loops (positive area) = "obstacleFreeLoop" - boundary of free space
 * - CW loops (negative area) = "obstacleContainingLoop" - boundary around obstacles
 *
 * In context of constructOutlinesFromPackedComponents:
 * - We subtract pads/obstacles from a bounding box
 * - The outer boundary (CCW) is the bounding box edge = free space boundary
 * - The inner faces (CW) are around the subtracted obstacles = obstacle boundaries
 */

// Helper to calculate signed area (positive = CCW, negative = CW)
function signedArea(points: { x: number; y: number }[]): number {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    const pi = points[i]!
    const pj = points[j]!
    area += pi.x * pj.y
    area -= pj.x * pi.y
  }
  return area / 2
}

// Extract points from a flatten-js face
function extractFacePoints(face: any): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  let edge = face.first
  if (!edge) return points

  do {
    const shp = edge.shape
    const ps = shp.start ?? shp.ps
    points.push({ x: ps.x, y: ps.y })
    edge = edge.next
  } while (edge !== face.first)

  return points
}

test("flatten-js: simple rectangle has CCW outer face (positive area)", () => {
  // Create a simple rectangle (10x10)
  const rect = new Flatten.Polygon([
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ])

  const faces = Array.from((rect as any).faces) as any[]
  expect(faces.length).toBe(1)

  const points = extractFacePoints(faces[0])
  const area = signedArea(points)

  // Flatten-js stores outer boundaries with positive signed area (CCW)
  console.log("Simple rectangle:")
  console.log("  Points:", JSON.stringify(points))
  console.log("  Signed area:", area)

  // Verify orientation: CCW = positive signed area
  expect(area).toBeGreaterThan(0)
})

test("flatten-js: rectangle with subtracted inner - outer is CCW, inner boundary is CW", () => {
  // Create a 20x20 rectangle
  const outer = new Flatten.Polygon([
    [0, 0],
    [20, 0],
    [20, 20],
    [0, 20],
  ])

  // Create a 5x5 inner rectangle to subtract (centered at 10,10)
  const inner = new Flatten.Polygon([
    [7.5, 7.5],
    [12.5, 7.5],
    [12.5, 12.5],
    [7.5, 12.5],
  ])

  // Subtract inner from outer to create a donut shape
  const result = Flatten.BooleanOperations.subtract(outer, inner)

  const faces = Array.from((result as any).faces) as any[]

  console.log("\nRectangle with subtracted center:")
  console.log("  Number of faces:", faces.length)

  for (let i = 0; i < faces.length; i++) {
    const points = extractFacePoints(faces[i])
    const area = signedArea(points)
    console.log(`  Face ${i}: area=${area}, orientation=${area < 0 ? "CW" : "CCW"}`)
  }

  // We expect 2 faces
  expect(faces.length).toBe(2)

  // Classify by signed area
  const ccwFaces = faces.filter((f) => signedArea(extractFacePoints(f)) > 0)
  const cwFaces = faces.filter((f) => signedArea(extractFacePoints(f)) < 0)

  // One CCW (outer boundary = free space outer edge)
  // One CW (inner boundary = around the subtracted obstacle)
  expect(ccwFaces.length).toBe(1)
  expect(cwFaces.length).toBe(1)

  // The CCW face is the outer boundary (larger area magnitude)
  const ccwArea = Math.abs(signedArea(extractFacePoints(ccwFaces[0])))
  const cwArea = Math.abs(signedArea(extractFacePoints(cwFaces[0])))
  expect(ccwArea).toBeGreaterThan(cwArea)
})

test("flatten-js: union of two rectangles has single CCW face", () => {
  // Create two overlapping rectangles
  const rect1 = new Flatten.Polygon([
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ])

  const rect2 = new Flatten.Polygon([
    [5, 5],
    [15, 5],
    [15, 15],
    [5, 15],
  ])

  const result = Flatten.BooleanOperations.unify(rect1, rect2)

  const faces = Array.from((result as any).faces) as any[]

  console.log("\nUnion of two rectangles:")
  console.log("  Number of faces:", faces.length)

  for (let i = 0; i < faces.length; i++) {
    const points = extractFacePoints(faces[i])
    const area = signedArea(points)
    console.log(`  Face ${i}: area=${area}, orientation=${area < 0 ? "CW" : "CCW"}`)
  }

  // Union should produce a single outer face (CCW)
  expect(faces.length).toBe(1)

  const points = extractFacePoints(faces[0])
  expect(signedArea(points)).toBeGreaterThan(0) // CCW = positive
})

test("flatten-js: rectangle with two subtracted areas - 1 CCW outer, 2 CW inners", () => {
  // Create a large rectangle
  const outer = new Flatten.Polygon([
    [0, 0],
    [30, 0],
    [30, 30],
    [0, 30],
  ])

  // Create two small inner rectangles to subtract
  const inner1 = new Flatten.Polygon([
    [5, 5],
    [10, 5],
    [10, 10],
    [5, 10],
  ])

  const inner2 = new Flatten.Polygon([
    [20, 20],
    [25, 20],
    [25, 25],
    [20, 25],
  ])

  // Subtract both
  let result = Flatten.BooleanOperations.subtract(outer, inner1)
  result = Flatten.BooleanOperations.subtract(result, inner2)

  const faces = Array.from((result as any).faces) as any[]

  console.log("\nRectangle with two subtracted areas:")
  console.log("  Number of faces:", faces.length)

  // Classify by signed area (not by isHole which is unreliable)
  const ccwFaces = faces.filter((f) => signedArea(extractFacePoints(f)) > 0)
  const cwFaces = faces.filter((f) => signedArea(extractFacePoints(f)) < 0)

  console.log("  CCW faces (positive area):", ccwFaces.length)
  console.log("  CW faces (negative area):", cwFaces.length)

  for (const face of faces) {
    const points = extractFacePoints(face)
    const area = signedArea(points)
    console.log(`  Face: area=${area.toFixed(2)}, orientation=${area < 0 ? "CW" : "CCW"}`)
  }

  // Should have 1 CCW (outer boundary) and 2 CW (inner obstacle boundaries)
  expect(ccwFaces.length).toBe(1)
  expect(cwFaces.length).toBe(2)

  // The CCW face should have the largest absolute area (outer boundary)
  const ccwArea = Math.abs(signedArea(extractFacePoints(ccwFaces[0])))
  for (const cwFace of cwFaces) {
    const cwArea = Math.abs(signedArea(extractFacePoints(cwFace)))
    expect(ccwArea).toBeGreaterThan(cwArea)
  }
})

// ============================================================================
// Tests for parseFlattenPolygonLoops function
// ============================================================================

test("parseFlattenPolygonLoops: simple rectangle returns one obstacleFreeLoop", () => {
  const rect = new Flatten.Polygon([
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ])

  const result = parseFlattenPolygonLoops(rect)

  console.log("\nparseFlattenPolygonLoops - simple rectangle:")
  console.log("  obstacleFreeLoops:", result.obstacleFreeLoops.length)
  console.log("  obstacleContainingLoops:", result.obstacleContainingLoops.length)

  expect(result.obstacleFreeLoops.length).toBe(1)
  expect(result.obstacleContainingLoops.length).toBe(0)

  // The loop should have 4 points (rectangle corners)
  expect(result.obstacleFreeLoops[0]!.length).toBe(4)
})

test("parseFlattenPolygonLoops: rectangle with hole returns both loop types", () => {
  const outer = new Flatten.Polygon([
    [0, 0],
    [20, 0],
    [20, 20],
    [0, 20],
  ])

  const inner = new Flatten.Polygon([
    [7.5, 7.5],
    [12.5, 7.5],
    [12.5, 12.5],
    [7.5, 12.5],
  ])

  const polygon = Flatten.BooleanOperations.subtract(outer, inner)

  const result = parseFlattenPolygonLoops(polygon)

  console.log("\nparseFlattenPolygonLoops - rectangle with hole:")
  console.log("  obstacleFreeLoops:", result.obstacleFreeLoops.length)
  console.log("  obstacleContainingLoops:", result.obstacleContainingLoops.length)

  // 1 outer boundary (CCW) = obstacleFreeLoop
  // 1 inner boundary around hole (CW) = obstacleContainingLoop
  expect(result.obstacleFreeLoops.length).toBe(1)
  expect(result.obstacleContainingLoops.length).toBe(1)

  // Outer boundary (obstacleFreeLoop) should have 4 points
  expect(result.obstacleFreeLoops[0]!.length).toBe(4)
  // Inner boundary (obstacleContainingLoop) should have 4 points
  expect(result.obstacleContainingLoops[0]!.length).toBe(4)
})

test("parseFlattenPolygonLoops: rectangle with two holes", () => {
  const outer = new Flatten.Polygon([
    [0, 0],
    [30, 0],
    [30, 30],
    [0, 30],
  ])

  const inner1 = new Flatten.Polygon([
    [5, 5],
    [10, 5],
    [10, 10],
    [5, 10],
  ])

  const inner2 = new Flatten.Polygon([
    [20, 20],
    [25, 20],
    [25, 25],
    [20, 25],
  ])

  let polygon = Flatten.BooleanOperations.subtract(outer, inner1)
  polygon = Flatten.BooleanOperations.subtract(polygon, inner2)

  const result = parseFlattenPolygonLoops(polygon)

  console.log("\nparseFlattenPolygonLoops - rectangle with two holes:")
  console.log("  obstacleFreeLoops:", result.obstacleFreeLoops.length)
  console.log("  obstacleContainingLoops:", result.obstacleContainingLoops.length)

  expect(result.obstacleFreeLoops.length).toBe(1)
  expect(result.obstacleContainingLoops.length).toBe(2)
})

test("parseFlattenPolygonLoops: loops have correct point order for semantic meaning", () => {
  // This test verifies that:
  // - obstacleFreeLoops are stored CCW (positive signed area when calculated)
  // - obstacleContainingLoops are stored CW (negative signed area when calculated)

  const outer = new Flatten.Polygon([
    [0, 0],
    [20, 0],
    [20, 20],
    [0, 20],
  ])

  const inner = new Flatten.Polygon([
    [5, 5],
    [15, 5],
    [15, 15],
    [5, 15],
  ])

  const polygon = Flatten.BooleanOperations.subtract(outer, inner)
  const result = parseFlattenPolygonLoops(polygon)

  // Verify obstacleFreeLoop is CCW (positive signed area)
  const freeLoopArea = signedArea(result.obstacleFreeLoops[0]!)
  console.log("\nLoop orientations:")
  console.log("  obstacleFreeLoop signed area:", freeLoopArea)
  expect(freeLoopArea).toBeGreaterThan(0)

  // Verify obstacleContainingLoop is CW (negative signed area)
  const obstacleLoopArea = signedArea(result.obstacleContainingLoops[0]!)
  console.log("  obstacleContainingLoop signed area:", obstacleLoopArea)
  expect(obstacleLoopArea).toBeLessThan(0)
})
