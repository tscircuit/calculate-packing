import type { PackedComponent } from "../types"
import { computeDistanceBetweenBoxes } from "@tscircuit/math-utils"
import { getComponentCollisionBoxes } from "./getComponentCollisionBoxes"

export interface CheckOverlapWithPackedComponentsParams {
  component: PackedComponent
  packedComponents: PackedComponent[]
  minGap: number
}

export function checkOverlapWithPackedComponents({
  component,
  packedComponents,
  minGap,
}: CheckOverlapWithPackedComponentsParams): {
  hasOverlap: boolean
  gapDistance?: number
} {
  const allPackedBoxes = packedComponents.flatMap((c) =>
    getComponentCollisionBoxes(c),
  )
  const newComponentBoxes = getComponentCollisionBoxes(component)

  for (const newBox of newComponentBoxes) {
    for (const packedBox of allPackedBoxes) {
      const { distance: boxDist } = computeDistanceBetweenBoxes(
        newBox,
        packedBox,
      )
      if (boxDist + 1e-6 < minGap) {
        return {
          hasOverlap: true,
          gapDistance: boxDist,
        }
      }
    }
  }

  return {
    hasOverlap: false,
  }
}
