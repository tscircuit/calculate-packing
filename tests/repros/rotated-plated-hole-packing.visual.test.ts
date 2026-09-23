import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { runTscircuitCode } from "tscircuit"
import { checkOverlapWithPackedComponents } from "../../lib/PackSolver2/checkOverlapWithPackedComponents"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import { convertPackOutputToPackInput } from "../../lib/plumbing/convertPackOutputToPackInput"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"

test("rotated plated-hole bounds keep packed component clear", async () => {
  const circuitJson = await runTscircuitCode(`
    export default () => (
      <board routingDisabled>
        <chip
          name="J1"
          pcbX={0}
          pcbY={0}
          pcbRotation={90}
          footprint={
            <footprint>
              <platedhole
                shape="pill"
                outerWidth="2mm"
                outerHeight="6mm"
                holeWidth="1mm"
                holeHeight="5mm"
                portHints={["pin1"]}
              />
            </footprint>
          }
        />
        <resistor name="R1" resistance="10k" footprint="0603" layer="bottom" />
        <trace from=".J1 > .pin1" to=".R1 > .pin1" />
      </board>
    )
  `)

  const fixedSourceComponent = circuitJson.find(
    (element) => element.type === "source_component" && element.name === "J1",
  )
  if (fixedSourceComponent?.type !== "source_component") {
    throw new Error("Expected J1 to produce a source_component")
  }
  const fixedPcbComponent = circuitJson.find(
    (element) =>
      element.type === "pcb_component" &&
      element.source_component_id === fixedSourceComponent?.source_component_id,
  )
  if (fixedPcbComponent?.type !== "pcb_component") {
    throw new Error("Expected J1 to produce a pcb_component")
  }

  const circuitJsonWithStaticPosition = circuitJson.map((element) => {
    if (element.type === "pcb_plated_hole") {
      // The core repro emits this rotation from J1's footprint transform. Set
      // it explicitly until this package's tscircuit dev dependency catches up.
      return { ...element, ccw_rotation: 90 }
    }
    if (
      element.type === "pcb_component" &&
      element.pcb_component_id === fixedPcbComponent.pcb_component_id
    ) {
      return { ...element, position_mode: "relative_to_group_anchor" as const }
    }
    return element
  })
  const convertedOutput = convertCircuitJsonToPackOutput(
    circuitJsonWithStaticPosition as CircuitJson,
    { staticPcbComponentIds: [fixedPcbComponent.pcb_component_id] },
  )
  const packInput = convertPackOutputToPackInput(convertedOutput)
  const minGap = 0.5
  const solver = new PackSolver2({
    ...packInput,
    components: packInput.components.map((component) =>
      component.componentId === fixedPcbComponent.pcb_component_id
        ? {
            ...component,
            // The extracted pad size is already a board-space AABB. Core uses
            // it as fixed cross-layer collision geometry without rotating it
            // again inside the layer-specific packing solve.
            ccwRotationOffset: 0,
          }
        : component,
    ),
    minGap,
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  })

  solver.solve()

  expect(solver.failed).toBe(false)
  const packedFixedComponent = solver.packedComponents.find(
    ({ componentId }) => componentId === fixedPcbComponent.pcb_component_id,
  )
  const packedResistor = solver.packedComponents.find(
    ({ componentId }) => componentId !== fixedPcbComponent.pcb_component_id,
  )
  expect(packedFixedComponent?.pads[0]?.size.x).toBeCloseTo(6)
  expect(packedFixedComponent?.pads[0]?.size.y).toBeCloseTo(2)
  expect(
    checkOverlapWithPackedComponents({
      component: packedResistor!,
      packedComponents: [packedFixedComponent!],
      minGap,
    }).hasOverlap,
  ).toBe(false)

  const graphics = getGraphicsFromPackOutput({
    ...packInput,
    components: solver.packedComponents,
  })
  graphics.texts = [
    {
      x: packedFixedComponent!.center.x,
      y: packedFixedComponent!.center.y,
      text: "J1 · 90° · 6 × 2 mm AABB",
      color: "white",
      fontSize: 0.22,
    },
    {
      x: packedResistor!.center.x,
      y: packedResistor!.center.y - 0.7,
      text: "R1 · packed clear",
      color: "#111827",
      fontSize: 0.18,
    },
  ]

  expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
