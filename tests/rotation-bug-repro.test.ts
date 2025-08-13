import { describe, expect, it } from "bun:test"
import { PhasedPackSolver } from "../lib/PackSolver/PhasedPackSolver"
import type { InputComponent, PackInput } from "../lib/types"

describe("PhasedPackSolver Rotation Bug", () => {
  it("should preserve rotation information in getResult output", () => {
    // Create a test component with rotation options
    const tallCapacitor: InputComponent = {
      componentId: "C1",
      pads: [
        {
          padId: "1",
          type: "rect",
          offset: { x: 0, y: 0.3 }, // Pad at top
          size: { x: 0.1, y: 0.1 },
          networkId: "net1",
        },
        {
          padId: "2",
          type: "rect",
          offset: { x: 0, y: -0.3 }, // Pad at bottom
          size: { x: 0.1, y: 0.1 },
          networkId: "net2",
        },
      ],
      availableRotationDegrees: [0, 90, 180, 270], // All rotation options available
    }

    const packInput: PackInput = {
      components: [tallCapacitor],
      minGap: 0.1,
      packOrderStrategy: "largest_to_smallest",
      packPlacementStrategy: "shortest_connection_along_outline",
    }

    // Create and run the solver
    const solver = new PhasedPackSolver(packInput)
    solver.solve()

    // Get the result
    const result = solver.getResult()

    // Verify the result structure
    expect(result).toHaveLength(1)
    const packedComponent = result[0]!

    // Log current result to see what we're getting
    console.log("Packed component result:", {
      componentId: packedComponent.componentId,
      center: packedComponent.center,
      ccwRotationOffset: packedComponent.ccwRotationOffset,
      ccwRotationDegrees: (packedComponent as any).ccwRotationDegrees,
      hasRotationField: "ccwRotationDegrees" in packedComponent,
    })

    // The bug: ccwRotationDegrees should be present but isn't
    // This assertion should fail until the bug is fixed
    expect(packedComponent).toHaveProperty("ccwRotationDegrees")
    expect(typeof packedComponent.ccwRotationDegrees).toBe("number")

    // Should be a valid rotation (0, 90, 180, or 270)
    expect([0, 90, 180, 270]).toContain(packedComponent.ccwRotationDegrees)
  })

  it("should handle components with limited rotation options", () => {
    const component: InputComponent = {
      componentId: "R1",
      pads: [
        {
          padId: "1",
          type: "rect",
          offset: { x: -0.4, y: 0 },
          size: { x: 0.1, y: 0.1 },
          networkId: "net1",
        },
        {
          padId: "2",
          type: "rect",
          offset: { x: 0.4, y: 0 },
          size: { x: 0.1, y: 0.1 },
          networkId: "net2",
        },
      ],
      availableRotationDegrees: [0, 90], // Only 0° and 90° allowed
    }

    const packInput: PackInput = {
      components: [component],
      minGap: 0.1,
      packOrderStrategy: "largest_to_smallest",
      packPlacementStrategy: "shortest_connection_along_outline",
    }

    const solver = new PhasedPackSolver(packInput)
    solver.solve()
    const result = solver.getResult()

    expect(result).toHaveLength(1)
    const packedComponent = result[0]!

    // Should have rotation information
    expect(packedComponent).toHaveProperty("ccwRotationDegrees")
    expect([0, 90]).toContain(packedComponent.ccwRotationDegrees)
  })

  it("should default to 0 degrees for components without rotation options", () => {
    const component: InputComponent = {
      componentId: "U1",
      pads: [
        {
          padId: "1",
          type: "rect",
          offset: { x: 0, y: 0 },
          size: { x: 0.1, y: 0.1 },
          networkId: "net1",
        },
      ],
      // No availableRotationDegrees specified
    }

    const packInput: PackInput = {
      components: [component],
      minGap: 0.1,
      packOrderStrategy: "largest_to_smallest",
      packPlacementStrategy: "shortest_connection_along_outline",
    }

    const solver = new PhasedPackSolver(packInput)
    solver.solve()
    const result = solver.getResult()

    expect(result).toHaveLength(1)
    const packedComponent = result[0]!

    // Should have rotation information defaulting to 0
    expect(packedComponent).toHaveProperty("ccwRotationDegrees")
    expect(packedComponent.ccwRotationDegrees).toBe(0)
  })
})
