import { PackDebugger } from "../components/PackDebugger"
import packInput from "./repro06_packInput.json"
import type { PackInput } from "../../lib/types"

export default function Repro06Page() {
  return (
    <PackDebugger
      initialPackInput={packInput as PackInput}
      title="Pack Debugger - Repro06"
    />
  )
}
