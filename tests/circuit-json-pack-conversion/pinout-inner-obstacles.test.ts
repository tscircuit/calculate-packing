import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"

const circuitJson = [
  {
    type: "source_group",
    source_group_id: "source_group_0",
    is_subcircuit: true,
    subcircuit_id: "subcircuit_source_group_0",
  },
  {
    type: "source_component",
    source_component_id: "source_component_pinout",
    ftype: "simple_pinout",
    name: "J1",
    source_group_id: "source_group_0",
  },
  {
    type: "source_port",
    source_port_id: "source_port_1",
    source_component_id: "source_component_pinout",
    name: "pin1",
    pin_number: 1,
    port_hints: ["pin1", "1"],
    subcircuit_id: "subcircuit_source_group_0",
  },
  {
    type: "source_port",
    source_port_id: "source_port_2",
    source_component_id: "source_component_pinout",
    name: "pin2",
    pin_number: 2,
    port_hints: ["pin2", "2"],
    subcircuit_id: "subcircuit_source_group_0",
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_pinout",
    source_component_id: "source_component_pinout",
    center: { x: 0, y: 0 },
    width: 4,
    height: 2,
    layer: "top",
    rotation: 0,
    subcircuit_id: "subcircuit_source_group_0",
    obstructs_within_bounds: true,
  },
  {
    type: "pcb_port",
    pcb_port_id: "pcb_port_1",
    pcb_component_id: "pcb_component_pinout",
    source_port_id: "source_port_1",
    x: -1,
    y: 0,
    layers: ["top"],
    subcircuit_id: "subcircuit_source_group_0",
  },
  {
    type: "pcb_port",
    pcb_port_id: "pcb_port_2",
    pcb_component_id: "pcb_component_pinout",
    source_port_id: "source_port_2",
    x: 1,
    y: 0,
    layers: ["top"],
    subcircuit_id: "subcircuit_source_group_0",
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_1",
    pcb_component_id: "pcb_component_pinout",
    pcb_port_id: "pcb_port_1",
    layer: "top",
    shape: "rect",
    x: -1,
    y: 0,
    width: 0.5,
    height: 0.5,
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_2",
    pcb_component_id: "pcb_component_pinout",
    pcb_port_id: "pcb_port_2",
    layer: "top",
    shape: "rect",
    x: 1,
    y: 0,
    width: 0.5,
    height: 0.5,
  },
] as CircuitJson

test("pinout components do not add an inner obstacle pad", () => {
  const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
    source_group_id: "source_group_0",
    shouldAddInnerObstacles: true,
  })

  const pinoutComponent = packOutput.components.find(
    (component) => component.componentId === "pcb_component_pinout",
  )

  expect(pinoutComponent).toBeDefined()
  expect(pinoutComponent?.pads.map((pad) => pad.padId)).toEqual([
    "pcb_smtpad_1",
    "pcb_smtpad_2",
  ])
  expect(
    pinoutComponent?.pads.some(
      (pad) => pad.padId === "pcb_component_pinout-inner",
    ),
  ).toBeFalse()
})
