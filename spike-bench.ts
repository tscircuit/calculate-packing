/**
 * Head-to-head bench: greedy outline packer (PackSolver2,
 * "minimum_sum_squared_distance_to_network") vs the additive analytical
 * "force_directed" packer.
 *
 * Run with:  bun spike-bench.ts
 *
 * Metrics (all defined here, identically applied to both strategies):
 *
 *   runtime (ms)      wall-clock around pack().
 *
 *   total wirelength  STAR-model wirelength. For each networkId, take the pad
 *                     absoluteCenters of every pad on that net, compute their
 *                     centroid, and sum each pad's Euclidean distance to that
 *                     centroid. Total = sum over all nets. (This is the natural
 *                     objective for a star/centroid spring model; it is well
 *                     defined for nets with any number of pins.)
 *
 *   overlap count     number of unordered component pairs whose AABBs, inflated
 *                     by minGap, overlap by more than EPS on BOTH axes. The
 *                     AABB is the rotation-aware bounding box of the component's
 *                     pads (matching getComponentBounds).
 */

import { pack } from "./lib/pack"
import type { PackInput, PackOutput, PackedComponent } from "./lib/types"
import { getComponentBounds } from "./lib/geometry/getComponentBounds"

const EPS = 1e-6

// ---- metrics ---------------------------------------------------------------

function totalWirelength(out: PackOutput): number {
  const byNet = new Map<string, Array<{ x: number; y: number }>>()
  for (const comp of out.components) {
    for (const pad of comp.pads) {
      const arr = byNet.get(pad.networkId) ?? []
      arr.push(pad.absoluteCenter)
      byNet.set(pad.networkId, arr)
    }
  }
  let total = 0
  for (const pts of byNet.values()) {
    if (pts.length < 2) continue
    let cx = 0
    let cy = 0
    for (const p of pts) {
      cx += p.x
      cy += p.y
    }
    cx /= pts.length
    cy /= pts.length
    for (const p of pts) total += Math.hypot(p.x - cx, p.y - cy)
  }
  return total
}

function overlapCount(out: PackOutput, minGap: number): number {
  const boxes = out.components.map((c: PackedComponent) =>
    getComponentBounds(c, minGap / 2),
  )
  let count = 0
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!
      const b = boxes[j]!
      const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)
      const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY)
      if (overlapX > EPS && overlapY > EPS) count++
    }
  }
  return count
}

// ---- synthetic generators --------------------------------------------------

const PAD = 0.4 // ~0.4 x 0.4 component (two pads side by side)

/** Each component = 2 pads, each on a UNIQUE network => fully disconnected. */
function makeDisconnected(n: number, minGap: number): PackInput {
  const components = []
  for (let i = 0; i < n; i++) {
    components.push({
      componentId: `C${i}`,
      pads: [
        {
          padId: `C${i}_a`,
          networkId: `net_${i}_a`,
          type: "rect" as const,
          offset: { x: -PAD / 2, y: 0 },
          size: { x: PAD, y: PAD },
        },
        {
          padId: `C${i}_b`,
          networkId: `net_${i}_b`,
          type: "rect" as const,
          offset: { x: PAD / 2, y: 0 },
          size: { x: PAD, y: PAD },
        },
      ],
    })
  }
  return {
    components,
    minGap,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }
}

/**
 * Series chain: component i has pad "in" on net shared with i-1's "out", and
 * pad "out" on a fresh net shared with i+1. So consecutive components attract.
 */
function makeChain(n: number, minGap: number): PackInput {
  const components = []
  for (let i = 0; i < n; i++) {
    const inNet = i === 0 ? `chain_start` : `chain_${i - 1}_${i}`
    const outNet = `chain_${i}_${i + 1}`
    components.push({
      componentId: `C${i}`,
      pads: [
        {
          padId: `C${i}_in`,
          networkId: inNet,
          type: "rect" as const,
          offset: { x: -PAD / 2, y: 0 },
          size: { x: PAD, y: PAD },
        },
        {
          padId: `C${i}_out`,
          networkId: outNet,
          type: "rect" as const,
          offset: { x: PAD / 2, y: 0 },
          size: { x: PAD, y: PAD },
        },
      ],
    })
  }
  return {
    components,
    minGap,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }
}

