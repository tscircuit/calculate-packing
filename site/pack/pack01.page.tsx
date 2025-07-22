import { InteractiveGraphics } from "graphics-debug/react"
import type { PackInput, PackOutput } from "../../lib/types"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import { convertPackOutputToPackInput } from "../../lib/plumbing/convertPackOutputToPackInput"
import { pack } from "../../lib/pack"
import { PackSolver } from "../../lib/PackSolver/PackSolver"
import { useReducer } from "react"

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

const packInput: PackInput = convertPackOutputToPackInput(manualPackOutput)

const packSolver = new PackSolver(packInput)

export default () => {
  const [runCount, incRunCount] = useReducer((c) => c + 1, 0)
  return (
    <div>
      {/* Control Panel */}
      <div>
        <div>Iterations: {packSolver.iterations}</div>
        <button
          onClick={() => {
            packSolver.step()
            incRunCount()
          }}
        >
          Step
        </button>
      </div>
      <h2>Automatic Pack Visualization</h2>
      <InteractiveGraphics graphics={packSolver.visualize()} />
      <details>
        <summary>Manual Pack Output</summary>
        <InteractiveGraphics
          graphics={getGraphicsFromPackOutput(manualPackOutput)}
        />
      </details>
    </div>
  )
}
