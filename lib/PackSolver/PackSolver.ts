import { BaseSolver } from "../solver-utils/BaseSolver"
import { getComponentBounds } from "../geometry/getComponentBounds"
import { rotatePoint } from "../math/rotatePoint"
import { constructOutlinesFromPackedComponents } from "../constructOutlinesFromPackedComponents"
import type {
  InputComponent,
  NetworkId,
  PackedComponent,
  PackInput,
} from "../types"
import type { GraphicsObject, Line, Point } from "graphics-debug"
import { getGraphicsFromPackOutput } from "../testing/getGraphicsFromPackOutput"
import { setPackedComponentPadCenters } from "./setPackedComponentPadCenters"
import type { Segment } from "../geometry/types"
import { getSegmentsFromPad } from "./getSegmentsFromPad"
import { computeNearestPointOnSegmentForSegmentSet } from "../math/computeNearestPointOnSegmentForSegmentSet"

/**
 * The pack algorithm performs the following steps:
 * 1. Sort the components using the packOrderStrategy
 * 2. Select the next component to pack
 * 3. If the first component, pack at center (0,0) and go to step 2
 * 4. Compute the outline of all packed components with a gap of minGap + max(pad.width, pad.height)/2
 * 5. Find the point along the outline that minimizes the distance of the pad
 *    centers within a networkId. If no shared pads, pack to the defaultPackDirection
 * 6. Add the component at the selected point, with it's pad at the position
 *    minimizing the distance between the pad centers
 * 7. To determine the component rotation, find the minimum distance between pad
 *    centers for the remaining pads at each possible rotation (making sure that
 *    we never pack such that two pads overlap)
 * 8. Go to step 2 until all components are packed
 */
export class PackSolver extends BaseSolver {
  packInput: PackInput

  unpackedComponentQueue!: InputComponent[]
  packedComponents!: PackedComponent[]

  lastBestPointsResult?: { bestPoints: Point[]; distance: number }

  constructor(input: PackInput) {
    super()
    this.packInput = input
  }

  override _setup() {
    const { components, packOrderStrategy } = this.packInput

    this.unpackedComponentQueue = [...components].sort((a, b) => {
      if (packOrderStrategy === "largest_to_smallest") {
        return b.pads.length - a.pads.length
      }
      return a.pads.length - b.pads.length
    })
    this.packedComponents = []
  }

