import type { GraphicsObject, Line, Point, Rect } from "graphics-debug"
import { constructOutlinesFromPackedComponents } from "../constructOutlinesFromPackedComponents"
import { OutlineSegmentCandidatePointSolver } from "../OutlineSegmentCandidatePointSolver/OutlineSegmentCandidatePointSolver"
import { setPackedComponentPadCenters } from "../PackSolver2/setPackedComponentPadCenters"
import { BaseSolver } from "@tscircuit/solver-utils"
import { getGraphicsFromPackOutput } from "../testing/getGraphicsFromPackOutput"
import type { Segment } from "../geometry/types"
import type {
  InputComponent,
  PackedComponent,
  PackPlacementStrategy,
  InputObstacle,
  PackInput,
} from "../types"
import { isStrongConnection } from "../utils/isStrongConnection"
import { checkOverlapWithPackedComponents } from "lib/PackSolver2/checkOverlapWithPackedComponents"
import { computeDistanceBetweenBoxes, type Bounds } from "@tscircuit/math-utils"
import { isPointInPolygon } from "lib/math/isPointInPolygon"
import { getComponentBounds } from "lib/geometry/getComponentBounds"

type Phase = "outline" | "segment_candidate" | "evaluate"

interface QueuedOutlineSegment {
  segment: Segment
  availableRotations: number[]
  segmentIndex: number
  ccwFullOutline: Segment[] // The entire outline containing this segment
}

interface CandidateResult {
  segment: Segment
  rotation: number
  optimalPosition?: Point
  distance: number
  segmentIndex: number
  rotationIndex: number
}

/**
 * Packs a single component given a set of already packed components.
 *
 * Runs subsolvers and operates in several phases:
 * Phase 1: Compute outline (visualization shows outline)
 * Phase 2: Compute candidate point for each segment by finding the optimal
 *          point on each segment of the outline for each rotation-segment pair.
 *          (visualization shows candidate point for active segment using the
 *           visualize method of the OutlineSegmentCandidatePointSolver)
 * Phase 3: Score the points. Show the points in visualization with a "step"
 *          where step=0 is the best point (lowest distance) and step=N is the
 *          worst point.
 */
export class SingleComponentPackSolver extends BaseSolver {
  componentToPack: InputComponent
  packedComponents: PackedComponent[]
  packPlacementStrategy: PackPlacementStrategy
  minGap: number
  obstacles: InputObstacle[]
  boundaryOutline?: Array<{ x: number; y: number }>
  weightedConnections?: PackInput["weightedConnections"]

  override getSolverName(): string {
    return "SingleComponentPackSolver"
  }

  // Phase management
  currentPhase: Phase = "outline"
  outlines: Segment[][] = []
  queuedOutlineSegments: QueuedOutlineSegment[] = []
  currentSegmentIndex = 0
  currentRotationIndex = 0
  override activeSubSolver?: OutlineSegmentCandidatePointSolver | null = null
  candidateResults: CandidateResult[] = []
  rejectedCandidates: Array<CandidateResult & { gapDistance: number }> = []
  bestCandidate?: CandidateResult
  outputPackedComponent?: PackedComponent
  bounds?: Bounds

  constructor(params: {
    componentToPack: InputComponent
    packedComponents: PackedComponent[]
    packPlacementStrategy: PackPlacementStrategy
    minGap?: number
    obstacles?: InputObstacle[]
    bounds?: Bounds
    boundaryOutline?: Array<{ x: number; y: number }>
    weightedConnections?: PackInput["weightedConnections"]
  }) {
    super()
    this.componentToPack = params.componentToPack
    this.packedComponents = params.packedComponents
    this.packPlacementStrategy = params.packPlacementStrategy
    this.minGap = params.minGap ?? 0
    this.obstacles = params.obstacles ?? []
    this.bounds = params.bounds
    this.boundaryOutline = params.boundaryOutline
    this.weightedConnections = params.weightedConnections
  }

  override _setup() {
    super._setup()
    this.currentPhase = "outline"
    this.outlines = []
    this.queuedOutlineSegments = []
    this.candidateResults = []
    this.activeSubSolver = undefined
    this.currentSegmentIndex = 0
    this.currentRotationIndex = 0
  }

