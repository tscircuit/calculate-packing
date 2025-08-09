import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("debug multi-component placement path", () => {
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
        availableRotationDegrees: [90], // Force 90°
        pads: [
          {
            padId: "U2_body",
            networkId: "VCC", // Share network
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 2, y: 4 }, // Should become 4x2 at 90°
          },
        ],
      },
    ],
    minGap: 2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  console.log(`=== Debugging Multi-Component Path ===`)

  const output = pack(input)
  const result = output.components
  const u2 = result.find((c) => c.componentId === "U2")!
  const bodyPad = u2.pads[0]!

  console.log(`U2 rotation: ${u2.ccwRotationOffset}°`)
  console.log(`U2 body pad input: 2x4`)
  console.log(`U2 body pad output: ${bodyPad.size.x}x${bodyPad.size.y}`)
  console.log(`Should be: 4x2`)

  expect(u2.ccwRotationOffset).toBe(90)
  expect(bodyPad.size.x).toBe(4)
  expect(bodyPad.size.y).toBe(2)
})
