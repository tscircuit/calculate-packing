import { PackDebugger } from "../../components/PackDebugger"
import type { PackInput } from "../../../lib/types"

const tOutlinePackInput: PackInput = {
  components: [
    {
      componentId: "MCU",
      availableRotationDegrees: [0, 90],
      pads: [
        {
          padId: "MCU_VCC",
          networkId: "VCC",
          type: "rect",
          offset: { x: -4, y: 3 },
          size: { x: 1.5, y: 1.5 },
        },
        {
          padId: "MCU_GND",
          networkId: "GND",
          type: "rect",
          offset: { x: -4, y: -3 },
          size: { x: 1.5, y: 1.5 },
        },
        {
          padId: "MCU_IO1",
          networkId: "IO1",
          type: "rect",
          offset: { x: 4, y: 3 },
          size: { x: 1.5, y: 1.5 },
        },
        {
          padId: "MCU_IO2",
          networkId: "IO2",
          type: "rect",
          offset: { x: 4, y: -3 },
          size: { x: 1.5, y: 1.5 },
        },
      ],
    },
    {
      componentId: "SENSOR",
      availableRotationDegrees: [0, 90],
      pads: [
        {
          padId: "SENSOR_VCC",
          networkId: "VCC",
          type: "rect",
          offset: { x: -3, y: 2 },
          size: { x: 1.2, y: 1.2 },
        },
        {
          padId: "SENSOR_GND",
          networkId: "GND",
          type: "rect",
          offset: { x: -3, y: -2 },
          size: { x: 1.2, y: 1.2 },
        },
        {
          padId: "SENSOR_IO",
          networkId: "IO1",
          type: "rect",
          offset: { x: 3, y: 0 },
          size: { x: 1.2, y: 1.2 },
        },
      ],
    },
  ],
  boundaryOutline: [
    { x: -40, y: 30 },
    { x: 40, y: 30 },
    { x: 40, y: 10 },
    { x: 10, y: 10 },
    { x: 10, y: -40 },
    { x: -10, y: -40 },
    { x: -10, y: 10 },
    { x: -40, y: 10 },
  ],
  bounds: { minX: -60, minY: -60, maxX: 60, maxY: 40 },
  minGap: 3,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "shortest_connection_along_outline",
  disconnectedPackDirection: "nearest_to_center",
}

const PackingWithBoundaryTOutlinePage = () => {
  return (
    <PackDebugger
      initialPackInput={tOutlinePackInput}
      title="Packing Within a T-Shaped Boundary"
    />
  )
}

export default PackingWithBoundaryTOutlinePage
