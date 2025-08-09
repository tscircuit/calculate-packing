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
    if (Math.abs(packedCenterX - initialCenter.x) > Math.abs(packedCenterY - initialCenter.y)) {
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
  const maxTranslation = 5 // Don't translate more than 5 units from initial position
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
  const connectedPads = component.pads.filter(pad => 
    packedPads.some(pp => pp.networkId === pad.networkId)
  )

  if (connectedPads.length === 0) return 0

  let sumDistance = 0

  // For each connected pad, find minimum distance to same-network packed pads
  for (const pad of connectedPads) {
    const padAbsolutePos = {
      x: candidateCenter.x + pad.offset.x,
      y: candidateCenter.y + pad.offset.y,
    }

    const sameNetPads = packedPads.filter(pp => pp.networkId === pad.networkId)
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
    pads: component.pads.map(p => ({
      ...p,
      absoluteCenter: {
        x: candidateCenter.x + p.offset.x,
        y: candidateCenter.y + p.offset.y,
      }
    }))
  }

  const componentBounds = getComponentBounds(tempComponent, 0)
  const componentBox = {
    center: { x: (componentBounds.minX + componentBounds.maxX) / 2, y: (componentBounds.minY + componentBounds.maxY) / 2 },
    width: componentBounds.maxX - componentBounds.minX,
    height: componentBounds.maxY - componentBounds.minY,
  }

  for (const packedComp of packedComponents) {
    const packedBounds = getComponentBounds(packedComp, 0)
    const packedBox = {
      center: { x: (packedBounds.minX + packedBounds.maxX) / 2, y: (packedBounds.minY + packedBounds.maxY) / 2 },
      width: packedBounds.maxX - packedBounds.minX,
      height: packedBounds.maxY - packedBounds.minY,
    }

    // Calculate distance between component centers
    const centerDistance = Math.hypot(
      componentBox.center.x - packedBox.center.x,
      componentBox.center.y - packedBox.center.y
    )

    // Calculate minimum required distance
    const minRequiredDistance = minGap + (componentBox.width + packedBox.width) / 2

    if (centerDistance < minRequiredDistance) {
      return true // Overlap detected
    }
  }

  return false
}

/**
 * Optimizes component translation to minimize sum of distances to connected pads
 */
export function optimizeTranslationForMinimumSum(
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
  
  if (translationBounds.minX >= translationBounds.maxX || 
      translationBounds.minY >= translationBounds.maxY) {
    // No translation freedom, return initial center
    return initialCenter
  }

  // Get all packed pads
  const packedPads = packedComponents.flatMap((c) => c.pads)
  const connectedPads = component.pads.filter(pad => 
    packedPads.some(pp => pp.networkId === pad.networkId)
  )

  if (connectedPads.length === 0) {
    return initialCenter // No connections to optimize
  }

  // Sample translation space and find optimal position
  const sampleResolution = 0.5 // Sample every 0.5 units
  let bestCenter = initialCenter
  let bestCost = calculateSumDistance(component, initialCenter, packedComponents)

  for (let x = translationBounds.minX; x <= translationBounds.maxX; x += sampleResolution) {
    for (let y = translationBounds.minY; y <= translationBounds.maxY; y += sampleResolution) {
      const candidateCenter = { x, y }
      
      // Skip if this is very close to initial center (already evaluated)
      if (Math.hypot(x - initialCenter.x, y - initialCenter.y) < 0.1) continue

      // Check if this position causes overlaps
      if (checkOverlap(component, candidateCenter, packedComponents, minGap)) continue

      // Calculate cost (sum of minimum distances)
      const cost = calculateSumDistance(component, candidateCenter, packedComponents)

      if (cost < bestCost) {
        bestCost = cost
        bestCenter = candidateCenter
      }
    }
  }

  return bestCenter
}