import type { PackedComponent, PackInput } from "../types"
import type { Segment } from "../geometry/types"
import { findBestPointForDisconnected } from "./findBestPointForDisconnected"
import { placeComponentAtPoint } from "./placeComponentAtPoint"

export interface PlaceComponentDisconnectedParams {
  component: PackedComponent
  outlines: Segment[][]
  direction: NonNullable<PackInput["disconnectedPackDirection"]>
  packedComponents: PackedComponent[]
  candidateAngles: number[]
  checkOverlap: (comp: PackedComponent) => boolean
}

export function placeComponentDisconnected({
  component,
  outlines,
  direction,
  packedComponents,
  candidateAngles,
  checkOverlap,
}: PlaceComponentDisconnectedParams): PackedComponent[] {
  // Get all candidate points from outlines
  const candidatePoints = outlines.flatMap((outline) =>
    outline.flatMap(([p1, p2]) => {
      // Sample multiple points along each segment
      const points = []
      for (let t = 0; t <= 1; t += 0.1) {
        points.push({
          x: p1.x + t * (p2.x - p1.x),
          y: p1.y + t * (p2.y - p1.y),
        })
      }
      return points
    }),
  )

  // If no outline points, create a grid of candidate points
  if (candidatePoints.length === 0) {
    const spacing = 10
    for (let x = -50; x <= 50; x += spacing) {
      for (let y = -50; y <= 50; y += spacing) {
        candidatePoints.push({ x, y })
      }
    }
  }

  // Sort candidate points based on direction preference
  const center =
    packedComponents.length > 0
      ? {
          x:
            packedComponents.reduce((sum, c) => sum + c.center.x, 0) /
            packedComponents.length,
          y:
            packedComponents.reduce((sum, c) => sum + c.center.y, 0) /
            packedComponents.length,
        }
      : { x: 0, y: 0 }

  let sortedPoints = candidatePoints
  if (direction === "nearest_to_center") {
    sortedPoints = candidatePoints.sort((a, b) => {
      const distA = Math.hypot(a.x - center.x, a.y - center.y)
      const distB = Math.hypot(b.x - center.x, b.y - center.y)
      return distA - distB
    })
  } else if (direction === "left") {
    sortedPoints = candidatePoints.sort((a, b) => a.x - b.x)
  } else if (direction === "right") {
    sortedPoints = candidatePoints.sort((a, b) => b.x - a.x)
  } else if (direction === "up") {
    sortedPoints = candidatePoints.sort((a, b) => b.y - a.y)
  } else if (direction === "down") {
    sortedPoints = candidatePoints.sort((a, b) => a.y - b.y)
  }

  // Try each point until we find one without overlap
  for (const point of sortedPoints) {
    const shadows = placeComponentAtPoint({
      component,
      point,
      candidateAngles,
      checkOverlap,
    })

    // Check if any rotation at this point worked
    for (const shadow of shadows) {
      if (!checkOverlap(shadow)) {
        return shadows
      }
    }
  }

  // If all points failed, use the first point as fallback
  console.warn(
    `[WARNING] Could not find non-overlapping position for component ${component.componentId}`,
  )
  return placeComponentAtPoint({
    component,
    point: sortedPoints[0] || { x: 0, y: 0 },
    candidateAngles,
    checkOverlap,
  })
}
