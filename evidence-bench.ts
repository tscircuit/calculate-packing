/**
 * Evidence bench for the dispatch decision:
 *   greedy  vs  FD(grid-seed)  vs  FD(greedy-seed)  vs  FD(bfs-hub-seed)
 *
 * Produces the data that decides whether greedy-seed+dispatch suffices or the
 * analytical (FastPlace/SimPL) quadratic solve is worth building. Throwaway.
 *   bun evidence-bench.ts
 *
 * Three questions:
 *   Q1 refine-or-drift: does FD seeded from greedy IMPROVE on greedy, match it,
 *      or drift toward FD's worse equilibrium?
 *   Q2 cheap large-n seed: does a connectivity-aware seed (BFS-from-hubs, O(n+e),
 *      no greedy cost) lift FD's quality in the regime where greedy can't seed?
 *   Q3 crossover: at what n does greedy's runtime become unacceptable (the band
 *      where FD is actually needed)?
 */
import { pack } from "./lib/pack"
import type { PackInput, PackOutput, InputComponent } from "./lib/types"
import { getComponentBounds } from "./lib/geometry/getComponentBounds"

const EPS = 1e-6
const PAD = 0.4
const MINGAP = 0.25

// ---- metrics ---------------------------------------------------------------

function wirelength(out: PackOutput): number {
  const byNet = new Map<string, Array<{ x: number; y: number }>>()
  for (const c of out.components)
    for (const p of c.pads) {
      const a = byNet.get(p.networkId) ?? []
      a.push(p.absoluteCenter)
      byNet.set(p.networkId, a)
    }
  let t = 0
  for (const pts of byNet.values()) {
    if (pts.length < 2) continue
    let cx = 0,
      cy = 0
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

function overlaps(out: PackOutput, minGap: number): number {
  const boxes = out.components.map((c) => getComponentBounds(c, minGap / 2))
  let n = 0
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!,
        b = boxes[j]!
      const ox = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)
      const oy = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY)
      if (ox > EPS && oy > EPS) n++
    }
  return n
}

// ---- fixtures --------------------------------------------------------------

function pad(id: string, net: string, dx: number) {
  return {
    padId: id,
    networkId: net,
    type: "rect" as const,
    offset: { x: dx, y: 0 },
    size: { x: PAD, y: PAD },
  }
}

function base(components: InputComponent[]): PackInput {
  return {
    components,
    minGap: MINGAP,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }
}

/** n isolated 2-pad parts, every pad a unique net. No springs. */
function disconnected(n: number): PackInput {
  const c: InputComponent[] = []
  for (let i = 0; i < n; i++)
    c.push({
      componentId: `C${i}`,
      pads: [
        pad(`C${i}a`, `n${i}a`, -PAD / 2),
        pad(`C${i}b`, `n${i}b`, PAD / 2),
      ],
    })
  return base(c)
}

/** series chain: i connects to i-1 and i+1. */
function chain(n: number): PackInput {
  const c: InputComponent[] = []
  for (let i = 0; i < n; i++)
    c.push({
      componentId: `C${i}`,
      pads: [
        pad(`C${i}in`, i === 0 ? "start" : `c${i - 1}_${i}`, -PAD / 2),
        pad(`C${i}out`, `c${i}_${i + 1}`, PAD / 2),
      ],
    })
  return base(c)
}

/** pure star: one hub connected to n-1 leaves (extreme hub). */
function hub(n: number): PackInput {
  const leaves = n - 1
  const hubPads = []
  for (let i = 0; i < leaves; i++) hubPads.push(pad(`HUBp${i}`, `spoke${i}`, 0))
  const c: InputComponent[] = [{ componentId: `HUB`, pads: hubPads }]
  for (let i = 0; i < leaves; i++)
    c.push({
      componentId: `L${i}`,
      pads: [
        pad(`L${i}a`, `spoke${i}`, -PAD / 2),
        pad(`L${i}b`, `lf${i}`, PAD / 2),
      ],
    })
  return base(c)
}

