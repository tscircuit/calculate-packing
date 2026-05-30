/**
 * Comprehensive head-to-head: the current greedy packer (PackSolver2) vs the
 * force-directed packer, across topologies x sizes x constraints, plus rotation
 * and the real cj01 fixture.
 *
 *   bun bench-full.ts
 *
 * FD is run RAW (forceDirectedFallback:false) so we measure the solver itself;
 * the release gate would fall back to greedy on any row where FD shows a
 * violation/overlap (flagged with !). Metrics: runtime, star wirelength,
 * overlaps (rotation-aware AABB), and constraint violations.
 */
import { pack } from "./lib/pack"
import { validatePackedLayout } from "./lib/validatePackedLayout"
import type { PackInput, PackOutput, InputComponent } from "./lib/types"
import { getComponentBounds } from "./lib/geometry/getComponentBounds"

const MINGAP = 0.25
const PAD = 0.4
const pd = (
  id: string,
  net: string,
  dx: number,
  dy = 0,
  sx = PAD,
  sy = PAD,
) => ({
  padId: id,
  networkId: net,
  type: "rect" as const,
  offset: { x: dx, y: dy },
  size: { x: sx, y: sy },
})

function wl(out: PackOutput): number {
  const m = new Map<string, Array<{ x: number; y: number }>>()
  for (const c of out.components)
    for (const p of c.pads) {
      const a = m.get(p.networkId) ?? []
      a.push(p.absoluteCenter)
      m.set(p.networkId, a)
    }
  let t = 0
  for (const pts of m.values()) {
    if (pts.length < 2) continue
    let cx = 0
    let cy = 0
    for (const p of pts) {
      cx += p.x
      cy += p.y
    }
    cx /= pts.length
    cy /= pts.length
    for (const p of pts) t += Math.hypot(p.x - cx, p.y - cy)
  }
  return t
}
function overlaps(out: PackOutput, minGap: number = MINGAP): number {
  const b = out.components.map((c) => getComponentBounds(c, minGap / 2))
  let n = 0
  for (let i = 0; i < b.length; i++)
    for (let j = i + 1; j < b.length; j++) {
      const ox =
        Math.min(b[i]!.maxX, b[j]!.maxX) - Math.max(b[i]!.minX, b[j]!.minX)
      const oy =
        Math.min(b[i]!.maxY, b[j]!.maxY) - Math.max(b[i]!.minY, b[j]!.minY)
      if (ox > 1e-6 && oy > 1e-6) n++
    }
  return n
}

// ---- fixtures --------------------------------------------------------------
const base = (
  components: InputComponent[],
  extra: Partial<PackInput> = {},
): PackInput => ({
  components,
  minGap: MINGAP,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  ...extra,
})
function disconnected(n: number) {
  const c: InputComponent[] = []
  for (let i = 0; i < n; i++)
    c.push({
      componentId: `C${i}`,
      pads: [pd(`C${i}a`, `n${i}a`, -PAD / 2), pd(`C${i}b`, `n${i}b`, PAD / 2)],
    })
  return c
}
function chain(n: number) {
  const c: InputComponent[] = []
  for (let i = 0; i < n; i++)
    c.push({
      componentId: `C${i}`,
      pads: [
        pd(`C${i}a`, i === 0 ? "s" : `c${i - 1}_${i}`, -PAD / 2),
        pd(`C${i}b`, `c${i}_${i + 1}`, PAD / 2),
      ],
    })
  return c
}
function multiHub(n: number) {
  const hubCount = Math.max(2, Math.round(n / 12))
  const perHub = Math.max(1, Math.floor((n - hubCount) / hubCount))
  const c: InputComponent[] = []
  let leaf = 0
  for (let h = 0; h < hubCount; h++) {
    const hp = []
    for (let k = 0; k < perHub; k++)
      hp.push(pd(`H${h}p${k}`, `h${h}_l${leaf + k}`, 0))
    if (h > 0) hp.push(pd(`H${h}L`, `hub${h - 1}_${h}`, 0))
    if (h < hubCount - 1) hp.push(pd(`H${h}R`, `hub${h}_${h + 1}`, 0))
    c.push({ componentId: `H${h}`, pads: hp })
    for (let k = 0; k < perHub; k++) {
      c.push({
        componentId: `L${leaf}`,
        pads: [
          pd(`L${leaf}a`, `h${h}_l${leaf}`, -PAD / 2),
          pd(`L${leaf}b`, `lf${leaf}`, PAD / 2),
        ],
      })
      leaf++
    }
  }
  return c
}
function rotchain(n: number) {
  // elongated parts, pins top/bottom -> rotation matters
  const c: InputComponent[] = []
  for (let i = 0; i < n; i++)
    c.push({
      componentId: `R${i}`,
      pads: [
        pd(`R${i}t`, i === 0 ? "s" : `r${i - 1}_${i}`, 0, -0.6, 0.3, 0.3),
        pd(`R${i}b`, `r${i}_${i + 1}`, 0, 0.6, 0.3, 0.3),
      ],
      availableRotationDegrees: [0, 90, 180, 270] as Array<0 | 90 | 180 | 270>,
    })
  return c
}
function cluster(n: number) {
  const c: InputComponent[] = []
  for (let i = 0; i < n; i++)
    c.push({
      componentId: `C${i}`,
      pads: [
        pd(`C${i}a`, `net${i % 4}`, -PAD / 2),
        pd(`C${i}b`, `net${(i + 1) % 4}`, PAD / 2),
      ],
    })
  return c
}

