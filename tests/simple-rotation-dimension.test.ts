import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

const packSingleRect = (
  availableRotationDegrees: number[],
): ReturnType<typeof pack> => {
  const input: PackInput = {
    components: [
      {
        componentId: "U1",
        availableRotationDegrees,
        pads: [
          {
            padId: "U1_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 4, y: 2 },
          },
        ],
      },
    ],
    minGap: 2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  return pack(input)
}

test("single component forced to 90° should have swapped pad dimensions", () => {
  const result = packSingleRect([90])
  const u1 = result.components[0]!
  const pad = u1.pads[0]!

  expect(u1.ccwRotationOffset).toBe(90)
  expect(pad.size.x).toBe(2)
  expect(pad.size.y).toBe(4)
})

test("single component forced to 270° should have swapped pad dimensions", () => {
  const result = packSingleRect([270])
  const u1 = result.components[0]!
  const pad = u1.pads[0]!

  expect(u1.ccwRotationOffset).toBe(270)
  expect(pad.size.x).toBe(2)
  expect(pad.size.y).toBe(4)
})
