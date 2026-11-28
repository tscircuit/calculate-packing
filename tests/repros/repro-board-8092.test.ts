import { expect, test } from "bun:test"
import { computeDistanceBetweenBoxes } from "@tscircuit/math-utils"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getComponentBounds } from "../../lib/geometry/getComponentBounds"
import { getComponentCollisionBoxes } from "../../lib/PackSolver2/getComponentCollisionBoxes"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import type { PackInput } from "../../lib/types"
import input from "./repro-board-8092/input.json"

test("packs imported components with asymmetric courtyard offsets within bounds", () => {
  const packInput = input as PackInput
  const solver = new PackSolver2(packInput)

  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.packedComponents).toHaveLength(2)

  const boardBounds = packInput.bounds!
  for (const packedComponent of solver.packedComponents) {
    const componentBounds = getComponentBounds(packedComponent, 0)
    expect(componentBounds.minX).toBeGreaterThanOrEqual(boardBounds.minX - 1e-6)
    expect(componentBounds.maxX).toBeLessThanOrEqual(boardBounds.maxX + 1e-6)
    expect(componentBounds.minY).toBeGreaterThanOrEqual(boardBounds.minY - 1e-6)
    expect(componentBounds.maxY).toBeLessThanOrEqual(boardBounds.maxY + 1e-6)
  }

  const firstBoxes = getComponentCollisionBoxes(solver.packedComponents[0]!)
  const secondBoxes = getComponentCollisionBoxes(solver.packedComponents[1]!)
  for (const boxA of firstBoxes) {
    for (const boxB of secondBoxes) {
      const { distance } = computeDistanceBetweenBoxes(boxA, boxB)
      expect(distance + 1e-6).toBeGreaterThanOrEqual(packInput.minGap)
    }
  }

  expect(
    getSvgFromGraphicsObject(solver.visualize(), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
