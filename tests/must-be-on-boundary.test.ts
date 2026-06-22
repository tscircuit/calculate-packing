import { expect, test } from "bun:test"
import { getComponentBounds } from "../lib/geometry/getComponentBounds"
import { pack } from "../lib/pack"
import type { PackedComponent, PackInput } from "../lib/types"

const boardBounds = {
  minX: -10,
  minY: -5,
  maxX: 10,
  maxY: 5,
}

const makeComponent = (
  componentId: string,
): PackInput["components"][number] => ({
  componentId,
  availableRotationDegrees: [0],
  pads: [
    {
      padId: `${componentId}-pad`,
      networkId: componentId,
      type: "rect",
      offset: { x: 0, y: 0 },
      size: { x: 2, y: 1 },
    },
  ],
  courtyard: {
    offsetFromCenter: { x: 0, y: 0 },
    width: 2,
    height: 1,
  },
})

const touchesBoardEdge = (component: PackedComponent) => {
  const bounds = getComponentBounds(component, 0)
  return (
    Math.abs(bounds.minX - boardBounds.minX) < 1e-6 ||
    Math.abs(bounds.maxX - boardBounds.maxX) < 1e-6 ||
    Math.abs(bounds.minY - boardBounds.minY) < 1e-6 ||
    Math.abs(bounds.maxY - boardBounds.maxY) < 1e-6
  )
}

test("mustBeOnBoundary places the first dynamic component on a board edge", () => {
  const result = pack({
    components: [
      {
        ...makeComponent("J1"),
        mustBeOnBoundary: true,
      },
      makeComponent("R1"),
    ],
    minGap: 0,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
    bounds: boardBounds,
  })

  const edgeComponent = result.components.find((c) => c.componentId === "J1")
  expect(edgeComponent).toBeDefined()
  expect(touchesBoardEdge(edgeComponent!)).toBe(true)
})