  override _step() {
    if (this.solved || this.failed) return

    switch (this.currentPhase) {
      case "outline":
        this.executeOutlinePhase()
        break
      case "segment_candidate":
        this.executeSegmentCandidatePhase()
        break
      case "evaluate":
        this.executeEvaluatePhase()
        break
    }
  }

  private executeOutlinePhase() {
    // Special case: if no packed components, attempt center; if too close to obstacles, fall back to outline-based placement
    if (this.packedComponents.length === 0) {
      const availableRotations = this.componentToPack
        .availableRotationDegrees ?? [0, 90, 180, 270]
      const position = { x: 0, y: 0 }
      const rotation = availableRotations[0] ?? 0

      // Build candidate at center and verify obstacle clearance
      const candidate = this.createPackedComponent(position, rotation)
      const tooCloseToObstacles = (this.obstacles ?? []).some((obs) => {
        const obsBox = {
          center: { x: obs.absoluteCenter.x, y: obs.absoluteCenter.y },
          width: obs.width,
          height: obs.height,
        }
        return candidate.pads.some((p) => {
          const padBox = {
            center: { x: p.absoluteCenter.x, y: p.absoluteCenter.y },
            width: p.size.x,
            height: p.size.y,
          }
          const { distance } = computeDistanceBetweenBoxes(padBox, obsBox)
          return distance + 1e-6 < this.minGap
        })
      })

      if (!tooCloseToObstacles) {
        this.outputPackedComponent = candidate
        this.solved = true
        return
      }
      // Otherwise, fall through to outline construction using obstacles
    }

    // Construct outlines from packed components (and obstacles)
    this.outlines = constructOutlinesFromPackedComponents(
      this.packedComponents,
      {
        minGap: this.minGap,
        obstacles: this.obstacles,
      },
    )

    // Queue all segment-rotation pairs
    const availableRotations = this.componentToPack
      .availableRotationDegrees ?? [0, 90, 180, 270]

    for (
      let segmentIndex = 0;
      segmentIndex < this.outlines.length;
      segmentIndex++
    ) {
      const outline = this.outlines[segmentIndex]!
      for (let i = 0; i < outline.length; i++) {
        const segment = outline[i]!
        this.queuedOutlineSegments.push({
          segment,
          availableRotations: [...availableRotations],
          segmentIndex: segmentIndex * 1000 + i, // Unique index across all outlines
          ccwFullOutline: outline, // Pass the entire outline containing this segment
        })
      }
    }

    // Also add boundary outline segments if available
    // This allows components to be placed in empty areas along the board edges
    // where no packed components exist to create outline segments
    if (this.boundaryOutline && this.boundaryOutline.length >= 3) {
      const boundarySegments: Segment[] = []
      for (let i = 0; i < this.boundaryOutline.length; i++) {
        const p1 = this.boundaryOutline[i]!
        const p2 = this.boundaryOutline[(i + 1) % this.boundaryOutline.length]!
        boundarySegments.push([p1, p2])
      }

      // Add boundary segments with a unique segment index offset
      const boundaryOutlineIndex = this.outlines.length
      for (let i = 0; i < boundarySegments.length; i++) {
        const segment = boundarySegments[i]!
        this.queuedOutlineSegments.push({
          segment,
          availableRotations: [...availableRotations],
          segmentIndex: boundaryOutlineIndex * 1000 + i,
          ccwFullOutline: boundarySegments,
        })
      }
    }

    // Add obstacle boundary segments for isolated obstacles
    // This allows components to be placed adjacent to obstacles that aren't
    // connected to the main packed component cluster
    let obstacleOutlineIndex = this.outlines.length + 1
    for (const obstacle of this.obstacles) {
      const hw = obstacle.width / 2 + this.minGap
      const hh = obstacle.height / 2 + this.minGap
      const cx = obstacle.absoluteCenter.x
      const cy = obstacle.absoluteCenter.y

      // Create a CCW outline around the obstacle (including minGap)
      const obstacleCorners = [
        { x: cx - hw, y: cy - hh },
        { x: cx + hw, y: cy - hh },
        { x: cx + hw, y: cy + hh },
        { x: cx - hw, y: cy + hh },
      ]

      const obstacleSegments: Segment[] = [
        [obstacleCorners[0]!, obstacleCorners[1]!], // bottom
        [obstacleCorners[1]!, obstacleCorners[2]!], // right
        [obstacleCorners[2]!, obstacleCorners[3]!], // top
        [obstacleCorners[3]!, obstacleCorners[0]!], // left
      ]

      for (let i = 0; i < obstacleSegments.length; i++) {
        const segment = obstacleSegments[i]!
        this.queuedOutlineSegments.push({
          segment,
          availableRotations: [...availableRotations],
          segmentIndex: obstacleOutlineIndex * 1000 + i,
          ccwFullOutline: obstacleSegments,
        })
      }
      obstacleOutlineIndex++
    }

    // Move to next phase
    this.currentPhase = "segment_candidate"
    this.currentSegmentIndex = 0
    this.currentRotationIndex = 0
  }

