import type { PackOutput } from "../../lib/types"
import { PackDebugger } from "../components/PackDebugger"

const manualPackOutput: PackOutput = {
  components: [
    {
      componentId: "U1",
      center: { x: 0, y: 0 },
      ccwRotationOffsetDegrees: 0,
      availableRotationDegrees: [0],
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
      ccwRotationOffsetDegrees: 90, // 90 degrees
      availableRotationDegrees: [-90, 90],
      pads: [
        {
          padId: "U2_P1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -5, y: 0 }, // Original offset
          size: { x: 1, y: 1 },
          absoluteCenter: { x: 0, y: 5 }, // center + rotated(-5,0) = (0,10) + (0,-5) = (0,5)
        },
        {
          padId: "U2_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: 5, y: 0 }, // Original offset
          size: { x: 1, y: 1 },
          absoluteCenter: { x: 0, y: 15 }, // center + rotated(5,0) = (0,10) + (0,5) = (0,15)
        },
      ],
    },
  ],
  minGap: 2,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  disconnectedPackDirection: "right",
}

export default () => {
  return (
    <PackDebugger
      initialPackOutput={manualPackOutput}
      title="Min Sum Distance to Network - Pack Output"
    />
  )
}
