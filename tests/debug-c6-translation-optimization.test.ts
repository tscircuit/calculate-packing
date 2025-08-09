import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("debug C6 translation optimization for different rotations", () => {
  // Exact setup from network02 but just U1 and C6
  const packInput: PackInput = {
    components: [
      {
        componentId: "U1",
        pads: [
          {
            padId: "U1.1",
            networkId: "C1.1",
            type: "rect",
            offset: { x: -1, y: 0.1 },
            size: { x: 0.1, y: 0.1 },
          },
          {
            padId: "U1.2",
            networkId: "C1.2", 
            type: "rect",
            offset: { x: -1, y: -0.1 },
            size: { x: 0.1, y: 0.1 },
          },
          {
            padId: "U1-body",
            networkId: "U1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1.2, y: 3 },
          },
        ],
      },
      {
        componentId: "C6",
        // Remove rotation constraints to see all options
        pads: [
          {
            padId: "C6.1",
            networkId: "C1.1",
            type: "rect",
            offset: { x: 0, y: 0.55 },
            size: { x: 0.1, y: 0.1 },
          },
          {
            padId: "C6.2",
            networkId: "C1.2",
            type: "rect",
            offset: { x: 0, y: -0.55 },
            size: { x: 0.1, y: 0.1 },
          },
          {
            padId: "C6-body",
            networkId: "C6",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 0.529, y: 1.058 },
          },
        ],
      },
    ],
    minGap: 0.2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  const result = pack(packInput)
  
  const u1 = result.components[0]!
  const c6 = result.components[1]!
  
  console.log(`=== C6 Rotation Selection Debug ===`)
  console.log(`C6 chosen rotation: ${c6.ccwRotationOffset}°`)
  console.log(`C6 center: (${c6.center.x.toFixed(3)}, ${c6.center.y.toFixed(3)})`)
  
  // Calculate final costs for each network
  const u1_c11 = u1.pads.find(p => p.networkId === "C1.1")!
  const u1_c12 = u1.pads.find(p => p.networkId === "C1.2")!
  const c6_c11 = c6.pads.find(p => p.networkId === "C1.1")!
  const c6_c12 = c6.pads.find(p => p.networkId === "C1.2")!
  
  const c11_dist = Math.hypot(
    u1_c11.absoluteCenter.x - c6_c11.absoluteCenter.x,
    u1_c11.absoluteCenter.y - c6_c11.absoluteCenter.y
  )
  const c12_dist = Math.hypot(
    u1_c12.absoluteCenter.x - c6_c12.absoluteCenter.x,
    u1_c12.absoluteCenter.y - c6_c12.absoluteCenter.y
  )
  
  console.log(`\nFinal distances:`)
  console.log(`  C1.1: ${c11_dist.toFixed(3)}`)
  console.log(`  C1.2: ${c12_dist.toFixed(3)}`)
  console.log(`  Squared sum: ${(c11_dist*c11_dist + c12_dist*c12_dist).toFixed(3)}`)
  
  // Now manually test if other rotations could do better WITH translation optimization
  console.log(`\n=== Manual Analysis: What if C6 was at different rotations? ===`)
  
  // The question is: could translation optimization find a better position 
  // for a different rotation that results in lower total squared distance?
  
  // For this, we'd need to run the translation optimizer for each rotation
  // and see which one gives the best final result
  
  expect(result.components.length).toBe(2)
})