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

  lastBestPoint?: Point & { distance: number }

  constructor(input: PackInput) {
    console.log("PackSolver constructor", input)
    super()
    this.packInput = input
  }

  override _setup() {
    console.log("packInput", this.packInput)
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
    const networkIdToNewPackedSegments = new Map<NetworkId, Segment[]>()

    for (const sharedNetworkId of sharedNetworkIds) {
      networkIdToAlreadyPackedSegments.set(sharedNetworkId, [])
      networkIdToNewPackedSegments.set(sharedNetworkId, [])
      for (const packedComponent of this.packedComponents) {
        for (const pad of packedComponent.pads) {
          if (pad.networkId !== sharedNetworkId) continue
          const segments = getSegmentsFromPad(pad)
          networkIdToAlreadyPackedSegments.set(sharedNetworkId, segments)
        }
      }
      for (const pad of newPackedComponent.pads) {
        if (pad.networkId !== sharedNetworkId) continue
        const segments = getSegmentsFromPad(pad)
        networkIdToNewPackedSegments.set(sharedNetworkId, segments)
      }
    }

    // Find the point along the outline that minimizes the distance of the pad
    // to the next nearest pad on the network
    let smallestDistance = Number.POSITIVE_INFINITY
    let bestPoint: Point = { x: 0, y: 0 }
    for (const outline of outlines) {
      for (const outlineSegment of outline) {
        for (const sharedNetworkId of sharedNetworkIds) {
          const alreadyPackedSegments =
            networkIdToAlreadyPackedSegments.get(sharedNetworkId)
          const newPackedSegments =
            networkIdToNewPackedSegments.get(sharedNetworkId)
          if (!alreadyPackedSegments || !newPackedSegments) continue
          const nearestPoint = computeNearestPointOnSegmentForSegmentSet(
            outlineSegment,
            alreadyPackedSegments,
          )
          const nearestPointOnNewPackedSegments =
            computeNearestPointOnSegmentForSegmentSet(
              outlineSegment,
              newPackedSegments,
            )
          const distance = Math.hypot(
            nearestPoint.x - nearestPointOnNewPackedSegments.x,
            nearestPoint.y - nearestPointOnNewPackedSegments.y,
          )
          if (distance < smallestDistance) {
            smallestDistance = distance
            bestPoint = nearestPoint
          }
        }
      }
    }

    this.lastBestPoint = { ...bestPoint, distance: smallestDistance }

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

    if (this.lastBestPoint) {
      graphics.points!.push({
        x: this.lastBestPoint.x,
        y: this.lastBestPoint.y,
        label: `bestPoint: d=${this.lastBestPoint.distance}`,
      } as Point)
    }

    return graphics
  }

  getResult(): PackedComponent[] {
    return this.packedComponents
  }
}
