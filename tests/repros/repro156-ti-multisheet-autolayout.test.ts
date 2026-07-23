import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import type { PackInput } from "../../lib/types"
import packInputJson from "./repro156-ti-multisheet-autolayout/pack-input.json"

// Packing-only reproduction of @tscircuit/core's repro156. The input was
// captured at the board-level PackSolver2 boundary after the CC3235SF,
// TXB0104, and CC2745R10 subcircuits completed their internal layout.
test("repro156 - TI multisheet board autolayout packing", () => {
  const packInput = packInputJson as PackInput
  const solver = new PackSolver2(packInput)

  solver.solve()

  expect(solver.failed).toBe(false)
  expect(solver.packedComponents).toHaveLength(packInput.components.length)

  expect(
    getSvgFromGraphicsObject(solver.visualize(), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
