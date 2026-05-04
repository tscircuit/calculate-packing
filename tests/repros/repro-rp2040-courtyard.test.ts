import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { pack } from "lib/pack"
import { convertCircuitJsonToPackOutput } from "lib/plumbing/convertCircuitJsonToPackOutput"
import { convertPackOutputToPackInput } from "lib/plumbing/convertPackOutputToPackInput"
import { getGraphicsFromPackOutput } from "lib/testing/getGraphicsFromPackOutput"
import circuitJson from "./repro-rp2040-courtyard/circuit.json"

test("repro-rp2040-courtyard full core-style flow", () => {
  const packOutput = convertCircuitJsonToPackOutput(
    circuitJson as CircuitJson,
    {
      source_group_id: "source_group_5",
      shouldAddInnerObstacles: true,
    },
  )

  const packInput = convertPackOutputToPackInput(packOutput)
  const fullPacked = pack({
    ...packInput,
    minGap: 1,
    bounds: {
      minX: -30,
      maxX: 30,
      minY: -30,
      maxY: 30,
    },
  })
  expect(fullPacked.components).toHaveLength(packOutput.components.length)
  const graphics = getGraphicsFromPackOutput(fullPacked)

  expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
