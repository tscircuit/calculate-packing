import type { CircuitJson, PcbComponent } from "circuit-json"
import { cju, getCircuitJsonTree } from "@tscircuit/circuit-json-util"
import type {
  InputComponent,
  InputPad,
  OutputPad,
  PackedComponent,
  PackInput,
  PackOutput,
  InputObstacle,
} from "../types"
import { extractPadInfos } from "./extractPadInfos"
import { getElementOutsideTree } from "./getElementsOutsideTree"

/* build a single PackedComponent from one or more pcb_components */
const buildPackedComponent = (
  pcbComponents: PcbComponent[],
  componentId: string,
  db: ReturnType<typeof cju>,
  getNetworkId: (pcbPortId?: string) => string,
  shouldAddInnerObstacles?: boolean,
  sourcePortToPadIds: Map<string, string[]> = new Map(),
  chipMarginsMap: Record<
    string,
    { left: number; right: number; top: number; bottom: number }
  > = {},
  isStatic = false,
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

  for (const padInfo of padInfos) {
    if (!padInfo.pcbPortId) continue

    const sourcePortId = db.pcb_port.get(padInfo.pcbPortId)?.source_port_id
    if (!sourcePortId) continue

    const existingPadIds = sourcePortToPadIds.get(sourcePortId) ?? []
    existingPadIds.push(padInfo.padId)
    sourcePortToPadIds.set(sourcePortId, existingPadIds)
  }

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
    isStatic,
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
    obstacles?: InputObstacle[]
    staticPcbComponentIds?: string[]
  } = {},
): PackOutput => {
  const packOutput: PackOutput = {
    components: [],
    minGap: 0,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
    obstacles: opts.obstacles ?? [],
  }

  const tree = getCircuitJsonTree(circuitJson, {
    source_group_id: opts.source_group_id,
  })
  const db = cju(circuitJson)
  let unnamedCounter = 0

  const sourcePortToPadIds = new Map<string, string[]>()

  const elementsOutsideTree = getElementOutsideTree(db, tree)

  // Extract boundary outline from pcb_board if it exists
  const pcbBoard = (circuitJson as any[]).find(
    (item: any) => item.type === "pcb_board",
  )
  if (pcbBoard && pcbBoard.outline) {
    packOutput.boundaryOutline = pcbBoard.outline
  }

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

  // Helper function to recursively collect components with relative_to_group_anchor position mode
  const collectRelativeToGroupAnchorComponents = (
    node: any,
  ): PcbComponent[] => {
    const relativeComponents: PcbComponent[] = []

    if (node.nodeType === "component") {
      const pcbComponent = node.otherChildElements.find(
        (e: any) => e.type === "pcb_component",
      ) as PcbComponent | undefined
      if (
        pcbComponent &&
        (pcbComponent as any).position_mode === "relative_to_group_anchor"
      ) {
        relativeComponents.push(pcbComponent)
      }
    }

    // Recursively check child nodes
    for (const child of node.childNodes ?? []) {
      relativeComponents.push(...collectRelativeToGroupAnchorComponents(child))
    }

    return relativeComponents
  }

  const staticComponentIds = new Set(opts.staticPcbComponentIds ?? [])

  for (const node of topLevelNodes) {
    if (node.nodeType === "component") {
      const pcbComponent = node.otherChildElements.find(
        (e: any) => e.type === "pcb_component",
      ) as PcbComponent | undefined
      if (!pcbComponent) continue

      // Skip components with relative_to_group_anchor position mode - they'll be added as obstacles
      if ((pcbComponent as any).position_mode === "relative_to_group_anchor") {
        continue
      }

      let shouldAddInnerObstaclesForComp = opts.shouldAddInnerObstacles
      if (pcbComponent.obstructs_within_bounds === false) {
        shouldAddInnerObstaclesForComp = false
      }

      packOutput.components.push(
        buildPackedComponent(
          [pcbComponent],
          pcbComponent.pcb_component_id,
          db,
          getNetworkId,
          shouldAddInnerObstaclesForComp,
          sourcePortToPadIds,
          opts.chipMarginsMap,
          staticComponentIds.has(pcbComponent.pcb_component_id),
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
          sourcePortToPadIds,
          opts.chipMarginsMap,
          staticComponentIds.has(compId),
        ),
      )
    }
  }

  // Add components with "relative_to_group_anchor" position mode as obstacles
  const relativeComponents = topLevelNodes.flatMap((node) =>
    collectRelativeToGroupAnchorComponents(node),
  )

  for (const pcbComponent of relativeComponents) {
    // Get all pads for this component to determine its bounds
    const padInfos = extractPadInfos(pcbComponent, db, getNetworkId)

    if (padInfos.length === 0) continue

    // Calculate component bounds from pads
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const pad of padInfos) {
      minX = Math.min(minX, pad.absoluteCenter.x - pad.size.x / 2)
      maxX = Math.max(maxX, pad.absoluteCenter.x + pad.size.x / 2)
      minY = Math.min(minY, pad.absoluteCenter.y - pad.size.y / 2)
      maxY = Math.max(maxY, pad.absoluteCenter.y + pad.size.y / 2)
    }

    const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
    const width = maxX - minX
    const height = maxY - minY

    packOutput.obstacles!.push({
      obstacleId: pcbComponent.pcb_component_id,
      absoluteCenter: center,
      width: width,
      height: height,
    })
  }

  //lets add all elements outside the tree as obstecls

  for (const element of elementsOutsideTree) {
    //move logic to getObstacleFromElement
    if (
      element.type === "pcb_plated_hole" &&
      element.shape === "circular_hole_with_rect_pad"
    ) {
      const { rect_pad_height, rect_pad_width, x, y } = element
      packOutput.obstacles!.push({
        obstacleId: element.pcb_plated_hole_id,
        absoluteCenter: { x, y },
        width: rect_pad_width,
        height: rect_pad_height,
      })
    }
  }

  // Build weightedConnections from source traces that directly connect two ports
  const weightedConnections: NonNullable<PackInput["weightedConnections"]> = []
  const seenConnections = new Set<string>()

  const sourceTraces =
    typeof db.source_trace.list === "function"
      ? db.source_trace.list()
      : (circuitJson as any[]).filter((item) => item.type === "source_trace")

  for (const sourceTrace of sourceTraces) {
    const connectedPorts = sourceTrace.connected_source_port_ids || []
    const connectedNets = sourceTrace.connected_source_net_ids || []

    const shouldCreateWeightedConnections =
      connectedPorts.length === 2 && connectedNets.length === 0

    if (!shouldCreateWeightedConnections) continue

    const [portA, portB] = connectedPorts
    const padIdsA = portA ? (sourcePortToPadIds.get(portA) ?? []) : []
    const padIdsB = portB ? (sourcePortToPadIds.get(portB) ?? []) : []

    for (const padA of padIdsA) {
      for (const padB of padIdsB) {
        const connectionKey = [padA, padB].sort().join("--")
        if (seenConnections.has(connectionKey)) continue

        weightedConnections.push({
          padIds: [padA, padB],
          weight: 1,
          ignoreWeakConnections: true,
        })
        seenConnections.add(connectionKey)
      }
    }
  }

  if (weightedConnections.length > 0) {
    packOutput.weightedConnections = weightedConnections
  }

  return packOutput
}
