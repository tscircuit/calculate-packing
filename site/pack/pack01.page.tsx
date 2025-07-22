import { InteractiveGraphics } from "graphics-debug/react"
import type { PackInput, PackOutput } from "../../lib/types"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import { convertPackOutputToPackInput } from "../../lib/plumbing/convertPackOutputToPackInput"
import { pack } from "../../lib/pack"

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
  minGap: 5,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "shortest_connection_along_outline",
  disconnectedPackDirection: "right",
}

const packInput: PackInput = convertPackOutputToPackInput(manualPackOutput)

export default () => {
  const packOutput = pack(packInput)
  return (
    <div>
      <h2>Manual Pack Output</h2>
      <InteractiveGraphics
        graphics={getGraphicsFromPackOutput(manualPackOutput)}
      />
      <h2>Automatic Pack Output</h2>
      {packOutput && (
        <InteractiveGraphics graphics={getGraphicsFromPackOutput(packOutput)} />
      )}
    </div>
  )
}
