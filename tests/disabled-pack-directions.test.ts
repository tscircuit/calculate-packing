import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getGraphicsFromPackOutput, pack, type PackInput } from "../lib"
import { SingleComponentPackSolver } from "../lib/SingleComponentPackSolver/SingleComponentPackSolver"

type Direction = NonNullable<PackInput["disabledPackDirections"]>[number]
const directions: Direction[] = ["left", "right", "up", "down"]

const makeInput = (connected = true): PackInput => ({
  components: [
    {
      componentId: "anchor",
      availableRotationDegrees: [0],
      pads: [
        {
          padId: "anchor.1",
          networkId: "GND",
          type: "rect",
          offset: { x: 0, y: 0 },
          size: { x: 2, y: 2 },
        },
      ],
    },
    {
      componentId: "next",
      availableRotationDegrees: [0],
      pads: [
        {
          padId: "next.1",
          networkId: connected ? "GND" : "VCC",
          type: "rect",
          offset: { x: 0, y: 0 },
          size: { x: 1, y: 1 },
        },
      ],
    },
  ],
  minGap: 1,
  packFirst: ["anchor"],
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "minimum_sum_squared_distance_to_network",
})

const only = (allowed: Direction) =>
  directions.filter((direction) => direction !== allowed)

for (const connected of [true, false]) {
  for (const direction of directions) {
    test(`packs ${connected ? "connected" : "disconnected"} components only ${direction}`, () => {
      const input = makeInput(connected)
      input.disabledPackDirections = only(direction)
      const original = structuredClone(input)
      const output = pack(input)
      expect(output.components).toHaveLength(2)
      const next = output.components[1]!
      const expected = {
        left: { x: -2.5, y: 0 },
        right: { x: 2.5, y: 0 },
        up: { x: 0, y: 2.5 },
        down: { x: 0, y: -2.5 },
      }[direction]
      expect(next.center.x).toBeCloseTo(expected.x, 6)
      expect(next.center.y).toBeCloseTo(expected.y, 6)
      expect(input).toEqual(original)
      expect(pack(input)).toEqual(output)
    })
  }
}

test("an empty direction restriction preserves the default layout", () => {
  const input = makeInput()
  expect(pack({ ...input, disabledPackDirections: [] }).components).toEqual(
    pack(input).components,
  )
})

test("directions use world coordinates around a translated static anchor", () => {
  const input = makeInput()
  input.components[0]!.isStatic = true
  input.components[0]!.center = { x: 12, y: -7 }
  input.disabledPackDirections = only("up")
  const output = pack(input)
  expect(output.components[0]!.center).toEqual({ x: 12, y: -7 })
  expect(output.components[1]!.center.x).toBeCloseTo(12, 6)
  expect(output.components[1]!.center.y).toBeCloseTo(-4.5, 6)
})

test("first-component obstacle fallback respects the allowed side", () => {
  const input = makeInput()
  input.components = [input.components[1]!]
  input.obstacles = [
    {
      obstacleId: "blocker",
      absoluteCenter: { x: 0, y: 0 },
      width: 2,
      height: 2,
    },
  ]
  input.disabledPackDirections = only("right")
  const output = pack(input)
  expect(output.components).toHaveLength(1)
  expect(output.components[0]!.center.x).toBeCloseTo(2.5, 6)
  expect(output.components[0]!.center.y).toBeCloseTo(0, 6)
})

test("board boundary candidates do not bypass disabled directions", () => {
  const input = makeInput()
  input.boundaryOutline = [
    { x: -10, y: -10 },
    { x: 10, y: -10 },
    { x: 10, y: 10 },
    { x: -10, y: 10 },
  ]
  input.disabledPackDirections = only("left")
  const output = pack(input)
  expect(output.components).toHaveLength(2)
  expect(output.components[1]!.center.x).toBeCloseTo(-2.5, 6)
  expect(output.components[1]!.center.y).toBeCloseTo(0, 6)
})

