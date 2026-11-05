import { expect, test } from "bun:test"
import { cju } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, PcbComponent } from "circuit-json"
import { extractPadInfos } from "../lib/plumbing/extractPadInfos"
import { getElementOutsideTree } from "../lib/plumbing/getElementsOutsideTree"
import { getObstacleFromElement } from "../lib/plumbing/getObstacleFromElement"

test("extractPadInfos honors rotated circular_hole_with_rect_pad and hole_with_polygon_pad outlines", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      source_component_id: "source_component_0",
      center: { x: 0, y: 0 },
      layer: "top",
      rotation: 0,
      width: 10,
      height: 10,
      obstructs_within_bounds: false,
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "ph_rect_rotated",
      pcb_component_id: "pcb_component_0",
      shape: "circular_hole_with_rect_pad",
      hole_shape: "circle",
      pad_shape: "rect",
      x: 5,
      y: -3,
      hole_diameter: 1,
      rect_pad_width: 2.4,
      rect_pad_height: 1.6,
      rect_ccw_rotation: 90,
      hole_offset_x: 0,
      hole_offset_y: 0,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "ph_polygon",
      pcb_component_id: "pcb_component_0",
      shape: "hole_with_polygon_pad",
      hole_shape: "circle",
      hole_diameter: 1,
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: 10,
      y: 20,
      pad_outline: [
        { x: -1, y: -2 },
        { x: 3, y: -2 },
        { x: 3, y: 4 },
        { x: -1, y: 4 },
      ],
      layers: ["top", "bottom"],
    },
  ]

  const db = cju(circuitJson)
  const pads = extractPadInfos(
    circuitJson[0] as PcbComponent,
    db,
    (id) => id ?? "net",
  )

  expect(pads).toHaveLength(2)
  expect(pads[0]).toEqual({
    padId: "ph_rect_rotated",
    networkId: "net",
    size: { x: 1.6, y: 2.4 },
    absoluteCenter: { x: 5, y: -3 },
    pcbPortId: undefined,
  })
  expect(pads[1]).toEqual({
    padId: "ph_polygon",
    networkId: "net",
    size: { x: 4, y: 6 },
    absoluteCenter: { x: 11, y: 21 },
    pcbPortId: undefined,
  })
})

test("getObstacleFromElement supports all plated-hole shapes, rotated rect pads, and rotated_pill holes", () => {
  expect(
    getObstacleFromElement({
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "ph_circle",
      shape: "circle",
      x: 3,
      y: 4,
      outer_diameter: 2.5,
      hole_diameter: 1.2,
      layers: ["top", "bottom"],
    }),
  ).toEqual({
    obstacleId: "ph_circle",
    absoluteCenter: { x: 3, y: 4 },
    width: 2.5,
    height: 2.5,
  })

  expect(
    getObstacleFromElement({
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "ph_pill",
      shape: "pill",
      x: -2,
      y: 6,
      outer_width: 2,
      outer_height: 5,
      hole_width: 1,
      hole_height: 4,
      ccw_rotation: 90,
      layers: ["top", "bottom"],
    }),
  ).toEqual({
    obstacleId: "ph_pill",
    absoluteCenter: { x: -2, y: 6 },
    width: 5,
    height: 2,
  })

  expect(
    getObstacleFromElement({
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "ph_pill_rect",
      shape: "pill_hole_with_rect_pad",
      hole_shape: "pill",
      pad_shape: "rect",
      x: 4,
      y: 5,
      hole_width: 1,
      hole_height: 2,
      rect_pad_width: 3,
      rect_pad_height: 4,
      hole_offset_x: 0,
      hole_offset_y: 0,
      layers: ["top", "bottom"],
    }),
  ).toEqual({
    obstacleId: "ph_pill_rect",
    absoluteCenter: { x: 4, y: 5 },
    width: 3,
    height: 4,
  })

  expect(
    getObstacleFromElement({
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "ph_poly",
      shape: "hole_with_polygon_pad",
      hole_shape: "circle",
      hole_diameter: 1,
      hole_offset_x: 0,
      hole_offset_y: 0,
      x: 2,
      y: 3,
      pad_outline: [
        { x: -2, y: -1 },
        { x: 4, y: -1 },
        { x: 4, y: 3 },
        { x: -2, y: 3 },
      ],
      layers: ["top", "bottom"],
    }),
  ).toEqual({
    obstacleId: "ph_poly",
    absoluteCenter: { x: 3, y: 4 },
    width: 6,
    height: 4,
  })

  expect(
    getObstacleFromElement({
      type: "pcb_hole",
      pcb_hole_id: "hole_rot_pill",
      hole_shape: "rotated_pill",
      x: 1,
      y: -1,
      hole_width: 2,
      hole_height: 6,
      ccw_rotation: 90,
    }),
  ).toEqual({
    obstacleId: "hole_rot_pill",
    absoluteCenter: { x: 1, y: -1 },
    width: 6,
    height: 2,
  })
})

test("getElementOutsideTree locates pcb_component even when otherChildElements[0] is not pcb_component", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_component",
      pcb_component_id: "in_tree_comp",
      source_component_id: "src_0",
      center: { x: 0, y: 0 },
      layer: "top",
      rotation: 0,
      width: 2,
      height: 2,
      obstructs_within_bounds: false,
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "ph_in_tree",
      pcb_component_id: "in_tree_comp",
      shape: "circle",
      x: 0,
      y: 0,
      outer_diameter: 1.5,
      hole_diameter: 0.8,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "ph_outside_tree",
      pcb_component_id: "outside_comp",
      shape: "circle",
      x: 10,
      y: 10,
      outer_diameter: 1.5,
      hole_diameter: 0.8,
      layers: ["top", "bottom"],
    },
  ]
  const db = cju(circuitJson)
  const tree = {
    nodeType: "root",
    childNodes: [
      {
        nodeType: "component",
        otherChildElements: [
          {
            type: "schematic_component",
            schematic_component_id: "sch_0",
            source_component_id: "src_0",
          },
          circuitJson[0],
        ],
        childNodes: [],
      },
    ],
  } as any

  const outside = getElementOutsideTree(db, tree)
  expect(outside.map((e: any) => e.pcb_plated_hole_id)).toEqual([
    "ph_outside_tree",
  ])
})
