import { useEffect, useState } from "react"
import {
  convertCircuitJsonToPackOutput,
  convertPackOutputToPackInput,
  type PackInput,
  type PackOutput,
} from "../../lib"
import { PackDebugger } from "../components/PackDebugger"
import { runTscircuitCode } from "tscircuit"

export default () => {
  const [manualPackOutput, setManualPackOutput] = useState<PackOutput | null>(
    null,
  )

  useEffect(() => {
    async function run() {
      const circuitJson = await runTscircuitCode(`
      export default () => (
        <board autoroutingDisabled>
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

      const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
        source_group_id: (
          circuitJson.find(
            (e) => e.type === "source_group" && e.name === "G1",
          )! as any
        ).source_group_id,
      })
      packOutput.minGap = 0.5
      setManualPackOutput(packOutput)
    }
    run()
  }, [])

  if (!manualPackOutput) {
    return <div>Loading...</div>
  }

  return (
    <PackDebugger
      initialPackOutput={manualPackOutput as any}
      title="Pack05 - Nested Groups"
    />
  )
}
