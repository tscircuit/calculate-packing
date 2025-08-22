import type { Point } from "@tscircuit/math-utils"
import type { InputComponent, PackedComponent } from "../../lib/types"
import { OutlineSegmentCandidatePointDebugger } from "./OutlineSegmentCandidatePointDebugger"

export default function OutlineSegmentCandidatePointSolverExample() {
  // Define a simple example scenario
  const outlineSegment: [Point, Point] = [
    { x: 500, y: 200 },
    { x: 500, y: 300 },
  ]

  // Define the full outline containing the segment
  const fullOutline: [Point, Point][] = [
    [
      { x: 100, y: 200 },
      { x: 500, y: 200 },
    ], // top edge (our segment)
    [
      { x: 500, y: 200 },
      { x: 500, y: 300 },
    ],
    [
      { x: 500, y: 300 },
      { x: 600, y: 300 },
    ],
    [
      { x: 600, y: 300 },
      { x: 600, y: 50 },
    ],
    [
      { x: 600, y: 50 },
      { x: 100, y: 50 },
    ], // bottomedge
    [
      { x: 100, y: 50 },
      { x: 100, y: 200 },
    ], // left edge
  ]

  const componentToPack: InputComponent = {
    componentId: "U2",
    pads: [
      {
        padId: "U2.1",
        networkId: "VCC",
        type: "rect",
        offset: { x: -10, y: 0 },
        size: { x: 4, y: 4 },
      },
      {
        padId: "U2.2",
        networkId: "GND",
        type: "rect",
        offset: { x: 10, y: 0 },
        size: { x: 4, y: 4 },
      },
      {
        padId: "U2_body",
        networkId: "U2-disconnected-body",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 25, y: 15 },
      },
    ],
  }

  const packedComponents: PackedComponent[] = [
    {
      componentId: "U1",
      center: { x: 150, y: 100 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "U1.1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -5, y: 0 },
          size: { x: 4, y: 4 },
          absoluteCenter: { x: 145, y: 100 },
        },
        {
          padId: "U1.2",
          networkId: "GND",
          type: "rect",
          offset: { x: 5, y: 0 },
          size: { x: 4, y: 4 },
          absoluteCenter: { x: 155, y: 100 },
        },
      ],
    },
    {
      componentId: "C1",
      center: { x: 400, y: 150 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "C1.1",
          networkId: "VCC",
          type: "rect",
          offset: { x: 0, y: -8 },
          size: { x: 4, y: 4 },
          absoluteCenter: { x: 400, y: 142 },
        },
        {
          padId: "C1.2",
          networkId: "GND",
          type: "rect",
          offset: { x: 0, y: 8 },
          size: { x: 4, y: 4 },
          absoluteCenter: { x: 400, y: 158 },
        },
      ],
    },
  ]

  return (
    <OutlineSegmentCandidatePointDebugger
      title="OutlineSegmentCandidatePointSolver Example"
      description="This example shows how the OutlineSegmentCandidatePointSolver finds the optimal position for a component on an outline segment. The solver uses the IRLS/Weiszfeld algorithm to minimize connection distances to existing components with shared networks."
      outlineSegment={outlineSegment}
      fullOutline={fullOutline}
      componentToPack={componentToPack}
      packedComponents={packedComponents}
      minGap={1}
    />
  )
}
