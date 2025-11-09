import {
  convertCircuitJsonToPackOutput,
  convertPackOutputToPackInput,
} from "lib/index"
import type { PackInput } from "lib/types"
import { PackDebugger } from "site/components/PackDebugger"
import circuitJson from "../../tests/repros/repro09/XiaoRP2040Board.circuit.circuit.json"

const packInput: PackInput = {
  ...convertPackOutputToPackInput(
    convertCircuitJsonToPackOutput(circuitJson as any, {
      shouldAddInnerObstacles: true,
      source_group_id: "source_group_0",
    }),
  ),
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  minGap: 1,
}

export default () => <PackDebugger initialPackInput={packInput} />
