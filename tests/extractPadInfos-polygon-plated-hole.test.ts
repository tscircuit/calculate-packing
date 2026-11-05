import { expect, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import type { CircuitJson, PcbComponent } from "circuit-json"
import { convertCircuitJsonToPackOutput } from "../lib/plumbing/convertCircuitJsonToPackOutput"
import { extractPadInfos } from "../lib/plumbing/extractPadInfos"
import { getObstacleFromElement } from "../lib/plumbing/getObstacleFromElement"

const makePolygonPlatedHoleCircuitJson = ({
  positionMode = "packed",
  padOutline = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
  ],
  ccwRotation = 0,
}: {
  positionMode?: "packed" | "relative_to_group_anchor"
  padOutline?: Array<{ x: number; y: number }>
  ccwRotation?: number
} = {}): CircuitJson =>
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
      center: { x: 0, y: 0 },
      width: 2,
      height: 2,
      layer: "top",
      rotation: 0,
      position_mode: positionMode,
      obstructs_within_bounds: false,
      subcircuit_id: "subcircuit_source_group_0",
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_0",
      pcb_component_id: "pcb_component_0",
      source_port_id: "source_port_0",
      layers: ["top", "bottom"],
      x: -1.22,
      y: -2.63,
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
      hole_offset_x: 0,
      hole_offset_y: 0,
      pad_outline: padOutline,
      ...(ccwRotation ? { ccw_rotation: ccwRotation } : {}),
      x: -1.22,
      y: -2.63,
      layers: ["top", "bottom"],
      subcircuit_id: "subcircuit_source_group_0",
    },
  ] as CircuitJson

test("extractPadInfos extracts hole_with_polygon_pad plated holes without warnings", () => {
  const circuitJson = makePolygonPlatedHoleCircuitJson({
    padOutline: [
      { x: -1, y: -0.5 },
      { x: 3, y: -0.5 },
      { x: 3, y: 1.5 },
      { x: -1, y: 1.5 },
    ],
  })
  const db = cju(circuitJson)
  const pcbComponent = db.pcb_component.get("pcb_component_0")

  const warnings: string[] = []
  const originalWarn = console.warn
  console.warn = (msg?: any) => warnings.push(String(msg))

  const pads = extractPadInfos(
    pcbComponent as PcbComponent,
    db,
    (pcbPortId) => pcbPortId ?? "",
  )

  console.warn = originalWarn

  expect(warnings).toHaveLength(0)
  expect(pads).toHaveLength(1)
  expect(pads[0]?.padId).toBe("pcb_plated_hole_0")
  expect(pads[0]?.pcbPortId).toBe("pcb_port_0")
  expect(pads[0]?.size.x).toBeCloseTo(4)
  expect(pads[0]?.size.y).toBeCloseTo(2)
  expect(pads[0]?.absoluteCenter.x).toBeCloseTo(-0.22)
  expect(pads[0]?.absoluteCenter.y).toBeCloseTo(-2.13)
})

test("convertCircuitJsonToPackOutput includes hole_with_polygon_pad pads on packed components", () => {
  const circuitJson = [
    ...makePolygonPlatedHoleCircuitJson({
      positionMode: "packed",
    }),
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_0",
      pcb_component_id: "pcb_component_0",
      layer: "top",
      shape: "rect",
      width: 1,
      height: 1,
      x: 1.22,
      y: 2.63,
      subcircuit_id: "subcircuit_source_group_0",
    },
  ] as CircuitJson

  const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
    source_group_id: "source_group_0",
  })

  const component = packOutput.components.find(
    (c) => c.componentId === "pcb_component_0",
  )

  expect(component).toBeDefined()
  const holePad = component?.pads.find(
    (pad) => pad.padId === "pcb_plated_hole_0",
  )
  expect(holePad).toBeDefined()
  expect(holePad?.size.x).toBeCloseTo(2)
  expect(holePad?.size.y).toBeCloseTo(2)
  expect(holePad?.offset.x).toBeCloseTo(-0.97)
  expect(holePad?.offset.y).toBeCloseTo(-2.38)
})

test("fixed component and board-level hole_with_polygon_pad produce packing obstacles", () => {
  const circuitJson = makePolygonPlatedHoleCircuitJson({
    positionMode: "relative_to_group_anchor",
    padOutline: [
      { x: -2, y: -1 },
      { x: 2, y: -1 },
      { x: 2, y: 1 },
      { x: -2, y: 1 },
    ],
    ccwRotation: 90,
  })

  const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
    source_group_id: "source_group_0",
  })

  const componentObstacle = packOutput.obstacles?.find(
    ({ obstacleId }) => obstacleId === "pcb_component_0",
  )
  expect(componentObstacle).toBeDefined()
  expect(componentObstacle?.width).toBeCloseTo(2)
  expect(componentObstacle?.height).toBeCloseTo(4)
  expect(componentObstacle?.absoluteCenter.x).toBeCloseTo(-1.22)
  expect(componentObstacle?.absoluteCenter.y).toBeCloseTo(-2.63)

  const holeObstacle = getObstacleFromElement(
    circuitJson.find((el) => el.type === "pcb_plated_hole")!,
  )
  expect(holeObstacle).toEqual({
    obstacleId: "pcb_plated_hole_0",
    absoluteCenter: { x: -1.22, y: -2.63 },
    width: 2,
    height: 4,
  })
})
