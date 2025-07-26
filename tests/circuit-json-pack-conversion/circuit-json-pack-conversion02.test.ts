import { test, expect } from "bun:test"
import circuitJson from "./circuit-json-pack-conversion01.json"
import { convertCircuitJsonToPackOutput } from "../../lib/testing/convertCircuitJsonToPackOutput"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"
import type { CircuitJson } from "circuit-json"
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
  const packOutput = convertCircuitJsonToPackOutput(circuitJson)

  expect(packOutput).toMatchInlineSnapshot(`
    {
      "components": [
        {
          "ccwRotationOffset": 0,
          "center": {
            "x": 0,
            "y": 0,
          },
          "componentId": "pcb_component_0",
          "pads": [
            {
              "absoluteCenter": {
                "x": -0.5,
                "y": 0,
              },
              "networkId": "unnamed0",
              "offset": {
                "x": -0.5,
                "y": 0,
              },
              "padId": "pcb_smtpad_0",
              "size": {
                "x": 0.6,
                "y": 0.6,
              },
              "type": "rect",
            },
            {
              "absoluteCenter": {
                "x": 0.5,
                "y": 0,
              },
              "networkId": "unnamed1",
              "offset": {
                "x": 0.5,
                "y": 0,
              },
              "padId": "pcb_smtpad_1",
              "size": {
                "x": 0.6,
                "y": 0.6,
              },
              "type": "rect",
            },
          ],
        },
        {
          "ccwRotationOffset": 0,
          "center": {
            "x": 0,
            "y": 0,
          },
          "componentId": "pcb_component_1",
          "pads": [
            {
              "absoluteCenter": {
                "x": -0.5,
                "y": 0,
              },
              "networkId": "unnamed2",
              "offset": {
                "x": -0.5,
                "y": 0,
              },
              "padId": "pcb_smtpad_2",
              "size": {
                "x": 0.6,
                "y": 0.6,
              },
              "type": "rect",
            },
            {
              "absoluteCenter": {
                "x": 0.5,
                "y": 0,
              },
              "networkId": "unnamed3",
              "offset": {
                "x": 0.5,
                "y": 0,
              },
              "padId": "pcb_smtpad_3",
              "size": {
                "x": 0.6,
                "y": 0.6,
              },
              "type": "rect",
            },
          ],
        },
        {
          "ccwRotationOffset": 0,
          "center": {
            "x": 0,
            "y": 0,
          },
          "componentId": "pcb_component_2",
          "pads": [
            {
              "absoluteCenter": {
                "x": -0.85,
                "y": 0,
              },
              "networkId": "unnamed4",
              "offset": {
                "x": -0.85,
                "y": 0,
              },
              "padId": "pcb_smtpad_4",
              "size": {
                "x": 1.1,
                "y": 1,
              },
              "type": "rect",
            },
            {
              "absoluteCenter": {
                "x": 0.85,
                "y": 0,
              },
              "networkId": "unnamed5",
              "offset": {
                "x": 0.85,
                "y": 0,
              },
              "padId": "pcb_smtpad_5",
              "size": {
                "x": 1.1,
                "y": 1,
              },
              "type": "rect",
            },
          ],
        },
        {
          "ccwRotationOffset": 0,
          "center": {
            "x": 0,
            "y": 0,
          },
          "componentId": "pcb_component_3",
          "pads": [
            {
              "absoluteCenter": {
                "x": -1.075,
                "y": 0,
              },
              "networkId": "unnamed6",
              "offset": {
                "x": -1.075,
                "y": 0,
              },
              "padId": "pcb_smtpad_6",
              "size": {
                "x": 0.85,
                "y": 1.2,
              },
              "type": "rect",
            },
            {
              "absoluteCenter": {
                "x": 1.075,
                "y": 0,
              },
              "networkId": "unnamed7",
              "offset": {
                "x": 1.075,
                "y": 0,
              },
              "padId": "pcb_smtpad_7",
              "size": {
                "x": 0.85,
                "y": 1.2,
              },
              "type": "rect",
            },
          ],
        },
      ],
      "minGap": 0,
      "packOrderStrategy": "largest_to_smallest",
      "packPlacementStrategy": "shortest_connection_along_outline",
    }
  `)

  const graphics = getGraphicsFromPackOutput(packOutput)

  expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
