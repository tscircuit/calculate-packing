import type { GraphicsObject } from "graphics-debug"
import { makeNumbersRounded } from "./makeNumbersRounded"

export class BaseSolver {
  MAX_ITERATIONS = 1000
  solved = false
  failed = false
  iterations = 0
  progress = 0
  error: string | null = null
  activeSubSolver?: BaseSolver | null
  failedSubSolvers?: BaseSolver[]
  timeToSolve?: number
  stats: Record<string, any> = {}
  _setupDone = false

  setup() {
    if (this._setupDone) return
    this._setup()
    this._setupDone = true
  }

  /** DO NOT OVERRIDE! Override _step() instead */
  step() {
    if (!this._setupDone) {
      this.setup()
    }
    if (this.solved) return
    if (this.failed) return
    this.iterations++
    try {
      this._step()
    } catch (e) {
      this.error = `${this.constructor.name} error: ${e}`
      console.error(this.error)
      this.failed = true
      throw e
    }
    if (!this.solved && this.iterations > this.MAX_ITERATIONS) {
      this.tryFinalAcceptance()
    }
    if (!this.solved && this.iterations > this.MAX_ITERATIONS) {
      this.error = `${this.constructor.name} ran out of iterations`
      console.error(this.error)
      this.failed = true
    }
    if ("computeProgress" in this) {
      // @ts-ignore
      this.progress = this.computeProgress() as number
    }
  }

  _setup() {}
  _step() {}

  getConstructorParams() {
    throw new Error("getConstructorParams not implemented")
  }

  solve() {
    const startTime = Date.now()
    while (!this.solved && !this.failed) {
      this.step()
    }
    const endTime = Date.now()
    this.timeToSolve = endTime - startTime
  }

  visualize(): GraphicsObject {
    return {
      lines: [],
      points: [],
      rects: [],
      circles: [],
    }
  }

  /**
   * Called when the solver is about to fail, but we want to see if we have an
   * "acceptable" or "passable" solution. Mostly used for optimizers that
   * have an aggressive early stopping criterion.
   */
  tryFinalAcceptance() {}

  /**
   * A lightweight version of the visualize method that can be used to stream
   * progress
   */
  preview(): GraphicsObject {
    return {
      lines: [],
      points: [],
      rects: [],
      circles: [],
    }
  }

  noisySolve() {
    const startTime = Date.now()
    while (!this.solved && !this.failed) {
      this.step()
      console.log(JSON.stringify(makeNumbersRounded(this.visualize())))
    }
    const endTime = Date.now()
    this.timeToSolve = endTime - startTime
  }
}
