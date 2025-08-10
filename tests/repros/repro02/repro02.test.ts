import { test, expect } from "bun:test"
import { PhasedPackSolver } from "lib/PackSolver/PhasedPackSolver"
import { getSvgFromGraphicsObject } from "graphics-debug"
import packInput from "./repro02-pack-input.json"

test("repro02", () => {
  const packSolver = new PhasedPackSolver(packInput as any)

  packSolver.noisySolve()

  const svg = getSvgFromGraphicsObject(packSolver.visualize(), {
    backgroundColor: "white",
  })
  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
