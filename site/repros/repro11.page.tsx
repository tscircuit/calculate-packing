import { useMemo } from "react"
import { SingleComponentPackSolver } from "lib/SingleComponentPackSolver/SingleComponentPackSolver"
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"

export const inputProblem = {
  packPlacementStrategy: "minimum_sum_squared_distance_to_network" as const,
  minGap: 0.4,
  packedComponents: [
    {
      componentId: "pcb_component_32",
      pads: [
        {
          padId: "pcb_smtpad_56",
          networkId: "unnamed56",
          type: "rect",
          size: {
            x: 0.3599941999998464,
            y: 0.3000247999999601,
          },
          offset: {
            x: -0.40596820000007483,
            y: -0.3244849999999815,
          },
          absoluteCenter: {
            x: -6.454037600000079,
            y: -9.820023800000019,
          },
        },
        {
          padId: "pcb_smtpad_57",
          networkId: "unnamed57",
          type: "rect",
          size: {
            x: 0.35999420000018745,
            y: 0.3000248000000738,
          },
          offset: {
            x: -0.40591740000007803,
            y: 0.3255264000000011,
          },
          absoluteCenter: {
            x: -6.453986800000083,
            y: -9.170012400000036,
          },
        },
        {
          padId: "pcb_smtpad_58",
          networkId: "unnamed58",
          type: "rect",
          size: {
            x: 0.3599941999999601,
            y: 0.3000247999999601,
          },
          offset: {
            x: 0.405968200000018,
            y: 0.32453579999992144,
          },
          absoluteCenter: {
            x: -5.642101199999987,
            y: -9.171003000000116,
          },
        },
        {
          padId: "pcb_smtpad_59",
          networkId: "unnamed59",
          type: "rect",
          size: {
            x: 0.3599941999999601,
            y: 0.3000248000000738,
          },
          offset: {
            x: 0.405968200000018,
            y: -0.3255264000000011,
          },
          absoluteCenter: {
            x: -5.642101199999987,
            y: -9.821065200000039,
          },
        },
        {
          padId: "pcb_smtpad_60",
          networkId: "unnamed60",
          type: "rect",
          size: {
            x: 0.48000919999999997,
            y: 0.48000919999999997,
          },
          offset: {
            x: 0.0020701000000826753,
            y: 0.0005587999998510895,
          },
          absoluteCenter: {
            x: -6.045999299999922,
            y: -9.494980000000186,
          },
        },
        {
          padId: "pcb_component_32-inner",
          networkId: "pcb_component_32-inner",
          type: "rect",
          size: {
            x: 1.171930599999996,
            y: 0.951077600000076,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: -6.048069400000005,
            y: -9.495538800000038,
          },
        },
      ],
      center: {
        x: -6.048069400000005,
        y: -9.495538800000038,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_28",
      pads: [
        {
          padId: "pcb_smtpad_46",
          networkId: "unnamed46",
          type: "rect",
          size: {
            x: 0.9999979999999999,
            y: 0.5999987999999999,
          },
          offset: {
            x: 1.0500359999999205,
            y: -0.6499860000000695,
          },
          absoluteCenter: {
            x: -2.4620331000001654,
            y: -8.884454499999997,
          },
        },
        {
          padId: "pcb_smtpad_47",
          networkId: "unnamed47",
          type: "rect",
          size: {
            x: 0.9999979999999999,
            y: 0.5999987999999999,
          },
          offset: {
            x: 1.0500359999999205,
            y: 0.6499860000000695,
          },
          absoluteCenter: {
            x: -2.4620331000001654,
            y: -7.584482499999858,
          },
        },
        {
          padId: "pcb_smtpad_48",
          networkId: "unnamed48",
          type: "rect",
          size: {
            x: 0.9999979999999999,
            y: 0.5999987999999999,
          },
          offset: {
            x: -1.0500359999999205,
            y: 0.6499860000000695,
          },
          absoluteCenter: {
            x: -4.562105100000006,
            y: -7.584482499999858,
          },
        },
        {
          padId: "pcb_smtpad_49",
          networkId: "unnamed49",
          type: "rect",
          size: {
            x: 0.9999979999999999,
            y: 0.5999987999999999,
          },
          offset: {
            x: -1.0500359999999205,
            y: -0.6499860000000695,
          },
          absoluteCenter: {
            x: -4.562105100000006,
            y: -8.884454499999997,
          },
        },
        {
          padId: "pcb_component_28-inner",
          networkId: "pcb_component_28-inner",
          type: "rect",
          size: {
            x: 3.1000699999998407,
            y: 1.8999708000001387,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: -3.512069100000086,
            y: -8.234468499999927,
          },
        },
      ],
      center: {
        x: -3.512069100000086,
        y: -8.234468499999927,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_29",
      pads: [
        {
          padId: "pcb_smtpad_50",
          networkId: "unnamed50",
          type: "rect",
          size: {
            x: 0.3640074,
            y: 0.6869937999999999,
          },
          offset: {
            x: 0.3249930000000063,
            y: 0.518414000000007,
          },
          absoluteCenter: {
            x: -0.7300444000001529,
            y: -8.256600949999989,
          },
        },
        {
          padId: "pcb_smtpad_51",
          networkId: "unnamed51",
          type: "rect",
          size: {
            x: 0.3640074,
            y: 0.6869937999999999,
          },
          offset: {
            x: -0.3249930000000063,
            y: 0.518414000000007,
          },
          absoluteCenter: {
            x: -1.3800304000001655,
            y: -8.256600949999989,
          },
        },
        {
          padId: "pcb_smtpad_52",
          networkId: "unnamed52",
          type: "rect",
          size: {
            x: 0.3640074,
            y: 0.6869937999999999,
          },
          offset: {
            x: -0.3249930000000063,
            y: -0.518414000000007,
          },
          absoluteCenter: {
            x: -1.3800304000001655,
            y: -9.293428950000003,
          },
        },
        {
          padId: "pcb_smtpad_53",
          networkId: "unnamed53",
          type: "rect",
          size: {
            x: 0.3640074,
            y: 0.6869937999999999,
          },
          offset: {
            x: 0.3249930000000063,
            y: -0.518414000000007,
          },
          absoluteCenter: {
            x: -0.7300444000001529,
            y: -9.293428950000003,
          },
        },
        {
          padId: "pcb_component_29-inner",
          networkId: "pcb_component_29-inner",
          type: "rect",
          size: {
            x: 1.0139934000000126,
            y: 1.7238218000000138,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: -1.0550374000001592,
            y: -8.775014949999996,
          },
        },
      ],
      center: {
        x: -1.0550374000001592,
        y: -8.775014949999996,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_1",
      pads: [
        {
          padId: "pcb_smtpad_0",
          networkId: "unnamed0",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -4.832104100000006,
            y: -10.067226949999998,
          },
        },
        {
          padId: "pcb_smtpad_1",
          networkId: "unnamed1",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -4.172104100000006,
            y: -10.067226949999998,
          },
        },
        {
          padId: "pcb_component_1-inner",
          networkId: "pcb_component_1-inner",
          type: "rect",
          size: {
            x: 1.12,
            y: 0.4,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: -4.502104100000006,
            y: -10.067226949999998,
          },
        },
      ],
      center: {
        x: -4.502104100000006,
        y: -10.067226949999998,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_2",
      pads: [
        {
          padId: "pcb_smtpad_2",
          networkId: "unnamed2",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -2.8520341000001657,
            y: -10.067226949999998,
          },
        },
        {
          padId: "pcb_smtpad_3",
          networkId: "unnamed3",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -2.1920341000001655,
            y: -10.067226949999998,
          },
        },
        {
          padId: "pcb_component_2-inner",
          networkId: "pcb_component_2-inner",
          type: "rect",
          size: {
            x: 1.12,
            y: 0.4,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: -2.5220341000001656,
            y: -10.067226949999998,
          },
        },
      ],
      center: {
        x: -2.5220341000001656,
        y: -10.067226949999998,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_3",
      pads: [
        {
          padId: "pcb_smtpad_4",
          networkId: "unnamed4",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 0.08195929999984713,
            y: -8.775014949999996,
          },
        },
        {
          padId: "pcb_smtpad_5",
          networkId: "unnamed5",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 0.7419592999998472,
            y: -8.775014949999996,
          },
        },
        {
          padId: "pcb_component_3-inner",
          networkId: "pcb_component_3-inner",
          type: "rect",
          size: {
            x: 1.12,
            y: 0.4,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: 0.41195929999984715,
            y: -8.775014949999996,
          },
        },
      ],
      center: {
        x: 0.41195929999984715,
        y: -8.775014949999996,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_4",
      pads: [
        {
          padId: "pcb_smtpad_6",
          networkId: "unnamed6",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 0.08195929999984713,
            y: -9.962507474999999,
          },
        },
        {
          padId: "pcb_smtpad_7",
          networkId: "unnamed7",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 0.7419592999998472,
            y: -9.962507474999999,
          },
        },
        {
          padId: "pcb_component_4-inner",
          networkId: "pcb_component_4-inner",
          type: "rect",
          size: {
            x: 1.12,
            y: 0.4,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: 0.41195929999984715,
            y: -9.962507474999999,
          },
        },
      ],
      center: {
        x: 0.41195929999984715,
        y: -9.962507474999999,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_5",
      pads: [
        {
          padId: "pcb_smtpad_8",
          networkId: "unnamed8",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 1.601959299999847,
            y: -9.785,
          },
        },
        {
          padId: "pcb_smtpad_9",
          networkId: "unnamed9",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 2.2619592999998472,
            y: -9.785,
          },
        },
        {
          padId: "pcb_component_5-inner",
          networkId: "pcb_component_5-inner",
          type: "rect",
          size: {
            x: 1.12,
            y: 0.4,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: 1.9319592999998472,
            y: -9.785,
          },
        },
      ],
      center: {
        x: 1.9319592999998472,
        y: -9.785,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_6",
      pads: [
        {
          padId: "pcb_smtpad_10",
          networkId: "unnamed10",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 3.121959299999847,
            y: -9.785,
          },
        },
        {
          padId: "pcb_smtpad_11",
          networkId: "unnamed11",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 3.7819592999998473,
            y: -9.785,
          },
        },
        {
          padId: "pcb_component_6-inner",
          networkId: "pcb_component_6-inner",
          type: "rect",
          size: {
            x: 1.12,
            y: 0.4,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: 3.451959299999847,
            y: -9.785,
          },
        },
      ],
      center: {
        x: 3.451959299999847,
        y: -9.785,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_7",
      pads: [
        {
          padId: "pcb_smtpad_12",
          networkId: "unnamed12",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 4.641959299999847,
            y: -9.785,
          },
        },
        {
          padId: "pcb_smtpad_13",
          networkId: "unnamed13",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 5.301959299999847,
            y: -9.785,
          },
        },
        {
          padId: "pcb_component_7-inner",
          networkId: "pcb_component_7-inner",
          type: "rect",
          size: {
            x: 1.12,
            y: 0.4,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: 4.971959299999847,
            y: -9.785,
          },
        },
      ],
      center: {
        x: 4.971959299999847,
        y: -9.785,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_8",
      pads: [
        {
          padId: "pcb_smtpad_14",
          networkId: "unnamed14",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
          absoluteCenter: {
            x: 6.201959299999848,
            y: -9.785,
          },
        },
        {
          padId: "pcb_smtpad_15",
          networkId: "unnamed15",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
          absoluteCenter: {
            x: 7.221959299999847,
            y: -9.785,
          },
        },
        {
          padId: "pcb_component_8-inner",
          networkId: "pcb_component_8-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.64,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: 6.711959299999847,
            y: -9.785,
          },
        },
      ],
      center: {
        x: 6.711959299999847,
        y: -9.785,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_9",
      pads: [
        {
          padId: "pcb_smtpad_16",
          networkId: "unnamed16",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
          absoluteCenter: {
            x: 4.241959299999848,
            y: -8.865,
          },
        },
        {
          padId: "pcb_smtpad_17",
          networkId: "unnamed17",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
          absoluteCenter: {
            x: 5.261959299999847,
            y: -8.865,
          },
        },
        {
          padId: "pcb_component_9-inner",
          networkId: "pcb_component_9-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.64,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: 4.7519592999998475,
            y: -8.865,
          },
        },
      ],
      center: {
        x: 4.7519592999998475,
        y: -8.865,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_10",
      pads: [
        {
          padId: "pcb_smtpad_18",
          networkId: "unnamed18",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 3.1709796499999228,
            y: -7.944999999999999,
          },
        },
        {
          padId: "pcb_smtpad_19",
          networkId: "unnamed19",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 3.830979649999923,
            y: -7.944999999999999,
          },
        },
        {
          padId: "pcb_component_10-inner",
          networkId: "pcb_component_10-inner",
          type: "rect",
          size: {
            x: 1.12,
            y: 0.4,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: 3.500979649999923,
            y: -7.944999999999999,
          },
        },
      ],
      center: {
        x: 3.500979649999923,
        y: -7.944999999999999,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_11",
      pads: [
        {
          padId: "pcb_smtpad_20",
          networkId: "unnamed20",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 4.690979649999923,
            y: -7.572514949999995,
          },
        },
        {
          padId: "pcb_smtpad_21",
          networkId: "unnamed21",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 5.350979649999923,
            y: -7.572514949999995,
          },
        },
        {
          padId: "pcb_component_11-inner",
          networkId: "pcb_component_11-inner",
          type: "rect",
          size: {
            x: 1.12,
            y: 0.4,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: 5.020979649999923,
            y: -7.572514949999995,
          },
        },
      ],
      center: {
        x: 5.020979649999923,
        y: -7.572514949999995,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_12",
      pads: [
        {
          padId: "pcb_smtpad_22",
          networkId: "unnamed22",
          type: "rect",
          size: {
            x: 0.4,
            y: 0.46,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 5.789999999999999,
            y: 5.945014950000052,
          },
        },
        {
          padId: "pcb_smtpad_23",
          networkId: "unnamed23",
          type: "rect",
          size: {
            x: 0.4,
            y: 0.46,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 5.789999999999999,
            y: 6.605014950000053,
          },
        },
        {
          padId: "pcb_component_12-inner",
          networkId: "pcb_component_12-inner",
          type: "rect",
          size: {
            x: 0.4,
            y: 1.12,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: 5.789999999999999,
            y: 6.2750149500000525,
          },
        },
      ],
      center: {
        x: 5.789999999999999,
        y: 6.2750149500000525,
      },
      ccwRotationOffset: 90,
    },
    {
      componentId: "pcb_component_17",
      pads: [
        {
          padId: "pcb_smtpad_24",
          networkId: "unnamed24",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: -0.51,
            y: 0,
          },
          absoluteCenter: {
            x: 6.597555399999996,
            y: 9.34,
          },
        },
        {
          padId: "pcb_smtpad_25",
          networkId: "unnamed25",
          type: "rect",
          size: {
            x: 0.54,
            y: 0.64,
          },
          offset: {
            x: 0.51,
            y: 0,
          },
          absoluteCenter: {
            x: 7.617555399999995,
            y: 9.34,
          },
        },
        {
          padId: "pcb_component_17-inner",
          networkId: "pcb_component_17-inner",
          type: "rect",
          size: {
            x: 1.56,
            y: 0.64,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: 7.107555399999995,
            y: 9.34,
          },
        },
      ],
      center: {
        x: 7.107555399999995,
        y: 9.34,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_18",
      pads: [
        {
          padId: "pcb_smtpad_26",
          networkId: "unnamed26",
          type: "rect",
          size: {
            x: 0.4,
            y: 0.46,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 5.837555399999995,
            y: 7.76,
          },
        },
        {
          padId: "pcb_smtpad_27",
          networkId: "unnamed27",
          type: "rect",
          size: {
            x: 0.4,
            y: 0.46,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: 5.837555399999995,
            y: 8.42,
          },
        },
        {
          padId: "pcb_component_18-inner",
          networkId: "pcb_component_18-inner",
          type: "rect",
          size: {
            x: 0.4,
            y: 1.12,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: 5.837555399999995,
            y: 8.09,
          },
        },
      ],
      center: {
        x: 5.837555399999995,
        y: 8.09,
      },
      ccwRotationOffset: 90,
    },
    {
      componentId: "pcb_component_19",
      pads: [
        {
          padId: "pcb_smtpad_28",
          networkId: "unnamed28",
          type: "rect",
          size: {
            x: 0.4,
            y: 0.46,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -5.885110799999991,
            y: 2.128871975000137,
          },
        },
        {
          padId: "pcb_smtpad_29",
          networkId: "unnamed29",
          type: "rect",
          size: {
            x: 0.4,
            y: 0.46,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -5.885110799999991,
            y: 2.788871975000137,
          },
        },
        {
          padId: "pcb_component_19-inner",
          networkId: "pcb_component_19-inner",
          type: "rect",
          size: {
            x: 0.4,
            y: 1.12,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: -5.885110799999991,
            y: 2.458871975000137,
          },
        },
      ],
      center: {
        x: -5.885110799999991,
        y: 2.458871975000137,
      },
      ccwRotationOffset: 90,
    },
    {
      componentId: "pcb_component_20",
      pads: [
        {
          padId: "pcb_smtpad_30",
          networkId: "unnamed30",
          type: "rect",
          size: {
            x: 0.4,
            y: 0.46,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -5.885110799999991,
            y: 6.639435987500068,
          },
        },
        {
          padId: "pcb_smtpad_31",
          networkId: "unnamed31",
          type: "rect",
          size: {
            x: 0.4,
            y: 0.46,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -5.885110799999991,
            y: 7.299435987500068,
          },
        },
        {
          padId: "pcb_component_20-inner",
          networkId: "pcb_component_20-inner",
          type: "rect",
          size: {
            x: 0.4,
            y: 1.12,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: -5.885110799999991,
            y: 6.969435987500068,
          },
        },
      ],
      center: {
        x: -5.885110799999991,
        y: 6.969435987500068,
      },
      ccwRotationOffset: 90,
    },
    {
      componentId: "pcb_component_21",
      pads: [
        {
          padId: "pcb_smtpad_32",
          networkId: "unnamed32",
          type: "rect",
          size: {
            x: 0.4,
            y: 0.46,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -5.885110799999991,
            y: 8.894717993750033,
          },
        },
        {
          padId: "pcb_smtpad_33",
          networkId: "unnamed33",
          type: "rect",
          size: {
            x: 0.4,
            y: 0.46,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -5.885110799999991,
            y: 9.554717993750034,
          },
        },
        {
          padId: "pcb_component_21-inner",
          networkId: "pcb_component_21-inner",
          type: "rect",
          size: {
            x: 0.4,
            y: 1.12,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: -5.885110799999991,
            y: 9.224717993750033,
          },
        },
      ],
      center: {
        x: -5.885110799999991,
        y: 9.224717993750033,
      },
      ccwRotationOffset: 90,
    },
    {
      componentId: "pcb_component_22",
      pads: [
        {
          padId: "pcb_smtpad_34",
          networkId: "unnamed34",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -7.455110799999991,
            y: 10.024717993750032,
          },
        },
        {
          padId: "pcb_smtpad_35",
          networkId: "unnamed35",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -6.795110799999991,
            y: 10.024717993750032,
          },
        },
        {
          padId: "pcb_component_22-inner",
          networkId: "pcb_component_22-inner",
          type: "rect",
          size: {
            x: 1.12,
            y: 0.4,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: -7.125110799999991,
            y: 10.024717993750032,
          },
        },
      ],
      center: {
        x: -7.125110799999991,
        y: 10.024717993750032,
      },
      ccwRotationOffset: 0,
    },
    {
      componentId: "pcb_component_23",
      pads: [
        {
          padId: "pcb_smtpad_36",
          networkId: "unnamed36",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: -0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -7.9240347000000035,
            y: -9.785,
          },
        },
        {
          padId: "pcb_smtpad_37",
          networkId: "unnamed37",
          type: "rect",
          size: {
            x: 0.46,
            y: 0.4,
          },
          offset: {
            x: 0.33,
            y: 0,
          },
          absoluteCenter: {
            x: -7.264034700000003,
            y: -9.785,
          },
        },
        {
          padId: "pcb_component_23-inner",
          networkId: "pcb_component_23-inner",
          type: "rect",
          size: {
            x: 1.12,
            y: 0.4,
          },
          offset: {
            x: 0,
            y: 0,
          },
          absoluteCenter: {
            x: -7.5940347000000035,
            y: -9.785,
          },
        },
      ],
      center: {
        x: -7.5940347000000035,
        y: -9.785,
      },
      ccwRotationOffset: 0,
    },
  ],
  componentToPack: {
    componentId: "pcb_component_24",
    pads: [
      {
        padId: "pcb_smtpad_38",
        networkId: "unnamed38",
        type: "rect",
        size: {
          x: 0.46,
          y: 0.4,
        },
        offset: {
          x: -0.33,
          y: 0,
        },
      },
      {
        padId: "pcb_smtpad_39",
        networkId: "unnamed39",
        type: "rect",
        size: {
          x: 0.46,
          y: 0.4,
        },
        offset: {
          x: 0.33,
          y: 0,
        },
      },
      {
        padId: "pcb_component_24-inner",
        networkId: "pcb_component_24-inner",
        type: "rect",
        size: {
          x: 1.12,
          y: 0.4,
        },
        offset: {
          x: 0,
          y: 0,
        },
      },
    ],
  },
  obstacles: [
    {
      obstacleId: "pcb_component_33",
      absoluteCenter: {
        x: 2,
        y: -2.499999999999943,
      },
      width: 8.200313800000021,
      height: 8.200059800000094,
    },
    {
      obstacleId: "pcb_component_34",
      absoluteCenter: {
        x: 0,
        y: 6.28749940000003,
      },
      width: 9.85022159999998,
      height: 6.773170299999838,
    },
    {
      obstacleId: "pcb_plated_hole_0",
      absoluteCenter: {
        x: -8.25,
        y: 7.62,
      },
      width: 3,
      height: 2,
    },
    {
      obstacleId: "pcb_plated_hole_1",
      absoluteCenter: {
        x: -8.25,
        y: 5.08,
      },
      width: 3,
      height: 2,
    },
    {
      obstacleId: "pcb_plated_hole_2",
      absoluteCenter: {
        x: -8.25,
        y: 2.54,
      },
      width: 3,
      height: 2,
    },
    {
      obstacleId: "pcb_plated_hole_3",
      absoluteCenter: {
        x: -8.25,
        y: 0,
      },
      width: 3,
      height: 2,
    },
    {
      obstacleId: "pcb_plated_hole_4",
      absoluteCenter: {
        x: -8.25,
        y: -2.54,
      },
      width: 3,
      height: 2,
    },
    {
      obstacleId: "pcb_plated_hole_5",
      absoluteCenter: {
        x: -8.25,
        y: -5.079999999999999,
      },
      width: 3,
      height: 2,
    },
    {
      obstacleId: "pcb_plated_hole_6",
      absoluteCenter: {
        x: -8.25,
        y: -7.62,
      },
      width: 3,
      height: 2,
    },
    {
      obstacleId: "pcb_plated_hole_7",
      absoluteCenter: {
        x: 8.25,
        y: 7.62,
      },
      width: 3,
      height: 2,
    },
    {
      obstacleId: "pcb_plated_hole_8",
      absoluteCenter: {
        x: 8.25,
        y: 5.08,
      },
      width: 3,
      height: 2,
    },
    {
      obstacleId: "pcb_plated_hole_9",
      absoluteCenter: {
        x: 8.25,
        y: 2.54,
      },
      width: 3,
      height: 2,
    },
    {
      obstacleId: "pcb_plated_hole_10",
      absoluteCenter: {
        x: 8.25,
        y: 0,
      },
      width: 3,
      height: 2,
    },
    {
      obstacleId: "pcb_plated_hole_11",
      absoluteCenter: {
        x: 8.25,
        y: -2.54,
      },
      width: 3,
      height: 2,
    },
    {
      obstacleId: "pcb_plated_hole_12",
      absoluteCenter: {
        x: 8.25,
        y: -5.079999999999999,
      },
      width: 3,
      height: 2,
    },
    {
      obstacleId: "pcb_plated_hole_13",
      absoluteCenter: {
        x: 8.25,
        y: -7.62,
      },
      width: 3,
      height: 2,
    },
  ],
  boundaryOutline: [
    {
      x: 0,
      y: 10.55,
    },
    {
      x: 7.090000000000001,
      y: 10.55,
    },
    {
      x: 7.441162579629032,
      y: 10.515413504725815,
    },
    {
      x: 7.778830178257163,
      y: 10.412983158520316,
    },
    {
      x: 8.090026419435285,
      y: 10.246645302144582,
    },
    {
      x: 8.362792206135786,
      y: 10.022792206135785,
    },
    {
      x: 8.586645302144582,
      y: 9.750026419435283,
    },
    {
      x: 8.752983158520317,
      y: 9.438830178257161,
    },
    {
      x: 8.855413504725815,
      y: 9.101162579629031,
    },
    {
      x: 8.89,
      y: 8.75,
    },
    {
      x: 8.89,
      y: -8.75,
    },
    {
      x: 8.855413504725815,
      y: -9.101162579629031,
    },
    {
      x: 8.752983158520317,
      y: -9.438830178257161,
    },
    {
      x: 8.586645302144582,
      y: -9.750026419435283,
    },
    {
      x: 8.362792206135786,
      y: -10.022792206135785,
    },
    {
      x: 8.090026419435285,
      y: -10.246645302144582,
    },
    {
      x: 7.778830178257163,
      y: -10.412983158520316,
    },
    {
      x: 7.441162579629032,
      y: -10.515413504725815,
    },
    {
      x: 7.090000000000001,
      y: -10.55,
    },
    {
      x: -7.090000000000001,
      y: -10.55,
    },
    {
      x: -7.441162579629031,
      y: -10.515413504725815,
    },
    {
      x: -7.778830178257162,
      y: -10.412983158520316,
    },
    {
      x: -8.090026419435285,
      y: -10.246645302144582,
    },
    {
      x: -8.362792206135786,
      y: -10.022792206135787,
    },
    {
      x: -8.586645302144582,
      y: -9.750026419435283,
    },
    {
      x: -8.752983158520317,
      y: -9.438830178257161,
    },
    {
      x: -8.855413504725815,
      y: -9.101162579629031,
    },
    {
      x: -8.89,
      y: -8.75,
    },
    {
      x: -8.89,
      y: 8.75,
    },
    {
      x: -8.855413504725815,
      y: 9.101162579629031,
    },
    {
      x: -8.752983158520317,
      y: 9.438830178257161,
    },
    {
      x: -8.586645302144582,
      y: 9.750026419435283,
    },
    {
      x: -8.362792206135786,
      y: 10.022792206135787,
    },
    {
      x: -8.090026419435285,
      y: 10.246645302144582,
    },
    {
      x: -7.778830178257162,
      y: 10.412983158520316,
    },
    {
      x: -7.441162579629031,
      y: 10.515413504725815,
    },
    {
      x: -7.090000000000001,
      y: 10.55,
    },
    {
      x: 0,
      y: 10.55,
    },
  ],
}

export default () => {
  const solver = useMemo(() => {
    return new SingleComponentPackSolver(inputProblem as any)
  }, [])
  return <GenericSolverDebugger solver={solver} />
}
