import type { CircuitJsonTreeNode, cju } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"

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
