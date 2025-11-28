import type { PackInput } from "../../../lib/types"

export const packSolver2ReproInput: PackInput = {
  components: [
    {
      componentId: "pcb_component_1",
      pads: [
        {
          padId: "pcb_smtpad_8",
          networkId: "unnamed0",
          type: "rect",
          size: {
            x: 1.025,
            y: 1.4,
          },
          offset: {
            x: -0.9125,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_9",
          networkId: "unnamed1",
          type: "rect",
          size: {
            x: 1.025,
            y: 1.4,
          },
          offset: {
            x: 0.9125,
            y: 0,
          },
        },
        {
          padId: "pcb_component_1-inner",
          networkId: "pcb_component_1-inner",
          type: "rect",
          size: {
            x: 2.8499999999999996,
            y: 1.4,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
    },
    {
      componentId: "pcb_component_2",
      pads: [
        {
          padId: "pcb_smtpad_10",
          networkId: "unnamed2",
          type: "rect",
          size: {
            x: 0.8,
            y: 0.95,
          },
          offset: {
            x: -0.825,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_11",
          networkId: "unnamed3",
          type: "rect",
          size: {
            x: 0.8,
            y: 0.95,
          },
          offset: {
            x: 0.825,
            y: 0,
          },
        },
        {
          padId: "pcb_component_2-inner",
          networkId: "pcb_component_2-inner",
          type: "rect",
          size: {
            x: 2.45,
            y: 0.95,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
    },
  ],
  minGap: 1,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "shortest_connection_along_outline",
  obstacles: [
    {
      obstacleId: "pcb_smtpad_0",
      absoluteCenter: {
        x: -16.15,
        y: 1.905,
      },
      width: 1,
      height: 0.6,
    },
    {
      obstacleId: "pcb_smtpad_1",
      absoluteCenter: {
        x: -16.15,
        y: 0.635,
      },
      width: 1,
      height: 0.6,
    },
    {
      obstacleId: "pcb_smtpad_2",
      absoluteCenter: {
        x: -16.15,
        y: -0.635,
      },
      width: 1,
      height: 0.6,
    },
    {
      obstacleId: "pcb_smtpad_3",
      absoluteCenter: {
        x: -16.15,
        y: -1.905,
      },
      width: 1,
      height: 0.6,
    },
    {
      obstacleId: "pcb_smtpad_4",
      absoluteCenter: {
        x: -11.85,
        y: -1.905,
      },
      width: 1,
      height: 0.6,
    },
    {
      obstacleId: "pcb_smtpad_5",
      absoluteCenter: {
        x: -11.85,
        y: -0.635,
      },
      width: 1,
      height: 0.6,
    },
    {
      obstacleId: "pcb_smtpad_6",
      absoluteCenter: {
        x: -11.85,
        y: 0.635,
      },
      width: 1,
      height: 0.6,
    },
    {
      obstacleId: "pcb_smtpad_7",
      absoluteCenter: {
        x: -11.85,
        y: 1.905,
      },
      width: 1,
      height: 0.6,
    },
  ],
  bounds: {
    minX: -5,
    maxX: 5,
    minY: -5,
    maxY: 5,
  },
}
