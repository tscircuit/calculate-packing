import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import type { PackInput } from "../../lib/types"
import input from "./repro-board-8092/input.json"

test("repro imported components were packing", () => {
  const solver = new PackSolver2(input as PackInput)

  solver.solve()

  expect(
    getSvgFromGraphicsObject(solver.visualize(), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
