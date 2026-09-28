import { test, expect } from "bun:test"
import { pack } from "lib/pack"
import type { PackInput } from "lib/types"

const createSimpleChip = (componentId: string, size = 2) => ({
  componentId,
  pads: [
    {
      padId: `${componentId}_pad1`,
      networkId: `net_${componentId}`,
      type: "rect" as const,
      size: { x: size, y: size },
      offset: { x: 0, y: 0 },
    },
  ],
})

test("fixed_x_distance_and_orientation packs paired chips at specified distance", () => {
  const input: PackInput = {
    components: [createSimpleChip("chipA", 2), createSimpleChip("chipB", 2)],
    distanceConstraints: [
      {
        leftChipId: "chipA",
        rightChipId: "chipB",
        type: "fixed_x_distance_and_orientation",
        distance: 10,
      },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  const output = pack(input)
  const chipA = output.components.find((c) => c.componentId === "chipA")!
  const chipB = output.components.find((c) => c.componentId === "chipB")!

  expect(chipA).toBeDefined()
  expect(chipB).toBeDefined()
  expect(chipB.center.x - chipA.center.x).toBeCloseTo(10, 4)
  expect(chipB.center.y).toBeCloseTo(chipA.center.y, 4)
  expect(chipB.ccwRotationOffset).toBe(chipA.ccwRotationOffset)
})

test("fixed_x_distance_and_orientation works when rightChip is packed first", () => {
  const input: PackInput = {
    components: [
      createSimpleChip("chipA", 2),
      createSimpleChip("chipB", 4), // chipB is larger, so largest_to_smallest packs chipB first
    ],
    distanceConstraints: [
      {
        leftChipId: "chipA",
        rightChipId: "chipB",
        type: "fixed_x_distance_and_orientation",
        distance: 12,
      },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  const output = pack(input)
  const chipA = output.components.find((c) => c.componentId === "chipA")!
  const chipB = output.components.find((c) => c.componentId === "chipB")!

  expect(chipB.center.x - chipA.center.x).toBeCloseTo(12, 4)
  expect(chipB.center.y).toBeCloseTo(chipA.center.y, 4)
  expect(chipA.ccwRotationOffset).toBe(chipB.ccwRotationOffset)
})

test("fixed_x_distance_and_orientation with multiple chained chips", () => {
  const input: PackInput = {
    components: [
      createSimpleChip("chipA", 2),
      createSimpleChip("chipB", 2),
      createSimpleChip("chipC", 2),
    ],
    distanceConstraints: [
      {
        leftChipId: "chipA",
        rightChipId: "chipB",
        type: "fixed_x_distance_and_orientation",
        distance: 10,
      },
      {
        leftChipId: "chipB",
        rightChipId: "chipC",
        type: "fixed_x_distance_and_orientation",
        distance: 15,
      },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  const output = pack(input)
  const chipA = output.components.find((c) => c.componentId === "chipA")!
  const chipB = output.components.find((c) => c.componentId === "chipB")!
  const chipC = output.components.find((c) => c.componentId === "chipC")!

  expect(chipB.center.x - chipA.center.x).toBeCloseTo(10, 4)
  expect(chipC.center.x - chipB.center.x).toBeCloseTo(15, 4)
  expect(chipB.center.y).toBeCloseTo(chipA.center.y, 4)
  expect(chipC.center.y).toBeCloseTo(chipB.center.y, 4)
})

test("constrained chips maintain distance when unconstrained chips are packed alongside", () => {
  const input: PackInput = {
    components: [
      createSimpleChip("mainChip", 6),
      createSimpleChip("pairLeft", 2),
      createSimpleChip("pairRight", 2),
      createSimpleChip("extraChip", 3),
    ],
    distanceConstraints: [
      {
        leftChipId: "pairLeft",
        rightChipId: "pairRight",
        type: "fixed_x_distance_and_orientation",
        distance: 8,
      },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  const output = pack(input)
  const left = output.components.find((c) => c.componentId === "pairLeft")!
  const right = output.components.find((c) => c.componentId === "pairRight")!

  expect(right.center.x - left.center.x).toBeCloseTo(8, 4)
  expect(right.center.y).toBeCloseTo(left.center.y, 4)
  expect(right.ccwRotationOffset).toBe(left.ccwRotationOffset)
  expect(output.components).toHaveLength(4)
})

test("constrained chips avoid obstacles while maintaining exact distance", () => {
  const input: PackInput = {
    components: [createSimpleChip("chipA", 2), createSimpleChip("chipB", 2)],
    obstacles: [
      {
        obstacleId: "obs1",
        absoluteCenter: { x: 5, y: 0 },
        width: 2,
        height: 2,
      },
    ],
    distanceConstraints: [
      {
        leftChipId: "chipA",
        rightChipId: "chipB",
        type: "fixed_x_distance_and_orientation",
        distance: 10,
      },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  const output = pack(input)
  const chipA = output.components.find((c) => c.componentId === "chipA")!
  const chipB = output.components.find((c) => c.componentId === "chipB")!

  expect(chipB.center.x - chipA.center.x).toBeCloseTo(10, 4)
  expect(chipB.center.y).toBeCloseTo(chipA.center.y, 4)
  // Ensure obstacle is not overlapped by chipA or chipB
  const obs = input.obstacles![0]!
  const distA = Math.hypot(
    chipA.center.x - obs.absoluteCenter.x,
    chipA.center.y - obs.absoluteCenter.y,
  )
  const distB = Math.hypot(
    chipB.center.x - obs.absoluteCenter.x,
    chipB.center.y - obs.absoluteCenter.y,
  )
  expect(distA).toBeGreaterThan(1.5)
  expect(distB).toBeGreaterThan(1.5)
})
