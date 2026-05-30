import { getComponentCollisionBounds } from "./geometry/getComponentCollisionBounds"
import { getComponentCollisionBoxes } from "./PackSolver2/getComponentCollisionBoxes"
import { computeDistanceBetweenBoxes } from "@tscircuit/math-utils"
import { isPointInPolygon } from "./math/isPointInPolygon"
import type { InputComponent, PackInput, PackedComponent } from "./types"

const EPS = 1e-6

export interface LayoutValidation {
  ok: boolean
  reasons: string[]
}

/** Same validity filter the solvers use to drop degenerate components. */
function isValidComponent(c: InputComponent): boolean {
  if (c.pads.length === 0) return false
  return c.pads.every(
    (p) =>
      Number.isFinite(p.size.x) &&
      Number.isFinite(p.size.y) &&
      p.size.x > 0 &&
      p.size.y > 0,
  )
}

/**
 * Independent, authoritative re-validation of a packed layout against the input
 * constraints, derived purely from the emitted PackedComponent[] (it does NOT
 * trust any solver-internal "cleared" flags). This is the release safety gate:
 * `pack()` runs it on the force-directed output and falls back to the greedy
 * packer if it fails.
 *
 * Checks (only those whose constraint is present):
 *   1. No two components' minGap-inflated AABBs interpenetrate (overlap-free).
 *   2. Every component keeps >= minGap clearance from every obstacle (per-pad).
 *   3. Every component's AABB lies within `bounds`.
 *   4. Every pad centre and AABB corner lies inside `boundaryOutline`.
 *   5. The layout placed all valid input components (none dropped).
 */
export function validatePackedLayout(
  components: PackedComponent[],
  input: PackInput,
): LayoutValidation {
  const reasons: string[] = []
  const minGap = input.minGap

  // 0. Non-finite guard. Every check below compares against the component's
  // coordinates, and any comparison with NaN/Infinity evaluates false — so a
  // body with non-finite centre/pad coords would be invisible to the overlap,
  // bounds, obstacle and polygon checks and slip through as "ok". Flag it
  // explicitly so the gate falls back to greedy instead of shipping garbage.
  let nonFinite = 0
  for (const c of components) {
    const coords = [
      c.center.x,
      c.center.y,
      ...c.pads.flatMap((p) => [p.absoluteCenter.x, p.absoluteCenter.y]),
    ]
    if (coords.some((v) => !Number.isFinite(v))) nonFinite++
  }
  if (nonFinite > 0)
    reasons.push(`${nonFinite} component(s) with non-finite coordinates`)

  // 1. Overlaps (rotation-aware AABB, inflated by minGap/2 each).
  const boxes = components.map((c) =>
    getComponentCollisionBounds(c, minGap / 2),
  )
  let overlaps = 0
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!
      const b = boxes[j]!
      const ox = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)
      const oy = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY)
      if (ox > EPS && oy > EPS) overlaps++
    }
  }
  if (overlaps > 0) reasons.push(`${overlaps} overlapping component pair(s)`)

  // 2. Obstacle clearance (per-pad collision boxes vs obstacle boxes).
  if (input.obstacles && input.obstacles.length > 0) {
    let viol = 0
    for (const c of components) {
      const cboxes = getComponentCollisionBoxes(c)
      let bad = false
      for (const cb of cboxes) {
        for (const o of input.obstacles) {
          const { distance } = computeDistanceBetweenBoxes(cb, {
            center: o.absoluteCenter,
            width: o.width,
            height: o.height,
          })
          if (distance + EPS < minGap) {
            bad = true
            break
          }
        }
        if (bad) break
      }
      if (bad) viol++
    }
    if (viol > 0) reasons.push(`${viol} component(s) too close to obstacles`)
  }

  // 3. Bounds (raw AABB within the rectangle).
  if (input.bounds) {
    const bd = input.bounds
    let viol = 0
    for (const c of components) {
      const b = getComponentCollisionBounds(c, 0)
      if (
        b.minX < bd.minX - EPS ||
        b.maxX > bd.maxX + EPS ||
        b.minY < bd.minY - EPS ||
        b.maxY > bd.maxY + EPS
      ) {
        viol++
      }
    }
    if (viol > 0) reasons.push(`${viol} component(s) outside bounds`)
  }

  // 4. Boundary outline (pad centres + AABB corners inside the polygon).
  const poly = input.boundaryOutline
  if (poly && poly.length >= 3) {
    let viol = 0
    for (const c of components) {
      const b = getComponentCollisionBounds(c, 0)
      const pts = [
        ...c.pads.map((p) => p.absoluteCenter),
        { x: b.minX, y: b.minY },
        { x: b.maxX, y: b.minY },
        { x: b.minX, y: b.maxY },
        { x: b.maxX, y: b.maxY },
      ]
      if (pts.some((p) => !isPointInPolygon(p, poly))) viol++
    }
    if (viol > 0) reasons.push(`${viol} component(s) outside boundary outline`)
  }

  // 5. Component count (no dropped parts).
  const validCount = input.components.filter(isValidComponent).length
  if (components.length !== validCount) {
    reasons.push(`placed ${components.length} of ${validCount} components`)
  }

  return { ok: reasons.length === 0, reasons }
}
