import type { PackedComponent, PackInput } from "../types"
import type { Point } from "graphics-debug"
import type { Segment } from "../geometry/types"
import { computeGlobalCenter } from "./computeGlobalCenter"

export interface FindBestPointForDisconnectedParams {
  outlines: Segment[][]
  direction: NonNullable<PackInput["disconnectedPackDirection"]>
  packedComponents: PackedComponent[]
}

export function findBestPointForDisconnected({ 
  outlines, 
  direction, 
  packedComponents 
}: FindBestPointForDisconnectedParams): Point {
  const points = outlines.flatMap((outline) =>
    outline.map(([p1, p2]) => ({
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    })),
  )
  if (!points.length) return { x: 0, y: 0 }

  if (direction !== "nearest_to_center") {
    const extreme = direction === "left" || direction === "down" ? Math.min : Math.max
    const key = direction === "left" || direction === "right" ? "x" : "y"
    const target = extreme(...points.map((p) => p[key]))
    return points.find((p) => p[key] === target)!
  }

  const center = computeGlobalCenter(packedComponents)
  return points.reduce((best, point) =>
    Math.hypot(point.x - center.x, point.y - center.y) <
    Math.hypot(best.x - center.x, best.y - center.y)
      ? point
      : best,
  )
}