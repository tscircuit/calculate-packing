import type { PackedComponent, NetworkId } from "../types"
import type { Point } from "graphics-debug"
import { computeSumDistanceForPosition } from "./computeSumDistanceForPosition"

export interface FindOptimalPointOnSegmentParams {
  p1: Point
  p2: Point
  component: PackedComponent
  networkId: NetworkId
  packedComponents: PackedComponent[]
  useSquaredDistance?: boolean
}

export interface FindOptimalPointOnSegmentResult {
  point: Point
  distance: number
  candidatePoints: Array<Point & { networkId: NetworkId; distance: number }>
}

export function findOptimalPointOnSegment({
  p1,
  p2,
  component,
  networkId,
  packedComponents,
  useSquaredDistance = false,
}: FindOptimalPointOnSegmentParams): FindOptimalPointOnSegmentResult {
  const candidatePoints: Array<
    Point & { networkId: NetworkId; distance: number }
  > = []
  const tolerance = 1e-6
  let left = 0
  let right = 1

  // Function to interpolate point along segment
  const interpolatePoint = (t: number): Point => ({
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  })

  // Function to evaluate sum distance at parameter t
  const evaluateDistance = (t: number): number => {
    const point = interpolatePoint(t)
    const distance = computeSumDistanceForPosition({
      component,
      position: point,
      targetNetworkId: networkId,
      packedComponents,
      useSquaredDistance,
    })

    // Store for visualization
    candidatePoints.push({
      ...point,
      networkId,
      distance,
    })

    return distance
  }

  // Ternary search to find minimum
  while (right - left > tolerance) {
    const leftThird = left + (right - left) / 3
    const rightThird = right - (right - left) / 3

    const leftDistance = evaluateDistance(leftThird)
    const rightDistance = evaluateDistance(rightThird)

    if (leftDistance > rightDistance) {
      left = leftThird
    } else {
      right = rightThird
    }
  }

  // Final optimal point
  const optimalT = (left + right) / 2
  const optimalPoint = interpolatePoint(optimalT)
  const optimalDistance = computeSumDistanceForPosition({
    component,
    position: optimalPoint,
    targetNetworkId: networkId,
    packedComponents,
    useSquaredDistance,
  })

  // Add optimal point to candidates
  candidatePoints.push({
    ...optimalPoint,
    networkId,
    distance: optimalDistance,
  })

  return {
    point: optimalPoint,
    distance: optimalDistance,
    candidatePoints,
  }
}