test("reports failure instead of returning a partial restricted layout", () => {
  const input = makeInput()
  input.disabledPackDirections = [...directions]
  expect(() => pack(input)).toThrow("No valid candidates")
})

test("a failed restricted fallback does not place on top of an obstacle", () => {
  const input = makeInput()
  input.components = [input.components[1]!]
  input.obstacles = [
    {
      obstacleId: "blocker",
      absoluteCenter: { x: 0, y: 0 },
      width: 2,
      height: 2,
    },
  ]
  input.disabledPackDirections = [...directions]
  expect(() => pack(input)).toThrow("No valid candidates")
})

test("the first unobstructed component can still seed the layout", () => {
  const input = makeInput()
  input.components = [input.components[0]!]
  input.disabledPackDirections = [...directions]
  expect(pack(input).components[0]!.center).toEqual({ x: 0, y: 0 })
})

test("the initial seed fits bounds that exclude the origin", () => {
  const input = makeInput()
  input.components = [input.components[0]!]
  input.bounds = { minX: 10, maxX: 20, minY: 10, maxY: 20 }
  input.disabledPackDirections = [...directions]
  const output = pack(input)
  expect(output.components[0]!.center).toEqual({ x: 11, y: 11 })
  expect(output.components[0]!.pads[0]!.absoluteCenter).toEqual({
    x: 11,
    y: 11,
  })
  const solver = new SingleComponentPackSolver({
    ...input,
    componentToPack: input.components[0]!,
    packedComponents: [],
  })
  solver.solve()
  expect(solver.getResult()).toEqual(output.components[0])
})

test("seed bounds account for rotated pad offsets and courtyards", () => {
  const input = makeInput()
  const seed = input.components[0]!
  input.components = [seed]
  seed.availableRotationDegrees = [90]
  seed.pads[0]!.offset = { x: 2, y: 0 }
  seed.pads[0]!.size = { x: 2, y: 1 }
  seed.courtyard = { width: 4, height: 2, offsetFromCenter: { x: 2, y: 0 } }
  input.bounds = { minX: 10, maxX: 12, minY: 10, maxY: 14 }
  input.disabledPackDirections = [...directions]
  const original = structuredClone(input)
  const result = pack(input).components[0]!
  expect(result.center.x).toBeCloseTo(11, 6)
  expect(result.center.y).toBeCloseTo(10, 6)
  expect(result.pads[0]!.absoluteCenter.y).toBeCloseTo(12, 6)
  expect(result.pads[0]!.size).toEqual({ x: 1, y: 2 })
  expect(input).toEqual(original)
})

test("a seed can use another allowed rotation to fit the bounds", () => {
  const input = makeInput()
  const seed = input.components[0]!
  input.components = [seed]
  seed.pads[0]!.size = { x: 4, y: 2 }
  seed.availableRotationDegrees = [0, 90]
  input.bounds = { minX: -1, maxX: 1, minY: -2, maxY: 2 }
  input.disabledPackDirections = [...directions]
  expect(pack(input).components[0]!.ccwRotationOffset).toBe(90)
})

test("an oversized restricted seed fails instead of violating bounds", () => {
  const input = makeInput()
  input.components = [input.components[0]!]
  input.bounds = { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5 }
  input.disabledPackDirections = [...directions]
  expect(() => pack(input)).toThrow("No valid candidates")
})

test("obstacle fallback cannot restore an out-of-bounds origin seed", () => {
  const input = makeInput()
  input.components = [input.components[0]!]
  input.bounds = { minX: 10, maxX: 12, minY: 10, maxY: 12 }
  input.obstacles = [
    {
      obstacleId: "blocker",
      absoluteCenter: { x: 11, y: 11 },
      width: 2,
      height: 2,
    },
  ]
  input.disabledPackDirections = only("right")
  expect(() => pack(input)).toThrow("No valid candidates")
})

