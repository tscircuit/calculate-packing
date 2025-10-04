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
    <div style={{ padding: "20px", display: "grid", gap: "20px" }}>
      <header>
        <h2>Pack Debugger from PackInput JSON</h2>
        <p style={{ maxWidth: "60ch", color: "#444" }}>
          Paste a <code>PackInput</code> JSON payload into the editor below to
          inspect it in the interactive debugger.
        </p>
      </header>

      <section>
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
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
            Reset to sample input
          </button>
        </div>
        <textarea
          value={jsonInput}
          onChange={(event) => handleJsonChange(event.target.value)}
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: "260px",
            fontFamily: "monospace",
            fontSize: "12px",
            padding: "12px",
            borderRadius: "6px",
            border: parseError ? "2px solid #d9534f" : "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />
        {parseError && (
          <div style={{ color: "#d9534f", marginTop: "8px" }}>{parseError}</div>
        )}
      </section>

      {packInput ? (
        <section>
          <PackDebugger initialPackInput={packInput} title="Pack Debugger" />
        </section>
      ) : (
        <section style={{ color: "#666", fontStyle: "italic" }}>
          Provide valid <code>PackInput</code> JSON to display the debugger.
        </section>
      )}
    </div>
  )
}

export default PackDebuggerFromInputPage
