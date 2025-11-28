import { expect, test } from "bun:test"
import {
  constructOutlinesFromPackedComponents,
  constructSemanticOutlinesFromPackedComponents,
} from "./constructOutlinesFromPackedComponents"
import type { PackedComponent } from "./types"

// Helper to calculate signed area
function signedArea(outline: Array<[{ x: number; y: number }, { x: number; y: number }]>): number {
  // Extract points from segments
  const points = outline.map(([p1]) => p1)
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

test("constructOutlinesFromPackedComponents returns CCW outline for single obstacle", () => {
  // Create a simple packed component with a pad smaller than the component bounds
  // The component is at (10,10) with a 4x4 pad, so bounds will be [8,8] to [12,12]
  // We need to make sure there's free space around the pad
  const component: PackedComponent = {
    componentId: "test",
    center: { x: 10, y: 10 },
    ccwRotationOffset: 0,
    pads: [
      {
        padId: "pad1",
        networkId: "net1",
        type: "rect" as const,
        offset: { x: 0, y: 0 },
        size: { x: 4, y: 4 },
        absoluteCenter: { x: 10, y: 10 },
      },
    ],
  }

  // Use minGap=1 to inflate the bounding box and create free space
  const outlines = constructOutlinesFromPackedComponents([component], { minGap: 1 })

  console.log("\nconstructOutlinesFromPackedComponents result:")
  console.log("  Number of outlines:", outlines.length)

  for (const outline of outlines) {
    const area = signedArea(outline)
    console.log(`  Outline: ${outline.length} segments, area=${area.toFixed(2)}, winding=${area > 0 ? "CCW" : "CW"}`)
  }

  // Should return 1 CCW outline (positive signed area) - the outer boundary of the obstacle island
  expect(outlines.length).toBe(1)
  expect(signedArea(outlines[0]!)).toBeGreaterThan(0) // CCW outer boundary
})

test("constructSemanticOutlinesFromPackedComponents returns obstacleContainingLoops for interior pads", () => {
  // Create a component with pads that are INSIDE the bounding box (not at edges)
  // We need a large outer boundary and small pads well inside it
  const component: PackedComponent = {
    componentId: "test",
    center: { x: 50, y: 50 },
    ccwRotationOffset: 0,
    pads: [
      // Corner pads to define a large bounding box
      {
        padId: "corner1",
        networkId: "net1",
        type: "rect" as const,
        offset: { x: -45, y: -45 },
        size: { x: 2, y: 2 },
        absoluteCenter: { x: 5, y: 5 },
      },
      {
        padId: "corner2",
        networkId: "net2",
        type: "rect" as const,
        offset: { x: 45, y: 45 },
        size: { x: 2, y: 2 },
        absoluteCenter: { x: 95, y: 95 },
      },
      // Interior pad that should create a hole
      {
        padId: "interior",
        networkId: "net3",
        type: "rect" as const,
        offset: { x: 0, y: 0 },
        size: { x: 10, y: 10 },
        absoluteCenter: { x: 50, y: 50 },
      },
    ],
  }

  const result = constructSemanticOutlinesFromPackedComponents([component], { minGap: 1 })

  console.log("\nconstructSemanticOutlinesFromPackedComponents with interior pad:")
  console.log("  obstacleFreeLoops:", result.obstacleFreeLoops.length)
  console.log("  obstacleContainingLoops:", result.obstacleContainingLoops.length)

  for (const outline of result.obstacleFreeLoops) {
    const area = signedArea(outline)
    console.log(`  obstacleFreeLoop: ${outline.length} segments, area=${area.toFixed(2)}`)
  }
  for (const outline of result.obstacleContainingLoops) {
    const area = signedArea(outline)
    console.log(`  obstacleContainingLoop: ${outline.length} segments, area=${area.toFixed(2)}`)
  }

  // Should have 1 obstacleFreeLoop (outer boundary with corner notches, CCW)
  expect(result.obstacleFreeLoops.length).toBe(1)

  // Should have 1 obstacleContainingLoop (around the interior pad, CW)
  expect(result.obstacleContainingLoops.length).toBe(1)

  // obstacleFreeLoop should be CCW (positive area)
  expect(signedArea(result.obstacleFreeLoops[0]!)).toBeGreaterThan(0)

  // obstacleContainingLoop should be CW (negative area)
  expect(signedArea(result.obstacleContainingLoops[0]!)).toBeLessThan(0)
})

test("constructOutlinesFromPackedComponents preserves winding directions", () => {
  // Create a scenario with interior pads that create holes in the obstacle union
  const component: PackedComponent = {
    componentId: "test",
    center: { x: 50, y: 50 },
    ccwRotationOffset: 0,
    pads: [
      // Corner pads to define a large bounding box
      {
        padId: "corner1",
        networkId: "net1",
        type: "rect" as const,
        offset: { x: -45, y: -45 },
        size: { x: 2, y: 2 },
        absoluteCenter: { x: 5, y: 5 },
      },
      {
        padId: "corner2",
        networkId: "net2",
        type: "rect" as const,
        offset: { x: 45, y: 45 },
        size: { x: 2, y: 2 },
        absoluteCenter: { x: 95, y: 95 },
      },
      // Interior pad that should create a hole in the obstacles
      {
        padId: "interior",
        networkId: "net3",
        type: "rect" as const,
        offset: { x: 0, y: 0 },
        size: { x: 10, y: 10 },
        absoluteCenter: { x: 50, y: 50 },
      },
    ],
  }

  const outlines = constructOutlinesFromPackedComponents([component], { minGap: 1 })

  console.log("\nconstructOutlinesFromPackedComponents with interior pad:")
  console.log("  Number of outlines:", outlines.length)

  for (const outline of outlines) {
    const area = signedArea(outline)
    console.log(`  Outline: ${outline.length} segments, area=${area.toFixed(2)}, winding=${area > 0 ? "CCW" : "CW"}`)
  }

  // Should return multiple outlines (corner pads create 2 outer boundaries, interior creates 1 inner)
  expect(outlines.length).toBeGreaterThan(1)

  // Outlines preserve their original winding:
  // - CCW (positive area) = outer boundaries of obstacle islands
  // - CW (negative area) = holes within obstacles (free space pockets)
  // For this test case (isolated pads), all outlines are CCW outer boundaries
  for (const outline of outlines) {
    const area = signedArea(outline)
    // All these pads are separate islands, so all should be CCW outer boundaries
    expect(area).toBeGreaterThan(0)
  }
})
