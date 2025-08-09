import { test, expect } from "bun:test"
import { convertPackOutputToPackInput } from "../lib/plumbing/convertPackOutputToPackInput"
import { pack } from "../lib"
import type { PackOutput } from "../lib/types"

test("simulate PackDebugger step behavior with 90° constraint", () => {
  // Recreate the exact scenario from the page
  const staticPackOutput: PackOutput = {
    components: [
      {
        componentId: "U1",
        center: { x: 0, y: 0 },
        ccwRotationOffset: 0,
        availableRotationDegrees: [0],
        pads: [
          {
            padId: "U1_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: -5, y: 2 },
            size: { x: 1, y: 1 },
            absoluteCenter: { x: -5, y: 2 },
          },
          {
            padId: "U1_P2",
            networkId: "GND",
            type: "rect",
            offset: { x: -5, y: -2 },
            size: { x: 1, y: 1 },
            absoluteCenter: { x: -5, y: -2 },
          },
        ],
      },
      {
        componentId: "U2",
        center: { x: 0, y: 10 },
        ccwRotationOffset: Math.PI / 2, // 90°
        availableRotationDegrees: [90], // Should force vertical
        pads: [
          {
            padId: "U2_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: -5, y: 0 },
            size: { x: 1, y: 1 },
            absoluteCenter: { x: 0, y: 5 },
          },
          {
            padId: "U2_P2",
            networkId: "GND",
            type: "rect",
            offset: { x: 5, y: 0 },
            size: { x: 1, y: 1 },
            absoluteCenter: { x: 0, y: 15 },
          },
        ],
      },
    ],
    minGap: 2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_distance_to_network",
    disconnectedPackDirection: "right",
  }

  console.log("=== Simulating PackDebugger Step ===")

  // Step 1: Convert PackOutput to PackInput (what PackDebugger does)
  const packInput = convertPackOutputToPackInput(staticPackOutput)

  console.log("Converted PackInput components:")
  packInput.components.forEach((comp, i) => {
    console.log(
      `  ${comp.componentId}: availableRotationDegrees = ${comp.availableRotationDegrees}`,
    )
  })

  // Verify the conversion preserved rotation constraints
  expect(packInput.components[1].availableRotationDegrees).toEqual([90])

  // Step 2: Run pack algorithm (what PackDebugger does)
  // Note: The pack function doesn't support step-by-step execution,
  // so we'll pack all components at once
  const packOutput = pack(packInput)
  const result = packOutput.components
  const u2Result = result.find((c) => c.componentId === "U2")!

  console.log(`\nAfter stepping:`)
  console.log(
    `U2 rotation: ${((u2Result.ccwRotationOffset * 180) / Math.PI).toFixed(1)}°`,
  )
  console.log(
    `U2 center: (${u2Result.center.x.toFixed(1)}, ${u2Result.center.y.toFixed(1)})`,
  )

  const pad1 = u2Result.pads[0]
  const pad2 = u2Result.pads[1]
  console.log(`U2 pads:`)
  console.log(
    `  ${pad1.padId}: (${pad1.absoluteCenter.x.toFixed(1)}, ${pad1.absoluteCenter.y.toFixed(1)})`,
  )
  console.log(
    `  ${pad2.padId}: (${pad2.absoluteCenter.x.toFixed(1)}, ${pad2.absoluteCenter.y.toFixed(1)})`,
  )

  // Check if U2 is vertical (same X, different Y by ~10 units)
  const isVertical =
    Math.abs(pad1.absoluteCenter.x - pad2.absoluteCenter.x) < 1 &&
    Math.abs(pad1.absoluteCenter.y - pad2.absoluteCenter.y) > 8

  console.log(`Is U2 vertical? ${isVertical}`)

  // U2 should be constrained to 90° and therefore vertical
  const rotation90 = Math.abs(u2Result.ccwRotationOffset - Math.PI / 2) < 0.1
  console.log(`Is U2 at 90°? ${rotation90}`)

  if (!rotation90) {
    console.log(
      `❌ BUG: U2 should be forced to 90° but got ${((u2Result.ccwRotationOffset * 180) / Math.PI).toFixed(1)}°`,
    )
  }

  if (!isVertical) {
    console.log(`❌ BUG: U2 should be vertical but is horizontal`)
  }

  // These should pass if rotation constraints work
  expect(rotation90).toBe(true)
  expect(isVertical).toBe(true)
})
