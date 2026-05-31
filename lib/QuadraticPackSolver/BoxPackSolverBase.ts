import type {
  InputComponent,
  PackedComponent,
  PackInput,
  OutputPad,
} from "../types"
import { getInputComponentBounds } from "../geometry/getInputComponentBounds"
import { getComponentCollisionBounds } from "../geometry/getComponentCollisionBounds"
import { setPackedComponentPadCenters } from "../PackSolver2/setPackedComponentPadCenters"
import { isStrongConnection } from "../utils/isStrongConnection"
import { isPointInPolygon } from "../math/isPointInPolygon"
import { getPolygonCentroid } from "../math/getPolygonCentroid"
import { SpatialGridHash } from "./SpatialGridHash"

/**
 * Shared scaffolding for box-pin component packers that place into continuous
 * space and then legalize: deterministic setup + seeding, rotation-aware
 * collision boxes that match the validator exactly (`canonicalBounds`), the
 * net graph, discrete rotation coordinate descent, and a displacement-minimizing
 * legalizer (grid-nudge + bounded/polygon projection + radial-spread / compress
 * fallbacks). It is placement-engine agnostic: the concrete subclass supplies
 * the actual placement via `solve()` and a `resettle()` hook (used by the
 * rotation descent to re-settle positions after an orientation change).
 *
 * `QuadraticPackSolver` is the analytical (Bound2Bound quadratic) realization.
 * All geometry here is deterministic (no RNG).
 */

export interface Body {
  component: InputComponent
  /** continuous component-origin position */
  x: number
  y: number
  /** chosen rotation in degrees (CCW) */
  rotationDeg: number
  /** half-extent of the rotation-aware collision AABB including minGap/2 padding */
  halfW: number
  halfH: number
  /** un-padded half-extent (for overlap measurement) */
  rawHalfW: number
  rawHalfH: number
  /**
   * Offset of the pad bounding-box CENTRE from the component origin (`x`,`y`),
   * rotation-aware. A component whose pads are not centred on its origin has a
   * non-zero offset, so its collision box sits at (x+boxOffX, y+boxOffY), NOT at
   * (x,y). All overlap maths must use the box centre, not the origin, or
   * asymmetric parts are separated as if symmetric and end up still overlapping.
   * Zero for symmetric components.
   */
  boxOffX: number
  boxOffY: number
  isStatic: boolean
  /** stable, deterministic tiebreaker */
  index: number
}

export interface BoxPackSolverBaseOptions {
  /** max legalization sweeps */
  maxLegalizeIterations?: number
  /**
   * Optimize each component's discrete rotation (coordinate descent over
   * availableRotationDegrees, minimizing pad-to-net-centroid wirelength). Default
   * true — matches the greedy packer, which evaluates all rotations.
   */
  optimizeRotation?: boolean
  /**
   * Start movable components at their provided `center` (when present) instead of
   * the default coarse grid. Hook for connectivity-aware / external seeding.
   */
  seedFromCenters?: boolean
}

/**
 * Bodies are separated to just beyond exact contact by this margin so FP noise
 * cannot leave a residual positive overlap the (stricter, 1e-6) validator flags.
 */
const LEGALIZE_MARGIN = 1e-4

/** Net weight for an ordinary net, and the multiplier for a weighted net. */
const NET_WEIGHT = 1
const WEIGHTED_NET_MULTIPLIER = 3

export abstract class BoxPackSolverBase {
  packInput: PackInput
  baseOpts: Required<BoxPackSolverBaseOptions>

  bodies: Body[] = []
  packedComponents: PackedComponent[] = []

  /** Per-net list of pad references (resolved to body + local pad offset). */
  protected nets: Array<{
    networkId: string
    weight: number
    members: Array<{ body: Body; pad: OutputPad }>
  }> = []

  protected cellSize = 1
  protected grid = new SpatialGridHash(1)

  /** Inflated keep-out boxes (immovable). Empty when no obstacles are set. */
  protected obstacles: Array<{
    x: number
    y: number
    halfW: number
    halfH: number
  }> = []

