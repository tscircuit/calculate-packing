import { clamp, computeDistanceBetweenBoxes } from "@tscircuit/math-utils"
import type { InputObstacle } from "../types"

interface Box {
  center: { x: number; y: number }
  width: number
  height: number
}

/** Returns the edge-to-edge distance between an axis-aligned box and obstacle. */
export const getDistanceBetweenBoxAndObstacle = (
  box: Box,
  obstacle: InputObstacle,
): number => {
  if (obstacle.shape !== "circle") {
    return computeDistanceBetweenBoxes(box, {
      center: obstacle.absoluteCenter,
      width: obstacle.width,
      height: obstacle.height,
    }).distance
  }

  const halfWidth = box.width / 2
  const halfHeight = box.height / 2
  const closestX = clamp(
    obstacle.absoluteCenter.x,
    box.center.x - halfWidth,
    box.center.x + halfWidth,
  )
  const closestY = clamp(
    obstacle.absoluteCenter.y,
    box.center.y - halfHeight,
    box.center.y + halfHeight,
  )
  const distanceToCenter = Math.hypot(
    closestX - obstacle.absoluteCenter.x,
    closestY - obstacle.absoluteCenter.y,
  )

  return Math.max(0, distanceToCenter - obstacle.width / 2)
}
