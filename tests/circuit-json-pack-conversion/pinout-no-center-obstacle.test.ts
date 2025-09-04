import { test, expect } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"

test("pinout components do not get inner obstacles", () => {
  const circuitJson: CircuitJson = [
    { type: "source_project_metadata", name: "proj" },
    {
      type: "source_group",
      source_group_id: "sg0",
      is_subcircuit: true,
      subcircuit_id: "sg0",
    },
    {
      type: "source_component",
      source_component_id: "sc1",
      name: "J1",
      ftype: "simple_pinout",
      source_group_id: "sg0",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pc1",
      source_component_id: "sc1",
      center: { x: 1, y: 0 },
      layer: "top",
      rotation: 0,
      width: 2,
      height: 1,
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pad1",
      pcb_component_id: "pc1",
      shape: "circle",
      x: 0,
      y: 0,
      outer_diameter: 1,
      hole_diameter: 0.5,
      layers: ["top"],
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pad2",
      pcb_component_id: "pc1",
      shape: "circle",
      x: 2,
      y: 0,
      outer_diameter: 1,
      hole_diameter: 0.5,
      layers: ["top"],
    },
  ]

  const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
    shouldAddInnerObstacles: true,
  })

  expect(packOutput.components).toHaveLength(1)
  const component = packOutput.components[0]!
  expect(component.pads).toHaveLength(2)
  expect(component.pads.find((p) => p.padId.endsWith("-inner"))).toBeUndefined()
})
