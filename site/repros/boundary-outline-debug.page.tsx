import { PackDebugger } from "../components/PackDebugger"
import type { PackInput } from "../../lib/types"

const boundaryOutlinePackInput: PackInput = {
  components: [
    {
      componentId: "U1",
      availableRotationDegrees: [0],
      pads: [
        {
          padId: "U1_P1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -5, y: 3 },
          size: { x: 1.5, y: 1.5 },
        },
        {
          padId: "U1_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: -5, y: -3 },
          size: { x: 1.5, y: 1.5 },
        },
        {
          padId: "U1_P3",
          networkId: "IO1",
          type: "rect",
          offset: { x: 5, y: 3 },
          size: { x: 1.5, y: 1.5 },
        },
        {
          padId: "U1_P4",
          networkId: "IO2",
          type: "rect",
          offset: { x: 5, y: -3 },
          size: { x: 1.5, y: 1.5 },
        },
      ],
    },
    {
      componentId: "U2",
      availableRotationDegrees: [0],
      pads: [
        {
          padId: "U2_P1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -3.5, y: 2 },
          size: { x: 1.2, y: 1.2 },
        },
        {
          padId: "U2_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: -3.5, y: -2 },
          size: { x: 1.2, y: 1.2 },
        },
        {
          padId: "U2_P3",
          networkId: "IO3",
          type: "rect",
          offset: { x: 3.5, y: 0 },
          size: { x: 1.2, y: 1.2 },
        },
      ],
    },
    {
      componentId: "U3",
      availableRotationDegrees: [0],
      pads: [
        {
          padId: "U3_P1",
          networkId: "VCC",
          type: "rect",
          offset: { x: 0, y: 4 },
          size: { x: 1.2, y: 1.2 },
        },
        {
          padId: "U3_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: 0, y: -4 },
          size: { x: 1.2, y: 1.2 },
        },
      ],
    },
  ],
  obstacles: [
    {
      obstacleId: "cutout",
      absoluteCenter: { x: 0, y: 0 },
      width: 8,
      height: 6,
    },
  ],
  boundaryOutline: [
    { x: -50, y: -35 },
    { x: 40, y: -35 },
    { x: 55, y: 0 },
    { x: 40, y: 35 },
    { x: -50, y: 35 },
    { x: -65, y: 0 },
  ],
  bounds: { minX: -70, minY: -45, maxX: 70, maxY: 45 },
  minGap: 3,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "shortest_connection_along_outline",
  disconnectedPackDirection: "nearest_to_center",
}

const BoundaryOutlineDebugPage = () => {
  return (
    <PackDebugger
      initialPackInput={boundaryOutlinePackInput}
      title="PackSolver2 Debugger – Boundary Outline Repro"
    />
  )
}

export default BoundaryOutlineDebugPage
