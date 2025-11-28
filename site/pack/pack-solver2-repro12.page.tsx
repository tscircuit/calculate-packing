import { PackDebugger } from "../components/PackDebugger"
import { packSolver2ReproInput } from "../../tests/repros/repro12/packInput"

export default function PackSolver2Repro12Page() {
  return (
    <div className="p-5 grid gap-4">
      <header>
        <h1 className="text-2xl font-bold">PackSolver2 Repro 12</h1>
        <p className="text-gray-600 mt-2 max-w-prose">
          Interactive view for the provided PackSolver2 regression input. Use
          the debugger controls below to inspect packing behavior and visualize
          the resulting placement.
        </p>
      </header>
      <PackDebugger
        initialPackInput={packSolver2ReproInput}
        title="PackSolver2 Repro 12"
      />
    </div>
  )
}
