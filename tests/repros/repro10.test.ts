import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import { convertPackOutputToPackInput } from "../../lib/plumbing/convertPackOutputToPackInput"
import circuitJson from "./repro10/XiaoRP2040Board.circuit.circuit.json"

test("repro10 - final output after running PackSolver2 to completion", async () => {
  // Convert circuitJson to packOutput, then to packInput
  const packOutput = convertCircuitJsonToPackOutput(
    circuitJson as CircuitJson,
    {
      shouldAddInnerObstacles: true,
      source_group_id: "source_group_0",
    },
  )
  const packInput = convertPackOutputToPackInput(packOutput)

  // Run PackSolver2 to completion
  const solver = new PackSolver2({
    ...packInput,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
    minGap: 0.4,
  })
  solver.solve()

  expect(
    getSvgFromGraphicsObject(solver.visualize(), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
