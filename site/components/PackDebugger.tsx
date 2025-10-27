import { InteractiveGraphics } from "graphics-debug/react"
import type { PackInput, PackOutput } from "../../lib/types"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import { convertPackOutputToPackInput } from "../../lib/plumbing/convertPackOutputToPackInput"
import { useMemo, useReducer, useState, useRef, useEffect, use } from "react"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import type { BaseSolver } from "@tscircuit/solver-utils"

type SolverType = "PhasedPackSolver" | "PackSolver2"

interface PackDebuggerProps {
  initialPackOutput?: PackOutput
  initialPackInput?: PackInput
  title?: string
}

// Function to build breadcrumb of active sub-solvers
function buildSolverBreadcrumb(solver: BaseSolver): string[] {
  const formatSolverName = (s: BaseSolver): string => {
    let name = s.constructor.name
    // Check if solver has currentPhase property
    if ("currentPhase" in s && s.currentPhase) {
      name += ` (${s.currentPhase})`
    }
    return name
  }

  const breadcrumb: string[] = [formatSolverName(solver)]

  let current = solver.activeSubSolver
  while (current && current !== null) {
    breadcrumb.push(formatSolverName(current))
    current = current.activeSubSolver
  }

  return breadcrumb
}

// Function to find the deepest active sub-solver
function findDeepestActiveSolver(solver: BaseSolver): BaseSolver {
  let current = solver
  while (current.activeSubSolver && current.activeSubSolver !== null) {
    current = current.activeSubSolver
  }
  return current
}

// Function to download constructor parameters as JSON
function downloadConstructorParams(solver: BaseSolver) {
  try {
    const params = solver.getConstructorParams()
    const blob = new Blob([JSON.stringify(params, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${solver.constructor.name}_constructor_params.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    alert(`Failed to get constructor parameters: ${error}`)
  }
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
  const [runCount, incRunCount] = useReducer((c) => c + 1, 0)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const packSolver = useMemo(() => {
    // TODO base on selectedSolver
    return new PackSolver2(packInput)
  }, [selectedSolver, packInput])

  const solverBreadcrumb = buildSolverBreadcrumb(packSolver)
  const deepestSolver = findDeepestActiveSolver(packSolver)

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

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

  const handleAnimateToggle = () => {
    if (isAnimating) {
      // Stop animation
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsAnimating(false)
    } else {
      // Start animation at 40 iterations per second
      intervalRef.current = setInterval(() => {
        packSolver.step()
        incRunCount()
      }, 1000 / 40)
      setIsAnimating(true)
    }
  }

  return (
    <div className="m-2">
      <h2 className="text-2xl font-bold mt-5 mb-5">{title}</h2>

      {/* Control Panel */}
      <div className="mb-5 p-2.5 border border-gray-300 rounded">
        <div className="mb-2.5">
          <label className="mr-2.5">
            <strong>Solver:</strong>
          </label>
          <select
            value={selectedSolver}
            onChange={(e) => setSelectedSolver(e.target.value as SolverType)}
            className="py-1 px-2 rounded border border-gray-300 mr-5"
          >
            <option value="PhasedPackSolver">PhasedPackSolver</option>
            <option value="PackSolver2">PackSolver2</option>
          </select>
        </div>
        <div className="mb-2.5">
          <strong>Iterations:</strong> {packSolver.iterations}
        </div>
        <div className="mb-2.5">
          <strong>Active Solvers:</strong>{" "}
          <span className="font-mono bg-gray-100 py-0.5 px-1.5 rounded text-sm">
            {solverBreadcrumb.join(" → ")}
          </span>
        </div>
        <button
          onClick={() => {
            packSolver.step()
            incRunCount()
          }}
          className="py-2 px-4 bg-blue-600 text-white border-0 rounded cursor-pointer mr-2.5 hover:bg-blue-700"
        >
          Step
        </button>
        <button
          onClick={handleAnimateToggle}
          className={`py-2 px-4 text-white border-0 rounded cursor-pointer mr-2.5 ${
            isAnimating
              ? "bg-red-600 hover:bg-red-700"
              : "bg-cyan-600 hover:bg-cyan-700"
          }`}
        >
          {isAnimating ? "Stop" : "Animate"}
        </button>
        <button
          onClick={() => downloadConstructorParams(deepestSolver)}
          className="py-2 px-4 bg-green-600 text-white border-0 rounded cursor-pointer hover:bg-green-700"
          title={`Download constructor parameters for ${deepestSolver.constructor.name}`}
        >
          Download {deepestSolver.constructor.name} Parameters
        </button>
      </div>

      {/* Automatic Pack Visualization */}
      <h3 className="text-lg font-bold mt-5 mb-5">
        Automatic Pack Visualization
      </h3>
      <InteractiveGraphics
        key={`iter${packSolver.iterations >= 2}`}
        graphics={packSolver.visualize()}
      />

      {/* Manual Pack Output (collapsible) */}
      {initialPackOutput && (
        <details className="mt-5">
          <summary>Manual Pack Output</summary>
          <InteractiveGraphics
            graphics={getGraphicsFromPackOutput(initialPackOutput)}
          />
        </details>
      )}
    </div>
  )
}
