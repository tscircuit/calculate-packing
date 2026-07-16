import { expect, test } from "bun:test"
import { getDistanceBetweenBoxAndObstacle } from "./obstacleGeometry"
import type { InputObstacle } from "../types"

test("circle obstacle collision does not use its rectangular AABB corners", () => {
  const circle: InputObstacle = {
    obstacleId: "circle",
    absoluteCenter: { x: 0, y: 0 },
    shape: "circle",
    width: 4,
    height: 4,
  }

  const distance = getDistanceBetweenBoxAndObstacle(
    {
      center: { x: 1.8, y: 1.8 },
      width: 0.2,
      height: 0.2,
    },
    circle,
  )

  expect(distance).toBeGreaterThan(0.3)
})

test("oval obstacle collision does not use its rectangular AABB corners", () => {
  const oval: InputObstacle = {
    obstacleId: "oval",
    absoluteCenter: { x: 0, y: 0 },
    shape: "oval",
    width: 6,
    height: 2,
  }

  const distance = getDistanceBetweenBoxAndObstacle(
    {
      center: { x: 2.8, y: 0.9 },
      width: 0.1,
      height: 0.1,
    },
    oval,
  )

  expect(distance).toBeGreaterThan(0.3)
})

for (const shape of ["pill", "rotated_pill"] as const) {
  test(`${shape} obstacle collision does not use its rectangular AABB corners`, () => {
    const pill: InputObstacle = {
      obstacleId: shape,
      absoluteCenter: { x: 0, y: 0 },
      shape,
      width: 6,
      height: 2,
    }

    const distance = getDistanceBetweenBoxAndObstacle(
      {
        center: { x: 2.9, y: 0.9 },
        width: 0.05,
        height: 0.05,
      },
      pill,
    )

    expect(distance).toBeGreaterThan(0.2)
  })
}
