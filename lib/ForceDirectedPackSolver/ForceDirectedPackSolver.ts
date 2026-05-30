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
 * Force-directed / analytical placement (SPIKE).
 *
 * This is an ADDITIVE alternative to the greedy outline packer (PackSolver2).
 * It models placement as a physical system and integrates it to equilibrium:
 *
 *   - Springs (sparse, follow the netlist): pads/components that share a
 *     networkId attract each other. Multi-pin nets use the STAR model: every
 *     pad of the net is attracted to the net's centroid (not all-pairs).
 *     `weightedConnections` make a net's spring stiffer.
 *   - Repulsion (dense, ignores netlist): any two components whose inflated
 *     (minGap) AABBs are within range push apart, force rising sharply as they
 *     approach. A uniform spatial grid hash restricts this to near neighbours.
 *   - Pinned anchors: `isStatic` components never move; springs pull movable
 *     parts toward them.
 *
 * Integration is deterministic (NO randomness): the initial layout is a sorted
 * coarse grid. Each step computes the net force on every movable component,
 * takes a damped step, and stops when the max displacement drops below a
 * tolerance or a max-iteration cap is hit.
 *
 * After equilibrium a LEGALIZATION pass snaps each component's rotation to its
 * availableRotationDegrees and resolves residual overlaps by iterated
 * grid-based nudging. See `legalize()` for its (documented) limitations.
 */

interface Body {
  component: InputComponent
  /** continuous center during simulation */
  x: number
  y: number
  /** chosen rotation in degrees (snapped during legalization) */
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
   * (x,y). All overlap/repulsion maths must use the box centre, not the origin,
   * or asymmetric parts (e.g. corner cells in a mesh) are separated as if
   * symmetric and end up still overlapping. Zero for symmetric components.
   */
  boxOffX: number
  boxOffY: number
  isStatic: boolean
  /** index used as a stable, deterministic tiebreaker */
  index: number
}

export interface ForceDirectedOptions {
  /** spring constant for ordinary nets */
  springK?: number
  /** extra multiplier applied to nets carrying a weightedConnection */
  weightedSpringMultiplier?: number
  /** repulsion strength */
  repulsionK?: number
  /** integration damping (0..1); step = damping * force */
  damping?: number
  /** max simulation iterations */
  maxIterations?: number
  /** convergence tolerance on max per-step displacement */
  tolerance?: number
  /** max legalization sweeps */
  maxLegalizeIterations?: number
  /**
   * Optimize each component's discrete rotation (post-equilibrium coordinate
   * descent over availableRotationDegrees, minimizing pad-to-net-centroid
   * wirelength). Default true — matches the greedy packer, which evaluates all
   * rotations. Set false to freeze rotation at availableRotationDegrees[0].
   */
  optimizeRotation?: boolean
  /**
   * If true, movable components start the simulation at their provided
   * `center` (when present) instead of the default coarse grid. This is the
   * hook for connectivity-aware / greedy seeding: drop the relaxation into a
   * better basin so it converges to a shallower local minimum. Components with
   * no `center` still fall back to the grid slot.
   */
  seedFromCenters?: boolean
}

/**
 * Bodies are separated to just beyond exact contact by this margin so that
 * floating-point noise cannot leave a residual positive overlap that the
 * (stricter, 1e-6) bench metric would flag. Far below minGap so it does not
 * meaningfully inflate spacing.
 */
const LEGALIZE_MARGIN = 1e-4

const DEFAULTS: Required<ForceDirectedOptions> = {
  // springK / repulsionK are the dominant quality knobs: it is their RATIO (and
  // overall stiffness), not the iteration count, that sets how tightly the
  // equilibrium packs connected components. A too-weak spring (the original
  // 0.08 against 1.5 repulsion, ~1:19) leaves a loose equilibrium with badly
  // inflated wirelength — measured 4.6x the greedy packer on the cj01 fixture
  // and ~2.3x on a 25-component chain. Scaling both up while keeping repulsion
  // stiffer than the spring (~1:5) lets connected parts pull tight against the
  // contact forces without the damped integrator diverging. Measured on the
  // bench this takes cj01 4.6x -> 1.9x greedy and the 25-chain to ~parity, with
  // overlaps still cleared to 0 and the disconnected case unchanged. The
  // residual gap to the greedy packer on connected designs is the local-minimum
  // ceiling of iterative force-directed placement; a quadratic wirelength solve
  // or connectivity-aware seeding is what closes it further.
  springK: 2.0,
  weightedSpringMultiplier: 3,
  repulsionK: 10,
  damping: 0.12,
  maxIterations: 3000,
  tolerance: 5e-4,
  maxLegalizeIterations: 4000,
  optimizeRotation: true,
  seedFromCenters: false,
}

