import type { PackedComponent, ComponentBodyBounds } from "../types"
import { transformComponentBodyBounds } from "./transformComponentBodyBounds"

export interface CheckOverlapWithPackedComponentsParams {
  component: PackedComponent
  packedComponents: PackedComponent[]
  minGap: number
}

interface RectBounds {
  left: number
  right: number
  bottom: number
  top: number
}

// Helper function to check rectangle overlap
function checkRectOverlap(
  rect1: ComponentBodyBounds | RectBounds,
  rect2: ComponentBodyBounds | RectBounds,
): boolean {
  const r1 =
    "minX" in rect1
      ? {
          left: rect1.minX,
          right: rect1.maxX,
          bottom: rect1.minY,
          top: rect1.maxY,
        }
      : rect1
  const r2 =
    "minX" in rect2
      ? {
          left: rect2.minX,
          right: rect2.maxX,
          bottom: rect2.minY,
          top: rect2.maxY,
        }
      : rect2

  return (
    r1.right >= r2.left &&
    r2.right >= r1.left &&
    r1.top >= r2.bottom &&
    r2.top >= r1.bottom
  )
}

// Helper function to create pad bounds
function getPadBounds(pad: {
  absoluteCenter: { x: number; y: number }
  size: { x: number; y: number }
}): RectBounds {
  return {
    left: pad.absoluteCenter.x - pad.size.x / 2,
    right: pad.absoluteCenter.x + pad.size.x / 2,
    bottom: pad.absoluteCenter.y - pad.size.y / 2,
    top: pad.absoluteCenter.y + pad.size.y / 2,
  }
}

export function checkOverlapWithPackedComponents({
  component,
  packedComponents,
  minGap,
}: CheckOverlapWithPackedComponentsParams): boolean {
  // Cache the transformed body bounds for the component being placed
  const comp1Body = component.bodyBounds
    ? transformComponentBodyBounds(component)
    : null

  // Check body bounds overlaps if available
  if (comp1Body) {
    for (const packedComponent of packedComponents) {
      // Cache the transformed body bounds for each packed component
      const comp2Body = packedComponent.bodyBounds
        ? transformComponentBodyBounds(packedComponent)
        : null

      if (comp2Body) {
        // Check for body-to-body rectangle overlap
        if (checkRectOverlap(comp1Body, comp2Body)) {
          return true // Component body overlap detected
        }

        // Check if body gap is sufficient (only if no overlap)
        const xOverlap =
          comp1Body.maxX >= comp2Body.minX && comp2Body.maxX >= comp1Body.minX
        const yOverlap =
          comp1Body.maxY >= comp2Body.minY && comp2Body.maxY >= comp1Body.minY

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
      for (const packedPad of packedComponent.pads) {
        if (checkRectOverlap(comp1Body, getPadBounds(packedPad))) {
          return true // Component body overlapping with pad
        }
      }

      // Check if the packed component's body overlaps with this component's pads
      if (comp2Body) {
        for (const componentPad of component.pads) {
          if (checkRectOverlap(comp2Body, getPadBounds(componentPad))) {
            return true // Packed component body overlapping with this component's pad
          }
        }
      }
    }
  }

  // Finally check pad-to-pad overlap as before
  for (const componentPad of component.pads) {
    const comp1Bounds = getPadBounds(componentPad)

    for (const packedComponent of packedComponents) {
      for (const packedPad of packedComponent.pads) {
        const comp2Bounds = getPadBounds(packedPad)

        // Check for rectangle overlap
        if (checkRectOverlap(comp1Bounds, comp2Bounds)) {
          return true // Pad overlap detected
        }

        // If no overlap, check if gap is sufficient
        const xOverlap =
          comp1Bounds.right >= comp2Bounds.left &&
          comp2Bounds.right >= comp1Bounds.left
        const yOverlap =
          comp1Bounds.top >= comp2Bounds.bottom &&
          comp2Bounds.top >= comp1Bounds.bottom

        if (!xOverlap || !yOverlap) {
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
