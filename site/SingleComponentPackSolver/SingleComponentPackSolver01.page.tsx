import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { SingleComponentPackSolver } from "../../lib/SingleComponentPackSolver/SingleComponentPackSolver"
import params from "./SingleComponentPackSolver01_input.json"

export default () => {
  const solver = new SingleComponentPackSolver({
    componentToPack: params.componentToPack as any,
    packedComponents: params.packedComponents as any,
    packPlacementStrategy: params.packPlacementStrategy as any,
    minGap: params.minGap,
  })

  return <GenericSolverDebugger solver={solver} />
}
