import { test, expect } from "bun:test"
import { PackSolver2 } from "./PackSolver2"
import type { PackInput } from "../types"

test("PackSolver2 with min-sum-distance-to-network04 input", () => {
  const packInput: PackInput = {
    components: [
      {
        componentId: "U1",
        pads: [
          {
            padId: "U1.1",
            networkId: "C1.1",
            type: "rect",
            offset: {
              x: -1,
              y: 0.1,
            },
            size: {
              x: 0.05,
              y: 0.05,
            },
          },
          {
            padId: "U1.2",
            networkId: "C1.2",
            type: "rect",
            offset: {
              x: -1,
              y: -0.1,
            },
            size: {
              x: 0.05,
              y: 0.05,
            },
          },
          {
            padId: "U1.3",
            networkId: "disconnected_0",
            type: "rect",
            offset: {
              x: 1,
              y: -0.1,
            },
            size: {
              x: 0.05,
              y: 0.05,
            },
          },
          {
            padId: "U1.4",
            networkId: "disconnected_1",
            type: "rect",
            offset: {
              x: 1,
              y: 0.1,
            },
            size: {
              x: 0.05,
              y: 0.05,
            },
          },
          {
            padId: "U1-body",
            networkId: "disconnected_2",
            type: "rect",
            offset: {
              x: 0,
              y: 0,
            },
            size: {
              x: 1.2000000000000002,
              y: 0.6000000000000001,
            },
          },
        ],
      },
      {
        componentId: "C6",
        availableRotationDegrees: [0, 180],
        pads: [
          {
            padId: "C6.1",
            networkId: "C1.1",
            type: "rect",
            offset: {
              x: -0.00027334999999961695,
              y: 0.5512093000000002,
            },
            size: {
              x: 0.05,
              y: 0.05,
            },
          },
          {
            padId: "C6.2",
            networkId: "C1.2",
            type: "rect",
            offset: {
              x: 0.00027334999999961695,
              y: -0.5512093000000002,
            },
            size: {
              x: 0.05,
              y: 0.05,
            },
          },
          {
            padId: "C6-body",
            networkId: "disconnected_3",
            type: "rect",
            offset: {
              x: 0,
              y: 0,
            },
            size: {
              x: 0.5291665999999999,
              y: 1.0583333000000001,
            },
          },
        ],
      },
      {
        componentId: "C1",
        availableRotationDegrees: [0, 180],
        pads: [
          {
            padId: "C1.1",
            networkId: "C1.1",
            type: "rect",
            offset: {
              x: -0.00027335000000006104,
              y: 0.5512093000000002,
            },
            size: {
              x: 0.05,
              y: 0.05,
            },
          },
          {
            padId: "C1.2",
            networkId: "C1.2",
            type: "rect",
            offset: {
              x: 0.00027334999999961695,
              y: -0.5512093000000002,
            },
            size: {
              x: 0.05,
              y: 0.05,
            },
          },
          {
            padId: "C1-body",
            networkId: "disconnected_4",
            type: "rect",
            offset: {
              x: 0,
              y: 0,
            },
            size: {
              x: 0.5291665999999999,
              y: 1.0583333000000001,
            },
          },
        ],
      },
      {
        componentId: "C2",
        availableRotationDegrees: [0, 180],
        pads: [
          {
            padId: "C2.1",
            networkId: "C1.1",
            type: "rect",
            offset: {
              x: -0.00027334999999961695,
              y: 0.5512093000000002,
            },
            size: {
              x: 0.05,
              y: 0.05,
            },
          },
          {
            padId: "C2.2",
            networkId: "C1.2",
            type: "rect",
            offset: {
              x: 0.00027335000000006104,
              y: -0.5512093000000002,
            },
            size: {
              x: 0.05,
              y: 0.05,
            },
          },
          {
            padId: "C2-body",
            networkId: "disconnected_5",
            type: "rect",
            offset: {
              x: 0,
              y: 0,
            },
            size: {
              x: 0.5291665999999999,
              y: 1.0583333000000001,
            },
          },
        ],
      },
    ],
    minGap: 0.2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_distance_to_network",
  }

  const solver = new PackSolver2(packInput)
  while (!solver.solved && !solver.failed) {
    console.log(`iteration ${solver.iterations}`)
    solver.step()
    solver.visualize()
  }

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.packedComponents).toHaveLength(4)

  // All components should be placed
  const componentIds = solver.packedComponents.map((c) => c.componentId).sort()
  expect(componentIds).toEqual(["C1", "C2", "C6", "U1"])

  // Components should be properly positioned (not all at origin)
  const nonOriginComponents = solver.packedComponents.filter(
    (c) => c.center.x !== 0 || c.center.y !== 0,
  )
  expect(nonOriginComponents.length).toBeGreaterThan(0)

  // All packed components should have absolute centers for their pads
  for (const component of solver.packedComponents) {
    for (const pad of component.pads) {
      expect(pad.absoluteCenter).toBeDefined()
      expect(typeof pad.absoluteCenter.x).toBe("number")
      expect(typeof pad.absoluteCenter.y).toBe("number")
    }
  }
})
