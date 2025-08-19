import { InteractiveGraphics } from "graphics-debug/react"
import type { PackInput, PackOutput } from "../../lib/types"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import { convertPackOutputToPackInput } from "../../lib/plumbing/convertPackOutputToPackInput"
import { useMemo, useReducer, useState } from "react"
import { PhasedPackSolver } from "../../lib"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"

type SolverType = "PhasedPackSolver" | "PackSolver2"

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

  const [selectedSolver, setSelectedSolver] =
    useState<SolverType>("PhasedPackSolver")
  const [runCount, incRunCount] = useReducer((c) => c + 1, 0)

  const packSolver = useMemo(() => {
    if (selectedSolver === "PackSolver2") {
      return new PackSolver2(packInput)
    }
    return new PhasedPackSolver(packInput)
  }, [selectedSolver, packInput])

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
          <label style={{ marginRight: "10px" }}>
            <strong>Solver:</strong>
          </label>
          <select
            value={selectedSolver}
            onChange={(e) => setSelectedSolver(e.target.value as SolverType)}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginRight: "20px",
            }}
          >
            <option value="PhasedPackSolver">PhasedPackSolver</option>
            <option value="PackSolver2">PackSolver2</option>
          </select>
        </div>
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
      <InteractiveGraphics
        key={`iter${packSolver.iterations >= 1}`}
        graphics={packSolver.visualize()}
      />

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
