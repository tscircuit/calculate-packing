import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("single component forced to 90° should have swapped pad dimensions", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "U1",
        availableRotationDegrees: [90], // Only allow 90° rotation
        pads: [
          {
            padId: "U1_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 4, y: 2 }, // 4 wide, 2 tall - should become 2 wide, 4 tall at 90°
          },
        ],
      },
    ],
    minGap: 2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  const result = pack(input)
  const u1 = result.components[0]!
  const pad = u1.pads[0]!

  console.log(`=== Single Component 90° Rotation Test ===`)
  console.log(`U1 rotation: ${u1.ccwRotationOffset}°`)
  console.log(`Available rotations: ${u1.availableRotationDegrees}`)
  console.log(`Original pad size: 4x2`)
  console.log(`Rotated pad size: ${pad.size.x}x${pad.size.y}`)

  // Should be exactly 90 degrees since that's the only option
  expect(u1.ccwRotationOffset).toBe(90)

  // At 90° rotation, 4x2 should become 2x4
  expect(pad.size.x).toBe(2) // was height (2)
  expect(pad.size.y).toBe(4) // was width (4)

  console.log(`✅ Pad dimensions correctly swapped: 4x2 → 2x4`)
})