/** realistic: a few hubs (MCU/connector), each with several leaves, hubs chained. */
function multiHub(n: number): PackInput {
  const hubCount = Math.max(2, Math.round(n / 12))
  const perHub = Math.max(1, Math.floor((n - hubCount) / hubCount))
  const c: InputComponent[] = []
  let leafId = 0
  for (let h = 0; h < hubCount; h++) {
    const hp = []
    for (let k = 0; k < perHub; k++)
      hp.push(pad(`H${h}p${k}`, `h${h}_l${leafId + k}`, 0))
    // inter-hub link
    if (h > 0) hp.push(pad(`H${h}link`, `hub${h - 1}_${h}`, 0))
    if (h < hubCount - 1) hp.push(pad(`H${h}link2`, `hub${h}_${h + 1}`, 0))
    c.push({ componentId: `H${h}`, pads: hp })
    for (let k = 0; k < perHub; k++) {
      c.push({
        componentId: `L${leafId}`,
        pads: [
          pad(`L${leafId}a`, `h${h}_l${leafId}`, -PAD / 2),
          pad(`L${leafId}b`, `lf${leafId}`, PAD / 2),
        ],
      })
      leafId++
    }
  }
  return base(c)
}

/** 2D mesh grid: each part connects to its right and down neighbour. */
function mesh(n: number): PackInput {
  const side = Math.max(1, Math.round(Math.sqrt(n)))
  const c: InputComponent[] = []
  const id = (r: number, col: number) => `M${r}_${col}`
  for (let r = 0; r < side; r++)
    for (let col = 0; col < side; col++) {
      const pads = []
      // right edge
      if (col < side - 1)
        pads.push(pad(`${id(r, col)}r`, `e_${r}_${col}_h`, -PAD / 2))
      if (col > 0)
        pads.push(pad(`${id(r, col)}l`, `e_${r}_${col - 1}_h`, PAD / 2))
      // down edge
      if (r < side - 1) pads.push(pad(`${id(r, col)}d`, `e_${r}_${col}_v`, 0))
      if (r > 0) pads.push(pad(`${id(r, col)}u`, `e_${r - 1}_${col}_v`, 0))
      if (pads.length === 0)
        pads.push(pad(`${id(r, col)}x`, `iso_${r}_${col}`, 0))
      c.push({ componentId: id(r, col), pads })
    }
  return base(c)
}

// ---- seeds -----------------------------------------------------------------

/** Run greedy, return componentId -> center. */
function greedySeed(input: PackInput): {
  centers: Map<string, { x: number; y: number }>
  ms: number
} {
  const t0 = performance.now()
  const out = pack(input, undefined)
  const ms = performance.now() - t0
  const centers = new Map<string, { x: number; y: number }>()
  for (const c of out.components)
    centers.set(c.componentId, { x: c.center.x, y: c.center.y })
  return { centers, ms }
}

/**
 * Connectivity-aware seed, O(n + e), NO greedy cost. Build component adjacency
 * (share a net => adjacent), BFS-layer from the highest-degree node (hub), and
 * place each layer on a ring of growing radius around the hub. Repeat for each
 * disconnected sub-graph, tiling clusters apart. Hub-and-spoke layout.
 */
