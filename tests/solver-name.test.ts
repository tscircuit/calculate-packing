import { expect, test } from "bun:test"
import { PackSolver2 } from "../lib"

test("PackSolver2 has a stable solver name", () => {
  const solver = Object.create(PackSolver2.prototype) as PackSolver2

  expect(solver.getSolverName()).toBe("PackSolver2")
})
