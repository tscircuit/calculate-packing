import { describe, it, expect } from "bun:test"
import { PackSolver2 } from "../lib/PackSolver2/PackSolver2"
import { SingleComponentPackSolver } from "../lib/SingleComponentPackSolver/SingleComponentPackSolver"
import { constructOutlinesFromPackedComponents } from "../lib/constructOutlinesFromPackedComponents"
import input from "./repros/repro04_packInput.json"
import type { PackInput, PackedComponent } from "../lib/types"
import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"

const capturedInputs: Array<{
  components: PackedComponent[]
  minGap: number
  stepNumber: number
}> = []

// Custom SingleComponentPackSolver that logs constructOutlines calls
class LoggingSingleComponentPackSolver extends SingleComponentPackSolver {
  override _setup() {
    super._setup()
    // Log the initial call to constructOutlines
    if (this.packedComponents && this.packedComponents.length > 0) {
      capturedInputs.push({
        components: JSON.parse(JSON.stringify(this.packedComponents)),
        minGap: this.minGap,
        stepNumber: capturedInputs.length
      })
    }
  }
  
  override _step() {
    const prevLength = capturedInputs.length
    super._step()
    // If outlines were reconstructed during the step, log it
    if (this.packedComponents && this.packedComponents.length > 0) {
      // Only log if this is a new state (components changed or different minGap)
      const currentState = {
        components: JSON.parse(JSON.stringify(this.packedComponents)),
        minGap: this.minGap,
        stepNumber: capturedInputs.length
      }
      
      // Simple check to avoid duplicates
      const isDuplicate = capturedInputs.some(prev => 
        prev.components.length === currentState.components.length &&
        prev.minGap === currentState.minGap
      )
      
      if (!isDuplicate) {
        capturedInputs.push(currentState)
      }
    }
  }
}

// Custom PackSolver2 that uses our logging solver
class LoggingPackSolver2 extends PackSolver2 {
  override _step() {
    if (this.componentToPack && this.activeSubSolver == null) {
      this.activeSubSolver = new LoggingSingleComponentPackSolver({
        componentToPack: this.componentToPack!,
        packedComponents: this.packedComponents,
        minGap: this.packInput.minGap,
        minPadMargin: this.packInput.minPadMargin,
        maxPadMargin: this.packInput.maxPadMargin,
        packPlacementStrategy: this.packInput.packPlacementStrategy,
      })
    }
    
    // Log initial state if we have packed components
    if (this.packedComponents.length > 0) {
      const currentState = {
        components: JSON.parse(JSON.stringify(this.packedComponents)),
        minGap: this.packInput.minGap ?? 0,
        stepNumber: capturedInputs.length
      }
      
      const isDuplicate = capturedInputs.some(prev => 
        prev.components.length === currentState.components.length &&
        prev.minGap === currentState.minGap
      )
      
      if (!isDuplicate) {
        capturedInputs.push(currentState)
      }
    }
    
    super._step()
  }
}

describe("Extract construct outline inputs", () => {
  it("should capture all constructOutlinesFromPackedComponents inputs from repro04", async () => {
    const packInput = input as PackInput
    const solver = new LoggingPackSolver2(packInput)
    
    // Clear any previous captures
    capturedInputs.length = 0
    
    // Run the solver to completion
    while (!solver.solved && !solver.failed && solver.iterations < 1000) {
      solver.step()
    }
    
    console.log(`Captured ${capturedInputs.length} constructOutlinesFromPackedComponents calls`)
    
    // Create output directory
    const outputDir = join(process.cwd(), "site", "construct-outline-inputs")
    try {
      mkdirSync(outputDir, { recursive: true })
    } catch (e) {
      // Directory might already exist
    }
    
    // Write each captured input to a JSON file
    for (let i = 0; i < capturedInputs.length; i++) {
      const input = capturedInputs[i]
      const filename = `construct-outline-input-${i.toString().padStart(2, '0')}.json`
      const filepath = join(outputDir, filename)
      
      writeFileSync(filepath, JSON.stringify(input, null, 2))
      console.log(`Wrote ${filename} with ${input.components.length} components, minGap: ${input.minGap}`)
    }
    
    // Verify we captured at least some inputs
    expect(capturedInputs.length).toBeGreaterThan(0)
    expect(capturedInputs[0].components).toBeDefined()
    expect(typeof capturedInputs[0].minGap).toBe('number')
  })
})