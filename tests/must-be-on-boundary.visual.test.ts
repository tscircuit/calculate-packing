import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getComponentBounds } from "../lib/geometry/getComponentBounds"
import { pointInOutline } from "../lib/geometry/pointInOutline"
import type { Segment } from "../lib/geometry/types"
import { PackSolver2 } from "../lib/PackSolver2/PackSolver2"
import { getGraphicsFromPackOutput } from "../lib/testing/getGraphicsFromPackOutput"
import type { PackInput, PackOutput } from "../lib/types"

test("boundary-constrained component placement - visual regression", () => {
  const boundaryOutline = [
    { x: -12, y: -8 },
    { x: -12, y: 8 },
    { x: 12, y: 8 },
    { x: 12, y: -4 },
    { x: 8, y: -8 },
  ]
  const packInput: PackInput = {
    components: [
      {
        componentId: "USB_EDGE",
        mustBeOnBoundary: true,
        availableRotationDegrees: [0, 90],
        courtyard: {
          offsetFromCenter: { x: 0, y: 0 },
          width: 4,
          height: 2,
        },
        pads: [
          {
            padId: "USB_DP",
            networkId: "DP",
            type: "rect",
            offset: { x: -1, y: 0 },
            size: { x: 1, y: 1 },
          },
          {
            padId: "USB_DM",
            networkId: "DM",
            type: "rect",
            offset: { x: 1, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "MCU",
        availableRotationDegrees: [0],
        courtyard: {
          offsetFromCenter: { x: 0, y: 0 },
          width: 5,
          height: 5,
        },
        pads: [
          {
            padId: "MCU_DP",
            networkId: "DP",
            type: "rect",
            offset: { x: -1, y: -1.5 },
            size: { x: 1, y: 1 },
          },
          {
            padId: "MCU_DM",
            networkId: "DM",
            type: "rect",
            offset: { x: 1, y: -1.5 },
            size: { x: 1, y: 1 },
          },
        ],
      },
    ],
    boundaryOutline,
    minGap: 1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  const solver = new PackSolver2(packInput)
  solver.solve()

  expect(solver.failed).toBe(false)
  expect(solver.solved).toBe(true)

  const edgeComponent = solver.packedComponents.find(
    (component) => component.componentId === "USB_EDGE",
  )!
  const boundarySegments = boundaryOutline.map(
    (point, index) =>
      [
        point,
        boundaryOutline[(index + 1) % boundaryOutline.length]!,
      ] as Segment,
  )
  const bounds = getComponentBounds(edgeComponent)
  const corners = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.minX, y: bounds.maxY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
  ]
  expect(
    corners.every(
      (corner) => pointInOutline(corner, boundarySegments) !== "outside",
    ),
  ).toBe(true)
  expect(
    corners.some(
      (corner) => pointInOutline(corner, boundarySegments) === "boundary",
    ),
  ).toBe(true)

  const packOutput: PackOutput = {
    ...packInput,
    components: solver.packedComponents,
  }
  const graphics = getGraphicsFromPackOutput(packOutput)

  expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