// ---- runner ----------------------------------------------------------------

interface Row {
  scenario: string
  n: number
  strategy: string
  ms: number
  wirelength: number
  overlaps: number
}

function run(scenario: string, n: number, base: PackInput): Row[] {
  const minGap = base.minGap
  const rows: Row[] = []

  const strategies: Array<{ label: string; input: PackInput }> = [
    {
      label: "greedy(min_sum_sq)",
      input: {
        ...base,
        packPlacementStrategy: "minimum_sum_squared_distance_to_network",
      },
    },
    {
      label: "force_directed",
      input: { ...base, packPlacementStrategy: "force_directed" },
    },
  ]

  for (const { label, input } of strategies) {
    const t0 = performance.now()
    const out = pack(input)
    const t1 = performance.now()
    rows.push({
      scenario,
      n,
      strategy: label,
      ms: t1 - t0,
      wirelength: totalWirelength(out),
      overlaps: overlapCount(out, minGap),
    })
  }
  return rows
}

function determinismCheck(input: PackInput): boolean {
  const a = pack({ ...input, packPlacementStrategy: "force_directed" })
  const b = pack({ ...input, packPlacementStrategy: "force_directed" })
  const sa = JSON.stringify(a.components.map((c) => c.center))
  const sb = JSON.stringify(b.components.map((c) => c.center))
  return sa === sb
}

function printTable(rows: Row[]): void {
  const header = [
    "scenario".padEnd(14),
    "n".padStart(4),
    "strategy".padEnd(20),
    "runtime(ms)".padStart(12),
    "wirelength".padStart(13),
    "overlaps".padStart(9),
  ].join("  ")
  console.log(header)
  console.log("-".repeat(header.length))
  for (const r of rows) {
    console.log(
      [
        r.scenario.padEnd(14),
        String(r.n).padStart(4),
        r.strategy.padEnd(20),
        r.ms.toFixed(2).padStart(12),
        r.wirelength.toFixed(2).padStart(13),
        String(r.overlaps).padStart(9),
      ].join("  "),
    )
  }
}

// ---- main ------------------------------------------------------------------

const minGap = 0.25
const sizes = [25, 50, 100]
const allRows: Row[] = []

for (const n of sizes) {
  allRows.push(...run("DISCONNECTED", n, makeDisconnected(n, minGap)))
}
for (const n of sizes) {
  allRows.push(...run("CHAIN", n, makeChain(n, minGap)))
}

console.log("\n=== Head-to-head: greedy vs force_directed ===\n")
printTable(allRows)

console.log("\n=== Determinism (force_directed run twice, identical?) ===")
console.log(
  "DISCONNECTED n=50:",
  determinismCheck(makeDisconnected(50, minGap)),
)
console.log("CHAIN        n=50:", determinismCheck(makeChain(50, minGap)))

// ---- real fixture (optional, best-effort) ----------------------------------
try {
  const circuitJson = (await import(
    "./tests/circuit-json-pack-conversion/circuit-json-pack-conversion01.json"
  )) as any
  const { convertCircuitJsonToPackOutput } = await import(
    "./lib/plumbing/convertCircuitJsonToPackOutput"
  )
  const { convertPackOutputToPackInput } = await import(
    "./lib/plumbing/convertPackOutputToPackInput"
  )
  const packOutput = convertCircuitJsonToPackOutput(circuitJson.default)
  const packInput = convertPackOutputToPackInput(packOutput)
  packInput.minGap = packInput.minGap || 0.2
  const realRows = run("REAL(cj01)", packInput.components.length, packInput)
  console.log("\n=== Real fixture: circuit-json-pack-conversion01 ===\n")
  printTable(realRows)
} catch (e) {
  console.log("\n(real fixture skipped:", (e as Error).message, ")")
}
