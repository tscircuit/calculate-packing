import type { PackedComponent } from "../types"
import { transformComponentBodyBounds } from "./transformComponentBodyBounds"

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
  // Cache the transformed body bounds for the component being placed
  const comp1Body = component.bodyBounds ? transformComponentBodyBounds(component) : null

  // Check body bounds overlaps if available
  if (comp1Body) {
    for (const packedComponent of packedComponents) {
      // Cache the transformed body bounds for each packed component
      const comp2Body = packedComponent.bodyBounds ? transformComponentBodyBounds(packedComponent) : null
      
      if (comp2Body) {
        // Check for body-to-body rectangle overlap
        const xOverlap =
          comp1Body.maxX >= comp2Body.minX &&
          comp2Body.maxX >= comp1Body.minX
        const yOverlap =
          comp1Body.maxY >= comp2Body.minY &&
          comp2Body.maxY >= comp1Body.minY

        if (xOverlap && yOverlap) {
          return true // Component body overlap detected
        }

        // Check if body gap is sufficient
        if (!xOverlap || !yOverlap) {
          const xGap = xOverlap
            ? 0
            : Math.min(
                Math.abs(comp1Body.minX - comp2Body.maxX),
                Math.abs(comp2Body.minX - comp1Body.maxX),
              )
          const yGap = yOverlap
            ? 0
            : Math.min(
                Math.abs(comp1Body.minY - comp2Body.maxY),
                Math.abs(comp2Body.minY - comp1Body.maxY),
              )

          const actualGap = Math.max(xGap, yGap)
          if (actualGap < minGap) {
            return true // Insufficient body gap
          }
        }
      }

      // Check if this component's body overlaps with the packed component's pads
      if (packedComponent.pads.length > 0) {
        for (const packedPad of packedComponent.pads) {
          const padBounds = {
            left: packedPad.absoluteCenter.x - packedPad.size.x / 2,
            right: packedPad.absoluteCenter.x + packedPad.size.x / 2,
            bottom: packedPad.absoluteCenter.y - packedPad.size.y / 2,
            top: packedPad.absoluteCenter.y + packedPad.size.y / 2,
          }

          const xOverlap =
            comp1Body.maxX >= padBounds.left &&
            padBounds.right >= comp1Body.minX
          const yOverlap =
            comp1Body.maxY >= padBounds.bottom &&
            padBounds.top >= comp1Body.minY

          if (xOverlap && yOverlap) {
            return true // Component body overlapping with pad
          }
        }
      }

      // Check if the packed component's body overlaps with this component's pads
      if (comp2Body && component.pads.length > 0) {
        for (const componentPad of component.pads) {
          const padBounds = {
            left: componentPad.absoluteCenter.x - componentPad.size.x / 2,
            right: componentPad.absoluteCenter.x + componentPad.size.x / 2,
            bottom: componentPad.absoluteCenter.y - componentPad.size.y / 2,
            top: componentPad.absoluteCenter.y + componentPad.size.y / 2,
          }

          const xOverlap =
            comp2Body.maxX >= padBounds.left &&
            padBounds.right >= comp2Body.minX
          const yOverlap =
            comp2Body.maxY >= padBounds.bottom &&
            padBounds.top >= comp2Body.minY

          if (xOverlap && yOverlap) {
            return true // Packed component body overlapping with this component's pad
          }
        }
      }
    }
  }

  // Finally check pad-to-pad overlap as before
  for (const componentPad of component.pads) {
    for (const packedComponent of packedComponents) {
      for (const packedPad of packedComponent.pads) {
        // Calculate rectangle bounds
        const comp1Bounds = {
          left: componentPad.absoluteCenter.x - componentPad.size.x / 2,
          right: componentPad.absoluteCenter.x + componentPad.size.x / 2,
          bottom: componentPad.absoluteCenter.y - componentPad.size.y / 2,
          top: componentPad.absoluteCenter.y + componentPad.size.y / 2,
        }

        const comp2Bounds = {
          left: packedPad.absoluteCenter.x - packedPad.size.x / 2,
          right: packedPad.absoluteCenter.x + packedPad.size.x / 2,
          bottom: packedPad.absoluteCenter.y - packedPad.size.y / 2,
          top: packedPad.absoluteCenter.y + packedPad.size.y / 2,
        }

        // Check for rectangle overlap (rectangles overlap if they overlap in BOTH X and Y)
        // Use >= to catch edge-touching cases as overlaps
        const xOverlap =
          comp1Bounds.right >= comp2Bounds.left &&
          comp2Bounds.right >= comp1Bounds.left
        const yOverlap =
          comp1Bounds.top >= comp2Bounds.bottom &&
          comp2Bounds.top >= comp1Bounds.bottom

        if (xOverlap && yOverlap) {
          return true // Actual rectangle overlap detected
        }

        // If no overlap, check if gap is sufficient
        if (!xOverlap || !yOverlap) {
          // Calculate minimum gap in both dimensions
          const xGap = xOverlap
            ? 0
            : Math.min(
                Math.abs(comp1Bounds.left - comp2Bounds.right),
                Math.abs(comp2Bounds.left - comp1Bounds.right),
              )
          const yGap = yOverlap
            ? 0
            : Math.min(
                Math.abs(comp1Bounds.bottom - comp2Bounds.top),
                Math.abs(comp2Bounds.bottom - comp1Bounds.top),
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
