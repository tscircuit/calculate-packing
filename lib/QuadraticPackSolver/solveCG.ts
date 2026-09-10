/**
 * Sparse symmetric-positive-definite linear solver for the analytical
 * (quadratic / FastPlace-SimPL) placer. Pure numeric, no dependencies, no RNG —
 * deterministic given a fixed operation order.
 *
 * The placement quadratic A x = b is a weighted graph Laplacian (Bound2Bound net
 * model) plus positive anchor terms on the diagonal (Tikhonov regularization,
 * static-component anchors, SimPL pseudo-pins). Those anchors make A STRICTLY
 * diagonally dominant, hence SPD, hence Conjugate Gradient is guaranteed to
 * converge. A Jacobi (diagonal) preconditioner materially cuts iteration count on
 * Laplacian systems and is trivially deterministic.
 *
 * Matrix storage is a symmetric CSR: `diag[i]` is the i-th diagonal, and the
 * off-diagonals of row i live in colIdx/offVal over [rowPtr[i], rowPtr[i+1]).
 * BOTH (u,v) and (v,u) entries are stored (full symmetric pattern) so the matvec
 * is a single cache-friendly sweep. The X and Y systems share the SAME sparsity
 * pattern within a solve round (component rotations are frozen), so the pattern
 * is assembled once and reused with two different RHS / diagonals are identical.
 */

export interface SparseSpdMatrix {
  /** number of variables (movable components) */
  m: number
  /** diagonal entries, length m (must be > 0 for SPD) */
  diag: Float64Array
  /** CSR row pointers, length m + 1 */
  rowPtr: Int32Array
  /** column indices of off-diagonal entries, length rowPtr[m] */
  colIdx: Int32Array
  /** off-diagonal values aligned with colIdx, length rowPtr[m] */
  offVal: Float64Array
}

const TINY = 1e-30

/** out = A v  (out may not alias v). */
export function matvec(
  A: SparseSpdMatrix,
  v: Float64Array,
  out: Float64Array,
): void {
  const { m, diag, rowPtr, colIdx, offVal } = A
  for (let i = 0; i < m; i++) {
    let acc = diag[i]! * v[i]!
    const end = rowPtr[i + 1]!
    for (let k = rowPtr[i]!; k < end; k++) {
      acc += offVal[k]! * v[colIdx[k]!]!
    }
    out[i] = acc
  }
}

function dot(a: Float64Array, b: Float64Array, m: number): number {
  let s = 0
  for (let i = 0; i < m; i++) s += a[i]! * b[i]!
  return s
}

export interface CgResult {
  /** solution vector (the same array passed/allocated as x) */
  x: Float64Array
  iterations: number
  /** final residual 2-norm squared */
  residualSq: number
  converged: boolean
}

/**
 * Preconditioned Conjugate Gradient with a Jacobi (diagonal) preconditioner.
 *
 * Solves A x = b for an SPD A. Warm-started from `x0` (copied, not mutated).
 * Stops when ||r||^2 <= relTol^2 * max(||b||^2, TINY) or after maxIters.
 * All divisions are guarded against zero so a degenerate system can never
 * produce NaN/Infinity (it just stalls and returns the best iterate).
 */
export function solvePcg(
  A: SparseSpdMatrix,
  b: Float64Array,
  x0: Float64Array,
  opts: { maxIters: number; relTol: number },
): CgResult {
  const { m, diag } = A
  const { maxIters, relTol } = opts

  const x = new Float64Array(x0) // copy => warm start without mutating caller
  const r = new Float64Array(m)
  const z = new Float64Array(m)
  const p = new Float64Array(m)
  const Ap = new Float64Array(m)

  // r = b - A x
  matvec(A, x, Ap)
  for (let i = 0; i < m; i++) r[i] = b[i]! - Ap[i]!

  const bb = Math.max(dot(b, b, m), TINY)
  const target = relTol * relTol * bb

  let rr = dot(r, r, m)
  if (rr <= target) {
    return { x, iterations: 0, residualSq: rr, converged: true }
  }

  // z = M^-1 r ; p = z
  for (let i = 0; i < m; i++) {
    z[i] = r[i]! / Math.max(diag[i]!, TINY)
    p[i] = z[i]!
  }
  let rzOld = dot(r, z, m)

  let it = 0
  let converged = false
  for (; it < maxIters; it++) {
    matvec(A, p, Ap)
    const pAp = dot(p, Ap, m)
    const alpha = rzOld / (Math.abs(pAp) > TINY ? pAp : TINY)
    for (let i = 0; i < m; i++) {
      x[i] = x[i]! + alpha * p[i]!
      r[i] = r[i]! - alpha * Ap[i]!
    }
    rr = dot(r, r, m)
    if (rr <= target) {
      converged = true
      it++
      break
    }
    for (let i = 0; i < m; i++) z[i] = r[i]! / Math.max(diag[i]!, TINY)
    const rzNew = dot(r, z, m)
    const beta = rzNew / (Math.abs(rzOld) > TINY ? rzOld : TINY)
    for (let i = 0; i < m; i++) p[i] = z[i]! + beta * p[i]!
    rzOld = rzNew
  }

  return { x, iterations: it, residualSq: rr, converged }
}
