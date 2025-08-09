import type { PackedComponent, InputComponent, NetworkId } from "../types"
import type { Point } from "graphics-debug"
import { rotatePoint } from "../math/rotatePoint"
import { optimizeTranslationForMinimumSumWithSampling } from "./translationOptimizer"

export interface RotationCandidate {
  center: Point
  angle: number
  cost: number
  pads: PackedComponent["pads"]
}

export interface RotationSelectorOptions {
  component: PackedComponent
  candidatePoints: Array<Point & { networkId: NetworkId }>
  packedComponents: PackedComponent[]
  minGap: number
  useSquaredDistance: boolean
  checkOverlap: (component: PackedComponent) => boolean
}

/**
 * Finds the optimal rotation and position for a component by:
 * 1. For each allowed rotation, finding the best position across all candidate points
 * 2. Comparing the optimized results to select the best rotation
 */
export function selectOptimalRotation(options: RotationSelectorOptions): RotationCandidate | null {
  const { component, candidatePoints, packedComponents, minGap, useSquaredDistance, checkOverlap } = options
  
  // Get available rotations for this component
  const candidateAngles = getCandidateAngles(component)
  
  let globalBestCandidate: RotationCandidate | null = null
  
  // For each rotation, find the best position across all candidate points
  for (const angle of candidateAngles) {
    let bestForThisRotation: RotationCandidate | null = null
    
    const packedPads = packedComponents.flatMap((c) => c.pads)
    
    // Try this rotation at each candidate point
    for (const candidatePoint of candidatePoints) {
      const networkId = candidatePoint.networkId
      
      const componentPadsOnNetwork = component.pads.filter(
        (p) => p.networkId === networkId,
      )
      if (!componentPadsOnNetwork.length) continue
      
      const firstPad = componentPadsOnNetwork[0]!
      
      // Position component so first pad hits the candidate point
      const rotatedOffset = rotatePoint(firstPad.offset, (angle * Math.PI) / 180)
      const initialCenter = {
        x: candidatePoint.x - rotatedOffset.x,
        y: candidatePoint.y - rotatedOffset.y,
      }
      
      // Create transformed pads with rotated dimensions
      const transformedPads = component.pads.map((p) => {
        const ro = rotatePoint(p.offset, (angle * Math.PI) / 180)
        
        // Rotate pad dimensions for 90°/270° rotations
        const normalizedRotation = ((angle % 360) + 360) % 360
        const shouldSwapDimensions = normalizedRotation === 90 || normalizedRotation === 270
        
        return {
          ...p,
          size: shouldSwapDimensions 
            ? { x: p.size.y, y: p.size.x } 
            : p.size,
          absoluteCenter: {
            x: initialCenter.x + ro.x,
            y: initialCenter.y + ro.y,
          },
        }
      })
      
      const tempComponent: PackedComponent = {
        ...component,
        center: initialCenter,
        ccwRotationOffset: angle,
        pads: transformedPads,
      }
      
      // Check for overlap at initial position
      if (checkOverlap(tempComponent)) continue
      
      // Optimize translation for this rotation at this point
      const optimizedCenter = optimizeTranslationForMinimumSumWithSampling({
        component: tempComponent,
        initialCenter: initialCenter,
        packedComponents: packedComponents,
        minGap: minGap,
        useSquaredDistance: useSquaredDistance,
      })
      
      // Create optimized pads
      const optimizedPads = component.pads.map((p) => {
        const ro = rotatePoint(p.offset, (angle * Math.PI) / 180)
        
        // Rotate pad dimensions for 90°/270° rotations
        const normalizedRotation = ((angle % 360) + 360) % 360
        const shouldSwapDimensions = normalizedRotation === 90 || normalizedRotation === 270
        
        return {
          ...p,
          size: shouldSwapDimensions 
            ? { x: p.size.y, y: p.size.x } 
            : p.size,
          absoluteCenter: {
            x: optimizedCenter.x + ro.x,
            y: optimizedCenter.y + ro.y,
          },
        }
      })
      
      const optimizedComponent: PackedComponent = {
        ...component,
        center: optimizedCenter,
        ccwRotationOffset: angle,
        pads: optimizedPads,
      }
      
      // Check for overlap at optimized position
      if (checkOverlap(optimizedComponent)) continue
      
      // Compute cost with optimized position using consistent distance metric
      let cost = 0
      for (const tp of optimizedPads) {
        const sameNetPads = packedPads.filter((pp) => pp.networkId === tp.networkId)
        if (!sameNetPads.length) continue
        
        let bestD = Infinity
        for (const pp of sameNetPads) {
          const dx = tp.absoluteCenter.x - pp.absoluteCenter.x
          const dy = tp.absoluteCenter.y - pp.absoluteCenter.y
          const d = useSquaredDistance ? (dx * dx + dy * dy) : Math.hypot(dx, dy)
          if (d < bestD) bestD = d
        }
        cost += bestD === Infinity ? 0 : bestD
      }
      
      // Track best candidate for this rotation
      if (!bestForThisRotation || cost < bestForThisRotation.cost) {
        bestForThisRotation = {
          center: optimizedCenter,
          angle: angle,
          cost: cost,
          pads: optimizedPads,
        }
      }
    }
    
    // Compare this rotation's best result with global best
    if (bestForThisRotation && (!globalBestCandidate || bestForThisRotation.cost < globalBestCandidate.cost)) {
      if (component.componentId === "C6") {
        console.log(`C6 rotation ${angle}°: best cost=${bestForThisRotation.cost.toFixed(3)} ${!globalBestCandidate ? '[FIRST ROTATION]' : '[NEW BEST ROTATION]'}`)
      }
      globalBestCandidate = bestForThisRotation
    } else if (bestForThisRotation && component.componentId === "C6") {
      console.log(`C6 rotation ${angle}°: cost=${bestForThisRotation.cost.toFixed(3)} [WORSE THAN ${globalBestCandidate?.cost.toFixed(3)}]`)
    }
  }
  
  return globalBestCandidate
}

function getCandidateAngles(c: InputComponent): number[] {
  return (c.availableRotationDegrees ?? [0, 90, 180, 270]).map((d) => d % 360)
}