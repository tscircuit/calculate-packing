import { expect, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import type { PcbComponent } from "circuit-json"
import { extractPadInfos } from "../lib/plumbing/extractPadInfos"

type RotatedPlatedHoleShape = "oval" | "pill"

const getRotatedPlatedHolePadSize = (
  shape: RotatedPlatedHoleShape,
  ccwRotation: number,
) => {
  const circuitJson = [
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      source_component_id: "source_component_0",
      center: { x: 0, y: 0 },
      layer: "top",
      rotation: 0,
      width: 2,
      height: 6,
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pcb_plated_hole_0",
      pcb_component_id: "pcb_component_0",
      shape,
      x: 1,
      y: 2,
      outer_width: 2,
      outer_height: 6,
      hole_width: 1,
      hole_height: 5,
      ccw_rotation: ccwRotation,
      layers: ["top", "bottom"],
    },
  ]
  const db = cju(circuitJson as any)

  return extractPadInfos(
    circuitJson[0] as PcbComponent,
    db,
    (pcbPortId) => pcbPortId ?? "",
  )[0]
}

for (const shape of ["oval", "pill"] as const) {
  for (const { rotation, width, height } of [
    { rotation: 0, width: 2, height: 6 },
    { rotation: 90, width: 6, height: 2 },
    { rotation: 180, width: 2, height: 6 },
    { rotation: 270, width: 6, height: 2 },
  ]) {
    test(`${shape} plated-hole pad uses its ${rotation}-degree board-space bounds`, () => {
      const pad = getRotatedPlatedHolePadSize(shape, rotation)

      expect(pad?.size.x).toBeCloseTo(width)
      expect(pad?.size.y).toBeCloseTo(height)
      expect(pad?.absoluteCenter).toEqual({ x: 1, y: 2 })
    })
  }

  test(`${shape} plated-hole pad uses a conservative AABB at 45 degrees`, () => {
    const pad = getRotatedPlatedHolePadSize(shape, 45)
    const expectedSize = 4 * Math.SQRT2

    expect(pad?.size.x).toBeCloseTo(expectedSize)
    expect(pad?.size.y).toBeCloseTo(expectedSize)
  })
}
