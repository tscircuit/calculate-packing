import type { GraphicsObject, Rect } from "graphics-debug"
import type { PackOutput } from "../types"
import { getComponentBounds } from "../geometry/getComponentBounds"

export const getGraphicsFromPackOutput = (
  packOutput: PackOutput,
): GraphicsObject => {
  const rects: Rect[] = []

  for (const component of packOutput.components) {
    const bounds = getComponentBounds(component)
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY
    const rect: Rect = {
      center: { x: component.center.x, y: component.center.y },
      width,
      height,
      fill: "rgba(0,0,0,0.25)",
      label: component.componentId,
    }
    rects.push(rect)

    for (const pad of component.pads) {
      const { absoluteCenter, size, padId, networkId } = pad

      const padRect: Rect = {
        center: { x: absoluteCenter.x, y: absoluteCenter.y },
        width: size.x,
        height: size.y,
        label: `${padId} ${networkId}`,
        fill: "rgba(255,0,0,0.8)",
      }

      rects.push(padRect)
    }
  }

  return {
    coordinateSystem: "cartesian",
    rects,
  }
}
