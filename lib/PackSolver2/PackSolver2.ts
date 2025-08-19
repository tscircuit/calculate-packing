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
    this.packFirstComponent()
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

    if (this.unpackedComponentQueue.length === 0) {
      this.solved = true
      return
    }

    if (!this.componentToPack || !this.activeSubSolver) {
      this.componentToPack = this.unpackedComponentQueue.shift()
      if (!this.componentToPack) {
        this.solved = true
        return
      }
      this.activeSubSolver = new SingleComponentPackSolver({
        packedComponents: this.packedComponents,
        componentToPack: this.componentToPack,
      })
    }

    this.activeSubSolver._step()

    if (this.activeSubSolver.failed) {
      this.failed = true
      return
    }

    if (this.activeSubSolver.solved) {
      // Convert the componentToPack to a PackedComponent and add it
      // TODO get the position and rotation from the solver
      const packedComponent: PackedComponent = {
        ...this.componentToPack!,
        center: { x: 0, y: 0 }, // This should be determined by the solver
        ccwRotationOffset: 0, // This should be determined by the solver
        pads: this.componentToPack!.pads.map((p) => ({
          ...p,
          absoluteCenter: { x: 0, y: 0 }, // This should be determined by the solver
        })),
      }
      this.packedComponents.push(packedComponent)
      this.componentToPack = undefined
      this.activeSubSolver = undefined
    }
  }

  override visualize(): GraphicsObject {
    return super.visualize()
  }
}
