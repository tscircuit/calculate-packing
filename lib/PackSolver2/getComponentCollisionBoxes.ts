import type { PackedComponent } from "../types"
import { rotatePoint } from "../math/rotatePoint"

export interface CollisionBox {
  center: { x: number; y: number }
  width: number
  height: number
}

const snapTrigMagnitude = (value: number) => {
  const absoluteValue = Math.abs(value)
  if (absoluteValue < 1e-12) return 0
  if (Math.abs(absoluteValue - 1) < 1e-12) return 1
  return absoluteValue
}

/**
 * Returns the collision boxes for a component. If the component has a
 * courtyard, returns a single courtyard-derived box (rotated + translated).
 * Otherwise, returns one box per pad (using absoluteCenter).
 */
export function getComponentCollisionBoxes(
  component: PackedComponent,
): CollisionBox[] {
  if (component.courtyard) {
    const courtyard = component.courtyard
    const angleRad = (component.ccwRotationOffset * Math.PI) / 180
    const rotatedOffset = rotatePoint(courtyard.offsetFromCenter, angleRad)

    const absCos = snapTrigMagnitude(Math.cos(angleRad))
    const absSin = snapTrigMagnitude(Math.sin(angleRad))
    const width = courtyard.width * absCos + courtyard.height * absSin
    const height = courtyard.width * absSin + courtyard.height * absCos

    return [
      {
        center: {
          x: component.center.x + rotatedOffset.x,
          y: component.center.y + rotatedOffset.y,
        },
        width,
        height,
      },
    ]
  }

  return component.pads.map((p) => ({
    center: { x: p.absoluteCenter.x, y: p.absoluteCenter.y },
    width: p.size.x,
    height: p.size.y,
  }))
}
