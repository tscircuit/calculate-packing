import { test, expect } from "bun:test"
import { convertPackOutputToPackInput } from "../lib/plumbing/convertPackOutputToPackInput"
import type { PackOutput } from "../lib/types"

test("convertPackOutputToPackInput should preserve availableRotationDegrees", () => {
  const packOutput: PackOutput = {
    components: [
      {
        componentId: "U1",
        center: { x: 0, y: 0 },
        ccwRotationOffset: 0,
        availableRotationDegrees: [0], // Should be preserved
        pads: [
          {
            padId: "U1_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: -5, y: 2 },
            size: { x: 1, y: 1 },
            absoluteCenter: { x: -5, y: 2 }, // Should be removed
          },
        ],
      },
      {
        componentId: "U2",
        center: { x: 10, y: 0 },
        ccwRotationOffset: Math.PI / 2, // Should be removed
        availableRotationDegrees: [0, 90], // Should be preserved
        pads: [
          {
            padId: "U2_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
            absoluteCenter: { x: 10, y: 0 }, // Should be removed
          },
        ],
      },
    ],
    minGap: 2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  const packInput = convertPackOutputToPackInput(packOutput)

  // Should preserve availableRotationDegrees
  expect(packInput.components[0].availableRotationDegrees).toEqual([0])
  expect(packInput.components[1].availableRotationDegrees).toEqual([0, 90])

  // Should remove output-only properties
  expect(packInput.components[0]).not.toHaveProperty("center")
  expect(packInput.components[0]).not.toHaveProperty("ccwRotationOffset")
  expect(packInput.components[0].pads[0]).not.toHaveProperty("absoluteCenter")

  // Should preserve input properties
  expect(packInput.components[0].componentId).toBe("U1")
  expect(packInput.components[0].pads[0].padId).toBe("U1_P1")
  expect(packInput.components[0].pads[0].offset).toEqual({ x: -5, y: 2 })
  expect(packInput.minGap).toBe(2)
  expect(packInput.packPlacementStrategy).toBe(
    "minimum_sum_squared_distance_to_network",
  )

  console.log("✅ convertPackOutputToPackInput preserves rotation constraints!")
})
