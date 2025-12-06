import React, { useMemo, useState } from "react"
import type { PackInput } from "../../lib/types"
import { PackDebugger } from "../components/PackDebugger"

const samplePackInput: PackInput = {
  components: [
    {
      componentId: "U1",
      pads: [
        {
          padId: "U1_P1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -4, y: 0 },
          size: { x: 1, y: 1 },
        },
        {
          padId: "U1_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: 4, y: 0 },
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
          offset: { x: -4, y: 2 },
          size: { x: 1, y: 1 },
        },
        {
          padId: "U2_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: 4, y: -2 },
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

const WelcomeFixture = () => {
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(samplePackInput, null, 2),
  )
  const [packInput, setPackInput] = useState<PackInput | null>(samplePackInput)

  const parseResult = useMemo(() => {
    try {
      return {
        value: JSON.parse(jsonInput) as PackInput,
        error: null,
      }
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Invalid JSON",
      }
    }
  }, [jsonInput])

  const parsedPackInput = parseResult.value
  const parseError = parseResult.error

  const handleReset = () => {
    const defaultJson = JSON.stringify(samplePackInput, null, 2)
    setJsonInput(defaultJson)
    setPackInput(samplePackInput)
  }

  const handleApply = () => {
    setPackInput(parsedPackInput)
  }

  return (
    <div className="p-5 grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold">Welcome to the Pack Debugger</h1>
        <p className="text-gray-700 max-w-prose">
          Paste a <code>PackInput</code> JSON payload below and explore it with
          the <strong>PackSolver2</strong> debugger. This fixture sits at the
          top of the catalog for quick access when experimenting with new
          packing scenarios.
        </p>
        <p className="text-gray-700 max-w-prose">
          The default sample demonstrates two components connected through VCC
          and GND networks. Feel free to tweak the JSON, then click
          <em>Apply JSON</em> to reload the solver.
        </p>
      </div>

      <section className="grid gap-3">
        <div className="flex gap-3 items-center flex-wrap">
          <button
            onClick={handleReset}
            className="py-2 px-4 bg-gray-800 text-white rounded-md cursor-pointer hover:bg-gray-900"
            type="button"
          >
            Reset sample
          </button>
          <button
            onClick={handleApply}
            className="py-2 px-4 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700"
            type="button"
            disabled={!parsedPackInput}
          >
            Apply JSON
          </button>
          <span className="text-sm text-gray-600">
            Parsed with <code>PackSolver2</code> by default for quick debugging.
          </span>
        </div>

        <textarea
          value={jsonInput}
          onChange={(event) => setJsonInput(event.target.value)}
          spellCheck={false}
          className={`w-full min-h-72 font-mono text-xs p-3 rounded-md box-border border ${
            parseError ? "border-red-600" : "border-gray-300"
          }`}
        />
        {parseError && <div className="text-red-600">{parseError}</div>}
      </section>

      <section>
        {packInput ? (
          <PackDebugger
            initialPackInput={packInput}
            title="PackSolver2 Debugger"
            key={JSON.stringify(packInput)}
          />
        ) : (
          <div className="text-gray-500 italic">
            Provide valid <code>PackInput</code> JSON to display the PackSolver2
            debugger.
          </div>
        )}
      </section>
    </div>
  )
}

WelcomeFixture.displayName = "_welcome page"

export default WelcomeFixture
