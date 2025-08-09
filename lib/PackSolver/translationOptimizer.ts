import type { PackedComponent, Point, NetworkId } from "../types"
import { getComponentBounds } from "../geometry/getComponentBounds"

export interface TranslationBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface OptimizationContext {
  component: PackedComponent
  initialCenter: Point
  packedComponents: PackedComponent[]
  minGap: number
}

/**
 * Computes the available translation bounds for a component while maintaining minGap
 */
export function computeTranslationBounds(
  component: PackedComponent,
  initialCenter: Point,
  packedComponents: PackedComponent[],
  minGap: number,
): TranslationBounds {
  const componentBounds = getComponentBounds(component, 0)
  const componentWidth = componentBounds.maxX - componentBounds.minX
  const componentHeight = componentBounds.maxY - componentBounds.minY

  // Start with no constraints
  let minX = Number.NEGATIVE_INFINITY
  let maxX = Number.POSITIVE_INFINITY
  let minY = Number.NEGATIVE_INFINITY
  let maxY = Number.POSITIVE_INFINITY

  // For each packed component, compute constraints to maintain minGap
  for (const packedComp of packedComponents) {
    const packedBounds = getComponentBounds(packedComp, 0)
    const packedWidth = packedBounds.maxX - packedBounds.minX
    const packedHeight = packedBounds.maxY - packedBounds.minY

    // Calculate minimum center-to-center distances to avoid overlap
    const minCenterDistanceX = minGap + (componentWidth + packedWidth) / 2
    const minCenterDistanceY = minGap + (componentHeight + packedHeight) / 2

    // Constraint from this packed component
    const packedCenterX = packedComp.center.x
    const packedCenterY = packedComp.center.y

    // Update bounds to maintain minimum distance from this packed component
    // The component can be placed anywhere that maintains minCenterDistance from this packed component

    // X constraints: component center must be at least minCenterDistanceX away
    const leftBound = packedCenterX - minCenterDistanceX
    const rightBound = packedCenterX + minCenterDistanceX

    // Y constraints: component center must be at least minCenterDistanceY away
    const bottomBound = packedCenterY - minCenterDistanceY
    const topBound = packedCenterY + minCenterDistanceY

    // For each packed component, we exclude the "forbidden zone" around it
    // This creates a complex constraint, but for simplicity we'll create conservative bounds
    // that ensure we don't get too close to any packed component

    // Conservative approach: stay away from the packed component
    if (
      Math.abs(packedCenterX - initialCenter.x) >
      Math.abs(packedCenterY - initialCenter.y)
    ) {
      // Packed component is more horizontally separated
      if (packedCenterX < initialCenter.x) {
        // Packed component is to the left, stay to the right
        minX = Math.max(minX, rightBound)
      } else {
        // Packed component is to the right, stay to the left
        maxX = Math.min(maxX, leftBound)
      }
    } else {
      // Packed component is more vertically separated
      if (packedCenterY < initialCenter.y) {
        // Packed component is below, stay above
        minY = Math.max(minY, topBound)
      } else {
        // Packed component is above, stay below
        maxY = Math.min(maxY, bottomBound)
      }
    }
  }

  // Clamp to reasonable bounds around initial center
  const maxTranslation = minGap * 100
  minX = Math.max(minX, initialCenter.x - maxTranslation)
  maxX = Math.min(maxX, initialCenter.x + maxTranslation)
  minY = Math.max(minY, initialCenter.y - maxTranslation)
  maxY = Math.min(maxY, initialCenter.y + maxTranslation)

  return { minX, maxX, minY, maxY }
}

/**
 * Calculates the sum of minimum distances for all connected pads at a given position
 */
