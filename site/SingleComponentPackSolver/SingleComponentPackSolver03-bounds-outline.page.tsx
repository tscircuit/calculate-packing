import { GenericSolverDebugger } from "../components/GenericSolverDebugger"
import { SingleComponentPackSolver } from "../../lib/SingleComponentPackSolver/SingleComponentPackSolver"
import params from "./SingleComponentPackSolver03_input.json"

export default () => {
  const solver = new SingleComponentPackSolver({
    componentToPack: params.componentToPack as any,
    packedComponents: params.packedComponents as any,
    packPlacementStrategy: params.packPlacementStrategy as any,
    minGap: params.minGap,
    boundsOutline: params.boundsOutline,
  })

  return (
    <GenericSolverDebugger
      solver={solver}
      title="SingleComponentPackSolver03 - Bounds Outline"
    />
  )
}