  private executeSegmentCandidatePhase() {
    if (this.activeSubSolver?.solved || this.activeSubSolver?.failed) {
      const queuedSegment =
        this.queuedOutlineSegments[this.currentSegmentIndex]!
      const rotation =
        queuedSegment.availableRotations[this.currentRotationIndex]!

      let distance = Infinity
      let optimalPosition: Point | undefined

      if (this.activeSubSolver.solved && this.activeSubSolver.optimalPosition) {
        optimalPosition = this.activeSubSolver.optimalPosition

        // Check if this candidate overlaps with any packed components
        const candidateComponent = this.createPackedComponent(
          optimalPosition,
          rotation,
        )
        const { hasOverlap, gapDistance } = checkOverlapWithPackedComponents({
          component: candidateComponent,
          packedComponents: this.packedComponents,
          minGap: this.minGap,
        })

        // Also ensure we keep minGap from any obstacles
        let minObstacleGapDistance = Infinity
        const tooCloseToObstacles = (this.obstacles ?? []).some((obs) => {
          const obsBox = {
            center: { x: obs.absoluteCenter.x, y: obs.absoluteCenter.y },
            width: obs.width,
            height: obs.height,
          }
          return candidateComponent.pads.some((p) => {
            const padBox = {
              center: { x: p.absoluteCenter.x, y: p.absoluteCenter.y },
              width: p.size.x,
              height: p.size.y,
            }
            const { distance } = computeDistanceBetweenBoxes(padBox, obsBox)
            minObstacleGapDistance = Math.min(minObstacleGapDistance, distance)
            return distance + 1e-6 < this.minGap
          })
        })

        // Check if component is outside bounds
        let outsideBounds = false
        if (this.bounds) {
          const componentBounds = getComponentBounds(candidateComponent, 0)

          outsideBounds =
            componentBounds.minX < this.bounds.minX ||
            componentBounds.maxX > this.bounds.maxX ||
            componentBounds.minY < this.bounds.minY ||
            componentBounds.maxY > this.bounds.maxY
        }

        // Check if component is outside boundary outline
        let outsideBoundaryOutline = false
        if (this.boundaryOutline && this.boundaryOutline.length >= 3) {
          const componentBounds = getComponentBounds(candidateComponent, 0)

          // Check if all pads are within the boundary outline
          const allPadsInside = candidateComponent.pads.every((pad) =>
            isPointInPolygon(pad.absoluteCenter, this.boundaryOutline!),
          )

          // Also check corners of component bounds
          const cornersInside = [
            { x: componentBounds.minX, y: componentBounds.minY },
            { x: componentBounds.minX, y: componentBounds.maxY },
            { x: componentBounds.maxX, y: componentBounds.minY },
            { x: componentBounds.maxX, y: componentBounds.maxY },
          ].every((corner) => isPointInPolygon(corner, this.boundaryOutline!))

          outsideBoundaryOutline = !allPadsInside || !cornersInside
        }

        // Calculate distance based on pack strategy
        distance = this.calculateDistance(optimalPosition, rotation)

        if (hasOverlap) {
          this.rejectedCandidates.push({
            segment: queuedSegment.segment,
            rotation,
            optimalPosition,
            distance,
            segmentIndex: queuedSegment.segmentIndex,
            rotationIndex: this.currentRotationIndex,
            gapDistance: gapDistance!,
          })
        } else if (tooCloseToObstacles) {
          this.rejectedCandidates.push({
            segment: queuedSegment.segment,
            rotation,
            optimalPosition,
            distance,
            segmentIndex: queuedSegment.segmentIndex,
            rotationIndex: this.currentRotationIndex,
            gapDistance: minObstacleGapDistance,
          })
        } else if (outsideBounds) {
          this.rejectedCandidates.push({
            segment: queuedSegment.segment,
            rotation,
            optimalPosition,
            distance,
            segmentIndex: queuedSegment.segmentIndex,
            rotationIndex: this.currentRotationIndex,
            gapDistance: -1, // Special marker for bounds violation
          })
        } else if (outsideBoundaryOutline) {
          this.rejectedCandidates.push({
            segment: queuedSegment.segment,
            rotation,
            optimalPosition,
            distance,
            segmentIndex: queuedSegment.segmentIndex,
            rotationIndex: this.currentRotationIndex,
            gapDistance: -1, // Special marker for boundary violation
          })
        } else {
          // Store candidate result
          this.candidateResults.push({
            segment: queuedSegment.segment,
            rotation,
            optimalPosition,
            distance,
            segmentIndex: queuedSegment.segmentIndex,
            rotationIndex: this.currentRotationIndex,
          })
        }
      }

      // Move to next rotation
      this.currentRotationIndex++
      this.activeSubSolver = undefined
    }

    // Check if we need to start a new segment-rotation pair
    while (!this.activeSubSolver) {
      if (this.currentSegmentIndex >= this.queuedOutlineSegments.length) {
        // All segments processed, move to evaluation phase
        this.currentPhase = "evaluate"
        return
      }

      const queuedSegment =
        this.queuedOutlineSegments[this.currentSegmentIndex]!
      if (
        this.currentRotationIndex >= queuedSegment.availableRotations.length
      ) {
        // All rotations for this segment processed, move to next segment
        this.currentSegmentIndex++
        this.currentRotationIndex = 0
        continue
      }

      const rotation =
        queuedSegment.availableRotations[this.currentRotationIndex]!

      // Create new OutlineSegmentCandidatePointSolver
      this.activeSubSolver = new OutlineSegmentCandidatePointSolver({
        outlineSegment: queuedSegment.segment,
        ccwFullOutline: queuedSegment.ccwFullOutline,
        componentRotationDegrees: rotation,
        packStrategy: this.packPlacementStrategy,
        minGap: this.minGap,
        packedComponents: this.packedComponents,
        componentToPack: this.componentToPack,
        obstacles: this.obstacles,
        globalBounds: this.bounds,
        boundaryOutline: this.boundaryOutline,
        weightedConnections: this.weightedConnections,
      })

      this.activeSubSolver.setup()
      break
    }

    // Step the active subsolver
    this.activeSubSolver.step()
  }

