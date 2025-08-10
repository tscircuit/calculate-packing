import React, { useState, useMemo, useReducer } from "react"
import { InteractiveGraphics } from "graphics-debug/react"
import type { PackInput } from "../../lib/types"
import { PhasedPackSolver } from "../../lib"

const defaultPackInput: PackInput = {
  components: [
    {
      componentId: "U1",
      pads: [
        {
          padId: "U1_P1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -5, y: 2 },
          size: { x: 1, y: 1 },
        },
        {
          padId: "U1_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: -5, y: -2 },
          size: { x: 1, y: 1 },
        },
      ],
    },
    {
      componentId: "U2",
      pads: [
        {
          padId: "U2_P1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -4, y: 0 },
          size: { x: 1, y: 1 },
        },
        {
          padId: "U2_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: 4, y: 0 },
          size: { x: 1, y: 1 },
        },
      ],
    },
  ],
  minGap: 2,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "shortest_connection_along_outline",
  disconnectedPackDirection: "right",
}

export default () => {
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(defaultPackInput, null, 2),
  )
  const [parsedPackInput, setParsedPackInput] = useState<PackInput | null>(
    defaultPackInput,
  )
  const [parseError, setParseError] = useState<string | null>(null)
  const [forceUpdate, incForceUpdate] = useReducer((c) => c + 1, 0)

  const packSolver = useMemo(() => {
    if (!parsedPackInput) return null
    // Ensure disconnectedPackDirection has a default value
    const packInputWithDefaults = {
      ...parsedPackInput,
      disconnectedPackDirection:
        parsedPackInput.disconnectedPackDirection || "right",
    }
    console.log("Creating PhasedPackSolver with input:", packInputWithDefaults)
    return new PhasedPackSolver(packInputWithDefaults)
  }, [parsedPackInput])

  const handleJsonChange = (value: string) => {
    setJsonInput(value)
    try {
      const parsed = JSON.parse(value)
      setParsedPackInput(parsed)
      setParseError(null)
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Invalid JSON")
      setParsedPackInput(null)
    }
  }

  const handleStep = () => {
    if (packSolver) {
      packSolver.step()
      incForceUpdate()
    }
  }

  const handleSolve = () => {
    if (packSolver) {
      packSolver.solve()
      incForceUpdate()
    }
  }

  const handleReset = () => {
    incForceUpdate()
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Pack Iteration Debugger</h2>

      {/* JSON Input Section */}
      <div style={{ marginBottom: "20px" }}>
        <h3>PackInput JSON</h3>
        <textarea
          value={jsonInput}
          onChange={(e) => handleJsonChange(e.target.value)}
          style={{
            width: "100%",
            height: "300px",
            fontFamily: "monospace",
            fontSize: "12px",
            border: parseError ? "2px solid red" : "1px solid #ccc",
            borderRadius: "4px",
            padding: "10px",
          }}
          placeholder="Paste your PackInput JSON here..."
        />
        {parseError && (
          <div style={{ color: "red", marginTop: "5px", fontSize: "14px" }}>
            JSON Parse Error: {parseError}
          </div>
        )}
      </div>

      {/* Control Panel */}
      {packSolver && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <div style={{ marginBottom: "15px" }}>
            <strong>Iterations: {packSolver.iterations}</strong>
            {packSolver.solved && (
              <span
                style={{
                  marginLeft: "10px",
                  color: "green",
                  fontWeight: "bold",
                }}
              >
                ✓ Solved
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handleStep}
              disabled={packSolver.solved}
              style={{
                padding: "8px 16px",
                backgroundColor: packSolver.solved ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: packSolver.solved ? "not-allowed" : "pointer",
              }}
            >
              Step
            </button>

            <button
              onClick={handleSolve}
              disabled={packSolver.solved}
              style={{
                padding: "8px 16px",
                backgroundColor: packSolver.solved ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: packSolver.solved ? "not-allowed" : "pointer",
              }}
            >
              Solve
            </button>

            <button
              onClick={handleReset}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Visualization */}
      {packSolver && (
        <div>
          <h3>Current Packing State</h3>
          <InteractiveGraphics graphics={packSolver.visualize()} />
        </div>
      )}

      {!parsedPackInput && (
        <div style={{ color: "#666", fontStyle: "italic", marginTop: "20px" }}>
          Please provide valid PackInput JSON to begin debugging.
        </div>
      )}
    </div>
  )
}
