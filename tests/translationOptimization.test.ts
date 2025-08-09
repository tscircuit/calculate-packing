import { describe, it, expect } from "bun:test"
import type { PackedComponent, InputComponent } from "../lib/types"
import { PackSolver } from "../lib/PackSolver/PackSolver"

describe("Translation Optimization", () => {
  it("should optimize translation to minimize sum distance", () => {
    // Create a simple test case with two components
    const components: InputComponent[] = [
      {
        componentId: "U1",
        pads: [
          {
            padId: "U1_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "U2", 
        pads: [
          {
            padId: "U2_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
    ]

    // Test with minimum_sum_distance_to_network strategy
    const solver = new PackSolver({
      components,
      minGap: 2,
      packOrderStrategy: "largest_to_smallest",
      packPlacementStrategy: "minimum_sum_distance_to_network",
      disconnectedPackDirection: "right",
    })

    // Solve the packing
    solver.solve()
    const result = solver.getResult()

    expect(result).toHaveLength(2)
    
    // Check that components are positioned
    expect(result[0].center).toBeDefined()
    expect(result[1].center).toBeDefined()
    
    // Calculate the distance between the VCC pads
    const u1VccPad = result[0].pads.find(p => p.networkId === "VCC")
    const u2VccPad = result[1].pads.find(p => p.networkId === "VCC")
    
    expect(u1VccPad).toBeDefined()
    expect(u2VccPad).toBeDefined()
    
    const distance = Math.hypot(
      u1VccPad!.absoluteCenter.x - u2VccPad!.absoluteCenter.x,
      u1VccPad!.absoluteCenter.y - u2VccPad!.absoluteCenter.y
    )
    
    // With optimization, the distance should be minimized while respecting minGap
    // The minimum possible distance should be around minGap + component sizes
    expect(distance).toBeGreaterThan(2) // Should respect minGap
    expect(distance).toBeLessThan(10) // Should be reasonably close
  })

  it("should handle translation bounds correctly", () => {
    // Create a more complex scenario with 3 components to test bounds
    const components: InputComponent[] = [
      {
        componentId: "U1",
        pads: [
          {
            padId: "U1_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: -2, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "U2",
        pads: [
          {
            padId: "U2_P1", 
            networkId: "VCC",
            type: "rect",
            offset: { x: 2, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "U3",
        pads: [
          {
            padId: "U3_P1",
            networkId: "VCC", 
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
    ]

    const solver = new PackSolver({
      components,
      minGap: 2,
      packOrderStrategy: "largest_to_smallest", 
      packPlacementStrategy: "minimum_sum_distance_to_network",
      disconnectedPackDirection: "right",
    })

    solver.solve()
    const result = solver.getResult()

    expect(result).toHaveLength(3)

    // Verify no overlaps
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dist = Math.hypot(
          result[i].center.x - result[j].center.x,
          result[i].center.y - result[j].center.y
        )
        expect(dist).toBeGreaterThan(2) // Should respect minGap
      }
    }
  })

  it("should compare optimization vs non-optimization", () => {
    const components: InputComponent[] = [
      {
        componentId: "U1",
        pads: [
          {
            padId: "U1_P1",
            networkId: "VCC",
            type: "rect", 
            offset: { x: -3, y: 0 },
            size: { x: 1, y: 1 },
          },
          {
            padId: "U1_P2",
            networkId: "GND",
            type: "rect",
            offset: { x: 3, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "U2",
        pads: [
          {
            padId: "U2_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: -1, y: 0 },
            size: { x: 1, y: 1 },
          },
          {
            padId: "U2_P2", 
            networkId: "GND",
            type: "rect",
            offset: { x: 1, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
    ]

    // Test with optimization
    const optimizedSolver = new PackSolver({
      components,
      minGap: 2,
      packOrderStrategy: "largest_to_smallest",
      packPlacementStrategy: "minimum_sum_distance_to_network",
      disconnectedPackDirection: "right",
    })

    // Test without optimization (original strategy)  
    const originalSolver = new PackSolver({
      components,
      minGap: 2,
      packOrderStrategy: "largest_to_smallest", 
      packPlacementStrategy: "shortest_connection_along_outline",
      disconnectedPackDirection: "right",
    })

    optimizedSolver.solve()
    originalSolver.solve()

    const optimizedResult = optimizedSolver.getResult()
    const originalResult = originalSolver.getResult()

    expect(optimizedResult).toHaveLength(2)
    expect(originalResult).toHaveLength(2)

    // Calculate total connection distances for both
    const calculateTotalDistance = (result: PackedComponent[]) => {
      let totalDistance = 0
      const networks = ["VCC", "GND"]
      
      for (const networkId of networks) {
        const pads = result.flatMap(c => c.pads.filter(p => p.networkId === networkId))
        for (let i = 0; i < pads.length; i++) {
          for (let j = i + 1; j < pads.length; j++) {
            totalDistance += Math.hypot(
              pads[i].absoluteCenter.x - pads[j].absoluteCenter.x,
              pads[i].absoluteCenter.y - pads[j].absoluteCenter.y
            )
          }
        }
      }
      return totalDistance
    }

    const optimizedDistance = calculateTotalDistance(optimizedResult)
    const originalDistance = calculateTotalDistance(originalResult)

    console.log(`Optimized total distance: ${optimizedDistance}`)
    console.log(`Original total distance: ${originalDistance}`)

    // The optimized version should have equal or better (lower) total distance
    expect(optimizedDistance).toBeLessThanOrEqual(originalDistance * 1.1) // Allow 10% tolerance
  })
})