import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { pack } from "../lib/pack"
import { getGraphicsFromPackOutput } from "../lib/testing/getGraphicsFromPackOutput"
import { courtyardClearancePackInput } from "./courtyard-clearance/packInput"
import { checkOverlapWithPackedComponents } from "../lib/PackSolver2/checkOverlapWithPackedComponents"

test("courtyard clearance - visual regression", () => {
  const output = pack(courtyardClearancePackInput)

  const u1 = output.components.find((c) => c.componentId === "U1")!
  const u2 = output.components.find((c) => c.componentId === "U2")!
  const overlap = checkOverlapWithPackedComponents({
    component: u2,
    packedComponents: [u1],
    minGap: courtyardClearancePackInput.minGap,
  })
  expect(overlap.hasOverlap).toBe(false)

  const graphics = getGraphicsFromPackOutput(output)

  expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
