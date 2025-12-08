import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import circuitJson from "../repros/repro07/circuit.json"

test("components that obstruct within bounds add an inner pad obstacle", () => {
  const packOutput = convertCircuitJsonToPackOutput(
    circuitJson as CircuitJson,
    {
      source_group_id: "source_group_0",
      shouldAddInnerObstacles: false,
    },
  )

  const obstructingComponent = packOutput.components.find(
    (component) => component.componentId === "pcb_component_1",
  )
  const nonObstructingComponent = packOutput.components.find(
    (component) => component.componentId === "pcb_component_0",
  )

  expect(obstructingComponent).toBeDefined()
  expect(
    obstructingComponent?.pads.some(
      (pad) => pad.padId === "pcb_component_1-inner",
    ),
  ).toBeTrue()

  expect(nonObstructingComponent).toBeDefined()
  expect(
    nonObstructingComponent?.pads.some(
      (pad) => pad.padId === "pcb_component_0-inner",
    ),
  ).toBeFalse()
})
