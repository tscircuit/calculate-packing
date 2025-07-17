import type { PackedComponent } from "../types"
import { rotatePoint } from "../math/rotatePoint"

export interface Bounds {
  minX: number; maxX: number; minY: number; maxY: number
}

/** Axis-aligned bounds of a component, expanded by `minGap`. */
export const getComponentBounds = (
  component: PackedComponent,
  minGap: number = 0,
): Bounds => {
  const bounds: Bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }

  component.pads.forEach((pad) => {
    const hw = pad.size.x / 2
    const hh = pad.size.y / 2
    const localCorners = [
      { x: pad.offset.x - hw, y: pad.offset.y - hh },
      { x: pad.offset.x + hw, y: pad.offset.y - hh },
      { x: pad.offset.x + hw, y: pad.offset.y + hh },
      { x: pad.offset.x - hw, y: pad.offset.y + hh },
    ]

    localCorners.forEach((corner) => {
      const world = rotatePoint(corner, component.ccwRotationOffset)
      const x = world.x + component.center.x
      const y = world.y + component.center.y
      bounds.minX = Math.min(bounds.minX, x)
      bounds.maxX = Math.max(bounds.maxX, x)
      bounds.minY = Math.min(bounds.minY, y)
      bounds.maxY = Math.max(bounds.maxY, y)
    })
  })

  return {
    minX: bounds.minX - minGap,
    maxX: bounds.maxX + minGap,
    minY: bounds.minY - minGap,
    maxY: bounds.maxY + minGap,
  }
}
