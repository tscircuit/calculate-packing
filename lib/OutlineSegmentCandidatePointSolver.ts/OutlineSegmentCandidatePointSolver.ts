import type { Point } from "@tscircuit/math-utils"
import type { GraphicsObject } from "graphics-debug"
import { BaseSolver } from "lib/solver-utils/BaseSolver"
import { IrlsSolver } from "lib/solver-utils/IrlsSolver"
import type { InputComponent, PackedComponent } from "lib/types"
import { rotatePoint } from "lib/math/rotatePoint"
import { getComponentBounds } from "lib/geometry/getComponentBounds"
import { getColorForString } from "lib/testing/createColorMapFromStrings"
import { pointInOutline } from "lib/geometry/pointInOutline"

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
  fullOutline: [Point, Point][] // The entire outline containing the segment
  componentRotationDegrees: number
  packStrategy:
    | "minimum_sum_squared_distance_to_network"
    | "minimum_sum_distance_to_network"
  minGap: number
  packedComponents: PackedComponent[]
  componentToPack: InputComponent

  optimalPosition?: Point
  irlsSolver?: IrlsSolver
  private outlineCentroid?: Point

  constructor(params: {
    outlineSegment: [Point, Point]
    fullOutline: [Point, Point][] // The entire outline containing the segment
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
    this.fullOutline = params.fullOutline
    this.componentRotationDegrees = params.componentRotationDegrees
    this.packStrategy = params.packStrategy
    this.minGap = params.minGap
    this.packedComponents = params.packedComponents
    this.componentToPack = params.componentToPack
  }

  override getConstructorParams() {
    return {
      outlineSegment: this.outlineSegment,
      fullOutline: this.fullOutline,
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
      const midpoint = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      }
      this.optimalPosition = this.adjustPositionForOutlineCollision(midpoint)
      this.solved = true
      return
    }

    // Create constraint function to keep position on outline segment and avoid collision
    const constraintFn = (point: Point): Point => {
      const projectedPoint = this.projectPointOntoSegment(
        point,
        this.outlineSegment,
      )
      return this.adjustPositionForOutlineCollision(projectedPoint)
    }

    // Use segment midpoint as initial position
    const [p1, p2] = this.outlineSegment
    const initialPosition = this.adjustPositionForOutlineCollision({
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    })

    this.irlsSolver = new IrlsSolver({
      targetPoints,
      initialPosition,
      constraintFn,
      epsilon: 1e-6,
      maxIterations: 50,
      useSquaredDistance:
        this.packStrategy === "minimum_sum_squared_distance_to_network",
    })
  }

  override _step() {
    if (!this.irlsSolver) {
      this.solved = true
      return
    }

    this.irlsSolver.step()

    if (this.irlsSolver.solved) {
      const rawPosition = this.irlsSolver.getBestPosition()
      this.optimalPosition = this.adjustPositionForOutlineCollision(rawPosition)
      this.solved = true
    } else if (this.irlsSolver.failed) {
      this.failed = true
      this.error = this.irlsSolver.error
    }
  }

  /**
   * Get target points from network connections, considering the component's rotation
   */
  private getNetworkTargetPoints(): Point[] {
    const targetPoints: Point[] = []

    // Get rotated pads for the component being placed
    const rotatedPads = this.getRotatedComponentPads()

    // Get network IDs from component being placed
    const componentNetworkIds = new Set(rotatedPads.map((pad) => pad.networkId))

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
  private projectPointOntoSegment(
    point: Point,
    segment: [Point, Point],
  ): Point {
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
    const t = Math.max(
      0,
      Math.min(1, (pointX * segmentX + pointY * segmentY) / segmentLengthSq),
    )

    return {
      x: p1.x + t * segmentX,
      y: p1.y + t * segmentY,
    }
  }

  /**
   * Get rotated pads for the component being placed
   */
  private getRotatedComponentPads() {
    const rotationRadians = (this.componentRotationDegrees * Math.PI) / 180
    return this.componentToPack.pads.map((pad) => ({
      ...pad,
      size:
        (this.componentRotationDegrees + 90) % 180 === 0
          ? {
              x: pad.size.y,
              y: pad.size.x,
            }
          : pad.size,
      offset: rotatePoint(pad.offset, rotationRadians),
    }))
  }

  /**
   * Create a temporary PackedComponent with the given center position and applied rotation
   */
  private createTemporaryPackedComponent(center: Point): PackedComponent {
    const rotationRadians = (this.componentRotationDegrees * Math.PI) / 180

    const flipWidthHeight = (this.componentRotationDegrees + 90) % 180 === 0

    return {
      componentId: this.componentToPack.componentId,
      center,
      ccwRotationOffset: this.componentRotationDegrees,
      pads: this.componentToPack.pads.map((pad) => {
        const rotatedOffset = rotatePoint(pad.offset, rotationRadians)
        return {
          ...pad,
          size: {
            x: flipWidthHeight ? pad.size.y : pad.size.x,
            y: flipWidthHeight ? pad.size.x : pad.size.y,
          },
          absoluteCenter: {
            x: center.x + rotatedOffset.x,
            y: center.y + rotatedOffset.y,
          },
        }
      }),
    }
  }

  /**
   * Adjust position to avoid component bounds crossing to the inside of the outline
   */
  private adjustPositionForOutlineCollision(center: Point): Point {
    // Create temporary component at this position
    const tempComponent = this.createTemporaryPackedComponent(center)

    // Get bounds of the rotated component
    const bounds = getComponentBounds(tempComponent, this.minGap)

    // Check if any corner of the component bounds is inside the outline
    const boundsCorners = [
      { x: bounds.minX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.maxY },
      { x: bounds.minX, y: bounds.maxY },
    ]

    let worstCorner: Point | null = null
    let maxPenetrationDistance = 0

    for (const corner of boundsCorners) {
      const location = pointInOutline(corner, this.fullOutline)

      if (location === "inside") {
        // This corner is inside the outline - we need to move it out
        // Find the distance to the nearest outline segment
        const distanceToSegment = this.getDistanceToNearestSegment(corner)

        if (distanceToSegment > maxPenetrationDistance) {
          maxPenetrationDistance = distanceToSegment
          worstCorner = corner
        }
      }
    }

    // If no corner is inside the outline, return the original center
    if (worstCorner === null) {
      return center
    }

    // Get the outward normal for the current segment to push the component out
    const outwardNormal = this.getOutwardNormal()
    const pushDistance = maxPenetrationDistance + 0.1 // Small buffer

    return {
      x: center.x + outwardNormal.x * pushDistance,
      y: center.y + outwardNormal.y * pushDistance,
    }
  }

  /**
   * Get the distance from a point to the nearest outline segment
   */
  private getDistanceToNearestSegment(point: Point): number {
    let minDistance = Infinity

    for (const segment of this.fullOutline) {
      const projectedPoint = this.projectPointOntoSegment(point, segment)
      const distance = Math.hypot(
        point.x - projectedPoint.x,
        point.y - projectedPoint.y,
      )
      minDistance = Math.min(minDistance, distance)
    }

    return minDistance
  }

  /**
   * Calculate the centroid of the entire outline
   */
  private getOutlineCentroid(): Point {
    if (this.outlineCentroid) {
      return this.outlineCentroid
    }

    let totalX = 0
    let totalY = 0
    let totalPoints = 0

    // Collect all unique points from the outline
    const uniquePoints = new Set<string>()
    const points: Point[] = []

    for (const segment of this.fullOutline) {
      const [p1, p2] = segment
      const p1Key = `${p1.x},${p1.y}`
      const p2Key = `${p2.x},${p2.y}`

      if (!uniquePoints.has(p1Key)) {
        uniquePoints.add(p1Key)
        points.push(p1)
        totalX += p1.x
        totalY += p1.y
        totalPoints++
      }
      if (!uniquePoints.has(p2Key)) {
        uniquePoints.add(p2Key)
        points.push(p2)
        totalX += p2.x
        totalY += p2.y
        totalPoints++
      }
    }

    if (totalPoints === 0) {
      this.outlineCentroid = { x: 0, y: 0 }
    } else {
      this.outlineCentroid = {
        x: totalX / totalPoints,
        y: totalY / totalPoints,
      }
    }

    return this.outlineCentroid
  }

  /**
   * Get the outward normal for the current segment by determining which side
   * is farther from the outline centroid
   */
  private getOutwardNormal(): Point {
    const [p1, p2] = this.outlineSegment
    const segmentX = p2.x - p1.x
    const segmentY = p2.y - p1.y
    const segmentLength = Math.hypot(segmentX, segmentY)

    if (segmentLength === 0) {
      return { x: 0, y: 1 } // Default normal for degenerate segment
    }

    // Normalized segment direction
    const segmentDirX = segmentX / segmentLength
    const segmentDirY = segmentY / segmentLength

    // Two possible normals (perpendicular to segment)
    const normal1X = -segmentDirY
    const normal1Y = segmentDirX
    const normal2X = segmentDirY
    const normal2Y = -segmentDirX

    // Get the outline centroid
    const centroid = this.getOutlineCentroid()

    // Get the midpoint of the segment
    const segmentMidpoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    }

    // Test points slightly offset from the segment midpoint in both normal directions
    const testDistance = 0.0001
    const testPoint1 = {
      x: segmentMidpoint.x + normal1X * testDistance,
      y: segmentMidpoint.y + normal1Y * testDistance,
    }
    const testPoint2 = {
      x: segmentMidpoint.x + normal2X * testDistance,
      y: segmentMidpoint.y + normal2Y * testDistance,
    }

    if (pointInOutline(testPoint1, this.fullOutline) === "outside") {
      return { x: normal1X, y: normal1Y }
    }
    if (pointInOutline(testPoint2, this.fullOutline) === "outside") {
      return { x: normal2X, y: normal2Y }
    }

    throw new Error("No outward normal found")
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
      label: "Outline Segment",
    })

    // Draw packed components
    for (const component of this.packedComponents) {
      // Draw pads
      for (const pad of component.pads) {
        graphics.rects!.push({
          center: pad.absoluteCenter,
          width: pad.size.x,
          height: pad.size.y,
          fill: pad.networkId === "VCC" ? "#FF6B6B" : "#4ECDC4",
          stroke: "#333",
          label: `${pad.padId} (${pad.networkId})`,
        })
      }
    }

    const pos = this.optimalPosition ??
      this.irlsSolver?.currentPosition ?? {
        x: 0,
        y: 0,
      }

    // Get rotated pads for drawing at optimal position
    const rotatedPads = this.getRotatedComponentPads()

    // Draw pads at optimal position with proper rotation
    for (const pad of rotatedPads) {
      const padPos = {
        x: pos.x + pad.offset.x,
        y: pos.y + pad.offset.y,
      }

      graphics.rects!.push({
        center: padPos,
        width: pad.size.x,
        height: pad.size.y,
        fill: getColorForString(pad.networkId, 0.5),
        stroke: "#333",
        label: `${pad.padId} (${pad.networkId})`,
      })

      // Draw connections to existing pads of same network
      for (const packedComponent of this.packedComponents) {
        for (const packedPad of packedComponent.pads) {
          if (packedPad.networkId === pad.networkId) {
            graphics.lines!.push({
              points: [padPos, packedPad.absoluteCenter],
              strokeColor: pad.networkId === "VCC" ? "#FF6B6B" : "#4ECDC4",
              strokeDash: [2, 2],
              label: `${pad.networkId} connection`,
            })
          }
        }
      }
    }

    // Draw target points if available
    if (this.irlsSolver) {
      const targetPoints = this.getNetworkTargetPoints()
      for (const point of targetPoints) {
        graphics.points!.push({
          ...point,
          color: "#4CAF50",
        })
      }

      // Draw current solver position
      const currentPos = this.irlsSolver.currentPosition
      graphics.points!.push({
        ...currentPos,
        color: "#f44336",
      })

      // Include IRLS solver visualization
      const solverViz = this.irlsSolver.visualize()

      // Merge solver graphics
      if (solverViz.lines) {
        graphics.lines!.push(...solverViz.lines)
      }
      if (solverViz.circles) {
        graphics.circles!.push(...solverViz.circles)
      }
      if (solverViz.rects) {
        graphics.rects!.push(...solverViz.rects)
      }
      if (solverViz.points) {
        graphics.points!.push(...solverViz.points)
      }
    }

    // Draw optimal position if found (as a point)
    if (this.optimalPosition) {
      graphics.points!.push({
        ...this.optimalPosition,
        color: "rgba(76, 175, 80, 0.3)",
      })
    }

    return graphics
  }
}
