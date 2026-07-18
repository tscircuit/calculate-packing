import type { InputObstacle } from "../types"
import type { Point } from "./types"

const CIRCLE_SEGMENT_COUNT = 32

/**
 * Returns a counter-clockwise polygon around an obstacle, expanded by minGap.
 * Circles use a circumscribed polygon for the segment-based placement solver,
 * so its segments never reduce the requested clearance. Final collision checks
 * still use the exact circular boundary.
 */
export const getObstacleOutlinePoints = (
  obstacle: InputObstacle,
  minGap = 0,
): Point[] => {
  const cx = obstacle.absoluteCenter.x
  const cy = obstacle.absoluteCenter.y

  if (obstacle.shape === "circle") {
    const radius =
      (obstacle.width / 2 + minGap) / Math.cos(Math.PI / CIRCLE_SEGMENT_COUNT)
    return Array.from({ length: CIRCLE_SEGMENT_COUNT }, (_, index) => {
      const angle = (index / CIRCLE_SEGMENT_COUNT) * Math.PI * 2
      return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      }
    })
  }

  const halfWidth = obstacle.width / 2 + minGap
  const halfHeight = obstacle.height / 2 + minGap
  return [
    { x: cx - halfWidth, y: cy - halfHeight },
    { x: cx + halfWidth, y: cy - halfHeight },
    { x: cx + halfWidth, y: cy + halfHeight },
    { x: cx - halfWidth, y: cy + halfHeight },
  ]
}
