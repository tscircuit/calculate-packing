// @ts-nocheck
import React, { useMemo, useState, useCallback } from "react"
import { motion } from "framer-motion"

// Axis-aligned polygon visualization and algorithm demo
// Now supports BOTH: rectangles INSIDE the polygon, or OUTSIDE the polygon
// (in the complement), bounded by a global bounding box (the SVG viewport).
// - Drag the origin point; we compute & draw the largest axis-aligned rectangle
//   that contains the point and stays in the chosen region (inside/outside).
//
// Styling: TailwindCSS is available by default in this environment.
// UI libs are allowed; to keep this self-contained, we only use Framer Motion.

// ---------------------------- Types ----------------------------

type Pt = { x: number; y: number }
type Seg = { a: Pt; b: Pt }
type Rect = { x: number; y: number; w: number; h: number }

type RegionMode = "inside" | "outside"

// ----------------------- Sample Polygons -----------------------
// All polygons are simple, closed, counter-clockwise, rectilinear (right-angled).
const samples: { name: string; poly: Pt[]; start: Pt }[] = [
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
    start: { x: 200, y: 170 },
  },
  {
    name: "Donut (outer + inner hole)",
    poly: [
      // Outer CCW
      { x: 40, y: 40 },
      { x: 520, y: 40 },
      { x: 520, y: 340 },
      { x: 40, y: 340 },
      // Inner hole CW (same ring array; algorithm uses even-odd via scanline)
      { x: 40, y: 40 }, // stitch point back (visual poly remains simple for this demo)
    ],
    // We'll separately add a hole via overlay; see special case below
    start: { x: 200, y: 120 },
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
    start: { x: 150, y: 180 },
  },
]

// For the "Donut" sample, we'll simulate a hole rectangle inside the outer polygon
const donutHole = { x: 200, y: 120, w: 160, h: 120 }

// ------------------------ Geometry Utils -----------------------

function almostEqual(a: number, b: number, eps = 1e-9) {
  return Math.abs(a - b) <= eps
}

