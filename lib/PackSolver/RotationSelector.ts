import type { PackedComponent, InputComponent, NetworkId } from "../types"
import type { Point } from "graphics-debug"
import { rotatePoint } from "../math/rotatePoint"

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

        // Create a temporary component for testing overlap and cost calculation
        const tempComponent: PackedComponent = {
          ...component,
          center: initialCenter,
          ccwRotationOffset: ((angle % 360) + 360) % 360,
          pads: component.pads.map((p) => ({
            ...p,
            absoluteCenter: { x: 0, y: 0 }, // Will be set by setPackedComponentPadCenters
          })),
        }

        // Apply rotation to calculate actual pad positions
        const transformedPads = tempComponent.pads.map((p) => {
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

        // Update the temp component with the transformed pads
        tempComponent.pads = transformedPads

        // Check for overlap at initial position
        if (!checkOverlap(tempComponent)) {
          // Compute cost with initial position (no translation optimization)
          let cost = 0
          for (const tp of transformedPads) {
            const sameNetPads = packedPads.filter(
              (pp) => pp.networkId === tp.networkId,
            )
            if (!sameNetPads.length) continue

            let bestD = Infinity
            for (const pp of sameNetPads) {
              const dx = tp.absoluteCenter.x - pp.absoluteCenter.x
              const dy = tp.absoluteCenter.y - pp.absoluteCenter.y
              const d = useSquaredDistance
                ? dx * dx + dy * dy
                : Math.hypot(dx, dy)
              if (d < bestD) bestD = d
            }
            cost += bestD === Infinity ? 0 : bestD
          }

          // Track best candidate for this rotation
          if (!bestForThisRotation || cost < bestForThisRotation.cost) {
            bestForThisRotation = {
              center: initialCenter,
              angle: ((angle % 360) + 360) % 360,
              cost: cost,
              pads: component.pads.map((p) => ({
                ...p,
                absoluteCenter: { x: 0, y: 0 },
              })), // Return original pads structure
            }
          }
        }
      }

      // Trial 2: Position component center at the candidate point
      const centerTrial: PackedComponent = {
        ...component,
        center: { x: candidatePoint.x, y: candidatePoint.y },
        ccwRotationOffset: ((angle % 360) + 360) % 360,
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
        }),
      }

      // Check for overlap at center position
      if (!checkOverlap(centerTrial)) {
        // Compute cost with initial center position (no translation optimization)
        let centerCost = 0
        for (const tp of centerTrial.pads) {
          const sameNetPads = packedPads.filter(
            (pp) => pp.networkId === tp.networkId,
          )
          if (!sameNetPads.length) continue

          let bestD = Infinity
          for (const pp of sameNetPads) {
            const dx = tp.absoluteCenter.x - pp.absoluteCenter.x
            const dy = tp.absoluteCenter.y - pp.absoluteCenter.y
            const d = useSquaredDistance
              ? dx * dx + dy * dy
              : Math.hypot(dx, dy)
            if (d < bestD) bestD = d
          }
          centerCost += bestD === Infinity ? 0 : bestD
        }

        // Track best candidate for this rotation
        if (!bestForThisRotation || centerCost < bestForThisRotation.cost) {
          bestForThisRotation = {
            center: centerTrial.center,
            angle: ((angle % 360) + 360) % 360,
            cost: centerCost,
            pads: component.pads.map((p) => ({
              ...p,
              absoluteCenter: { x: 0, y: 0 },
            })), // Return original pads structure
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
