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

  // Elements considered outside the tree: board-level plated holes (e.g., mounting holes)
  // These typically have no pcb_component_id
  const outside: AnyCircuitElement[] = []

  for (const ph of db.pcb_plated_hole.list({})) {
    // board-level: no pcb_component_id
    if (!("pcb_component_id" in ph) || !ph.pcb_component_id) {
      outside.push(ph as AnyCircuitElement)
      continue
    }
    // If the plated hole is attached to a component not in the tree, it's outside as well
    if (!componentIdsInTree.has(ph.pcb_component_id)) {
      // Depending on desired behavior, include or exclude.
      // Conservatively include as outside-the-tree.
      outside.push(ph as AnyCircuitElement)
    }
  }

  return outside
}
