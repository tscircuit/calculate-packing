import type { PackInput } from "../types"

/**
 * Checks if two pads have a "strong" (weighted) connection.
 *
 * - If weightedConnections is not provided or empty, all connections are strong
 *   (backward compatible with existing behavior)
 * - A pad pair explicitly listed together is always strong
 * - Unweighted pads continue to use their shared network as a strong connection
 * - A weighted connection can opt a participating pad out of weaker, unlisted
 *   connections with ignoreWeakConnections
 *
 * @param pad1Id - First pad ID
 * @param pad2Id - Second pad ID
 * @param weightedConnections - Optional weighted connections from PackInput
 * @returns true if the connection is strong, false if weak
 */
export function isStrongConnection(
  pad1Id: string,
  pad2Id: string,
  weightedConnections?: PackInput["weightedConnections"],
): boolean {
  // No weightedConnections = all connections are strong (backward compatibility)
  if (!weightedConnections || weightedConnections.length === 0) {
    return true
  }

  const hasExplicitWeightedConnection = weightedConnections.some(
    (wc) => wc.padIds.includes(pad1Id) && wc.padIds.includes(pad2Id),
  )
  if (hasExplicitWeightedConnection) {
    return true
  }

  const weightedConnectionsForEitherPad = weightedConnections.filter(
    (wc) => wc.padIds.includes(pad1Id) || wc.padIds.includes(pad2Id),
  )

  // Weighted connections elsewhere in the circuit must not globally weaken
  // unrelated pads that still need to be packed using their shared network.
  if (weightedConnectionsForEitherPad.length === 0) {
    return true
  }

  return !weightedConnectionsForEitherPad.some(
    (wc) => wc.ignoreWeakConnections === true,
  )
}

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
  const connectedPadIds = new Set<string>()

  // No weightedConnections = return empty set (will use networkId fallback)
  if (!weightedConnections || weightedConnections.length === 0) {
    return connectedPadIds
  }

  for (const wc of weightedConnections) {
    if (wc.padIds.includes(padId)) {
      for (const otherPadId of wc.padIds) {
        if (otherPadId !== padId) {
          connectedPadIds.add(otherPadId)
        }
      }
    }
  }

  return connectedPadIds
}
