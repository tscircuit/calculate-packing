import type { GraphicsObject } from "graphics-debug"
import { setPackedComponentPadCenters } from "../PackSolver/setPackedComponentPadCenters"
import { sortComponentQueue } from "../PackSolver/sortComponentQueue"
import { SingleComponentPackSolver } from "../SingleComponentPackSolver/SingleComponentPackSolver"
import { BaseSolver } from "../solver-utils/BaseSolver"
import type {
  InputComponent,
  OutputPad,
  PackedComponent,
  PackInput,
} from "../types"
import { getColorForString } from "lib/testing/createColorMapFromStrings"

export class PackSolver2 extends BaseSolver {
  declare activeSubSolver: SingleComponentPackSolver | null | undefined

  packInput: PackInput

  unpackedComponentQueue: InputComponent[] = []
  packedComponents: PackedComponent[] = []
  componentToPack?: InputComponent | null | undefined

  constructor(packInput: PackInput) {
    super()
    this.packInput = packInput
  }

  override getConstructorParams() {
    return this.packInput
  }

  override _setup() {
    const { components, packOrderStrategy, packFirst = [] } = this.packInput

    this.unpackedComponentQueue = sortComponentQueue({
      components,
      packOrderStrategy,
      packFirst,
    })
    this.packedComponents = []
  }

  private packFirstComponent(): void {
    const firstComponentToPack = this.unpackedComponentQueue.shift()!

    const newPackedComponent: PackedComponent = {
      ...firstComponentToPack,
      center: { x: 0, y: 0 },
      ccwRotationOffset: 0,
      pads: firstComponentToPack.pads.map((p) => ({
        ...p,
        absoluteCenter: { x: 0, y: 0 },
      })),
    }

    setPackedComponentPadCenters(newPackedComponent)
    this.packedComponents.push(newPackedComponent)
  }

  override _step() {
    if (this.solved || this.failed) return

    // Special case: first component (when no components are packed yet)
    if (this.packedComponents.length === 0) {
      if (this.unpackedComponentQueue.length === 0) {
        this.solved = true
        return
      }
      this.packFirstComponent()
      return
    }

    // If we have an active sub-solver, continue with it
    if (!this.activeSubSolver) {
      // Need to start a new component
      if (this.unpackedComponentQueue.length === 0) {
        this.solved = true
        return
      }

      this.componentToPack = this.unpackedComponentQueue.shift()
      if (!this.componentToPack) {
        this.solved = true
        return
      }
      this.activeSubSolver = new SingleComponentPackSolver({
        packedComponents: this.packedComponents,
        componentToPack: this.componentToPack,
        packPlacementStrategy: this.packInput.packPlacementStrategy,
        minGap: this.packInput.minGap,
        obstacles: this.packInput.obstacles ?? [],
      })
      this.activeSubSolver.setup()
    }

    this.activeSubSolver.step()

    if (this.activeSubSolver.failed) {
      this.failed = true
      return
    }

    if (this.activeSubSolver.solved) {
      // Get the result from the SingleComponentPackSolver
      const result = this.activeSubSolver.getResult()
      if (result) {
        this.packedComponents.push(result)
      } else {
        // Fallback if solver didn't produce a result
        const packedComponent: PackedComponent = {
          ...this.componentToPack!,
          center: { x: 0, y: 0 },
          ccwRotationOffset: 0,
          pads: this.componentToPack!.pads.map((p) => ({
            ...p,
            absoluteCenter: { x: 0, y: 0 },
          })),
        }
        setPackedComponentPadCenters(packedComponent)
        this.packedComponents.push(packedComponent)
      }
      this.componentToPack = undefined
      this.activeSubSolver = undefined
    }
  }

  override visualize(): GraphicsObject {
    if (this.activeSubSolver) {
      return this.activeSubSolver.visualize()
    }

    // Create a visualization of the packed components
    const graphics: Required<GraphicsObject> = {
      coordinateSystem: "cartesian",
      title: "Pack Solver 2",
      points: [],
      lines: [],
      rects: [],
      circles: [],
      texts: [],
    }

    // Draw obstacles from PackInput (if any)
    if (this.packInput.obstacles && this.packInput.obstacles.length > 0) {
      for (const obstacle of this.packInput.obstacles) {
        graphics.rects!.push({
          center: obstacle.absoluteCenter,
          width: obstacle.width,
          height: obstacle.height,
          fill: "rgba(0,0,0,0.1)",
          stroke: "#555",
          label: obstacle.obstacleId,
        })
      }
    }

    if (this.packedComponents.length === 0) {
      // Show all the components in the queue at (0,0)
      for (const component of this.unpackedComponentQueue) {
        for (const pad of component.pads) {
          graphics.rects!.push({
            center: { x: 0, y: 0 },
            width: pad.size.x,
            height: pad.size.y,
            fill: "rgba(0,0,0,0.1)",
          })
        }
      }
    }

    const allPads = this.packedComponents.flatMap((c) => c.pads)
    const networkToPadMap = new Map<string, OutputPad[]>()
    for (const pad of allPads) {
      if (pad.networkId) {
        networkToPadMap.set(pad.networkId, [
          ...(networkToPadMap.get(pad.networkId) || []),
          pad,
        ])
      }
    }

    for (const pad of allPads) {
      graphics.rects!.push({
        center: pad.absoluteCenter,
        width: pad.size.x,
        height: pad.size.y,
        fill: "rgba(255,0,0,0.5)",
      })
    }

    for (const [networkId, pads] of networkToPadMap.entries()) {
      for (let i = 0; i < pads.length; i++) {
        for (let j = i + 1; j < pads.length; j++) {
          const pad1 = pads[i]!
          const pad2 = pads[j]!
          graphics.lines!.push({
            points: [pad1.absoluteCenter, pad2.absoluteCenter],
            strokeColor: getColorForString(networkId, 0.5),
          })
        }
      }
    }

    return graphics
  }
}