export class ForceDirectedPackSolver {
  packInput: PackInput
  opts: Required<ForceDirectedOptions>

  bodies: Body[] = []
  packedComponents: PackedComponent[] = []
  iterationsRun = 0
  converged = false

  /** Per-net list of pad references (resolved to body + local pad offset). */
  private nets: Array<{
    networkId: string
    stiffness: number
    members: Array<{ body: Body; pad: OutputPad }>
  }> = []

  constructor(packInput: PackInput, options: ForceDirectedOptions = {}) {
    this.packInput = packInput
    this.opts = { ...DEFAULTS, ...options }
  }

  solve(): void {
    this.setup()
    this.simulate()
    this.rotationCoordinateDescent()
    this.legalize()
    this.buildOutput()
  }

  // ---- setup -------------------------------------------------------------

  private setup(): void {
    const { components, minGap } = this.packInput

    // Filter out invalid components the same way PackSolver2 does.
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

    // Deterministic ordering: largest area first, then componentId. Static
    // components keep their given centers.
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

    // Initial deterministic grid layout for movable components.
    const movableCount = sized.filter((s) => !s.component.isStatic).length
    const cols = Math.max(1, Math.ceil(Math.sqrt(movableCount)))
    // Use the median size as the grid spacing so initial layout is overlap-free.
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
        // Default deterministic grid slot.
        const col = movableIndex % cols
        const row = Math.floor(movableIndex / cols)
        x = col * spacingX
        y = row * spacingY
        // Connectivity-aware / greedy seeding: start from the provided center.
        if (this.opts.seedFromCenters && s.component.center) {
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
      // Compute the rotation-aware collision box via the CANONICAL bounds
      // (matching the output/overlap metric exactly — see canonicalBounds).
      this.applyRotationBox(body, rotationDeg)
      return body
    })

    // Grid cell sizing. The repulsion / overlap interaction range between two
    // bodies is at most  maxHalfW_a + maxHalfW_b (+minGap) == maxFullW + minGap
    // (and similarly for height). A 3x3 neighbour query reaches +/-1 cell.
    //
    // Theorem: if |Δx| < cellSize then floor(xA/cellSize) and floor(xB/cellSize)
    // differ by at most 1. So choosing cellSize STRICTLY GREATER than the
    // interaction range guarantees the +/-1 query sees every overlapping pair,
    // regardless of how the two centers straddle cell boundaries. (Picking
    // cellSize exactly == range is the boundary case and is fragile, so we use
    // a hair more.) NOTE: the prompt suggests ~median component size; for the
    // near-uniform sizes the packer produces median ≈ max, but sizing off the
    // MAX component is the correct, sound choice for mixed sizes.
    // Obstacles (keep-out boxes): inflate half-extents by minGap/2 so that a
    // movable body whose own minGap/2-inflated AABB just clears the inflated
    // obstacle is provably >= minGap from the RAW obstacle box. Obstacles are
    // immovable — they exert force/MTV on movable bodies but never absorb any.
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

    // A large obstacle widens the interaction range, so the grid cell size (and
    // thus the 3x3 neighbour theorem) must account for it. Obstacle forces use
    // direct loops, but body-body repulsion still relies on the grid.
    const maxObsFull = this.obstacles.reduce(
      (m, o) => Math.max(m, o.halfW * 2, o.halfH * 2),
      0,
    )
    const maxFullW = Math.max(...sized.map((s) => s.w), medianW, maxObsFull)
    const maxFullH = Math.max(...sized.map((s) => s.h), medianH, maxObsFull)
    const interactionRange = Math.max(maxFullW + minGap, maxFullH + minGap, 0.1)
    this.cellSize = interactionRange * 1.0001
    // IMPORTANT: rebuild the grid with the chosen cell size. (The field
    // initializer constructs it with a placeholder size; if we forget this the
    // grid silently uses the wrong cell size and misses overlaps.)
    this.grid = new SpatialGridHash(this.cellSize)

