import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import circuitJson from "./circuit-json-pack-conversion01.json"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"

test("convertCircuitJsonToPackOutput marks specified pcb components as static", () => {
  const staticComponentId = "pcb_component_0"

  const packOutput = convertCircuitJsonToPackOutput(
    circuitJson as CircuitJson,
    {
      staticPcbComponentIds: [staticComponentId],
    },
  )

  const staticComponent = packOutput.components.find(
    (component) => component.componentId === staticComponentId,
  )
  expect(staticComponent?.isStatic).toBe(true)

  const dynamicComponent = packOutput.components.find(
    (component) => component.componentId !== staticComponentId,
  )
  expect(dynamicComponent?.isStatic ?? false).toBe(false)
})
