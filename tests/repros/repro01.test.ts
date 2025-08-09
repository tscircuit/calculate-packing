import { test, expect } from "bun:test"
import type { PackOutput } from "../../lib/types"
import { PhasedPackSolver } from "../../lib"
import { getSvgFromGraphicsObject } from "graphics-debug"

const manualPackOutput: PackOutput = {
  components: [
    {
      componentId: "pcb_component_0",
      pads: [
        {
          padId: "pcb_smtpad_0",
          networkId: "unnamedsubcircuit121_connectivity_net0",
          type: "rect",
          offset: {
            x: -2.15,
            y: 1.905,
          },
          size: {
            x: 1,
            y: 0.6,
          },
          absoluteCenter: {
            x: -2.15,
            y: 1.905,
          },
        },
        {
          padId: "pcb_smtpad_1",
          networkId: "unnamed0",
          type: "rect",
          offset: {
            x: -2.15,
            y: 0.635,
          },
          size: {
            x: 1,
            y: 0.6,
          },
          absoluteCenter: {
            x: -2.15,
            y: 0.635,
          },
        },
        {
          padId: "pcb_smtpad_2",
          networkId: "unnamed1",
          type: "rect",
          offset: {
            x: -2.15,
            y: -0.635,
          },
          size: {
            x: 1,
            y: 0.6,
          },
          absoluteCenter: {
            x: -2.15,
            y: -0.635,
          },
        },
        {
          padId: "pcb_smtpad_3",
          networkId: "unnamed2",
          type: "rect",
          offset: {
            x: -2.15,
            y: -1.905,
          },
          size: {
            x: 1,
            y: 0.6,
          },
          absoluteCenter: {
            x: -2.15,
            y: -1.905,
          },
        },
        {
          padId: "pcb_smtpad_4",
          networkId: "unnamedsubcircuit121_connectivity_net1",
          type: "rect",
          offset: {
            x: 2.15,
            y: -1.905,
          },
          size: {
            x: 1,
            y: 0.6,
          },
          absoluteCenter: {
            x: 2.15,
            y: -1.905,
          },
        },
        {
          padId: "pcb_smtpad_5",
          networkId: "unnamed3",
          type: "rect",
          offset: {
            x: 2.15,
            y: -0.635,
          },
          size: {
            x: 1,
            y: 0.6,
          },
          absoluteCenter: {
            x: 2.15,
            y: -0.635,
          },
        },
        {
          padId: "pcb_smtpad_6",
          networkId: "unnamed4",
          type: "rect",
          offset: {
            x: 2.15,
            y: 0.635,
          },
          size: {
            x: 1,
            y: 0.6,
          },
          absoluteCenter: {
            x: 2.15,
            y: 0.635,
          },
        },
        {
          padId: "pcb_smtpad_7",
          networkId: "unnamed5",
          type: "rect",
          offset: {
            x: 2.15,
            y: 1.905,
          },
          size: {
            x: 1,
            y: 0.6,
          },
          absoluteCenter: {
            x: 2.15,
            y: 1.905,
          },
        },
      ],
      center: {
        x: 0,
        y: 0,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_1",
      pads: [
        {
          padId: "pcb_smtpad_8",
          networkId: "unnamedsubcircuit121_connectivity_net0",
          type: "rect",
          offset: {
            x: -0.5,
            y: 0,
          },
          size: {
            x: 0.6,
            y: 0.6,
          },
          absoluteCenter: {
            x: -0.5,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_9",
          networkId: "unnamed6",
          type: "rect",
          offset: {
            x: 0.5,
            y: 0,
          },
          size: {
            x: 0.6,
            y: 0.6,
          },
          absoluteCenter: {
            x: 0.5,
            y: 0,
          },
        },
      ],
      center: {
        x: 0,
        y: 0,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_2",
      pads: [
        {
          padId: "pcb_smtpad_10",
          networkId: "unnamedsubcircuit121_connectivity_net1",
          type: "rect",
          offset: {
            x: -0.85,
            y: 0,
          },
          size: {
            x: 1.1,
            y: 1,
          },
          absoluteCenter: {
            x: -0.85,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_11",
          networkId: "unnamed7",
          type: "rect",
          offset: {
            x: 0.85,
            y: 0,
          },
          size: {
            x: 1.1,
            y: 1,
          },
          absoluteCenter: {
            x: 0.85,
            y: 0,
          },
        },
      ],
      center: {
        x: 0,
        y: 0,
      },
      ccwRotationOffset: 0,
    },
  ],
  minGap: 2,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "shortest_connection_along_outline",
}

test("repro01", () => {
  const packSolver = new PhasedPackSolver(manualPackOutput)
  packSolver.solve()
  const svg = getSvgFromGraphicsObject(packSolver.visualize(), {
    backgroundColor: "white",
  })
  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
