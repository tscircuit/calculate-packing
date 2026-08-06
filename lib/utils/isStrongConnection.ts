import type { PackInput } from "../types"

type WeightedConnections = NonNullable<PackInput["weightedConnections"]>

export interface WeightedConnectionIndex {
  explicitlyConnectedPadIdsByPadId: Map<string, Set<string>>
  padIdsRejectingWeakConnections: Set<string>
}

const weightedConnectionIndexCache = new WeakMap<
  WeightedConnections,
  WeightedConnectionIndex
>()

/**
 * Builds constant-time lookups for weighted-connection checks.
 */
export function createWeightedConnectionIndex(
  weightedConnections: WeightedConnections,
): WeightedConnectionIndex {
  const explicitlyConnectedPadIdsByPadId = new Map<string, Set<string>>()
  const padIdsRejectingWeakConnections = new Set<string>()

  for (const { padIds, ignoreWeakConnections } of weightedConnections) {
    for (const padId of padIds) {
      let explicitlyConnectedPadIds =
        explicitlyConnectedPadIdsByPadId.get(padId)
      if (!explicitlyConnectedPadIds) {
        explicitlyConnectedPadIds = new Set<string>()
        explicitlyConnectedPadIdsByPadId.set(padId, explicitlyConnectedPadIds)
      }

      for (const connectedPadId of padIds) {
        explicitlyConnectedPadIds.add(connectedPadId)
      }

      if (ignoreWeakConnections === true) {
        padIdsRejectingWeakConnections.add(padId)
      }
    }
  }

  return {
    explicitlyConnectedPadIdsByPadId,
    padIdsRejectingWeakConnections,
  }
}

/**
 * Reuses an index for repeated checks against the same weighted-connections
 * array. Pack inputs are treated as immutable while a layout is being solved.
 */
export function getWeightedConnectionIndex(
  weightedConnections: WeightedConnections,
): WeightedConnectionIndex {
  const cachedIndex = weightedConnectionIndexCache.get(weightedConnections)
  if (cachedIndex) return cachedIndex

  const index = createWeightedConnectionIndex(weightedConnections)
  weightedConnectionIndexCache.set(weightedConnections, index)
  return index
}

/**
 * Checks if two pads have a "strong" (weighted) connection.
 *
 * - If weightedConnections is not provided or empty, all connections are strong
 *   (backward compatible with existing behavior)
 * - Pad pairs explicitly listed together are always strong
 * - Pads that do not participate in weightedConnections keep the normal
 *   same-network fallback
 * - An unlisted pair is weak only when one of its participating pads belongs to
 *   a weighted connection with ignoreWeakConnections enabled
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
  if (!weightedConnections?.length) {
    return true
  }

  const index = getWeightedConnectionIndex(weightedConnections)
  const pairIsExplicitlyWeighted = index.explicitlyConnectedPadIdsByPadId
    .get(pad1Id)
    ?.has(pad2Id)

  if (pairIsExplicitlyWeighted) {
    return true
  }

  const eitherPadRejectsWeakConnections =
    index.padIdsRejectingWeakConnections.has(pad1Id) ||
    index.padIdsRejectingWeakConnections.has(pad2Id)

  return !eitherPadRejectsWeakConnections
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
