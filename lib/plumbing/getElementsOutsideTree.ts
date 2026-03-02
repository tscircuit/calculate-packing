import type { CircuitJsonTreeNode, cju } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"
import type { InputObstacle } from "../types"

export const getElementOutsideTree = (
  db: ReturnType<typeof cju>,
  tree: CircuitJsonTreeNode,
): AnyCircuitElement[] => {
  // Collect all pcb_component_ids that are part of the given tree
  const componentIdsInTree = new Set<string>()

  const collectComponentIds = (node: any) => {
    if (!node) return
    if (node.nodeType === "component") {
      const pcbId = node.otherChildElements?.[0]?.pcb_component_id
      if (pcbId) componentIdsInTree.add(pcbId)
    }
    for (const child of node.childNodes ?? []) collectComponentIds(child)
  }

  collectComponentIds(tree)

  const outside: AnyCircuitElement[] = []

  // Board-level plated holes (e.g., mounting holes)
  for (const ph of db.pcb_plated_hole.list({})) {
    if (!("pcb_component_id" in ph) || !ph.pcb_component_id) {
      outside.push(ph as AnyCircuitElement)
      continue
    }
    if (!componentIdsInTree.has(ph.pcb_component_id)) {
      outside.push(ph as AnyCircuitElement)
    }
  }

  // Non-plated holes (pcb_hole) are always board-level obstacles
  for (const hole of db.pcb_hole.list({})) {
    outside.push(hole as AnyCircuitElement)
  }

  return outside
}

/**
 * Convert a board-level circuit element into an InputObstacle, or return
 * undefined if the element type is not a recognised obstacle source.
 */
export const getObstacleFromElement = (
  element: AnyCircuitElement,
): InputObstacle | undefined => {
  if (
    element.type === "pcb_plated_hole" &&
    element.shape === "circular_hole_with_rect_pad"
  ) {
    const { rect_pad_height, rect_pad_width, x, y } = element
    return {
      obstacleId: element.pcb_plated_hole_id,
      absoluteCenter: { x, y },
      width: rect_pad_width,
      height: rect_pad_height,
    }
  }

  if (element.type === "pcb_hole") {
    const { x, y, pcb_hole_id } = element
    const width =
      "hole_diameter" in element ? element.hole_diameter : element.hole_width
    const height =
      "hole_diameter" in element ? element.hole_diameter : element.hole_height
    return {
      obstacleId: pcb_hole_id,
      absoluteCenter: { x, y },
      width,
      height,
    }
  }

  return undefined
}
