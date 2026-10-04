import {
  BoxPackSolverBase,
  type Body,
  type BoxPackSolverBaseOptions,
} from "./BoxPackSolverBase"
import type { PackInput } from "../types"
import { isPointInPolygon } from "../math/isPointInPolygon"
import { type SparseSpdMatrix, solvePcg } from "./solveCG"

/**
 * Analytical quadratic component packer (FastPlace + SimPL lineage).
 *
 * Instead of greedily placing one component at a time against a recomputed
 * outline (the O(n^3) greedy packer) or integrating springs to equilibrium, this
 * writes the wirelength objective as a quadratic energy via the Bound2Bound
 * (B2B) net model and solves it EXACTLY each round with a single sparse linear
 * solve (preconditioned Conjugate Gradient, see solveCG.ts). That lands on the
 * global wirelength optimum of the overlap-ignoring relaxed problem. Overlap is
 * then removed with a displacement-minimizing legalizer (inherited from
 * BoxPackSolverBase) that preserves the compact arrangement, and the iterate is
 * anchored back to its current legal positions each round so connected parts
 * pull together by a controlled step rather than collapsing to a point — the
 * analytic analogue of a force-directed equilibrium, reached via exact solves.
 *
 * On top of that core, several measured, individually no-regression refinements:
 *   - a Bound2Bound objective with an optional centroid-pull term that aligns the
 *     quadratic with the star-to-centroid wirelength metric;
 *   - a translation-optimization polish that recovers wirelength the legalizer
 *     left on the table (strictly legality- and wirelength-preserving);
 *   - a bounded shelf / pinned-fill fallback that guarantees a legal layout under
 *     a tight bounds rectangle when the normal legalizer can't fit;
 *   - an optional connectivity-aware BFS-hub-ring seed.
 *
 * Two presets via `quality`: FAST (default — a single analytical solve, polish +
 * shelf on; speed-competitive with greedy) and QUALITY (dual-seed + centroid-pull
 * best-of selection; squeezes the last wirelength out of dense boards at the cost
 * of several solves). Fully deterministic: no RNG, fixed candidate sets and
 * iteration order, PCG operates on fixed-order typed arrays.
 */

export interface QuadraticOptions extends BoxPackSolverBaseOptions {
  // --- analytical core ---
  /** Outer rounds (anchored QP solve + minimal-displacement legalize). */
  maxRounds?: number
  /** Rounds used by the rotation re-settle. */
  resettleRounds?: number
  /** Relative residual tolerance for the inner PCG solve. */
  cgRelTol?: number
  /** Hard cap on PCG iterations (also bounded by the system size). */
  cgMaxItersCap?: number
  /**
   * Step-control anchor toward the current (legal) positions, as a multiple of
   * the median spring weight: damps how far the wirelength solve pulls connected
   * components together in one round. The legalizer separates the residual
   * overlaps, so iterating converges to a compact legal layout.
   */
  stepInitial?: number
  /** Geometric decay of the step anchor per round. */
  stepDecay?: number
  /** Tikhonov floor on the step anchor (SPD guarantee). */
  tikhonovFactor?: number
  /** Sweeps allowed for the per-round look-ahead legalization. */
  lookaheadSweeps?: number

  // --- objective alignment ---
  /**
   * Centroid-pull weight as a multiple of the median net weight (0 => pure B2B
   * box-span). Pulls each pad toward its net's current centroid (RHS-only, no
   * fill-in), aligning the optimized objective with the star-to-centroid metric.
   * Set per-candidate by the best-of sweep when `quality`/`cpCandidates` enable it.
   */
  centroidPull?: number

  // --- presets / refinements ---
  /**
   * QUALITY preset: enable the dual-seed + centroid-pull-sweep best-of search
   * (keeps the lowest-wirelength legal layout). Squeezes dense/synthetic boards
   * (chain/mesh) at the cost of several solves. Default false — the single-solve
   * FAST preset (polish + shelf still on) is the default. Explicit options below
   * override it.
   */
  quality?: boolean
  /** Disable the translation polish (default false). */
  disablePolish?: boolean
  /** Disable the bounded-shelf fallback (default false). */
  disableBoundedShelf?: boolean
  /** centroid-pull weights swept for the best-of selection (0 always included). */
  cpCandidates?: number[]
  /** Above this movable-body count, only cp=0 is used (speed gate). */
  cpSweepMaxBodies?: number
  /** Also try a connectivity-aware seed and keep the better valid result. */
  useConnSeed?: boolean
  /** Above this movable-body count the conn seed is skipped (speed gate). */
  connSeedMaxBodies?: number
  /** Polish sweeps / bisection steps / relative tolerance. */
  polishSweeps?: number
  polishBisectSteps?: number
  polishRelTol?: number
}

const QCORE_DEFAULTS = {
  maxRounds: 14,
  resettleRounds: 4,
  cgRelTol: 1e-3,
  cgMaxItersCap: 250,
  stepInitial: 0.3,
  stepDecay: 0.88,
  tikhonovFactor: 1e-4,
  lookaheadSweeps: 2000,
}

const DEFAULT_CP_CANDIDATES = [0, 0.06, 0.1, 0.15]
const TINY = 1e-30

interface AxisSystem {
  diag: Float64Array
  /** off-diagonal accumulator keyed by i*m+j (i<j) -> value (negative) */
  off: Map<number, number>
  b: Float64Array
}

interface Snapshot {
  x: Float64Array
  y: Float64Array
  rot: Float64Array
}

export class QuadraticPackSolver extends BoxPackSolverBase {
  protected q: typeof QCORE_DEFAULTS
  protected plus: {
    disablePolish: boolean
    disableBoundedShelf: boolean
    cpCandidates: number[]
    cpSweepMaxBodies: number
    useConnSeed: boolean
    connSeedMaxBodies: number
    polishSweeps: number
    polishBisectSteps: number
    polishRelTol: number
  }

  /** Active centroid-pull weight for the current solve candidate. */
  protected centroidPull = 0

