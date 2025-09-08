import { expect, test } from "bun:test"
import { pack, PhasedPackSolver } from "lib/index"
import input from "site/repros/repro06.json"

test("repro06 - boolean operation error", () => {
  const solver = new PhasedPackSolver(input as any)
  solver.solve()

  expect(solver.visualize()).toMatchGraphicsSvg(import.meta.path)
})
