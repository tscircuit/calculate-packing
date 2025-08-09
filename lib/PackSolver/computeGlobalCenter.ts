import type { PackedComponent } from "../types"
import type { Point } from "graphics-debug"

export function computeGlobalCenter(packedComponents: PackedComponent[]): Point {
  if (!packedComponents.length) return { x: 0, y: 0 }
  const sum = packedComponents.reduce(
    (acc, component) => ({ 
      x: acc.x + component.center.x, 
      y: acc.y + component.center.y 
    }),
    { x: 0, y: 0 },
  )
  return {
    x: sum.x / packedComponents.length,
    y: sum.y / packedComponents.length,
  }
}