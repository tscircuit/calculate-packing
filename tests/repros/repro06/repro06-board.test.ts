import { test, expect } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getGraphicsFromPackOutput } from "lib/testing/getGraphicsFromPackOutput"
import packInput from "./packInput-unnamed_board1.json"
import { pack } from "lib/pack"
import type { PackInput } from "lib/types"

test("repro06", async () => {
  const graphics = getGraphicsFromPackOutput(pack(packInput as PackInput))

  expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
