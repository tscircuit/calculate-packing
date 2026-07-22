import { expect, test } from "bun:test"
import { sortComponentQueue } from "../lib/PackSolver2/sortComponentQueue"
import type { InputComponent } from "../lib/types"

const makeComponent = (
  componentId: string,
  pads: Array<{ x: number; y: number; w: number; h: number }>,
): InputComponent => ({
  componentId,
  pads: pads.map((p, i) => ({
    padId: `${componentId}_pad${i}`,
    networkId: `${componentId}_net${i}`,
    type: "rect",
    offset: { x: p.x, y: p.y },
    size: { x: p.w, y: p.h },
  })),
})

test("largest_to_smallest sorts by pad count first", () => {
  const twoPads = makeComponent("A", [
    { x: -1, y: 0, w: 2, h: 4 },
    { x: 1, y: 0, w: 2, h: 4 },
  ])
  const fourPads = makeComponent("B", [
    { x: -1, y: -1, w: 2, h: 2 },
    { x: 1, y: -1, w: 2, h: 2 },
    { x: -1, y: 1, w: 2, h: 2 },
    { x: 1, y: 1, w: 2, h: 2 },
  ])

  const sorted = sortComponentQueue({
    components: [twoPads, fourPads],
    packOrderStrategy: "largest_to_smallest",
  })

  expect(sorted.map((c) => c.componentId)).toEqual(["B", "A"])
})

// A large single-pad module vs a small single-pad passive: with equal pad
// counts, physical footprint area breaks the tie (tscircuit/core#2272).
test("largest_to_smallest breaks pad-count ties by footprint area", () => {
  const module = makeComponent("U_RF", [{ x: 0, y: 0, w: 12, h: 12 }])
  const smallPad = makeComponent("TP1", [{ x: 0, y: 0, w: 0.6, h: 0.64 }])

  const sorted = sortComponentQueue({
    components: [smallPad, module],
    packOrderStrategy: "largest_to_smallest",
  })

  expect(sorted.map((c) => c.componentId)).toEqual(["U_RF", "TP1"])
})

test("packFirst still overrides size ordering", () => {
  const big = makeComponent("BIG", [{ x: 0, y: 0, w: 10, h: 10 }])
  const small = makeComponent("SMALL", [{ x: 0, y: 0, w: 1, h: 1 }])

  const sorted = sortComponentQueue({
    components: [big, small],
    packOrderStrategy: "largest_to_smallest",
    packFirst: ["SMALL"],
  })

  expect(sorted.map((c) => c.componentId)).toEqual(["SMALL", "BIG"])
})
