import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"

/**
 * Minimal circuit JSON with a source group, pcb_group, pcb_board, one
 * component (so the tree is non-empty), and pcb_hole elements to verify
 * they are converted into obstacles.
 */
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
