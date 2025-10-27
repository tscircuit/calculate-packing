import React, { useState, useMemo, useReducer, useEffect } from "react"
import { InteractiveGraphics } from "graphics-debug/react"
import type { PackInput } from "../../lib/types"
import { PackSolver2 } from "lib/index"

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
    return new PackSolver2(packInputWithDefaults)
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

  useEffect(() => {
    if (typeof document === "undefined") return
    if (
      !document.querySelector(
        'script[src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"]',
      )
    ) {
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"
      document.head.appendChild(script)
    }
  }, [])

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold mt-5 mb-5">Pack Iteration Debugger</h2>

      {/* JSON Input Section */}
      <div className="mb-5">
        <h3 className="text-lg font-bold mt-4 mb-4">PackInput JSON</h3>
        <textarea
          value={jsonInput}
          onChange={(e) => handleJsonChange(e.target.value)}
          className={`w-full h-72 font-mono text-xs p-2.5 rounded ${
            parseError ? "border-2 border-red-600" : "border border-gray-300"
          }`}
          placeholder="Paste your PackInput JSON here..."
        />
        {parseError && (
          <div className="text-red-600 mt-1.5 text-sm">
            JSON Parse Error: {parseError}
          </div>
        )}
      </div>

      {/* Control Panel */}
      {packSolver && (
        <div className="mb-5 p-4 border border-gray-300 rounded bg-gray-50">
          <div className="mb-4">
            <strong>Iterations: {packSolver.iterations}</strong>
            {packSolver.solved && (
              <span className="ml-2.5 text-green-600 font-bold">✓ Solved</span>
            )}
          </div>

          <div className="flex gap-2.5 flex-wrap">
            <button
              onClick={handleStep}
              disabled={packSolver.solved}
              className={`py-2 px-4 text-white border-0 rounded ${
                packSolver.solved
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 cursor-pointer hover:bg-blue-700"
              }`}
            >
              Step
            </button>

            <button
              onClick={handleSolve}
              disabled={packSolver.solved}
              className={`py-2 px-4 text-white border-0 rounded ${
                packSolver.solved
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-600 cursor-pointer hover:bg-green-700"
              }`}
            >
              Solve
            </button>

            <button
              onClick={handleReset}
              className="py-2 px-4 bg-gray-600 text-white border-0 rounded cursor-pointer hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Visualization */}
      {packSolver && (
        <div>
          <h3 className="text-lg font-bold mt-4 mb-4">Current Packing State</h3>
          <InteractiveGraphics graphics={packSolver.visualize()} />
        </div>
      )}

      {!parsedPackInput && (
        <div className="text-gray-500 italic mt-5">
          Please provide valid PackInput JSON to begin debugging.
        </div>
      )}
    </div>
  )
}
