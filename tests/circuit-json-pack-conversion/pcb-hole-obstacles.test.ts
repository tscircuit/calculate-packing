import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"

const makeCircuitJson = (holes: Record<string, unknown>[]): CircuitJson =>
  [
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
      width: 20,
      height: 20,
      pcb_component_ids: [],
      source_group_id: "source_group_0",
    },
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      thickness: 1.4,
      num_layers: 2,
      width: 20,
      height: 20,
    },
    ...holes,
  ] as CircuitJson

test("circular pcb_hole is added as an obstacle", () => {
  const circuitJson = makeCircuitJson([
    {
      type: "pcb_hole",
      pcb_hole_id: "pcb_hole_0",
      hole_shape: "circle",
      hole_diameter: 3.302,
      x: 5,
      y: -3,
      subcircuit_id: "subcircuit_source_group_0",
    },
  ])

  const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
    source_group_id: "source_group_0",
  })

  expect(packOutput.obstacles).toBeDefined()
  const holeObstacle = packOutput.obstacles!.find(
    (o) => o.obstacleId === "pcb_hole_0",
  )
  expect(holeObstacle).toBeDefined()
  expect(holeObstacle!.absoluteCenter).toEqual({ x: 5, y: -3 })
  expect(holeObstacle!.width).toBe(3.302)
  expect(holeObstacle!.height).toBe(3.302)
})

test("rectangular pcb_hole is added as an obstacle with correct dimensions", () => {
  const circuitJson = makeCircuitJson([
    {
      type: "pcb_hole",
      pcb_hole_id: "pcb_hole_rect",
      hole_shape: "rect",
      hole_width: 4,
      hole_height: 2,
      x: 1,
      y: 2,
    },
  ])

  const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
    source_group_id: "source_group_0",
  })

  const holeObstacle = packOutput.obstacles!.find(
    (o) => o.obstacleId === "pcb_hole_rect",
  )
  expect(holeObstacle).toBeDefined()
  expect(holeObstacle!.width).toBe(4)
  expect(holeObstacle!.height).toBe(2)
})

test("oval pcb_hole is added as an obstacle with correct dimensions", () => {
  const circuitJson = makeCircuitJson([
    {
      type: "pcb_hole",
      pcb_hole_id: "pcb_hole_oval",
      hole_shape: "oval",
      hole_width: 5,
      hole_height: 3,
      x: -2,
      y: 4,
    },
  ])

  const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
    source_group_id: "source_group_0",
  })

  const holeObstacle = packOutput.obstacles!.find(
    (o) => o.obstacleId === "pcb_hole_oval",
  )
  expect(holeObstacle).toBeDefined()
  expect(holeObstacle!.absoluteCenter).toEqual({ x: -2, y: 4 })
  expect(holeObstacle!.width).toBe(5)
  expect(holeObstacle!.height).toBe(3)
})

test("multiple pcb_holes are all added as obstacles", () => {
  const circuitJson = makeCircuitJson([
    {
      type: "pcb_hole",
      pcb_hole_id: "pcb_hole_0",
      hole_shape: "circle",
      hole_diameter: 1,
      x: 0,
      y: 0,
    },
    {
      type: "pcb_hole",
      pcb_hole_id: "pcb_hole_1",
      hole_shape: "circle",
      hole_diameter: 2,
      x: 5,
      y: 5,
    },
    {
      type: "pcb_hole",
      pcb_hole_id: "pcb_hole_2",
      hole_shape: "rect",
      hole_width: 3,
      hole_height: 1.5,
      x: -5,
      y: -5,
    },
  ])

  const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
    source_group_id: "source_group_0",
  })

  const holeObstacles = packOutput.obstacles!.filter((o) =>
    o.obstacleId.startsWith("pcb_hole_"),
  )
  expect(holeObstacles).toHaveLength(3)
})

test("rotated pill plated hole with rect pad is added as an obstacle", () => {
  const circuitJson = makeCircuitJson([
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pcb_plated_hole_rotated",
      shape: "rotated_pill_hole_with_rect_pad",
      hole_shape: "rotated_pill",
      pad_shape: "rect",
      hole_width: 4,
      hole_height: 2,
      hole_ccw_rotation: 30,
      rect_pad_width: 6,
      rect_pad_height: 4,
      rect_ccw_rotation: 30,
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: 3,
      y: -2,
      layers: ["top", "bottom"],
    },
  ])

  const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
    source_group_id: "source_group_0",
  })

  const obstacle = packOutput.obstacles!.find(
    ({ obstacleId }) => obstacleId === "pcb_plated_hole_rotated",
  )
  expect(obstacle).toBeDefined()
  expect(obstacle?.absoluteCenter).toEqual({ x: 3, y: -2 })
  expect(obstacle?.width).toBeCloseTo(3 * Math.sqrt(3) + 2)
  expect(obstacle?.height).toBeCloseTo(3 + 2 * Math.sqrt(3))
})

test("pcb_hole obstacles svg snapshot", async () => {
  const circuitJson = makeCircuitJson([
    {
      type: "pcb_hole",
      pcb_hole_id: "pcb_hole_0",
      hole_shape: "circle",
      hole_diameter: 3.302,
      x: 5,
      y: -3,
    },
    {
      type: "pcb_hole",
      pcb_hole_id: "pcb_hole_1",
      hole_shape: "rect",
      hole_width: 4,
      hole_height: 2,
      x: -5,
      y: -5,
    },
    {
      type: "pcb_hole",
      pcb_hole_id: "pcb_hole_2",
      hole_shape: "oval",
      hole_width: 5,
      hole_height: 3,
      x: -2,
      y: 4,
    },
  ])

  const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
    source_group_id: "source_group_0",
  })

  const graphics = getGraphicsFromPackOutput(packOutput)

  await expect(
    getSvgFromGraphicsObject(graphics, { backgroundColor: "white" }),
  ).toMatchSvgSnapshot(import.meta.path)
})
