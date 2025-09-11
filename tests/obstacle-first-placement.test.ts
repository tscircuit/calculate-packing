import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"
import { computeDistanceBetweenBoxes } from "@tscircuit/math-utils"

test("obstacle at origin forces first component placement along outline", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "c1",
        pads: [
          {
            padId: "p1",
            networkId: "n1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 10, y: 10 },
          },
        ],
      },
    ],
    obstacles: [
      {
        componentId: "o1",
        center: { x: 0, y: 0 },
        ccwRotationOffset: 0,
        pads: [
          {
            padId: "o1p1",
            networkId: "o1p1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 100, y: 100 },
            absoluteCenter: { x: 0, y: 0 },
          },
        ],
      },
    ],
    minGap: 1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  const output = pack(input)
  const placed = output.components[0]!

  // Should not be placed at origin
  expect(placed.center.x === 0 && placed.center.y === 0).toBe(false)

  // Ensure no overlap with obstacle
  const { distance } = computeDistanceBetweenBoxes(
    {
      center: placed.pads[0]!.absoluteCenter,
      width: placed.pads[0]!.size.x,
      height: placed.pads[0]!.size.y,
    },
    {
      center: { x: 0, y: 0 },
      width: 100,
      height: 100,
    },
  )

  expect(distance).toBeGreaterThan(0)
})