export function calculateSumDistance(
  component: PackedComponent,
  candidateCenter: Point,
  packedComponents: PackedComponent[],
): number {
  // Get all packed pads
  const packedPads = packedComponents.flatMap((c) => c.pads)

  // Get pads that have connections to packed components
  const connectedPads = component.pads.filter((pad) =>
    packedPads.some((pp) => pp.networkId === pad.networkId),
  )

  if (connectedPads.length === 0) return 0

  let sumDistance = 0

  // For each connected pad, find minimum distance to same-network packed pads
  for (const pad of connectedPads) {
    const padAbsolutePos = {
      x: candidateCenter.x + pad.offset.x,
      y: candidateCenter.y + pad.offset.y,
    }

    const sameNetPads = packedPads.filter(
      (pp) => pp.networkId === pad.networkId,
    )
    let minDistance = Number.POSITIVE_INFINITY

    for (const packedPad of sameNetPads) {
      const distance = Math.hypot(
        padAbsolutePos.x - packedPad.absoluteCenter.x,
        padAbsolutePos.y - packedPad.absoluteCenter.y,
      )
      if (distance < minDistance) {
        minDistance = distance
      }
    }

    sumDistance += minDistance === Number.POSITIVE_INFINITY ? 0 : minDistance
  }

  return sumDistance
}

/**
 * Checks if a component at the given position would overlap with packed components
 */
export function checkOverlap(
  component: PackedComponent,
  candidateCenter: Point,
  packedComponents: PackedComponent[],
  minGap: number,
): boolean {
  const tempComponent: PackedComponent = {
    ...component,
    center: candidateCenter,
    pads: component.pads.map((p) => ({
      ...p,
      absoluteCenter: {
        x: candidateCenter.x + p.offset.x,
        y: candidateCenter.y + p.offset.y,
      },
    })),
  }

  const componentBounds = getComponentBounds(tempComponent, 0)
  const componentBox = {
    center: {
      x: (componentBounds.minX + componentBounds.maxX) / 2,
      y: (componentBounds.minY + componentBounds.maxY) / 2,
    },
    width: componentBounds.maxX - componentBounds.minX,
    height: componentBounds.maxY - componentBounds.minY,
  }

  for (const packedComp of packedComponents) {
    const packedBounds = getComponentBounds(packedComp, 0)
    const packedBox = {
      center: {
        x: (packedBounds.minX + packedBounds.maxX) / 2,
        y: (packedBounds.minY + packedBounds.maxY) / 2,
      },
      width: packedBounds.maxX - packedBounds.minX,
      height: packedBounds.maxY - packedBounds.minY,
    }

    // Calculate distance between component centers
    const centerDistance = Math.hypot(
      componentBox.center.x - packedBox.center.x,
      componentBox.center.y - packedBox.center.y,
    )

    // Calculate minimum required distance
    const minRequiredDistance =
      minGap + (componentBox.width + packedBox.width) / 2

    if (centerDistance < minRequiredDistance) {
      return true // Overlap detected
    }
  }

  return false
}

/**
 * Optimizes component translation to minimize sum of distances to connected pads
 */
export function optimizeTranslationForMinimumSumWithSampling(
  context: OptimizationContext,
): Point {
  const { component, initialCenter, packedComponents, minGap } = context

  // Compute available translation freedom
  const translationBounds = computeTranslationBounds(
    component,
    initialCenter,
    packedComponents,
    minGap,
  )

  if (
    translationBounds.minX >= translationBounds.maxX ||
    translationBounds.minY >= translationBounds.maxY
  ) {
    // No translation freedom, return initial center
    return initialCenter
  }

  // Get all packed pads
  const packedPads = packedComponents.flatMap((c) => c.pads)
  const connectedPads = component.pads.filter((pad) =>
    packedPads.some((pp) => pp.networkId === pad.networkId),
  )

  if (connectedPads.length === 0) {
    return initialCenter // No connections to optimize
  }

  // Sample translation space and find optimal position
  const sampleResolution = 0.5 // Sample every 0.5 units
  let bestCenter = initialCenter
  let bestCost = calculateSumDistance(
    component,
    initialCenter,
    packedComponents,
  )

  for (
    let x = translationBounds.minX;
    x <= translationBounds.maxX;
    x += sampleResolution
  ) {
    for (
      let y = translationBounds.minY;
      y <= translationBounds.maxY;
      y += sampleResolution
    ) {
      const candidateCenter = { x, y }

      // Skip if this is very close to initial center (already evaluated)
      if (Math.hypot(x - initialCenter.x, y - initialCenter.y) < 0.1) continue

      // Check if this position causes overlaps
      if (checkOverlap(component, candidateCenter, packedComponents, minGap))
        continue

      // Calculate cost (sum of minimum distances)
      const cost = calculateSumDistance(
        component,
        candidateCenter,
        packedComponents,
      )

      if (cost < bestCost) {
        bestCost = cost
        bestCenter = candidateCenter
      }
    }
  }

  return bestCenter
}
type Vec = Point

