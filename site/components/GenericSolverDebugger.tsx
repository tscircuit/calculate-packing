import { InteractiveGraphics } from "graphics-debug/react"
import { useMemo, useReducer, useState, useRef, useEffect } from "react"
import type { BaseSolver } from "../../lib/solver-utils/BaseSolver"

interface GenericSolverDebuggerProps {
  solver: BaseSolver
  title?: string
}

function buildSolverBreadcrumb(solver: BaseSolver): string[] {
  const formatSolverName = (s: BaseSolver): string => {
    let name = s.constructor.name
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

function findDeepestActiveSolver(solver: BaseSolver): BaseSolver {
  let current = solver
  while (current.activeSubSolver && current.activeSubSolver !== null) {
    current = current.activeSubSolver
  }
  return current
}

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

export const GenericSolverDebugger = ({
  solver,
  title = "Generic Solver Debugger",
}: GenericSolverDebuggerProps) => {
  const [runCount, incRunCount] = useReducer((c) => c + 1, 0)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const solverBreadcrumb = buildSolverBreadcrumb(solver)
  const deepestSolver = findDeepestActiveSolver(solver)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleAnimateToggle = () => {
    if (isAnimating) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsAnimating(false)
    } else {
      intervalRef.current = setInterval(() => {
        solver.step()
        incRunCount()
      }, 1000 / 40)
      setIsAnimating(true)
    }
  }

  return (
    <div>
      <h2>{title}</h2>

      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <strong>Solver:</strong> {solver.constructor.name}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>Iterations:</strong> {solver.iterations}
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
            solver.step()
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

      <h3>Solver Visualization</h3>
      <InteractiveGraphics
        key={`iter${solver.iterations >= 2}`}
        graphics={solver.visualize()}
      />
    </div>
  )
}
