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
    const bounds = getBoundsOfPcbElements(
      circuitJson.filter(
        (elm) =>
          "pcb_component_id" in elm &&
          elm.pcb_component_id === pcbComponent.pcb_component_id,
      ),
    )

    const pads: InputPad[] = []

    const platedHoles = db.pcb_plated_hole.list({
      pcb_component_id: pcbComponent.pcb_component_id,
    })

    for (const platedHole of platedHoles) {
      const pad: InputPad = {
        // TODO
      }
    }

    const smtPads = db.pcb_smt_pad.list({
      pcb_component_id: pcbComponent.pcb_component_id,
    })

    for (const smtPad of smtPads) {
      const pad: InputPad = {
        // TODO
      }
    }

    const inputComponent: InputComponent = {
      componentId: pcbComponent.pcb_component_id,
      pads: [],
    }

    packInput.components.push(inputComponent)
  }

  // TODO
}
