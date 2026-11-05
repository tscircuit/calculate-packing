import type { PackedComponent } from "../types"
import { rotatePoint } from "../math/rotatePoint"

const UNROTATED_PAD_SIZE = Symbol.for("calculate-packing.unrotatedPadSize")

const snapTrigMagnitude = (value: number) => {
  const absoluteValue = Math.abs(value)
  if (absoluteValue < 1e-12) return 0
  if (Math.abs(absoluteValue - 1) < 1e-12) return 1
  return absoluteValue
}

export const setPackedComponentPadCenters = (
  packedComponent: PackedComponent,
) => {
  const angleRad = (packedComponent.ccwRotationOffset * Math.PI) / 180
  const absCos = snapTrigMagnitude(Math.cos(angleRad))
  const absSin = snapTrigMagnitude(Math.sin(angleRad))

  packedComponent.pads = packedComponent.pads.map((pad) => {
    const baseSize = (
      pad as unknown as Record<symbol, { x: number; y: number } | undefined>
    )[UNROTATED_PAD_SIZE] ?? {
      x: pad.size.x,
      y: pad.size.y,
    }

    /* rotate the local offset, then translate by component centre */
    const rotated = rotatePoint(pad.offset, angleRad)

    const nextPad = {
      ...pad,
      size: {
        x: baseSize.x * absCos + baseSize.y * absSin,
        y: baseSize.x * absSin + baseSize.y * absCos,
      },
      absoluteCenter: {
        x: packedComponent.center.x + rotated.x,
        y: packedComponent.center.y + rotated.y,
      },
    }

    Object.defineProperty(nextPad, UNROTATED_PAD_SIZE, {
      value: baseSize,
      enumerable: false,
      configurable: true,
    })

    return nextPad
  })
}
