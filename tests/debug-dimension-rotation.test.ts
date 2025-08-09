import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("debug exactly where pad dimensions get lost", () => {
  const input: PackInput = {
    components: [
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
        availableRotationDegrees: [90], // Force 90° rotation
        pads: [
          {
            padId: "U2_body",
            networkId: "VCC", // Share network to trigger placement logic
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 2, y: 4 }, // 2 wide, 4 tall - should become 4 wide, 2 tall at 90°
          },
        ],
      },
    ],
    minGap: 2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  console.log(`=== Debugging Dimension Rotation ===`)
  console.log(
    `Input U2 body pad: ${input.components[1]?.pads[0]?.size.x} x ${input.components[1]?.pads[0]?.size.y}`,
  )

  const result = pack(input)
  const u2 = result.components.find((c) => c.componentId === "U2")!
  const bodyPad = u2.pads[0]!

  console.log(`Output U2 rotation: ${u2.ccwRotationOffset}°`)
  console.log(`Output U2 body pad: ${bodyPad.size.x} x ${bodyPad.size.y}`)
  console.log(`Expected after 90°: 4 x 2`)

  // At 90°, should swap from 2x4 to 4x2
  expect(u2.ccwRotationOffset).toBe(90)
  expect(bodyPad.size.x).toBe(4) // was height
  expect(bodyPad.size.y).toBe(2) // was width

  console.log(`✅ Pad dimensions correctly swapped`)
})
