import { InteractiveGraphics } from "graphics-debug/react"
import type { PackInput, PackOutput } from "../../lib/types"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"

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
          offset: { x: -5, y: 0 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: -5, y: 0 },
        },
        {
          padId: "U1_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: 5, y: 0 },
          size: { x: 1, y: 1 },
          absoluteCenter: { x: 5, y: 0 },
        },
      ],
    },
  ],
  minGap: 5,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "shortest_connection_along_outline",
  disconnectedPackDirection: "right",
}

export default () => {
  return (
    <InteractiveGraphics
      graphics={getGraphicsFromPackOutput(manualPackOutput)}
    />
  )
}
