import { expect, spyOn, test } from "bun:test"
import { LargestRectOutsideOutlineFromPointSolver } from "../lib/LargestRectOutsideOutlineFromPointSolver"
import {
  OutlineSegmentCandidatePointSolver,
  type NetworkTargetPointMappings,
} from "../lib/OutlineSegmentCandidatePointSolver/OutlineSegmentCandidatePointSolver"
import type { InputComponent } from "../lib/types"

class CountingMappingCache extends Map<number, NetworkTargetPointMappings> {
  setCalls = 0

  override set(key: number, value: NetworkTargetPointMappings): this {
    this.setCalls++
    return super.set(key, value)
  }
}

test("caches network target mappings across segments for each rotation", () => {
  const componentToPack: InputComponent = {
    componentId: "component-to-pack",
    pads: [
      {
        padId: "pad-to-pack",
        networkId: "signal",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 2, y: 2 },
      },
    ],
  }
  const fullOutline: Array<
    [{ x: number; y: number }, { x: number; y: number }]
  > = [
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ],
    [
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ],
    [
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ],
    [
      { x: 0, y: 10 },
      { x: 0, y: 0 },
    ],
  ]
  const cache = new CountingMappingCache()

  const createSolver = (segmentIndex: number, rotation: number) =>
    new OutlineSegmentCandidatePointSolver({
      outlineSegment: fullOutline[segmentIndex]!,
      ccwFullOutline: fullOutline,
      componentRotationDegrees: rotation,
      packStrategy: "minimum_sum_distance_to_network",
      minGap: 1,
      packedComponents: [],
      componentToPack,
      networkTargetPointMappingsCache: cache,
    })

  const getLargestRectBoundsSpy = spyOn(
    LargestRectOutsideOutlineFromPointSolver.prototype,
    "getLargestRectBounds",
  ).mockReturnValue({ minX: -100, minY: -100, maxX: 100, maxY: 100 })

  try {
    createSolver(0, 0).setup()
    createSolver(1, 0).setup()

    expect(cache.size).toBe(1)
    expect(cache.setCalls).toBe(1)

    createSolver(2, 90).setup()

    expect(cache.size).toBe(2)
    expect(cache.setCalls).toBe(2)
  } finally {
    getLargestRectBoundsSpy.mockRestore()
  }
})
