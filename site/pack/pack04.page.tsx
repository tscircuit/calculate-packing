import type { PackOutput } from "../../lib"
import { PackDebugger } from "../components/PackDebugger"

let netCount = 0
const newNet = () => `net${netCount++}`

const manualPackOutput: PackOutput = {
  components: [
    {
      componentId: "pcb_component_0",
      pads: [
        {
          padId: "pcb_smtpad_0",
          networkId: newNet(),
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
          networkId: newNet(),
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
          networkId: newNet(),
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
          networkId: newNet(),
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
          networkId: newNet(),
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
          networkId: newNet(),
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
          networkId: newNet(),
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
          networkId: newNet(),
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
          networkId: newNet(),
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
          networkId: newNet(),
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
          networkId: newNet(),
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
          networkId: newNet(),
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
  packPlacementStrategy: "minimum_sum_squared_distance_to_network",
}

export default () => (
  <PackDebugger initialPackOutput={manualPackOutput} title="Pack04" />
)
