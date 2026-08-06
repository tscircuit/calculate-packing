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

const performanceReproTest =
  process.env.RUN_SLOW_PACKING_REPRO === "1" ? test : test.skip

// Exact PackInput captured at @tscircuit/core's PackSolver2 boundary for the
// adjacent circuit.tsx, a 218-component board with 825 explicit traces. This is
// intentionally opt-in because the current solver takes a very long time as the
// placed-component outline and pairwise weighted connection searches grow. Run
// with:
//
//   RUN_SLOW_PACKING_REPRO=1 bun test \
//     tests/repros/repro-large-weighted-connections.test.ts
performanceReproTest(
  "repro-large-weighted-connections - PackSolver2 completes the captured board",
  () => {
    const solver = new PackSolver2(packInput)

    solver.solve()

    expect(solver.failed).toBe(false)
    expect(solver.packedComponents).toHaveLength(packInput.components.length)
  },
)