  private executeEvaluatePhase() {
    // Find the best candidate (lowest distance)
    if (this.candidateResults.length === 0) {
      this.failed = true
      this.error = "No valid candidates found"
      return
    }

    // Sort candidates by distance (ascending)
    this.candidateResults.sort((a, b) => a.distance - b.distance)
    this.bestCandidate = this.candidateResults[0]!

    // Create the output packed component
    if (this.bestCandidate.optimalPosition) {
      this.outputPackedComponent = this.createPackedComponent(
        this.bestCandidate.optimalPosition,
        this.bestCandidate.rotation,
      )
    }

    this.solved = true
  }

  private calculateDistance(position: Point, rotation: number): number {
    // Create temporary packed component to calculate network distances
    const tempComponent = this.createPackedComponent(position, rotation)

    let totalDistance = 0
    const useSquaredDistance =
      this.packPlacementStrategy ===
        "minimum_sum_squared_distance_to_network" ||
      this.packPlacementStrategy === "minimum_closest_sum_squared_distance"

    // Calculate sum of distances to all pads on same networks
    for (const pad of tempComponent.pads) {
      let minDistanceToNetwork = Infinity

      for (const packedComponent of this.packedComponents) {
        for (const packedPad of packedComponent.pads) {
          if (packedPad.networkId === pad.networkId) {
            // Check if this is a strong connection (should be considered)
            // or a weak connection (should be ignored when weightedConnections is provided)
            if (
              !isStrongConnection(
                pad.padId,
                packedPad.padId,
                this.weightedConnections,
              )
            ) {
              continue // Skip weak connections
            }

            const dx = pad.absoluteCenter.x - packedPad.absoluteCenter.x
            const dy = pad.absoluteCenter.y - packedPad.absoluteCenter.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            minDistanceToNetwork = Math.min(minDistanceToNetwork, dist)
          }
        }
      }

      if (minDistanceToNetwork < Infinity) {
        totalDistance += useSquaredDistance
          ? minDistanceToNetwork * minDistanceToNetwork
          : minDistanceToNetwork
      }
    }

    return totalDistance
  }

