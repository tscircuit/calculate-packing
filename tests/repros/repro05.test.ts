import { test, expect } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import { packInput } from "site/obstacle-packing/obstacle-packing01.page"
import { pack } from "lib/pack"

test("repro05", async () => {
  const graphics = getGraphicsFromPackOutput(pack(packInput))

  expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