  /** Movable bodies in deterministic order; the QP variables. */
  protected movableBodies: Body[] = []
  /** body.index -> dense movable slot, or -1 for static. */
  protected slotByBodyIndex: Int32Array = new Int32Array(0)
  /** Median net weight of the current round (anchor / centroid-pull reference). */
  protected medianGamma = 1
  /** Floor on inter-pad distance used in B2B weights. */
  protected gammaEps = 1e-6

  constructor(packInput: PackInput, options: QuadraticOptions = {}) {
    super(packInput, {
      maxLegalizeIterations: options.maxLegalizeIterations ?? 4000,
      optimizeRotation: options.optimizeRotation ?? true,
      seedFromCenters: options.seedFromCenters ?? false,
    })
    this.q = {
      maxRounds: options.maxRounds ?? QCORE_DEFAULTS.maxRounds,
      resettleRounds: options.resettleRounds ?? QCORE_DEFAULTS.resettleRounds,
      cgRelTol: options.cgRelTol ?? QCORE_DEFAULTS.cgRelTol,
      cgMaxItersCap: options.cgMaxItersCap ?? QCORE_DEFAULTS.cgMaxItersCap,
      stepInitial: options.stepInitial ?? QCORE_DEFAULTS.stepInitial,
      stepDecay: options.stepDecay ?? QCORE_DEFAULTS.stepDecay,
      tikhonovFactor: options.tikhonovFactor ?? QCORE_DEFAULTS.tikhonovFactor,
      lookaheadSweeps:
        options.lookaheadSweeps ?? QCORE_DEFAULTS.lookaheadSweeps,
    }
    const quality = options.quality ?? false
    this.plus = {
      disablePolish: options.disablePolish ?? false,
      disableBoundedShelf: options.disableBoundedShelf ?? false,
      cpCandidates:
        options.cpCandidates ?? (quality ? DEFAULT_CP_CANDIDATES : [0]),
      cpSweepMaxBodies: options.cpSweepMaxBodies ?? 60,
      useConnSeed: options.useConnSeed ?? quality,
      connSeedMaxBodies: options.connSeedMaxBodies ?? 160,
      polishSweeps: options.polishSweeps ?? 12,
      polishBisectSteps: options.polishBisectSteps ?? 22,
      polishRelTol: options.polishRelTol ?? 1e-4,
    }
    this.centroidPull = options.centroidPull ?? 0
  }

  override solve(): void {
    this.setup()
    this.buildMovableIndex()
    if (this.movableBodies.length === 0) {
      this.buildOutput()
      return
    }
    this.computeScales()

    // Candidate seeds: deterministic grid (index 0, tie-break baseline) + an
    // optional connectivity-aware seed. Each is solved under the centroid-pull
    // sweep; the lowest-wirelength LEGAL layout is kept.
    const gridSeed = this.snapshotAll()
    const seeds: Snapshot[] = [gridSeed]
    if (
      this.plus.useConnSeed &&
      !this.bounds &&
      !this.polygon &&
      this.nets.length > 0 &&
      this.movableBodies.length <= this.plus.connSeedMaxBodies
    ) {
      this.applyConnSeed()
      seeds.push(this.snapshotAll())
      this.restoreAll(gridSeed)
    }

    const cps =
      this.nets.length > 0 &&
      this.movableBodies.length <= this.plus.cpSweepMaxBodies
        ? this.uniqueCps()
        : [0]

    let bestSnap: Snapshot | null = null
    let bestWL = Number.POSITIVE_INFINITY
    let haveValid = false

    for (const seed of seeds) {
      for (const cp of cps) {
        this.restoreAll(seed)
        this.centroidPull = cp
        this.runSimplLoop(this.q.maxRounds)
        this.rotationCoordinateDescent()
        this.legalize()
        if (
          !this.plus.disableBoundedShelf &&
          this.bounds &&
          !this.isLayoutValid()
        ) {
          this.shelfLegalize()
        }
        if (!this.plus.disablePolish) this.translationPolish()

        const valid = this.isLayoutValid()
        const wl = this.centroidWirelength()
        if (valid && !haveValid) {
          haveValid = true
          bestWL = Number.POSITIVE_INFINITY
        }
        if ((valid || !haveValid) && wl < bestWL) {
          bestWL = wl
          bestSnap = this.snapshotAll()
        }
      }
    }

    if (bestSnap) this.restoreAll(bestSnap)
    this.buildOutput()
  }

  /** Rotation re-settle hook: a capped analytic re-solve. */
  protected override resettle(): void {
    if (this.movableBodies.length === 0) return
    this.computeScales()
    this.runSimplLoop(this.q.resettleRounds)
  }

  // ---- index / scales ----------------------------------------------------

  protected buildMovableIndex(): void {
    this.slotByBodyIndex = new Int32Array(this.bodies.length).fill(-1)
    this.movableBodies = []
    for (const b of this.bodies) {
      if (b.isStatic) continue
      this.slotByBodyIndex[b.index] = this.movableBodies.length
      this.movableBodies.push(b)
    }
  }

  protected computeScales(): void {
    const dims: number[] = []
    for (const b of this.bodies) dims.push(b.rawHalfW * 2, b.rawHalfH * 2)
    dims.sort((a, b) => a - b)
    const scale = dims.length ? dims[Math.floor(dims.length / 2)]! : 1
    this.gammaEps = Math.max(1e-9, 1e-3 * (scale || 1))
  }

  protected rotatedOffset(
    body: Body,
    offset: { x: number; y: number },
  ): { x: number; y: number } {
    const angle = (body.rotationDeg * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x: offset.x * cos - offset.y * sin,
      y: offset.x * sin + offset.y * cos,
    }
  }

  // ---- SimPL outer loop (anchored QP solve + minimal legalize) -----------

