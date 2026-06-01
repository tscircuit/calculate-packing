import { PackDebugger } from "../components/PackDebugger"
import { rp2350McuPackInput } from "../../tests/repros/rp2350-mcu-decoupling/packInput"

// Playground for the anchor RP2350A MCU subsystem PackInput - load it, swap
// solver/strategy, and inspect how the ~14 same-net decoupling caps pack.
export default () => {
  return (
    <PackDebugger
      initialPackInput={rp2350McuPackInput}
      title="RP2350A MCU decoupling (anchor board) - PackSolver2"
    />
  )
}