  override _step() {
    // Already solved?
    if (this.solved) return

    const { minGap = 0, disconnectedPackDirection = "right" } = this.packInput

    // If no more components to process -> solved
    if (this.unpackedComponentQueue.length === 0) {
      this.solved = true
      return
    }

    // Take next component
    const next = this.unpackedComponentQueue.shift()!
    if (!next) {
      this.solved = true
      return
    }

    // --- Create a shallow PackedComponent from next ---
    const newPackedComponent: PackedComponent = {
      ...next,
      center: { x: 0, y: 0 },
      ccwRotationOffset: 0,
      pads: next.pads.map((p) => ({
        ...p,
        absoluteCenter: { x: 0, y: 0 },
      })),
    }

    if (this.packedComponents.length === 0) {
      newPackedComponent.center = { x: 0, y: 0 }
      setPackedComponentPadCenters(newPackedComponent)
      this.packedComponents.push(newPackedComponent)
      return
    }

    // Position relative to previous components (simple strategy)
    const outlines = constructOutlinesFromPackedComponents(
      this.packedComponents,
      { minGap },
    )

    const networkIdsInPackedComponents = new Set(
      this.packedComponents.flatMap((c) => c.pads.map((p) => p.networkId)),
    )

    const networkIdsInNewPackedComponent = new Set(
      newPackedComponent.pads.map((p) => p.networkId),
    )

    const sharedNetworkIds = new Set(
      [...networkIdsInPackedComponents].filter((id) =>
        networkIdsInNewPackedComponent.has(id),
      ),
    )

    if (sharedNetworkIds.size === 0) {
      throw new Error(
        "Use the disconnectedPackDirection to place the new component",
      )
    }

    const networkIdToAlreadyPackedSegments = new Map<NetworkId, Segment[]>()

    for (const sharedNetworkId of sharedNetworkIds) {
      networkIdToAlreadyPackedSegments.set(sharedNetworkId, [])
      for (const packedComponent of this.packedComponents) {
        for (const pad of packedComponent.pads) {
          if (pad.networkId !== sharedNetworkId) continue
          const segments = getSegmentsFromPad(pad)
          networkIdToAlreadyPackedSegments.set(sharedNetworkId, segments)
        }
      }
    }

    // Find the point along the outline that minimizes the distance of the pad
    // to the next nearest pad on the network
    let smallestDistance = Number.POSITIVE_INFINITY
    let bestPoints: (Point & { networkId: NetworkId })[] = []
    for (const outline of outlines) {
      for (const outlineSegment of outline) {
        for (const sharedNetworkId of sharedNetworkIds) {
          const alreadyPackedSegments =
            networkIdToAlreadyPackedSegments.get(sharedNetworkId)
          if (!alreadyPackedSegments) continue
          const {
            nearestPoint: nearestPointOnOutlineToAlreadyPackedSegments,
            dist: outlineToAlreadyPackedSegmentsDist,
          } = computeNearestPointOnSegmentForSegmentSet(
            outlineSegment,
            alreadyPackedSegments,
          )
          if (outlineToAlreadyPackedSegmentsDist < smallestDistance + 1e-6) {
            if (outlineToAlreadyPackedSegmentsDist < smallestDistance - 1e-6) {
              bestPoints = [
                {
                  ...nearestPointOnOutlineToAlreadyPackedSegments,
                  networkId: sharedNetworkId,
                },
              ]
              smallestDistance = outlineToAlreadyPackedSegmentsDist
            } else {
              bestPoints.push({
                ...nearestPointOnOutlineToAlreadyPackedSegments,
                networkId: sharedNetworkId,
              })
            }
          }
        }
      }
    }

    this.lastBestPointsResult = {
      bestPoints,
      distance: smallestDistance,
    }

    for (const bestPoint of bestPoints) {
      const networkId = bestPoint.networkId

      const newPadsConnectedToNetworkId = newPackedComponent.pads.filter(
        (p) => p.networkId === networkId,
      )

      /* -------------------------------------------------------------
       * 1. Build a set of candidate rotations (0°,90°,180°,270°)
       * 2. For every candidate rotation:
       *      • translate the component so that the FIRST pad on
       *        this networkId lands exactly on bestPoint
       *      • reject the candidate if ANY pad overlaps with an
       *        already-packed pad (simple AABB test)
       *      • compute a cost = Σ   (for every pad that shares a
       *        network with the already-packed board)
       *        min-distance to another pad on that same network
       * 3. Pick the candidate with the smallest cost
       * ------------------------------------------------------------- */

      const candidateAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]
      let bestCandidate: {
        center: Point
        angle: number
        cost: number
      } | null = null

      const packedPads = this.packedComponents.flatMap((c) => c.pads)

      for (const angle of candidateAngles) {
        /* rotate FIRST pad of this network so it will hit bestPoint */
        const firstPad = newPadsConnectedToNetworkId[0]
        if (!firstPad) continue
        const rotatedOffset = rotatePoint(firstPad.offset, angle)
        const candidateCenter = {
          x: bestPoint.x - rotatedOffset.x,
          y: bestPoint.y - rotatedOffset.y,
        }

        /* build pad list for the candidate */
        const transformedPads = newPackedComponent.pads.map((p) => {
          const ro = rotatePoint(p.offset, angle)
          return {
            ...p,
            absoluteCenter: {
              x: candidateCenter.x + ro.x,
              y: candidateCenter.y + ro.y,
            },
          }
        })

        /* --- 1. overlap check (AABB) ----------------------------------- */
        const overlaps = transformedPads.some((tp) =>
          packedPads.some((pp) => {
            const dx = Math.abs(tp.absoluteCenter.x - pp.absoluteCenter.x)
            const dy = Math.abs(tp.absoluteCenter.y - pp.absoluteCenter.y)
            return (
              dx < (tp.size.x + pp.size.x) / 2 &&
              dy < (tp.size.y + pp.size.y) / 2
            )
          }),
        )
        if (overlaps) continue /* reject candidate */

        /* --- 2. cost (connection length) ------------------------------- */
        let cost = 0
        for (const tp of transformedPads) {
          const sameNetPads = packedPads.filter((pp) => pp.networkId === tp.networkId)
          if (!sameNetPads.length) continue
          let bestD = Infinity
          for (const pp of sameNetPads) {
            const dx = tp.absoluteCenter.x - pp.absoluteCenter.x
            const dy = tp.absoluteCenter.y - pp.absoluteCenter.y
            const d = Math.hypot(dx, dy)
            if (d < bestD) bestD = d
          }
          cost += bestD
        }

        if (!bestCandidate || cost < bestCandidate.cost) {
          bestCandidate = { center: candidateCenter, angle, cost }
        }
      }

      /* Apply the best candidate (fallback: first one with 0° rotation) */
      if (bestCandidate) {
        newPackedComponent.center = bestCandidate.center
        newPackedComponent.ccwRotationOffset = bestCandidate.angle
      } else {
        /* no valid rotation found – default: put pad on point, 0° rot. */
        const firstPad = newPadsConnectedToNetworkId[0]
        const candidateCenter = {
          x: bestPoint.x - firstPad.offset.x,
          y: bestPoint.y - firstPad.offset.y,
        }
        newPackedComponent.center = candidateCenter
        newPackedComponent.ccwRotationOffset = 0
      }

      /* recompute absolute pad centres */
      setPackedComponentPadCenters(newPackedComponent)
    }

    setPackedComponentPadCenters(newPackedComponent)
    this.packedComponents.push(newPackedComponent)
  }

  override getConstructorParams() {
    return [this.packInput]
  }

  /** Visualize the current packing state – components are omitted, only the outline is shown. */
  override visualize(): GraphicsObject {
    const graphics: GraphicsObject = getGraphicsFromPackOutput({
      components: this.packedComponents ?? [],
      minGap: this.packInput.minGap,
      packOrderStrategy: this.packInput.packOrderStrategy,
      packPlacementStrategy: this.packInput.packPlacementStrategy,
      disconnectedPackDirection: this.packInput.disconnectedPackDirection,
    })
    graphics.points ??= []
    graphics.lines ??= []

    /* Build an outline around every currently-packed island */
    const outlines = constructOutlinesFromPackedComponents(
      this.packedComponents ?? [],
      {
        minGap: this.packInput.minGap,
      },
    )

    /* Convert every outline segment to a graphics-debug “line” object */
    graphics.lines!.push(
      ...outlines.flatMap((outline) =>
        outline.map(
          ([p1, p2]) =>
            ({
              points: [p1, p2],
              stroke: "#ff4444",
            }) as Line,
        ),
      ),
    )

    if (this.lastBestPointsResult) {
      for (const bestPoint of this.lastBestPointsResult.bestPoints) {
        graphics.points!.push({
          x: bestPoint.x,
          y: bestPoint.y,
          label: `bestPoint\nnetworkId: ${bestPoint.networkId}\nd=${this.lastBestPointsResult.distance}`,
        } as Point)
      }
    }

    return graphics
  }

  getResult(): PackedComponent[] {
    return this.packedComponents
  }
}
