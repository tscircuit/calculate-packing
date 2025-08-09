import { InteractiveGraphics } from "graphics-debug/react"
import type { PackInput, PackOutput } from "../../lib/types"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import { convertPackOutputToPackInput } from "../../lib/plumbing/convertPackOutputToPackInput"
import { PackSolver } from "../../lib/PackSolver/PackSolver"
import { useMemo, useReducer } from "react"

interface PackDebuggerProps {
  initialPackOutput?: PackOutput
  initialPackInput?: PackInput
  title?: string
}

export const PackDebugger = ({
  initialPackOutput,
  initialPackInput,
  title = "Pack Debugger",
}: PackDebuggerProps) => {
  const packInput: PackInput =
    initialPackInput ?? convertPackOutputToPackInput(initialPackOutput!)
  const packSolver = useMemo(() => new PackSolver(packInput), [])
  const [runCount, incRunCount] = useReducer((c) => c + 1, 0)

  return (
    <div>
      <h2>{title}</h2>

      {/* Control Panel */}
      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <strong>Iterations:</strong> {packSolver.iterations}
        </div>
        <button
          onClick={() => {
            packSolver.step()
            incRunCount()
          }}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Step
        </button>
      </div>

      {/* Automatic Pack Visualization */}
      <h3>Automatic Pack Visualization</h3>
      <InteractiveGraphics graphics={packSolver.visualize()} />

      {/* Manual Pack Output (collapsible) */}
      {initialPackOutput && (
        <details style={{ marginTop: "20px" }}>
          <summary>Manual Pack Output</summary>
          <InteractiveGraphics
            graphics={getGraphicsFromPackOutput(initialPackOutput)}
          />
        </details>
      )}
    </div>
  )
}