function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y }
}
function sub(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y }
}
function mul(a: Vec, s: number): Vec {
  return { x: a.x * s, y: a.y * s }
}
function lerp(a: Vec, b: Vec, t: number): Vec {
  return add(a, mul(sub(b, a), t))
}
function norm(a: Vec): number {
  return Math.hypot(a.x, a.y)
}

interface NetIndex {
  [net: string]: { x: number; y: number }[]
}

/**
 * Build a quick index of packed pad absolute centers per network
 */
function buildNetIndex(packedComponents: PackedComponent[]): NetIndex {
  const idx: NetIndex = {}
  for (const comp of packedComponents) {
    for (const p of comp.pads) {
      const key = String(p.networkId ?? "")
      if (!idx[key]) idx[key] = []
      idx[key].push({ x: p.absoluteCenter.x, y: p.absoluteCenter.y })
    }
  }
  return idx
}

/**
 * For current center, pick nearest packed pad for each component pad (same net).
 * Returns "target centers" for the component center: target_i = nearestPad - pad.offset
 */
function chooseTargetsForCurrentCenter(
  component: PackedComponent,
  center: Point,
  netIndex: NetIndex,
): { targets: Point[]; assignmentKeys: string[] } {
  const targets: Point[] = []
  const assignmentKeys: string[] = [] // for detecting assignment stability
  for (const pad of component.pads) {
    const net = String(pad.networkId ?? "")
    const candidates = netIndex[net]
    if (!candidates || candidates.length === 0) continue

    const padAbs = { x: center.x + pad.offset.x, y: center.y + pad.offset.y }
    let best: { x: number; y: number } | null = null
    let bestD = Infinity
    let bestIdx = -1
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i]
      const d = Math.hypot(padAbs.x - c.x, padAbs.y - c.y)
      if (d < bestD) {
        bestD = d
        best = c
        bestIdx = i
      }
    }
    if (best) {
      // The optimal center for this pad-to-target pair alone is target - offset
      targets.push({ x: best.x - pad.offset.x, y: best.y - pad.offset.y })
      assignmentKeys.push(`${net}#${bestIdx}`)
    }
  }
  return { targets, assignmentKeys }
}

/**
 * Geometric median via Weiszfeld’s method (no sampling).
 * Returns the point minimizing sum_i ||x - p_i|| (for fixed targets).
 */
function geometricMedian(
  points: Point[],
  initial: Point,
  maxIter = 50,
  tol = 1e-4,
): Point {
  if (points.length === 0) return initial
  let x = { ...initial }
  const eps = 1e-9

  for (let it = 0; it < maxIter; it++) {
    let numX = 0,
      numY = 0,
      den = 0
    let hitPoint = false

    for (const p of points) {
      const dx = x.x - p.x
      const dy = x.y - p.y
      const d = Math.hypot(dx, dy)
      if (d < eps) {
        // x is (almost) at a point; the median is that point for stability
        x = { ...p }
        hitPoint = true
        break
      }
      const w = 1 / d
      numX += w * p.x
      numY += w * p.y
      den += w
    }

    if (!hitPoint) {
      const next = { x: numX / den, y: numY / den }
      const move = Math.hypot(next.x - x.x, next.y - x.y)
      x = next
      if (move < tol) break
    }
  }
  return x
}