  protected runSimplLoop(maxRounds: number): void {
    const m = this.movableBodies.length
    if (m === 0) return

    const warmX = new Float64Array(m)
    const warmY = new Float64Array(m)
    const syncWarm = () => {
      for (let s = 0; s < m; s++) {
        warmX[s] = this.movableBodies[s]!.x
        warmY[s] = this.movableBodies[s]!.y
      }
    }

    let bestWL = Number.POSITIVE_INFINITY
    let bestX: Float64Array | null = null
    let bestY: Float64Array | null = null
    let haveLegalBest = false

    const consider = (overlaps: number) => {
      const legal = overlaps === 0
      if (haveLegalBest && !legal) return
      const wl = this.centroidWirelength()
      if (legal && !haveLegalBest) {
        haveLegalBest = true
        bestWL = Number.POSITIVE_INFINITY
      }
      if (wl < bestWL) {
        bestWL = wl
        bestX = this.snapshotX()
        bestY = this.snapshotY()
      }
    }

    const cap = Math.min(
      this.baseOpts.maxLegalizeIterations,
      this.q.lookaheadSweeps,
    )

    this.nudgeUntilClear(cap)
    consider(this.countOverlaps())
    syncWarm()

    let stepFactor = this.q.stepInitial
    const cgMaxIters = Math.min(m, this.q.cgMaxItersCap)

    for (let round = 0; round < maxRounds; round++) {
      const { Ax, bx, Ay, by } = this.assembleSystems(stepFactor)
      const rx = solvePcg(Ax, bx, warmX, {
        maxIters: cgMaxIters,
        relTol: this.q.cgRelTol,
      })
      const ry = solvePcg(Ay, by, warmY, {
        maxIters: cgMaxIters,
        relTol: this.q.cgRelTol,
      })
      for (let s = 0; s < m; s++) {
        const b = this.movableBodies[s]!
        if (Number.isFinite(rx.x[s]!)) b.x = rx.x[s]!
        if (Number.isFinite(ry.x[s]!)) b.y = ry.x[s]!
      }
      this.nudgeUntilClear(cap)
      consider(this.countOverlaps())
      syncWarm()
      stepFactor *= this.q.stepDecay
    }

    if (bestX && bestY) {
      for (let s = 0; s < m; s++) {
        const b = this.movableBodies[s]!
        b.x = bestX[s]!
        b.y = bestY[s]!
      }
    }
  }

  // ---- B2B assembly ------------------------------------------------------

  /**
   * Assemble the two SPD systems (x and y) for the current iterate using the
   * Bound2Bound net model. Variables are movable component origins. Pad offsets
   * and static component centers enter the RHS only. An optional centroid-pull
   * term (RHS-only) and a step anchor toward the current position are added to
   * the diagonal+RHS — the step anchor guarantees strict diagonal dominance =>
   * SPD, so PCG always converges (even for a disconnected component).
   */
  protected assembleSystems(stepFactor: number): {
    Ax: SparseSpdMatrix
    bx: Float64Array
    Ay: SparseSpdMatrix
    by: Float64Array
  } {
    const m = this.movableBodies.length
    const X: AxisSystem = {
      diag: new Float64Array(m),
      off: new Map(),
      b: new Float64Array(m),
    }
    const Y: AxisSystem = {
      diag: new Float64Array(m),
      off: new Map(),
      b: new Float64Array(m),
    }
    const gammas: number[] = []

    for (const net of this.nets) {
      const k = net.members.length
      if (k < 2) continue
      const norm = 2 / (k - 1)
      const W = net.weight
      const ax = new Float64Array(k)
      const ay = new Float64Array(k)
      const offX = new Float64Array(k)
      const offY = new Float64Array(k)
      for (let i = 0; i < k; i++) {
        const mem = net.members[i]!
        const ro = this.rotatedOffset(mem.body, mem.pad.offset)
        offX[i] = ro.x
        offY[i] = ro.y
        ax[i] = mem.body.x + ro.x
        ay[i] = mem.body.y + ro.y
      }
      this.addNetAxis(X, net, k, norm, W, ax, offX, true, gammas)
      this.addNetAxis(Y, net, k, norm, W, ay, offY, false, gammas)
    }

    if (gammas.length) {
      gammas.sort((a, b) => a - b)
      this.medianGamma = gammas[Math.floor(gammas.length / 2)]! || 1
    } else {
      this.medianGamma = 1
    }

    // Centroid-pull (RHS-only): pull each movable pad toward its net's current
    // centroid; aligns the quadratic with the star-to-centroid metric.
    if (this.centroidPull > 0 && this.medianGamma > 0) {
      const cw = this.centroidPull * this.medianGamma
      for (const net of this.nets) {
        const k = net.members.length
        if (k < 2) continue
        let cx = 0
        let cy = 0
        const offX = new Float64Array(k)
        const offY = new Float64Array(k)
        for (let i = 0; i < k; i++) {
          const mem = net.members[i]!
          const ro = this.rotatedOffset(mem.body, mem.pad.offset)
          offX[i] = ro.x
          offY[i] = ro.y
          cx += mem.body.x + ro.x
          cy += mem.body.y + ro.y
        }
        cx /= k
        cy /= k
        for (let i = 0; i < k; i++) {
          const b = net.members[i]!.body
          const s = this.slotByBodyIndex[b.index]!
          if (s < 0) continue
          X.diag[s] = X.diag[s]! + cw
          Y.diag[s] = Y.diag[s]! + cw
          X.b[s] = X.b[s]! + cw * (cx - offX[i]!)
          Y.b[s] = Y.b[s]! + cw * (cy - offY[i]!)
        }
      }
    }

    const anchor =
      Math.max(this.q.tikhonovFactor, stepFactor) * this.medianGamma
    for (let s = 0; s < m; s++) {
      const b = this.movableBodies[s]!
      X.diag[s] = X.diag[s]! + anchor
      Y.diag[s] = Y.diag[s]! + anchor
      X.b[s] = X.b[s]! + anchor * b.x
      Y.b[s] = Y.b[s]! + anchor * b.y
    }

    return { Ax: this.toCsr(m, X), bx: X.b, Ay: this.toCsr(m, Y), by: Y.b }
  }

