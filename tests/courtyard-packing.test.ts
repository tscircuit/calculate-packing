import { test, expect } from "bun:test"
import { convertCircuitJsonToPackOutput } from "../lib/plumbing/convertCircuitJsonToPackOutput"
import { convertPackOutputToPackInput } from "../lib/plumbing/convertPackOutputToPackInput"
import { checkOverlapWithPackedComponents } from "../lib/PackSolver2/checkOverlapWithPackedComponents"
import { pack } from "../lib/pack"
import type { PackOutput, PackedComponent } from "../lib/types"

test("convertCircuitJsonToPackOutput extracts pcb_courtyard_rect", () => {
  const circuitJson = [
    {
      type: "source_component",
      source_component_id: "sc1",
      source_group_id: "root",
      name: "U1",
      ftype: "simple_chip",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pc1",
      source_component_id: "sc1",
      center: { x: 0, y: 0 },
      rotation: 0,
      width: 2,
      height: 2,
      layer: "top",
    },
    {
      type: "source_port",
      source_port_id: "sp1",
      source_component_id: "sc1",
      name: "1",
    },
    {
      type: "pcb_port",
      pcb_port_id: "pp1",
      pcb_component_id: "pc1",
      source_port_id: "sp1",
      x: 0,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      pcb_component_id: "pc1",
      pcb_port_id: "pp1",
      shape: "rect",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      layer: "top",
    },
    {
      type: "pcb_courtyard_rect",
      pcb_courtyard_rect_id: "cy1",
      pcb_component_id: "pc1",
      center: { x: 0, y: 0 },
      width: 4,
      height: 3,
      layer: "top",
    },
    {
      type: "source_group",
      source_group_id: "root",
      name: "root",
    },
  ] as any

  const result = convertCircuitJsonToPackOutput(circuitJson, {
    source_group_id: "root",
  })

  const comp = result.components.find((c) => c.componentId === "pc1")
  expect(comp).toBeDefined()
  expect(comp!.courtyard).toEqual({
    offsetFromCenter: { x: 0, y: 0 },
    width: 4,
    height: 3,
  })
})

test("fixed components use courtyard bounds as packing obstacles", () => {
  const circuitJson = [
    {
      type: "source_group",
      source_group_id: "root",
      name: "root",
    },
    {
      type: "source_component",
      source_component_id: "sc1",
      source_group_id: "root",
      name: "J1",
      ftype: "simple_chip",
    },
    {
      type: "source_port",
      source_port_id: "sp1",
      source_component_id: "sc1",
      name: "1",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pc1",
      source_component_id: "sc1",
      center: { x: 1, y: 2 },
      rotation: 0,
      width: 1,
      height: 1,
      layer: "top",
      position_mode: "relative_to_group_anchor",
    },
    {
      type: "pcb_port",
      pcb_port_id: "pp1",
      pcb_component_id: "pc1",
      source_port_id: "sp1",
      x: 1,
      y: 2,
      layers: ["top"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      pcb_component_id: "pc1",
      pcb_port_id: "pp1",
      shape: "rect",
      x: 1,
      y: 2,
      width: 1,
      height: 1,
      layer: "top",
    },
    {
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: "cy1",
      pcb_component_id: "pc1",
      outline: [
        { x: -2, y: 1 },
        { x: 8, y: 1 },
        { x: 8, y: 7 },
        { x: -2, y: 7 },
      ],
      layer: "top",
    },
  ] as any

  const result = convertCircuitJsonToPackOutput(circuitJson, {
    source_group_id: "root",
  })

  expect(result.obstacles).toEqual([
    {
      obstacleId: "pc1",
      absoluteCenter: { x: 3, y: 4 },
      width: 10,
      height: 6,
    },
  ])
})

test("overlapping courtyards are detected even when pads don't overlap", () => {
  // Two components with small pads (1x1) but large courtyards (6x4)
  // Placed 4mm apart: pads have 3mm gap, but courtyards overlap by 2mm
  const comp1: PackedComponent = {
    componentId: "U1",
    center: { x: 0, y: 0 },
    ccwRotationOffset: 0,
    pads: [
      {
        padId: "p1",
        networkId: "net1",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 1, y: 1 },
        absoluteCenter: { x: 0, y: 0 },
      },
    ],
    courtyard: {
      offsetFromCenter: { x: 0, y: 0 },
      width: 6,
      height: 4,
    },
  }

  const comp2: PackedComponent = {
    componentId: "U2",
    center: { x: 4, y: 0 },
    ccwRotationOffset: 0,
    pads: [
      {
        padId: "p2",
        networkId: "net2",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 1, y: 1 },
        absoluteCenter: { x: 4, y: 0 },
      },
    ],
    courtyard: {
      offsetFromCenter: { x: 0, y: 0 },
      width: 6,
      height: 4,
    },
  }

  const result = checkOverlapWithPackedComponents({
    component: comp2,
    packedComponents: [comp1],
    minGap: 0.5,
  })

  expect(result.hasOverlap).toBe(true)
})

test("pack spaces courtyard components apart by courtyard size + minGap", () => {
  const result = pack({
    components: [
      {
        componentId: "U1",
        pads: [
          {
            padId: "p1",
            networkId: "net1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
        courtyard: {
          offsetFromCenter: { x: 0, y: 0 },
          width: 5,
          height: 5,
        },
      },
      {
        componentId: "U2",
        pads: [
          {
            padId: "p2",
            networkId: "net1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
        courtyard: {
          offsetFromCenter: { x: 0, y: 0 },
          width: 5,
          height: 5,
        },
      },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  })

  expect(result.components.length).toBe(2)

  const c1 = result.components.find((c) => c.componentId === "U1")!
  const c2 = result.components.find((c) => c.componentId === "U2")!
  const dx = Math.abs(c1.center.x - c2.center.x)
  const dy = Math.abs(c1.center.y - c2.center.y)

  // Centers must be at least 5 (half courtyard + half courtyard) + 0.5 (minGap) apart
  expect(Math.max(dx, dy)).toBeGreaterThanOrEqual(5.5 - 0.01)
})

test("convertPackOutputToPackInput preserves courtyard field", () => {
  const packOutput: PackOutput = {
    components: [
      {
        componentId: "U1",
        center: { x: 0, y: 0 },
        ccwRotationOffset: 0,
        pads: [
          {
            padId: "p1",
            networkId: "net1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
            absoluteCenter: { x: 0, y: 0 },
          },
        ],
        courtyard: {
          offsetFromCenter: { x: 0.5, y: 0 },
          width: 6,
          height: 4,
        },
      },
    ],
    minGap: 1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  const input = convertPackOutputToPackInput(packOutput)
  expect(input.components[0]!.courtyard).toEqual({
    offsetFromCenter: { x: 0.5, y: 0 },
    width: 6,
    height: 4,
  })
})
