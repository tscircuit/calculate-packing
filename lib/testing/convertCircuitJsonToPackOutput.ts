import type { CircuitJson, PcbComponent } from "circuit-json"
import { cju, getBoundsOfPcbElements } from "@tscircuit/circuit-json-util"
import type {
  InputComponent,
  InputPad,
  OutputPad,
  PackedComponent,
  PackInput,
  PackOutput,
} from "../types"

export const convertCircuitJsonToPackOutput = (
  circuitJson: CircuitJson,
): PackOutput => {
  const packOutput: PackOutput = {
    components: [],
    minGap: 0,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  const db = cju(circuitJson)
  const pcbComponents = db.pcb_component.list()
  let unnamedCounter = 0

  const getNetworkId = (pcbPortId?: string): string => {
    if (pcbPortId) {
      const pcbPort = db.pcb_port.get(pcbPortId)
      if (pcbPort) {
        const sourcePort = db.source_port.get(pcbPort.source_port_id)
        if (sourcePort?.subcircuit_connectivity_map_key) {
          return sourcePort.subcircuit_connectivity_map_key
        }
      }
    }
    return `unnamed${unnamedCounter++}`
  }

  for (const pcbComponent of pcbComponents) {
    const pads: OutputPad[] = []

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

      const networkId = getNetworkId(platedHole.pcb_port_id)

      const pad: OutputPad = {
        padId: platedHole.pcb_plated_hole_id,
        networkId,
        type: "rect",
        offset: {
          x: platedHole.x - pcbComponent.center.x,
          y: platedHole.y - pcbComponent.center.y,
        },
        size: { x: sx, y: sy },
        absoluteCenter: {
          x: platedHole.x,
          y: platedHole.y,
        },
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
      const networkId = getNetworkId(smtPad.pcb_port_id)
      const pad: OutputPad = {
        padId: smtPad.pcb_smtpad_id,
        networkId,
        type: "rect",
        offset: {
          x: smtPad.x - pcbComponent.center.x,
          y: smtPad.y - pcbComponent.center.y,
        },
        size: {
          x: (smtPad as any).width ?? 0,
          y: (smtPad as any).height ?? 0,
        },
        absoluteCenter: {
          x: smtPad.x,
          y: smtPad.y,
        },
      }
      pads.push(pad)
    }

    const packedComponent: PackedComponent = {
      componentId: pcbComponent.pcb_component_id,
      pads,
      center: {
        x: pcbComponent.center.x,
        y: pcbComponent.center.y,
      },
      ccwRotationOffset: 0,
    }

    packOutput.components.push(packedComponent)
  }

  return packOutput
}
