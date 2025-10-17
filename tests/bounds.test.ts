import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"
import { getGraphicsFromPackOutput } from "../lib/testing/getGraphicsFromPackOutput"
import { getSvgFromGraphicsObject } from "graphics-debug"

test("bounds should be respected", () => {
  const packInput: PackInput = {
    components: [
      {
        componentId: "pcb_component_0",
        pads: [
          {
            padId: "pcb_smtpad_0",
            networkId: "unnamed0",
            type: "rect",
            size: {
              x: 0.54,
              y: 0.64,
            },
            offset: {
              x: -0.51,
              y: 0,
            },
          },
          {
            padId: "pcb_smtpad_1",
            networkId: "unnamed1",
            type: "rect",
            size: {
              x: 0.54,
              y: 0.64,
            },
            offset: {
              x: 0.5099999999999998,
              y: 0,
            },
          },
          {
            padId: "pcb_component_0-inner",
            networkId: "pcb_component_0-inner",
            type: "rect",
            size: {
              x: 1.5599999999999998,
              y: 0.6399999999999997,
            },
            offset: {
              x: 0,
              y: 0,
            },
          },
        ],
      },
      {
        componentId: "pcb_component_1",
        pads: [
          {
            padId: "pcb_smtpad_2",
            networkId: "unnamed2",
            type: "rect",
            size: {
              x: 0.54,
              y: 0.64,
            },
            offset: {
              x: -0.51,
              y: 0,
            },
          },
          {
            padId: "pcb_smtpad_3",
            networkId: "unnamed3",
            type: "rect",
            size: {
              x: 0.54,
              y: 0.64,
            },
            offset: {
              x: 0.5099999999999998,
              y: 0,
            },
          },
          {
            padId: "pcb_component_1-inner",
            networkId: "pcb_component_1-inner",
            type: "rect",
            size: {
              x: 1.5599999999999998,
              y: 0.6399999999999997,
            },
            offset: {
              x: 0,
              y: 0,
            },
          },
        ],
      },
    ],
    minGap: 1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
    obstacles: [],
    orderStrategy: "largest_to_smallest",
    placementStrategy: "minimum_sum_squared_distance_to_network",
    bounds: {
      minX: -2.5,
      maxX: 2.5,
      minY: -2.5,
      maxY: 2.5,
    },
  }

  const result = pack(packInput)

  const graphics = getGraphicsFromPackOutput(result)

  const bounds = result.bounds!

  expect(bounds.minX).toBe(-2.5)
  expect(bounds.minY).toBe(-2.5)
  expect(bounds.maxX).toBe(2.5)
  expect(bounds.maxY).toBe(2.5)

  // Verify all components are within bounds
  for (const component of result.components) {
    for (const pad of component.pads) {
      const padMinX = pad.absoluteCenter.x - pad.size.x / 2
      const padMaxX = pad.absoluteCenter.x + pad.size.x / 2
      const padMinY = pad.absoluteCenter.y - pad.size.y / 2
      const padMaxY = pad.absoluteCenter.y + pad.size.y / 2

      expect(padMinX).toBeGreaterThanOrEqual(bounds.minX)
      expect(padMaxX).toBeLessThanOrEqual(bounds.maxX)
      expect(padMinY).toBeGreaterThanOrEqual(bounds.minY)
      expect(padMaxY).toBeLessThanOrEqual(bounds.maxY)
    }
  }

  expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
