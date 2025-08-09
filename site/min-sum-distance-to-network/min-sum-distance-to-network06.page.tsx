import type { PackInput, PackOutput } from "../../lib/types"
import { PackDebugger } from "../components/PackDebugger"

const packInput: PackInput = {
  components: [
    {
      componentId: "U1",
      pads: [
        {
          padId: "U1.1",
          networkId: "disconnected_0",
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
          networkId: "disconnected_1",
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
          networkId: "disconnected_2",
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
          networkId: "C5.1",
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
          networkId: "disconnected_3",
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
      componentId: "C5",
      pads: [
        {
          padId: "C5.1",
          networkId: "C5.1",
          type: "rect",
          offset: {
            x: -0.000273349999999839,
            y: 0.5512093000000002,
          },
          size: {
            x: 0.05,
            y: 0.05,
          },
        },
        {
          padId: "C5.2",
          networkId: "disconnected_4",
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
          padId: "C5-body",
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
  packPlacementStrategy: "minimum_sum_squared_distance_to_network",
}

export default () => {
  return (
    <PackDebugger
      initialPackInput={packInput}
      title="Min Sum Distance to Network - Pack Output"
    />
  )
}
