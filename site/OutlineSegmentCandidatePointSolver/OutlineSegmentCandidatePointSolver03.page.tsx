import type { Point } from "@tscircuit/math-utils"
import type { InputComponent, PackedComponent } from "../../lib/types"
import { OutlineSegmentCandidatePointDebugger } from "./OutlineSegmentCandidatePointDebugger"
import inputData from "./OutlineSegmentCandidatePointSolver03_input.json"

export default function OutlineSegmentCandidatePointSolver03Example() {
  const outlineSegment: [Point, Point] = [
    inputData.outlineSegment[0] as Point,
    inputData.outlineSegment[1] as Point,
  ]

  const ccwFullOutline: [Point, Point][] = inputData.ccwFullOutline.map(
    (segment) => [segment[0] as Point, segment[1] as Point] as [Point, Point],
  )

  const componentToPack: InputComponent =
    inputData.componentToPack as InputComponent

  const packedComponents: PackedComponent[] =
    inputData.packedComponents as PackedComponent[]

  return (
    <OutlineSegmentCandidatePointDebugger
      outlineSegment={outlineSegment}
      ccwFullOutline={ccwFullOutline}
      componentToPack={componentToPack}
      packedComponents={packedComponents}
      minGap={inputData.minGap}
    />
  )
}
