import { useState, useReducer } from "react"
import type { Point } from "@tscircuit/math-utils"
import { InteractiveGraphics } from "graphics-debug/react"
import { OutlineSegmentCandidatePointSolver } from "../../lib/OutlineSegmentCandidatePointSolver/OutlineSegmentCandidatePointSolver"
import type { InputComponent, PackedComponent } from "../../lib/types"

interface OutlineSegmentCandidatePointDebuggerProps {
  title?: string
  description?: string
  outlineSegment: [Point, Point]
  fullOutline: [Point, Point][]
  componentToPack: InputComponent
  packedComponents: PackedComponent[]
  minGap: number
  defaultPackStrategy?:
    | "minimum_sum_distance_to_network"
    | "minimum_sum_squared_distance_to_network"
  showViableBounds?: boolean
  showLegend?: boolean
}

export function OutlineSegmentCandidatePointDebugger({
  title = "OutlineSegmentCandidatePointSolver",
  description,
  outlineSegment,
  fullOutline,
  componentToPack,
  packedComponents,
  minGap,
  defaultPackStrategy = "minimum_sum_distance_to_network",
  showViableBounds = false,
  showLegend = false,
}: OutlineSegmentCandidatePointDebuggerProps) {
  const [solver, setSolver] =
    useState<OutlineSegmentCandidatePointSolver | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [packStrategy, setPackStrategy] = useState<
    | "minimum_sum_distance_to_network"
    | "minimum_sum_squared_distance_to_network"
  >(defaultPackStrategy)
  const [componentRotationDegrees, setComponentRotationDegrees] = useState<
    0 | 90 | 180 | 270
  >(0)
  const [, incRunCount] = useReducer((c) => c + 1, 0)

  const runSolver = () => {
    setIsRunning(true)

    const newSolver = new OutlineSegmentCandidatePointSolver({
      outlineSegment,
      fullOutline,
      componentRotationDegrees,
      packStrategy,
      minGap,
      packedComponents,
      componentToPack,
    })

    setSolver(newSolver)

    const stepSolver = () => {
      if (newSolver.solved || newSolver.failed) {
        setIsRunning(false)
        incRunCount()
        return
      }

      newSolver.step()
      incRunCount()

      if (!newSolver.solved && !newSolver.failed) {
        setTimeout(stepSolver, 100)
      } else {
        setIsRunning(false)
      }
    }

    stepSolver()
  }

  const reset = () => {
    setSolver(null)
    setIsRunning(false)
    incRunCount()
  }

  const totalDistance = solver?.irlsSolver?.getTotalDistance() ?? 0

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg p-6 shadow-lg">
      {title && (
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          {title}
        </h1>
      )}

      {description && (
        <div className="mb-4 text-sm text-gray-600">
          <p>{description}</p>
        </div>
      )}

      <div className="flex justify-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="packStrategy" className="text-sm font-medium">
            Pack Strategy:
          </label>
          <select
            id="packStrategy"
            value={packStrategy}
            onChange={(e) => setPackStrategy(e.target.value as any)}
            disabled={isRunning}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="minimum_sum_distance_to_network">
              Minimum Sum Distance
            </option>
            <option value="minimum_sum_squared_distance_to_network">
              Minimum Sum Squared Distance
            </option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="componentRotation" className="text-sm font-medium">
            Rotation:
          </label>
          <select
            id="componentRotation"
            value={componentRotationDegrees}
            onChange={(e) =>
              setComponentRotationDegrees(
                Number(e.target.value) as 0 | 90 | 180 | 270,
              )
            }
            disabled={isRunning}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={0}>0°</option>
            <option value={90}>90°</option>
            <option value={180}>180°</option>
            <option value={270}>270°</option>
          </select>
        </div>

        <button
          onClick={runSolver}
          disabled={isRunning}
          className="px-4 py-2 bg-green-500 text-white border-none rounded cursor-pointer text-sm transition-colors hover:bg-green-600 disabled:bg-gray-400"
        >
          {isRunning ? "Running..." : "Run Solver"}
        </button>

        <button
          onClick={() => {
            if (!solver) {
              const newSolver = new OutlineSegmentCandidatePointSolver({
                outlineSegment,
                fullOutline,
                componentRotationDegrees,
                packStrategy,
                minGap,
                packedComponents,
                componentToPack,
              })
              setSolver(newSolver)
            }
            if (solver && !solver.solved && !solver.failed) {
              solver.step()
              incRunCount()
            }
          }}
          disabled={isRunning || solver?.solved || solver?.failed}
          className="px-4 py-2 bg-blue-500 text-white border-none rounded cursor-pointer text-sm transition-colors hover:bg-blue-600 disabled:bg-gray-400"
        >
          Step
        </button>

        <button
          onClick={reset}
          disabled={isRunning}
          className="px-4 py-2 bg-red-500 text-white border-none rounded cursor-pointer text-sm transition-colors hover:bg-red-600 disabled:bg-gray-400"
        >
          Reset
        </button>
      </div>

      <div
        className="border-2 border-gray-800 mx-auto"
        style={{ maxWidth: "600px" }}
      >
        {solver && <InteractiveGraphics graphics={solver.visualize()} />}
      </div>

      <div className="flex justify-center gap-8 mt-4 text-sm">
        <div>
          <strong>Status:</strong>{" "}
          <span
            className={`${
              solver?.solved
                ? "text-green-600"
                : solver?.failed
                  ? "text-red-600"
                  : isRunning
                    ? "text-blue-600"
                    : "text-gray-600"
            }`}
          >
            {solver?.solved
              ? "Solved"
              : solver?.failed
                ? "Failed"
                : isRunning
                  ? "Running"
                  : "Ready"}
          </span>
        </div>
        <div>
          <strong>Iterations:</strong>{" "}
          <span className="text-blue-600">{solver?.iterations ?? 0}</span>
        </div>
        <div>
          <strong>Total Distance:</strong>{" "}
          <span className="text-green-600">{totalDistance.toFixed(2)}</span>
        </div>
        <div className="text-red-600">Error: {solver?.error}</div>
        {showViableBounds && (
          <div>
            <strong>Viable Bounds:</strong>{" "}
            <pre>{JSON.stringify(solver?.viableBounds, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
