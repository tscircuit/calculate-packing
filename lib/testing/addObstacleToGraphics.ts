import type { GraphicsObject } from "graphics-debug"
import { getObstacleOutlinePoints } from "../geometry/obstacleGeometry"
import type { InputObstacle } from "../types"

const OBSTACLE_FILL = "rgba(0,0,0,0.1)"

export const addObstacleToGraphics = (
  graphics: GraphicsObject,
  obstacle: InputObstacle,
) => {
  graphics.rects ??= []
  graphics.circles ??= []
  graphics.polygons ??= []

  if (obstacle.shape === "circle") {
    graphics.circles.push({
      center: obstacle.absoluteCenter,
      radius: obstacle.width / 2,
      fill: OBSTACLE_FILL,
      stroke: "#555",
      label: obstacle.obstacleId,
    })
    return
  }

  if (
    obstacle.shape === "oval" ||
    obstacle.shape === "pill" ||
    obstacle.shape === "rotated_pill"
  ) {
    graphics.polygons.push({
      points: getObstacleOutlinePoints(obstacle),
      fill: OBSTACLE_FILL,
      stroke: "#555",
      label: obstacle.obstacleId,
    })
    return
  }

  graphics.rects.push({
    center: obstacle.absoluteCenter,
    width: obstacle.width,
    height: obstacle.height,
    fill: OBSTACLE_FILL,
    stroke: "#555",
    label: obstacle.obstacleId,
  })
}