function makeEdges(poly: Pt[]): Seg[] {
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
function isHorizontal(e: Seg) {
  return almostEqual(e.a.y, e.b.y)
}

// Even–odd rule: intervals of x where y=y0 is inside the polygon. For orth polygons,
// we intersect with vertical edges only, using the classic half-open rule (exclude upper endpoint).
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

function pointInPolygonOrth(edges: Seg[], p: Pt) {
  const ints = scanlineIntervalsAtY(edges, p.y)
  for (const [L, R] of ints) if (L - 1e-9 <= p.x && p.x <= R + 1e-9) return true
  return false
}

// Clip intervals to [a,b]
function clipIntervals(
  intervals: [number, number][],
  a: number,
  b: number,
): [number, number][] {
  const out: [number, number][] = []
  for (const [L, R] of intervals) {
    const l = Math.max(a, L)
    const r = Math.min(b, R)
    if (r > l) out.push([l, r])
  }
  return out
}

// Given inside-intervals at y, compute free intervals for the chosen region within [bx1,bx2]
function regionIntervalsAtY(
  edges: Seg[],
  y0: number,
  bx1: number,
  bx2: number,
  mode: RegionMode,
): [number, number][] {
  const inside = clipIntervals(scanlineIntervalsAtY(edges, y0), bx1, bx2)
  if (mode === "inside") return inside
  // outside: complement of inside within [bx1,bx2]
  const outs: [number, number][] = []
  let prev = bx1
  for (const [L, R] of inside) {
    if (L > prev) outs.push([prev, L])
    prev = Math.max(prev, R)
  }
  if (prev < bx2) outs.push([prev, bx2])
  return outs
}

// Compute the largest axis-aligned rectangle that contains p and fits in the chosen region
function largestRectContainingPointRegion(
  edges: Seg[],
  p: Pt,
  bounds: { x: number; y: number; w: number; h: number },
  mode: RegionMode,
): Rect | null {
  const BX1 = bounds.x
  const BX2 = bounds.x + bounds.w
  const BY1 = bounds.y // top
  const BY2 = bounds.y + bounds.h // bottom

  // 1) Horizontal visibility segment at y=p.y for the chosen region
  const intervals = regionIntervalsAtY(edges, p.y, BX1, BX2, mode)
  const interval = intervals.find(
    ([xL, xR]) => xL - 1e-9 <= p.x && p.x <= xR + 1e-9,
  )
  if (!interval) return null
  let [X_L, X_R] = interval

  // 2) Build x-slabs using ONLY vertical edges strictly inside (X_L, X_R)
  //    IMPORTANT: Do NOT include global bounds here — the horizontal width must
  //    stay within the region interval at y0 so the rectangle's midline is always valid.
  const xset = new Set<number>([X_L, X_R])
  for (const e of edges) {
    if (!isVertical(e)) continue
    const x = e.a.x
    if (X_L < x && x < X_R) xset.add(x)
  }
  const xs = Array.from(xset).sort((a, b) => a - b)
  const m = xs.length - 1
  if (m <= 0) return null

  // 3) For each slab, find top[i] and bot[i] via vertical shots at mid x
  //    Include polygon horizontal edges AND global bounds as blockers.
  const top: number[] = Array(m).fill(-Infinity)
  const bot: number[] = Array(m).fill(+Infinity)

  for (let i = 0; i < m; i++) {
    let xm = 0.5 * (xs[i] + xs[i + 1])
    // Nudge xm if it sits exactly on a vertical edge to avoid corner ambiguity
    if (xset.has(xm)) xm += 1e-6

    let minAbove = BY2 // bottom bound caps the upward ray in SVG coords
    let maxBelow = BY1 // top bound caps the downward ray in SVG coords

    for (const e of edges) {
      if (!isHorizontal(e)) continue
      const y = e.a.y
      const x1 = Math.min(e.a.x, e.b.x)
      const x2 = Math.max(e.a.x, e.b.x)
      if (x1 - 1e-9 <= xm && xm <= x2 + 1e-9) {
        if (y > p.y) minAbove = Math.min(minAbove, y)
        if (y < p.y) maxBelow = Math.max(maxBelow, y)
      }
    }

    if (!(maxBelow < minAbove)) {
      top[i] = -Infinity
      bot[i] = +Infinity
    } else {
      top[i] = minAbove
      bot[i] = maxBelow
    }
  }

  // 4) Find the slab that contains p.x
  let s0 = -1
  for (let i = 0; i < m; i++) {
    if (xs[i] - 1e-9 <= p.x && p.x <= xs[i + 1] + 1e-9) {
      s0 = i
      break
    }
  }
  if (s0 === -1) return null

  // 5) Enumerate runs i..j including s0; keep min(top) and max(bot)
  let best: Rect | null = null
  let bestArea = -1

  for (let i = 0; i <= s0; i++) {
    let minTop = +Infinity
    let maxBot = -Infinity
    for (let j = i; j < m; j++) {
      minTop = Math.min(minTop, top[j])
      maxBot = Math.max(maxBot, bot[j])
      if (j < s0) continue

      const height = Math.max(0, minTop - maxBot)
      if (height <= 0) continue

      const width = xs[j + 1] - xs[i]
      const area = width * height
      if (area > bestArea) {
        bestArea = area
        best = { x: xs[i], y: maxBot, w: width, h: height }
      }
    }
  }
  return best
}

// Build edges for a polygon, optionally subtracting an axis-aligned rectangular hole (donut case)
function buildEdgesWithOptionalHole(base: Pt[], hole?: Rect): Seg[] {
  const edges = makeEdges(base)
  if (!hole) return edges
  // To handle a hole simply, we carve it by adding its boundary edges in opposite parity (CW)
  const H: Pt[] = [
    { x: hole.x, y: hole.y },
    { x: hole.x + hole.w, y: hole.y },
    { x: hole.x + hole.w, y: hole.y + hole.h },
    { x: hole.x, y: hole.y + hole.h },
  ]
  // Reverse order to make it CW
  H.reverse()
  return edges.concat(makeEdges(H))
}

// -------------------------- React UI --------------------------

export default function LargestRectDemo() {
  const [idx, setIdx] = useState(0)
  const [showSlabs, setShowSlabs] = useState(false)
  const [mode, setMode] = useState<RegionMode>("inside")

  const sample = samples[idx]
  const withHole = sample.name.startsWith("Donut")
  const edges = useMemo(
    () =>
      buildEdgesWithOptionalHole(sample.poly, withHole ? donutHole : undefined),
    [idx],
  )

  const [p, setP] = useState<Pt>(sample.start)
  // reset point if polygon changes
  React.useEffect(() => setP(samples[idx].start), [idx])

  const bounds = { x: 0, y: 0, w: 600, h: 400 } // globalBounds

  const inPoly = useMemo(() => pointInPolygonOrth(edges, p), [edges, p])
  const bestRect = useMemo(
    () => largestRectContainingPointRegion(edges, p, bounds, mode),
    [edges, p, mode],
  )

  const onDrag = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = Math.max(
      bounds.x,
      Math.min(bounds.x + bounds.w, e.clientX - rect.left),
    )
    const y = Math.max(
      bounds.y,
      Math.min(bounds.y + bounds.h, e.clientY - rect.top),
    )
    setP({ x, y })
  }, [])

  // Precompute slab lines for visualization from the chosen region intervals
  const slabXs = useMemo(() => {
    if (!bestRect) return [] as number[]
    const intervals = regionIntervalsAtY(
      edges,
      p.y,
      bounds.x,
      bounds.x + bounds.w,
      mode,
    )
    const interval = intervals.find(
      ([xL, xR]) => xL - 1e-9 <= p.x && p.x <= xR + 1e-9,
    )
    if (!interval) return []
    const [X_L, X_R] = interval
    const xset = new Set<number>([X_L, X_R])
    for (const e of edges)
      if (isVertical(e) && X_L < e.a.x && e.a.x < X_R) xset.add(e.a.x)
    return Array.from(xset).sort((a, b) => a - b)
  }, [edges, p, bestRect, mode])

  return (
    <div className="w-full h-full p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <div className="p-3 bg-white rounded-2xl shadow border">
            <div className="grid flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">
                Largest Rectangle vs Orthogonal Polygon
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
                    checked={showSlabs}
                    onChange={(e) => setShowSlabs(e.target.checked)}
                  />
                  Show slabs
                </label>
                <select
                  className="border rounded-xl px-2 py-1 text-sm"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as RegionMode)}
                  title="Choose region: inside polygon or outside (within global bounds)"
                >
                  <option value="inside">Inside polygon</option>
                  <option value="outside">
                    Outside polygon (within global bounds)
                  </option>
                </select>
              </div>
            </div>

            <svg
              viewBox={`0 0 ${bounds.w} ${bounds.h}`}
              className="w-full aspect-[3/2] bg-slate-50 rounded-xl border cursor-crosshair"
              onMouseDown={onDrag}
              onMouseMove={(e) => e.buttons === 1 && onDrag(e)}
            >
              {/* polygon fill */}
              <defs>
                <pattern
                  id="diag"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="8" height="8" fill="#f0f9ff" />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="8"
                    stroke="#e2e8f0"
                    strokeWidth="2"
                  />
                </pattern>
              </defs>

              {/* Outer edges */}
              <polygon
                points={samples[idx].poly.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="url(#diag)"
                stroke="#334155"
                strokeWidth={2}
                opacity={mode === "inside" ? 0.9 : 0.5}
              />

              {/* Donut hole */}
              {withHole && (
                <rect
                  x={donutHole.x}
                  y={donutHole.y}
                  width={donutHole.w}
                  height={donutHole.h}
                  fill="#fff"
                  stroke="#334155"
                  strokeWidth={2}
                  opacity={mode === "inside" ? 1 : 0.6}
                />
              )}

              {/* Slab lines */}
              {showSlabs &&
                slabXs.map((x, i) => (
                  <line
                    key={i}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={bounds.h}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                  />
                ))}

              {/* Largest rectangle */}
              {bestRect && bestRect.w > 0 && bestRect.h > 0 && (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  x={bestRect.x}
                  y={bestRect.y}
                  width={bestRect.w}
                  height={bestRect.h}
                  fill={mode === "inside" ? "#38bdf8" : "#fbbf24"}
                  stroke={mode === "inside" ? "#0284c7" : "#d97706"}
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
                  fill={
                    mode === "inside"
                      ? inPoly
                        ? "#0f766e"
                        : "#ef4444"
                      : "#7c3aed"
                  }
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />
                <text x={p.x + 10} y={p.y - 10} fontSize={12} fill="#0f172a">
                  origin ({p.x.toFixed(0)}, {p.y.toFixed(0)})
                </text>
              </g>

              {/* Visibility line(s) for the chosen region */}
              {(() => {
                const BX1 = bounds.x,
                  BX2 = bounds.x + bounds.w
                const ints = regionIntervalsAtY(edges, p.y, BX1, BX2, mode)
                return ints.map(([L, R], k) => (
                  <line
                    key={k}
                    x1={L}
                    y1={p.y}
                    x2={R}
                    y2={p.y}
                    stroke={mode === "inside" ? "#10b981" : "#8b5cf6"}
                    strokeWidth={2}
                    opacity={0.7}
                  />
                ))
              })()}
            </svg>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-3">
          <div className="p-3 bg-white rounded-2xl shadow border">
            <h3 className="text-lg font-semibold mb-2">How it works</h3>
            <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">
              <li>
                Find the horizontal visibility segment at the point (colored
                line) within the chosen region (inside or outside within global
                bounds).
              </li>
              <li>
                Partition that corridor into x-slabs at vertical edges (and
                global bounds).
              </li>
              <li>
                For each slab, shoot vertical rays to get local top/bottom
                bounds (clamped to global bounds).
              </li>
              <li>
                Take any consecutive run of slabs containing the point; height
                is limited by the tightest top/bottom across the run.
              </li>
              <li>
                Pick the run with maximum area. That’s the rectangle (blue for
                inside, amber for outside).
              </li>
            </ol>
          </div>

          <div className="p-3 bg-white rounded-2xl shadow border">
            <h3 className="text-lg font-semibold mb-2">Details</h3>
            <div className="text-sm text-slate-700 space-y-2">
              <p>
                <strong>Mode:</strong>{" "}
                {mode === "inside"
                  ? "Inside polygon"
                  : "Outside polygon (bounded by global bounds)"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {mode === "inside"
                  ? inPoly
                    ? "Point is inside the polygon"
                    : "Point is OUTSIDE the polygon (drag inside)"
                  : "Point can be anywhere within global bounds"}
              </p>
              <p>
                {bestRect ? (
                  <>
                    Best rectangle:{" "}
                    <code>
                      ({bestRect.x.toFixed(1)}, {bestRect.y.toFixed(1)})
                    </code>{" "}
                    • w=<code>{bestRect.w.toFixed(1)}</code>, h=
                    <code>{bestRect.h.toFixed(1)}</code> • area=
                    <code>{(bestRect.w * bestRect.h).toFixed(1)}</code>
                  </>
                ) : (
                  <>Best rectangle: –</>
                )}
              </p>
              <p>
                Complexity: O(n²) worst-case (n = vertical edges intersecting
                the corridor). Works for holes via even–odd scanline; outside
                mode uses the complement within global bounds.
              </p>
              <p className="text-xs text-slate-500">
                Implementation note: vertical edge crossings use a half-open
                rule to avoid double counting at vertices; outside mode clamps
                rays to the global bounding box. The horizontal sweep is
                restricted to the region interval at y0 so the rectangle never
                crosses the boundary at the midline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
