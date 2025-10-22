import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { pack } from "lib/pack"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import packInput from "../../tests/repros/repro08/repro8.json"
import type { PackInput } from "lib/types"

test("repro08", () => {
  const graphics = getGraphicsFromPackOutput(pack(packInput as PackInput))

  expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
