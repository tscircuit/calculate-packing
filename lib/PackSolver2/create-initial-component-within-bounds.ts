import { getComponentBounds } from "../geometry/getComponentBounds"
import type { InputComponent, PackedComponent, PackInput } from "../types"
import { setPackedComponentPadCenters } from "./setPackedComponentPadCenters"

/** Keep a valid seed position; otherwise translate the full footprint into the bounds. */
export function createInitialComponentWithinBounds({
  component,
  position,
  rotations,
  bounds,
}: {
  component: InputComponent
  position: { x: number; y: number }
  rotations: number[]
  bounds: PackInput["bounds"]
}): PackedComponent | undefined {
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
    if (!bounds) return candidate

    const footprint = getComponentBounds(candidate)
    const minDx = bounds.minX - footprint.minX
    const maxDx = bounds.maxX - footprint.maxX
    const minDy = bounds.minY - footprint.minY
    const maxDy = bounds.maxY - footprint.maxY
    if (minDx > maxDx || minDy > maxDy) continue

    const dx = Math.max(minDx, Math.min(0, maxDx))
    const dy = Math.max(minDy, Math.min(0, maxDy))
    candidate.center.x += dx
    candidate.center.y += dy
    // Pad dimensions are already rotated. Translate centers without rotating them a second time.
    for (const pad of candidate.pads) {
      pad.absoluteCenter.x += dx
      pad.absoluteCenter.y += dy
    }
    return candidate
  }
}
