import type { PackOutput } from "../../lib/types"
import { PackDebugger } from "../components/PackDebugger"

const manualPackOutput: PackOutput = {
  components: [
    {
      componentId: "U_outline_left",
      center: { x: -18, y: 0 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "U_outline_left_P1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -2, y: 0 },
          size: { x: 1.2, y: 1.2 },
          absoluteCenter: { x: -20, y: 0 },
        },
        {
          padId: "U_outline_left_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: 2, y: 0 },
          size: { x: 1.2, y: 1.2 },
          absoluteCenter: { x: -16, y: 0 },
        },
      ],
    },
    {
      componentId: "U_outline_right",
      center: { x: 18, y: -2 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "U_outline_right_P1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -2, y: 1.5 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: 16, y: -0.5 },
        },
        {
          padId: "U_outline_right_P2",
          networkId: "IO",
          type: "rect",
          offset: { x: 3, y: -1.5 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: 21, y: -3.5 },
        },
      ],
    },
    {
      componentId: "U_outline_top",
      center: { x: 0, y: 16 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "U_outline_top_P1",
          networkId: "CLK",
          type: "rect",
          offset: { x: -1, y: 0 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: -1, y: 16 },
        },
        {
          padId: "U_outline_top_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: 1, y: 0 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: 1, y: 16 },
        },
      ],
    },
  ],
  minGap: 1.5,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "shortest_connection_along_outline",
  disconnectedPackDirection: "right",
  boundsOutline: [
    { x: -8, y: -8 },
    { x: 8, y: -8 },
    { x: 10, y: 2 },
    { x: 8, y: 10 },
    { x: -8, y: 10 },
    { x: -10, y: 2 },
  ],
}

export default () => {
  return (
    <PackDebugger
      initialPackOutput={manualPackOutput}
      title="Pack06 - Forbidden Bounds Outline"
    />
  )
}