  private addNetAxis(
    sys: AxisSystem,
    net: {
      members: Array<{ body: Body; pad: { offset: { x: number; y: number } } }>
    },
    k: number,
    norm: number,
    W: number,
    abs: Float64Array,
    off: Float64Array,
    isX: boolean,
    gammas: number[],
  ): void {
    let iMin = 0
    let iMax = 0
    for (let i = 1; i < k; i++) {
      if (abs[i]! < abs[iMin]!) iMin = i
      if (abs[i]! > abs[iMax]!) iMax = i
    }

    const addEdge = (i: number, j: number) => {
      if (i === j) return
      const bi = net.members[i]!.body
      const bj = net.members[j]!.body
      if (bi.index === bj.index) return // intra-component => constant, skip
      const dist = Math.abs(abs[i]! - abs[j]!)
      const g = (norm * W) / Math.max(dist, this.gammaEps)
      gammas.push(g)
      const su = this.slotByBodyIndex[bi.index]!
      const sv = this.slotByBodyIndex[bj.index]!
      const aU = off[i]!
      const aV = off[j]!
      const uMov = su >= 0
      const vMov = sv >= 0
      if (uMov && vMov) {
        sys.diag[su] = sys.diag[su]! + g
        sys.diag[sv] = sys.diag[sv]! + g
        this.addOff(sys.off, su, sv, -g)
        sys.b[su] = sys.b[su]! - g * (aU - aV)
        sys.b[sv] = sys.b[sv]! + g * (aU - aV)
      } else if (uMov && !vMov) {
        const fixedV = isX ? bj.x : bj.y
        sys.diag[su] = sys.diag[su]! + g
        sys.b[su] = sys.b[su]! + g * (fixedV + aV - aU)
      } else if (!uMov && vMov) {
        const fixedU = isX ? bi.x : bi.y
        sys.diag[sv] = sys.diag[sv]! + g
        sys.b[sv] = sys.b[sv]! + g * (fixedU + aU - aV)
      }
    }

    if (k === 2) {
      addEdge(0, 1)
      return
    }
    addEdge(iMin, iMax)
    for (let i = 0; i < k; i++) {
      if (i === iMin || i === iMax) continue
      addEdge(i, iMin)
      addEdge(i, iMax)
    }
  }

  private addOff(
    off: Map<number, number>,
    su: number,
    sv: number,
    val: number,
  ): void {
    const i = su < sv ? su : sv
    const j = su < sv ? sv : su
    const key = i * this.movableBodies.length + j
    off.set(key, (off.get(key) ?? 0) + val)
  }

  private toCsr(m: number, sys: AxisSystem): SparseSpdMatrix {
    const rows: Array<Array<[number, number]>> = Array.from(
      { length: m },
      () => [],
    )
    for (const [key, val] of sys.off) {
      const i = Math.floor(key / m)
      const j = key % m
      rows[i]!.push([j, val])
      rows[j]!.push([i, val])
    }
    let nnz = 0
    for (let i = 0; i < m; i++) nnz += rows[i]!.length
    const rowPtr = new Int32Array(m + 1)
    const colIdx = new Int32Array(nnz)
    const offVal = new Float64Array(nnz)
    let k = 0
    for (let i = 0; i < m; i++) {
      rowPtr[i] = k
      const row = rows[i]!
      row.sort((a, b) => a[0] - b[0])
      for (const [c, v] of row) {
        colIdx[k] = c
        offVal[k] = v
        k++
      }
    }
    rowPtr[m] = k
    for (let i = 0; i < m; i++) {
      if (!(sys.diag[i]! > TINY)) sys.diag[i] = TINY
    }
    return { m, diag: sys.diag, rowPtr, colIdx, offVal }
  }

  // ---- metrics / snapshots ----------------------------------------------

  /** Star-to-centroid wirelength over ALL nets (== the benchmark metric). */
  protected centroidWirelength(): number {
    const byNet = new Map<string, Array<{ x: number; y: number }>>()
    for (const b of this.bodies) {
      for (const pad of b.component.pads) {
        const ro = this.rotatedOffset(b, pad.offset)
        const arr = byNet.get(pad.networkId) ?? []
        arr.push({ x: b.x + ro.x, y: b.y + ro.y })
        byNet.set(pad.networkId, arr)
      }
    }
    let total = 0
    for (const pts of byNet.values()) {
      if (pts.length < 2) continue
      let mx = 0
      let my = 0
      for (const p of pts) {
        mx += p.x
        my += p.y
      }
      mx /= pts.length
      my /= pts.length
      for (const p of pts) total += Math.hypot(p.x - mx, p.y - my)
    }
    return total
  }

  private snapshotX(): Float64Array {
    const m = this.movableBodies.length
    const a = new Float64Array(m)
    for (let s = 0; s < m; s++) a[s] = this.movableBodies[s]!.x
    return a
  }

  private snapshotY(): Float64Array {
    const m = this.movableBodies.length
    const a = new Float64Array(m)
    for (let s = 0; s < m; s++) a[s] = this.movableBodies[s]!.y
    return a
  }

  protected uniqueCps(): number[] {
    const out: number[] = [0]
    for (const c of this.plus.cpCandidates)
      if (c > 0 && !out.includes(c)) out.push(c)
    return out
  }

  protected snapshotAll(): Snapshot {
    const n = this.bodies.length
    const x = new Float64Array(n)
    const y = new Float64Array(n)
    const rot = new Float64Array(n)
    for (const b of this.bodies) {
      x[b.index] = b.x
      y[b.index] = b.y
      rot[b.index] = b.rotationDeg
    }
    return { x, y, rot }
  }

  protected restoreAll(s: Snapshot): void {
    for (const b of this.bodies) {
      b.x = s.x[b.index]!
      b.y = s.y[b.index]!
      if (b.rotationDeg !== s.rot[b.index]!)
        this.applyRotationBox(b, s.rot[b.index]!)
    }
  }

