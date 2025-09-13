import type { PackInput } from "../../lib/types"
import { PackDebugger } from "../components/PackDebugger"

const packInput: PackInput = {
  components: [
    {
      componentId: "U1",
      availableRotationDegrees: [0, 180],
      pads: [
        {
          padId: "U1.1",
          networkId: "NET_A",
          type: "rect",
          offset: { x: -0.8, y: 0.15 },
          size: { x: 0.2, y: 0.2 },
        },
        {
          padId: "U1.2",
          networkId: "NET_B",
          type: "rect",
          offset: { x: 0.8, y: -0.15 },
          size: { x: 0.2, y: 0.2 },
        },
        {
          padId: "U1-body",
          networkId: "U1_body_disconnected",
          type: "rect",
          offset: { x: 0, y: 0 },
          size: { x: 1.2, y: 0.6 },
        },
      ],
    },
    {
      componentId: "C1",
      availableRotationDegrees: [0, 180],
      pads: [
        {
          padId: "C1.1",
          networkId: "NET_A",
          type: "rect",
          offset: { x: -0.00027, y: 0.55 },
          size: { x: 0.15, y: 0.15 },
        },
        {
          padId: "C1.2",
          networkId: "NET_B",
          type: "rect",
          offset: { x: 0.00027, y: -0.55 },
          size: { x: 0.15, y: 0.15 },
        },
        {
          padId: "C1-body",
          networkId: "C1_body_disconnected",
          type: "rect",
          offset: { x: 0, y: 0 },
          size: { x: 0.6, y: 1.1 },
        },
      ],
    },
    {
      componentId: "R1",
      availableRotationDegrees: [0, 180],
      pads: [
        {
          padId: "R1.1",
          networkId: "NET_B",
          type: "rect",
          offset: { x: -0.6, y: 0 },
          size: { x: 0.2, y: 0.2 },
        },
        {
          padId: "R1.2",
          networkId: "NET_A",
          type: "rect",
          offset: { x: 0.6, y: 0 },
          size: { x: 0.2, y: 0.2 },
        },
      ],
    },
  ],
  obstacles: [
    {
      obstacleId: "OBS1",
      absoluteCenter: { x: 1.2, y: 0.4 },
      width: 0.8,
      height: 0.5,
    },
    {
      obstacleId: "OBS2",
      absoluteCenter: { x: -1.0, y: -0.6 },
      width: 0.7,
      height: 0.7,
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
      title="Obstacle Packing 01 - PackSolver2"
    />
  )
}
