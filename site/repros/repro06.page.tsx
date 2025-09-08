import { GenericSolverDebugger } from "../components/GenericSolverDebugger"
import params from "./repro06.json"
import { useMemo } from "react"
import { PhasedPackSolver, type PackInput } from "lib/index"

export default () => {
  const solver = useMemo(
    () =>
      new PhasedPackSolver({
        components: params.components as any,
        minGap: params.minGap,
        packOrderStrategy: params.packOrderStrategy as any,
        packPlacementStrategy: params.packPlacementStrategy as any,
      }),
    [],
  )

  return (
    <GenericSolverDebugger
      solver={solver}
      title="SingleComponentPackSolver Debugger - Repro06"
    />
  )
}
