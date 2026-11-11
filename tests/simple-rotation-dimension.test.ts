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

  // Should be exactly 90 degrees since that's the only option
  expect(u1.ccwRotationOffset).toBe(90)

  // At 90° rotation, 4x2 should become 2x4
  expect(pad.size.x).toBe(2) // was height (2)
  expect(pad.size.y).toBe(4) // was width (4)
})

test("initial component tries available rotations when 0° violates bounds, boundaryOutline, or obstacles", () => {
  // 1. Narrow bounds where 6x2 at 0° overflows [-2, 2] width, but 90° (2x6) fits cleanly
  const boundsResult = pack({
    components: [
      {
        componentId: "U1",
        availableRotationDegrees: [0, 90],
        pads: [
          {
            padId: "U1_P1",
            networkId: "N1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 6, y: 2 },
          },
        ],
      },
    ],
    bounds: { minX: -2, maxX: 2, minY: -5, maxY: 5 },
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  })
  expect(boundsResult.components[0]!.ccwRotationOffset).toBe(90)
  expect(boundsResult.components[0]!.pads[0]!.size).toEqual({ x: 2, y: 6 })

  // 2. Narrow boundaryOutline where 0° overflows width, but 270° (2x6) fits inside
  const outlineResult = pack({
    components: [
      {
        componentId: "U1",
        availableRotationDegrees: [0, 270],
        pads: [
          {
            padId: "U1_P1",
            networkId: "N1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 6, y: 2 },
          },
        ],
      },
    ],
    boundaryOutline: [
      { x: -2, y: -5 },
      { x: 2, y: -5 },
      { x: 2, y: 5 },
      { x: -2, y: 5 },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  })
  expect(outlineResult.components[0]!.ccwRotationOffset).toBe(270)
  expect(outlineResult.components[0]!.pads[0]!.size).toEqual({ x: 2, y: 6 })

  // 3. Side obstacles at x = ±3 with minGap=1 block 6x2 at 0°, while 90° (2x6) has 1.5mm clearance
  const obstacleResult = pack({
    components: [
      {
        componentId: "U1",
        availableRotationDegrees: [0, 90],
        pads: [
          {
            padId: "U1_P1",
            networkId: "N1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 6, y: 2 },
          },
        ],
      },
    ],
    obstacles: [
      {
        obstacleId: "OBS_L",
        absoluteCenter: { x: -3, y: 0 },
        width: 1,
        height: 4,
      },
      {
        obstacleId: "OBS_R",
        absoluteCenter: { x: 3, y: 0 },
        width: 1,
        height: 4,
      },
    ],
    minGap: 1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  })
  expect(obstacleResult.components[0]!.ccwRotationOffset).toBe(90)
  expect(obstacleResult.components[0]!.center).toEqual({ x: 0, y: 0 })
  expect(obstacleResult.components[0]!.pads[0]!.size).toEqual({ x: 2, y: 6 })
})
