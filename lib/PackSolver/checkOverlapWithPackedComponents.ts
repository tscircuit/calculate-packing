import type { PackedComponent } from "../types"
import { computeDistanceBetweenBoxes } from "@tscircuit/math-utils"

export interface CheckOverlapWithPackedComponentsParams {
  component: PackedComponent
  packedComponents: PackedComponent[]
  minGap: number
}

export function checkOverlapWithPackedComponents({
  component,
  packedComponents,
  minGap,
}: CheckOverlapWithPackedComponentsParams): boolean {
  const allPackedPadBoxes = packedComponents.flatMap((c) =>
    c.pads.map((p) => ({
      center: { x: p.absoluteCenter.x, y: p.absoluteCenter.y },
      width: p.size.x,
      height: p.size.y,
    })),
  )
  const newComponentPadBoxes = component.pads.map((p) => ({
    center: { x: p.absoluteCenter.x, y: p.absoluteCenter.y },
    width: p.size.x,
    height: p.size.y,
  }))

  for (const newComponentPadBox of newComponentPadBoxes) {
    for (const packedPadBox of allPackedPadBoxes) {
      const { distance: boxDist } = computeDistanceBetweenBoxes(
        newComponentPadBox,
        packedPadBox,
      )
      if (boxDist < minGap) {
        return true
      }
    }
  }

  return false
}
