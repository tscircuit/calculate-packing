import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("minimum_closest_sum_squared_distance strategy should work", async () => {
  const packInput: PackInput = {
    components: [
      {
        componentId: "C1",
        pads: [
          {
            padId: "pin1",
            networkId: "VCC",
            type: "rect",
            offset: { x: -1, y: 0 },
            size: { x: 0.5, y: 0.5 },
          },
          {
            padId: "pin2",
            networkId: "GND",
            type: "rect",
            offset: { x: 1, y: 0 },
            size: { x: 0.5, y: 0.5 },
          },
        ],
      },
      {
        componentId: "C2",
        pads: [
          {
            padId: "pin1",
            networkId: "VCC",
            type: "rect",
            offset: { x: 0, y: -1 },
            size: { x: 0.5, y: 0.5 },
          },
          {
            padId: "pin2",
            networkId: "GND",
            type: "rect",
            offset: { x: 0, y: 1 },
            size: { x: 0.5, y: 0.5 },
          },
        ],
      },
      {
        componentId: "C3",
        pads: [
          {
            padId: "pin1",
            networkId: "VCC",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 0.5, y: 0.5 },
          },
        ],
      },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_closest_sum_squared_distance",
  }

  const result = pack(packInput)

  expect(result).toBeDefined()
  expect(result.components).toHaveLength(3)
  expect(result.components[0]?.componentId).toBe("C1")
  expect(result.components[1]?.componentId).toBe("C2")
  expect(result.components[2]?.componentId).toBe("C3")

  // Verify that components are positioned (not all at origin)
  const positions = result.components.map((c) => c.center)
  const uniquePositions = new Set(positions.map((p) => `${p.x},${p.y}`))
  expect(uniquePositions.size).toBeGreaterThan(1)

  // Test should pass without throwing errors
}, 10000)

test("minimum_closest_sum_squared_distance vs minimum_sum_squared_distance comparison", async () => {
  const baseInput = {
    components: [
      {
        componentId: "C1",
        pads: [
          {
            padId: "pin1",
            networkId: "VCC",
            type: "rect" as const,
            offset: { x: -2, y: 0 },
            size: { x: 0.5, y: 0.5 },
          },
          {
            padId: "pin2",
            networkId: "GND",
            type: "rect" as const,
            offset: { x: 2, y: 0 },
            size: { x: 0.5, y: 0.5 },
          },
        ],
      },
      {
        componentId: "C2",
        pads: [
          {
            padId: "pin1",
            networkId: "VCC",
            type: "rect" as const,
            offset: { x: 0, y: -2 },
            size: { x: 0.5, y: 0.5 },
          },
        ],
      },
      {
        componentId: "C3",
        pads: [
          {
            padId: "pin1",
            networkId: "VCC",
            type: "rect" as const,
            offset: { x: 0, y: 0 },
            size: { x: 0.5, y: 0.5 },
          },
        ],
      },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest" as const,
  }

  // Test with regular squared distance strategy
  const regularResult = pack({
    ...baseInput,
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  })

  // Test with new closest sum squared distance strategy
  const closestResult = pack({
    ...baseInput,
    packPlacementStrategy: "minimum_closest_sum_squared_distance",
  })

  // Both should succeed
  expect(regularResult.components).toHaveLength(3)
  expect(closestResult.components).toHaveLength(3)

  // They may produce different results due to different optimization strategies
  const regularPositions = regularResult.components.map((c) => ({
    id: c.componentId,
    pos: c.center,
  }))
  const closestPositions = closestResult.components.map((c) => ({
    id: c.componentId,
    pos: c.center,
  }))

  console.log("Regular strategy positions:", regularPositions)
  console.log("Closest strategy positions:", closestPositions)

  // Both should have valid positions (not all at origin)
  const regularUniquePositions = new Set(
    regularPositions.map((p) => `${p.pos.x},${p.pos.y}`),
  )
  const closestUniquePositions = new Set(
    closestPositions.map((p) => `${p.pos.x},${p.pos.y}`),
  )

  expect(regularUniquePositions.size).toBeGreaterThan(1)
  expect(closestUniquePositions.size).toBeGreaterThan(1)
}, 10000)
