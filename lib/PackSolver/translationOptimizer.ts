import type { PackedComponent } from "../types"
import type { Point } from "../geometry/types"
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
  useSquaredDistance?: boolean
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

    // Instead of being overly conservative, we'll rely on overlap checking
    // during optimization. This allows more exploration while maintaining safety.
    // Only apply minimal constraints to prevent obvious overlaps.
    
    // Don't get too close to the packed component center
    const safetyMargin = minGap + 1
    if (Math.abs(initialCenter.x - packedCenterX) < safetyMargin) {
      if (initialCenter.x < packedCenterX) {
        maxX = Math.min(maxX, packedCenterX - safetyMargin)
      } else {
        minX = Math.max(minX, packedCenterX + safetyMargin)
      }
    }
    
    if (Math.abs(initialCenter.y - packedCenterY) < safetyMargin) {
      if (initialCenter.y < packedCenterY) {
        maxY = Math.min(maxY, packedCenterY - safetyMargin)
      } else {
        minY = Math.max(minY, packedCenterY + safetyMargin)
      }
    }
  }

  // Clamp to reasonable bounds around initial center
  const maxTranslation = 10 // Allow more translation freedom for optimization
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
  useSquaredDistance: boolean = false,
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
      const dx = padAbsolutePos.x - packedPad.absoluteCenter.x
      const dy = padAbsolutePos.y - packedPad.absoluteCenter.y
      const distance = useSquaredDistance ? (dx * dx + dy * dy) : Math.hypot(dx, dy)
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
  // Use pad-to-pad distance checking instead of component bounds
  // This is more accurate and less conservative
  
  const tempPads = component.pads.map((p) => ({
    ...p,
    absoluteCenter: {
      x: candidateCenter.x + p.offset.x,
      y: candidateCenter.y + p.offset.y,
    },
  }))

  // Check distance between each new pad and each existing pad
  for (const tempPad of tempPads) {
    for (const packedComp of packedComponents) {
      for (const packedPad of packedComp.pads) {
        // Calculate center-to-center distance
        const centerDistance = Math.hypot(
          tempPad.absoluteCenter.x - packedPad.absoluteCenter.x,
          tempPad.absoluteCenter.y - packedPad.absoluteCenter.y,
        )

        // Calculate minimum required center-to-center distance
        // This is minGap plus the sum of the pad radii (half sizes)
        const tempPadRadius = Math.max(tempPad.size.x, tempPad.size.y) / 2
        const packedPadRadius = Math.max(packedPad.size.x, packedPad.size.y) / 2
        const minRequiredDistance = minGap + tempPadRadius + packedPadRadius

        if (centerDistance < minRequiredDistance) {
          return true // Overlap detected
        }
      }
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
  const { component, initialCenter, packedComponents, minGap, useSquaredDistance = false } = context

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
    useSquaredDistance,
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
        useSquaredDistance,
      )

      if (cost < bestCost) {
        bestCost = cost
        bestCenter = candidateCenter
      }
    }
  }

  return bestCenter
}

// --- helpers ---------------------------------------------------------------

function clampToBounds(p: Point, b: TranslationBounds): Point {
  return {
    x: Math.min(Math.max(p.x, b.minX), b.maxX),
    y: Math.min(Math.max(p.y, b.minY), b.maxY),
  }
}

function dist(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

/**
 * Backtracks along the segment (from -> to) until `isFeasible(candidate)` is true,
 * or returns `from` if none found within tolerance.
 */
function backtrackToFeasible(
  from: Point,
  to: Point,
  isFeasible: (p: Point) => boolean,
  maxTrials = 20,
): Point {
  let lo = 0
  let hi = 1
  let best: Point | null = null

  for (let i = 0; i < maxTrials; i++) {
    const t = (lo + hi) / 2
    const cand = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    }
    if (isFeasible(cand)) {
      best = cand
      lo = t // try to go further toward `to`
    } else {
      hi = t // pull back toward `from`
    }
  }
  return best ?? from
}

/**
 * Constrained geometric median via Weiszfeld's iterations.
 * We clamp to bounds each iteration for simple box constraints.
 */
