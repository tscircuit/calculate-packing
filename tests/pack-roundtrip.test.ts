import { expect, test } from "bun:test"
import { pack } from "../lib/pack"
import { convertPackOutputToPackInput } from "../lib/plumbing/convertPackOutputToPackInput"
import type { PackInput } from "../lib/types"

const getPackInput = (opts: {
  ccwRotationDegrees: number
  isStatic: boolean
}): PackInput => ({
  components: [
    {
      componentId: "U1",
      isStatic: opts.isStatic,
      availableRotationDegrees: [opts.ccwRotationDegrees],
      ...(opts.isStatic
        ? {
            center: { x: 12, y: -4 },
            ccwRotationOffset: opts.ccwRotationDegrees,
          }
        : {}),
      pads: [
        {
          padId: "U1_1",
          networkId: "GND",
          type: "rect",
          offset: { x: -2, y: 1 },
          size: { x: 1, y: 4 },
        },
        {
          padId: "U1_2",
          networkId: "VCC",
          type: "rect",
          offset: { x: 2, y: -1 },
          size: { x: 2, y: 3 },
        },
      ],
      courtyard: {
        offsetFromCenter: { x: 0.5, y: 0 },
        width: 8,
        height: 6,
      },
    },
  ],
  minGap: 0.25,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "shortest_connection_along_outline",
})

for (const isStatic of [false, true]) {
  test.each([0, 90, 180, 270, -90, 450])(
    `repacking a ${isStatic ? "static" : "movable"} component at %d degrees preserves pad geometry`,
    (ccwRotationDegrees) => {
      const input = getPackInput({ ccwRotationDegrees, isStatic })
      const packed = pack(input)
      const packedBeforeConversion = structuredClone(packed)
      const converted = convertPackOutputToPackInput(packed)

      expect(packed.components).toHaveLength(1)
      expect(converted.components[0]!.pads.map((pad) => pad.size)).toEqual(
        input.components[0]!.pads.map((pad) => pad.size),
      )
      expect(converted.components[0]!.pads.map((pad) => pad.offset)).toEqual(
        input.components[0]!.pads.map((pad) => pad.offset),
      )
      expect(converted.components[0]!.availableRotationDegrees).toEqual([
        ccwRotationDegrees,
      ])
      expect(converted.components[0]!.courtyard).toEqual(
        input.components[0]!.courtyard,
      )
      expect(packed).toEqual(packedBeforeConversion)

      const repacked = pack(converted)
      expect(repacked.components).toHaveLength(1)
      expect(repacked.components[0]!.pads).toEqual(packed.components[0]!.pads)
      expect(repacked.components[0]!.center).toEqual(
        packed.components[0]!.center,
      )
      expect(repacked.components[0]!.ccwRotationOffset).toBe(ccwRotationDegrees)
    },
  )
}