function bfsHubSeed(input: PackInput): {
  centers: Map<string, { x: number; y: number }>
  ms: number
} {
  const t0 = performance.now()
  const comps = input.components
  const idx = new Map(comps.map((c, i) => [c.componentId, i]))
  // net -> component indices
  const netToComps = new Map<string, number[]>()
  comps.forEach((c, i) => {
    for (const p of c.pads) {
      const arr = netToComps.get(p.networkId) ?? []
      if (arr[arr.length - 1] !== i) arr.push(i)
      netToComps.set(p.networkId, arr)
    }
  })
  const adj: Set<number>[] = comps.map(() => new Set<number>())
  for (const arr of netToComps.values())
    for (let a = 0; a < arr.length; a++)
      for (let b = a + 1; b < arr.length; b++) {
        adj[arr[a]!]!.add(arr[b]!)
        adj[arr[b]!]!.add(arr[a]!)
      }
  const deg = adj.map((s) => s.size)
  const visited = new Array(comps.length).fill(false)
  const spacing = PAD + MINGAP + 0.3
  const centers = new Map<string, { x: number; y: number }>()
  let clusterOriginX = 0
  let maxClusterRadius = 0

  // process nodes by descending degree as cluster roots
  const order = comps
    .map((_, i) => i)
    .sort((a, b) => deg[b]! - deg[a]! || a - b)
  for (const root of order) {
    if (visited[root]) continue
    // BFS from this hub
    const layers: number[][] = []
    let frontier = [root]
    visited[root] = true
    while (frontier.length) {
      layers.push(frontier)
      const next: number[] = []
      for (const u of frontier)
        for (const v of [...adj[u]!].sort((a, b) => a - b))
          if (!visited[v]) {
            visited[v] = true
            next.push(v)
          }
      frontier = next
    }
    // place: layer 0 at cluster center, layer L on ring radius L*spacing
    const clusterCx = clusterOriginX
    const clusterCy = 0
    let clusterR = 0
    layers.forEach((layer, L) => {
      const r = L * spacing * 1.3
      clusterR = Math.max(clusterR, r)
      layer.forEach((node, k) => {
        if (L === 0) {
          centers.set(comps[node]!.componentId, { x: clusterCx, y: clusterCy })
        } else {
          const theta = (2 * Math.PI * k) / layer.length
          centers.set(comps[node]!.componentId, {
            x: clusterCx + r * Math.cos(theta),
            y: clusterCy + r * Math.sin(theta),
          })
        }
      })
    })
    maxClusterRadius = Math.max(maxClusterRadius, clusterR)
    clusterOriginX += 2 * clusterR + spacing * 2 + 1
  }
  const ms = performance.now() - t0
  return { centers, ms }
}

function withCenters(
  input: PackInput,
  centers: Map<string, { x: number; y: number }>,
): PackInput {
  return {
    ...input,
    packPlacementStrategy: "force_directed",
    components: input.components.map((c) => ({
      ...c,
      center: centers.get(c.componentId),
    })),
  }
}

// ---- runner ----------------------------------------------------------------

interface Row {
  fixture: string
  n: number
  strat: string
  ms: number
  wl: number
  ov: number
  ratio: string
}

function runFixture(name: string, input: PackInput): Row[] {
  const n = input.components.length
  const rows: Row[] = []

  // greedy
  let t0 = performance.now()
  const g = pack(input, undefined)
  const gms = performance.now() - t0
  const gwl = wirelength(g)
  rows.push({
    fixture: name,
    n,
    strat: "greedy",
    ms: gms,
    wl: gwl,
    ov: overlaps(g, MINGAP),
    ratio: "1.00x",
  })

  const ratio = (wl: number) => (gwl < 1e-9 ? "—" : `${(wl / gwl).toFixed(2)}x`)

  // FD grid seed
  t0 = performance.now()
  const fdg = pack(
    { ...input, packPlacementStrategy: "force_directed" },
    undefined,
  )
  const fdgms = performance.now() - t0
  rows.push({
    fixture: name,
    n,
    strat: "FD(grid)",
    ms: fdgms,
    wl: wirelength(fdg),
    ov: overlaps(fdg, MINGAP),
    ratio: ratio(wirelength(fdg)),
  })

  // FD greedy seed (report greedy+fd time honestly)
  const gs = greedySeed(input)
  t0 = performance.now()
  const fdgs = pack(withCenters(input, gs.centers), {
    forceDirected: { seedFromCenters: true },
  })
  const fdgsms = performance.now() - t0
  rows.push({
    fixture: name,
    n,
    strat: "FD(greedy-seed)",
    ms: gs.ms + fdgsms,
    wl: wirelength(fdgs),
    ov: overlaps(fdgs, MINGAP),
    ratio: ratio(wirelength(fdgs)),
  })

  // FD bfs-hub seed (cheap seed, no greedy cost)
  const bs = bfsHubSeed(input)
  t0 = performance.now()
  const fdbs = pack(withCenters(input, bs.centers), {
    forceDirected: { seedFromCenters: true },
  })
  const fdbsms = performance.now() - t0
  rows.push({
    fixture: name,
    n,
    strat: "FD(bfs-hub)",
    ms: bs.ms + fdbsms,
    wl: wirelength(fdbs),
    ov: overlaps(fdbs, MINGAP),
    ratio: ratio(wirelength(fdbs)),
  })

  return rows
}