function geometricMedianConstrained(
  targets: Point[],
  start: Point,
  bounds: TranslationBounds,
  maxIter = 100,
  tol = 1e-4,
): Point {
  let c = clampToBounds(start, bounds)
  const eps = 1e-9

  for (let k = 0; k < maxIter; k++) {
    // Handle exact coincidence with any target -> that target is optimal
    for (const p of targets) {
      if (dist(c, p) <= eps) return clampToBounds(p, bounds)
    }

    // Weiszfeld update: c_{k+1} = (sum_i p_i / d_i) / (sum_i 1 / d_i)
    let numX = 0
    let numY = 0
    let den = 0

    for (const p of targets) {
      const d = dist(c, p)
      const w = 1 / Math.max(d, eps)
      numX += p.x * w
      numY += p.y * w
      den += w
    }

    if (den === 0) break
    const next = clampToBounds({ x: numX / den, y: numY / den }, bounds)

    if (dist(next, c) < tol) return next
    c = next
  }
  return c
}

// --- main: non-sampling optimizer -----------------------------------------

export function optimizeTranslationForMinimumSum(
  context: OptimizationContext,
): Point {
  const { component, initialCenter, packedComponents, minGap, useSquaredDistance = false } = context

  // Compute feasible translation box
  const bounds = computeTranslationBounds(
    component,
    initialCenter,
    packedComponents,
    minGap,
  )
  if (bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY) {
    return initialCenter
  }

  // Gather connectivity
  const packedPads = packedComponents.flatMap((c) => c.pads)
  const connectedPads = component.pads.filter((pad) =>
    packedPads.some((pp) => pp.networkId === pad.networkId),
  )
  if (connectedPads.length === 0) return initialCenter

  // Utility to compute per-pad nearest assignments given a center
  const assignTargets = (center: Point): { targets: Point; key: string }[] => {
    const results: { targets: Point; key: string }[] = []
    for (const pad of connectedPads) {
      const padAbs = { x: center.x + pad.offset.x, y: center.y + pad.offset.y }
      let best: { p: Point; key: string } | null = null

      for (let j = 0; j < packedPads.length; j++) {
        const pp = packedPads[j]
        if (!pp || pp.networkId !== pad.networkId) continue
        const d = Math.hypot(
          padAbs.x - pp.absoluteCenter.x,
          padAbs.y - pp.absoluteCenter.y,
        )
        if (!best || d < dist(padAbs, best.p)) {
          // The target for the component CENTER is: pp.absoluteCenter - pad.offset
          best = {
            p: {
              x: pp.absoluteCenter.x - pad.offset.x,
              y: pp.absoluteCenter.y - pad.offset.y,
            },
            key: `${pad.networkId}:${j}`,
          }
        }
      }

      // It is possible (though uncommon) there are no same-net packed pads after filtering
      // due to data inconsistencies. In that case, just skip this pad.
      if (best) results.push({ targets: best.p, key: best.key })
    }
    return results
  }

  // Start from clamped initial center
  let center = clampToBounds(initialCenter, bounds)
  let prevAssignSignature = ""
  const maxOuterIters = 30
  const tolMove = 1e-3

  // If initial is overlapping, gently push to the nearest feasible point within bounds along tiny steps toward bounds center
  if (checkOverlap(component, center, packedComponents, minGap)) {
    const mid = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    }
    center = backtrackToFeasible(
      center,
      mid,
      (p) => !checkOverlap(component, p, packedComponents, minGap),
    )
  }

  for (let iter = 0; iter < maxOuterIters; iter++) {
    // E-step: nearest assignments given current center
    const assignments = assignTargets(center)
    if (assignments.length === 0) return initialCenter

    const signature = assignments.map((a) => a.key).join("|")

    // M-step: geometric median of the assigned target points (constrained to bounds)
    const targets = assignments.map((a) => a.targets)
    const proposed = geometricMedianConstrained(
      targets,
      center,
      bounds,
      100,
      1e-4,
    )

    // Enforce no-overlap with backtracking along the step
    let next = proposed
    if (checkOverlap(component, next, packedComponents, minGap)) {
      next = backtrackToFeasible(
        center,
        proposed,
        (p) => !checkOverlap(component, p, packedComponents, minGap),
      )
    }

    // If the assignment didn't change AND we barely moved, we're done
    if (signature === prevAssignSignature && dist(next, center) < tolMove) {
      center = next
      break
    }

    prevAssignSignature = signature
    center = next
  }

  // Optional: if we somehow made it worse, keep the better of {initial, center}
  const initCost = calculateSumDistance(
    component,
    initialCenter,
    packedComponents,
    useSquaredDistance,
  )
  const finalCost = calculateSumDistance(component, center, packedComponents, useSquaredDistance)
  if (
    finalCost > initCost &&
    !checkOverlap(component, initialCenter, packedComponents, minGap)
  ) {
    return initialCenter
  }
  return center
}
