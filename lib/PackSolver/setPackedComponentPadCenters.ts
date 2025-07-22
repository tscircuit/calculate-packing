import type { PackedComponent } from "../types"
import { rotatePoint } from "../math/rotatePoint"

export const setPackedComponentPadCenters = (
  packedComponent: PackedComponent,
) => {
  packedComponent.pads = packedComponent.pads.map((pad) => ({
    ...pad,
    absoluteCenter: (() => {
      /* rotate the local offset, then translate by component centre */
      const rotated = rotatePoint(pad.offset, packedComponent.ccwRotationOffset)
      return {
        x: packedComponent.center.x + rotated.x,
        y: packedComponent.center.y + rotated.y,
      }
    })(),
  }))
}