// ---- runner ----------------------------------------------------------------
function row(label: string, input: PackInput) {
  const t0 = performance.now()
  const g = pack({
    ...input,
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  })
  const gms = performance.now() - t0
  const t1 = performance.now()
  const fd = pack(
    { ...input, packPlacementStrategy: "force_directed" },
    { forceDirectedFallback: false },
  )
  const fms = performance.now() - t1
  const gv = validatePackedLayout(g.components, input)
  const fv = validatePackedLayout(fd.components, input)
  const fdFlag = fv.ok ? " " : "!"
  const speedup = gms / fms
  console.log(
    [
      label.padEnd(24),
      `${gms.toFixed(0)}ms`.padStart(8),
      `${fms.toFixed(0)}ms`.padStart(8),
      `${speedup.toFixed(1)}x`.padStart(7),
      "|",
      wl(g).toFixed(1).padStart(8),
      `${wl(fd).toFixed(1)}${fdFlag}`.padStart(9),
      "|",
      `${overlaps(g, input.minGap)}/${gv.ok ? "ok" : "BAD"}`.padStart(8),
      `${overlaps(fd, input.minGap)}/${fv.ok ? "ok" : "FALLBACK"}`.padStart(12),
    ].join("  "),
  )
}
function header(title: string) {
  console.log(`\n=== ${title} ===`)
  console.log(
    [
      "scenario".padEnd(24),
      "greedy".padStart(8),
      "FD".padStart(8),
      "speedup".padStart(7),
      "|",
      "greedyWL".padStart(8),
      "fdWL".padStart(9),
      "|",
      "g ov/val".padStart(8),
      "fd ov/val".padStart(12),
    ].join("  "),
  )
}

header("UNCONSTRAINED (topology x size) — the #3208 scaling story")
for (const n of [25, 50, 100]) row(`disconnected n=${n}`, base(disconnected(n)))
for (const n of [25, 50, 100]) row(`chain n=${n}`, base(chain(n)))
for (const n of [24, 48, 96]) row(`multiHub n=${n}`, base(multiHub(n)))

header("ROTATION-SENSITIVE")
for (const n of [20, 40]) row(`rotchain n=${n}`, base(rotchain(n)))

header("CONSTRAINED (n=20 cluster)")
row(
  "obstacle 3x2",
  base(cluster(20), {
    obstacles: [
      { obstacleId: "O", absoluteCenter: { x: 0, y: 0 }, width: 3, height: 2 },
    ],
  }),
)
row(
  "bounds 8x8",
  base(cluster(20), { bounds: { minX: -4, maxX: 4, minY: -4, maxY: 4 } }),
)
row(
  "bounds 5x5 (tight)",
  base(cluster(20), {
    bounds: { minX: -2.5, maxX: 2.5, minY: -2.5, maxY: 2.5 },
  }),
)
{
  const hex = Array.from({ length: 6 }, (_, i) => ({
    x: 4 * Math.cos((Math.PI / 3) * i),
    y: 4 * Math.sin((Math.PI / 3) * i),
  }))
  row("hexagon(R4)", base(cluster(20), { boundaryOutline: hex }))
}
{
  const L = [
    { x: -3, y: -3 },
    { x: 3, y: -3 },
    { x: 3, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 3 },
    { x: -3, y: 3 },
  ]
  row("L-shape (non-convex)", base(cluster(20), { boundaryOutline: L }))
}

// real fixture
try {
  const cj = (await import(
    "./tests/circuit-json-pack-conversion/circuit-json-pack-conversion01.json"
  )) as any
  const { convertCircuitJsonToPackOutput } = await import(
    "./lib/plumbing/convertCircuitJsonToPackOutput"
  )
  const { convertPackOutputToPackInput } = await import(
    "./lib/plumbing/convertPackOutputToPackInput"
  )
  const pin = convertPackOutputToPackInput(
    convertCircuitJsonToPackOutput(cj.default),
  )
  pin.minGap = pin.minGap || 0.2
  header("REAL FIXTURE")
  row(`cj01 n=${pin.components.length}`, pin)
} catch (e) {
  console.log("(cj01 skipped:", (e as Error).message, ")")
}

console.log(
  "\n  ! = FD raw output failed validation (release gate falls back to greedy)",
)
