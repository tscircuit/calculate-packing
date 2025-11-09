import { test, expect } from "bun:test"
import circuitJson from "./repro09/XiaoRP2040Board.circuit.circuit.json"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import { convertPackOutputToPackInput } from "../../lib/plumbing/convertPackOutputToPackInput"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import type { CircuitJson } from "circuit-json"

test("repro09 - final output after running PackSolver2 to completion", async () => {
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
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
    packOrderStrategy: "largest_to_smallest",
    minGap: 1,
  })
  solver.solve()

  expect(
    getSvgFromGraphicsObject(solver.visualize(), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
