import { computeDistanceBetweenBoxes } from "@tscircuit/math-utils"
import { getComponentBounds } from "../geometry/getComponentBounds"
import { getPolygonCentroid } from "../math/getPolygonCentroid"
import { isPointInPolygon } from "../math/isPointInPolygon"
import type { InputComponent, PackedComponent, PackInput } from "../types"
import { getComponentCollisionBoxes } from "./getComponentCollisionBoxes"
import { setPackedComponentPadCenters } from "./setPackedComponentPadCenters"

/** Use the usual seed position when valid, otherwise move it inside explicit bounds. */
export const getInitialPackedComponent = (
  component: InputComponent,
  {
    bounds,
    boundaryOutline,
    obstacles = [],
    minGap,
  }: Pick<PackInput, "bounds" | "boundaryOutline" | "obstacles" | "minGap">,
): PackedComponent | undefined => {
  const position =
    boundaryOutline && boundaryOutline.length >= 3
      ? getPolygonCentroid(boundaryOutline)
      : { x: 0, y: 0 }
  const firstRotation =
    component.ccwRotationOffset ?? component.availableRotationDegrees?.[0] ?? 0
  const rotations = bounds
    ? [
        ...new Set([
          firstRotation,
          ...(component.availableRotationDegrees ?? [0, 90, 180, 270]),
        ]),
      ]
    : [firstRotation]

  for (const rotation of rotations) {
    const candidate: PackedComponent = {
      ...component,
      center: { ...position },
      ccwRotationOffset: rotation,
      pads: component.pads.map((pad) => ({
        ...pad,
        absoluteCenter: { x: 0, y: 0 },
      })),
    }
    setPackedComponentPadCenters(candidate)

    if (bounds) {
      const extents = getComponentBounds(candidate)
      const minDx = bounds.minX - extents.minX
      const maxDx = bounds.maxX - extents.maxX
      const minDy = bounds.minY - extents.minY
      const maxDy = bounds.maxY - extents.maxY
      if (minDx > maxDx || minDy > maxDy) continue
      const dx = Math.max(minDx, Math.min(0, maxDx))
      const dy = Math.max(minDy, Math.min(0, maxDy))
      candidate.center = {
        x: candidate.center.x + dx,
        y: candidate.center.y + dy,
      }
      // Translate already-rotated pads; applying the rotation again would swap sizes twice.
      for (const pad of candidate.pads) {
        pad.absoluteCenter = {
          x: pad.absoluteCenter.x + dx,
          y: pad.absoluteCenter.y + dy,
        }
      }
    }

    if (boundaryOutline && boundaryOutline.length >= 3) {
      const extents = getComponentBounds(candidate)
      const points = [
        ...candidate.pads.map((pad) => pad.absoluteCenter),
        { x: extents.minX, y: extents.minY },
        { x: extents.minX, y: extents.maxY },
        { x: extents.maxX, y: extents.minY },
        { x: extents.maxX, y: extents.maxY },
      ]
      if (!points.every((point) => isPointInPolygon(point, boundaryOutline)))
        continue
    }

    const boxes = getComponentCollisionBoxes(candidate)
    const tooCloseToObstacles = obstacles.some((obstacle) =>
      boxes.some((box) => {
        const { distance } = computeDistanceBetweenBoxes(box, {
          center: obstacle.absoluteCenter,
          width: obstacle.width,
          height: obstacle.height,
        })
        return distance + 1e-6 < minGap
      }),
    )
    if (!tooCloseToObstacles) return candidate
  }
  return undefined
}
