import type { InputComponent, PackInput } from "../types"

export interface SortComponentQueueParams {
  components: InputComponent[]
  packOrderStrategy: PackInput["packOrderStrategy"]
  packFirst?: string[]
}

/**
 * Bounding-box area of a component's pads (at rotation 0). Pad count is a
 * poor proxy for size: a 12×12mm module with a handful of pads would sort
 * as "smaller" than an 0402 with two pads and get packed last, ending up
 * far from the pack origin (tscircuit/core#2272).
 */
const getComponentFootprintArea = (component: InputComponent): number => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const pad of component.pads) {
    minX = Math.min(minX, pad.offset.x - pad.size.x / 2)
    maxX = Math.max(maxX, pad.offset.x + pad.size.x / 2)
    minY = Math.min(minY, pad.offset.y - pad.size.y / 2)
    maxY = Math.max(maxY, pad.offset.y + pad.size.y / 2)
  }
  if (minX > maxX || minY > maxY) return 0
  return (maxX - minX) * (maxY - minY)
}

export function sortComponentQueue({
  components,
  packOrderStrategy,
  packFirst = [],
}: SortComponentQueueParams): InputComponent[] {
  // Create a map for quick lookup of packFirst priorities
  const packFirstMap = new Map<string, number>()
  packFirst.forEach((componentId, index) => {
    packFirstMap.set(componentId, index)
  })

  const areaMap = new Map<string, number>()
  for (const component of components) {
    areaMap.set(component.componentId, getComponentFootprintArea(component))
  }

  return [...components].sort((a, b) => {
    const aPackFirstIndex = packFirstMap.get(a.componentId)
    const bPackFirstIndex = packFirstMap.get(b.componentId)

    // If both components are in packFirst, sort by their order in packFirst
    if (aPackFirstIndex !== undefined && bPackFirstIndex !== undefined) {
      return aPackFirstIndex - bPackFirstIndex
    }

    // If only one component is in packFirst, it comes first
    if (aPackFirstIndex !== undefined) return -1
    if (bPackFirstIndex !== undefined) return 1

    // Neither component is in packFirst, use the regular strategy
    const aArea = areaMap.get(a.componentId)!
    const bArea = areaMap.get(b.componentId)!
    if (packOrderStrategy === "largest_to_smallest") {
      if (bArea !== aArea) return bArea - aArea
      return b.pads.length - a.pads.length
    }
    if (aArea !== bArea) return aArea - bArea
    return a.pads.length - b.pads.length
  })
}
