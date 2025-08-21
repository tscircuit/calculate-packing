import { test, expect } from "bun:test"
import { PackSolver2 } from "./PackSolver2"
import type { PackInput } from "../types"

test("PackSolver2 uses SingleComponentPackSolver output correctly", () => {
  const packInput: PackInput = {
    components: [
      {
        componentId: "comp1",
        pads: [
          {
            padId: "pad1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
            networkId: "net1",
          },
        ],
        availableRotationDegrees: [0],
      },
      {
        componentId: "comp2",
        pads: [
          {
            padId: "pad2",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
            networkId: "net1", // Same network to test connection-based placement
          },
        ],
        availableRotationDegrees: [0],
      },
    ],
    minGap: 0.1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_distance_to_network",
  }

  const solver = new PackSolver2(packInput)
  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.packedComponents).toHaveLength(2)

  // First component should be at origin
  const firstComponent = solver.packedComponents[0]!
  expect(firstComponent.componentId).toBe("comp1")
  expect(firstComponent.center).toEqual({ x: 0, y: 0 })

  // Second component should be positioned by SingleComponentPackSolver
  const secondComponent = solver.packedComponents[1]!
  expect(secondComponent.componentId).toBe("comp2")

  // The center should not be at (0,0) since SingleComponentPackSolver should place it properly
  // This verifies that we're actually using the solver's output
  expect(secondComponent.center.x !== 0 || secondComponent.center.y !== 0).toBe(
    true,
  )

  // Pads should have proper absolute centers
  expect(secondComponent.pads[0]!.absoluteCenter).toBeDefined()
  expect(
    typeof secondComponent.pads[0]!.absoluteCenter.x === "number" &&
      typeof secondComponent.pads[0]!.absoluteCenter.y === "number",
  ).toBe(true)
})

test("PackSolver2 handles empty component list", () => {
  const packInput: PackInput = {
    components: [],
    minGap: 0.1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_distance_to_network",
  }

  const solver = new PackSolver2(packInput)
  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.packedComponents).toHaveLength(0)
})

test("PackSolver2 visualization works", () => {
  const packInput: PackInput = {
    components: [
      {
        componentId: "comp1",
        pads: [
          {
            padId: "pad1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
            networkId: "net1",
          },
        ],
        availableRotationDegrees: [0],
      },
    ],
    minGap: 0.1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_distance_to_network",
  }

  const solver = new PackSolver2(packInput)

  // Test visualization during setup
  solver.setup()
  const setupViz = solver.visualize()
  expect(setupViz).toBeDefined()

  // Test visualization during stepping
  solver.step() // Should create activeSubSolver
  if (solver.activeSubSolver) {
    const stepViz = solver.visualize()
    expect(stepViz).toBeDefined()
    // Should return the sub-solver's visualization
    expect(stepViz).toEqual(solver.activeSubSolver.visualize())
  }

  // Complete solving
  solver.solve()
  expect(solver.solved).toBe(true)

  const finalViz = solver.visualize()
  expect(finalViz).toBeDefined()
})
