import type { PackedComponent } from "../types"
import type { Point } from "graphics-debug"
import { rotatePoint } from "../math/rotatePoint"
import { setPackedComponentPadCenters } from "./setPackedComponentPadCenters"

export interface PlaceComponentAtPointParams {
  component: PackedComponent
  point: Point
  candidateAngles: number[]
  checkOverlap: (comp: PackedComponent) => boolean
}

export function placeComponentAtPoint({ 
  component, 
  point, 
  candidateAngles, 
  checkOverlap 
}: PlaceComponentAtPointParams): PackedComponent[] {
  const evaluatedPositionShadows: PackedComponent[] = []
  
  for (const angle of candidateAngles) {
    const pads = component.pads.map((pad) => {
      const rotatedOffset = rotatePoint(pad.offset, (angle * Math.PI) / 180)
      
      const normalizedRotation = ((angle % 360) + 360) % 360
      const shouldSwapDimensions = normalizedRotation === 90 || normalizedRotation === 270
      
      return { 
        ...pad, 
        size: shouldSwapDimensions 
          ? { x: pad.size.y, y: pad.size.x }
          : pad.size,
        absoluteCenter: { x: point.x + rotatedOffset.x, y: point.y + rotatedOffset.y } 
      }
    })
    
    const candidate: PackedComponent = {
      ...component,
      center: point,
      ccwRotationOffset: angle,
      pads,
    }
    
    evaluatedPositionShadows.push(candidate)
    if (!checkOverlap(candidate)) {
      Object.assign(component, candidate)
      setPackedComponentPadCenters(component)
      return evaluatedPositionShadows
    }
  }
  
  // Fallback: 0° rotation
  component.center = point
  component.ccwRotationOffset = 0
  setPackedComponentPadCenters(component)
  return evaluatedPositionShadows
}