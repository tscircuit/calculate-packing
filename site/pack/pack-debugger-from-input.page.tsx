import React, { useState } from "react"
import type { PackInput } from "../../lib/types"
import { PackDebugger } from "../components/PackDebugger"

const defaultPackInput: PackInput = {
  components: [
    {
      componentId: "U1",
      pads: [
        {
          padId: "U1_P1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -4, y: 2 },
          size: { x: 1, y: 1 },
        },
        {
          padId: "U1_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: -4, y: -2 },
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
          offset: { x: 4, y: 0 },
          size: { x: 1, y: 1 },
        },
        {
          padId: "U2_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: 4, y: 4 },
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

const defaultJson = JSON.stringify(defaultPackInput, null, 2)

const PackDebuggerFromInputPage = () => {
  const [jsonInput, setJsonInput] = useState(defaultJson)
  const [parseError, setParseError] = useState<string | null>(null)
  const [packInput, setPackInput] = useState<PackInput | null>(defaultPackInput)

  const handleJsonChange = (value: string) => {
    setJsonInput(value)
    try {
      const parsed = JSON.parse(value) as PackInput
      setPackInput(parsed)
      setParseError(null)
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : "Invalid PackInput JSON",
      )
    }
  }

  const handleReset = () => {
    setJsonInput(defaultJson)
    setPackInput(defaultPackInput)
    setParseError(null)
  }

  return (
    <div className="p-5 grid gap-5">
      <header>
        <h2 className="text-2xl font-bold mt-5 mb-5">
          Pack Debugger from PackInput JSON
        </h2>
        <p className="max-w-prose text-gray-600 mt-4 mb-4">
          Paste a <code>PackInput</code> JSON payload into the editor below to
          inspect it in the interactive debugger.
        </p>
      </header>

      <section>
        <div className="flex gap-3 mb-3">
          <button
            onClick={handleReset}
            className="py-2 px-4 bg-gray-600 text-white border-0 rounded cursor-pointer hover:bg-gray-700"
          >
            Reset to sample input
          </button>
        </div>
        <textarea
          value={jsonInput}
          onChange={(event) => handleJsonChange(event.target.value)}
          spellCheck={false}
          className={`w-full min-h-64 font-mono text-xs p-3 rounded-md box-border ${
            parseError ? "border-2 border-red-600" : "border border-gray-300"
          }`}
        />
        {parseError && <div className="text-red-600 mt-2">{parseError}</div>}
      </section>

      {packInput ? (
        <section>
          <PackDebugger initialPackInput={packInput} title="Pack Debugger" />
        </section>
      ) : (
        <section className="text-gray-500 italic">
          Provide valid <code>PackInput</code> JSON to display the debugger.
        </section>
      )}
    </div>
  )
}

export default PackDebuggerFromInputPage
