import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"

const makeComponentElements = ({
  componentNumber,
  sourceGroupId,
  positionMode,
  x,
}: {
  componentNumber: number
  sourceGroupId: string
  positionMode: "relative_to_group_anchor"
  x: number
}) => [
  {
    type: "source_component",
    source_component_id: `source_component_${componentNumber}`,
    source_group_id: sourceGroupId,
    name: `R${componentNumber}`,
    ftype: "simple_resistor",
  },
  {
    type: "source_port",
    source_port_id: `source_port_${componentNumber}`,
    source_component_id: `source_component_${componentNumber}`,
    name: "pin1",
  },
  {
    type: "pcb_component",
    pcb_component_id: `pcb_component_${componentNumber}`,
    source_component_id: `source_component_${componentNumber}`,
    center: { x, y: 0 },
    rotation: 0,
    width: 1,
    height: 1,
    layer: "top",
    position_mode: positionMode,
  },
  {
    type: "pcb_port",
    pcb_port_id: `pcb_port_${componentNumber}`,
    pcb_component_id: `pcb_component_${componentNumber}`,
    source_port_id: `source_port_${componentNumber}`,
    x,
    y: 0,
    layers: ["top"],
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: `pcb_smtpad_${componentNumber}`,
    pcb_component_id: `pcb_component_${componentNumber}`,
    pcb_port_id: `pcb_port_${componentNumber}`,
    shape: "rect",
    x,
    y: 0,
    width: 1,
    height: 1,
    layer: "top",
  },
]

test("nested-group members are not duplicated as packing obstacles", () => {
  const circuitJson = [
    {
      type: "source_group",
      source_group_id: "root",
      name: "root",
    },
    {
      type: "source_group",
      source_group_id: "nested_group",
      parent_source_group_id: "root",
      name: "nested_group",
    },
    ...makeComponentElements({
      componentNumber: 1,
      sourceGroupId: "nested_group",
      positionMode: "relative_to_group_anchor",
      x: -1,
    }),
    ...makeComponentElements({
      componentNumber: 2,
      sourceGroupId: "nested_group",
      positionMode: "relative_to_group_anchor",
      x: 1,
    }),
    ...makeComponentElements({
      componentNumber: 3,
      sourceGroupId: "root",
      positionMode: "relative_to_group_anchor",
      x: 4,
    }),
  ] as CircuitJson

  const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
    source_group_id: "root",
  })

  expect(packOutput.components.map(({ componentId }) => componentId)).toEqual([
    "nested_group",
  ])
  expect(packOutput.obstacles?.map(({ obstacleId }) => obstacleId)).toEqual([
    "pcb_component_3",
  ])
})
