import type { GraphicsObject } from "graphics-debug"
import { setPackedComponentPadCenters } from "./setPackedComponentPadCenters"
import { sortComponentQueue } from "./sortComponentQueue"
import { SingleComponentPackSolver } from "../SingleComponentPackSolver/SingleComponentPackSolver"
import { BaseSolver } from "../solver-utils/BaseSolver"
import type {
  InputComponent,
  OutputPad,
  PackedComponent,
  PackInput,
} from "../types"
import { getColorForString } from "lib/testing/createColorMapFromStrings"
import { computeDistanceBetweenBoxes } from "@tscircuit/math-utils"

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

    // If there are obstacles, ensure at least minGap clearance; otherwise fall back to outline-based placement
    const obstacles = this.packInput.obstacles ?? []
    const tooCloseToObstacles = obstacles.some((obs) => {
      const obsBox = {
        center: { x: obs.absoluteCenter.x, y: obs.absoluteCenter.y },
        width: obs.width,
        height: obs.height,
      }
      return newPackedComponent.pads.some((p) => {
        const padBox = {
          center: { x: p.absoluteCenter.x, y: p.absoluteCenter.y },
          width: p.size.x,
          height: p.size.y,
        }
        const { distance } = computeDistanceBetweenBoxes(padBox, obsBox)
        return distance + 1e-6 < this.packInput.minGap
      })
    })

    if (!tooCloseToObstacles) {
      this.packedComponents.push(newPackedComponent)
      return
    }

    // Attempt to place along obstacle outlines using the SingleComponentPackSolver
    const fallbackSolver = new SingleComponentPackSolver({
      packedComponents: [],
      componentToPack: firstComponentToPack,
      packPlacementStrategy: this.packInput.packPlacementStrategy,
      minGap: this.packInput.minGap,
      obstacles: obstacles,
      bounds: this.packInput.bounds,
      boundaryOutline: this.packInput.boundaryOutline,
    })
    fallbackSolver.solve()
    const result = fallbackSolver.getResult()
    if (result) {
      this.packedComponents.push(result)
    } else {
      // Fallback: place at center even if too close (should rarely happen)
      this.packedComponents.push(newPackedComponent)
    }
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
        bounds: this.packInput.bounds,
        boundaryOutline: this.packInput.boundaryOutline,
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

    if (this.packInput.bounds) {
      graphics.lines!.push({
        points: [
          { x: this.packInput.bounds.minX, y: this.packInput.bounds.minY },
          { x: this.packInput.bounds.minX, y: this.packInput.bounds.maxY },
          { x: this.packInput.bounds.maxX, y: this.packInput.bounds.maxY },
          { x: this.packInput.bounds.maxX, y: this.packInput.bounds.minY },
          { x: this.packInput.bounds.minX, y: this.packInput.bounds.minY },
        ],
        strokeColor: "rgba(0,0,0,0.5)",
        strokeDash: "2 2",
      })
    }

    if (
      this.packInput.boundaryOutline &&
      this.packInput.boundaryOutline.length
    ) {
      const points = [...this.packInput.boundaryOutline]
      if (
        points.length > 0 &&
        (points[0]!.x !== points[points.length - 1]!.x ||
          points[0]!.y !== points[points.length - 1]!.y)
      ) {
        points.push({ ...points[0]! })
      }

      graphics.lines!.push({
        points,
        strokeColor: "rgba(0, 0, 255, 0.5)",
        strokeDash: "4 2",
      })
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
