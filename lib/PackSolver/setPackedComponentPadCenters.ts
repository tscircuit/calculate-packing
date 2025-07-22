import type { PackedComponent } from "../types"

export const setPackedComponentPadCenters = (
  packedComponent: PackedComponent,
) => {
  packedComponent.pads = packedComponent.pads.map((pad) => ({
    ...pad,
    absoluteCenter: {
      x: packedComponent.center.x + pad.offset.x,
      y: packedComponent.center.y + pad.offset.y,
    },
  }))
}
