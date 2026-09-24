import { expect, test } from "bun:test"
import type { CircuitJson, PcbComponent } from "circuit-json"
import { checkOverlapWithPackedComponents } from "../lib/PackSolver2/checkOverlapWithPackedComponents"
import { convertCircuitJsonToPackOutput } from "../lib/plumbing/convertCircuitJsonToPackOutput"

const getCircuitJson = (opts: {
  ccwRotationDegrees?: number
  positionMode?: PcbComponent["position_mode"]
}): CircuitJson => [
  { type: "source_group", source_group_id: "root", name: "root" },
  {
    type: "source_component",
    source_component_id: "sc1",
    source_group_id: "root",
    name: "J1",
    ftype: "simple_chip",
  },
  {
    type: "pcb_component",
    pcb_component_id: "pc1",
    source_component_id: "sc1",
    center: { x: 10, y: 20 },
    rotation: 0,
    width: 1,
    height: 1,
    layer: "top",
    obstructs_within_bounds: false,
    position_mode: opts.positionMode,
  },
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    pcb_component_id: "pc1",
    shape: "rect",
    x: 10,
    y: 20,
    width: 1,
    height: 1,
    layer: "top",
  },
  {
    type: "pcb_courtyard_rect",
    pcb_courtyard_rect_id: "cy1",
    pcb_component_id: "pc1",
    center: { x: 12, y: 23 },
    width: 6,
    height: 2,
    layer: "top",
    ccw_rotation: opts.ccwRotationDegrees,
  },
]

const rotations = [
  { ccwRotationDegrees: undefined, width: 6, height: 2 },
  { ccwRotationDegrees: 0, width: 6, height: 2 },
  { ccwRotationDegrees: 90, width: 2, height: 6 },
  { ccwRotationDegrees: -90, width: 2, height: 6 },
  { ccwRotationDegrees: 180, width: 6, height: 2 },
  {
    ccwRotationDegrees: 45,
    width: 4 * Math.SQRT2,
    height: 4 * Math.SQRT2,
  },
]

for (const { ccwRotationDegrees, width, height } of rotations) {
  test(`extracts movable courtyard bounds at ${ccwRotationDegrees ?? "default"} degrees`, () => {
    const result = convertCircuitJsonToPackOutput(
      getCircuitJson({ ccwRotationDegrees }),
      { source_group_id: "root" },
    )
    expect(result.components).toHaveLength(1)
    const courtyard = result.components[0]!.courtyard!
    expect(courtyard.offsetFromCenter).toEqual({ x: 2, y: 3 })
    expect(courtyard.width).toBeCloseTo(width, 10)
    expect(courtyard.height).toBeCloseTo(height, 10)
  })

  test(`extracts fixed courtyard obstacle bounds at ${ccwRotationDegrees ?? "default"} degrees`, () => {
    const result = convertCircuitJsonToPackOutput(
      getCircuitJson({
        ccwRotationDegrees,
        positionMode: "relative_to_group_anchor",
      }),
      { source_group_id: "root" },
    )
    expect(result.components).toHaveLength(0)
    expect(result.obstacles).toHaveLength(1)
    const obstacle = result.obstacles![0]!
    expect(obstacle.absoluteCenter).toEqual({ x: 12, y: 23 })
    expect(obstacle.width).toBeCloseTo(width, 10)
    expect(obstacle.height).toBeCloseTo(height, 10)
  })
}

test("detects a component overlapping the rotated end of a courtyard", () => {
  const result = convertCircuitJsonToPackOutput(
    getCircuitJson({ ccwRotationDegrees: 90 }),
    { source_group_id: "root" },
  )
  const overlap = checkOverlapWithPackedComponents({
    component: {
      componentId: "pc2",
      center: { x: 12, y: 25.5 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "pad2",
          networkId: "net2",
          type: "rect",
          size: { x: 1, y: 1 },
          offset: { x: 0, y: 0 },
          absoluteCenter: { x: 12, y: 25.5 },
        },
      ],
    },
    packedComponents: result.components,
    minGap: 0.1,
  })
  expect(overlap.hasOverlap).toBe(true)
})
