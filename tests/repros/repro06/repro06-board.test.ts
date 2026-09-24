import { test, expect } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import packInput from "./packInput-unnamed_board1.json"
import { PackSolver2 } from "lib/PackSolver2/PackSolver2"
import type { PackInput } from "lib/types"

test("repro06 board rejects a group larger than its bounds", async () => {
  // The first group's 15.97 x 23.575 footprint cannot fit the 17.78 x 17.78 board,
  // even after a quarter turn. Previously it was placed outside the board at (0, 0).
  const solver = new PackSolver2(packInput as PackInput)
  solver.solve()
  expect(solver.failed).toBe(true)
  expect(solver.solved).toBe(false)
  expect(solver.error).toBe(
    "Component source_group_0 does not fit within bounds",
  )
  expect(solver.packedComponents).toHaveLength(0)

  await expect(
    getSvgFromGraphicsObject(solver.visualize(), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
