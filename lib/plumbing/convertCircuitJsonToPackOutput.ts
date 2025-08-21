import type { CircuitJson, PcbComponent } from "circuit-json"
import { cju, getCircuitJsonTree } from "@tscircuit/circuit-json-util"
import type {
  InputComponent,
  InputPad,
  OutputPad,
  PackedComponent,
  PackInput,
  PackOutput,
} from "../types"
import { extractPadInfos } from "./extractPadInfos"

/* build a single PackedComponent from one or more pcb_components */
const buildPackedComponent = (
  pcbComponents: PcbComponent[],
  componentId: string,
  db: ReturnType<typeof cju>,
  getNetworkId: (pcbPortId?: string) => string,
): PackedComponent => {
  const padInfos = pcbComponents.flatMap((pc) =>
    extractPadInfos(pc, db, getNetworkId),
  )

  /* ----- determine centre (bbox centre of all pads) ----- */
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of padInfos) {
    minX = Math.min(minX, p.absoluteCenter.x - p.size.x / 2)
    maxX = Math.max(maxX, p.absoluteCenter.x + p.size.x / 2)
    minY = Math.min(minY, p.absoluteCenter.y - p.size.y / 2)
    maxY = Math.max(maxY, p.absoluteCenter.y + p.size.y / 2)
  }
  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }

  const pads: OutputPad[] = padInfos.map((p) => ({
    padId: p.padId,
    networkId: p.networkId,
    type: "rect",
    size: p.size,
    absoluteCenter: p.absoluteCenter,
    offset: {
      x: p.absoluteCenter.x - center.x,
      y: p.absoluteCenter.y - center.y,
    },
  }))

  /* ----- extract component body bounds from silkscreen ----- */
  let bodyBounds
  try {
    let bodyMinX = Infinity
    let bodyMinY = Infinity
    let bodyMaxX = -Infinity
    let bodyMaxY = -Infinity

    // Look for silkscreen paths for this component
    for (const pc of pcbComponents) {
      const silkscreenPaths = db.pcb_silkscreen_path.list({
        pcb_component_id: pc.pcb_component_id,
      })

      for (const path of silkscreenPaths) {
        if (path.route && Array.isArray(path.route)) {
          for (const point of path.route) {
            if (typeof point.x === "number" && typeof point.y === "number") {
              bodyMinX = Math.min(bodyMinX, point.x)
              bodyMaxX = Math.max(bodyMaxX, point.x)
              bodyMinY = Math.min(bodyMinY, point.y)
              bodyMaxY = Math.max(bodyMaxY, point.y)
            }
          }
        }
      }
    }

    // Only set bodyBounds if we found valid silkscreen data
    if (bodyMinX !== Infinity) {
      bodyBounds = {
        minX: bodyMinX,
        maxX: bodyMaxX,
        minY: bodyMinY,
        maxY: bodyMaxY,
      }
    }
  } catch (error) {
    // Silently fall back to pad-only detection if we can't extract body bounds
  }

  return {
    componentId,
    center,
    ccwRotationOffset: 0,
    pads,
    bodyBounds,
  } as PackedComponent
}

/* recursively collect every pcb_component underneath a tree node */
const collectPcbComponents = (
  node: any,
  db: ReturnType<typeof cju>,
): PcbComponent[] => {
  if (node.nodeType === "component") {
    const pcbId = node.otherChildElements[0]?.pcb_component_id
    return pcbId ? [db.pcb_component.get(pcbId)!] : []
  }
  return node.childNodes.flatMap((n: any) => collectPcbComponents(n, db))
}

export const convertCircuitJsonToPackOutput = (
  circuitJson: CircuitJson,
  opts: {
    source_group_id?: string
  } = {},
): PackOutput => {
  const packOutput: PackOutput = {
    components: [],
    minGap: 0,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  const tree = getCircuitJsonTree(circuitJson, {
    source_group_id: opts.source_group_id,
  })
  const db = cju(circuitJson)
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

  const topLevelNodes = tree.childNodes ?? []

  for (const node of topLevelNodes) {
    if (node.nodeType === "component") {
      const pcbComponent = node.otherChildElements.find(
        (e) => e.type === "pcb_component",
      )
      if (!pcbComponent) continue
      packOutput.components.push(
        buildPackedComponent(
          [pcbComponent],
          pcbComponent.pcb_component_id,
          db,
          getNetworkId,
        ),
      )
    } else if (node.nodeType === "group") {
      const pcbComps = collectPcbComponents(node, db)
      if (!pcbComps.length) continue
      const compId =
        node.sourceGroup?.source_group_id ??
        node.sourceGroup?.name ??
        `group_${packOutput.components.length}`
      packOutput.components.push(
        buildPackedComponent(pcbComps, compId, db, getNetworkId),
      )
    }
  }

  return packOutput
}
