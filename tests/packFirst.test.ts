import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("packFirst parameter ensures specified component is placed first at (0,0)", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "component_a",
        pads: [
          {
            padId: "pad_a1",
            networkId: "net1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "component_b",
        pads: [
          {
            padId: "pad_b1",
            networkId: "net2",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 2, y: 2 },
          },
          {
            padId: "pad_b2",
            networkId: "net3",
            type: "rect",
            offset: { x: 1, y: 1 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "component_c",
        pads: [
          {
            padId: "pad_c1",
            networkId: "net4",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 3, y: 3 },
          },
          {
            padId: "pad_c2",
            networkId: "net5",
            type: "rect",
            offset: { x: 1, y: 1 },
            size: { x: 1, y: 1 },
          },
          {
            padId: "pad_c3",
            networkId: "net6",
            type: "rect",
            offset: { x: 2, y: 2 },
            size: { x: 1, y: 1 },
          },
        ],
      },
    ],
    minGap: 1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
    packFirst: ["component_a"], // Specify component_a should be packed first
  }

  const result = pack(input)

  // The first component in packFirst should be at (0,0)
  const componentA = result.components.find(
    (c) => c.componentId === "component_a",
  )
  expect(componentA).toBeDefined()
  expect(componentA!.center.x).toBe(0)
  expect(componentA!.center.y).toBe(0)

  // Without packFirst, component_c would normally be placed first (largest_to_smallest)
  // But with packFirst, component_a should be first even though it has fewer pads
})

test("packFirst parameter respects order when multiple components specified", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "component_a",
        pads: [
          {
            padId: "pad_a1",
            networkId: "net1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "component_b",
        pads: [
          {
            padId: "pad_b1",
            networkId: "net2",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 2, y: 2 },
          },
          {
            padId: "pad_b2",
            networkId: "net3",
            type: "rect",
            offset: { x: 1, y: 1 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "component_c",
        pads: [
          {
            padId: "pad_c1",
            networkId: "net4",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 3, y: 3 },
          },
          {
            padId: "pad_c2",
            networkId: "net5",
            type: "rect",
            offset: { x: 1, y: 1 },
            size: { x: 1, y: 1 },
          },
          {
            padId: "pad_c3",
            networkId: "net6",
            type: "rect",
            offset: { x: 2, y: 2 },
            size: { x: 1, y: 1 },
          },
        ],
      },
    ],
    minGap: 1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
    packFirst: ["component_b", "component_a"], // component_b should be first, then component_a
  }

  const result = pack(input)

  // component_b should be at (0,0) since it's first in packFirst
  const componentB = result.components.find(
    (c) => c.componentId === "component_b",
  )
  expect(componentB).toBeDefined()
  expect(componentB!.center.x).toBe(0)
  expect(componentB!.center.y).toBe(0)

  // component_a should not be at (0,0) since it's second in packFirst
  const componentA = result.components.find(
    (c) => c.componentId === "component_a",
  )
  expect(componentA).toBeDefined()
  expect(componentA!.center.x !== 0 || componentA!.center.y !== 0).toBe(true)
})

test("packFirst parameter works without affecting remaining components default sorting", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "component_small",
        pads: [
          {
            padId: "pad_small1",
            networkId: "net1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "component_medium",
        pads: [
          {
            padId: "pad_medium1",
            networkId: "net2",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 2, y: 2 },
          },
          {
            padId: "pad_medium2",
            networkId: "net3",
            type: "rect",
            offset: { x: 1, y: 1 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "component_large",
        pads: [
          {
            padId: "pad_large1",
            networkId: "net4",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 3, y: 3 },
          },
          {
            padId: "pad_large2",
            networkId: "net5",
            type: "rect",
            offset: { x: 1, y: 1 },
            size: { x: 1, y: 1 },
          },
          {
            padId: "pad_large3",
            networkId: "net6",
            type: "rect",
            offset: { x: 2, y: 2 },
            size: { x: 1, y: 1 },
          },
        ],
      },
    ],
    minGap: 1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
    packFirst: ["component_small"], // Force small component first
  }

  const result = pack(input)

  // component_small should be first at (0,0) due to packFirst
  const componentSmall = result.components.find(
    (c) => c.componentId === "component_small",
  )
  expect(componentSmall).toBeDefined()
  expect(componentSmall!.center.x).toBe(0)
  expect(componentSmall!.center.y).toBe(0)

  // The remaining components should still follow largest_to_smallest ordering
  // So component_large should be placed before component_medium in the remaining positions
})