    // Seed the initial layout feasibly w.r.t. the hardest region: a polygon is
    // tighter than a bounds rect, so seed inside the polygon when present.
    if (this.polygon) this.seedAroundAnchor()
    else if (this.bounds) this.fitInitialLayoutToBounds()

    this.buildNets()
  }

  /**
   * Find a point guaranteed to be inside the polygon (used as both the initial
   * seed and the projection target). The area-weighted centroid is interior for
   * convex polygons; for non-convex outlines it may fall outside, so we fall
   * back to vertex/centroid midpoints and finally a coarse grid scan over the
   * polygon's bounding box (nearest interior cell to the centroid).
   */
  private derivePolygonAnchor(): void {
    const poly = this.polygon!
    const c = getPolygonCentroid(poly)
    if (isPointInPolygon(c, poly)) {
      this.anchorX = c.x
      this.anchorY = c.y
      return
    }
    // midpoints between centroid and each vertex
    for (const v of poly) {
      const m = { x: (c.x + v.x) / 2, y: (c.y + v.y) / 2 }
      if (isPointInPolygon(m, poly)) {
        this.anchorX = m.x
        this.anchorY = m.y
        return
      }
    }
    // coarse grid scan: nearest interior cell-centre to the centroid
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
    // Fall back to the centroid if the scan found nothing (degenerate polygon).
    this.anchorX = best ? best.x : c.x
    this.anchorY = best ? best.y : c.y
  }

  /** Seed all movable bodies on a small grid centred on the polygon anchor. */
  private seedAroundAnchor(): void {
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

  /** A body's constraint points: rotated pad centres + the 4 raw-AABB corners. */
  private bodyConstraintPoints(body: Body): Array<{ x: number; y: number }> {
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

  private bodyInsidePolygon(body: Body): boolean {
    const poly = this.polygon!
    for (const p of this.bodyConstraintPoints(body)) {
      if (!isPointInPolygon(p, poly)) return false
    }
    return true
  }

  /**
   * If any of a body's constraint points falls outside the polygon, march its
   * box-centre toward the interior anchor until all points are inside. Returns
   * whether it moved. Bodies too big to fit anywhere settle at the anchor.
   */
  private projectBodyInside(body: Body): boolean {
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
    return true // best effort: parked at the anchor
  }

  /**
   * Translate + uniformly shrink-to-fit the movable cluster so its raw AABB
   * lies within `bounds` (centred on the bounds centre). Shrink only (scale<=1):
   * a cluster already smaller than bounds is just re-centred. Operates on the
   * collision-box centre (x+boxOff) so asymmetric parts fit correctly.
   */
  private fitInitialLayoutToBounds(): void {
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

  /**
   * Clamp a body so its raw AABB lies within `bounds`. Wider-than-bounds bodies
   * are centred on the axis. Returns whether it moved beyond FP noise (so the
   * legalizer knows projection is not yet stable).
   */
  private clampToBounds(body: Body): boolean {
    const b = this.bounds!
    const EPS = 1e-9
    let moved = false
    // X
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
    // Y
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

  private cellSize = 1

  /** Inflated keep-out boxes (immovable). Empty when no obstacles are set. */
  private obstacles: Array<{
    x: number
    y: number
    halfW: number
    halfH: number
  }> = []

  /** Rectangle the whole layout must fit inside, or null. */
  private bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  } | null = null

  /** Polygon every component must stay inside, or null. */
  private polygon: Array<{ x: number; y: number }> | null = null
  /** A verified-interior point of the polygon (projection target / seed). */
  private anchorX = 0
  private anchorY = 0

  private buildNets(): void {
    // Map networkId -> list of {body, pad}. Pads carry their rotated-zero
    // offset; we recompute absolute pad positions on the fly during the sim.
    const byNet = new Map<string, Array<{ body: Body; pad: OutputPad }>>()
    const padIdsInNet = new Map<string, Set<string>>()

    for (const body of this.bodies) {
      for (const inputPad of body.component.pads) {
        const pad: OutputPad = {
          ...inputPad,
          absoluteCenter: { x: 0, y: 0 },
        }
        const arr = byNet.get(inputPad.networkId) ?? []
        arr.push({ body, pad })
        byNet.set(inputPad.networkId, arr)

        const set = padIdsInNet.get(inputPad.networkId) ?? new Set<string>()
        set.add(inputPad.padId)
        padIdsInNet.set(inputPad.networkId, set)
      }
    }

    const weighted = this.packInput.weightedConnections

    this.nets = []
    for (const [networkId, members] of byNet.entries()) {
      // A net needs at least 2 members spanning >1 distinct component to be a
      // spring (intra-component pads don't move relative to each other).
      const distinctBodies = new Set(members.map((m) => m.body.index))
      if (members.length < 2 || distinctBodies.size < 2) continue

      // Determine stiffness: stiffer if any member pair is a strong/weighted
      // connection. isStrongConnection returns true for everything when there
      // are no weightedConnections (backward compatible). When weighted
      // connections ARE present, treat a net as "weighted" iff at least one
      // strong pair exists within it.
      let stiffness = this.opts.springK
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
        if (hasStrong) {
          stiffness = this.opts.springK * this.opts.weightedSpringMultiplier
        }
      }

      this.nets.push({ networkId, stiffness, members })
    }
  }

  // ---- simulation --------------------------------------------------------

  /** Recompute absolute pad centers for a body given its current x/y/rotation. */
  private padAbsolute(body: Body, pad: OutputPad): { x: number; y: number } {
    const angle = (body.rotationDeg * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x: body.x + pad.offset.x * cos - pad.offset.y * sin,
      y: body.y + pad.offset.x * sin + pad.offset.y * cos,
    }
  }

  /** A pad's absolute position at a HYPOTHETICAL rotation (no mutation). */
  private padAbsoluteAt(
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
   * Bounds of a component at a given rotation computed the CANONICAL way —
   * exactly as the output / overlap metric (getComponentBounds on a rotated
   * packed component). This matters for non-square pads at 90/270: rotating the
   * pad footprint (w/h swap) gives a different box than getInputComponentBounds,
   * so using the canonical box keeps the solver's internal overlap maths in
   * agreement with what downstream actually sees (no phantom or missed overlaps).
   */
  private canonicalBounds(
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
    // Use the COLLISION bounds (union of the already-rotated emitted pad boxes),
    // not getComponentBounds — the latter double-rotates 90/270 pad sizes and
    // would give the FD solver a wrong (un-rotated) collision box for rotated
    // non-square parts, causing it to pack them overlapping.
    return getComponentCollisionBounds(packed, 0)
  }

  /** Set a body's rotation and recompute its rotation-aware collision box. */
  private applyRotationBox(body: Body, rotationDeg: number): void {
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
   * Discrete rotation optimization (coordinate descent), run AFTER the position
   * sim reaches equilibrium. Each round, every movable body with >=2 allowed
   * rotations snaps to the orientation minimizing its own pad-to-net-centroid
   * wirelength (holding all other bodies fixed); after a round that changed any
   * rotation we re-settle positions (a capped re-simulate) since the geometry
   * moved, and repeat until no rotation changes or a small round cap.
   *
   * Deterministic: bodies visited in stable index order; candidate angles
   * normalized + deduped + ascending; the CURRENT rotation is evaluated first
   * and a switch requires STRICT improvement, so exact ties keep the current
   * orientation (no flapping). The terminal legalize() guarantees overlap-free
   * output using the post-rotation (canonical) boxes.
   */
  private rotationCoordinateDescent(): void {
    if (!this.opts.optimizeRotation) return
    const MAX_ROUNDS = 8
    // Re-settle passes between rotation rounds are capped so descent cost stays
    // bounded (the wirelength is set by the equilibrium already reached).
    const RESETTLE_ITERS = Math.min(this.opts.maxIterations, 600)

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
        // Evaluate current FIRST so exact ties keep it (prefer no change).
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
      // Rotations changed the geometry; re-settle positions (capped).
      this.simulate(RESETTLE_ITERS)
    }
  }

  private simulate(maxIterations: number = this.opts.maxIterations): void {
    const { repulsionK, damping, tolerance } = this.opts

    for (let iter = 0; iter < maxIterations; iter++) {
      this.iterationsRun = iter + 1

      // Force accumulator per body index.
      const fx = new Float64Array(this.bodies.length)
      const fy = new Float64Array(this.bodies.length)

      // --- Spring forces (star model around net centroid) ---
      for (const net of this.nets) {
        // Compute centroid of pad positions.
        let cx = 0
        let cy = 0
        const positions = net.members.map((m) => {
          const p = this.padAbsolute(m.body, m.pad)
          cx += p.x
          cy += p.y
          return p
        })
        cx /= positions.length
        cy /= positions.length

        for (let i = 0; i < net.members.length; i++) {
          const m = net.members[i]!
          if (m.body.isStatic) continue
          const p = positions[i]!
          // Quadratic energy => linear restoring force toward centroid.
          // F = -k * (p - centroid). (energy = 0.5 k d^2)
          fx[m.body.index]! += -net.stiffness * (p.x - cx)
          fy[m.body.index]! += -net.stiffness * (p.y - cy)
        }
      }

      // --- Repulsion forces via grid hash ---
      // Insert/query at the COLLISION-BOX centre (origin + boxOff), not the
      // component origin, so asymmetric parts repel from where they actually are.
      this.grid.clear()
      for (const body of this.bodies) {
        this.grid.insert(
          body.index,
          body.x + body.boxOffX,
          body.y + body.boxOffY,
        )
      }

      for (const a of this.bodies) {
        if (a.isStatic) continue
        const neighbors = this.grid.queryNeighbors(
          a.x + a.boxOffX,
          a.y + a.boxOffY,
        )
        for (const bIdx of neighbors) {
          if (bIdx <= a.index) continue // each unordered pair once (a.index < b)
          const b = this.bodies[bIdx]!
          // Required separation between box centres for AABBs (with minGap padding).
          const sepX = a.halfW + b.halfW
          const sepY = a.halfH + b.halfH
          const dx = a.x + a.boxOffX - (b.x + b.boxOffX)
          const dy = a.y + a.boxOffY - (b.y + b.boxOffY)
          // Overlap (penetration) along each axis; positive => overlapping.
          const overlapX = sepX - Math.abs(dx)
          const overlapY = sepY - Math.abs(dy)
          if (overlapX <= 0 || overlapY <= 0) continue // separated on an axis

          // Push apart along the axis of least penetration (MTV direction).
          // Stiff linear contact: F = repulsionK * penetration. Because
          // repulsionK >> springK, this strongly resists overlap, so the system
          // settles at near-zero penetration rather than letting springs pull
          // components through one another.
          let pushX = 0
          let pushY = 0
          if (overlapX < overlapY) {
            const dir = dx === 0 ? this.signByIndex(a, b) : Math.sign(dx)
            pushX = dir * repulsionK * overlapX
          } else {
            const dir = dy === 0 ? this.signByIndex(a, b) : Math.sign(dy)
            pushY = dir * repulsionK * overlapY
          }

          fx[a.index]! += pushX
          fy[a.index]! += pushY
          if (!b.isStatic) {
            fx[b.index]! -= pushX
            fy[b.index]! -= pushY
          }
        }
      }

      // --- Obstacle repulsion (immovable keep-out boxes; no reaction force) ---
      if (this.obstacles.length > 0) {
        for (const a of this.bodies) {
          if (a.isStatic) continue
          const ax = a.x + a.boxOffX
          const ay = a.y + a.boxOffY
          for (const o of this.obstacles) {
            const overlapX = a.halfW + o.halfW - Math.abs(ax - o.x)
            const overlapY = a.halfH + o.halfH - Math.abs(ay - o.y)
            if (overlapX <= 0 || overlapY <= 0) continue
            if (overlapX < overlapY) {
              const dir =
                ax === o.x ? (a.index % 2 === 0 ? 1 : -1) : Math.sign(ax - o.x)
              fx[a.index]! += dir * repulsionK * overlapX
            } else {
              const dir =
                ay === o.y ? (a.index % 2 === 0 ? 1 : -1) : Math.sign(ay - o.y)
              fy[a.index]! += dir * repulsionK * overlapY
            }
          }
        }
      }

      // --- Bounds wall force (inward; RAW half-extents = the violation def) ---
      if (this.bounds) {
        const b = this.bounds
        const wallK = repulsionK
        for (const a of this.bodies) {
          if (a.isStatic) continue
          const cx = a.x + a.boxOffX
          const cy = a.y + a.boxOffY
          const loX = cx - a.rawHalfW
          const hiX = cx + a.rawHalfW
          if (loX < b.minX) fx[a.index]! += wallK * (b.minX - loX)
          else if (hiX > b.maxX) fx[a.index]! += wallK * (b.maxX - hiX)
          const loY = cy - a.rawHalfH
          const hiY = cy + a.rawHalfH
          if (loY < b.minY) fy[a.index]! += wallK * (b.minY - loY)
          else if (hiY > b.maxY) fy[a.index]! += wallK * (b.maxY - hiY)
        }
      }

      // --- Boundary polygon inward force (toward the interior anchor) ---
      if (this.polygon) {
        const boundaryK = repulsionK
        for (const a of this.bodies) {
          if (a.isStatic) continue
          const pts = this.bodyConstraintPoints(a)
          let outside = 0
          for (const p of pts) {
            if (!isPointInPolygon(p, this.polygon)) outside++
          }
          if (outside === 0) continue
          const cx = a.x + a.boxOffX
          const cy = a.y + a.boxOffY
          const dx = this.anchorX - cx
          const dy = this.anchorY - cy
          const len = Math.hypot(dx, dy) || 1
          const mag = boundaryK * (outside / pts.length)
          fx[a.index]! += (dx / len) * mag
          fy[a.index]! += (dy / len) * mag
        }
      }

      // --- Integrate (damped) and track max displacement ---
      // Clamp the per-step move so a stiff contact spike cannot eject a body
      // across the board (keeps integration stable / deterministic).
      const maxStep = this.cellSize
      let maxDisp = 0
      for (const body of this.bodies) {
        if (body.isStatic) continue
        let ddx = damping * fx[body.index]!
        let ddy = damping * fy[body.index]!
        const stepLen = Math.hypot(ddx, ddy)
        if (stepLen > maxStep && stepLen > 0) {
          const scale = maxStep / stepLen
          ddx *= scale
          ddy *= scale
        }
        body.x += ddx
        body.y += ddy
        const disp = Math.hypot(ddx, ddy)
        if (disp > maxDisp) maxDisp = disp
      }

      if (maxDisp < tolerance) {
        this.converged = true
        break
      }
    }
  }

  private grid = new SpatialGridHash(1)

  /** Deterministic tiebreak direction when two centers coincide exactly. */
  private signByIndex(a: Body, b: Body): number {
    return a.index < b.index ? 1 : -1
  }

  // ---- legalization ------------------------------------------------------

  /**
   * Legalization pass.
   *
   * 1. Rotation snap: the continuous simulation never rotates components, so we
   *    keep each body's rotation at the first available rotation (set at
   *    setup). Orientation is NOT optimized — honest limitation.
   *
   * 2. Overlap removal (DISPLACEMENT-MINIMIZING): Jacobi-style iterated grid
   *    nudging (`nudgeUntilClear`). Each sweep we accumulate, for every
   *    overlapping movable pair, half the minimum translation vector into a
   *    per-body displacement buffer, then apply all displacements at once
   *    (static bodies don't move; the movable partner absorbs the full push).
   *    Only overlapping pairs move, and each by the *minimum* translation
   *    needed — so a near-legal analytical layout is repaired in place, leaving
   *    its global shape (and thus its wirelength) intact. Accumulating then
   *    applying (rather than in-place Gauss-Seidel) makes the sweep
   *    order-independent and damps whack-a-mole oscillation in dense clusters.
   *
   * 3. Guaranteed fallback (`spreadToLegal`): if the local nudge cannot clear
   *    every overlap within the sweep cap (only happens in pathologically tight
   *    coils), we radially EXPAND the movable bodies about their centroid and
   *    re-nudge. Unlike a row/shelf reshelve this preserves the analytical
   *    layout's angular structure — wirelength grows roughly uniformly instead
   *    of being discarded. On all benched fixtures the nudge clears on its own
   *    and this fallback never triggers.
   *
   * NOTE (measured): the dominant wirelength cost is the SIMULATION equilibrium,
   * not this pass — on the cj01 fixture legalization moves wirelength by <1.
   * The spring/repulsion balance (`springK`/`repulsionK`) is what determines
   * layout quality; see DEFAULTS.
   *
   * Limitations:
   *   - It does not compact gaps left by the simulation.
   *   - Positions stay continuous (no lattice snap).
   *   - Boundary/obstacle constraints are NOT enforced (out of spike scope).
   */
  private legalize(): void {
    this.nudgeUntilClear(this.opts.maxLegalizeIterations)
    // Authoritative final check: the nudge's "cleared" return is based on its
    // grid-localized scan; trust only the exact O(n^2) overlap count here, so a
    // missed pair can never leave a real overlap in the output.
    if (this.countOverlaps() === 0) return

    if (this.bounds || this.polygon) {
      // A bounded region is set: the radial spread would push parts OUTSIDE it,
      // so use a damped compress-toward-interior fallback for snug regions
      // instead. The compress target is the polygon anchor (when set) else the
      // bounds centre. Residual overlaps after this signal an FD-infeasible
      // region — the pack() validation re-checks the output and falls back to
      // the greedy packer.
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

    // Unconstrained: guaranteed displacement-minimizing radial spread.
    this.spreadToLegal()
  }

  /**
   * Snug-region fallback: a plain constrained nudge can gridlock against the
   * walls/boundary. Gently compress every movable body toward an interior point
   * (so they peel off the constraint) and re-nudge (which re-separates AND
   * re-projects back inside), until overlaps clear or progress stalls. Only
   * invoked when the constrained nudge left residual overlaps. Bounded rounds
   * -> always terminates.
   */
  private compressTowardLegalize(tx: number, ty: number): void {
    const ROUNDS = 80
    const RETAIN = 0.95 // move ~5% toward the interior point each round
    let prev = this.countOverlaps()
    let stale = 0
    for (let r = 0; r < ROUNDS && this.countOverlaps() > 0; r++) {
      for (const m of this.bodies) {
        if (m.isStatic) continue
        m.x = tx + (m.x - tx) * RETAIN
        m.y = ty + (m.y - ty) * RETAIN
      }
      this.nudgeUntilClear(this.opts.maxLegalizeIterations)
      const cur = this.countOverlaps()
      if (cur >= prev) {
        if (++stale >= 3) break
      } else {
        stale = 0
      }
      prev = cur
    }
  }

  /**
   * One Jacobi minimum-translation-vector nudge campaign. Returns true if every
   * overlap was cleared within `maxSweeps`. Moves only overlapping bodies, each
   * by the least distance needed to separate — i.e. displacement-minimizing.
   */
  private nudgeUntilClear(maxSweeps: number): boolean {
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

          // Overlap measured between COLLISION-BOX centres (origin + boxOff).
          const sepX = a.halfW + b.halfW
          const sepY = a.halfH + b.halfH
          const dx = a.x + a.boxOffX - (b.x + b.boxOffX)
          const dy = a.y + a.boxOffY - (b.y + b.boxOffY)
          const overlapX = sepX - Math.abs(dx)
          const overlapY = sepY - Math.abs(dy)
          // Resolve to just BEYOND exact contact (target separation = sep +
          // LEGALIZE_MARGIN) so FP noise leaves pairs on the non-overlapping
          // side. We only treat a pair as needing work while it is still
          // penetrating past that target, which keeps the sweep stable (it
          // does not keep pushing already-separated pairs).
          const needX = overlapX + LEGALIZE_MARGIN
          const needY = overlapY + LEGALIZE_MARGIN
          if (overlapX <= 0 || overlapY <= 0) continue // separated already

          anyOverlap = true

          // Minimum translation vector, along least-penetration axis.
          let tx = 0
          let ty = 0
          if (needX < needY) {
            const dir = dx === 0 ? this.signByIndex(a, b) : Math.sign(dx)
            tx = dir * needX
          } else {
            const dir = dy === 0 ? this.signByIndex(a, b) : Math.sign(dy)
            ty = dir * needY
          }

          // Accumulate (Jacobi): static partner absorbs nothing.
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

      // Obstacle clearance: obstacle is the immovable partner, so the movable
      // body absorbs the full minimum-translation vector out of the keep-out.
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

      // Apply the accumulated displacements (zero when there were no overlaps).
      for (const body of this.bodies) {
        if (body.isStatic) continue
        body.x += dispX[body.index]!
        body.y += dispY[body.index]!
      }

      // Projection pass: keep bodies inside the bounds rectangle. A clamped body
      // acts as an immovable partner next sweep, so its neighbour is pushed the
      // other way. The sweep is settled only when nothing overlaps AND nothing
      // needed projecting.
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
  private countOverlaps(): number {
    let count = 0
    for (let i = 0; i < this.bodies.length; i++) {
      const a = this.bodies[i]!
      for (let j = i + 1; j < this.bodies.length; j++) {
        const b = this.bodies[j]!
        if (a.isStatic && b.isStatic) continue
        // Compare COLLISION-BOX centres (origin + boxOff), matching the
        // canonical pad-bounding-box used downstream.
        const overlapX =
          a.halfW + b.halfW - Math.abs(a.x + a.boxOffX - (b.x + b.boxOffX))
        const overlapY =
          a.halfH + b.halfH - Math.abs(a.y + a.boxOffY - (b.y + b.boxOffY))
        // Any genuine geometric penetration counts as a residual overlap.
        if (overlapX > 1e-9 && overlapY > 1e-9) count++
      }
    }
    // Body-vs-obstacle penetrations count too, so spreadToLegal can engage if
    // the local nudge cannot satisfy obstacle clearance.
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
   * Displacement-minimizing guaranteed fallback ("spread-to-legal").
   *
   * Invoked only when the local nudge could not clear every overlap within its
   * sweep cap (pathologically tight clusters). Rather than discarding the
   * analytical layout and re-rowing everything from scratch (a shelf/abacus
   * reshelve, which destroys the wirelength the placer worked out), we expand
   * the movable bodies RADIALLY about their shared centroid and re-run the
   * local nudge.
   *
   * Radial expansion about the centroid scales every pairwise center distance
   * AMONG MOVABLE BODIES by the same factor (since c + s·(a−c) minus c + s·(b−c)
   * = s·(a−b)), so it strictly separates movable pairs while preserving the
   * layout's ANGULAR structure — wirelength grows roughly uniformly instead of
   * being thrown away. We escalate geometrically (×1.5/round) and re-nudge until
   * overlaps clear, which is guaranteed to converge well within the round cap
   * because unbounded expansion separates everything. Movable–static residuals
   * are cleaned up by the interleaved nudge.
   */
  private spreadToLegal(): void {
    const movable = this.bodies.filter((b) => !b.isStatic)
    // With <2 movable bodies there is nothing to spread (a lone movable body
    // boxed in by statics is already as separated as the nudge can make it).
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
      this.nudgeUntilClear(this.opts.maxLegalizeIterations)
    }
  }

  // ---- output ------------------------------------------------------------

  private buildOutput(): void {
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

/** Convenience wrapper mirroring the shape PackSolver2 exposes. */
export const runForceDirectedPack = (
  packInput: PackInput,
  options?: ForceDirectedOptions,
): PackedComponent[] => {
  const solver = new ForceDirectedPackSolver(packInput, options)
  solver.solve()
  return solver.packedComponents
}
