import type { InputComponent, PackedComponent } from "../types"
import { rotatePoint } from "../math/rotatePoint"
import type { Bounds } from "@tscircuit/math-utils"

export const getInputComponentBounds = (
  component: InputComponent,
  { rotationDegrees = 0 },
): Bounds => {
  const bounds: Bounds = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
  }

  for (const pad of component.pads) {
    const hw = pad.size.x / 2
    const hh = pad.size.y / 2
    const localCorners = [
      { x: pad.offset.x - hw, y: pad.offset.y - hh },
      { x: pad.offset.x + hw, y: pad.offset.y - hh },
      { x: pad.offset.x + hw, y: pad.offset.y + hh },
      { x: pad.offset.x - hw, y: pad.offset.y + hh },
    ]

    for (const corner of localCorners) {
      const world = rotatePoint(corner, (rotationDegrees * Math.PI) / 180) // Convert to radians for math
      const x = world.x
      const y = world.y
      bounds.minX = Math.min(bounds.minX, x)
      bounds.maxX = Math.max(bounds.maxX, x)
      bounds.minY = Math.min(bounds.minY, y)
      bounds.maxY = Math.max(bounds.maxY, y)
    }
  }

  return {
    minX: bounds.minX,
    maxX: bounds.maxX,
    minY: bounds.minY,
    maxY: bounds.maxY,
  }
}
