import { expect, test } from "bun:test"
import { getObstacleOutlinePoints } from "./getObstacleOutlinePoints"

test("circular obstacle outline preserves the requested radial clearance", () => {
  const center = { x: 1, y: -2 }
  const points = getObstacleOutlinePoints(
    {
      obstacleId: "circle",
      absoluteCenter: center,
      width: 2,
      height: 2,
      shape: "circle",
    },
    0.4,
  )

  const first = points[0]!
  const second = points[1]!
  const edgeMidpoint = {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  }

  expect(points).toHaveLength(32)
  expect(
    Math.hypot(edgeMidpoint.x - center.x, edgeMidpoint.y - center.y),
  ).toBeCloseTo(1.4)
})
