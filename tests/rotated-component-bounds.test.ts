import { expect, test } from "bun:test"
import { PackSolver2 } from "../lib/PackSolver2/PackSolver2"
import { getComponentBounds } from "../lib/geometry/getComponentBounds"

test("getComponentBounds accounts for non-90-degree rotation on rectangular pads", () => {
  const rectComponent = {
    componentId: "U1",
    center: { x: 0, y: 0 },
    ccwRotationOffset: 45,
    pads: [
      {
        padId: "U1_body",
        networkId: "net1",
        type: "rect" as const,
        offset: { x: 0, y: 0 },
        size: { x: 10, y: 2 },
        absoluteCenter: { x: 0, y: 0 },
      },
    ],
  }

  const bounds45 = getComponentBounds(rectComponent)
  const expectedHalfSpan = (10 + 2) / (2 * Math.SQRT2)
  expect(bounds45.maxX).toBeCloseTo(expectedHalfSpan, 5)
  expect(bounds45.minX).toBeCloseTo(-expectedHalfSpan, 5)
  expect(bounds45.maxY).toBeCloseTo(expectedHalfSpan, 5)
  expect(bounds45.minY).toBeCloseTo(-expectedHalfSpan, 5)
})

test("PackSolver2 packs a 45-degree rotated component and getComponentBounds reflects its rotated pad extent", () => {
  const solver = new PackSolver2({
    components: [
      {
        componentId: "U_45",
        availableRotationDegrees: [45],
        pads: [
          {
            padId: "U_45_P1",
            networkId: "net1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 10, y: 2 },
          },
        ],
      },
    ],
    minGap: 1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  })

  solver.solve()
  const packed = solver.packedComponents[0]!
  expect(packed.ccwRotationOffset).toBe(45)
  expect(packed.pads[0]!.size).toEqual({ x: 10, y: 2 })

  const bounds = getComponentBounds(packed)
  const expectedHalfSpan = (10 + 2) / (2 * Math.SQRT2)
  expect(bounds.maxX - packed.center.x).toBeCloseTo(expectedHalfSpan, 5)
  expect(packed.center.x - bounds.minX).toBeCloseTo(expectedHalfSpan, 5)
  expect(bounds.maxY - packed.center.y).toBeCloseTo(expectedHalfSpan, 5)
  expect(packed.center.y - bounds.minY).toBeCloseTo(expectedHalfSpan, 5)
})
