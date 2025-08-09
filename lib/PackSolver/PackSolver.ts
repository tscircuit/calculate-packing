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
import { computeDistanceBetweenBoxes } from "@tscircuit/math-utils"
import { optimizeTranslationForMinimumSum } from "./translationOptimizer"

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

  constructor(input: PackInput) {
    super()
    this.packInput = input
  }

  override _setup() {
    const { components, packOrderStrategy, packFirst = [] } = this.packInput

    // Create a map for quick lookup of packFirst priorities
    const packFirstMap = new Map<string, number>()
    packFirst.forEach((componentId, index) => {
      packFirstMap.set(componentId, index)
    })

    this.unpackedComponentQueue = [...components].sort((a, b) => {
      const aPackFirstIndex = packFirstMap.get(a.componentId)
      const bPackFirstIndex = packFirstMap.get(b.componentId)

      // If both components are in packFirst, sort by their order in packFirst
      if (aPackFirstIndex !== undefined && bPackFirstIndex !== undefined) {
        return aPackFirstIndex - bPackFirstIndex
      }

      // If only one component is in packFirst, it comes first
      if (aPackFirstIndex !== undefined) return -1
      if (bPackFirstIndex !== undefined) return 1

      // Neither component is in packFirst, use the regular strategy
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
      this.placeComponentDisconnected(
        newPackedComponent,
        outlines,
        disconnectedPackDirection as NonNullable<
          PackInput["disconnectedPackDirection"]
        >,
      )
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

    if (packPlacementStrategy === "minimum_sum_distance_to_network") {
      // For minimum sum distance strategy, evaluate each outline point
      // by computing the sum of distances for all pads to their nearest packed pads
      for (const outline of outlines) {
        for (const outlineSegment of outline) {
          // Sample points along the outline segment
          const samplePoints = [
            outlineSegment[0],
            {
              x: (outlineSegment[0].x + outlineSegment[1].x) / 2,
              y: (outlineSegment[0].y + outlineSegment[1].y) / 2,
            },
            outlineSegment[1],
          ]

          for (const samplePoint of samplePoints) {
            for (const sharedNetworkId of sharedNetworkIds) {
              // Calculate sum distance for this position and network
              const sumDistance = this.computeSumDistanceForPosition(
                newPackedComponent,
                samplePoint,
                sharedNetworkId,
              )

              if (sumDistance < smallestDistance + 1e-6) {
                if (sumDistance < smallestDistance - 1e-6) {
                  bestPoints = [{ ...samplePoint, networkId: sharedNetworkId }]
                  smallestDistance = sumDistance
                } else {
                  bestPoints.push({
                    ...samplePoint,
                    networkId: sharedNetworkId,
                  })
                }
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

      // Determine which rotations are allowed for this component.
      // • If the component specifies availableRotationDegrees we use those
      // • Otherwise fall back to the four cardinal rotations (0°,90°,180°,270°)
      const candidateAngles = this.getCandidateAngles(newPackedComponent)
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

        /* --- 1. overlap check (component bounds) ----------------------- */
        const tempComponent: PackedComponent = {
          ...newPackedComponent,
          center: candidateCenter,
          ccwRotationOffset: angle,
          pads: transformedPads,
        }

        // Always add the initial candidate to visualization
        this.lastEvaluatedPositionShadows?.push({ ...tempComponent })

        if (this.checkOverlapWithPackedComponents(tempComponent)) continue

        /* --- 2. cost (connection length) ------------------------------- */
        let cost = 0
        if (packPlacementStrategy === "minimum_sum_distance_to_network") {
          // For minimum sum distance strategy, optimize translation within available space
          const optimizedCenter = optimizeTranslationForMinimumSum({
            component: tempComponent,
            initialCenter: candidateCenter,
            packedComponents: this.packedComponents,
            minGap: minGap,
          })

          // Rebuild transformedPads with optimized center
          const optimizedTransformedPads = newPackedComponent.pads.map((p) => {
            const ro = rotatePoint(p.offset, angle)
            return {
              ...p,
              absoluteCenter: {
                x: optimizedCenter.x + ro.x,
                y: optimizedCenter.y + ro.y,
              },
            }
          })

          // Update tempComponent with optimized position
          tempComponent.center = optimizedCenter
          tempComponent.pads = optimizedTransformedPads

          // Add optimized position to visualization if different from initial
          if (
            optimizedCenter.x !== candidateCenter.x ||
            optimizedCenter.y !== candidateCenter.y
          ) {
            this.lastEvaluatedPositionShadows?.push({ ...tempComponent })
          }

          // Recheck overlap with optimized position
          if (this.checkOverlapWithPackedComponents(tempComponent)) continue

          // Compute cost with optimized position
          for (const tp of optimizedTransformedPads) {
            const sameNetPads = packedPads.filter(
              (pp) => pp.networkId === tp.networkId,
            )
            if (!sameNetPads.length) continue
            let bestD = Infinity
            for (const pp of sameNetPads) {
              const dx = tp.absoluteCenter.x - pp.absoluteCenter.x
              const dy = tp.absoluteCenter.y - pp.absoluteCenter.y
              const d = Math.hypot(dx, dy)
              if (d < bestD) bestD = d
            }
            cost += bestD === Infinity ? 0 : bestD
          }
        } else {
          // Original strategy
          for (const tp of transformedPads) {
            const sameNetPads = packedPads.filter(
              (pp) => pp.networkId === tp.networkId,
            )
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
        }

        if (!bestCandidate || cost < bestCandidate.cost) {
          const finalCenter =
            packPlacementStrategy === "minimum_sum_distance_to_network"
              ? tempComponent.center // Use optimized center
              : candidateCenter // Use original center
          bestCandidate = { center: finalCenter, angle, cost }
        }
      }

      /* Apply the best candidate (fallback: first one with 0° rotation) */
      if (bestCandidate) {
        newPackedComponent.center = bestCandidate.center
        newPackedComponent.ccwRotationOffset = bestCandidate.angle
      } else {
        /* no valid rotation found – default: put pad on point, 0° rot. */
        console.log("no valid rotation found")
        const firstPad = newPadsConnectedToNetworkId[0]!
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

  /* ---------- small helpers ------------------------------------------------ */

  private getCandidateAngles(c: InputComponent): number[] {
    return (c.availableRotationDegrees ?? [0, 90, 180, 270]).map(
      (d) => ((d % 360) * Math.PI) / 180,
    )
  }

  private checkOverlapWithPackedComponents(cand: PackedComponent): boolean {
    const b = getComponentBounds(cand, 0)
    const candBox = {
      center: { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 },
      width: b.maxX - b.minX,
      height: b.maxY - b.minY,
    }
    for (const pc of this.packedComponents) {
      for (const pad of pc.pads) {
        if (
          computeDistanceBetweenBoxes(
            {
              center: pad.absoluteCenter,
              width: pad.size.x,
              height: pad.size.y,
            },
            candBox,
          ).distance < this.packInput.minGap
        )
          return true
      }
    }
    return false
  }

  private computeGlobalCenter(): Point {
    if (!this.packedComponents.length) return { x: 0, y: 0 }
    const s = this.packedComponents.reduce(
      (a, c) => ({ x: a.x + c.center.x, y: a.y + c.center.y }),
      { x: 0, y: 0 },
    )
    return {
      x: s.x / this.packedComponents.length,
      y: s.y / this.packedComponents.length,
    }
  }

  private findBestPointForDisconnected(
    outlines: Segment[][],
    dir: NonNullable<PackInput["disconnectedPackDirection"]>,
  ): Point {
    const pts = outlines.flatMap((ol) =>
      ol.map(([p1, p2]) => ({
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      })),
    )
    if (!pts.length) return { x: 0, y: 0 }

    if (dir !== "nearest_to_center") {
      const extreme = dir === "left" || dir === "down" ? Math.min : Math.max
      const key = dir === "left" || dir === "right" ? "x" : "y"
      const target = extreme(...pts.map((p) => p[key]))
      return pts.find((p) => p[key] === target)!
    }

    const center = this.computeGlobalCenter()
    return pts.reduce((best, p) =>
      Math.hypot(p.x - center.x, p.y - center.y) <
      Math.hypot(best.x - center.x, best.y - center.y)
        ? p
        : best,
    )
  }

  private placeComponentAtPoint(comp: PackedComponent, pt: Point) {
    this.lastEvaluatedPositionShadows = []
    for (const ang of this.getCandidateAngles(comp)) {
      const pads = comp.pads.map((p) => {
        const ro = rotatePoint(p.offset, ang)
        return { ...p, absoluteCenter: { x: pt.x + ro.x, y: pt.y + ro.y } }
      })
      const cand: PackedComponent = {
        ...comp,
        center: pt,
        ccwRotationOffset: ang,
        pads,
      }
      this.lastEvaluatedPositionShadows.push(cand)
      if (!this.checkOverlapWithPackedComponents(cand)) {
        Object.assign(comp, cand)
        setPackedComponentPadCenters(comp)
        return
      }
    }
    /* fallback: 0° rotation */
    comp.center = pt
    comp.ccwRotationOffset = 0
    setPackedComponentPadCenters(comp)
  }

  private placeComponentDisconnected(
    comp: PackedComponent,
    outlines: Segment[][],
    dir: NonNullable<PackInput["disconnectedPackDirection"]>,
  ) {
    const target = this.findBestPointForDisconnected(outlines, dir)
    this.placeComponentAtPoint(comp, target)
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
          label: ((shadow.ccwRotationOffset / Math.PI) * 180).toFixed(1),
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

      if (this.lastBestPointsResult) {
        for (const bestPoint of this.lastBestPointsResult.bestPoints) {
          graphics.points!.push({
            x: bestPoint.x,
            y: bestPoint.y,
            label: `bestPoint\nnetworkId: ${bestPoint.networkId}\nd=${this.lastBestPointsResult.distance}`,
          } as Point)
        }
      }
    }

    return graphics
  }

  getResult(): PackedComponent[] {
    return this.packedComponents
  }

  private computeSumDistanceForPosition(
    component: PackedComponent,
    position: Point,
    targetNetworkId: NetworkId,
  ): number {
    // Get pads from the component that are on the target network
    const componentPadsOnNetwork = component.pads.filter(
      (p) => p.networkId === targetNetworkId,
    )

    if (componentPadsOnNetwork.length === 0) return 0

    // Get all packed pads on the same network
    const packedPadsOnNetwork = this.packedComponents.flatMap((c) =>
      c.pads.filter((p) => p.networkId === targetNetworkId),
    )

    if (packedPadsOnNetwork.length === 0) return 0

    let sumDistance = 0

    // For each pad on the target network in the component being placed
    for (const componentPad of componentPadsOnNetwork) {
      // Calculate where this pad would be if the component is placed at position
      const padPosition = {
        x: position.x + componentPad.offset.x,
        y: position.y + componentPad.offset.y,
      }

      // Find the minimum distance to any packed pad on the same network
      let minDistance = Number.POSITIVE_INFINITY
      for (const packedPad of packedPadsOnNetwork) {
        const distance = Math.hypot(
          padPosition.x - packedPad.absoluteCenter.x,
          padPosition.y - packedPad.absoluteCenter.y,
        )
        if (distance < minDistance) {
          minDistance = distance
        }
      }

      // Add to sum distance (if no packed pads found, distance is 0 as specified)
      sumDistance += minDistance === Number.POSITIVE_INFINITY ? 0 : minDistance
    }

    return sumDistance
  }
}
