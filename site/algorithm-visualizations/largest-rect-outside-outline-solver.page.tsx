// @ts-nocheck
import React, { useMemo, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  LargestRectOutsideOutlineFromPointSolver,
  type Point,
  type Rect,
  type GlobalBounds,
} from "../../lib/LargestRectOutsideOutlineFromPointSolver"

// Visualization for the LargestRectOutsideOutlineFromPointSolver class
// Shows how the solver finds the largest rectangle outside a polygon outline that contains a given point

// ---------------------------- Types ----------------------------

type Seg = { a: Point; b: Point }

// ----------------------- Sample Polygons -----------------------
// All polygons are simple, closed, counter-clockwise, rectilinear (right-angled).
const samples: { name: string; poly: Point[]; start: Point }[] = [
  {
    name: "Cave Room (with notches)",
    poly: [
      { x: 20, y: 20 },
      { x: 420, y: 20 },
      { x: 420, y: 120 },
      { x: 360, y: 120 },
      { x: 360, y: 60 },
      { x: 300, y: 60 },
      { x: 300, y: 200 },
      { x: 420, y: 200 },
      { x: 420, y: 320 },
      { x: 20, y: 320 },
      { x: 20, y: 200 },
      { x: 120, y: 200 },
      { x: 120, y: 260 },
      { x: 180, y: 260 },
      { x: 180, y: 120 },
      { x: 20, y: 120 },
    ],
    start: { x: 450, y: 170 }, // Point outside the outline
  },
  {
    name: "Simple Rectangle",
    poly: [
      { x: 100, y: 100 },
      { x: 300, y: 100 },
      { x: 300, y: 250 },
      { x: 100, y: 250 },
    ],
    start: { x: 50, y: 175 }, // Point to the left of the rectangle
  },
  {
    name: "L-Shape",
    poly: [
      { x: 80, y: 80 },
      { x: 280, y: 80 },
      { x: 280, y: 180 },
      { x: 180, y: 180 },
      { x: 180, y: 280 },
      { x: 80, y: 280 },
    ],
    start: { x: 350, y: 130 }, // Point to the right of the L-shape
  },
  {
    name: "Staircase",
    poly: [
      { x: 40, y: 40 },
      { x: 420, y: 40 },
      { x: 420, y: 100 },
      { x: 360, y: 100 },
      { x: 360, y: 160 },
      { x: 300, y: 160 },
      { x: 300, y: 220 },
      { x: 240, y: 220 },
      { x: 240, y: 280 },
      { x: 40, y: 280 },
      { x: 40, y: 40 },
    ],
    start: { x: 500, y: 180 }, // Point to the right of the staircase
  },
]

// ------------------------ Geometry Utils -----------------------

function almostEqual(a: number, b: number, eps = 1e-9) {
  return Math.abs(a - b) <= eps
}

function makeEdges(poly: Point[]): Seg[] {
  const edges: Seg[] = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % poly.length]!
    // skip zero-length
    if (almostEqual(a.x, b.x) && almostEqual(a.y, b.y)) continue
    edges.push({ a, b })
  }
  return edges
}

function isVertical(e: Seg) {
  return almostEqual(e.a.x, e.b.x)
}

// Even–odd rule: check if point is inside polygon
function scanlineIntervalsAtY(edges: Seg[], y0: number): [number, number][] {
  const xs: number[] = []
  for (const e of edges) {
    if (!isVertical(e)) continue
    const y1 = e.a.y,
      y2 = e.b.y,
      x = e.a.x
    const ymin = Math.min(y1, y2)
    const ymax = Math.max(y1, y2)
    // half-open: include ymin <= y0 < ymax
    if (ymin <= y0 && y0 < ymax) {
      xs.push(x)
    }
  }
  xs.sort((a, b) => a - b)
  const intervals: [number, number][] = []
  for (let i = 0; i + 1 < xs.length; i += 2) {
    intervals.push([xs[i], xs[i + 1]])
  }
  return intervals
}

