import type { InputComponent } from "../types"
import type { Bounds } from "@tscircuit/math-utils"
import { expandRotatedRectIntoBounds } from "./expandRotatedRectIntoBounds"

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

  const angleRad = (rotationDegrees * Math.PI) / 180

  for (const pad of component.pads) {
    expandRotatedRectIntoBounds({
      bounds,
      center: pad.offset,
      width: pad.size.x,
      height: pad.size.y,
      angleRad,
    })
  }

  if (component.courtyard) {
    expandRotatedRectIntoBounds({
      bounds,
      center: component.courtyard.offsetFromCenter,
      width: component.courtyard.width,
      height: component.courtyard.height,
      angleRad,
    })
  }

  return bounds
}
