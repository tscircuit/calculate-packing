import { expect, test } from "bun:test"
import { pack } from "../../lib"
import type { PackInput } from "../../lib/types"

const createPackInput = (
  leftConnectionWeight: number,
  rightConnectionWeight: number,
): PackInput => ({
  components: [
    {
      componentId: "LEFT_TARGET",
      isStatic: true,
      center: { x: -8, y: 0 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "left_target_pad",
          networkId: "LEFT_NET",
          type: "rect",
          offset: { x: 0, y: 0 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: -8, y: 0 },
        },
      ],
    },
    {
      componentId: "RIGHT_TARGET",
      isStatic: true,
      center: { x: 8, y: 0 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "right_target_pad",
          networkId: "RIGHT_NET",
          type: "rect",
          offset: { x: 0, y: 0 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: 8, y: 0 },
        },
      ],
    },
    {
      componentId: "C3",
      availableRotationDegrees: [0],
      pads: [
        {
          padId: "c3_left_pad",
          networkId: "LEFT_NET",
          type: "rect",
          offset: { x: -0.5, y: 0 },
          size: { x: 0.8, y: 0.8 },
        },
        {
          padId: "c3_right_pad",
          networkId: "RIGHT_NET",
          type: "rect",
          offset: { x: 0.5, y: 0 },
          size: { x: 0.8, y: 0.8 },
        },
      ],
    },
  ],
  minGap: 1,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  weightedConnections: [
    {
      padIds: ["c3_left_pad", "left_target_pad"],
      weight: leftConnectionWeight,
      ignoreWeakConnections: true,
    },
    {
      padIds: ["c3_right_pad", "right_target_pad"],
      weight: rightConnectionWeight,
      ignoreWeakConnections: true,
    },
  ],
})

test("repro: numeric connection weight influences placement priority", () => {
  const leftPriorityResult = pack(createPackInput(10, 1))
  const rightPriorityResult = pack(createPackInput(1, 10))

  const leftPriorityC3 = leftPriorityResult.components.find(
    (component) => component.componentId === "C3",
  )!
  const rightPriorityC3 = rightPriorityResult.components.find(
    (component) => component.componentId === "C3",
  )!

  // Reversing the weights should move C3 toward the newly higher-priority
  // target. Currently both runs place C3 at x=3.5.
  expect(leftPriorityC3.center.x).toBeLessThan(rightPriorityC3.center.x)
})
