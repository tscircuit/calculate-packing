import { expect, test } from "bun:test"
import { PackSolver2 } from "../lib"

test("PackSolver2 has a stable solver name", () => {
  expect(PackSolver2.solverName).toBe("PackSolver2")
})