function printRows(rows: Row[]) {
  const H = [
    "fixture".padEnd(12),
    "n".padStart(4),
    "strategy".padEnd(18),
    "ms".padStart(10),
    "wirelen".padStart(10),
    "ov".padStart(3),
    "vs greedy".padStart(9),
  ].join("  ")
  console.log(H)
  console.log("-".repeat(H.length))
  for (const r of rows)
    console.log(
      [
        r.fixture.padEnd(12),
        String(r.n).padStart(4),
        r.strat.padEnd(18),
        r.ms.toFixed(1).padStart(10),
        r.wl.toFixed(2).padStart(10),
        String(r.ov).padStart(3),
        r.ratio.padStart(9),
      ].join("  "),
    )
}

// ---- main ------------------------------------------------------------------

const fixtures: Array<[string, (n: number) => PackInput, number[]]> = [
  ["chain", chain, [25, 50, 100]],
  ["hub", hub, [25, 50, 100]],
  ["multiHub", multiHub, [25, 50, 100]],
  ["mesh", mesh, [25, 49, 100]],
  ["disconnected", disconnected, [50, 100]],
]

console.log(
  "\n=== Q1/Q2: greedy vs FD(grid) vs FD(greedy-seed) vs FD(bfs-hub) ===",
)
for (const [name, gen, ns] of fixtures) {
  const rows: Row[] = []
  for (const n of ns) rows.push(...runFixture(name, gen(n)))
  console.log("")
  printRows(rows)
}

// real fixture cj01
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
  pin.packPlacementStrategy = "minimum_sum_squared_distance_to_network"
  console.log("\n--- REAL cj01 ---")
  printRows(runFixture("cj01", pin))
} catch (e) {
  console.log("(cj01 skipped:", (e as Error).message, ")")
}

// ---- Q3: runtime crossover (greedy O(n^3) vs FD) ---------------------------
console.log("\n=== Q3: runtime crossover (multiHub fixture) ===")
const crossH = [
  "n".padStart(5),
  "greedy ms".padStart(11),
  "FD(grid) ms".padStart(12),
  "FD(bfs) ms".padStart(12),
  "greedy wl".padStart(10),
  "FD(bfs) wl".padStart(11),
].join("  ")
console.log(crossH)
console.log("-".repeat(crossH.length))
for (const n of [25, 50, 100, 200, 400]) {
  const inp = multiHub(n)
  let t0 = performance.now()
  const g = pack(inp, undefined)
  const gms = performance.now() - t0
  t0 = performance.now()
  const fd = pack(
    { ...inp, packPlacementStrategy: "force_directed" },
    undefined,
  )
  const fdms = performance.now() - t0
  const bs = bfsHubSeed(inp)
  t0 = performance.now()
  const fdb = pack(withCenters(inp, bs.centers), {
    forceDirected: { seedFromCenters: true },
  })
  const fdbms = bs.ms + (performance.now() - t0)
  console.log(
    [
      String(n).padStart(5),
      gms.toFixed(1).padStart(11),
      fdms.toFixed(1).padStart(12),
      fdbms.toFixed(1).padStart(12),
      wirelength(g).toFixed(1).padStart(10),
      wirelength(fdb).toFixed(1).padStart(11),
    ].join("  "),
  )
}
