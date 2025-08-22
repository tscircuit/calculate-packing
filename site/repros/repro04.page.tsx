import { PackDebugger } from "site/components/PackDebugger"
import input from "./repro04_packInput.json"

export default () => {
  return <PackDebugger initialPackInput={input as any} />
}
