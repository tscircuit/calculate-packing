import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import { packSolver2ReproInput } from "./repro12/packInput"

// Regression test for a PackSolver2 input that packs two components within
// bounded space while avoiding pre-defined obstacles.
test("repro12 - PackSolver2 handles provided two-component input", () => {
  const solver = new PackSolver2(packSolver2ReproInput)

  solver.solve()

  expect(solver.failed).toBe(true)

  expect(
    getSvgFromGraphicsObject(solver.visualize(), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
