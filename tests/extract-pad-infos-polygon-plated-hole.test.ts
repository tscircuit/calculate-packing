import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPackOutput } from "../lib/plumbing/convertCircuitJsonToPackOutput"
import { getObstacleFromElement } from "../lib/plumbing/getObstacleFromElement"

test("convertCircuitJsonToPackOutput includes hole_with_polygon_pad plated holes", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_group",
      source_group_id: "source_group_0",
      is_subcircuit: true,
      subcircuit_id: "subcircuit_source_group_0",
    },
    {
      type: "source_component",
      source_component_id: "source_component_0",
      ftype: "simple_chip",
      name: "J1",
      source_group_id: "source_group_0",
    },
    {
      type: "source_port",
      source_port_id: "source_port_0",
      name: "pin1",
      pin_number: 1,
      source_component_id: "source_component_0",
      subcircuit_id: "subcircuit_source_group_0",
      subcircuit_connectivity_map_key: "net0",
    },
    {
      type: "source_port",
      source_port_id: "source_port_1",
      name: "pin2",
      pin_number: 2,
      source_component_id: "source_component_0",
      subcircuit_id: "subcircuit_source_group_0",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      source_component_id: "source_component_0",
      center: { x: 0.05, y: -2.63 },
      layer: "top",
      rotation: 0,
      width: 4.44,
      height: 2,
      obstructs_within_bounds: true,
      subcircuit_id: "subcircuit_source_group_0",
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_0",
      pcb_component_id: "pcb_component_0",
      source_port_id: "source_port_0",
      x: -1.22,
      y: -2.63,
      layers: ["top", "bottom"],
      subcircuit_id: "subcircuit_source_group_0",
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_1",
      pcb_component_id: "pcb_component_0",
      source_port_id: "source_port_1",
      x: 1.32,
      y: -2.63,
      layers: ["top", "bottom"],
      subcircuit_id: "subcircuit_source_group_0",
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pcb_plated_hole_0",
      pcb_component_id: "pcb_component_0",
      pcb_port_id: "pcb_port_0",
      shape: "hole_with_polygon_pad",
      hole_shape: "circle",
      hole_diameter: 1,
      pad_outline: [
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
      ],
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: -1.22,
      y: -2.63,
      layers: ["top", "bottom"],
      subcircuit_id: "subcircuit_source_group_0",
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pcb_plated_hole_1",
      pcb_component_id: "pcb_component_0",
      pcb_port_id: "pcb_port_1",
      outer_diameter: 1.8,
      hole_diameter: 1,
      shape: "circle",
      x: 1.32,
      y: -2.63,
      layers: ["top", "bottom"],
      subcircuit_id: "subcircuit_source_group_0",
    },
  ]

  const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
    source_group_id: "source_group_0",
  })

  const connector = packOutput.components.find(
    (component) => component.componentId === "pcb_component_0",
  )
  expect(connector).toBeDefined()
  const polygonPad = connector?.pads.find(
    (pad) => pad.padId === "pcb_plated_hole_0",
  )
  expect(polygonPad).toBeDefined()
  expect(polygonPad?.networkId).toBe("net0")
  expect(polygonPad?.size).toEqual({ x: 2, y: 2 })
  expect(polygonPad?.absoluteCenter).toEqual({ x: -1.22, y: -2.63 })

  const obstacle = getObstacleFromElement(circuitJson[7]!)
  expect(obstacle).toEqual({
    obstacleId: "pcb_plated_hole_0",
    absoluteCenter: { x: -1.22, y: -2.63 },
    width: 2,
    height: 2,
  })
})
