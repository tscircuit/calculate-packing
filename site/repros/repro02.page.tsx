import { PackDebugger } from "../components/PackDebugger"
import packInput from "../../tests/repros/repro02/repro02-pack-input.json"

export default () => {
  return <PackDebugger initialPackInput={packInput as any} />
}
