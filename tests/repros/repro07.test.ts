import { test, expect } from "bun:test"
import circuitJson from "./repro07/circuit.json"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import type { CircuitJson } from "circuit-json"

test("repro07", async () => {
  const packOutput = convertCircuitJsonToPackOutput(circuitJson as CircuitJson)

  const graphics = getGraphicsFromPackOutput(packOutput)

  expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
