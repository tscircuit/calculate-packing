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
  shouldAddInnerObstacles?: boolean,
  chipMarginsMap: Record<
    string,
    { left: number; right: number; top: number; bottom: number }
  > = {},
): PackedComponent => {
  const padInfos = pcbComponents.flatMap((pc) => {
    const pads = extractPadInfos(pc, db, getNetworkId)
    const margins = chipMarginsMap[pc.pcb_component_id]
    if (!margins) return pads
    return pads.map((p) => ({
      ...p,
      size: {
        x: p.size.x + margins.left + margins.right,
        y: p.size.y + margins.top + margins.bottom,
      },
      absoluteCenter: {
        x: p.absoluteCenter.x + (margins.right - margins.left) / 2,
        y: p.absoluteCenter.y + (margins.top - margins.bottom) / 2,
      },
    }))
  })

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

  if (shouldAddInnerObstacles) {
    // Create a pad that represents the inside of the component using the
    // bounds
    const innerPad: OutputPad = {
      padId: `${componentId}-inner`,
      networkId: `${componentId}-inner`,
      type: "rect",
      size: { x: maxX - minX, y: maxY - minY },
      absoluteCenter: center,
      offset: { x: 0, y: 0 },
    }
    pads.push(innerPad)
  }

  return {
    componentId,
    center,
    ccwRotationOffset: 0,
    pads,
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
    shouldAddInnerObstacles?: boolean
    chipMarginsMap?: Record<
      string,
      { left: number; right: number; top: number; bottom: number }
    >
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
        (e: any) => e.type === "pcb_component",
      ) as PcbComponent | undefined
      if (!pcbComponent) continue
      packOutput.components.push(
        buildPackedComponent(
          [pcbComponent],
          pcbComponent.pcb_component_id,
          db,
          getNetworkId,
          opts.shouldAddInnerObstacles,
          opts.chipMarginsMap,
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
        buildPackedComponent(
          pcbComps,
          compId,
          db,
          getNetworkId,
          undefined,
          opts.chipMarginsMap,
        ),
      )
    }
  }

  return packOutput
}
