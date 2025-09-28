import { test, expect } from "bun:test"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import { runTscircuitCode } from "tscircuit"

test("circuit-json-pack-conversion02", async () => {
  const circuitJson = await runTscircuitCode(`
    export default () => (
        <board routingDisabled>
          <group name="G1">
            <group name="G2">
              <resistor name="R1" resistance="1k" footprint="0402" />
              <capacitor name="C1" capacitance="100nF" footprint="0402" />
            </group>
            <resistor name="R2" resistance="2k" footprint="0603" />
          </group>
          <resistor name="R3" resistance="3k" footprint="0805" />
        </board>
      )
  `)

  // @ts-expect-error remove after tscircuit is updated
  const packOutput = convertCircuitJsonToPackOutput(circuitJson)

  const graphics = getGraphicsFromPackOutput(packOutput)

  expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
