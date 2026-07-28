import { test, expect } from "bun:test"
import { PackSolver2 } from "../lib/PackSolver2/PackSolver2"
import type { PackInput } from "../lib/types"

test("PackSolver2 places components with mustBeOnBoundary on the board edge", () => {
  const packInput: PackInput = {
    components: [
      {
        componentId: "edge_comp",
        mustBeOnBoundary: true,
        pads: [
          {
            padId: "pad1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 2, y: 2 },
            networkId: "net1",
          },
        ],
        availableRotationDegrees: [0],
        courtyard: {
          offsetFromCenter: { x: 0, y: 0 },
          width: 2,
          height: 2,
        },
      },
    ],
    boundaryOutline: [
      { x: -10, y: -10 },
      { x: 10, y: -10 },
      { x: 10, y: 10 },
      { x: -10, y: 10 },
    ],
    minGap: 0,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_distance_to_network",
  }

  const solver = new PackSolver2(packInput)
  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.packedComponents).toHaveLength(1)

  const component = solver.packedComponents[0]!
  expect(component.componentId).toBe("edge_comp")

  // The centroid of the boundary is at (0, 0).
  // An edge component should NOT be at (0, 0).
  expect(component.center).not.toEqual({ x: 0, y: 0 })

  // Since courtyard width/height is 2, it is a 2x2 square.
  // The center is (x, y). The edges are x +/- 1, y +/- 1.
  // The boundary outline is x = +/- 10, y = +/- 10.
  // So one of the component edges must touch the boundary outline (i.e. x +/- 1 = +/-10 or y +/- 1 = +/-10).
  // That means x must be +/-9 or y must be +/-9.
  const touchesLeft = Math.abs(component.center.x - -9) < 0.01
  const touchesRight = Math.abs(component.center.x - 9) < 0.01
  const touchesBottom = Math.abs(component.center.y - -9) < 0.01
  const touchesTop = Math.abs(component.center.y - 9) < 0.01

  expect(touchesLeft || touchesRight || touchesBottom || touchesTop).toBe(true)
})

test("PackSolver2 places multiple components correctly with boundary outline", () => {
  const packInput: PackInput = {
    components: [
      {
        componentId: "edge_comp",
        shouldBeOnEdgeOfBoard: true,
        pads: [
          {
            padId: "pad1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 2, y: 2 },
            networkId: "net1",
          },
        ],
        availableRotationDegrees: [0],
        courtyard: {
          offsetFromCenter: { x: 0, y: 0 },
          width: 2,
          height: 2,
        },
      },
      {
        componentId: "normal_comp",
        pads: [
          {
            padId: "pad2",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
            networkId: "net1",
          },
        ],
        availableRotationDegrees: [0],
      },
    ],
    boundaryOutline: [
      { x: -10, y: -10 },
      { x: 10, y: -10 },
      { x: 10, y: 10 },
      { x: -10, y: 10 },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_distance_to_network",
  }

  const solver = new PackSolver2(packInput)
  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.packedComponents).toHaveLength(2)

  const edgeComp = solver.packedComponents.find(
    (c) => c.componentId === "edge_comp",
  )!
  const normalComp = solver.packedComponents.find(
    (c) => c.componentId === "normal_comp",
  )!

  // edgeComp must touch the boundary
  const x = edgeComp.center.x
  const y = edgeComp.center.y
  const touchesLeft = Math.abs(x - -9) < 0.01
  const touchesRight = Math.abs(x - 9) < 0.01
  const touchesBottom = Math.abs(y - -9) < 0.01
  const touchesTop = Math.abs(y - 9) < 0.01

  expect(touchesLeft || touchesRight || touchesBottom || touchesTop).toBe(true)
})

test("reproduce SOIC8 chip boundary placement on 40x40 board", () => {
  const packInput: PackInput = {
    components: [
      {
        componentId: "chip_u1",
        shouldBeOnEdgeOfBoard: true,
        pads: [
          {
            padId: "pad0",
            type: "rect",
            offset: { x: -2.15, y: 1.905 },
            size: { x: 1, y: 0.6 },
            networkId: "net1",
          },
          {
            padId: "pad1",
            type: "rect",
            offset: { x: -2.15, y: 0.635 },
            size: { x: 1, y: 0.6 },
            networkId: "net1",
          },
          {
            padId: "pad2",
            type: "rect",
            offset: { x: -2.15, y: -0.635 },
            size: { x: 1, y: 0.6 },
            networkId: "net1",
          },
          {
            padId: "pad3",
            type: "rect",
            offset: { x: -2.15, y: -1.905 },
            size: { x: 1, y: 0.6 },
            networkId: "net1",
          },
          {
            padId: "pad4",
            type: "rect",
            offset: { x: 2.15, y: -1.905 },
            size: { x: 1, y: 0.6 },
            networkId: "net1",
          },
          {
            padId: "pad5",
            type: "rect",
            offset: { x: 2.15, y: -0.635 },
            size: { x: 1, y: 0.6 },
            networkId: "net1",
          },
          {
            padId: "pad6",
            type: "rect",
            offset: { x: 2.15, y: 0.635 },
            size: { x: 1, y: 0.6 },
            networkId: "net1",
          },
          {
            padId: "pad7",
            type: "rect",
            offset: { x: 2.15, y: 1.905 },
            size: { x: 1, y: 0.6 },
            networkId: "net1",
          },
        ],
        availableRotationDegrees: [0],
      },
      {
        componentId: "res_r1",
        pads: [
          {
            padId: "pad8",
            type: "rect",
            offset: { x: -0.5, y: 0 },
            size: { x: 0.6, y: 0.6 },
            networkId: "net1",
          },
          {
            padId: "pad9",
            type: "rect",
            offset: { x: 0.5, y: 0 },
            size: { x: 0.6, y: 0.6 },
            networkId: "net1",
          },
        ],
        availableRotationDegrees: [0],
      },
    ],
    boundaryOutline: [
      { x: -20, y: -20 },
      { x: 20, y: -20 },
      { x: 20, y: 20 },
      { x: -20, y: 20 },
    ],
    minGap: 0,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  const solver = new PackSolver2(packInput)
  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.packedComponents).toHaveLength(2)

  const u1 = solver.packedComponents.find((c) => c.componentId === "chip_u1")!
  console.log("REPRODUCTION U1 CENTER:", u1.center)
  console.log("REPRODUCTION U1 PADS:", JSON.stringify(u1.pads, null, 2))

  const halfWidth = 5.3 / 2
  const halfHeight = 4.41 / 2
  const distToLeft = Math.abs(u1.center.x - halfWidth - -20)
  const distToRight = Math.abs(u1.center.x + halfWidth - 20)
  const distToBottom = Math.abs(u1.center.y - halfHeight - -20)
  const distToTop = Math.abs(u1.center.y + halfHeight - 20)
  const minDistance = Math.min(distToLeft, distToRight, distToBottom, distToTop)

  expect(minDistance).toBeLessThan(0.1)
})
