import { expect, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import type { CircuitJson, PcbComponent } from "circuit-json"
import { convertCircuitJsonToPackOutput } from "../lib/plumbing/convertCircuitJsonToPackOutput"
import { extractPadInfos } from "../lib/plumbing/extractPadInfos"

type RotatedSmtPadShape = "rotated_rect" | "rotated_pill"

const makeRotatedSmtPadCircuitJson = (
  shape: RotatedSmtPadShape,
  ccwRotation: number,
): CircuitJson =>
  [
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
      width: 4,
      height: 2,
      layer: "top",
      rotation: 0,
      position_mode: "relative_to_group_anchor",
      obstructs_within_bounds: false,
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
      shape,
      width: 4,
      height: 2,
      ...(shape === "rotated_pill" ? { radius: 1 } : {}),
      ccw_rotation: ccwRotation,
      x: 1,
      y: 2,
      subcircuit_id: "subcircuit_source_group_0",
    },
  ] as CircuitJson

for (const shape of ["rotated_rect", "rotated_pill"] as const) {
  test(`extractPadInfos handles a 90-degree ${shape} SMT pad`, () => {
    const circuitJson = makeRotatedSmtPadCircuitJson(shape, 90)
    const db = cju(circuitJson)
    const pcbComponent = db.pcb_component.get("pcb_component_0")

    const pads = extractPadInfos(
      pcbComponent as PcbComponent,
      db,
      (pcbPortId) => pcbPortId ?? "",
    )

    expect(pads).toHaveLength(1)
    expect(pads[0]?.size.x).toBeCloseTo(2)
    expect(pads[0]?.size.y).toBeCloseTo(4)
    expect(pads[0]?.absoluteCenter).toEqual({ x: 1, y: 2 })
  })

  test(`fixed component with only a ${shape} SMT pad has a finite packing obstacle`, () => {
    const circuitJson = makeRotatedSmtPadCircuitJson(shape, 90)
    const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
      source_group_id: "source_group_0",
    })

    const obstacle = packOutput.obstacles?.find(
      ({ obstacleId }) => obstacleId === "pcb_component_0",
    )

    expect(obstacle).toBeDefined()
    expect(Number.isFinite(obstacle!.absoluteCenter.x)).toBeTrue()
    expect(Number.isFinite(obstacle!.absoluteCenter.y)).toBeTrue()
    expect(obstacle?.absoluteCenter).toEqual({ x: 1, y: 2 })
    expect(obstacle?.width).toBeCloseTo(2)
    expect(obstacle?.height).toBeCloseTo(4)
  })
}

test("rotated SMT pad uses a conservative AABB for non-orthogonal rotation", () => {
  const circuitJson = makeRotatedSmtPadCircuitJson("rotated_rect", 45)
  const db = cju(circuitJson)
  const pcbComponent = db.pcb_component.get("pcb_component_0")

  const pads = extractPadInfos(
    pcbComponent as PcbComponent,
    db,
    (pcbPortId) => pcbPortId ?? "",
  )

  const expectedSize = 3 * Math.SQRT2
  expect(pads).toHaveLength(1)
  expect(pads[0]?.size.x).toBeCloseTo(expectedSize)
  expect(pads[0]?.size.y).toBeCloseTo(expectedSize)
})