test("seed placement satisfies bounds and the boundary outline together", () => {
  const input = makeInput()
  input.components = [input.components[0]!]
  input.bounds = { minX: 10, maxX: 20, minY: 10, maxY: 20 }
  input.boundaryOutline = [
    { x: 12, y: 12 },
    { x: 18, y: 12 },
    { x: 18, y: 18 },
    { x: 12, y: 18 },
  ]
  input.disabledPackDirections = [...directions]
  expect(pack(input).components[0]!.center).toEqual({ x: 15, y: 15 })
  input.boundaryOutline = [
    { x: -3, y: -3 },
    { x: 3, y: -3 },
    { x: 3, y: 3 },
    { x: -3, y: 3 },
  ]
  expect(() => pack(input)).toThrow("No valid candidates")
})

test("direction filtering still permits placement inside a free-space pocket", () => {
  const input = makeInput()
  const next = input.components[1]!
  input.components = [
    { id: "left-wall", x: -5, y: 0, width: 2, height: 12 },
    { id: "right-wall", x: 5, y: 0, width: 2, height: 12 },
    { id: "top-wall", x: 0, y: 5, width: 8, height: 2 },
    { id: "bottom-wall", x: 0, y: -5, width: 8, height: 2 },
  ].map(({ id, x, y, width, height }) => ({
    componentId: id,
    isStatic: true,
    center: { x, y },
    pads: [
      {
        padId: `${id}.1`,
        networkId: id === "left-wall" ? "GND" : "VCC",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: width, y: height },
      },
    ],
  }))
  input.components.push(next)
  input.minGap = 0.5
  input.disabledPackDirections = only("right")
  const output = pack(input)
  expect(output.components).toHaveLength(5)
  // The inner face of the left wall points right into the pocket.
  expect(output.components[4]!.center.x).toBeCloseTo(-3, 6)
  expect(output.components[4]!.center.y).toBeCloseTo(0, 6)
})

test("multiple placements continue along the permitted side", async () => {
  const input = makeInput()
  input.components.push(
    ...["third", "fourth"].map((componentId) => ({
      ...structuredClone(input.components[1]!),
      componentId,
      pads: input.components[1]!.pads.map((pad) => ({
        ...pad,
        padId: `${componentId}.1`,
      })),
    })),
  )
  input.disabledPackDirections = only("right")
  const output = pack(input)
  expect(output.components).toHaveLength(4)
  for (let i = 1; i < output.components.length; i++) {
    const previous = output.components[i - 1]!
    const current = output.components[i]!
    const clearance =
      current.center.x -
      current.pads[0]!.size.x / 2 -
      (previous.center.x + previous.pads[0]!.size.x / 2)
    expect(clearance).toBeCloseTo(input.minGap, 6)
    expect(current.center.y).toBeCloseTo(0, 6)
  }
  await expect(
    getSvgFromGraphicsObject(getGraphicsFromPackOutput(output), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path, "disabled-pack-directions-rightward")
})

test("direction limits use pad extents when a component center is offset", () => {
  const input = makeInput()
  input.components[1]!.pads[0]!.offset.y = 5
  input.disabledPackDirections = only("right")
  const output = pack(input)
  const next = output.components[1]!
  expect(next.center.x).toBeCloseTo(2.5, 6)
  expect(next.center.y).toBeCloseTo(-5, 6)
  expect(next.pads[0]!.absoluteCenter.y).toBeCloseTo(0, 6)
})

test("a rotated pad that exactly fits the permitted height can be placed", () => {
  const input = makeInput()
  input.components[1]!.pads[0]!.size = { x: 2, y: 1 }
  input.components[1]!.availableRotationDegrees = [90]
  input.disabledPackDirections = only("right")
  const next = pack(input).components[1]!
  expect(next.center.x).toBeCloseTo(2.5, 6)
  expect(next.center.y).toBeCloseTo(0, 6)
  expect(next.pads[0]!.size).toEqual({ x: 1, y: 2 })
})

test("a component cannot exceed the permitted height", () => {
  const input = makeInput()
  input.components[1]!.pads[0]!.size.y = 3
  input.disabledPackDirections = only("right")
  expect(() => pack(input)).toThrow("No valid candidates")
})