  protected isLayoutValid(): boolean {
    if (this.countOverlaps() !== 0) return false
    if (this.bounds) {
      const b = this.bounds
      const EPS = 1e-6
      for (const body of this.bodies) {
        const cx = body.x + body.boxOffX
        const cy = body.y + body.boxOffY
        if (cx - body.rawHalfW < b.minX - EPS) return false
        if (cx + body.rawHalfW > b.maxX + EPS) return false
        if (cy - body.rawHalfH < b.minY - EPS) return false
        if (cy + body.rawHalfH > b.maxY + EPS) return false
      }
    }
    if (this.polygon) {
      for (const body of this.bodies) {
        if (!this.withinPolygon(body, body.x, body.y)) return false
      }
    }
    return true
  }

  // ---- legality primitives (origin-level, match the validator) -----------

  protected wouldOverlap(body: Body, x: number, y: number): boolean {
    const cx = x + body.boxOffX
    const cy = y + body.boxOffY
    for (const other of this.bodies) {
      if (other.index === body.index) continue
      const ocx = other.x + other.boxOffX
      const ocy = other.y + other.boxOffY
      const overlapX = body.halfW + other.halfW - Math.abs(cx - ocx)
      const overlapY = body.halfH + other.halfH - Math.abs(cy - ocy)
      if (overlapX > 1e-9 && overlapY > 1e-9) return true
    }
    for (const o of this.obstacles) {
      const ox = body.halfW + o.halfW - Math.abs(cx - o.x)
      const oy = body.halfH + o.halfH - Math.abs(cy - o.y)
      if (ox > 1e-9 && oy > 1e-9) return true
    }
    return false
  }

  protected withinBounds(body: Body, x: number, y: number): boolean {
    if (!this.bounds) return true
    const b = this.bounds
    const EPS = 1e-6
    const cx = x + body.boxOffX
    const cy = y + body.boxOffY
    if (cx - body.rawHalfW < b.minX - EPS) return false
    if (cx + body.rawHalfW > b.maxX + EPS) return false
    if (cy - body.rawHalfH < b.minY - EPS) return false
    if (cy + body.rawHalfH > b.maxY + EPS) return false
    return true
  }

