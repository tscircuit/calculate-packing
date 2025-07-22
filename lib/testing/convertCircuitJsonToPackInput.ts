import type { CircuitJson, PcbComponent } from "circuit-json"
import { cju, getBoundsOfPcbElements } from "@tscircuit/circuit-json-util"
import type { InputComponent, InputPad, PackInput } from "../types"

export const convertCircuitJsonToPackInput = (
  circuitJson: CircuitJson,
): PackInput => {
  const packInput: PackInput = {
    components: [],
    minGap: 0,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  const db = cju(circuitJson)
  const pcbComponents = db.pcb_component.list()

  for (const pcbComponent of pcbComponents) {
    const pads: InputPad[] = []

    const platedHoles = db.pcb_plated_hole.list({
      pcb_component_id: pcbComponent.pcb_component_id,
    })

    for (const platedHole of platedHoles) {
      const sx =
        (platedHole as any).rect_pad_width ??
        (platedHole as any).outer_diameter ??
        (platedHole as any).hole_diameter ??
        0
      const sy =
        (platedHole as any).rect_pad_height ??
        (platedHole as any).outer_diameter ??
        (platedHole as any).hole_diameter ??
        0
      const pad: InputPad = {
        padId: platedHole.pcb_plated_hole_id,
        networkId:
          (platedHole as any).source_net_id ??
          (platedHole as any).pcb_port_id ??
          "unknown_net",
        type: "rect",
        offset: {
          x: platedHole.x - pcbComponent.center.x,
          y: platedHole.y - pcbComponent.center.y,
        },
        size: { x: sx, y: sy },
      }
      pads.push(pad)
    }

    const smtPads = db.pcb_smtpad.list({
      pcb_component_id: pcbComponent.pcb_component_id,
    })

    for (const smtPad of smtPads) {
      if (smtPad.shape === "polygon") {
        throw new Error("Polygon pads are not supported in pack layout yet")
      }
      const pad: InputPad = {
        padId: smtPad.pcb_smtpad_id,
        networkId:
          (smtPad as any).source_net_id ??
          (smtPad as any).pcb_port_id ??
          "unknown_net",
        type: "rect",
        offset: {
          x: smtPad.x - pcbComponent.center.x,
          y: smtPad.y - pcbComponent.center.y,
        },
        size: {
          x: (smtPad as any).width ?? 0,
          y: (smtPad as any).height ?? 0,
        },
      }
      pads.push(pad)
    }

    const inputComponent: InputComponent = {
      componentId: pcbComponent.pcb_component_id,
      pads,
    }

    packInput.components.push(inputComponent)
  }

  return packInput
}
