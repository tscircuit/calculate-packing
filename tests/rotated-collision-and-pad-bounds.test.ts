import { expect, test } from "bun:test"
import { getComponentBounds } from "../lib/geometry/getComponentBounds"
import { getComponentCollisionBoxes } from "../lib/PackSolver2/getComponentCollisionBoxes"
import { setPackedComponentPadCenters } from "../lib/PackSolver2/setPackedComponentPadCenters"
import type { PackedComponent } from "../lib/types"

test("setPackedComponentPadCenters is idempotent and recomputes from unrotated pad dimensions", () => {
  const component: PackedComponent = {
    componentId: "U1",
    center: { x: 1, y: 2 },
    ccwRotationOffset: 90,
    pads: [
      {
        padId: "U1.1",
        networkId: "net1",
        type: "rect",
        offset: { x: 2, y: 0.5 },
        size: { x: 3, y: 1 },
        absoluteCenter: { x: 0, y: 0 },
      },
    ],
  }

  setPackedComponentPadCenters(component)
  expect(component.pads[0]!.size).toEqual({ x: 1, y: 3 })
  expect(component.pads[0]!.absoluteCenter.x).toBeCloseTo(0.5)
  expect(component.pads[0]!.absoluteCenter.y).toBeCloseTo(4)

  // Updating center and calling setPackedComponentPadCenters again must not swap pad.size back
  component.center = { x: 5, y: 6 }
  setPackedComponentPadCenters(component)
  expect(component.pads[0]!.size).toEqual({ x: 1, y: 3 })
  expect(component.pads[0]!.absoluteCenter.x).toBeCloseTo(4.5)
  expect(component.pads[0]!.absoluteCenter.y).toBeCloseTo(8)

  // Rotating back to 180deg restores original orientation dimensions
  component.ccwRotationOffset = 180
  setPackedComponentPadCenters(component)
  expect(component.pads[0]!.size).toEqual({ x: 3, y: 1 })
})

test("setPackedComponentPadCenters and getComponentCollisionBoxes compute rotated bounds for non-90deg rotations", () => {
  const expectedDiagonal = 4 * Math.SQRT1_2 + 2 * Math.SQRT1_2

  const padComponent: PackedComponent = {
    componentId: "R1",
    center: { x: 0, y: 0 },
    ccwRotationOffset: 45,
    pads: [
      {
        padId: "R1.1",
        networkId: "net1",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 4, y: 2 },
        absoluteCenter: { x: 0, y: 0 },
      },
    ],
  }

  setPackedComponentPadCenters(padComponent)
  expect(padComponent.pads[0]!.size.x).toBeCloseTo(expectedDiagonal)
  expect(padComponent.pads[0]!.size.y).toBeCloseTo(expectedDiagonal)

  const courtyardComponent: PackedComponent = {
    componentId: "U2",
    center: { x: 3, y: -2 },
    ccwRotationOffset: 45,
    courtyard: {
      offsetFromCenter: { x: 1, y: 0 },
      width: 4,
      height: 2,
    },
    pads: [],
  }

  const [box] = getComponentCollisionBoxes(courtyardComponent)
  const bounds = getComponentBounds(courtyardComponent, 0)
  expect(box!.width).toBeCloseTo(expectedDiagonal)
  expect(box!.height).toBeCloseTo(expectedDiagonal)
  expect(box!.width).toBeCloseTo(bounds.maxX - bounds.minX)
  expect(box!.height).toBeCloseTo(bounds.maxY - bounds.minY)
})