  protected withinPolygon(body: Body, x: number, y: number): boolean {
    if (!this.polygon) return true
    const poly = this.polygon
    const angle = (body.rotationDeg * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    for (const p of body.component.pads) {
      const px = x + p.offset.x * cos - p.offset.y * sin
      const py = y + p.offset.x * sin + p.offset.y * cos
      if (!isPointInPolygon({ x: px, y: py }, poly)) return false
    }
    const cx = x + body.boxOffX
    const cy = y + body.boxOffY
    const corners = [
      { x: cx - body.rawHalfW, y: cy - body.rawHalfH },
      { x: cx + body.rawHalfW, y: cy - body.rawHalfH },
      { x: cx - body.rawHalfW, y: cy + body.rawHalfH },
      { x: cx + body.rawHalfW, y: cy + body.rawHalfH },
    ]
    for (const c of corners) if (!isPointInPolygon(c, poly)) return false
    return true
  }

  protected legalAt(body: Body, x: number, y: number): boolean {
    return (
      !this.wouldOverlap(body, x, y) &&
      this.withinBounds(body, x, y) &&
      this.withinPolygon(body, x, y)
    )
  }

  /** Closed-form wirelength-optimal ORIGIN for `body` holding others fixed. */
  protected wirelengthTarget(body: Body): { x: number; y: number } | null {
    let sumX = 0
    let sumY = 0
    let votes = 0
    for (const net of this.nets) {
      let mineCount = 0
      let otherCount = 0
      let otherX = 0
      let otherY = 0
      for (const mem of net.members) {
        const ro = this.rotatedOffset(mem.body, mem.pad.offset)
        if (mem.body.index === body.index) {
          mineCount++
        } else {
          otherCount++
          otherX += mem.body.x + ro.x
          otherY += mem.body.y + ro.y
        }
      }
      if (mineCount === 0 || otherCount === 0) continue
      const mOthersX = otherX / otherCount
      const mOthersY = otherY / otherCount
      for (const mem of net.members) {
        if (mem.body.index !== body.index) continue
        const ro = this.rotatedOffset(body, mem.pad.offset)
        sumX += mOthersX - ro.x
        sumY += mOthersY - ro.y
        votes++
      }
    }
    if (votes === 0) return null
    return { x: sumX / votes, y: sumY / votes }
  }

  /** Real centroid-wirelength of just the nets incident to `body`. */
  protected incidentWirelengthAt(body: Body, x: number, y: number): number {
    const angle = (body.rotationDeg * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    let total = 0
    for (const net of this.nets) {
      let touches = false
      for (const mem of net.members) {
        if (mem.body.index === body.index) {
          touches = true
          break
        }
      }
      if (!touches) continue
      const pts: Array<{ x: number; y: number }> = []
      let cx = 0
      let cy = 0
      for (const mem of net.members) {
        let px: number
        let py: number
        if (mem.body.index === body.index) {
          px = x + mem.pad.offset.x * cos - mem.pad.offset.y * sin
          py = y + mem.pad.offset.x * sin + mem.pad.offset.y * cos
        } else {
          const ro = this.rotatedOffset(mem.body, mem.pad.offset)
          px = mem.body.x + ro.x
          py = mem.body.y + ro.y
        }
        pts.push({ x: px, y: py })
        cx += px
        cy += py
      }
      if (pts.length < 2) continue
      cx /= pts.length
      cy /= pts.length
      for (const p of pts) total += Math.hypot(p.x - cx, p.y - cy)
    }
    return total
  }

  // ---- translation polish ------------------------------------------------

  protected translationPolish(): void {
    const m = this.movableBodies.length
    if (m === 0 || this.nets.length === 0) return
    const bisect = this.plus.polishBisectSteps
    const baselineWL = Math.max(this.centroidWirelength(), 1e-9)

    for (let sweep = 0; sweep < this.plus.polishSweeps; sweep++) {
      let maxGain = 0
      for (const body of this.movableBodies) {
        const target = this.wirelengthTarget(body)
        if (!target) continue
        const x0 = body.x
        const y0 = body.y
        const dx = target.x - x0
        const dy = target.y - y0
        if (Math.abs(dx) < 1e-12 && Math.abs(dy) < 1e-12) continue
        const wl0 = this.incidentWirelengthAt(body, x0, y0)

        let lo = 0
        let hi = 1
        if (!this.legalAt(body, x0 + dx, y0 + dy)) {
          for (let it = 0; it < bisect; it++) {
            const mid = (lo + hi) / 2
            if (this.legalAt(body, x0 + dx * mid, y0 + dy * mid)) lo = mid
            else hi = mid
          }
        } else {
          lo = 1
        }
        if (lo <= 1e-9) continue

        let bestT = 0
        let bestWL = wl0
        const CANDS = 6
        for (let c = 1; c <= CANDS; c++) {
          const t = (lo * c) / CANDS
          const wl = this.incidentWirelengthAt(body, x0 + dx * t, y0 + dy * t)
          if (wl < bestWL - 1e-12) {
            bestWL = wl
            bestT = t
          }
        }
        if (bestT > 1e-9 && bestWL < wl0 - 1e-12) {
          const nx = x0 + dx * bestT
          const ny = y0 + dy * bestT
          if (this.legalAt(body, nx, ny)) {
            body.x = nx
            body.y = ny
            const gain = wl0 - bestWL
            if (gain > maxGain) maxGain = gain
          }
        }
      }
      if (maxGain < this.plus.polishRelTol * baselineWL) break
    }
  }

  // ---- bounded shelf fallback --------------------------------------------

  protected shelfLegalize(): void {
    const pre = this.snapshotAll()
    const preValid = this.isLayoutValid()
    let bestSnap: Snapshot | null = preValid ? pre : null
    let bestWL = preValid ? this.centroidWirelength() : Number.POSITIVE_INFINITY

    const consider = () => {
      if (!this.isLayoutValid()) return
      this.compactShelf()
      if (!this.isLayoutValid()) return
      const wl = this.centroidWirelength()
      if (wl < bestWL - 1e-9) {
        bestWL = wl
        bestSnap = this.snapshotAll()
      }
    }

    const maxPin = Math.min(4, this.movableBodies.length)
    for (let K = 1; K <= maxPin; K++) {
      this.restoreAll(pre)
      if (this.runPinnedFill(K)) consider()
    }
    for (const order of this.shelfOrderings()) {
      this.restoreAll(pre)
      if (this.runShelf(order)) consider()
    }
    this.restoreAll(bestSnap ?? pre)
  }

  protected shelfOrderings(): Body[][] {
    const movable = this.movableBodies
    const b = this.bounds!
    const orders: Body[][] = []
    const heights = movable.map((mm) => mm.rawHalfH * 2)
    const maxBodyH = Math.max(...heights, 0)
    const boundsH = b.maxY - b.minY
    const tries = 4
    for (let t = 0; t < tries; t++) {
      const frac = tries <= 1 ? 1 : 1 - t / tries
      const bandH = Math.max(
        maxBodyH + this.packInput.minGap,
        boundsH * frac,
        1e-6,
      )
      orders.push(
        [...movable].sort((p, q) => {
          const pband = Math.round((b.maxY - (p.y + p.boxOffY)) / bandH)
          const qband = Math.round((b.maxY - (q.y + q.boxOffY)) / bandH)
          if (pband !== qband) return pband - qband
          const pcx = p.x + p.boxOffX
          const qcx = q.x + q.boxOffX
          if (pcx !== qcx) return pcx - qcx
          return p.index - q.index
        }),
      )
    }
    orders.push(
      [...movable].sort(
        (p, q) =>
          q.rawHalfH - p.rawHalfH ||
          q.rawHalfW - p.rawHalfW ||
          p.index - q.index,
      ),
    )
    orders.push(
      [...movable].sort(
        (p, q) =>
          q.rawHalfW - p.rawHalfW ||
          q.rawHalfH - p.rawHalfH ||
          p.index - q.index,
      ),
    )
    orders.push(
      [...movable].sort(
        (p, q) =>
          q.rawHalfW * q.rawHalfH - p.rawHalfW * p.rawHalfH ||
          p.index - q.index,
      ),
    )
    return orders
  }

  protected compactShelf(): void {
    const m = this.movableBodies.length
    if (m === 0 || this.nets.length === 0) return
    const SWEEPS = 16
    const BISECT = 22
    const CANDS = 6
    const baseline = Math.max(this.centroidWirelength(), 1e-9)
    for (let sweep = 0; sweep < SWEEPS; sweep++) {
      let maxGain = 0
      for (const body of this.movableBodies) {
        const target = this.wirelengthTarget(body)
        if (!target) continue
        const x0 = body.x
        const y0 = body.y
        const dx = target.x - x0
        const dy = target.y - y0
        if (Math.abs(dx) < 1e-12 && Math.abs(dy) < 1e-12) continue
        const wl0 = this.incidentWirelengthAt(body, x0, y0)
        let lo = 0
        let hi = 1
        if (this.legalAt(body, x0 + dx, y0 + dy)) {
          lo = 1
        } else {
          for (let it = 0; it < BISECT; it++) {
            const mid = (lo + hi) / 2
            if (this.legalAt(body, x0 + dx * mid, y0 + dy * mid)) lo = mid
            else hi = mid
          }
        }
        if (lo <= 1e-9) continue
        let bestT = 0
        let bestWL = wl0
        for (let c = 1; c <= CANDS; c++) {
          const t = (lo * c) / CANDS
          const wl = this.incidentWirelengthAt(body, x0 + dx * t, y0 + dy * t)
          if (wl < bestWL - 1e-12) {
            bestWL = wl
            bestT = t
          }
        }
        if (bestT > 1e-9 && bestWL < wl0 - 1e-12) {
          const nx = x0 + dx * bestT
          const ny = y0 + dy * bestT
          if (this.legalAt(body, nx, ny)) {
            body.x = nx
            body.y = ny
            const gain = wl0 - bestWL
            if (gain > maxGain) maxGain = gain
          }
        }
      }
      if (maxGain < 1e-4 * baseline) break
    }
  }

  protected runShelf(ordered: Body[]): boolean {
    const b = this.bounds!
    const { minGap } = this.packInput
    const EPS = 1e-6
    if (this.movableBodies.length === 0) return true

    const keepouts: Array<{
      minX: number
      maxX: number
      minY: number
      maxY: number
    }> = []
    for (const sbody of this.bodies) {
      if (!sbody.isStatic) continue
      const cx = sbody.x + sbody.boxOffX
      const cy = sbody.y + sbody.boxOffY
      keepouts.push({
        minX: cx - sbody.rawHalfW,
        maxX: cx + sbody.rawHalfW,
        minY: cy - sbody.rawHalfH,
        maxY: cy + sbody.rawHalfH,
      })
    }
    for (const o of this.obstacles) {
      keepouts.push({
        minX: o.x - (o.halfW - minGap / 2),
        maxX: o.x + (o.halfW - minGap / 2),
        minY: o.y - (o.halfH - minGap / 2),
        maxY: o.y + (o.halfH - minGap / 2),
      })
    }

    const boundsW = b.maxX - b.minX
    const boundsH = b.maxY - b.minY
    let cursorX = b.minX
    let rowTopY = b.maxY
    let rowMaxH = 0

    const fitsKeepouts = (
      minX: number,
      maxX: number,
      minY: number,
      maxY: number,
    ): boolean => {
      for (const k of keepouts) {
        const ox =
          Math.min(maxX, k.maxX + minGap) - Math.max(minX, k.minX - minGap)
        const oy =
          Math.min(maxY, k.maxY + minGap) - Math.max(minY, k.minY - minGap)
        if (ox > EPS && oy > EPS) return false
      }
      return true
    }

    for (const body of ordered) {
      const w = body.rawHalfW * 2
      const h = body.rawHalfH * 2
      if (w > boundsW + EPS || h > boundsH + EPS) return false
      let placed = false
      const MAX_ADVANCES = ordered.length * (keepouts.length + 2) + 16
      for (let step = 0; step < MAX_ADVANCES && !placed; step++) {
        if (cursorX + w > b.maxX + EPS) {
          rowTopY -= rowMaxH + minGap
          rowMaxH = 0
          cursorX = b.minX
        }
        const rawMinX = cursorX
        const rawMaxX = cursorX + w
        const rawMaxY = rowTopY
        const rawMinY = rowTopY - h
        if (rawMinY < b.minY - EPS) return false
        if (fitsKeepouts(rawMinX, rawMaxX, rawMinY, rawMaxY)) {
          const boxCx = (rawMinX + rawMaxX) / 2
          const boxCy = (rawMinY + rawMaxY) / 2
          body.x = boxCx - body.boxOffX
          body.y = boxCy - body.boxOffY
          cursorX = rawMaxX + minGap
          if (h > rowMaxH) rowMaxH = h
          placed = true
        } else {
          let advancedTo = cursorX
          for (const k of keepouts) {
            const ky0 = k.minY - minGap
            const ky1 = k.maxY + minGap
            const overlapY = Math.min(rowTopY, ky1) - Math.max(rowTopY - h, ky0)
            if (overlapY <= EPS) continue
            const kx1 = k.maxX + minGap
            if (kx1 > cursorX - EPS && kx1 > advancedTo) advancedTo = kx1
          }
          if (advancedTo > cursorX + EPS && advancedTo + w <= b.maxX + EPS) {
            cursorX = advancedTo
          } else {
            cursorX = b.maxX + w + 1
          }
        }
      }
      if (!placed) return false
    }
    return true
  }

  protected runPinnedFill(K: number): boolean {
    const b = this.bounds!
    const { minGap } = this.packInput
    const EPS = 1e-6
    const movable = this.movableBodies
    if (movable.length === 0) return true

    const byArea = [...movable].sort(
      (p, q) =>
        q.rawHalfW * q.rawHalfH - p.rawHalfW * p.rawHalfH || p.index - q.index,
    )
    const pinned = byArea.slice(0, K)
    const rest = byArea.slice(K)
    const boundsW = b.maxX - b.minX
    const boundsH = b.maxY - b.minY

    const placed: Array<{
      minX: number
      maxX: number
      minY: number
      maxY: number
    }> = []
    for (const sbody of this.bodies) {
      if (!sbody.isStatic) continue
      const cx = sbody.x + sbody.boxOffX
      const cy = sbody.y + sbody.boxOffY
      placed.push({
        minX: cx - sbody.rawHalfW,
        maxX: cx + sbody.rawHalfW,
        minY: cy - sbody.rawHalfH,
        maxY: cy + sbody.rawHalfH,
      })
    }
    for (const o of this.obstacles) {
      placed.push({
        minX: o.x - (o.halfW - minGap / 2),
        maxX: o.x + (o.halfW - minGap / 2),
        minY: o.y - (o.halfH - minGap / 2),
        maxY: o.y + (o.halfH - minGap / 2),
      })
    }

    const fits = (
      minX: number,
      maxX: number,
      minY: number,
      maxY: number,
    ): boolean => {
      if (
        minX < b.minX - EPS ||
        maxX > b.maxX + EPS ||
        minY < b.minY - EPS ||
        maxY > b.maxY + EPS
      )
        return false
      for (const k of placed) {
        const ox =
          Math.min(maxX, k.maxX + minGap) - Math.max(minX, k.minX - minGap)
        const oy =
          Math.min(maxY, k.maxY + minGap) - Math.max(minY, k.minY - minGap)
        if (ox > EPS && oy > EPS) return false
      }
      return true
    }

    for (const body of pinned) {
      const w = body.rawHalfW * 2
      const h = body.rawHalfH * 2
      if (w > boundsW + EPS || h > boundsH + EPS) return false
      let cx = body.x + body.boxOffX
      let cy = body.y + body.boxOffY
      cx = Math.min(
        Math.max(cx, b.minX + body.rawHalfW),
        b.maxX - body.rawHalfW,
      )
      cy = Math.min(
        Math.max(cy, b.minY + body.rawHalfH),
        b.maxY - body.rawHalfH,
      )
      const minX = cx - body.rawHalfW
      const maxX = cx + body.rawHalfW
      const minY = cy - body.rawHalfH
      const maxY = cy + body.rawHalfH
      if (!fits(minX, maxX, minY, maxY)) return false
      body.x = cx - body.boxOffX
      body.y = cy - body.boxOffY
      placed.push({ minX, maxX, minY, maxY })
    }

    for (const body of rest) {
      const w = body.rawHalfW * 2
      const h = body.rawHalfH * 2
      if (w > boundsW + EPS || h > boundsH + EPS) return false
      const xs = new Set<number>([b.minX])
      const ys = new Set<number>([b.minY])
      for (const k of placed) {
        xs.add(k.maxX + minGap)
        xs.add(k.minX - minGap - w)
        ys.add(k.maxY + minGap)
        ys.add(k.minY - minGap - h)
      }
      const xCands = [...xs]
        .filter((x) => x >= b.minX - EPS && x + w <= b.maxX + EPS)
        .sort((p, q) => p - q)
      const yCands = [...ys]
        .filter((y) => y >= b.minY - EPS && y + h <= b.maxY + EPS)
        .sort((p, q) => p - q)
      let best: { x: number; y: number } | null = null
      let bestCost = Number.POSITIVE_INFINITY
      for (const y of yCands) {
        for (const x of xCands) {
          if (!fits(x, x + w, y, y + h)) continue
          const ox = x + w / 2 - body.boxOffX
          const oy = y + h / 2 - body.boxOffY
          const cost = this.incidentWirelengthAt(body, ox, oy)
          if (
            cost < bestCost - EPS ||
            (Math.abs(cost - bestCost) <= EPS &&
              best !== null &&
              (y < best.y - EPS ||
                (Math.abs(y - best.y) <= EPS && x < best.x - EPS)))
          ) {
            bestCost = cost
            best = { x, y }
          }
        }
      }
      if (!best) return false
      body.x = best.x + w / 2 - body.boxOffX
      body.y = best.y + h / 2 - body.boxOffY
      placed.push({
        minX: best.x,
        maxX: best.x + w,
        minY: best.y,
        maxY: best.y + h,
      })
    }
    return true
  }

  // ---- connectivity-aware seed -------------------------------------------

  protected applyConnSeed(): void {
    const bodies = this.bodies
    const n = bodies.length
    if (n === 0) return
    const movableMask = bodies.map((b) => !b.isStatic)
    if (movableMask.filter(Boolean).length === 0) return

    const netToBodies = new Map<string, number[]>()
    bodies.forEach((b, i) => {
      for (const p of b.component.pads) {
        const arr = netToBodies.get(p.networkId) ?? []
        if (arr[arr.length - 1] !== i) arr.push(i)
        netToBodies.set(p.networkId, arr)
      }
    })
    const adj: Set<number>[] = bodies.map(() => new Set<number>())
    for (const arr of netToBodies.values())
      for (let a = 0; a < arr.length; a++)
        for (let b = a + 1; b < arr.length; b++) {
          adj[arr[a]!]!.add(arr[b]!)
          adj[arr[b]!]!.add(arr[a]!)
        }
    const deg = adj.map((s) => s.size)
    const minGap = this.packInput.minGap
    const footprintOf = (i: number) =>
      Math.max(bodies[i]!.rawHalfW * 2, bodies[i]!.rawHalfH * 2)

    const visited = new Array(n).fill(false)
    for (let i = 0; i < n; i++) if (!movableMask[i]) visited[i] = true

    const order = bodies
      .map((_, i) => i)
      .filter((i) => movableMask[i])
      .sort((a, b) => deg[b]! - deg[a]! || a - b)

    let clusterOriginX = 0
    const setBoxCentre = (body: Body, cx: number, cy: number) => {
      body.x = cx - body.boxOffX
      body.y = cy - body.boxOffY
    }

    for (const root of order) {
      if (visited[root]) continue
      const layers: number[][] = []
      const clusterNodes: number[] = []
      let frontier = [root]
      visited[root] = true
      while (frontier.length) {
        layers.push(frontier)
        for (const u of frontier) clusterNodes.push(u)
        const next: number[] = []
        for (const u of frontier)
          for (const v of [...adj[u]!].sort((a, b) => a - b))
            if (!visited[v]) {
              visited[v] = true
              next.push(v)
            }
        frontier = next
      }
      let clusterMaxFull = 0
      for (const node of clusterNodes)
        clusterMaxFull = Math.max(clusterMaxFull, footprintOf(node))
      if (clusterMaxFull <= 0) clusterMaxFull = 1
      const radialStep = (clusterMaxFull + minGap) * 1.15
      const clusterCx = clusterOriginX
      const clusterCy = 0
      let clusterR = 0
      layers.forEach((layer, L) => {
        const byLayer = L * radialStep
        const minRForCount =
          layer.length > 1
            ? (clusterMaxFull + minGap) / (2 * Math.sin(Math.PI / layer.length))
            : 0
        const r = L === 0 ? 0 : Math.max(byLayer, minRForCount)
        clusterR = Math.max(clusterR, r)
        layer.forEach((node, k) => {
          if (L === 0) {
            setBoxCentre(bodies[node]!, clusterCx, clusterCy)
          } else {
            const phase = L % 2 === 0 ? 0 : Math.PI / layer.length
            const theta = (2 * Math.PI * k) / layer.length + phase
            setBoxCentre(
              bodies[node]!,
              clusterCx + r * Math.cos(theta),
              clusterCy + r * Math.sin(theta),
            )
          }
        })
      })
      clusterOriginX += 2 * clusterR + radialStep * 2 + clusterMaxFull
    }
  }
}

/** Convenience wrapper: construct, solve, and return the packed components. */
export const runQuadraticPack = (
  packInput: PackInput,
  options?: QuadraticOptions,
) => {
  const solver = new QuadraticPackSolver(packInput, options)
  solver.solve()
  return solver.packedComponents
}