  private createPackedComponent(
    position: Point,
    rotation: number,
  ): PackedComponent {
    const component: PackedComponent = {
      ...this.componentToPack,
      center: position,
      ccwRotationOffset: rotation,
      pads: this.componentToPack.pads.map((pad) => ({
        ...pad,
        absoluteCenter: { x: 0, y: 0 }, // Will be set by setPackedComponentPadCenters
      })),
    }

    setPackedComponentPadCenters(component)
    return component
  }

  override visualize(): GraphicsObject {
    if (this.activeSubSolver) {
      return this.activeSubSolver.visualize()
    }
    const graphics: GraphicsObject = getGraphicsFromPackOutput({
      components: this.packedComponents,
      minGap: this.minGap,
      packOrderStrategy: "largest_to_smallest",
      packPlacementStrategy: this.packPlacementStrategy,
    })

    graphics.points ??= []
    graphics.lines ??= []
    graphics.rects ??= []
    graphics.texts ??= []
    graphics.circles ??= []

    // Draw obstacles from PackInput (if any)
    if (this.obstacles && this.obstacles.length > 0) {
      for (const obstacle of this.obstacles) {
        graphics.rects!.push({
          center: obstacle.absoluteCenter,
          width: obstacle.width,
          height: obstacle.height,
          fill: "rgba(0,0,0,0.1)",
          stroke: "#555",
          label: obstacle.obstacleId,
        } as Rect)
      }
    }

    if (this.bounds) {
      graphics.lines!.push({
        points: [
          { x: this.bounds.minX, y: this.bounds.minY },
          { x: this.bounds.minX, y: this.bounds.maxY },
          { x: this.bounds.maxX, y: this.bounds.maxY },
          { x: this.bounds.maxX, y: this.bounds.minY },
          { x: this.bounds.minX, y: this.bounds.minY },
        ],
        strokeColor: "rgba(0,0,0,0.5)",
        strokeDash: "2 2",
      })
    }

    if (this.boundaryOutline && this.boundaryOutline.length) {
      const outlinePoints = [...this.boundaryOutline]
      if (
        outlinePoints.length > 0 &&
        (outlinePoints[0]!.x !== outlinePoints[outlinePoints.length - 1]!.x ||
          outlinePoints[0]!.y !== outlinePoints[outlinePoints.length - 1]!.y)
      ) {
        outlinePoints.push({ ...outlinePoints[0]! })
      }

      graphics.lines!.push({
        points: outlinePoints,
        strokeColor: "rgba(0, 0, 255, 0.5)",
        strokeDash: "4 2",
      })
    }

    switch (this.currentPhase) {
      case "outline":
        this.visualizeOutlinePhase(graphics)
        break
      case "segment_candidate":
        this.visualizeSegmentCandidatePhase(graphics)
        break
      case "evaluate":
        this.visualizeEvaluatePhase(graphics)
        break
    }

    return graphics
  }

  private visualizeOutlinePhase(graphics: GraphicsObject) {
    // Show outlines with lines
    for (const outline of this.outlines) {
      for (const segment of outline) {
        const [p1, p2] = segment
        graphics.lines!.push({
          points: [p1, p2],
          strokeColor: "#ff4444",
        } as Line)
      }
    }
    for (let i = 0; i < this.outlines.length; i++) {
      const outline = this.outlines[i]!
      for (let u = 0; u < outline.length; u++) {
        const [p1, p2] = outline[u]!
        graphics.points!.push({
          x: p1.x,
          y: p1.y,
          label: `outlines [${i}] [${u}]`,
          color: "#ff4444",
        } as Point)
      }
    }
  }

