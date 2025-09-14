import type { PackedComponent } from "../types"
import { rotatePoint } from "../math/rotatePoint"

export const setPackedComponentPadCenters = (
  packedComponent: PackedComponent,
) => {
  packedComponent.pads = packedComponent.pads.map((pad) => {
    /* rotate the local offset, then translate by component centre */
    const rotated = rotatePoint(
      pad.offset,
      (packedComponent.ccwRotationOffset * Math.PI) / 180,
    ) // Convert to radians for math

    /* rotate the pad dimensions based on component rotation */
    const normalizedRotation =
      ((packedComponent.ccwRotationOffset % 360) + 360) % 360
    const shouldSwapDimensions =
      normalizedRotation === 90 || normalizedRotation === 270

    return {
      ...pad,
      size: shouldSwapDimensions
        ? { x: pad.size.y, y: pad.size.x } // Swap width/height for 90°/270° rotations
        : pad.size, // Keep original dimensions for 0°/180° rotations
      absoluteCenter: {
        x: packedComponent.center.x + rotated.x,
        y: packedComponent.center.y + rotated.y,
      },
    }
  })
}
