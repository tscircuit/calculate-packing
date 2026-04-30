import type { PackInput } from "../../lib/types"

export const courtyardClearancePackInput: PackInput = {
  components: [
    {
      componentId: "U1",
      pads: [
        {
          padId: "U1_1",
          networkId: "SIG_A",
          type: "rect",
          offset: { x: -0.6, y: 0 },
          size: { x: 1, y: 1 },
        },
        {
          padId: "U1_2",
          networkId: "SIG_B",
          type: "rect",
          offset: { x: 0.6, y: 0 },
          size: { x: 1, y: 1 },
        },
      ],
      courtyard: {
        offsetFromCenter: { x: 0, y: 0 },
        width: 8,
        height: 4,
      },
    },
    {
      componentId: "U2",
      pads: [
        {
          padId: "U2_1",
          networkId: "SIG_A",
          type: "rect",
          offset: { x: 0.6, y: 0 },
          size: { x: 1, y: 1 },
        },
        {
          padId: "U2_2",
          networkId: "SIG_B",
          type: "rect",
          offset: { x: -0.6, y: 0 },
          size: { x: 1, y: 1 },
        },
      ],
      courtyard: {
        offsetFromCenter: { x: 0, y: 0 },
        width: 8,
        height: 4,
      },
    },
  ],
  minGap: 0.5,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "minimum_sum_squared_distance_to_network",
}
