import { useState, useReducer } from "react"
import { InteractiveGraphics } from "graphics-debug/react"
import type { GraphicsObject } from "graphics-debug"
import { OutlineSegmentCandidatePointSolver } from "../../lib/OutlineSegmentCandidatePointSolver.ts/OutlineSegmentCandidatePointSolver"
import type { Point } from "@tscircuit/math-utils"
import type { InputComponent, PackedComponent } from "../../lib/types"

export default function OutlineSegmentCandidatePointSolverExample() {
  const [solver, setSolver] =
    useState<OutlineSegmentCandidatePointSolver | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [packStrategy, setPackStrategy] = useState<
    | "minimum_sum_distance_to_network"
    | "minimum_sum_squared_distance_to_network"
  >("minimum_sum_distance_to_network")
  const [componentRotationDegrees, setComponentRotationDegrees] = useState<
    0 | 90 | 180 | 270
  >(0)
  const [runCount, incRunCount] = useReducer((c) => c + 1, 0)

  // Define a simple example scenario
  const outlineSegment: [Point, Point] = [
    { x: 100, y: 200 },
    { x: 500, y: 200 },
  ]

  // Define the full outline containing the segment
  const fullOutline: [Point, Point][] = [
    [
      { x: 100, y: 200 },
      { x: 500, y: 200 },
    ], // top edge (our segment)
    [
      { x: 500, y: 200 },
      { x: 500, y: 300 },
    ],
    [
      { x: 500, y: 300 },
      { x: 600, y: 300 },
    ],
    [
      { x: 600, y: 300 },
      { x: 600, y: 50 },
    ],
    [
      { x: 600, y: 50 },
      { x: 100, y: 50 },
    ], // bottomedge
    [
      { x: 100, y: 50 },
      { x: 100, y: 200 },
    ], // left edge
  ]

  const componentToPack: InputComponent = {
    componentId: "U2",
    pads: [
      {
        padId: "U2.1",
        networkId: "VCC",
        type: "rect",
        offset: { x: -10, y: 0 },
        size: { x: 4, y: 4 },
      },
      {
        padId: "U2.2",
        networkId: "GND",
        type: "rect",
        offset: { x: 10, y: 0 },
        size: { x: 4, y: 4 },
      },
      {
        padId: "U2_body",
        networkId: "U2-disconnected-body",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 25, y: 15 },
      },
    ],
  }

  const packedComponents: PackedComponent[] = [
    {
      componentId: "U1",
      center: { x: 150, y: 100 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "U1.1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -5, y: 0 },
          size: { x: 4, y: 4 },
          absoluteCenter: { x: 145, y: 100 },
        },
        {
          padId: "U1.2",
          networkId: "GND",
          type: "rect",
          offset: { x: 5, y: 0 },
          size: { x: 4, y: 4 },
          absoluteCenter: { x: 155, y: 100 },
        },
      ],
    },
    {
      componentId: "C1",
      center: { x: 400, y: 150 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "C1.1",
          networkId: "VCC",
          type: "rect",
          offset: { x: 0, y: -8 },
          size: { x: 4, y: 4 },
          absoluteCenter: { x: 400, y: 142 },
        },
        {
          padId: "C1.2",
          networkId: "GND",
          type: "rect",
          offset: { x: 0, y: 8 },
          size: { x: 4, y: 4 },
          absoluteCenter: { x: 400, y: 158 },
        },
      ],
    },
  ]

  const runSolver = () => {
    setIsRunning(true)

    const newSolver = new OutlineSegmentCandidatePointSolver({
      outlineSegment,
      fullOutline,
      componentRotationDegrees,
      packStrategy,
      minGap: 1,
      packedComponents,
      componentToPack,
    })

    setSolver(newSolver)

    // Run solver step by step to show animation
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
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
        OutlineSegmentCandidatePointSolver Example
      </h1>

      <div className="mb-4 text-sm text-gray-600">
        <p>
          This example shows how the OutlineSegmentCandidatePointSolver finds
          the optimal position for a component on an outline segment.
        </p>
        <p>
          The solver uses the IRLS/Weiszfeld algorithm to minimize connection
          distances to existing components with shared networks.
        </p>
      </div>

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
                minGap: 1,
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
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Legend:</strong>
            <ul className="list-disc list-inside">
              <li>
                <span className="text-red-500">●</span> VCC Network
              </li>
              <li>
                <span className="text-teal-500">●</span> GND Network
              </li>
              <li>
                <span className="text-blue-500">—</span> Outline Segment
              </li>
              <li>
                <span className="text-green-500">●</span> Optimal Position
              </li>
            </ul>
          </div>
          <div>
            <strong>Components:</strong>
            <ul className="list-disc list-inside">
              <li>U1: Already placed component</li>
              <li>C1: Already placed capacitor</li>
              <li>U2: Component to be placed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
