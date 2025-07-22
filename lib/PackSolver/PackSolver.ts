import { BaseSolver } from "../solver-utils/BaseSolver"
import { getComponentBounds } from "../geometry/getComponentBounds"
import { rotatePoint } from "../math/rotatePoint"
import { constructOutlinesFromPackedComponents } from "../constructOutlinesFromPackedComponents"
import type { InputComponent, PackedComponent, PackInput } from "../types"

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
    const packed: PackedComponent = {
      ...next,
      center: { x: 0, y: 0 },
      ccwRotationOffset: 0,
      pads: next.pads.map((p) => ({
        ...p,
        absoluteCenter: { x: 0, y: 0 },
      })),
    }

    if (this.packedComponents.length === 0) {
      // First component at origin
      packed.center = { x: 0, y: 0 }
    } else {
      // Position relative to previous components (simple strategy)
      const outlines = constructOutlinesFromPackedComponents(
        this.packedComponents,
        { minGap },
      )
      // For the simple implementation take furthest right X of first outline
      let maxX = -Infinity
      outlines.forEach((outline) =>
        outline.forEach(([a, b]) => {
          maxX = Math.max(maxX, a.x, b.x)
        }),
      )
      const bounds = getComponentBounds(
        {
          ...packed,
          center: { x: 0, y: 0 },
          pads: packed.pads,
          ccwRotationOffset: 0,
        },
        0,
      )
      const width = bounds.maxX - bounds.minX
      // place to right with minGap
      packed.center = {
        x: maxX + width / 2 + minGap,
        y: 0,
      }
    }

    // Update absolute pad centers
    packed.pads = packed.pads.map((pad) => ({
      ...pad,
      absoluteCenter: {
        x: packed.center.x + pad.offset.x,
        y: packed.center.y + pad.offset.y,
      },
    }))

    this.packedComponents.push(packed)
  }

  getConstructorParams() {
    return [this.packInput]
  }

  getResult(): PackedComponent[] {
    return this.packedComponents
  }
}
