import type { Point } from "@tscircuit/math-utils"
import type { InputComponent, PackedComponent } from "../../lib/types"
import { OutlineSegmentCandidatePointDebugger } from "./OutlineSegmentCandidatePointDebugger"
import inputData from "./OutlineSegmentCandidatePointSolver05_input.json"

export default function OutlineSegmentCandidatePointSolver05Example() {
  return (
    <OutlineSegmentCandidatePointDebugger
      {...(inputData as any)}
      showViableBounds
    />
  )
}
