import { test, expect } from "bun:test"
import { pack } from "../lib/pack"
import { ForceDirectedPackSolver } from "../lib/ForceDirectedPackSolver/ForceDirectedPackSolver"
import { SpatialGridHash } from "../lib/ForceDirectedPackSolver/SpatialGridHash"
import { getComponentBounds } from "../lib/geometry/getComponentBounds"
import { getComponentCollisionBoxes } from "../lib/PackSolver2/getComponentCollisionBoxes"
import { validatePackedLayout } from "../lib/validatePackedLayout"
import { computeDistanceBetweenBoxes } from "@tscircuit/math-utils"
import type { PackInput, PackOutput } from "../lib/types"

/** True per-pad overlap count (greedy's collision model) — catches the 90/270
 *  non-square overlap the whole-AABB metric can miss. */
function perPadOverlaps(out: PackOutput, minGap: number): number {
  const boxes = out.components.map((c) => getComponentCollisionBoxes(c))
  let n = 0
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      let hit = false
      for (const a of boxes[i]!)
        for (const b of boxes[j]!) {
          if (computeDistanceBetweenBoxes(a, b).distance + 1e-6 < minGap)
            hit = true
        }
      if (hit) n++
    }
  }
  return n
}

const PAD = 0.4

function makeChain(n: number, minGap: number): PackInput {
  const components = []
  for (let i = 0; i < n; i++) {
    const inNet = i === 0 ? "chain_start" : `chain_${i - 1}_${i}`
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
    packPlacementStrategy: "force_directed",
  }
}

/**
 * 2D mesh grid: every cell connects to its right/down neighbour. Edge and
 * corner cells have pads on only some sides, so their pad bounding box is NOT
 * centred on the component origin (asymmetric). This is the topology that
 * exposed the asymmetric-collision-box bug (the body was modelled as symmetric
 * about its origin, so the legalizer separated the wrong box and left real
 * overlaps).
 */
function makeMesh(n: number, minGap: number): PackInput {
  const side = Math.max(1, Math.round(Math.sqrt(n)))
  const components = []
  const id = (r: number, c: number) => `M${r}_${c}`
  const mk = (padId: string, networkId: string, dx: number) => ({
    padId,
    networkId,
    type: "rect" as const,
    offset: { x: dx, y: 0 },
    size: { x: PAD, y: PAD },
  })
  for (let r = 0; r < side; r++) {
    for (let c = 0; c < side; c++) {
      const pads = []
      if (c < side - 1) pads.push(mk(`${id(r, c)}r`, `e_${r}_${c}_h`, -PAD / 2))
      if (c > 0) pads.push(mk(`${id(r, c)}l`, `e_${r}_${c - 1}_h`, PAD / 2))
      if (r < side - 1) pads.push(mk(`${id(r, c)}d`, `e_${r}_${c}_v`, 0))
      if (r > 0) pads.push(mk(`${id(r, c)}u`, `e_${r - 1}_${c}_v`, 0))
      if (pads.length === 0) pads.push(mk(`${id(r, c)}x`, `iso_${r}_${c}`, 0))
      components.push({ componentId: id(r, c), pads })
    }
  }
  return {
    components,
    minGap,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "force_directed",
  }
}

function overlapCount(out: PackOutput, minGap: number): number {
  const boxes = out.components.map((c) => getComponentBounds(c, minGap / 2))
  let count = 0
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!
      const b = boxes[j]!
      const ox = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)
      const oy = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY)
      if (ox > 1e-6 && oy > 1e-6) count++
    }
  }
  return count
}

test("SpatialGridHash finds near neighbours within a cell", () => {
  const grid = new SpatialGridHash(1)
  grid.insert(0, 0, 0)
  grid.insert(1, 0.5, 0.5) // same cell
  grid.insert(2, 0.9, 0.1) // adjacent cell
  grid.insert(3, 10, 10) // far away
  const neighbors = grid.queryNeighbors(0, 0)
  expect(neighbors).toContain(1)
  expect(neighbors).toContain(2)
  expect(neighbors).not.toContain(3)
})

test("force_directed strategy is reachable via pack() and is additive", () => {
  const input = makeChain(10, 0.25)
  const out = pack(input)
  expect(out.components).toHaveLength(10)
  // Each component has output center + pads with absolute centers.
  for (const c of out.components) {
    expect(typeof c.center.x).toBe("number")
    expect(typeof c.center.y).toBe("number")
    for (const p of c.pads) {
      expect(typeof p.absoluteCenter.x).toBe("number")
      expect(typeof p.absoluteCenter.y).toBe("number")
    }
  }
})

test("force_directed produces a legal (overlap-free) layout", () => {
  for (const n of [10, 25, 50]) {
    const input = makeChain(n, 0.25)
    const out = pack(input)
    expect(overlapCount(out, input.minGap)).toBe(0)
  }
})

test("force_directed legalizes ASYMMETRIC components (mesh/grid) overlap-free", () => {
  // Regression: mesh edge/corner cells have off-origin pad boxes. The old body
  // model treated every box as symmetric about the origin, so the legalizer
  // separated the wrong box and left real overlaps (n=25 -> 11 overlapping
  // pairs). Must be 0 for every mesh size.
  for (const n of [9, 25, 49, 100]) {
    const input = makeMesh(n, 0.25)
    const out = pack(input)
    expect(overlapCount(out, input.minGap)).toBe(0)
  }
})

