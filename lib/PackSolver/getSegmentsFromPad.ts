import type { PackedComponent } from "../types"
import type { Point } from "@tscircuit/math-utils"

type Segment = [Point, Point]

export const getSegmentsFromPad = (
  pad: PackedComponent["pads"][number],
  { padding = 0 }: { padding?: number } = {},
) => {
  const segments: Segment[] = []
  const { x, y } = pad.absoluteCenter
  const { x: w, y: h } = pad.size

  segments.push([
    { x: x - w / 2 - padding, y: y - h / 2 - padding },
    { x: x + w / 2 + padding, y: y - h / 2 - padding },
  ])
  segments.push([
    { x: x + w / 2 + padding, y: y - h / 2 - padding },
    { x: x + w / 2 + padding, y: y + h / 2 + padding },
  ])
  segments.push([
    { x: x + w / 2 + padding, y: y + h / 2 + padding },
    { x: x - w / 2 - padding, y: y + h / 2 + padding },
  ])
  segments.push([
    { x: x - w / 2 - padding, y: y + h / 2 + padding },
    { x: x - w / 2 - padding, y: y - h / 2 - padding },
  ])
  return segments
}
