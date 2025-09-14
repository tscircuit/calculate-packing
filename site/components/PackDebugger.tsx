import { InteractiveGraphics } from "graphics-debug/react"
import type { PackInput, PackOutput } from "../../lib/types"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import { convertPackOutputToPackInput } from "../../lib/plumbing/convertPackOutputToPackInput"
import { useMemo, useReducer, useState, useRef, useEffect } from "react"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import type { BaseSolver } from "../../lib/solver-utils/BaseSolver"

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
        <div style={{ marginBottom: "10px" }}>
          <strong>Active Solvers:</strong>{" "}
          <span
            style={{
              fontFamily: "monospace",
              backgroundColor: "#f5f5f5",
              padding: "2px 6px",
              borderRadius: "3px",
              fontSize: "0.9em",
            }}
          >
            {solverBreadcrumb.join(" → ")}
          </span>
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
            marginRight: "10px",
          }}
        >
          Step
        </button>
        <button
          onClick={handleAnimateToggle}
          style={{
            padding: "8px 16px",
            backgroundColor: isAnimating ? "#dc3545" : "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          {isAnimating ? "Stop" : "Animate"}
        </button>
        <button
          onClick={() => downloadConstructorParams(deepestSolver)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          title={`Download constructor parameters for ${deepestSolver.constructor.name}`}
        >
          Download {deepestSolver.constructor.name} Parameters
        </button>
      </div>

      {/* Automatic Pack Visualization */}
      <h3>Automatic Pack Visualization</h3>
      <InteractiveGraphics
        key={`iter${packSolver.iterations >= 2}`}
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
