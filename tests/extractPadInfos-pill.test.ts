import { expect, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import type { CircuitJson, PcbComponent } from "circuit-json"
import { convertCircuitJsonToPackOutput } from "../lib/plumbing/convertCircuitJsonToPackOutput"
import { extractPadInfos } from "../lib/plumbing/extractPadInfos"

const pillPadCircuitJson = [
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
    name: "U1",
    source_group_id: "source_group_0",
  },
  {
    type: "source_port",
    source_port_id: "source_port_0",
    name: "pin1",
    pin_number: 1,
    port_hints: ["pin1", "1"],
    source_component_id: "source_component_0",
    subcircuit_id: "subcircuit_source_group_0",
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_0",
    source_component_id: "source_component_0",
    center: { x: 1, y: 2 },
    width: 0.36,
    height: 1.74,
    layer: "top",
    rotation: 0,
    position_mode: "relative_to_group_anchor",
    subcircuit_id: "subcircuit_source_group_0",
  },
  {
    type: "pcb_port",
    pcb_port_id: "pcb_port_0",
    pcb_component_id: "pcb_component_0",
    source_port_id: "source_port_0",
    layers: ["top"],
    x: 1,
    y: 2,
    subcircuit_id: "subcircuit_source_group_0",
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pcb_smtpad_0",
    pcb_component_id: "pcb_component_0",
    pcb_port_id: "pcb_port_0",
    layer: "top",
    shape: "pill",
    width: 0.36,
    height: 1.74,
    radius: 0.18,
    x: 1,
    y: 2,
    port_hints: ["pin1"],
    is_covered_with_solder_mask: false,
    subcircuit_id: "subcircuit_source_group_0",
  },
] as CircuitJson

test("extractPadInfos handles pill-shaped SMT pads", () => {
  const db = cju(pillPadCircuitJson)
  const pcbComponent = db.pcb_component.get("pcb_component_0")

  const pads = extractPadInfos(
    pcbComponent as PcbComponent,
    db,
    (pcbPortId) => pcbPortId ?? "",
  )

  expect(pads).toEqual([
    {
      padId: "pcb_smtpad_0",
      networkId: "pcb_port_0",
      size: { x: 0.36, y: 1.74 },
      absoluteCenter: { x: 1, y: 2 },
      pcbPortId: "pcb_port_0",
    },
  ])
})

test("fixed components with only pill-shaped SMT pads become packing obstacles", () => {
  const packOutput = convertCircuitJsonToPackOutput(pillPadCircuitJson, {
    source_group_id: "source_group_0",
  })

  const obstacle = packOutput.obstacles?.find(
    ({ obstacleId }) => obstacleId === "pcb_component_0",
  )

  expect(obstacle).toBeDefined()
  expect(obstacle?.absoluteCenter).toEqual({ x: 1, y: 2 })
  expect(obstacle?.width).toBeCloseTo(0.36)
  expect(obstacle?.height).toBeCloseTo(1.74)
})
