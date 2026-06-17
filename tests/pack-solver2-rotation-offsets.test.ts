import { test, expect } from "bun:test"
import { PackSolver2 } from "../lib/PackSolver2/PackSolver2"
import type { InputComponent, PackInput } from "../lib/types"

const createComponent = (
  componentId: string,
  overrides: Partial<InputComponent> = {},
): InputComponent => ({
  componentId,
  pads: [
    {
      padId: `${componentId}.pad1`,
      type: "rect",
      offset: { x: 0, y: 0 },
      size: { x: 1, y: 1 },
      networkId: `${componentId}.net1`,
    },
  ],
  ...overrides,
})

const createPackInput = (component: InputComponent): PackInput => ({
  components: [component],
  minGap: 0.1,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "minimum_sum_distance_to_network",
})

test("PackSolver2 uses first available rotation for the first dynamic component", () => {
  const solver = new PackSolver2(
    createPackInput(
      createComponent("comp1", {
        availableRotationDegrees: [270],
      }),
    ),
  )

  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.packedComponents[0]?.ccwRotationOffset).toBe(270)
})

test("PackSolver2 uses first available rotation for static components", () => {
  const solver = new PackSolver2(
    createPackInput(
      createComponent("comp1", {
        isStatic: true,
        center: { x: 2, y: 3 },
        availableRotationDegrees: [90],
      }),
    ),
  )

  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.packedComponents[0]?.ccwRotationOffset).toBe(90)
})

test("PackSolver2 preserves explicit static rotation over available rotations", () => {
  const solver = new PackSolver2(
    createPackInput(
      createComponent("comp1", {
        isStatic: true,
        center: { x: 2, y: 3 },
        availableRotationDegrees: [90],
        ccwRotationOffset: 180,
      }),
    ),
  )

  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.packedComponents[0]?.ccwRotationOffset).toBe(180)
})
