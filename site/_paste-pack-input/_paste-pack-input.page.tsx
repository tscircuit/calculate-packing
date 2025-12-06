import React, { useState, useEffect } from "react"
import type { PackInput } from "../../lib/types"
import { PackDebugger } from "../components/PackDebugger"

export default function PastePackInputPage() {
  const [jsonInput, setJsonInput] = useState("")
  const [parseError, setParseError] = useState<string | null>(null)
  const [packInput, setPackInput] = useState<PackInput | null>(null)
  const [loaded, setLoaded] = useState(false)

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
      setPackInput(null)
    }
  }

  const handleLoad = () => {
    if (packInput) {
      setLoaded(true)
    }
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

  if (loaded && packInput) {
    return <PackDebugger initialPackInput={packInput} />
  }

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Paste Pack Input</h1>
      <p className="text-gray-600 mb-4">
        Paste a <code className="bg-gray-100 px-1 rounded">PackInput</code> JSON
        below and click "Load" to debug it with PackSolver2.
      </p>

      <div className="mb-4">
        <textarea
          value={jsonInput}
          onChange={(e) => handleJsonChange(e.target.value)}
          spellCheck={false}
          className={`w-full h-64 font-mono text-xs p-3 rounded border ${
            parseError ? "border-red-500 border-2" : "border-gray-300"
          }`}
          placeholder="Paste PackInput JSON here..."
        />
        {parseError && (
          <div className="text-red-600 text-sm mt-1">{parseError}</div>
        )}
      </div>

      <button
        onClick={handleLoad}
        disabled={!packInput}
        className={`py-2 px-4 rounded text-white ${
          packInput
            ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Load
      </button>
    </div>
  )
}
