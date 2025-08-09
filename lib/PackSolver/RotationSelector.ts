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
export function selectOptimalRotation(
  options: RotationSelectorOptions,
): RotationCandidate | null {
  const {
    component,
    candidatePoints,
    packedComponents,
    minGap,
    useSquaredDistance,
    checkOverlap,
  } = options

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

      // Trial 1: Position component so a pad lands on the candidate point
      const componentPadsOnNetwork = component.pads.filter(
        (p) => p.networkId === networkId,
      )
      if (componentPadsOnNetwork.length > 0) {
        const firstPad = componentPadsOnNetwork[0]!

        // Use candidate point as the rotation anchor for the component
        // First, calculate where the component center should be to place the first pad at the candidate point
        const rotatedPadOffset = rotatePoint(
          firstPad.offset,
          (angle * Math.PI) / 180,
        )
        const initialCenter = {
          x: candidatePoint.x - rotatedPadOffset.x,
          y: candidatePoint.y - rotatedPadOffset.y,
        }

        // Create transformed pads with rotation applied around the candidate point as anchor
        const transformedPads = component.pads.map((p) => {
          // Rotate the pad offset around the origin (component center)
          const rotatedOffset = rotatePoint(p.offset, (angle * Math.PI) / 180)

          // Rotate pad dimensions for 90°/270° rotations
          const normalizedRotation = ((angle % 360) + 360) % 360
          const shouldSwapDimensions =
            normalizedRotation === 90 || normalizedRotation === 270

          return {
            ...p,
            size: shouldSwapDimensions ? { x: p.size.y, y: p.size.x } : p.size,
            absoluteCenter: {
              x: initialCenter.x + rotatedOffset.x,
              y: initialCenter.y + rotatedOffset.y,
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
        if (!checkOverlap(tempComponent)) {
          // Optimize translation for this rotation at this point
          const optimizedCenter = optimizeTranslationForMinimumSumWithSampling({
            component: tempComponent,
            initialCenter: initialCenter,
            packedComponents: packedComponents,
            minGap: minGap,
            useSquaredDistance: useSquaredDistance,
          })

          // Create optimized pads using same rotation approach
          const optimizedPads = component.pads.map((p) => {
            const rotatedOffset = rotatePoint(p.offset, (angle * Math.PI) / 180)

            // Rotate pad dimensions for 90°/270° rotations
            const normalizedRotation = ((angle % 360) + 360) % 360
            const shouldSwapDimensions =
              normalizedRotation === 90 || normalizedRotation === 270

            return {
              ...p,
              size: shouldSwapDimensions ? { x: p.size.y, y: p.size.x } : p.size,
              absoluteCenter: {
                x: optimizedCenter.x + rotatedOffset.x,
                y: optimizedCenter.y + rotatedOffset.y,
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
          if (!checkOverlap(optimizedComponent)) {
            // Compute cost with optimized position using consistent distance metric
            let cost = 0
            for (const tp of optimizedPads) {
              const sameNetPads = packedPads.filter(
                (pp) => pp.networkId === tp.networkId,
              )
              if (!sameNetPads.length) continue

              let bestD = Infinity
              for (const pp of sameNetPads) {
                const dx = tp.absoluteCenter.x - pp.absoluteCenter.x
                const dy = tp.absoluteCenter.y - pp.absoluteCenter.y
                const d = useSquaredDistance ? dx * dx + dy * dy : Math.hypot(dx, dy)
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
        }
      }

      // Trial 2: Position component center at the candidate point
      const centerTrial: PackedComponent = {
        ...component,
        center: { x: candidatePoint.x, y: candidatePoint.y },
        ccwRotationOffset: angle,
        pads: component.pads.map((p) => {
          const rotatedOffset = rotatePoint(p.offset, (angle * Math.PI) / 180)

          // Rotate pad dimensions for 90°/270° rotations
          const normalizedRotation = ((angle % 360) + 360) % 360
          const shouldSwapDimensions =
            normalizedRotation === 90 || normalizedRotation === 270

          return {
            ...p,
            size: shouldSwapDimensions ? { x: p.size.y, y: p.size.x } : p.size,
            absoluteCenter: {
              x: candidatePoint.x + rotatedOffset.x,
              y: candidatePoint.y + rotatedOffset.y,
            },
          }
        })
      }

      // Check for overlap at center position
      if (!checkOverlap(centerTrial)) {
        // Optimize translation for center-positioned trial
        const optimizedCenterPosition = optimizeTranslationForMinimumSumWithSampling({
          component: centerTrial,
          initialCenter: { x: candidatePoint.x, y: candidatePoint.y },
          packedComponents: packedComponents,
          minGap: minGap,
          useSquaredDistance: useSquaredDistance,
        })

        // Create optimized pads for center trial
        const optimizedCenterPads = component.pads.map((p) => {
          const rotatedOffset = rotatePoint(p.offset, (angle * Math.PI) / 180)

          // Rotate pad dimensions for 90°/270° rotations
          const normalizedRotation = ((angle % 360) + 360) % 360
          const shouldSwapDimensions =
            normalizedRotation === 90 || normalizedRotation === 270

          return {
            ...p,
            size: shouldSwapDimensions ? { x: p.size.y, y: p.size.x } : p.size,
            absoluteCenter: {
              x: optimizedCenterPosition.x + rotatedOffset.x,
              y: optimizedCenterPosition.y + rotatedOffset.y,
            },
          }
        })

        const optimizedCenterComponent: PackedComponent = {
          ...component,
          center: optimizedCenterPosition,
          ccwRotationOffset: angle,
          pads: optimizedCenterPads,
        }

        // Check for overlap at optimized center position
        if (!checkOverlap(optimizedCenterComponent)) {
          // Compute cost with optimized center position
          let centerCost = 0
          for (const tp of optimizedCenterPads) {
            const sameNetPads = packedPads.filter(
              (pp) => pp.networkId === tp.networkId,
            )
            if (!sameNetPads.length) continue

            let bestD = Infinity
            for (const pp of sameNetPads) {
              const dx = tp.absoluteCenter.x - pp.absoluteCenter.x
              const dy = tp.absoluteCenter.y - pp.absoluteCenter.y
              const d = useSquaredDistance ? dx * dx + dy * dy : Math.hypot(dx, dy)
              if (d < bestD) bestD = d
            }
            centerCost += bestD === Infinity ? 0 : bestD
          }

          // Track best candidate for this rotation
          if (!bestForThisRotation || centerCost < bestForThisRotation.cost) {
            bestForThisRotation = {
              center: optimizedCenterPosition,
              angle: angle,
              cost: centerCost,
              pads: optimizedCenterPads,
            }
          }
        }
      }
    }

    // Compare this rotation's best result with global best
    if (
      bestForThisRotation &&
      (!globalBestCandidate ||
        bestForThisRotation.cost < globalBestCandidate.cost)
    ) {
      if (component.componentId === "C6") {
        console.log(
          `C6 rotation ${angle}°: best cost=${bestForThisRotation.cost.toFixed(3)} ${!globalBestCandidate ? "[FIRST ROTATION]" : "[NEW BEST ROTATION]"}`,
        )
      }
      globalBestCandidate = bestForThisRotation
    } else if (bestForThisRotation && component.componentId === "C6") {
      console.log(
        `C6 rotation ${angle}°: cost=${bestForThisRotation.cost.toFixed(3)} [WORSE THAN ${globalBestCandidate?.cost.toFixed(3)}]`,
      )
    }
  }

  return globalBestCandidate
}

function getCandidateAngles(c: InputComponent): number[] {
  return (c.availableRotationDegrees ?? [0, 90, 180, 270]).map((d) => d % 360)
}
