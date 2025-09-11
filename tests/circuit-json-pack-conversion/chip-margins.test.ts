import { test, expect } from "bun:test"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import { runTscircuitCode } from "tscircuit"

const margin = { left: 1, right: 2, top: 3, bottom: 4 }

test("applies chip margin to pad sizes", async () => {
  const circuitJson = await runTscircuitCode(`
    export default () => (
      <board routingDisabled>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </board>
    )
  `)

  const pcbComponentId = (circuitJson.find(
    (e: any) => e.type === "pcb_component",
  ) as any)!.pcb_component_id

  const base = convertCircuitJsonToPackOutput(circuitJson)
  const withMargin = convertCircuitJsonToPackOutput(circuitJson, {
    chipMarginsMap: { [pcbComponentId]: margin },
  })

  const basePad = base.components[0]!.pads[0]!
  const pad = withMargin.components[0]!.pads[0]!

  expect(pad.size.x).toBeCloseTo(basePad.size.x + margin.left + margin.right)
  expect(pad.size.y).toBeCloseTo(basePad.size.y + margin.top + margin.bottom)
  expect(pad.absoluteCenter.x - basePad.absoluteCenter.x).toBeCloseTo(
    (margin.right - margin.left) / 2,
  )
  expect(pad.absoluteCenter.y - basePad.absoluteCenter.y).toBeCloseTo(
    (margin.top - margin.bottom) / 2,
  )
})
