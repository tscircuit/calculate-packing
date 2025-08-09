import type { PackedComponent, PackInput } from "../types"
import type { Segment } from "../geometry/types"
import { findBestPointForDisconnected } from "./findBestPointForDisconnected"
import { placeComponentAtPoint } from "./placeComponentAtPoint"

export interface PlaceComponentDisconnectedParams {
  component: PackedComponent
  outlines: Segment[][]
  direction: NonNullable<PackInput["disconnectedPackDirection"]>
  packedComponents: PackedComponent[]
  candidateAngles: number[]
  checkOverlap: (comp: PackedComponent) => boolean
}

export function placeComponentDisconnected({
  component,
  outlines,
  direction,
  packedComponents,
  candidateAngles,
  checkOverlap
}: PlaceComponentDisconnectedParams): PackedComponent[] {
  const targetPoint = findBestPointForDisconnected({ outlines, direction, packedComponents })
  return placeComponentAtPoint({ component, point: targetPoint, candidateAngles, checkOverlap })
}