function pointInPolygonOrth(edges: Seg[], p: Point) {
  const ints = scanlineIntervalsAtY(edges, p.y)
  for (const [L, R] of ints) if (L - 1e-9 <= p.x && p.x <= R + 1e-9) return true
  return false
}

// -------------------------- React UI --------------------------

export default function LargestRectOutsideOutlineSolverDemo() {
  const [idx, setIdx] = useState(0)
  const [showSolverInfo, setShowSolverInfo] = useState(false)

  const sample = samples[idx]
  const edges = useMemo(() => makeEdges(sample.poly), [idx])

  const [p, setP] = useState<Point>(sample.start)
  // reset point if polygon changes
  React.useEffect(() => setP(samples[idx].start), [idx])

  const globalBounds: GlobalBounds = { minX: 0, maxX: 600, minY: 0, maxY: 400 }

  const inPoly = useMemo(() => pointInPolygonOrth(edges, p), [edges, p])

  // Use the solver to find the largest rectangle
  const solverResult = useMemo(() => {
    const solver = new LargestRectOutsideOutlineFromPointSolver(
      sample.poly,
      p,
      globalBounds,
    )
    const rect = solver.getLargestRect()
    return {
      rect,
      solver,
      solved: solver.solved,
      failed: solver.failed,
      iterations: solver.iterations,
      timeToSolve: solver.timeToSolve,
    }
  }, [sample.poly, p, globalBounds])

  const onDrag = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget
      const rect = svg.getBoundingClientRect()
      const x = Math.max(
        globalBounds.minX,
        Math.min(globalBounds.maxX, e.clientX - rect.left),
      )
      const y = Math.max(
        globalBounds.minY,
        Math.min(globalBounds.maxY, e.clientY - rect.top),
      )
      setP({ x, y })
    },
    [globalBounds],
  )

  return (
    <div className="w-full h-full p-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <div className="p-3 bg-white rounded-2xl shadow border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">
                LargestRectOutsideOutlineFromPointSolver
              </h2>
              <div className="flex items-center gap-2">
                <select
                  className="border rounded-xl px-2 py-1 text-sm"
                  value={idx}
                  onChange={(e) => setIdx(Number(e.target.value))}
                >
                  {samples.map((s, i) => (
                    <option key={i} value={i}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showSolverInfo}
                    onChange={(e) => setShowSolverInfo(e.target.checked)}
                  />
                  Show solver info
                </label>
              </div>
            </div>

            <svg
              viewBox={`0 0 ${globalBounds.maxX} ${globalBounds.maxY}`}
              className="w-full aspect-[3/2] bg-slate-50 rounded-xl border cursor-crosshair"
              onMouseDown={onDrag}
              onMouseMove={(e) => e.buttons === 1 && onDrag(e)}
            >
              {/* Global bounds outline */}
              <rect
                x={globalBounds.minX}
                y={globalBounds.minY}
                width={globalBounds.maxX - globalBounds.minX}
                height={globalBounds.maxY - globalBounds.minY}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth={1}
                strokeDasharray="5 5"
              />

              {/* Polygon fill */}
              <polygon
                points={sample.poly.map((pt) => `${pt.x},${pt.y}`).join(" ")}
                fill="#f1f5f9"
                stroke="#334155"
                strokeWidth={2}
                opacity={0.8}
              />

              {/* Largest rectangle from solver */}
              {solverResult.rect &&
                solverResult.rect.w > 0 &&
                solverResult.rect.h > 0 && (
                  <motion.rect
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 0.8, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    x={solverResult.rect.x}
                    y={solverResult.rect.y}
                    width={solverResult.rect.w}
                    height={solverResult.rect.h}
                    fill="#fbbf24"
                    stroke="#d97706"
                    strokeWidth={2}
                    rx={4}
                  />
                )}

              {/* Origin point */}
              <g>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={6}
                  fill={inPoly ? "#ef4444" : "#10b981"}
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />
                <text x={p.x + 10} y={p.y - 10} fontSize={12} fill="#0f172a">
                  origin ({p.x.toFixed(0)}, {p.y.toFixed(0)})
                </text>
              </g>

              {/* Status indicator */}
              {solverResult.failed && (
                <text
                  x={10}
                  y={30}
                  fontSize={14}
                  fill="#dc2626"
                  fontWeight="bold"
                >
                  SOLVER FAILED
                </text>
              )}
            </svg>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-3">
          <div className="p-3 bg-white rounded-2xl shadow border">
            <h3 className="text-lg font-semibold mb-2">How the Solver Works</h3>
            <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">
              <li>Extends BaseSolver with iterative solving approach</li>
              <li>Converts the outline into horizontal/vertical segments</li>
              <li>
                Uses scanline algorithm to find regions outside the polygon
              </li>
              <li>
                Partitions the horizontal corridor into x-slabs at vertical
                edges
              </li>
              <li>Shoots vertical rays to find local top/bottom bounds</li>
              <li>
                Enumerates consecutive slab runs containing the origin point
              </li>
              <li>Returns the run with maximum area as the result rectangle</li>
            </ol>
          </div>

          <div className="p-3 bg-white rounded-2xl shadow border">
            <h3 className="text-lg font-semibold mb-2">Solver Results</h3>
            <div className="text-sm text-slate-700 space-y-2">
              <p>
                <strong>Status:</strong>{" "}
                <span className={inPoly ? "text-red-600" : "text-green-600"}>
                  {inPoly
                    ? "Point is inside polygon (drag outside for results)"
                    : "Point is outside polygon"}
                </span>
              </p>
              <p>
                <strong>Solver Status:</strong>{" "}
                <span
                  className={
                    solverResult.failed ? "text-red-600" : "text-green-600"
                  }
                >
                  {solverResult.failed
                    ? "Failed"
                    : solverResult.solved
                      ? "Solved"
                      : "Running"}
                </span>
              </p>
              {solverResult.rect ? (
                <>
                  <p>
                    <strong>Rectangle:</strong>{" "}
                    <code>
                      ({solverResult.rect.x.toFixed(1)},{" "}
                      {solverResult.rect.y.toFixed(1)})
                    </code>{" "}
                    • w=<code>{solverResult.rect.w.toFixed(1)}</code>, h=
                    <code>{solverResult.rect.h.toFixed(1)}</code>
                  </p>
                  <p>
                    <strong>Area:</strong>{" "}
                    <code>
                      {(solverResult.rect.w * solverResult.rect.h).toFixed(1)}
                    </code>
                  </p>
                </>
              ) : (
                <p>
                  <strong>Rectangle:</strong> None found
                </p>
              )}
              {showSolverInfo && (
                <>
                  <p>
                    <strong>Iterations:</strong> {solverResult.iterations}
                  </p>
                  {solverResult.timeToSolve !== undefined && (
                    <p>
                      <strong>Solve Time:</strong> {solverResult.timeToSolve}ms
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="p-3 bg-white rounded-2xl shadow border">
            <h3 className="text-lg font-semibold mb-2">
              Implementation Details
            </h3>
            <div className="text-sm text-slate-700 space-y-2">
              <p>
                This solver is built on the BaseSolver framework used throughout
                the calculate-packing library. It provides a clean interface for
                finding the largest axis-aligned rectangle outside a polygon
                outline.
              </p>
              <p>
                <strong>Constructor Parameters:</strong>
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>
                  <code>fullOutline</code>: Array of points defining the polygon
                </li>
                <li>
                  <code>origin</code>: Point that must be contained in result
                </li>
                <li>
                  <code>globalBounds</code>: Bounding limits (minX, maxX, minY,
                  maxY)
                </li>
              </ul>
              <p>
                The solver uses an efficient O(n²) algorithm where n is the
                number of vertical edges intersecting the horizontal corridor at
                the origin's y-coordinate.
              </p>
              <p className="text-xs text-slate-500">
                Drag the origin point around to see how the solver adapts to
                find the optimal rectangle for different positions. Points
                inside the polygon will not produce results since we're looking
                for rectangles in the outside region.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
