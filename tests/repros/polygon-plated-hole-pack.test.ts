import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import circuitJson from "./polygon-plated-hole-pack.circuit.json"

test("polygon plated holes are included in component packing pads and board obstacles", async () => {
  const packOutput = convertCircuitJsonToPackOutput(
    circuitJson as CircuitJson,
    { source_group_id: "source_group_0" },
  )

  await expect(
    getSvgFromGraphicsObject(getGraphicsFromPackOutput(packOutput), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)

  const connector = packOutput.components.find(
    (component) => component.componentId === "pcb_component_0",
  )
  const polygonHolePad = connector?.pads.find(
    (pad) => pad.padId === "pcb_plated_hole_0",
  )

  expect(polygonHolePad).toBeDefined()
  expect(polygonHolePad?.size).toEqual({ x: 2, y: 2 })
  expect(polygonHolePad?.absoluteCenter.x).toBeCloseTo(-1.22, 6)
  expect(polygonHolePad?.absoluteCenter.y).toBeCloseTo(-2.63, 6)

  const boardObstacleCircuit: CircuitJson = [
    {
      type: "source_group",
      source_group_id: "source_group_0",
      name: "root",
    },
    {
      type: "pcb_group",
      pcb_group_id: "pcb_group_0",
      subcircuit_id: "subcircuit_source_group_0",
      name: "group",
      center: { x: 0, y: 0 },
      anchor_alignment: "center",
      width: 20,
      height: 20,
      pcb_component_ids: [],
      source_group_id: "source_group_0",
    },
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      material: "fr4",
      thickness: 1.4,
      num_layers: 2,
      width: 20,
      height: 20,
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pcb_plated_hole_board_poly",
      shape: "hole_with_polygon_pad",
      hole_shape: "circle",
      hole_diameter: 1,
      hole_offset_x: 0,
      hole_offset_y: 0,
      pad_outline: [
        { x: -1, y: -0.5 },
        { x: 3, y: -0.5 },
        { x: 3, y: 1.5 },
        { x: -1, y: 1.5 },
      ],
      x: 5,
      y: -2,
      layers: ["top", "bottom"],
    },
  ]

  const obstacleOutput = convertCircuitJsonToPackOutput(boardObstacleCircuit, {
    source_group_id: "source_group_0",
  })
  const polyObstacle = obstacleOutput.obstacles?.find(
    (obs) => obs.obstacleId === "pcb_plated_hole_board_poly",
  )
  expect(polyObstacle).toBeDefined()
  expect(polyObstacle?.width).toBeCloseTo(4, 6)
  expect(polyObstacle?.height).toBeCloseTo(2, 6)
  expect(polyObstacle?.absoluteCenter).toEqual({ x: 6, y: -1.5 })
})
