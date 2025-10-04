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

  // Draw obstacles if present
  if (packOutput.obstacles && packOutput.obstacles.length > 0) {
    for (const obstacle of packOutput.obstacles) {
      rects.push({
        center: { x: obstacle.absoluteCenter.x, y: obstacle.absoluteCenter.y },
        width: obstacle.width,
        height: obstacle.height,
        fill: "rgba(0,0,0,0.1)",
        stroke: "#555",
        label: obstacle.obstacleId,
      })
    }
  }

  if (packOutput.boundsOutline && packOutput.boundsOutline.length >= 2) {
    const outlinePoints = [...packOutput.boundsOutline]
    if (
      packOutput.boundsOutline.length >= 3 &&
      (outlinePoints[0]!.x !== outlinePoints[outlinePoints.length - 1]!.x ||
        outlinePoints[0]!.y !== outlinePoints[outlinePoints.length - 1]!.y)
    ) {
      outlinePoints.push(outlinePoints[0]!)
    }

    lines.push({
      points: outlinePoints,
      strokeColor: "rgba(0,0,255,0.5)",
      strokeDash: "4 2",
    } as Line)
  }

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
        `ccwRotationOffset: ${component.ccwRotationOffset.toFixed(1)}°`,
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
