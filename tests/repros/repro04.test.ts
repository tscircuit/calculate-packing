import { pack } from "lib/index"
import { test, expect } from "bun:test"

test("repro04", () => {
  const input = {
    components: [
      {
        componentId: "pcb_component_0",
        pads: [
          {
            padId: "pcb_plated_hole_0",
            networkId: "unnamedsubcircuit85_connectivity_net0",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: -2.25,
              y: 3.25,
            },
          },
          {
            padId: "pcb_plated_hole_1",
            networkId: "unnamedsubcircuit85_connectivity_net1",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: -2.25,
              y: -3.25,
            },
          },
          {
            padId: "pcb_plated_hole_2",
            networkId: "unnamed0",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: 2.25,
              y: -3.25,
            },
          },
          {
            padId: "pcb_plated_hole_3",
            networkId: "unnamed1",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: 2.25,
              y: 3.25,
            },
          },
          {
            padId: "pcb_component_0-inner",
            networkId: "pcb_component_0-inner",
            type: "rect",
            size: {
              x: 6.45,
              y: 8.45,
            },
            offset: {
              x: 0,
              y: 0,
            },
          },
        ],
      },
      {
        componentId: "pcb_component_1",
        pads: [
          {
            padId: "pcb_plated_hole_4",
            networkId: "unnamedsubcircuit85_connectivity_net0",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: -2.25,
              y: 3.25,
            },
          },
          {
            padId: "pcb_plated_hole_5",
            networkId: "unnamed2",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: -2.25,
              y: -3.25,
            },
          },
          {
            padId: "pcb_plated_hole_6",
            networkId: "unnamedsubcircuit85_connectivity_net2",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: 2.25,
              y: -3.25,
            },
          },
          {
            padId: "pcb_plated_hole_7",
            networkId: "unnamed3",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: 2.25,
              y: 3.25,
            },
          },
          {
            padId: "pcb_component_1-inner",
            networkId: "pcb_component_1-inner",
            type: "rect",
            size: {
              x: 6.45,
              y: 8.45,
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
            padId: "pcb_plated_hole_8",
            networkId: "unnamedsubcircuit85_connectivity_net0",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: -2.25,
              y: 3.25,
            },
          },
          {
            padId: "pcb_plated_hole_9",
            networkId: "unnamed4",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: -2.25,
              y: -3.25,
            },
          },
          {
            padId: "pcb_plated_hole_10",
            networkId: "unnamed5",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: 2.25,
              y: -3.25,
            },
          },
          {
            padId: "pcb_plated_hole_11",
            networkId: "unnamedsubcircuit85_connectivity_net3",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: 2.25,
              y: 3.25,
            },
          },
          {
            padId: "pcb_component_2-inner",
            networkId: "pcb_component_2-inner",
            type: "rect",
            size: {
              x: 6.45,
              y: 8.45,
            },
            offset: {
              x: 0,
              y: 0,
            },
          },
        ],
      },
      {
        componentId: "pcb_component_3",
        pads: [
          {
            padId: "pcb_plated_hole_12",
            networkId: "unnamed6",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: -2.25,
              y: 3.25,
            },
          },
          {
            padId: "pcb_plated_hole_13",
            networkId: "unnamedsubcircuit85_connectivity_net1",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: -2.25,
              y: -3.25,
            },
          },
          {
            padId: "pcb_plated_hole_14",
            networkId: "unnamedsubcircuit85_connectivity_net2",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: 2.25,
              y: -3.25,
            },
          },
          {
            padId: "pcb_plated_hole_15",
            networkId: "unnamed7",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: 2.25,
              y: 3.25,
            },
          },
          {
            padId: "pcb_component_3-inner",
            networkId: "pcb_component_3-inner",
            type: "rect",
            size: {
              x: 6.45,
              y: 8.45,
            },
            offset: {
              x: 0,
              y: 0,
            },
          },
        ],
      },
      {
        componentId: "pcb_component_4",
        pads: [
          {
            padId: "pcb_plated_hole_16",
            networkId: "unnamed8",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: -2.25,
              y: 3.25,
            },
          },
          {
            padId: "pcb_plated_hole_17",
            networkId: "unnamedsubcircuit85_connectivity_net1",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: -2.25,
              y: -3.25,
            },
          },
          {
            padId: "pcb_plated_hole_18",
            networkId: "unnamed9",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: 2.25,
              y: -3.25,
            },
          },
          {
            padId: "pcb_plated_hole_19",
            networkId: "unnamedsubcircuit85_connectivity_net3",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: 2.25,
              y: 3.25,
            },
          },
          {
            padId: "pcb_component_4-inner",
            networkId: "pcb_component_4-inner",
            type: "rect",
            size: {
              x: 6.45,
              y: 8.45,
            },
            offset: {
              x: 0,
              y: 0,
            },
          },
        ],
      },
      {
        componentId: "pcb_component_5",
        pads: [
          {
            padId: "pcb_plated_hole_20",
            networkId: "unnamed10",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: -2.25,
              y: 3.25,
            },
          },
          {
            padId: "pcb_plated_hole_21",
            networkId: "unnamed11",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: -2.25,
              y: -3.25,
            },
          },
          {
            padId: "pcb_plated_hole_22",
            networkId: "unnamedsubcircuit85_connectivity_net2",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: 2.25,
              y: -3.25,
            },
          },
          {
            padId: "pcb_plated_hole_23",
            networkId: "unnamedsubcircuit85_connectivity_net3",
            type: "rect",
            size: {
              x: 1.9500000000000002,
              y: 1.9500000000000002,
            },
            offset: {
              x: 2.25,
              y: 3.25,
            },
          },
          {
            padId: "pcb_component_5-inner",
            networkId: "pcb_component_5-inner",
            type: "rect",
            size: {
              x: 6.45,
              y: 8.45,
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
    orderStrategy: "largest_to_smallest",
    placementStrategy: "minimum_sum_squared_distance_to_network",
  }

  pack(input as any)
})
