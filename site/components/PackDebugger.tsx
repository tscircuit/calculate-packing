import React, {
  useEffect,
  useMemo,
  useReducer,
  useState,
  useCallback,
} from "react"
import { InteractiveGraphics } from "graphics-debug/react"
import type { PackInput, PackOutput } from "../../lib/types"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import { convertPackOutputToPackInput } from "../../lib/plumbing/convertPackOutputToPackInput"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import { GenericSolverToolbar } from "@tscircuit/solver-utils/react"

type SolverType = "PhasedPackSolver" | "PackSolver2"
type RendererOption = "vector" | "canvas"

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
    useState<SolverType>("PackSolver2")
  const [renderCount, incRenderCount] = useReducer((x) => x + 1, 0)
  const [renderer, setRenderer] = useState<RendererOption>("vector")
  const [animationSpeed, setAnimationSpeed] = useState(25)

  const packSolver = useMemo(() => {
    // TODO base on selectedSolver
    return new PackSolver2(packInput)
  }, [selectedSolver, packInput])

  const visualization = useMemo(() => {
    try {
      return (
        packSolver.visualize() || {
          points: [],
          lines: [],
          rects: [],
          circles: [],
        }
      )
    } catch (error) {
      console.error("Visualization error:", error)
      return { points: [], lines: [], rects: [], circles: [] }
    }
  }, [packSolver, renderCount])

  const graphicsAreEmpty = useMemo(
    () =>
      (visualization.rects?.length || 0) === 0 &&
      (visualization.lines?.length || 0) === 0 &&
      (visualization.points?.length || 0) === 0 &&
      (visualization.circles?.length || 0) === 0,
    [visualization],
  )

  const handleDownloadVisualization = useCallback(() => {
    const dataStr = JSON.stringify(visualization, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${packSolver.getSolverName()}_visualization.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [visualization, packSolver])

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
    <div>
      {/* Solver Selection */}
      <div className="px-2 py-1">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Solver:</label>
          <select
            value={selectedSolver}
            onChange={(e) => setSelectedSolver(e.target.value as SolverType)}
            className="py-1 px-2 rounded border border-gray-300 text-sm"
          >
            <option value="PhasedPackSolver">PhasedPackSolver</option>
            <option value="PackSolver2">PackSolver2</option>
          </select>
        </div>
      </div>

      {/* GenericSolverToolbar with all controls */}
      <GenericSolverToolbar
        solver={packSolver}
        triggerRender={incRenderCount}
        animationSpeed={animationSpeed}
        renderer={renderer}
        onRendererChange={setRenderer}
        onAnimationSpeedChange={setAnimationSpeed}
        onDownloadVisualization={handleDownloadVisualization}
        onSolverStarted={(solver) => {
          console.log("Pack solver started:", solver)
        }}
        onSolverCompleted={(solver) => {
          console.log("Pack solver completed:", solver)
        }}
      />

      {/* Visualization */}
      {graphicsAreEmpty ? (
        <div className="p-4 text-gray-500">No Graphics Yet</div>
      ) : (
        <InteractiveGraphics graphics={visualization} />
      )}

      {/* Manual Pack Output (collapsible) */}
      {initialPackOutput && (
        <details className="mt-5 p-4">
          <summary className="cursor-pointer font-medium">
            Manual Pack Output
          </summary>
          <div className="mt-2">
            <InteractiveGraphics
              graphics={getGraphicsFromPackOutput(initialPackOutput)}
            />
          </div>
        </details>
      )}
    </div>
  )
}
