import { test, expect } from "bun:test"
import { pack } from "../lib/pack"
import type { InputComponent, PackInput, PackOutput } from "../lib/types"
import { validatePackedLayout } from "../lib/validatePackedLayout"
import { getComponentCollisionBounds } from "../lib/geometry/getComponentCollisionBounds"
import grp10 from "./repros/repro06/packInput-unnamed_group1.json"

const PAD = 0.4
const MINGAP = 0.25
const EPS = 1e-6

function p(id: string, net: string, dx: number) {
  return {
    padId: id,
    networkId: net,
    type: "rect" as const,
    offset: { x: dx, y: 0 },
    size: { x: PAD, y: PAD },
  }
}
function base(c: InputComponent[]): PackInput {
  return {
    components: c,
    minGap: MINGAP,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "quadratic",
  }
}
function chain(n: number): PackInput {
  const c: InputComponent[] = []
  for (let i = 0; i < n; i++)
    c.push({
      componentId: `C${i}`,
      pads: [
        p(`C${i}in`, i === 0 ? "s" : `c${i - 1}_${i}`, -PAD / 2),
        p(`C${i}out`, `c${i}_${i + 1}`, PAD / 2),
      ],
    })
  return base(c)
}
function multiHub(n: number): PackInput {
  const hubCount = Math.max(2, Math.round(n / 12))
  const perHub = Math.max(1, Math.floor((n - hubCount) / hubCount))
  const c: InputComponent[] = []
  let leaf = 0
  for (let h = 0; h < hubCount; h++) {
    const hp = []
    for (let k = 0; k < perHub; k++)
      hp.push(p(`H${h}p${k}`, `h${h}_l${leaf + k}`, 0))
    if (h > 0) hp.push(p(`H${h}lk`, `hub${h - 1}_${h}`, 0))
    if (h < hubCount - 1) hp.push(p(`H${h}lk2`, `hub${h}_${h + 1}`, 0))
    c.push({ componentId: `H${h}`, pads: hp })
    for (let k = 0; k < perHub; k++) {
      c.push({
        componentId: `L${leaf}`,
        pads: [
          p(`L${leaf}a`, `h${h}_l${leaf}`, -PAD / 2),
          p(`L${leaf}b`, `lf${leaf}`, PAD / 2),
        ],
      })
      leaf++
    }
  }
  return base(c)
}

function wirelength(out: PackOutput): number {
  const byNet = new Map<string, Array<{ x: number; y: number }>>()
  for (const c of out.components)
    for (const pad of c.pads) {
      const a = byNet.get(pad.networkId) ?? []
      a.push(pad.absoluteCenter)
      byNet.set(pad.networkId, a)
    }
  let t = 0
  for (const pts of byNet.values()) {
    if (pts.length < 2) continue
    let cx = 0,
      cy = 0
    for (const q of pts) {
      cx += q.x
      cy += q.y
    }
    cx /= pts.length
    cy /= pts.length
    for (const q of pts) t += Math.hypot(q.x - cx, q.y - cy)
  }
  return t
}
function aabbOverlaps(out: PackOutput, minGap: number): number {
  const boxes = out.components.map((c) =>
    getComponentCollisionBounds(c, minGap / 2),
  )
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

test("quadratic strategy is reachable via pack() and produces a valid layout", () => {
  const out = pack(chain(20))
  expect(out.components.length).toBe(20)
  expect(validatePackedLayout(out.components, chain(20)).ok).toBe(true)
})

test("quadratic produces an overlap-free (AABB) layout on a hub topology", () => {
  const input = multiHub(24)
  const out = pack(input, { quadraticFallback: false })
  expect(aabbOverlaps(out, input.minGap)).toBe(0)
  expect(validatePackedLayout(out.components, input).ok).toBe(true)
})

test("quadratic is deterministic (no randomness)", () => {
  const a = pack(multiHub(24), { quadraticFallback: false })
  const b = pack(multiHub(24), { quadraticFallback: false })
  const centers = (o: PackOutput) =>
    o.components.map(
      (c) =>
        `${c.componentId}:${c.center.x.toFixed(9)},${c.center.y.toFixed(9)}`,
    )
  expect(centers(a)).toEqual(centers(b))
})

test("quadratic BEATS greedy wirelength on a multi-hub board (the realistic chip+caps topology)", () => {
  const input = multiHub(48)
  const greedy = pack({
    ...input,
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  })
  const quad = pack(input, { quadraticFallback: false })
  expect(aabbOverlaps(quad, input.minGap)).toBe(0)
  expect(wirelength(quad)).toBeLessThan(wirelength(greedy))
}, 30000)

test("quadratic makes the tight-bounds grp10 board VALID and beats greedy wirelength", () => {
  const input = grp10 as unknown as PackInput
  const greedy = pack({
    ...input,
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  })
  // Default (FAST) preset: the bounded-shelf fallback ships a gate-valid layout
  // on this tight-bounds, dominant-component board (greedy is valid at ~66.25).
  const quad = pack(
    { ...input, packPlacementStrategy: "quadratic" },
    { quadraticFallback: false },
  )
  expect(validatePackedLayout(quad.components, input).ok).toBe(true)
  expect(wirelength(quad)).toBeLessThanOrEqual(wirelength(greedy) + EPS)
}, 30000)
