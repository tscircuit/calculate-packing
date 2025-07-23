import type { PackOutput } from "../../lib/types"
import { PackDebugger } from "../components/PackDebugger"

const manualPackOutput: PackOutput = {
  components: [
    {
      componentId: "U1",
      center: { x: 0, y: 0 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "U1_P1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -5, y: 2 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: -5, y: 2 },
        },
        {
          padId: "U1_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: -5, y: -2 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: 5, y: -2 },
        },
        {
          padId: "U1_P3",
          networkId: "P3",
          type: "rect",
          offset: { x: 5, y: -2 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: 5, y: -2 },
        },
        {
          padId: "U1_P4",
          networkId: "P4",
          type: "rect",
          offset: { x: 5, y: 2 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: 5, y: 2 },
        },
      ],
    },
    {
      componentId: "U2",
      center: { x: 0, y: 10 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "U2_P1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -5, y: 0 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: -5, y: 10 },
        },
        {
          padId: "U2_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: 5, y: 0 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: 5, y: 10 },
        },
      ],
    },
  ],
  minGap: 2,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "shortest_connection_along_outline",
  disconnectedPackDirection: "right",
}

export default () => {
  return (
    <PackDebugger 
      initialPackOutput={manualPackOutput} 
      title="Pack01 - Manual Pack Output"
    />
  )
}
