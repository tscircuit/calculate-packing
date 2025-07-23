import circuitJson from "../../tests/circuit-json-pack-conversion/circuit-json-pack-conversion01.json"
import { convertCircuitJsonToPackOutput } from "../../lib/testing/convertCircuitJsonToPackOutput"
import { PackDebugger } from "../components/PackDebugger"
import type { CircuitJson } from "circuit-json"

const packOutput = convertCircuitJsonToPackOutput(circuitJson as CircuitJson)
packOutput.minGap = 1

export default () => {
  return (
    <PackDebugger
      initialPackOutput={packOutput}
      title="Pack02 - Circuit JSON Pack Output"
    />
  )
}
