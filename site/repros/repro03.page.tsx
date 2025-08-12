import { PackDebugger } from "../components/PackDebugger"
import packInput from "../../tests/repros/repro02/repro02-pack-input.json"
import type { PackInput } from "lib/types"

const input: PackInput = {
  components: [
    {
      componentId: "pcb_component_0",
      pads: [
        {
          padId: "pcb_component_0_pad_0",
          networkId: "net_0",
          type: "rect",
          size: { x: 0.6, y: 0.45 },
          offset: { x: -1.905, y: -0.975 },
        },
        {
          padId: "pcb_component_0_pad_1",
          networkId: "net_1",
          type: "rect",
          size: { x: 0.6, y: 0.45 },
          offset: { x: -0.635, y: -0.975 },
        },
        {
          padId: "pcb_component_0_pad_2",
          networkId: "net_2",
          type: "rect",
          size: { x: 0.6, y: 0.45 },
          offset: { x: 0.635, y: -0.975 },
        },
        {
          padId: "pcb_component_0_pad_3",
          networkId: "net_3",
          type: "rect",
          size: { x: 0.6, y: 0.45 },
          offset: { x: 1.905, y: -0.975 },
        },
        {
          padId: "pcb_component_0_pad_4",
          networkId: "net_4",
          type: "rect",
          size: { x: 0.6, y: 0.45 },
          offset: { x: 1.905, y: 0.975 },
        },
        {
          padId: "pcb_component_0_pad_5",
          networkId: "net_5",
          type: "rect",
          size: { x: 0.6, y: 0.45 },
          offset: { x: 0.635, y: 0.975 },
        },
        {
          padId: "pcb_component_0_pad_6",
          networkId: "net_6",
          type: "rect",
          size: { x: 0.6, y: 0.45 },
          offset: { x: -0.635, y: 0.975 },
        },
        {
          padId: "pcb_component_0_pad_7",
          networkId: "net_7",
          type: "rect",
          size: { x: 0.6, y: 0.45 },
          offset: { x: -1.905, y: 0.975 },
        },
      ],
    },
    {
      componentId: "pcb_component_1",
      pads: [
        {
          padId: "pcb_component_1_pad_0",
          networkId: "net_8",
          type: "rect",
          size: { x: 0.6, y: 0.5 },
          offset: { x: -0.5, y: 0 },
        },
        {
          padId: "pcb_component_1_pad_1",
          networkId: "net_9",
          type: "rect",
          size: { x: 0.6, y: 0.5 },
          offset: { x: 0.5, y: 0 },
        },
      ],
    },
    {
      componentId: "pcb_component_2",
      pads: [
        {
          padId: "pcb_component_2_pad_0",
          networkId: "net_10",
          type: "rect",
          size: { x: 0.9, y: 0.8 },
          offset: { x: -0.8, y: 0 },
        },
        {
          padId: "pcb_component_2_pad_1",
          networkId: "net_11",
          type: "rect",
          size: { x: 0.9, y: 0.8 },
          offset: { x: 0.8, y: 0 },
        },
      ],
    },
  ],
  minGap: 1.5,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "shortest_connection_along_outline",
}

export default () => {
  return <PackDebugger initialPackInput={input as any} />
}
