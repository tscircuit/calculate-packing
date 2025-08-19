import type { Point } from "@tscircuit/math-utils"
import type { GraphicsObject } from "graphics-debug"
import { BaseSolver } from "lib/solver-utils/BaseSolver"
import { IrlsSolver } from "lib/solver-utils/IrlsSolver"
import type { InputComponent, PackedComponent } from "lib/types"

/**
 * Given a single segment on the outline, the component's rotation, compute the
 * optimal position for the rotated component (the position that minimizes the
 * packStrategy, generally minimizing the sum of the distances to other pads in
 * the network)
 *
 * To do this, we use the IRLS/Weiszfeld Weighted Least Squares algorithm, look
 * at the site/algorithm-visualizations/irls-weiszfeld-algorithm.page.tsx for
 * an interactive visualization of how it works.
 */
export class OutlineSegmentCandidatePointSolver extends BaseSolver {
  outlineSegment: [Point, Point]
  componentRotationDegrees: number
  packStrategy:
    | "minimum_sum_squared_distance_to_network"
    | "minimum_sum_distance_to_network"
  minGap: number
  packedComponents: PackedComponent[]
  componentToPack: InputComponent
  
  optimalPosition?: Point
  irlsSolver?: IrlsSolver

  constructor(params: {
    outlineSegment: [Point, Point]
    componentRotationDegrees: number
    packStrategy:
      | "minimum_sum_squared_distance_to_network"
      | "minimum_sum_distance_to_network"
    minGap: number
    packedComponents: PackedComponent[]
    componentToPack: InputComponent
  }) {
    super()
    this.outlineSegment = params.outlineSegment
    this.componentRotationDegrees = params.componentRotationDegrees
    this.packStrategy = params.packStrategy
    this.minGap = params.minGap
    this.packedComponents = params.packedComponents
    this.componentToPack = params.componentToPack
  }

  override getConstructorParams() {
    return {
      outlineSegment: this.outlineSegment,
      componentRotationDegrees: this.componentRotationDegrees,
      packStrategy: this.packStrategy,
      minGap: this.minGap,
      packedComponents: this.packedComponents,
      componentToPack: this.componentToPack,
    }
  }

  override _setup() {
    // Find target points from network connections
    const targetPoints = this.getNetworkTargetPoints()
    
    if (targetPoints.length === 0) {
      // No network connections, just place at segment midpoint
      const [p1, p2] = this.outlineSegment
      this.optimalPosition = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      }
      this.solved = true
      return
    }

    // Create constraint function to keep position on outline segment
    const constraintFn = (point: Point): Point => {
      return this.projectPointOntoSegment(point, this.outlineSegment)
    }

    // Use segment midpoint as initial position
    const [p1, p2] = this.outlineSegment
    const initialPosition = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    }

    this.irlsSolver = new IrlsSolver({
      targetPoints,
      initialPosition,
      constraintFn,
      epsilon: 1e-6,
      maxIterations: 50,
    })
  }

  override _step() {
    if (!this.irlsSolver) {
      this.solved = true
      return
    }

    this.irlsSolver.step()
    
    if (this.irlsSolver.solved) {
      this.optimalPosition = this.irlsSolver.getBestPosition()
      this.solved = true
    } else if (this.irlsSolver.failed) {
      this.failed = true
      this.error = this.irlsSolver.error
    }
  }

  /**
   * Get target points from network connections
   */
  private getNetworkTargetPoints(): Point[] {
    const targetPoints: Point[] = []
    
    // Get network IDs from component being placed
    const componentNetworkIds = new Set(
      this.componentToPack.pads.map(pad => pad.networkId)
    )
    
    // Find all packed pads that share networks with this component
    for (const packedComponent of this.packedComponents) {
      for (const pad of packedComponent.pads) {
        if (componentNetworkIds.has(pad.networkId)) {
          targetPoints.push(pad.absoluteCenter)
        }
      }
    }
    
    return targetPoints
  }

  /**
   * Project a point onto the outline segment
   */
  private projectPointOntoSegment(point: Point, segment: [Point, Point]): Point {
    const [p1, p2] = segment
    
    // Vector from p1 to p2
    const segmentX = p2.x - p1.x
    const segmentY = p2.y - p1.y
    
    // Vector from p1 to point
    const pointX = point.x - p1.x
    const pointY = point.y - p1.y
    
    // Project point onto segment line
    const segmentLengthSq = segmentX * segmentX + segmentY * segmentY
    
    if (segmentLengthSq === 0) {
      // Degenerate segment, return p1
      return { x: p1.x, y: p1.y }
    }
    
    // Parameter t represents position along segment (0 = p1, 1 = p2)
    const t = Math.max(0, Math.min(1, (pointX * segmentX + pointY * segmentY) / segmentLengthSq))
    
    return {
      x: p1.x + t * segmentX,
      y: p1.y + t * segmentY,
    }
  }

  override visualize(): GraphicsObject {
    const graphics: GraphicsObject = {
      lines: [],
      points: [],
      rects: [],
      circles: [],
    }

    // Draw outline segment
    const [p1, p2] = this.outlineSegment
    graphics.lines!.push({
      points: [p1, p2],
      strokeColor: "#2196F3",
      strokeWidth: 3,
    })

    // Draw target points if available
    if (this.irlsSolver) {
      const targetPoints = this.getNetworkTargetPoints()
      for (const point of targetPoints) {
        graphics.circles!.push({
          center: point,
          radius: 4,
          fill: "#4CAF50",
          stroke: "#2E7D32",
        })
      }

      // Draw current solver position
      const currentPos = this.irlsSolver.currentPosition
      graphics.circles!.push({
        center: currentPos,
        radius: 6,
        fill: "#f44336",
        stroke: "#d32f2f",
      })
    }

    // Draw optimal position if found
    if (this.optimalPosition) {
      graphics.circles!.push({
        center: this.optimalPosition,
        radius: 8,
        fill: "rgba(76, 175, 80, 0.3)",
        stroke: "#4CAF50",
      })
    }

    return graphics
  }
}