  private visualizeSegmentCandidatePhase(graphics: GraphicsObject) {
    // Show all outlines
    this.visualizeOutlinePhase(graphics)

    // Show active subsolver visualization if present
    if (this.activeSubSolver) {
      const subSolverViz = this.activeSubSolver.visualize()

      // Merge subsolver graphics
      if (subSolverViz.lines) graphics.lines!.push(...subSolverViz.lines)
      if (subSolverViz.points) graphics.points!.push(...subSolverViz.points)
      if (subSolverViz.rects) graphics.rects!.push(...subSolverViz.rects)
      if (subSolverViz.circles)
        graphics.circles!.push(...(subSolverViz.circles ?? []))
    } else {
      // Show all candidate results with their pads when no active sub solver
      for (let i = 0; i < this.candidateResults.length; i++) {
        const candidate = this.candidateResults[i]!

        if (candidate.optimalPosition) {
          // Create a temporary packed component at this candidate position
          const tempComponent = this.createPackedComponent(
            candidate.optimalPosition,
            candidate.rotation,
          )

          // Draw all pads for this candidate
          for (const pad of tempComponent.pads) {
            graphics.rects!.push({
              center: pad.absoluteCenter,
              width: pad.size.x,
              height: pad.size.y,
              fill: `rgba(255,165,0,0.3)`,
              stroke: `rgba(255,165,0,0.8)`,
              strokeWidth: 1,
            } as Rect)
          }

          // Draw the candidate point
          graphics.points!.push({
            x: candidate.optimalPosition.x,
            y: candidate.optimalPosition.y,
            label: `c${i}, d=${candidate.distance.toFixed(3)}`,
            color: "rgba(255,165,0,0.8)",
          } as Point)
        }
      }
    }
  }

  private visualizeEvaluatePhase(graphics: GraphicsObject) {
    // Show all outlines
    this.visualizeOutlinePhase(graphics)

    // Show all candidate points with step values (step=0 is best)
    for (let i = 0; i < this.candidateResults.length; i++) {
      const candidate = this.candidateResults[i]!
      if (!candidate.optimalPosition) continue
      const step = i // Since we sorted by distance, index is the step
      const isBest = step === 0

      graphics.points!.push({
        x: candidate.optimalPosition.x,
        y: candidate.optimalPosition.y,
        label: `step=${step}, d=${candidate.distance.toFixed(3)}`,
        color: isBest ? "rgba(0,255,0,0.8)" : "rgba(255,165,0,0.6)",
      } as Point)
    }

    for (let i = 0; i < this.rejectedCandidates.length; i++) {
      const candidate = this.rejectedCandidates[i]!
      if (!candidate.optimalPosition) continue
      graphics.points!.push({
        x: candidate.optimalPosition.x,
        y: candidate.optimalPosition.y,
        label: `rejected, d=${candidate.distance.toFixed(3)}\ngap_distance=${candidate.gapDistance}`,
        color: "rgba(255,0,0,0.8)",
      } as Point)
    }

    // Show the final placed component if available
    if (this.outputPackedComponent) {
      for (const pad of this.outputPackedComponent.pads) {
        graphics.rects!.push({
          center: pad.absoluteCenter,
          width: pad.size.x,
          height: pad.size.y,
          fill: "rgba(0,255,0,0.7)",
        } as Rect)
      }
    }
  }

  getResult(): PackedComponent | undefined {
    return this.outputPackedComponent
  }

  override getOutput() {
    return this.getResult()
  }

  override getConstructorParams() {
    return {
      componentToPack: this.componentToPack,
      packedComponents: this.packedComponents,
      packPlacementStrategy: this.packPlacementStrategy,
      minGap: this.minGap,
      obstacles: this.obstacles,
      bounds: this.bounds,
      boundaryOutline: this.boundaryOutline,
      weightedConnections: this.weightedConnections,
    }
  }
}
