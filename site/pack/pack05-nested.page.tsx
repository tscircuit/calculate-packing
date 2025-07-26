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
              <resistor name="R1" resistance="1k" />
              <capacitor name="C1" capacitance="100nF" />
            </group>
            <resistor name="R2" resistance="2k" />
          </group>
          <resistor name="R3" resistance="3k" />
        </board>
      )
      `)

      const packOutput = convertCircuitJsonToPackOutput(circuitJson, {
        source_group_id: (
          circuitJson.find(
            (e) => e.type === "source_group" && e.name === "G2",
          )! as any
        ).source_group_id,
      })
      setManualPackOutput(packOutput)
    }
    run()
  }, [])

  return (
    <PackDebugger
      initialPackOutput={manualPackOutput as any}
      title="Pack05 - Nested Groups"
    />
  )
}