  /** Rectangle the whole layout must fit inside, or null. */
  protected bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  } | null = null

  /** Polygon every component must stay inside, or null. */
  protected polygon: Array<{ x: number; y: number }> | null = null
  /** A verified-interior point of the polygon (projection target / seed). */
  protected anchorX = 0
  protected anchorY = 0

  constructor(packInput: PackInput, options: BoxPackSolverBaseOptions = {}) {
    this.packInput = packInput
    this.baseOpts = {
      maxLegalizeIterations: options.maxLegalizeIterations ?? 4000,
      optimizeRotation: options.optimizeRotation ?? true,
      seedFromCenters: options.seedFromCenters ?? false,
    }
  }

  /** The concrete placement engine. */
  abstract solve(): void

  /**
   * Re-settle positions after the rotation descent changed orientations. The
   * subclass implements this with its placement engine (a capped re-solve).
   */
  protected abstract resettle(): void

  // ---- setup -------------------------------------------------------------

  protected setup(): void {
    const { components, minGap } = this.packInput

    const validComponents = components.filter((component) => {
      if (component.pads.length === 0) return false
      return component.pads.every(
        (pad) =>
          Number.isFinite(pad.size.x) &&
          Number.isFinite(pad.size.y) &&
          pad.size.x > 0 &&
          pad.size.y > 0,
      )
    })

    // Deterministic ordering: largest area first, then componentId.
    const sized = validComponents.map((component) => {
      const b = getInputComponentBounds(component, { rotationDegrees: 0 })
      const w = b.maxX - b.minX
      const h = b.maxY - b.minY
      return { component, w, h, area: w * h }
    })
    sized.sort(
      (a, b) =>
        b.area - a.area ||
        a.component.componentId.localeCompare(b.component.componentId),
    )

    const movableCount = sized.filter((s) => !s.component.isStatic).length
    const cols = Math.max(1, Math.ceil(Math.sqrt(movableCount)))
    const widths = sized.map((s) => s.w).sort((a, b) => a - b)
    const heights = sized.map((s) => s.h).sort((a, b) => a - b)
    const medianW = widths.length ? widths[Math.floor(widths.length / 2)]! : 1
    const medianH = heights.length
      ? heights[Math.floor(heights.length / 2)]!
      : 1
    const spacingX = medianW + minGap + Math.max(...sized.map((s) => s.w), 0)
    const spacingY = medianH + minGap + Math.max(...sized.map((s) => s.h), 0)

    let movableIndex = 0
    this.bodies = sized.map((s, i) => {
      const isStatic = Boolean(s.component.isStatic)
      let x: number
      let y: number
      if (isStatic) {
        x = s.component.center?.x ?? 0
        y = s.component.center?.y ?? 0
      } else {
        const col = movableIndex % cols
        const row = Math.floor(movableIndex / cols)
        x = col * spacingX
        y = row * spacingY
        if (this.baseOpts.seedFromCenters && s.component.center) {
          x = s.component.center.x
          y = s.component.center.y
        }
        movableIndex++
      }

      const rotationDeg = isStatic
        ? (s.component.ccwRotationOffset ?? 0)
        : (s.component.availableRotationDegrees?.[0] ?? 0)

      const body: Body = {
        component: s.component,
        x,
        y,
        rotationDeg,
        halfW: 0,
        halfH: 0,
        rawHalfW: 0,
        rawHalfH: 0,
        boxOffX: 0,
        boxOffY: 0,
        isStatic,
        index: i,
      }
      this.applyRotationBox(body, rotationDeg)
      return body
    })

    this.obstacles = (this.packInput.obstacles ?? []).map((o) => ({
      x: o.absoluteCenter.x,
      y: o.absoluteCenter.y,
      halfW: o.width / 2 + minGap / 2,
      halfH: o.height / 2 + minGap / 2,
    }))

    this.bounds = this.packInput.bounds ?? null
    const outline = this.packInput.boundaryOutline
    this.polygon = outline && outline.length >= 3 ? outline : null
    if (this.polygon) this.derivePolygonAnchor()

    const maxObsFull = this.obstacles.reduce(
      (m, o) => Math.max(m, o.halfW * 2, o.halfH * 2),
      0,
    )
    const maxFullW = Math.max(...sized.map((s) => s.w), medianW, maxObsFull)
    const maxFullH = Math.max(...sized.map((s) => s.h), medianH, maxObsFull)
    const interactionRange = Math.max(maxFullW + minGap, maxFullH + minGap, 0.1)
    this.cellSize = interactionRange * 1.0001
    this.grid = new SpatialGridHash(this.cellSize)

    if (this.polygon) this.seedAroundAnchor()
    else if (this.bounds) this.fitInitialLayoutToBounds()

    this.buildNets()
  }

  protected derivePolygonAnchor(): void {
    const poly = this.polygon!
    const c = getPolygonCentroid(poly)
    if (isPointInPolygon(c, poly)) {
      this.anchorX = c.x
      this.anchorY = c.y
      return
    }
    for (const v of poly) {
      const m = { x: (c.x + v.x) / 2, y: (c.y + v.y) / 2 }
      if (isPointInPolygon(m, poly)) {
        this.anchorX = m.x
        this.anchorY = m.y
        return
      }
    }
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const v of poly) {
      minX = Math.min(minX, v.x)
      maxX = Math.max(maxX, v.x)
      minY = Math.min(minY, v.y)
      maxY = Math.max(maxY, v.y)
    }
    const N = 32
    let best: { x: number; y: number } | null = null
    let bestD = Infinity
    for (let i = 0; i <= N; i++) {
      for (let j = 0; j <= N; j++) {
        const p = {
          x: minX + ((maxX - minX) * i) / N,
          y: minY + ((maxY - minY) * j) / N,
        }
        if (!isPointInPolygon(p, poly)) continue
        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2
        if (d < bestD) {
          bestD = d
          best = p
        }
      }
    }
    this.anchorX = best ? best.x : c.x
    this.anchorY = best ? best.y : c.y
  }

  protected seedAroundAnchor(): void {
    const movable = this.bodies.filter((m) => !m.isStatic)
    if (movable.length === 0) return
    const cols = Math.max(1, Math.ceil(Math.sqrt(movable.length)))
    const step = this.packInput.minGap + 0.01
    movable.forEach((m, k) => {
      const col = k % cols
      const row = Math.floor(k / cols)
      m.x = this.anchorX + (col - (cols - 1) / 2) * step - m.boxOffX
      m.y = this.anchorY + (row - (cols - 1) / 2) * step - m.boxOffY
    })
  }

  protected bodyConstraintPoints(body: Body): Array<{ x: number; y: number }> {
    const angle = (body.rotationDeg * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const pts: Array<{ x: number; y: number }> = []
    for (const p of body.component.pads) {
      pts.push({
        x: body.x + p.offset.x * cos - p.offset.y * sin,
        y: body.y + p.offset.x * sin + p.offset.y * cos,
      })
    }
    const cx = body.x + body.boxOffX
    const cy = body.y + body.boxOffY
    pts.push({ x: cx - body.rawHalfW, y: cy - body.rawHalfH })
    pts.push({ x: cx + body.rawHalfW, y: cy - body.rawHalfH })
    pts.push({ x: cx - body.rawHalfW, y: cy + body.rawHalfH })
    pts.push({ x: cx + body.rawHalfW, y: cy + body.rawHalfH })
    return pts
  }

  protected bodyInsidePolygon(body: Body): boolean {
    const poly = this.polygon!
    for (const p of this.bodyConstraintPoints(body)) {
      if (!isPointInPolygon(p, poly)) return false
    }
    return true
  }

  protected projectBodyInside(body: Body): boolean {
    if (this.bodyInsidePolygon(body)) return false
    const cx0 = body.x + body.boxOffX
    const cy0 = body.y + body.boxOffY
    const STEPS = 24
    for (let s = 1; s <= STEPS; s++) {
      const t = s / STEPS
      body.x = cx0 + (this.anchorX - cx0) * t - body.boxOffX
      body.y = cy0 + (this.anchorY - cy0) * t - body.boxOffY
      if (this.bodyInsidePolygon(body)) return true
    }
    return true
  }

  protected fitInitialLayoutToBounds(): void {
    const b = this.bounds!
    const movable = this.bodies.filter((m) => !m.isStatic)
    if (movable.length === 0) return
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const m of movable) {
      const cx = m.x + m.boxOffX
      const cy = m.y + m.boxOffY
      minX = Math.min(minX, cx - m.rawHalfW)
      maxX = Math.max(maxX, cx + m.rawHalfW)
      minY = Math.min(minY, cy - m.rawHalfH)
      maxY = Math.max(maxY, cy + m.rawHalfH)
    }
    const clusterW = Math.max(maxX - minX, 1e-9)
    const clusterH = Math.max(maxY - minY, 1e-9)
    const scale = Math.min(
      1,
      (b.maxX - b.minX) / clusterW,
      (b.maxY - b.minY) / clusterH,
    )
    const clusterCx = (minX + maxX) / 2
    const clusterCy = (minY + maxY) / 2
    const boundsCx = (b.minX + b.maxX) / 2
    const boundsCy = (b.minY + b.maxY) / 2
    for (const m of movable) {
      const cx = m.x + m.boxOffX
      const cy = m.y + m.boxOffY
      m.x = boundsCx + (cx - clusterCx) * scale - m.boxOffX
      m.y = boundsCy + (cy - clusterCy) * scale - m.boxOffY
    }
  }

  protected clampToBounds(body: Body): boolean {
    const b = this.bounds!
    const EPS = 1e-9
    let moved = false
    const cx = body.x + body.boxOffX
    if (body.rawHalfW * 2 >= b.maxX - b.minX) {
      const target = (b.minX + b.maxX) / 2 - body.boxOffX
      if (Math.abs(body.x - target) > EPS) {
        body.x = target
        moved = true
      }
    } else if (cx - body.rawHalfW < b.minX - EPS) {
      body.x += b.minX - (cx - body.rawHalfW)
      moved = true
    } else if (cx + body.rawHalfW > b.maxX + EPS) {
      body.x -= cx + body.rawHalfW - b.maxX
      moved = true
    }
    const cy = body.y + body.boxOffY
    if (body.rawHalfH * 2 >= b.maxY - b.minY) {
      const target = (b.minY + b.maxY) / 2 - body.boxOffY
      if (Math.abs(body.y - target) > EPS) {
        body.y = target
        moved = true
      }
    } else if (cy - body.rawHalfH < b.minY - EPS) {
      body.y += b.minY - (cy - body.rawHalfH)
      moved = true
    } else if (cy + body.rawHalfH > b.maxY + EPS) {
      body.y -= cy + body.rawHalfH - b.maxY
      moved = true
    }
    return moved
  }

  protected buildNets(): void {
    const byNet = new Map<string, Array<{ body: Body; pad: OutputPad }>>()
    for (const body of this.bodies) {
      for (const inputPad of body.component.pads) {
        const pad: OutputPad = { ...inputPad, absoluteCenter: { x: 0, y: 0 } }
        const arr = byNet.get(inputPad.networkId) ?? []
        arr.push({ body, pad })
        byNet.set(inputPad.networkId, arr)
      }
    }

    const weighted = this.packInput.weightedConnections
    this.nets = []
    for (const [networkId, members] of byNet.entries()) {
      const distinctBodies = new Set(members.map((m) => m.body.index))
      if (members.length < 2 || distinctBodies.size < 2) continue

      let weight = NET_WEIGHT
      if (weighted && weighted.length > 0) {
        let hasStrong = false
        for (let i = 0; i < members.length && !hasStrong; i++) {
          for (let j = i + 1; j < members.length; j++) {
            if (
              isStrongConnection(
                members[i]!.pad.padId,
                members[j]!.pad.padId,
                weighted,
              )
            ) {
              hasStrong = true
              break
            }
          }
        }
        if (hasStrong) weight = NET_WEIGHT * WEIGHTED_NET_MULTIPLIER
      }
      this.nets.push({ networkId, weight, members })
    }
  }

  // ---- pad geometry ------------------------------------------------------

  protected padAbsolute(body: Body, pad: OutputPad): { x: number; y: number } {
    const angle = (body.rotationDeg * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x: body.x + pad.offset.x * cos - pad.offset.y * sin,
      y: body.y + pad.offset.x * sin + pad.offset.y * cos,
    }
  }

  protected padAbsoluteAt(
    body: Body,
    pad: OutputPad,
    rotationDeg: number,
  ): { x: number; y: number } {
    const angle = (rotationDeg * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x: body.x + pad.offset.x * cos - pad.offset.y * sin,
      y: body.y + pad.offset.x * sin + pad.offset.y * cos,
    }
  }

  /**
   * Bounds of a component at a given rotation computed the CANONICAL way — the
   * union of the already-rotated emitted pad boxes (matching the validator's
   * getComponentCollisionBounds), so non-square pads at 90/270 get the correct
   * (w/h swapped) collision box and internal overlap maths agree with downstream.
   */
  protected canonicalBounds(
    component: InputComponent,
    rotationDeg: number,
  ): { minX: number; maxX: number; minY: number; maxY: number } {
    const norm = ((rotationDeg % 360) + 360) % 360
    const packed: PackedComponent = {
      ...component,
      center: { x: 0, y: 0 },
      ccwRotationOffset: norm,
      pads: component.pads.map((p) => ({
        ...p,
        absoluteCenter: { x: 0, y: 0 },
      })),
    }
    setPackedComponentPadCenters(packed)
    return getComponentCollisionBounds(packed, 0)
  }

  protected applyRotationBox(body: Body, rotationDeg: number): void {
    const { minGap } = this.packInput
    const rb = this.canonicalBounds(body.component, rotationDeg)
    const bw = rb.maxX - rb.minX
    const bh = rb.maxY - rb.minY
    body.rotationDeg = rotationDeg
    body.halfW = bw / 2 + minGap / 2
    body.halfH = bh / 2 + minGap / 2
    body.rawHalfW = bw / 2
    body.rawHalfH = bh / 2
    body.boxOffX = (rb.minX + rb.maxX) / 2
    body.boxOffY = (rb.minY + rb.maxY) / 2
  }

  /**
   * Discrete rotation optimization (coordinate descent). Each round every movable
   * body with >=2 allowed rotations snaps to the orientation minimizing its own
   * pad-to-net-centroid wirelength (others fixed); after a round that changed any
   * rotation we re-settle positions via the subclass `resettle()`. Deterministic:
   * stable index order; current evaluated first; switch requires strict
   * improvement (no flapping).
   */
  protected rotationCoordinateDescent(): void {
    if (!this.baseOpts.optimizeRotation) return
    const MAX_ROUNDS = 8

    const candidatesByIndex = new Map<number, number[]>()
    for (const body of this.bodies) {
      if (body.isStatic) continue
      const raw = body.component.availableRotationDegrees ?? [0, 90, 180, 270]
      const set = new Set<number>()
      for (const r of raw) set.add(((r % 360) + 360) % 360)
      const list = [...set].sort((a, b) => a - b)
      if (list.length >= 2) candidatesByIndex.set(body.index, list)
    }
    if (candidatesByIndex.size === 0) return

    for (let round = 0; round < MAX_ROUNDS; round++) {
      let anyChanged = false
      for (const body of this.bodies) {
        const candidates = candidatesByIndex.get(body.index)
        if (!candidates) continue
        const bodyNets = this.nets.filter((n) =>
          n.members.some((m) => m.body.index === body.index),
        )
        if (bodyNets.length === 0) continue

        const cur = body.rotationDeg
        let bestRot = cur
        let bestCost = Infinity
        const ordered = [cur, ...candidates.filter((r) => r !== cur)]
        for (const rot of ordered) {
          let cost = 0
          for (const net of bodyNets) {
            let cx = 0
            let cy = 0
            const pos: Array<{ x: number; y: number; mine: boolean }> = []
            for (const m of net.members) {
              const mine = m.body.index === body.index
              const p = mine
                ? this.padAbsoluteAt(body, m.pad, rot)
                : this.padAbsolute(m.body, m.pad)
              cx += p.x
              cy += p.y
              pos.push({ x: p.x, y: p.y, mine })
            }
            cx /= pos.length
            cy /= pos.length
            for (const p of pos) {
              if (p.mine) cost += Math.hypot(p.x - cx, p.y - cy)
            }
          }
          if (cost < bestCost - 1e-9) {
            bestCost = cost
            bestRot = rot
          }
        }
        if (bestRot !== cur) {
          this.applyRotationBox(body, bestRot)
          anyChanged = true
        }
      }
      if (!anyChanged) break
      this.resettle()
    }
  }

  /** Deterministic tiebreak when two centers coincide exactly. */
  protected signByIndex(a: Body, b: Body): number {
    return a.index < b.index ? 1 : -1
  }

  // ---- legalization ------------------------------------------------------

  /**
   * Displacement-minimizing legalization: Jacobi grid-nudge that moves only
   * overlapping pairs, each by the minimum translation needed (so a near-legal
   * layout is repaired in place, preserving wirelength). Unconstrained residuals
   * fall back to a radial spread; bounded/polygon residuals to a compress-toward-
   * interior pass (genuinely-infeasible regions are caught by the pack() gate).
   */
  protected legalize(): void {
    this.nudgeUntilClear(this.baseOpts.maxLegalizeIterations)
    if (this.countOverlaps() === 0) return

    if (this.bounds || this.polygon) {
      let tx: number
      let ty: number
      if (this.polygon) {
        tx = this.anchorX
        ty = this.anchorY
      } else {
        const b = this.bounds!
        tx = (b.minX + b.maxX) / 2
        ty = (b.minY + b.maxY) / 2
      }
      this.compressTowardLegalize(tx, ty)
      return
    }
    this.spreadToLegal()
  }

  protected compressTowardLegalize(tx: number, ty: number): void {
    const ROUNDS = 80
    const RETAIN = 0.95
    let prev = this.countOverlaps()
    let stale = 0
    for (let r = 0; r < ROUNDS && this.countOverlaps() > 0; r++) {
      for (const m of this.bodies) {
        if (m.isStatic) continue
        m.x = tx + (m.x - tx) * RETAIN
        m.y = ty + (m.y - ty) * RETAIN
      }
      this.nudgeUntilClear(this.baseOpts.maxLegalizeIterations)
      const cur = this.countOverlaps()
      if (cur >= prev) {
        if (++stale >= 3) break
      } else {
        stale = 0
      }
      prev = cur
    }
  }

  protected nudgeUntilClear(maxSweeps: number): boolean {
    const dispX = new Float64Array(this.bodies.length)
    const dispY = new Float64Array(this.bodies.length)

    for (let sweep = 0; sweep < maxSweeps; sweep++) {
      this.grid.clear()
      for (const body of this.bodies) {
        this.grid.insert(
          body.index,
          body.x + body.boxOffX,
          body.y + body.boxOffY,
        )
      }
      dispX.fill(0)
      dispY.fill(0)

      let anyOverlap = false
      for (const a of this.bodies) {
        const neighbors = this.grid
          .queryNeighbors(a.x + a.boxOffX, a.y + a.boxOffY)
          .sort((p, q) => p - q)
        for (const bIdx of neighbors) {
          if (bIdx <= a.index) continue
          const b = this.bodies[bIdx]!
          if (a.isStatic && b.isStatic) continue

          const sepX = a.halfW + b.halfW
          const sepY = a.halfH + b.halfH
          const dx = a.x + a.boxOffX - (b.x + b.boxOffX)
          const dy = a.y + a.boxOffY - (b.y + b.boxOffY)
          const overlapX = sepX - Math.abs(dx)
          const overlapY = sepY - Math.abs(dy)
          const needX = overlapX + LEGALIZE_MARGIN
          const needY = overlapY + LEGALIZE_MARGIN
          if (overlapX <= 0 || overlapY <= 0) continue

          anyOverlap = true

          let tx = 0
          let ty = 0
          if (needX < needY) {
            const dir = dx === 0 ? this.signByIndex(a, b) : Math.sign(dx)
            tx = dir * needX
          } else {
            const dir = dy === 0 ? this.signByIndex(a, b) : Math.sign(dy)
            ty = dir * needY
          }

          if (a.isStatic) {
            dispX[b.index]! -= tx
            dispY[b.index]! -= ty
          } else if (b.isStatic) {
            dispX[a.index]! += tx
            dispY[a.index]! += ty
          } else {
            dispX[a.index]! += tx / 2
            dispY[a.index]! += ty / 2
            dispX[b.index]! -= tx / 2
            dispY[b.index]! -= ty / 2
          }
        }
      }

      if (this.obstacles.length > 0) {
        for (const a of this.bodies) {
          if (a.isStatic) continue
          const ax = a.x + a.boxOffX
          const ay = a.y + a.boxOffY
          for (const o of this.obstacles) {
            const ox = a.halfW + o.halfW - Math.abs(ax - o.x)
            const oy = a.halfH + o.halfH - Math.abs(ay - o.y)
            if (ox <= 0 || oy <= 0) continue
            anyOverlap = true
            const needX = ox + LEGALIZE_MARGIN
            const needY = oy + LEGALIZE_MARGIN
            if (needX < needY) {
              const dir =
                ax === o.x ? (a.index % 2 === 0 ? 1 : -1) : Math.sign(ax - o.x)
              dispX[a.index]! += dir * needX
            } else {
              const dir =
                ay === o.y ? (a.index % 2 === 0 ? 1 : -1) : Math.sign(ay - o.y)
              dispY[a.index]! += dir * needY
            }
          }
        }
      }

      for (const body of this.bodies) {
        if (body.isStatic) continue
        body.x += dispX[body.index]!
        body.y += dispY[body.index]!
      }

      let anyProjected = false
      if (this.bounds || this.polygon) {
        for (const body of this.bodies) {
          if (body.isStatic) continue
          let moved = false
          if (this.bounds && this.clampToBounds(body)) moved = true
          if (this.polygon && this.projectBodyInside(body)) moved = true
          if (moved) anyProjected = true
        }
      }

      if (!anyOverlap && !anyProjected) return true
    }
    return false
  }

  /** Count currently-overlapping movable-involving pairs (exact, O(n^2)). */
  protected countOverlaps(): number {
    let count = 0
    for (let i = 0; i < this.bodies.length; i++) {
      const a = this.bodies[i]!
      for (let j = i + 1; j < this.bodies.length; j++) {
        const b = this.bodies[j]!
        if (a.isStatic && b.isStatic) continue
        const overlapX =
          a.halfW + b.halfW - Math.abs(a.x + a.boxOffX - (b.x + b.boxOffX))
        const overlapY =
          a.halfH + b.halfH - Math.abs(a.y + a.boxOffY - (b.y + b.boxOffY))
        if (overlapX > 1e-9 && overlapY > 1e-9) count++
      }
    }
    for (const a of this.bodies) {
      if (a.isStatic) continue
      const ax = a.x + a.boxOffX
      const ay = a.y + a.boxOffY
      for (const o of this.obstacles) {
        const ox = a.halfW + o.halfW - Math.abs(ax - o.x)
        const oy = a.halfH + o.halfH - Math.abs(ay - o.y)
        if (ox > 1e-9 && oy > 1e-9) count++
      }
    }
    return count
  }

  /**
   * Guaranteed displacement-minimizing fallback: radially expand the movable
   * bodies about their centroid (preserving angular structure, so wirelength
   * grows roughly uniformly instead of being discarded) and re-nudge until clear.
   */
  protected spreadToLegal(): void {
    const movable = this.bodies.filter((b) => !b.isStatic)
    if (movable.length < 2) return
    let cx = 0
    let cy = 0
    for (const b of movable) {
      cx += b.x
      cy += b.y
    }
    cx /= movable.length
    cy /= movable.length

    const EXPANSION = 1.5
    const MAX_ROUNDS = 64
    for (let round = 0; round < MAX_ROUNDS; round++) {
      if (this.countOverlaps() === 0) return
      for (const b of movable) {
        b.x = cx + (b.x - cx) * EXPANSION
        b.y = cy + (b.y - cy) * EXPANSION
      }
      this.nudgeUntilClear(this.baseOpts.maxLegalizeIterations)
    }
  }

  // ---- output ------------------------------------------------------------

  protected buildOutput(): void {
    this.packedComponents = this.bodies.map((body) => {
      const packed: PackedComponent = {
        ...body.component,
        center: { x: body.x, y: body.y },
        ccwRotationOffset: body.rotationDeg,
        ccwRotationDegrees: body.rotationDeg,
        pads: body.component.pads.map((p) => ({
          ...p,
          absoluteCenter: { x: 0, y: 0 },
        })),
      }
      setPackedComponentPadCenters(packed)
      return packed
    })
  }
}
