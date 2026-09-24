import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { PackSolver2 } from "../lib/PackSolver2/PackSolver2"
import { SingleComponentPackSolver } from "../lib/SingleComponentPackSolver/SingleComponentPackSolver"
import { getComponentBounds } from "../lib/geometry/getComponentBounds"
import type { InputComponent, PackInput } from "../lib/types"

const component = (
  overrides: Partial<InputComponent> = {},
): InputComponent => ({
  componentId: "U1",
  availableRotationDegrees: [0],
  pads: [
    {
      padId: "1",
      networkId: "N1",
      type: "rect",
      offset: { x: 0, y: 0 },
      size: { x: 2, y: 2 },
    },
  ],
  ...overrides,
})
const input = (overrides: Partial<PackInput> = {}): PackInput => ({
  components: [component()],
  minGap: 0.1,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "minimum_sum_distance_to_network",
  bounds: { minX: 10, maxX: 20, minY: 30, maxY: 40 },
  ...overrides,
})

for (const solverType of ["pack", "single"] as const) {
  const solve = (packInput: PackInput) => {
    const solver =
      solverType === "pack"
        ? new PackSolver2(packInput)
        : new SingleComponentPackSolver({
            ...packInput,
            componentToPack: packInput.components[0]!,
            packedComponents: [],
          })
    solver.solve()
    const result =
      solver instanceof PackSolver2
        ? solver.packedComponents[0]
        : solver.getResult()
    return { solver, result }
  }

  test(`${solverType}: first component fits translated rectangular bounds`, () => {
    const { solver, result } = solve(input())
    expect(solver.failed).toBe(false)
    expect(solver.solved).toBe(true)
    expect(result).toBeDefined()
    expect(getComponentBounds(result!)).toEqual({
      minX: 10,
      maxX: 12,
      minY: 30,
      maxY: 32,
    })
    expect(result!.pads[0]!.absoluteCenter).toEqual({ x: 11, y: 31 })
  })

  test(`${solverType}: tries a fitting allowed rotation without mutating the input`, () => {
    const packInput = input({
      bounds: { minX: 10, maxX: 13, minY: 30, maxY: 40 },
      components: [
        component({
          availableRotationDegrees: [0, 90],
          pads: [
            {
              padId: "1",
              networkId: "N1",
              type: "rect",
              offset: { x: 3, y: -2 },
              size: { x: 6, y: 2 },
            },
          ],
        }),
      ],
    })
    const original = structuredClone(packInput)
    const { solver, result } = solve(packInput)
    expect(solver.failed).toBe(false)
    expect(result!.ccwRotationOffset).toBe(90)
    const bounds = getComponentBounds(result!)
    expect(bounds.minX).toBeCloseTo(10)
    expect(bounds.maxX).toBeCloseTo(12)
    expect(bounds.minY).toBeCloseTo(30)
    expect(bounds.maxY).toBeCloseTo(36)
    expect(packInput).toEqual(original)
  })

  test(`${solverType}: rejects an oversized courtyard instead of reporting success`, () => {
    const { solver, result } = solve(
      input({
        components: [
          component({
            courtyard: {
              offsetFromCenter: { x: 3, y: 0 },
              width: 12,
              height: 2,
            },
          }),
        ],
      }),
    )
    expect(solver.failed).toBe(true)
    expect(solver.solved).toBe(false)
    expect(result).toBeUndefined()
  })

  test(`${solverType}: cannot escape a board-covering obstacle through the origin fallback`, () => {
    const { solver, result } = solve(
      input({
        obstacles: [
          {
            obstacleId: "blocked",
            absoluteCenter: { x: 15, y: 35 },
            width: 10,
            height: 10,
          },
        ],
      }),
    )
    expect(solver.failed).toBe(true)
    expect(solver.solved).toBe(false)
    expect(result).toBeUndefined()
  })

  test(`${solverType}: preserves a valid origin seed`, () => {
    const { solver, result } = solve(
      input({ bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 } }),
    )
    expect(solver.failed).toBe(false)
    expect(result!.center).toEqual({ x: 0, y: 0 })
    expect(result!.pads[0]!.size).toEqual({ x: 2, y: 2 })
  })

  test(`${solverType}: keeps obstacle clearance when the first seed is blocked`, () => {
    const { solver, result } = solve(
      input({
        bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
        minGap: 0.25,
        obstacles: [
          {
            obstacleId: "center",
            absoluteCenter: { x: 0, y: 0 },
            width: 2,
            height: 2,
          },
        ],
      }),
    )
    expect(solver.failed).toBe(false)
    expect(solver.solved).toBe(true)
    const box = getComponentBounds(result!)
    expect(box.minX).toBeGreaterThanOrEqual(-5)
    expect(box.maxX).toBeLessThanOrEqual(5)
    expect(box.minY).toBeGreaterThanOrEqual(-5)
    expect(box.maxY).toBeLessThanOrEqual(5)
    const gapX = Math.max(0, box.minX - 1, -1 - box.maxX)
    const gapY = Math.max(0, box.minY - 1, -1 - box.maxY)
    expect(Math.hypot(gapX, gapY)).toBeGreaterThanOrEqual(0.25 - 1e-6)
  })
}

test("translated board contains the first packed component - visual regression", async () => {
  const solver = new PackSolver2(input())
  solver.solve()
  expect(solver.solved).toBe(true)
  await expect(
    getSvgFromGraphicsObject(solver.visualize(), { backgroundColor: "white" }),
  ).toMatchSvgSnapshot(import.meta.path)
})
