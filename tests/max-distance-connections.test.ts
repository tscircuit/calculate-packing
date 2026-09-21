import { expect, test } from "bun:test"
import { PackSolver2 } from "../lib/PackSolver2/PackSolver2"
import type { InputPad, PackInput } from "../lib/types"

const createPad = (padId: string, networkId: string): InputPad => ({
  padId,
  networkId,
  type: "rect",
  offset: { x: 0, y: 0 },
  size: { x: 0.2, y: 0.2 },
})

const createInput = (maxDistance?: number): PackInput => ({
  components: [
    {
      componentId: "maximum-length-target",
      isStatic: true,
      center: { x: 0, y: 0 },
      availableRotationDegrees: [0],
      pads: [createPad("target-a", "A")],
    },
    {
      componentId: "other-network-target",
      isStatic: true,
      center: { x: 10, y: 0 },
      availableRotationDegrees: [0],
      pads: [createPad("target-b", "B")],
    },
    {
      componentId: "component-to-pack",
      availableRotationDegrees: [0],
      pads: [
        createPad("constrained-pad", "A"),
        createPad("other-pad-1", "B"),
        createPad("other-pad-2", "B"),
      ],
      courtyard: {
        offsetFromCenter: { x: 0, y: 0 },
        width: 0.4,
        height: 0.4,
      },
    },
  ],
  minGap: 0,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "shortest_connection_along_outline",
  weightedConnections: [
    {
      padIds: ["constrained-pad", "target-a"],
      weight: 1,
      ...(maxDistance === undefined ? {} : { maxDistance }),
    },
  ],
})

test("maximum-distance connections take priority during packing", () => {
  const unconstrainedSolver = new PackSolver2(createInput())
  unconstrainedSolver.solve()
  const unconstrainedComponent = unconstrainedSolver.packedComponents.find(
    (component) => component.componentId === "component-to-pack",
  )

  const constrainedSolver = new PackSolver2(createInput(2))
  constrainedSolver.solve()
  const constrainedComponent = constrainedSolver.packedComponents.find(
    (component) => component.componentId === "component-to-pack",
  )
  const constrainedPad = constrainedComponent?.pads.find(
    (pad) => pad.padId === "constrained-pad",
  )
  const constrainedDistance = Math.hypot(
    constrainedPad?.absoluteCenter.x ?? Infinity,
    constrainedPad?.absoluteCenter.y ?? Infinity,
  )

  expect(unconstrainedComponent?.center.x).toBeGreaterThan(9)
  expect(constrainedSolver.failed).toBe(false)
  expect(constrainedDistance).toBeLessThanOrEqual(2 + 1e-6)
})

test("fails instead of returning a placement that violates a maximum distance", () => {
  const solver = new PackSolver2(createInput(0.01))
  solver.solve()

  expect(solver.failed).toBe(true)
  expect(solver.activeSubSolver?.error).toBe("No valid candidates found")
})
