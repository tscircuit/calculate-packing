import type { GraphicsObject } from "graphics-debug"
import { setPackedComponentPadCenters } from "lib/PackSolver/setPackedComponentPadCenters"
import { sortComponentQueue } from "lib/PackSolver/sortComponentQueue"
import { SingleComponentPackSolver } from "lib/SingleComponentPackSolver/SingleComponentPackSolver"
import { BaseSolver } from "lib/solver-utils/BaseSolver"
import type { InputComponent, PackedComponent, PackInput } from "lib/types"

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
      this.packedComponents.push(this.activeSubSolver.packedComponent)
    }
  }

  override visualize(): GraphicsObject {
    return super.visualize()
  }
}
