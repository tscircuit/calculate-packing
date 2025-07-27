import { test, expect } from "bun:test"
import circuitJson from "./circuit-json-pack-conversion01.json"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import type { CircuitJson } from "circuit-json"

test("circuit-json-pack-conversion01", async () => {
  const packOutput = convertCircuitJsonToPackOutput(circuitJson as CircuitJson)

  const graphics = getGraphicsFromPackOutput(packOutput)

  expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
