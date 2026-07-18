import { expect, test } from "bun:test"
import { getDistanceBetweenBoxAndObstacle } from "../../lib/geometry/getDistanceBetweenBoxAndObstacle"

test("computes distance to the circular edge instead of its bounding box", () => {
  const distance = getDistanceBetweenBoxAndObstacle(
    {
      center: { x: 2, y: 2 },
      width: 1,
      height: 1,
    },
    {
      obstacleId: "circle",
      absoluteCenter: { x: 0, y: 0 },
      width: 2,
      height: 2,
      shape: "circle",
    },
  )

  expect(distance).toBeCloseTo(Math.hypot(1.5, 1.5) - 1)
})

test("obstacles without a shape remain rectangular", () => {
  const distance = getDistanceBetweenBoxAndObstacle(
    {
      center: { x: 2, y: 2 },
      width: 1,
      height: 1,
    },
    {
      obstacleId: "rect",
      absoluteCenter: { x: 0, y: 0 },
      width: 2,
      height: 2,
    },
  )

  expect(distance).toBeCloseTo(Math.hypot(0.5, 0.5))
})
