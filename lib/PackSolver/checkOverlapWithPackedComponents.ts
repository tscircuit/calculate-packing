import type { PackedComponent } from "../types"

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
  // Use pad-to-pad distance checking for more accurate overlap detection
  for (const componentPad of component.pads) {
    for (const packedComponent of packedComponents) {
      for (const packedPad of packedComponent.pads) {
        // Calculate center-to-center distance
        const centerDistance = Math.hypot(
          componentPad.absoluteCenter.x - packedPad.absoluteCenter.x,
          componentPad.absoluteCenter.y - packedPad.absoluteCenter.y,
        )

        // Calculate minimum required center-to-center distance
        const componentPadRadius =
          Math.max(componentPad.size.x, componentPad.size.y) / 2
        const packedPadRadius = Math.max(packedPad.size.x, packedPad.size.y) / 2
        const minRequiredDistance =
          minGap + componentPadRadius + packedPadRadius

        if (centerDistance < minRequiredDistance) {
          return true // Overlap detected
        }
      }
    }
  }
  return false
}
