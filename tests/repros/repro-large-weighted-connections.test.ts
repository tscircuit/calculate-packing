import { expect, test } from "bun:test"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import type { PackInput } from "../../lib/types"
import packInputJson from "./repro-large-weighted-connections/pack-input.json"

const packInput = packInputJson as PackInput

test("repro-large-weighted-connections - captured input shape", () => {
  expect(packInput.components).toHaveLength(218)
  expect(
    packInput.components.reduce(
      (padCount, component) => padCount + component.pads.length,
      0,
    ),
  ).toBe(1767)
  expect(packInput.weightedConnections).toHaveLength(670)
})

test("repro-large-weighted-connections - PackSolver2 completes the captured board", () => {
  const solver = new PackSolver2(packInput)

  solver.solve()

  expect(solver.failed).toBe(true)
  expect(solver.packedComponents).toHaveLength(packInput.components.length)
})
