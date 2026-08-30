import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { stackSvgsHorizontally } from "stack-svgs"
import { runTscircuitCode } from "tscircuit"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import { convertPackOutputToPackInput } from "../../lib/plumbing/convertPackOutputToPackInput"
import { getGraphicsFromPackOutput } from "../../lib/testing/getGraphicsFromPackOutput"

/**
 * Reproduces the input shape used by core's layer-by-layer pcbPack adapter:
 * a top-side BGA has an authored position while bottom-side decoupling
 * capacitors remain movable. The adapter lists the BGA as static during the
 * bottom-layer solve so its pads guide network scoring without turning its
 * entire footprint into a rectangular keepout.
 */
test("static relative BGA guides bottom-side capacitor placement", async () => {
  const circuitJson = await runTscircuitCode(`
    export default () => (
      <board routingDisabled>
        <chip name="U1" footprint="bga16" pcbX={8} pcbY={3} />
        <capacitor
          name="C1"
          footprint="0402"
          capacitance="100nF"
          layer="bottom"
        />
        <capacitor
          name="C2"
          footprint="0402"
          capacitance="100nF"
          layer="bottom"
        />
        <trace from=".U1 > .pin1" to=".C1 > .pin1" />
        <trace from=".U1 > .pin2" to=".C1 > .pin2" />
        <trace from=".U1 > .pin15" to=".C2 > .pin1" />
        <trace from=".U1 > .pin16" to=".C2 > .pin2" />
      </board>
    )
  `)

  const fixedBga = circuitJson.find(
    (element) => element.type === "pcb_component",
  )
  if (!fixedBga || fixedBga.type !== "pcb_component") {
    throw new Error("Expected U1 to produce a pcb_component")
  }

  // Core assigns this mode to explicitly positioned PCB components.
  const circuitJsonWithPositionMode = circuitJson.map((element) =>
    element.type === "pcb_component" &&
    element.pcb_component_id === fixedBga.pcb_component_id
      ? { ...element, position_mode: "relative_to_group_anchor" as const }
      : element,
  )

  const convertedOutput = convertCircuitJsonToPackOutput(
    circuitJsonWithPositionMode as unknown as CircuitJson,
    {
      staticPcbComponentIds: [fixedBga.pcb_component_id],
    },
  )
  const solver = new PackSolver2({
    ...convertPackOutputToPackInput(convertedOutput),
    minGap: 0.15,
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  })

  solver.solve()

  expect(solver.failed).toBe(false)
  const packedBga = solver.packedComponents.find(
    ({ componentId }) => componentId === fixedBga.pcb_component_id,
  )
  expect(packedBga).toMatchObject({
    isStatic: true,
    center: { x: 8, y: 3 },
  })

  const packedCapacitors = solver.packedComponents.filter(
    ({ componentId }) => componentId !== fixedBga.pcb_component_id,
  )
  expect(packedCapacitors).toHaveLength(2)
  for (const capacitor of packedCapacitors) {
    expect(
      Math.hypot(capacitor.center.x - 8, capacitor.center.y - 3),
    ).toBeLessThan(2.1)
  }

  const beforePackingSvg = getSvgFromGraphicsObject(
    getGraphicsFromPackOutput(convertedOutput),
    { backgroundColor: "white" },
  )
  const afterPackingSvg = getSvgFromGraphicsObject(solver.visualize(), {
    backgroundColor: "white",
  })
  const comparisonSvg = stackSvgsHorizontally(
    [beforePackingSvg, afterPackingSvg],
    {
      gap: 16,
      targetSize: 600,
    },
  ).replaceAll(/unnamedsubcircuit\d+_connectivity_net/g, "connectivity_net")
  const snapshotSvg = await Bun.file(
    new URL(
      "./__snapshots__/static-relative-bga-bottom-caps.visual.snap.svg",
      import.meta.url,
    ),
  ).text()

  expect(comparisonSvg).toBe(snapshotSvg.trim())
})
