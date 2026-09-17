import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import circuitJson from "./polygon-plated-hole-pack.circuit.json"

test.failing("polygon plated holes are included in packing geometry", async () => {
  const originalWarn = console.warn
  console.warn = () => {}
  const packOutput = convertCircuitJsonToPackOutput(
    circuitJson as unknown as CircuitJson,
    { source_group_id: "source_group_0" },
  )
  console.warn = originalWarn

  expect(
    getSvgFromGraphicsObject(getGraphicsFromPackOutput(packOutput), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)

  const connector = packOutput.components.find(
    (component) => component.componentId === "pcb_component_0",
  )

  expect(
    connector?.pads.some((pad) => pad.padId === "pcb_plated_hole_0"),
  ).toBe(true)
})
