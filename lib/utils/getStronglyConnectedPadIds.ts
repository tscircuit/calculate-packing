import type { PackInput } from "../types"
import { getWeightedConnectionIndex } from "./getWeightedConnectionIndex"

/**
 * Gets all pad IDs that have strong connections to a given pad.
 *
 * @param padId - The pad ID to find strong connections for
 * @param weightedConnections - Optional weighted connections from PackInput
 * @returns Set of pad IDs that have strong connections to the given pad
 */
export function getStronglyConnectedPadIds(
  padId: string,
  weightedConnections?: PackInput["weightedConnections"],
): Set<string> {
  // No weightedConnections = return empty set (will use networkId fallback)
  if (!weightedConnections || weightedConnections.length === 0) {
    return new Set<string>()
  }

  const index = getWeightedConnectionIndex(weightedConnections)
  const connectedPadIds = new Set(
    index.explicitlyConnectedPadIdsByPadId.get(padId),
  )
  connectedPadIds.delete(padId)

  return connectedPadIds
}
