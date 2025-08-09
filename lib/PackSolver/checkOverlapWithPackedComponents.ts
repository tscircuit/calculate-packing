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
  // Use proper rectangle-to-rectangle collision detection
  for (const componentPad of component.pads) {
    for (const packedComponent of packedComponents) {
      for (const packedPad of packedComponent.pads) {
        // Calculate rectangle bounds
        const comp1Bounds = {
          left: componentPad.absoluteCenter.x - componentPad.size.x / 2,
          right: componentPad.absoluteCenter.x + componentPad.size.x / 2,
          bottom: componentPad.absoluteCenter.y - componentPad.size.y / 2,
          top: componentPad.absoluteCenter.y + componentPad.size.y / 2
        }

        const comp2Bounds = {
          left: packedPad.absoluteCenter.x - packedPad.size.x / 2,
          right: packedPad.absoluteCenter.x + packedPad.size.x / 2,
          bottom: packedPad.absoluteCenter.y - packedPad.size.y / 2,
          top: packedPad.absoluteCenter.y + packedPad.size.y / 2
        }

        // Check for rectangle overlap (rectangles overlap if they overlap in BOTH X and Y)
        const xOverlap = comp1Bounds.right > comp2Bounds.left && comp2Bounds.right > comp1Bounds.left
        const yOverlap = comp1Bounds.top > comp2Bounds.bottom && comp2Bounds.top > comp1Bounds.bottom

        if (xOverlap && yOverlap) {
          return true // Actual rectangle overlap detected
        }

        // If no overlap, check if gap is sufficient
        if (!xOverlap || !yOverlap) {
          // Calculate minimum gap in both dimensions
          const xGap = xOverlap ? 0 : Math.min(
            Math.abs(comp1Bounds.left - comp2Bounds.right),
            Math.abs(comp2Bounds.left - comp1Bounds.right)
          )
          const yGap = yOverlap ? 0 : Math.min(
            Math.abs(comp1Bounds.bottom - comp2Bounds.top),
            Math.abs(comp2Bounds.bottom - comp1Bounds.top)
          )
          
          // The actual gap is the minimum of the non-overlapping dimensions
          const actualGap = Math.max(xGap, yGap)
          if (actualGap < minGap) {
            return true // Insufficient gap
          }
        }
      }
    }
  }
  return false
}
