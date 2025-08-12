import type { GraphicsObject, Rect, Line } from "graphics-debug"
import { createColorMapFromStrings } from "./createColorMapFromStrings"
import type { PackOutput } from "../types"
import { getComponentBounds } from "../geometry/getComponentBounds"

export const getGraphicsFromPackOutput = (
  packOutput: PackOutput,
): GraphicsObject => {
  const rects: Rect[] = []
  const lines: Line[] = []

  const allNetworkIds = Array.from(
    new Set(
      packOutput.components.flatMap((c) => c.pads.map((p) => p.networkId)),
    ),
  )
  const colorMap = createColorMapFromStrings(allNetworkIds)

  for (const component of packOutput.components) {
    const bounds = getComponentBounds(component)
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY
    const rect: Rect = {
      center: { x: component.center.x, y: component.center.y },
      width,
      height,
      fill: "rgba(0,0,0,0.25)",
      label: [
        component.componentId,
        `ccwRotationOffsetDegrees: ${component.ccwRotationOffsetDegrees.toFixed(1)}°`,
      ].join("\n"),
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

  for (const netId of allNetworkIds) {
    const padsOnNet = packOutput.components.flatMap((c) =>
      c.pads.filter((p) => p.networkId === netId),
    )
    for (let i = 0; i < padsOnNet.length; i++) {
      for (let j = i + 1; j < padsOnNet.length; j++) {
        lines.push({
          points: [padsOnNet[i]!.absoluteCenter, padsOnNet[j]!.absoluteCenter],
          strokeColor: colorMap[netId],
        } as Line)
      }
    }
  }

  return {
    coordinateSystem: "cartesian",
    rects,
    lines,
  }
}
