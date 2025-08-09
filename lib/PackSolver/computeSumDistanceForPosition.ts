import type { PackedComponent, NetworkId } from "../types"
import type { Point } from "graphics-debug"

export interface ComputeSumDistanceForPositionParams {
  component: PackedComponent
  position: Point
  targetNetworkId: NetworkId
  packedComponents: PackedComponent[]
  useSquaredDistance?: boolean
}

export function computeSumDistanceForPosition({
  component,
  position,
  targetNetworkId,
  packedComponents,
  useSquaredDistance = false,
}: ComputeSumDistanceForPositionParams): number {
  // Get pads from the component that are on the target network
  const componentPadsOnNetwork = component.pads.filter(
    (pad) => pad.networkId === targetNetworkId,
  )

  if (componentPadsOnNetwork.length === 0) return 0

  // Get all packed pads on the same network
  const packedPadsOnNetwork = packedComponents.flatMap((component) =>
    component.pads.filter((pad) => pad.networkId === targetNetworkId),
  )

  if (packedPadsOnNetwork.length === 0) return 0

  let sumDistance = 0

  // For each pad on the target network in the component being placed
  for (const componentPad of componentPadsOnNetwork) {
    // Calculate where this pad would be if the component is placed at position
    const padPosition = {
      x: position.x + componentPad.offset.x,
      y: position.y + componentPad.offset.y,
    }

    // Find the minimum distance to any packed pad on the same network
    let minDistance = Number.POSITIVE_INFINITY
    for (const packedPad of packedPadsOnNetwork) {
      const dx = padPosition.x - packedPad.absoluteCenter.x
      const dy = padPosition.y - packedPad.absoluteCenter.y
      const distance = useSquaredDistance
        ? dx * dx + dy * dy
        : Math.hypot(dx, dy)
      if (distance < minDistance) {
        minDistance = distance
      }
    }

    // Add to sum distance (if no packed pads found, distance is 0 as specified)
    sumDistance += minDistance === Number.POSITIVE_INFINITY ? 0 : minDistance
  }

  return sumDistance
}
