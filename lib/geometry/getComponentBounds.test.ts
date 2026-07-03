import { expect, test } from "bun:test"
import { getComponentBounds } from "./getComponentBounds"
import { setPackedComponentPadCenters } from "../PackSolver2/setPackedComponentPadCenters"
import type { PackedComponent } from "../types"

// A 2x1 pad at the origin; rotating the component 90deg makes it 1 wide x 2 tall
// in the world. setPackedComponentPadCenters swaps the pad size to match, but
// getComponentBounds then rotates the already-swapped rect again, so the bounds
// come out transposed (2 wide x 1 tall).
test("getComponentBounds handles a 90deg-rotated rect pad", () => {
  const component: PackedComponent = {
    componentId: "C1",
    center: { x: 0, y: 0 },
    ccwRotationOffset: 90,
    pads: [
      {
        padId: "p1",
        networkId: "n1",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 2, y: 1 },
        absoluteCenter: { x: 0, y: 0 },
      },
    ],
  }
  setPackedComponentPadCenters(component)

  const bounds = getComponentBounds(component, 0)
  expect(bounds.maxX - bounds.minX).toBeCloseTo(1)
  expect(bounds.maxY - bounds.minY).toBeCloseTo(2)
  expect(bounds.minX).toBeCloseTo(-0.5)
  expect(bounds.maxX).toBeCloseTo(0.5)
  expect(bounds.minY).toBeCloseTo(-1)
  expect(bounds.maxY).toBeCloseTo(1)
})