/**
 * Clamp center to rectangular translation bounds.
 */
function projectToBounds(
  c: Point,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
): Point {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, c.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, c.y)),
  }
}

/**
 * Backtrack along the segment prev->target until we find a non-overlapping point,
 * also staying within bounds. Returns the feasible point (may be prev).
 */
function backtrackToFeasible(
  component: PackedComponent,
  prev: Point,
  target: Point,
  packed: PackedComponent[],
  minGap: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
): Point {
  const maxTries = 20
  let lo = 0,
    hi = 1
  let best: Point = prev

  // First clamp target to bounds
  target = projectToBounds(target, bounds)

  // If the direct target works, take it
  if (!checkOverlap(component, target, packed, minGap)) return target

  // Otherwise binary/backtracking search for a feasible point along the line
  // from prev to target (shrinking toward prev).
  for (let i = 0; i < maxTries; i++) {
    const t = (lo + hi) / 2
    const cand = projectToBounds(lerp(prev, target, t), bounds)
    const ok = !checkOverlap(component, cand, packed, minGap)
    if (ok) {
      best = cand
      lo = t
    } else {
      hi = t
    }
    if (hi - lo < 1e-3) break
  }
  return best
}

/**
 * Non-sampling optimizer for minimizing total connection distance.
 * Strategy: alternating assignment + geometric median with feasibility enforcement.
 */
export function optimizeTranslationForMinimumSum(context: {
  component: PackedComponent
  initialCenter: Point
  packedComponents: PackedComponent[]
  minGap: number
}): Point {
  const { component, initialCenter, packedComponents, minGap } = context

  // Early outs
  const packedPads = packedComponents.flatMap((c) => c.pads)
  const hasConnections = component.pads.some((p) =>
    packedPads.some((pp) => pp.networkId === p.networkId),
  )
  if (!hasConnections) return initialCenter

  const bounds = computeTranslationBounds(
    component,
    initialCenter,
    packedComponents,
    minGap,
  )

  // If no translation freedom, stick to initial
  if (bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY) {
    return initialCenter
  }

  const netIndex = buildNetIndex(packedComponents)

  let center = projectToBounds(initialCenter, bounds)
  let bestCenter = center
  let bestCost = calculateSumDistance(component, center, packedComponents)

  // MM-style outer loop: update nearest-target assignment, then solve median
  const maxOuter = 20
  const tolMove = 1e-3

  // keep assignment string to detect stability
  let prevAssignSig = ""

  for (let outer = 0; outer < maxOuter; outer++) {
    const { targets, assignmentKeys } = chooseTargetsForCurrentCenter(
      component,
      center,
      netIndex,
    )
    if (targets.length === 0) break

    const assignSig = assignmentKeys.join("|")
    // Solve geometric median for fixed targets
    let desired = geometricMedian(targets, center, 50, 1e-4)

    // Slight relaxation helps stability near assignment boundaries
    const relaxation = 0.85
    desired = add(center, mul(sub(desired, center), relaxation))

    // Enforce bounds + minGap via backtracking
    const candidate = backtrackToFeasible(
      component,
      center,
      desired,
      packedComponents,
      minGap,
      bounds,
    )

    const move = norm(sub(candidate, center))
    center = candidate

    const cost = calculateSumDistance(component, center, packedComponents)
    if (cost < bestCost - 1e-6) {
      bestCost = cost
      bestCenter = center
    }

    // Stop conditions: small movement and stable assignment
    const assignmentStable = assignSig === prevAssignSig
    prevAssignSig = assignSig
    if (move < tolMove && assignmentStable) break
  }

  return bestCenter
}
