import { expect, test } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"
import { doesComponentViolateBoundsOutline } from "../lib/geometry/doesComponentViolateBoundsOutline"

test("pack respects boundsOutline by placing components outside the forbidden polygon", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "C1",
        pads: [
          {
            padId: "P1",
            networkId: "",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 2, y: 2 },
          },
        ],
      },
    ],
    minGap: 1,
    obstacles: [],
    bounds: undefined,
    boundsOutline: [
      { x: -5, y: -5 },
      { x: 5, y: -5 },
      { x: 5, y: 5 },
      { x: -5, y: 5 },
    ],
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_distance_to_network",
  }

  const output = pack(input)
  const packedComponent = output.components[0]!

  // Ensure the packed component exists and respects the bounds outline constraint
  expect(packedComponent).toBeDefined()
  const violates = doesComponentViolateBoundsOutline(
    packedComponent,
    input.boundsOutline,
    input.minGap,
  )
  expect(violates).toBe(false)

  // The center should not be within the forbidden polygon
  expect(
    Math.abs(packedComponent.center.x) > 0 ||
      Math.abs(packedComponent.center.y) > 0,
  ).toBe(true)
  const pad = packedComponent.pads[0]!
  const padHalfExtent = Math.max(pad.size.x, pad.size.y) / 2
  const requiredOffset = 5 + input.minGap + padHalfExtent
  const centerOutsidePolygon =
    Math.abs(packedComponent.center.x) >= requiredOffset ||
    Math.abs(packedComponent.center.y) >= requiredOffset
  expect(centerOutsidePolygon).toBe(true)
})
