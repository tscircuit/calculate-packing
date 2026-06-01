import type { PackInput } from "../../../lib/types"

// Real-world reproduction: the RP2350A MCU subsystem of the tscircuit "anchor"
// board, captured as the exact PackInput @tscircuit/core hands the packer.
//
//   components (27, MOVABLE): ~14 per-VDD decoupling caps + crystal load caps +
//     RUN/USB/I2C resistors + status LEDs.
//   obstacles (12, KEEP-OUT): the pinned ICs/crystals incl. the RP2350A
//     (the ~8x8mm box at (0,9)) and the QSPI flash.
//
// What this reproduces (run PackSolver2 greedy on it): the keep-outs ARE
// respected (0 obstacle overlaps), but all ~14 decoupling caps pack into a
// tight CLUMP pulled toward the shared V3_3_DIG / GND net - they are not
// distributed one-per-pin. The pad model carries only networkId, so the solver
// has no cap<->pin link and treats the caps as interchangeable. (The caps were
// authored with DIRECT pin connections, but that flattens to the shared net.)
// This is the decoupling-placement problem; spreading caps onto their pins
// needs per-pin information to survive into the solver input.
export const rp2350McuPackInput: PackInput = {
  components: [
    {
      componentId: "pcb_component_1",
      pads: [
        {
          padId: "pcb_smtpad_61",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_62",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_1-inner",
          networkId: "pcb_component_1-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_2",
      pads: [
        {
          padId: "pcb_smtpad_63",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_64",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_2-inner",
          networkId: "pcb_component_2-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_3",
      pads: [
        {
          padId: "pcb_smtpad_65",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_66",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_3-inner",
          networkId: "pcb_component_3-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_4",
      pads: [
        {
          padId: "pcb_smtpad_67",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_68",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_4-inner",
          networkId: "pcb_component_4-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_5",
      pads: [
        {
          padId: "pcb_smtpad_69",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_70",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_5-inner",
          networkId: "pcb_component_5-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_6",
      pads: [
        {
          padId: "pcb_smtpad_71",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_72",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_6-inner",
          networkId: "pcb_component_6-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_7",
      pads: [
        {
          padId: "pcb_smtpad_73",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_74",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_7-inner",
          networkId: "pcb_component_7-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_8",
      pads: [
        {
          padId: "pcb_smtpad_75",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_76",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_8-inner",
          networkId: "pcb_component_8-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_9",
      pads: [
        {
          padId: "pcb_smtpad_77",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_78",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_9-inner",
          networkId: "pcb_component_9-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_10",
      pads: [
        {
          padId: "pcb_smtpad_79",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_80",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_10-inner",
          networkId: "pcb_component_10-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_11",
      pads: [
        {
          padId: "pcb_smtpad_81",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_82",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_11-inner",
          networkId: "pcb_component_11-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_12",
      pads: [
        {
          padId: "pcb_smtpad_83",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_84",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_12-inner",
          networkId: "pcb_component_12-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_13",
      pads: [
        {
          padId: "pcb_smtpad_85",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
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
          padId: "pcb_smtpad_86",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
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
          padId: "pcb_component_13-inner",
          networkId: "pcb_component_13-inner",
          type: "rect",
          size: {
            x: 2.45,
            y: 0.9499999999999993,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 2.96,
        height: 1.4600000000000009,
      },
    },
    {
      componentId: "pcb_component_15",
      pads: [
        {
          padId: "pcb_smtpad_95",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_96",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_15-inner",
          networkId: "pcb_component_15-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_17",
      pads: [
        {
          padId: "pcb_smtpad_101",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net8",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_102",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_17-inner",
          networkId: "pcb_component_17-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_18",
      pads: [
        {
          padId: "pcb_smtpad_103",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net9",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_104",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_18-inner",
          networkId: "pcb_component_18-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_20",
      pads: [
        {
          padId: "pcb_smtpad_107",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net10",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_108",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_20-inner",
          networkId: "pcb_component_20-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_21",
      pads: [
        {
          padId: "pcb_smtpad_109",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net11",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_110",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_21-inner",
          networkId: "pcb_component_21-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_22",
      pads: [
        {
          padId: "pcb_smtpad_111",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_112",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net12",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_22-inner",
          networkId: "pcb_component_22-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_23",
      pads: [
        {
          padId: "pcb_smtpad_113",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net12",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_114",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net1",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_23-inner",
          networkId: "pcb_component_23-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_24",
      pads: [
        {
          padId: "pcb_smtpad_115",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net32",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_116",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net35",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_24-inner",
          networkId: "pcb_component_24-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_25",
      pads: [
        {
          padId: "pcb_smtpad_117",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net31",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_118",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net36",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_25-inner",
          networkId: "pcb_component_25-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_26",
      pads: [
        {
          padId: "pcb_smtpad_119",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_120",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net25",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_26-inner",
          networkId: "pcb_component_26-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_27",
      pads: [
        {
          padId: "pcb_smtpad_121",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net0",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_122",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net26",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_27-inner",
          networkId: "pcb_component_27-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_28",
      pads: [
        {
          padId: "pcb_smtpad_123",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net28",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_124",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net37",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_28-inner",
          networkId: "pcb_component_28-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_30",
      pads: [
        {
          padId: "pcb_smtpad_127",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net29",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_128",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net38",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_30-inner",
          networkId: "pcb_component_30-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
    {
      componentId: "pcb_component_32",
      pads: [
        {
          padId: "pcb_smtpad_131",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net30",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_smtpad_132",
          networkId:
            "unnamedsubcircuitsubcircuit_source_group_5_connectivity_net39",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
        },
        {
          padId: "pcb_component_32-inner",
          networkId: "pcb_component_32-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.6400000000000006,
          },
          offset: {
            x: 0,
            y: 0,
          },
        },
      ],
      courtyard: {
        offsetFromCenter: {
          x: 0,
          y: 0,
        },
        width: 1.86,
        height: 0.9400000000000013,
      },
    },
  ],
  obstacles: [
    {
      obstacleId: "pcb_component_0",
      absoluteCenter: {
        x: 0,
        y: 9,
      },
      width: 8.0251046,
      height: 8.0248506,
    },
    {
      obstacleId: "pcb_component_16",
      absoluteCenter: {
        x: -8,
        y: 8,
      },
      width: 3.6001452,
      height: 2.9000196000000003,
    },
    {
      obstacleId: "pcb_component_19",
      absoluteCenter: {
        x: -8,
        y: 14,
      },
      width: 3.5001200000000017,
      height: 1.7999964000000013,
    },
    {
      obstacleId: "pcb_component_29",
      absoluteCenter: {
        x: 8,
        y: 5,
      },
      width: 2.45,
      height: 0.9499999999999993,
    },
    {
      obstacleId: "pcb_component_31",
      absoluteCenter: {
        x: 8,
        y: 8,
      },
      width: 2.45,
      height: 0.9499999999999993,
    },
    {
      obstacleId: "pcb_component_33",
      absoluteCenter: {
        x: 8,
        y: 11,
      },
      width: 2.45,
      height: 0.9499999999999993,
    },
    {
      obstacleId: "pcb_hole_0",
      absoluteCenter: {
        x: -10.5,
        y: 38,
      },
      width: 2.2,
      height: 2.2,
    },
    {
      obstacleId: "pcb_hole_1",
      absoluteCenter: {
        x: 10.5,
        y: 38,
      },
      width: 2.2,
      height: 2.2,
    },
    {
      obstacleId: "pcb_hole_2",
      absoluteCenter: {
        x: -10.5,
        y: -38,
      },
      width: 2.2,
      height: 2.2,
    },
    {
      obstacleId: "pcb_hole_3",
      absoluteCenter: {
        x: 10.5,
        y: -38,
      },
      width: 2.2,
      height: 2.2,
    },
    {
      obstacleId: "pcb_hole_4",
      absoluteCenter: {
        x: -8.14507445,
        y: -25.110115,
      },
      width: 0.700024,
      height: 0.700024,
    },
    {
      obstacleId: "pcb_hole_5",
      absoluteCenter: {
        x: -8.14507445,
        y: -30.890139,
      },
      width: 0.700024,
      height: 0.700024,
    },
  ],
  bounds: {
    minX: -12,
    maxX: 12,
    minY: -13,
    maxY: 13,
  },
  boundaryOutline: [
    {
      x: -11.5,
      y: -40,
    },
    {
      x: 11.5,
      y: -40,
    },
    {
      x: 11.59801714032956,
      y: -39.9951847266722,
    },
    {
      x: 11.695090322016128,
      y: -39.98078528040323,
    },
    {
      x: 11.790284677254462,
      y: -39.956940335732206,
    },
    {
      x: 11.88268343236509,
      y: -39.923879532511286,
    },
    {
      x: 11.971396736825998,
      y: -39.88192126434836,
    },
    {
      x: 12.055570233019603,
      y: -39.83146961230255,
    },
    {
      x: 12.134393284163645,
      y: -39.77301045336274,
    },
    {
      x: 12.207106781186548,
      y: -39.707106781186546,
    },
    {
      x: 12.273010453362737,
      y: -39.63439328416364,
    },
    {
      x: 12.331469612302545,
      y: -39.5555702330196,
    },
    {
      x: 12.381921264348355,
      y: -39.471396736825994,
    },
    {
      x: 12.423879532511286,
      y: -39.38268343236509,
    },
    {
      x: 12.45694033573221,
      y: -39.29028467725446,
    },
    {
      x: 12.48078528040323,
      y: -39.19509032201613,
    },
    {
      x: 12.495184726672196,
      y: -39.09801714032956,
    },
    {
      x: 12.5,
      y: -39,
    },
    {
      x: 12.5,
      y: 39,
    },
    {
      x: 12.495184726672196,
      y: 39.09801714032956,
    },
    {
      x: 12.48078528040323,
      y: 39.19509032201613,
    },
    {
      x: 12.45694033573221,
      y: 39.29028467725446,
    },
    {
      x: 12.423879532511286,
      y: 39.38268343236509,
    },
    {
      x: 12.381921264348355,
      y: 39.471396736825994,
    },
    {
      x: 12.331469612302545,
      y: 39.5555702330196,
    },
    {
      x: 12.273010453362737,
      y: 39.63439328416364,
    },
    {
      x: 12.207106781186548,
      y: 39.707106781186546,
    },
    {
      x: 12.134393284163645,
      y: 39.77301045336274,
    },
    {
      x: 12.055570233019603,
      y: 39.83146961230255,
    },
    {
      x: 11.971396736825998,
      y: 39.88192126434836,
    },
    {
      x: 11.88268343236509,
      y: 39.923879532511286,
    },
    {
      x: 11.790284677254462,
      y: 39.956940335732206,
    },
    {
      x: 11.695090322016128,
      y: 39.98078528040323,
    },
    {
      x: 11.59801714032956,
      y: 39.9951847266722,
    },
    {
      x: 11.5,
      y: 40,
    },
    {
      x: -11.5,
      y: 40,
    },
    {
      x: -11.59801714032956,
      y: 39.9951847266722,
    },
    {
      x: -11.695090322016128,
      y: 39.98078528040323,
    },
    {
      x: -11.790284677254462,
      y: 39.956940335732206,
    },
    {
      x: -11.88268343236509,
      y: 39.923879532511286,
    },
    {
      x: -11.971396736825998,
      y: 39.88192126434836,
    },
    {
      x: -12.055570233019601,
      y: 39.83146961230255,
    },
    {
      x: -12.134393284163645,
      y: 39.77301045336274,
    },
    {
      x: -12.207106781186548,
      y: 39.707106781186546,
    },
    {
      x: -12.273010453362737,
      y: 39.63439328416364,
    },
    {
      x: -12.331469612302545,
      y: 39.5555702330196,
    },
    {
      x: -12.381921264348355,
      y: 39.471396736825994,
    },
    {
      x: -12.423879532511286,
      y: 39.38268343236509,
    },
    {
      x: -12.45694033573221,
      y: 39.29028467725446,
    },
    {
      x: -12.48078528040323,
      y: 39.19509032201613,
    },
    {
      x: -12.495184726672196,
      y: 39.09801714032956,
    },
    {
      x: -12.5,
      y: 39,
    },
    {
      x: -12.5,
      y: -39,
    },
    {
      x: -12.495184726672196,
      y: -39.09801714032956,
    },
    {
      x: -12.48078528040323,
      y: -39.19509032201613,
    },
    {
      x: -12.45694033573221,
      y: -39.29028467725446,
    },
    {
      x: -12.423879532511286,
      y: -39.38268343236509,
    },
    {
      x: -12.381921264348355,
      y: -39.471396736825994,
    },
    {
      x: -12.331469612302545,
      y: -39.5555702330196,
    },
    {
      x: -12.273010453362737,
      y: -39.63439328416364,
    },
    {
      x: -12.207106781186548,
      y: -39.707106781186546,
    },
    {
      x: -12.134393284163647,
      y: -39.77301045336274,
    },
    {
      x: -12.055570233019601,
      y: -39.83146961230255,
    },
    {
      x: -11.971396736825998,
      y: -39.88192126434836,
    },
    {
      x: -11.88268343236509,
      y: -39.923879532511286,
    },
    {
      x: -11.790284677254462,
      y: -39.956940335732206,
    },
    {
      x: -11.695090322016128,
      y: -39.98078528040323,
    },
    {
      x: -11.59801714032956,
      y: -39.9951847266722,
    },
    {
      x: -11.5,
      y: -40,
    },
  ],
  minGap: 0.5,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "minimum_sum_squared_distance_to_network",
}
