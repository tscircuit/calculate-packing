import type { Bounds } from "@tscircuit/math-utils"
import type { PackedComponent } from "../types"
import { expandRotatedRectIntoBounds } from "./expandRotatedRectIntoBounds"

/** Axis-aligned bounds of a component, expanded by `minGap`. */
export const getComponentBounds = (
  component: PackedComponent,
  minGap = 0,
): Bounds => {
  const bounds: Bounds = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
  }

  const angleRad = (component.ccwRotationOffset * Math.PI) / 180

  for (const pad of component.pads) {
    expandRotatedRectIntoBounds({
      bounds,
      center: pad.offset,
      width: pad.size.x,
      height: pad.size.y,
      angleRad,
      translate: component.center,
    })
  }

  if (component.courtyard) {
    expandRotatedRectIntoBounds({
      bounds,
      center: component.courtyard.offsetFromCenter,
      width: component.courtyard.width,
      height: component.courtyard.height,
      angleRad,
      translate: component.center,
    })
  }

  return {
    minX: bounds.minX - minGap,
    maxX: bounds.maxX + minGap,
    minY: bounds.minY - minGap,
    maxY: bounds.maxY + minGap,
  }
}
