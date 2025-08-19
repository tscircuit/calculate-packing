import type { GraphicsObject } from "graphics-debug"
import { setPackedComponentPadCenters } from "../PackSolver/setPackedComponentPadCenters"
import { sortComponentQueue } from "../PackSolver/sortComponentQueue"
import { SingleComponentPackSolver } from "../SingleComponentPackSolver/SingleComponentPackSolver"
import { BaseSolver } from "../solver-utils/BaseSolver"
import type { InputComponent, PackedComponent, PackInput } from "../types"

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
    return super.visualize()
  }
}
