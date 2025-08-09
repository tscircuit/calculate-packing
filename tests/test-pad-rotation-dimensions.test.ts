import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("pad width/height should be correct when components are rotated", () => {
  const packInput: PackInput = {
    components: [
      {
        componentId: "C1",
        availableRotationDegrees: [0], // Keep C1 at 0° for reference
        pads: [
          {
            padId: "C1.1",
            networkId: "C1.1",
            type: "rect",
            offset: { x: 0, y: 0.551 },
            size: { x: 0.05, y: 0.05 },
          },
          {
            padId: "C1.2", 
            networkId: "C1.2",
            type: "rect",
            offset: { x: 0, y: -0.551 },
            size: { x: 0.05, y: 0.05 },
          },
          {
            padId: "C1-body",
            networkId: "disconnected_1",
            type: "rect", 
            offset: { x: 0, y: 0 },
            size: { x: 0.529, y: 1.058 }, // Narrow and tall
          }
        ]
      },
      {
        componentId: "C2",
        availableRotationDegrees: [90], // Force C2 to 90° rotation
        pads: [
          {
            padId: "C2.1",
            networkId: "C1.1", 
            type: "rect",
            offset: { x: 0, y: 0.551 },
            size: { x: 0.05, y: 0.05 },
          },
          {
            padId: "C2.2",
            networkId: "C1.2",
            type: "rect", 
            offset: { x: 0, y: -0.551 },
            size: { x: 0.05, y: 0.05 },
          },
          {
            padId: "C2-body",
            networkId: "disconnected_2",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 0.529, y: 1.058 }, // Same as C1: narrow and tall
          }
        ]
      }
    ],
    minGap: 0.2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  const result = pack(packInput)
  
  const c1 = result.components.find(c => c.componentId === "C1")!
  const c2 = result.components.find(c => c.componentId === "C2")!
  
  console.log("=== Pad Dimension Analysis ===")
  
  // C1 should remain at 0° rotation - dimensions unchanged
  const c1Body = c1.pads.find(p => p.padId === "C1-body")!
  console.log(`C1 (0° rotation):`)
  console.log(`  Body size: ${c1Body.size.x.toFixed(3)} x ${c1Body.size.y.toFixed(3)}`)
  console.log(`  Expected: 0.529 x 1.058 (narrow and tall)`)
  
  // C2 should be at 90° rotation - dimensions swapped
  const c2Body = c2.pads.find(p => p.padId === "C2-body")!
  console.log(`C2 (90° rotation):`)
  console.log(`  Body size: ${c2Body.size.x.toFixed(3)} x ${c2Body.size.y.toFixed(3)}`)
  console.log(`  Expected: 1.058 x 0.529 (wide and short - dimensions swapped)`)
  console.log(`  Actual rotation: ${c2.ccwRotationOffset}°`)
  
  // Test assertions
  expect(c1.ccwRotationOffset).toBe(0)
  expect(c2.ccwRotationOffset).toBe(90)
  
  // C1 dimensions should be unchanged (0° rotation)
  expect(c1Body.size.x).toBeCloseTo(0.529, 3)
  expect(c1Body.size.y).toBeCloseTo(1.058, 3)
  
  // C2 dimensions should be swapped (90° rotation)
  expect(c2Body.size.x).toBeCloseTo(1.058, 3) // Should be original height
  expect(c2Body.size.y).toBeCloseTo(0.529, 3) // Should be original width
  
  console.log(`\nTest verdict:`)
  console.log(`  C1 dimensions correct: ${c1Body.size.x.toFixed(3)} x ${c1Body.size.y.toFixed(3)} ✓`)
  console.log(`  C2 dimensions ${c2Body.size.x.toFixed(3) === '1.058' && c2Body.size.y.toFixed(3) === '0.529' ? 'correct' : 'INCORRECT'}: ${c2Body.size.x.toFixed(3)} x ${c2Body.size.y.toFixed(3)} ${c2Body.size.x.toFixed(3) === '1.058' && c2Body.size.y.toFixed(3) === '0.529' ? '✓' : '✗'}`)
})