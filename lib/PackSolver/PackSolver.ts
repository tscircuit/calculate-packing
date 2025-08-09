import { BaseSolver } from "../solver-utils/BaseSolver"
import { getComponentBounds } from "../geometry/getComponentBounds"
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
import { selectOptimalRotation } from "./RotationSelector"
import { sortComponentQueue } from "./sortComponentQueue"
import { placeComponentDisconnected } from "./placeComponentDisconnected"
import { checkOverlapWithPackedComponents } from "./checkOverlapWithPackedComponents"
import { findOptimalPointOnSegment } from "./findOptimalPointOnSegment"
import { computeGlobalCenter } from "./computeGlobalCenter"

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

  lastBestPointsResult?: {
    bestPoints: (Point & { networkId: NetworkId })[]
    distance: number
  }

  lastEvaluatedPositionShadows?: Array<PackedComponent>

  lastCandidatePoints?: Array<
    Point & { networkId: NetworkId; distance: number }
  >

  constructor(input: PackInput) {
    super()
    this.packInput = input
  }

  override _setup() {
    const { components, packOrderStrategy, packFirst = [] } = this.packInput

    this.unpackedComponentQueue = sortComponentQueue({
      components,
      packOrderStrategy,
      packFirst
    })
    this.packedComponents = []
  }

  override _step() {
    // Already solved?
    if (this.solved) return

    const {
      minGap = 0,
      disconnectedPackDirection = "nearest_to_center",
      packPlacementStrategy = "shortest_connection_along_outline",
    } = this.packInput

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
      // Respect rotation constraints even for the first component
      const candidateAngles = this.getCandidateAngles(newPackedComponent)
      newPackedComponent.ccwRotationOffset = candidateAngles[0] ?? 0 // Use first available rotation or 0 if none
      setPackedComponentPadCenters(newPackedComponent)
      this.packedComponents.push(newPackedComponent)
      return
    }

    const padMargins = newPackedComponent.pads.map(
      (p) => Math.max(p.size.x, p.size.y) / 2,
    )
    const additionalGap = Math.max(...padMargins)

    // Position relative to previous components (simple strategy)
    const outlines = constructOutlinesFromPackedComponents(
      this.packedComponents,
      { minGap: minGap + additionalGap },
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
      /* no shared nets – use the disconnected strategy */
      this.lastEvaluatedPositionShadows = placeComponentDisconnected({
        component: newPackedComponent,
        outlines,
        direction: disconnectedPackDirection as NonNullable<
          PackInput["disconnectedPackDirection"]
        >,
        packedComponents: this.packedComponents,
        candidateAngles: this.getCandidateAngles(newPackedComponent),
        checkOverlap: (comp) => this.checkOverlapWithPackedComponents(comp)
      })
      this.packedComponents.push(newPackedComponent)
      return
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

    let smallestDistance = Number.POSITIVE_INFINITY
    let bestPoints: (Point & { networkId: NetworkId })[] = []

    if (
      packPlacementStrategy === "minimum_sum_distance_to_network" ||
      packPlacementStrategy === "minimum_sum_squared_distance_to_network"
    ) {
      // Store all candidate points for visualization
      this.lastCandidatePoints = []

      // For minimum sum distance strategy, find optimal point along each outline segment
      // by using ternary search to minimize the sum of distances
      for (const outline of outlines) {
        for (const outlineSegment of outline) {
          const [p1, p2] = outlineSegment

          for (const sharedNetworkId of sharedNetworkIds) {
            // Use ternary search to find optimal point along segment
            const {
              point: optimalPoint,
              distance: optimalDistance,
              candidatePoints,
            } = findOptimalPointOnSegment({
              p1,
              p2,
              component: newPackedComponent,
              networkId: sharedNetworkId,
              packedComponents: this.packedComponents,
              useSquaredDistance: packPlacementStrategy ===
                "minimum_sum_squared_distance_to_network",
            })

            // Store all candidate points for visualization
            for (const candidatePoint of candidatePoints) {
              this.lastCandidatePoints.push(candidatePoint)
            }

            if (optimalDistance < smallestDistance + 1e-6) {
              if (optimalDistance < smallestDistance - 1e-6) {
                bestPoints = [{ ...optimalPoint, networkId: sharedNetworkId }]
                smallestDistance = optimalDistance
              } else {
                bestPoints.push({
                  ...optimalPoint,
                  networkId: sharedNetworkId,
                })
              }
            }
          }
        }
      }
    } else {
      // Original shortest_connection_along_outline strategy
      // Find the point along the outline that minimizes the distance of the pad
      // to the next nearest pad on the network
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
              if (
                outlineToAlreadyPackedSegmentsDist <
                smallestDistance - 1e-6
              ) {
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
    }

    this.lastBestPointsResult = {
      bestPoints,
      distance: smallestDistance,
    }

    this.lastEvaluatedPositionShadows = []

    // Instead of just trying bestPoints, try multiple promising positions
    // especially when rotation is constrained
    let allCandidatePoints = [...bestPoints]

    // Add systematic sampling points along all outline segments
    // This ensures we test positions that work well for all rotations
    for (const sharedNetworkId of sharedNetworkIds) {
      for (const outline of outlines) {
        for (const outlineSegment of outline) {
          const [p1, p2] = outlineSegment
          // Sample multiple points along each segment (always, not just for constrained rotations)
          for (let t = 0; t <= 1; t += 0.2) {
            const candidatePoint = {
              x: p1.x + t * (p2.x - p1.x),
              y: p1.y + t * (p2.y - p1.y),
              networkId: sharedNetworkId,
            }
            allCandidatePoints.push(candidatePoint)
          }
        }
      }
    }

    // Use the new RotationSelector for cleaner, more optimal rotation selection
    const useSquaredDistance = packPlacementStrategy === "minimum_sum_squared_distance_to_network"
    
    const bestCandidate = selectOptimalRotation({
      component: newPackedComponent,
      candidatePoints: allCandidatePoints,
      packedComponents: this.packedComponents,
      minGap: minGap,
      useSquaredDistance: useSquaredDistance,
      checkOverlap: (comp) => checkOverlapWithPackedComponents({
        component: comp,
        packedComponents: this.packedComponents,
        minGap: this.packInput.minGap ?? 0
      }),
    })

    /* Apply the best candidate (fallback: first available rotation at reasonable position) */
    if (bestCandidate) {
      newPackedComponent.center = bestCandidate.center
      newPackedComponent.ccwRotationOffset = bestCandidate.angle
      newPackedComponent.pads = bestCandidate.pads
    } else {
      /* no valid rotation found – fallback */
      const candidateAngles = this.getCandidateAngles(newPackedComponent)
      console.warn(
        `No valid placement found for ${newPackedComponent.componentId}. Using fallback position.`,
      )
      newPackedComponent.center = { x: 5, y: 5 } // Fallback position
      newPackedComponent.ccwRotationOffset = candidateAngles[0] ?? 0
      setPackedComponentPadCenters(newPackedComponent)
    }

    // Note: setPackedComponentPadCenters is not needed here because RotationSelector
    // has already set the correct pad positions and dimensions
    this.packedComponents.push(newPackedComponent)
  }

  override getConstructorParams() {
    return [this.packInput]
  }

  /* ---------- small helpers ------------------------------------------------ */

  private getCandidateAngles(c: InputComponent): number[] {
    // Return angles in degrees, not radians
    return (c.availableRotationDegrees ?? [0, 90, 180, 270]).map((d) => d % 360)
  }

  private checkOverlapWithPackedComponents(component: PackedComponent): boolean {
    return checkOverlapWithPackedComponents({
      component,
      packedComponents: this.packedComponents,
      minGap: this.packInput.minGap ?? 0
    })
  }

  private computeGlobalCenter(): Point {
    return computeGlobalCenter(this.packedComponents)
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

    if (!this.solved) {
      for (const shadow of this.lastEvaluatedPositionShadows ?? []) {
        const bounds = getComponentBounds(shadow, 0)
        graphics.rects!.push({
          center: shadow.center,
          width: bounds.maxX - bounds.minX,
          height: bounds.maxY - bounds.minY,
          fill: "rgba(0,255,255,0.2)",
          label: shadow.ccwRotationOffset.toFixed(1) + "°",
        })
        for (const shadowPad of shadow.pads) {
          graphics.rects!.push({
            center: shadowPad.absoluteCenter,
            width: shadowPad.size.x,
            height: shadowPad.size.y,
            fill: "rgba(0,0,255,0.5)",
          })
        }
      }

      // Show all candidate points
      if (this.lastCandidatePoints) {
        for (const candidatePoint of this.lastCandidatePoints) {
          graphics.points!.push({
            x: candidatePoint.x,
            y: candidatePoint.y,
            label: `candidatePoint\nnetworkId: ${candidatePoint.networkId}\nd=${candidatePoint.distance.toFixed(3)}`,
            fill: "rgba(255,165,0,0.6)", // Orange color for candidate points
            radius: 0.02,
          } as Point)
        }
      }

      if (this.lastBestPointsResult) {
        for (const bestPoint of this.lastBestPointsResult.bestPoints) {
          // Add the green circle for bestPoint
          graphics.points!.push({
            x: bestPoint.x,
            y: bestPoint.y,
            label: `bestPoint\nnetworkId: ${bestPoint.networkId}\nd=${this.lastBestPointsResult.distance}`,
            fill: "rgba(0,255,0,0.8)", // Green color for best points
            radius: 0.03,
          } as Point)

          // Add small "X" marker with two crossing lines
          const crossSize = 0.2 // Size of the X marker
          graphics.lines!.push(
            {
              points: [
                { x: bestPoint.x - crossSize, y: bestPoint.y - crossSize },
                { x: bestPoint.x + crossSize, y: bestPoint.y + crossSize },
              ],
              stroke: "#00AA00", // Bright green
            } as Line,
            {
              points: [
                { x: bestPoint.x - crossSize, y: bestPoint.y + crossSize },
                { x: bestPoint.x + crossSize, y: bestPoint.y - crossSize },
              ],
              stroke: "#00AA00", // Bright green
            } as Line,
          )
        }
      }
    }

    return graphics
  }

  getResult(): PackedComponent[] {
    return this.packedComponents
  }


}
