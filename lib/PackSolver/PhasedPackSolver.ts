import { BaseSolver } from "../solver-utils/BaseSolver"
import { getComponentBounds } from "../geometry/getComponentBounds"
import { constructOutlinesFromPackedComponents } from "../constructOutlinesFromPackedComponents"
import type {
  InputComponent,
  NetworkId,
  PackedComponent,
  PackInput,
} from "../types"
import type { GraphicsObject, Line, Point, Rect } from "graphics-debug"
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

type PackingPhase =
  | "idle"
  | "show_candidate_points"
  | "show_rotations"
  | "show_final_placement"

interface RotationTrial extends PackedComponent {
  cost: number
}

export class PhasedPackSolver extends BaseSolver {
  packInput: PackInput

  unpackedComponentQueue!: InputComponent[]
  packedComponents!: PackedComponent[]

  // Phase management
  currentPhase: PackingPhase = "idle"
  currentComponent?: InputComponent
  phaseData: {
    candidatePoints?: Array<Point & { networkId: NetworkId; distance: number }>
    goodCandidates?: Array<Point & { networkId: NetworkId }>
    bestDistance?: number
    rotationTrials?: Array<RotationTrial>
    selectedRotation?: PackedComponent
    outlines?: Segment[][]
  } = {}

  // Legacy compatibility
  lastBestPointsResult?: {
    goodCandidates: (Point & { networkId: NetworkId })[]
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
      packFirst,
    })
    this.packedComponents = []
    this.currentPhase = "idle"
    this.phaseData = {}
  }

  override _step() {
    // Already solved?
    if (this.solved) return

    // Handle phase transitions
    switch (this.currentPhase) {
      case "idle":
        // Start new component placement
        if (this.unpackedComponentQueue.length === 0) {
          this.solved = true
          return
        }

        this.currentComponent = this.unpackedComponentQueue.shift()
        if (!this.currentComponent) {
          this.solved = true
          return
        }

        // Special case: first component
        if (this.packedComponents.length === 0) {
          this.placeFirstComponent()
          this.currentComponent = undefined // Clear current component
          return
        }

        this.currentPhase = "show_candidate_points"
        this.computeCandidatePoints()
        break

      case "show_candidate_points":
        // Just show candidate points, then move to rotations
        this.currentPhase = "show_rotations"
        this.computeRotationTrials()
        break

      case "show_rotations":
        // Show rotation trials, then move to final placement
        this.currentPhase = "show_final_placement"
        this.selectBestRotation()
        break

      case "show_final_placement":
        // Finalize the placement
        this.finalizeComponentPlacement()
        this.currentPhase = "idle"
        this.phaseData = {}
        break
    }
  }

  private placeFirstComponent(): void {
    if (!this.currentComponent) return

    const newPackedComponent: PackedComponent = {
      ...this.currentComponent,
      center: { x: 0, y: 0 },
      ccwRotationOffset: 0,
      pads: this.currentComponent.pads.map((p) => ({
        ...p,
        absoluteCenter: { x: 0, y: 0 },
      })),
    }

    const candidateAngles = this.getCandidateAngles(newPackedComponent)
    newPackedComponent.ccwRotationOffset = candidateAngles[0] ?? 0
    setPackedComponentPadCenters(newPackedComponent)
    this.packedComponents.push(newPackedComponent)
    this.currentComponent = undefined
  }

  private computeCandidatePoints(): void {
    if (!this.currentComponent) return

    const {
      minGap = 0,
      disconnectedPackDirection = "nearest_to_center",
      packPlacementStrategy = "shortest_connection_along_outline",
    } = this.packInput

    const newPackedComponent: PackedComponent = {
      ...this.currentComponent,
      center: { x: 0, y: 0 },
      ccwRotationOffset: 0,
      pads: this.currentComponent.pads.map((p) => ({
        ...p,
        absoluteCenter: { x: 0, y: 0 },
      })),
    }

    const padMargins = newPackedComponent.pads.map(
      (p) => Math.max(p.size.x, p.size.y) / 2,
    )
    const additionalGap = Math.max(...padMargins)

    const outlines = constructOutlinesFromPackedComponents(
      this.packedComponents,
      { minGap: minGap + additionalGap },
    )

    this.phaseData.outlines = outlines

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
      // No shared networks - use disconnected placement
      this.phaseData.candidatePoints = []
      this.phaseData.goodCandidates = []

      // Handle disconnected placement separately
      const shadows = placeComponentDisconnected({
        component: newPackedComponent,
        outlines,
        direction: disconnectedPackDirection as NonNullable<
          PackInput["disconnectedPackDirection"]
        >,
        packedComponents: this.packedComponents,
        candidateAngles: this.getCandidateAngles(newPackedComponent),
        checkOverlap: (comp) => this.checkOverlapWithPackedComponents(comp),
      })

      this.phaseData.selectedRotation = newPackedComponent
      this.phaseData.rotationTrials = shadows.map((s) => ({ ...s, cost: 0 }))
      return
    }

    // Compute candidate points for connected placement
    const candidatePoints: Array<
      Point & { networkId: NetworkId; distance: number }
    > = []
    const goodCandidates: Array<Point & { networkId: NetworkId }> = []
    let smallestDistance = Number.POSITIVE_INFINITY

    // Track best point for each segment to ensure at least one per segment
    const segmentBestPoints = new Map<
      string,
      { point: Point & { networkId: NetworkId }; distance: number }
    >()

    // Helper to create unique key for segment
    const getSegmentKey = (segment: Segment): string => {
      const [p1, p2] = segment
      return `${p1.x.toFixed(6)},${p1.y.toFixed(6)}-${p2.x.toFixed(6)},${p2.y.toFixed(6)}`
    }

    // Get segments for each shared network
    const networkIdToAlreadyPackedSegments = new Map<NetworkId, Segment[]>()
    for (const sharedNetworkId of sharedNetworkIds) {
      const segments: Segment[] = []
      for (const packedComponent of this.packedComponents) {
        for (const pad of packedComponent.pads) {
          if (pad.networkId === sharedNetworkId) {
            segments.push(...getSegmentsFromPad(pad))
          }
        }
      }
      networkIdToAlreadyPackedSegments.set(sharedNetworkId, segments)
    }

    if (
      packPlacementStrategy === "minimum_sum_distance_to_network" ||
      packPlacementStrategy === "minimum_sum_squared_distance_to_network"
    ) {
      // Use ternary search strategy
      for (const outline of outlines) {
        for (const outlineSegment of outline) {
          const [p1, p2] = outlineSegment

          for (const sharedNetworkId of sharedNetworkIds) {
            const {
              point: optimalPoint,
              distance: optimalDistance,
              candidatePoints: searchPoints,
            } = findOptimalPointOnSegment({
              p1,
              p2,
              component: newPackedComponent,
              networkId: sharedNetworkId,
              packedComponents: this.packedComponents,
              useSquaredDistance:
                packPlacementStrategy ===
                "minimum_sum_squared_distance_to_network",
            })

            // Add all search points
            for (const searchPoint of searchPoints) {
              candidatePoints.push(searchPoint)
            }

            // Track best point for this segment
            const segmentKey = getSegmentKey(outlineSegment)
            const currentSegmentBest = segmentBestPoints.get(segmentKey)
            if (
              !currentSegmentBest ||
              optimalDistance < currentSegmentBest.distance
            ) {
              segmentBestPoints.set(segmentKey, {
                point: { ...optimalPoint, networkId: sharedNetworkId },
                distance: optimalDistance,
              })
            }

            if (optimalDistance < smallestDistance + 1e-6) {
              if (optimalDistance < smallestDistance - 1e-6) {
                goodCandidates.length = 0
                goodCandidates.push({
                  ...optimalPoint,
                  networkId: sharedNetworkId,
                })
                smallestDistance = optimalDistance
              } else {
                goodCandidates.push({
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

            // Add as candidate point
            candidatePoints.push({
              ...nearestPointOnOutlineToAlreadyPackedSegments,
              networkId: sharedNetworkId,
              distance: outlineToAlreadyPackedSegmentsDist,
            })

            // Track best point for this segment
            const segmentKey = getSegmentKey(outlineSegment)
            const currentSegmentBest = segmentBestPoints.get(segmentKey)
            if (
              !currentSegmentBest ||
              outlineToAlreadyPackedSegmentsDist < currentSegmentBest.distance
            ) {
              segmentBestPoints.set(segmentKey, {
                point: {
                  ...nearestPointOnOutlineToAlreadyPackedSegments,
                  networkId: sharedNetworkId,
                },
                distance: outlineToAlreadyPackedSegmentsDist,
              })
            }

            if (outlineToAlreadyPackedSegmentsDist < smallestDistance + 1e-6) {
              if (
                outlineToAlreadyPackedSegmentsDist <
                smallestDistance - 1e-6
              ) {
                goodCandidates.length = 0
                goodCandidates.push({
                  ...nearestPointOnOutlineToAlreadyPackedSegments,
                  networkId: sharedNetworkId,
                })
                smallestDistance = outlineToAlreadyPackedSegmentsDist
              } else {
                goodCandidates.push({
                  ...nearestPointOnOutlineToAlreadyPackedSegments,
                  networkId: sharedNetworkId,
                })
              }
            }
          }
        }
      }
    }

    // Add systematic sampling points
    for (const sharedNetworkId of sharedNetworkIds) {
      for (const outline of outlines) {
        for (const outlineSegment of outline) {
          const [p1, p2] = outlineSegment
          for (let t = 0; t <= 1; t += 0.2) {
            const sampledPoint = {
              x: p1.x + t * (p2.x - p1.x),
              y: p1.y + t * (p2.y - p1.y),
            }

            // Calculate distance for this point
            let distance = 0
            const componentPadsOnNetwork = newPackedComponent.pads.filter(
              (p) => p.networkId === sharedNetworkId,
            )

            for (const componentPad of componentPadsOnNetwork) {
              let minDist = Number.POSITIVE_INFINITY
              for (const packedComponent of this.packedComponents) {
                for (const packedPad of packedComponent.pads) {
                  if (packedPad.networkId === sharedNetworkId) {
                    const dx =
                      sampledPoint.x +
                      componentPad.offset.x -
                      packedPad.absoluteCenter.x
                    const dy =
                      sampledPoint.y +
                      componentPad.offset.y -
                      packedPad.absoluteCenter.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    minDist = Math.min(minDist, dist)
                  }
                }
              }
              distance += minDist
            }

            const point = {
              ...sampledPoint,
              networkId: sharedNetworkId,
              distance,
            }
            candidatePoints.push(point)

            if (distance < smallestDistance) {
              smallestDistance = distance
              goodCandidates.length = 0
              goodCandidates.push(point)
            } else if (distance === smallestDistance) {
              goodCandidates.push(point)
            }
          }
        }
      }
    }

    // Ensure at least one point from each segment is in goodCandidates
    for (const [, segmentBest] of segmentBestPoints) {
      // Check if this segment's best point is already in goodCandidates
      const isAlreadyIncluded = goodCandidates.some(
        (gc) =>
          Math.abs(gc.x - segmentBest.point.x) < 1e-6 &&
          Math.abs(gc.y - segmentBest.point.y) < 1e-6 &&
          gc.networkId === segmentBest.point.networkId,
      )

      if (!isAlreadyIncluded) {
        goodCandidates.push(segmentBest.point)
      }
    }

    this.phaseData.candidatePoints = candidatePoints
    this.phaseData.goodCandidates = goodCandidates
    this.phaseData.bestDistance = smallestDistance

    // Legacy compatibility
    this.lastCandidatePoints = candidatePoints
    this.lastBestPointsResult = { goodCandidates, distance: smallestDistance }
  }

  private computeRotationTrials(): void {
    if (!this.currentComponent || !this.phaseData.goodCandidates) return

    const newPackedComponent: PackedComponent = {
      ...this.currentComponent,
      center: { x: 0, y: 0 },
      ccwRotationOffset: 0,
      pads: this.currentComponent.pads.map((p) => ({
        ...p,
        absoluteCenter: { x: 0, y: 0 },
      })),
    }

    const rotationTrials: RotationTrial[] = []
    const candidateAngles = this.getCandidateAngles(newPackedComponent)

    // Try multiple candidate points, not just best points
    const allCandidatePoints = [...this.phaseData.goodCandidates]

    // Add sampling points if we have outlines
    if (this.phaseData.outlines) {
      for (const networkId of new Set(
        this.phaseData.goodCandidates.map((p) => p.networkId),
      )) {
        for (const outline of this.phaseData.outlines) {
          for (const outlineSegment of outline) {
            const [p1, p2] = outlineSegment
            for (let t = 0; t <= 1; t += 0.2) {
              allCandidatePoints.push({
                x: p1.x + t * (p2.x - p1.x),
                y: p1.y + t * (p2.y - p1.y),
                networkId: networkId,
              })
            }
          }
        }
      }
    }

    // Use selectOptimalRotation to get the best placement
    const useSquaredDistance =
      this.packInput.packPlacementStrategy ===
      "minimum_sum_squared_distance_to_network"

    const result = selectOptimalRotation({
      component: newPackedComponent,
      candidatePoints: allCandidatePoints,
      packedComponents: this.packedComponents,
      minGap: this.packInput.minGap ?? 0,
      useSquaredDistance: useSquaredDistance,
      checkOverlap: (comp) => this.checkOverlapWithPackedComponents(comp),
    })

    // Create rotation trials for visualization
    for (const angle of candidateAngles) {
      for (const point of this.phaseData.goodCandidates.slice(0, 3)) {
        // Show top 3 positions
        const trial = { ...newPackedComponent }
        trial.center = { ...point }
        trial.ccwRotationOffset = angle
        setPackedComponentPadCenters(trial)

        // Calculate cost
        let cost = 0
        for (const pad of trial.pads) {
          let minDist = Number.POSITIVE_INFINITY
          for (const packedComp of this.packedComponents) {
            for (const packedPad of packedComp.pads) {
              if (packedPad.networkId === pad.networkId) {
                const dx = pad.absoluteCenter.x - packedPad.absoluteCenter.x
                const dy = pad.absoluteCenter.y - packedPad.absoluteCenter.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                minDist = Math.min(minDist, dist)
              }
            }
          }
          if (minDist < Number.POSITIVE_INFINITY) {
            cost += useSquaredDistance ? minDist * minDist : minDist
          }
        }

        rotationTrials.push({ ...trial, cost })
      }
    }

    this.phaseData.rotationTrials = rotationTrials

    // Convert RotationCandidate to PackedComponent
    if (result) {
      const selectedComponent = { ...newPackedComponent }
      selectedComponent.center = result.center
      selectedComponent.ccwRotationOffset = result.angle
      selectedComponent.pads = result.pads
      this.phaseData.selectedRotation = selectedComponent
    } else {
      this.phaseData.selectedRotation = undefined
    }

    // Legacy compatibility
    this.lastEvaluatedPositionShadows = rotationTrials
  }

  private selectBestRotation(): void {
    // Already done in computeRotationTrials, just need to confirm
    if (!this.phaseData.selectedRotation && this.currentComponent) {
      // Fallback
      const newPackedComponent: PackedComponent = {
        ...this.currentComponent,
        center: { x: 5, y: 5 },
        ccwRotationOffset: 0,
        pads: this.currentComponent.pads.map((p) => ({
          ...p,
          absoluteCenter: { x: 0, y: 0 },
        })),
      }
      const candidateAngles = this.getCandidateAngles(newPackedComponent)
      newPackedComponent.ccwRotationOffset = candidateAngles[0] ?? 0
      setPackedComponentPadCenters(newPackedComponent)
      this.phaseData.selectedRotation = newPackedComponent
    }
  }

  private finalizeComponentPlacement(): void {
    if (!this.phaseData.selectedRotation) return

    this.packedComponents.push(this.phaseData.selectedRotation)
    this.currentComponent = undefined
  }

  /** Visualize the current packing state based on the current phase */
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
    graphics.rects ??= []

    // Make packed components more visible by updating their fill
    if (graphics.rects) {
      for (const rect of graphics.rects) {
        if (rect.fill === "rgba(0,0,0,0.25)") {
          // This is a component rectangle, make it more visible
          rect.fill = "rgba(100,100,100,0.5)"
          rect.stroke = "#333333"
        }
      }
    }

    // Always show outlines
    const outlines = constructOutlinesFromPackedComponents(
      this.packedComponents ?? [],
      {
        minGap: this.packInput.minGap,
      },
    )

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

    // Add phase indicator
    graphics.texts ??= []
    graphics.texts.push({
      text: `Phase: ${this.currentPhase}`,
      x: 0,
      y: 5,
      fontSize: 0.3,
    })

    if (this.currentComponent) {
      graphics.texts.push({
        text: `Packing: ${this.currentComponent.componentId}`,
        x: 0,
        y: 4.5,
        fontSize: 0.25,
      })
    }

    // Phase-specific visualization
    switch (this.currentPhase) {
      case "show_candidate_points":
        this.visualizeCandidatePoints(graphics)
        break

      case "show_rotations":
        this.visualizeRotationTrials(graphics)
        break

      case "show_final_placement":
        this.visualizeFinalPlacement(graphics)
        break

      case "idle":
        // Show nothing extra when idle
        break
    }

    return graphics
  }

  private visualizeCandidatePoints(graphics: GraphicsObject): void {
    // Show all candidate points
    if (this.phaseData.candidatePoints) {
      for (const candidatePoint of this.phaseData.candidatePoints) {
        graphics.points!.push({
          x: candidatePoint.x,
          y: candidatePoint.y,
          label: `d=${candidatePoint.distance.toFixed(3)}`,
          fill: "rgba(255,165,0,0.6)", // Orange color for candidate points
          radius: 0.02,
        } as Point)
      }
    }

    // Show best points with X markers
    if (this.phaseData.goodCandidates) {
      for (const goodCandidate of this.phaseData.goodCandidates) {
        graphics.points!.push({
          x: goodCandidate.x,
          y: goodCandidate.y,
          label: `BEST (d=${this.phaseData.bestDistance?.toFixed(3)})`,
          fill: "rgba(0,255,0,0.8)", // Green color for best points
          radius: 0.03,
        } as Point)

        // Add X marker
        const crossSize = 0.2
        graphics.lines!.push(
          {
            points: [
              {
                x: goodCandidate.x - crossSize,
                y: goodCandidate.y - crossSize,
              },
              {
                x: goodCandidate.x + crossSize,
                y: goodCandidate.y + crossSize,
              },
            ],
            stroke: "#00AA00",
          } as Line,
          {
            points: [
              {
                x: goodCandidate.x - crossSize,
                y: goodCandidate.y + crossSize,
              },
              {
                x: goodCandidate.x + crossSize,
                y: goodCandidate.y - crossSize,
              },
            ],
            stroke: "#00AA00",
          } as Line,
        )
      }
    }
  }

  private visualizeRotationTrials(graphics: GraphicsObject): void {
    if (!this.phaseData.rotationTrials) return

    for (const trial of this.phaseData.rotationTrials) {
      const bounds = getComponentBounds(trial, 0)
      graphics.rects!.push({
        center: trial.center,
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY,
        fill: "rgba(0,255,255,0.2)",
        label: `${trial.ccwRotationOffset}° (cost: ${trial.cost.toFixed(3)})`,
      } as Rect)

      // Show pads for each rotation trial
      for (const pad of trial.pads) {
        graphics.rects!.push({
          center: pad.absoluteCenter,
          width: pad.size.x,
          height: pad.size.y,
          fill: "rgba(0,0,255,0.5)",
        } as Rect)
      }
    }
  }

  private visualizeFinalPlacement(graphics: GraphicsObject): void {
    if (!this.phaseData.selectedRotation) return

    const component = this.phaseData.selectedRotation
    const bounds = getComponentBounds(component, 0)

    // Show the final placed component more prominently
    graphics.rects!.push({
      center: component.center,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
      fill: "rgba(0,255,0,0.3)",
      stroke: "#00FF00",
      strokeWidth: 0.05,
      label: `PLACED at ${component.ccwRotationOffset}°`,
    } as Rect)

    // Show the pads
    for (const pad of component.pads) {
      graphics.rects!.push({
        center: pad.absoluteCenter,
        width: pad.size.x,
        height: pad.size.y,
        fill: "rgba(0,255,0,0.7)",
      } as Rect)
    }
  }

  override getConstructorParams() {
    return [this.packInput]
  }

  getResult(): PackedComponent[] {
    return this.packedComponents
  }

  /* ---------- small helpers ------------------------------------------------ */

  private getCandidateAngles(c: InputComponent): number[] {
    return (c.availableRotationDegrees ?? [0, 90, 180, 270]).map((d) => d % 360)
  }

  private checkOverlapWithPackedComponents(
    component: PackedComponent,
  ): boolean {
    return checkOverlapWithPackedComponents({
      component,
      packedComponents: this.packedComponents,
      minGap: this.packInput.minGap ?? 0,
    })
  }
}