test("force_directed separates a single asymmetric connected pair", () => {
  // Minimal root-cause repro: two components whose pads sit entirely on one
  // side of the origin (box centre offset by PAD/2 from origin), connected so
  // springs pull them together. Whole-component AABBs must end up disjoint.
  const offPad = (padId: string, networkId: string, x: number) => ({
    padId,
    networkId,
    type: "rect" as const,
    offset: { x, y: 0 },
    size: { x: PAD, y: PAD },
  })
  const input: PackInput = {
    components: [
      {
        componentId: "A",
        // both pads to the right of origin -> box centre offset +PAD
        pads: [
          offPad("A1", "link", PAD / 2),
          offPad("A2", "a_only", PAD * 1.5),
        ],
      },
      {
        componentId: "B",
        // both pads to the left of origin -> box centre offset -PAD
        pads: [
          offPad("B1", "link", -PAD / 2),
          offPad("B2", "b_only", -PAD * 1.5),
        ],
      },
    ],
    minGap: 0.25,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "force_directed",
  }
  const out = pack(input)
  expect(overlapCount(out, input.minGap)).toBe(0)
})

test("force_directed is deterministic (no randomness)", () => {
  const input = makeChain(40, 0.25)
  const a = pack(input)
  const b = pack(input)
  expect(JSON.stringify(a.components.map((c) => c.center))).toBe(
    JSON.stringify(b.components.map((c) => c.center)),
  )
})

test("force_directed keeps isStatic components pinned", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "ANCHOR",
        isStatic: true,
        center: { x: 5, y: -3 },
        ccwRotationOffset: 0,
        pads: [
          {
            padId: "ANCHOR_p",
            networkId: "n1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: PAD, y: PAD },
          },
        ],
      },
      {
        componentId: "MOVER",
        pads: [
          {
            padId: "MOVER_p",
            networkId: "n1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: PAD, y: PAD },
          },
        ],
      },
    ],
    minGap: 0.25,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "force_directed",
  }
  const out = pack(input)
  const anchor = out.components.find((c) => c.componentId === "ANCHOR")!
  const mover = out.components.find((c) => c.componentId === "MOVER")!
  // Static component must not have moved.
  expect(anchor.center).toEqual({ x: 5, y: -3 })
  // Mover should be pulled to sit right next to the anchor (shared net),
  // i.e. within roughly one component + minGap of it.
  const dist = Math.hypot(mover.center.x - 5, mover.center.y + 3)
  expect(dist).toBeLessThan(PAD + 0.25 + 0.2)
  expect(dist).toBeGreaterThan(0)
})

test("ForceDirectedPackSolver exposes convergence info", () => {
  const solver = new ForceDirectedPackSolver(makeChain(20, 0.25))
  solver.solve()
  expect(solver.packedComponents).toHaveLength(20)
  expect(solver.iterationsRun).toBeGreaterThan(0)
})

test("force_directed packs 90/270-rotated non-square parts overlap-free", () => {
  // Regression (release audit blocker): a 4x1 pad rotated 90deg has a true 1x4
  // footprint, but getComponentBounds double-rotated the already-swapped size
  // and reported 4x1 — so FD packed these overlapping AND the validator passed
  // it. The collision-bounds fix must make the gated output truly overlap-free.
  for (const n of [3, 4, 5, 6]) {
    const components = Array.from({ length: n }, (_, i) => ({
      componentId: `C${i}`,
      availableRotationDegrees: [90, 270] as Array<0 | 90 | 180 | 270>,
      pads: [
        {
          padId: `C${i}-p`,
          networkId: `net-C${i}`,
          type: "rect" as const,
          offset: { x: 0, y: 0 },
          size: { x: 4, y: 1 },
        },
      ],
    }))
    const input: PackInput = {
      components,
      minGap: 0.2,
      packOrderStrategy: "largest_to_smallest",
      packPlacementStrategy: "force_directed",
    }
    const out = pack(input)
    expect(perPadOverlaps(out, 0.2)).toBe(0)
    expect(validatePackedLayout(out.components, input).ok).toBe(true)
  }
})

test("pack() force_directed never returns non-finite coords on malformed input", () => {
  // Regression (release audit concern): a non-finite value in a non-size field
  // (here bounds.minX = NaN) made raw FD emit all-NaN centres that slipped past
  // every NaN-comparison check. The non-finite guard must flag it so the gate
  // falls back to greedy and the returned layout stays finite.
  const mk = (id: string) => ({
    componentId: id,
    pads: [
      {
        padId: `${id}-p`,
        networkId: "n1",
        type: "rect" as const,
        offset: { x: 0, y: 0 },
        size: { x: 3, y: 3 },
      },
    ],
  })
  const input: PackInput = {
    components: [mk("A"), mk("B")],
    minGap: 1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "force_directed",
    bounds: { minX: NaN, maxX: 5, minY: -5, maxY: 5 },
  }
  const out = pack(input)
  for (const c of out.components) {
    expect(Number.isFinite(c.center.x)).toBe(true)
    expect(Number.isFinite(c.center.y)).toBe(true)
  }
  // The raw (ungated) FD output is what the gate caught — it must be rejected.
  const raw = pack(input, { forceDirectedFallback: false })
  expect(validatePackedLayout(raw.components, input).ok).toBe(false)
})
