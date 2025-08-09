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
import {
  optimizeTranslationForMinimumSum,
  optimizeTranslationForMinimumSumWithSampling,
} from "./translationOptimizer"
import { selectOptimalRotation } from "./RotationSelector"

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
      // Respect rotation constraints even for the first component
      const candidateAngles = this.getCandidateAngles(newPackedComponent)
      newPackedComponent.ccwRotationOffset = candidateAngles[0] // Use first available rotation
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
            } = this.findOptimalPointOnSegment(
              p1,
              p2,
              newPackedComponent,
              sharedNetworkId,
              packPlacementStrategy ===
                "minimum_sum_squared_distance_to_network",
            )

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
      checkOverlap: (comp) => this.checkOverlapWithPackedComponents(comp),
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
      newPackedComponent.ccwRotationOffset = candidateAngles[0]
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

  private checkOverlapWithPackedComponents(cand: PackedComponent): boolean {
    // Use pad-to-pad distance checking for more accurate overlap detection
    for (const candPad of cand.pads) {
      for (const pc of this.packedComponents) {
        for (const packedPad of pc.pads) {
          // Calculate center-to-center distance
          const centerDistance = Math.hypot(
            candPad.absoluteCenter.x - packedPad.absoluteCenter.x,
            candPad.absoluteCenter.y - packedPad.absoluteCenter.y,
          )

          // Calculate minimum required center-to-center distance
          const candPadRadius = Math.max(candPad.size.x, candPad.size.y) / 2
          const packedPadRadius =
            Math.max(packedPad.size.x, packedPad.size.y) / 2
          const minRequiredDistance =
            this.packInput.minGap + candPadRadius + packedPadRadius

          if (centerDistance < minRequiredDistance) {
            return true // Overlap detected
          }
        }
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
        const ro = rotatePoint(p.offset, (ang * Math.PI) / 180) // Convert to radians for math
        
        /* rotate the pad dimensions based on component rotation */
        const normalizedRotation = ((ang % 360) + 360) % 360
        const shouldSwapDimensions = normalizedRotation === 90 || normalizedRotation === 270
        
        return { 
          ...p, 
          size: shouldSwapDimensions 
            ? { x: p.size.y, y: p.size.x } // Swap width/height for 90°/270° rotations
            : p.size, // Keep original dimensions for 0°/180° rotations
          absoluteCenter: { x: pt.x + ro.x, y: pt.y + ro.y } 
        }
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

  private computeSumDistanceForPosition(
    component: PackedComponent,
    position: Point,
    targetNetworkId: NetworkId,
    useSquaredDistance: boolean = false,
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
        const dx = padPosition.x - packedPad.absoluteCenter.x
        const dy = padPosition.y - packedPad.absoluteCenter.y
        const distance = useSquaredDistance
          ? dx * dx + dy * dy
          : Math.hypot(dx, dy)
        if (distance < minDistance) {
          minDistance = distance
        }
      }

      // Add to sum distance (if no packed pads found, distance is 0 as specified)
      sumDistance += minDistance === Number.POSITIVE_INFINITY ? 0 : minDistance
    }

    return sumDistance
  }

  /**
   * Find the optimal point along a segment that minimizes sum distance for a given network
   * Uses ternary search for continuous optimization
   */
  private findOptimalPointOnSegment(
    p1: Point,
    p2: Point,
    component: PackedComponent,
    networkId: NetworkId,
    useSquaredDistance: boolean = false,
  ): {
    point: Point
    distance: number
    candidatePoints: Array<Point & { networkId: NetworkId; distance: number }>
  } {
    const candidatePoints: Array<
      Point & { networkId: NetworkId; distance: number }
    > = []
    const tolerance = 1e-6
    let left = 0
    let right = 1

    // Function to interpolate point along segment
    const interpolatePoint = (t: number): Point => ({
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
    })

    // Function to evaluate sum distance at parameter t
    const evaluateDistance = (t: number): number => {
      const point = interpolatePoint(t)
      const distance = this.computeSumDistanceForPosition(
        component,
        point,
        networkId,
        useSquaredDistance,
      )

      // Store for visualization
      candidatePoints.push({
        ...point,
        networkId,
        distance,
      })

      return distance
    }

    // Ternary search to find minimum
    while (right - left > tolerance) {
      const leftThird = left + (right - left) / 3
      const rightThird = right - (right - left) / 3

      const leftDistance = evaluateDistance(leftThird)
      const rightDistance = evaluateDistance(rightThird)

      if (leftDistance > rightDistance) {
        left = leftThird
      } else {
        right = rightThird
      }
    }

    // Final optimal point
    const optimalT = (left + right) / 2
    const optimalPoint = interpolatePoint(optimalT)
    const optimalDistance = this.computeSumDistanceForPosition(
      component,
      optimalPoint,
      networkId,
      useSquaredDistance,
    )

    // Add optimal point to candidates
    candidatePoints.push({
      ...optimalPoint,
      networkId,
      distance: optimalDistance,
    })

    return {
      point: optimalPoint,
      distance: optimalDistance,
      candidatePoints,
    }
  }
}
