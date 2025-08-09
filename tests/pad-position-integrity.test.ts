import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("pads should maintain correct offsets when rotation is constrained to [0]", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "U1",
        availableRotationDegrees: [0], // No rotation allowed
        pads: [
          {
            padId: "U1_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: -5, y: 2 }, // Should stay at center + (-5, 2)
            size: { x: 1, y: 1 },
          },
          {
            padId: "U1_P2",
            networkId: "GND",
            type: "rect",
            offset: { x: -5, y: -2 }, // Should stay at center + (-5, -2)
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "U2",
        availableRotationDegrees: [0], // No rotation allowed
        pads: [
          {
            padId: "U2_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: -5, y: 0 }, // Should stay at center + (-5, 0)
            size: { x: 1, y: 1 },
          },
          {
            padId: "U2_P2",
            networkId: "GND",
            type: "rect",
            offset: { x: 5, y: 0 }, // Should stay at center + (5, 0)
            size: { x: 1, y: 1 },
          },
        ],
      },
    ],
    minGap: 2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
    packFirst: ["U1"],
  }

  const result = pack(input)

  console.log("=== Pad Position Integrity Test ===")

  for (const component of result.components) {
    console.log(`\n${component.componentId}:`)
    console.log(
      `  Center: (${component.center.x.toFixed(2)}, ${component.center.y.toFixed(2)})`,
    )
    console.log(
      `  Rotation: ${component.ccwRotationOffset.toFixed(1)}°`,
    )

    // Find original component to compare offsets
    const originalComponent = input.components.find(
      (c) => c.componentId === component.componentId,
    )!

    for (let i = 0; i < component.pads.length; i++) {
      const resultPad = component.pads[i]
      const originalPad = originalComponent.pads[i]

      // Calculate expected absolute position (center + offset)
      const expectedX = component.center.x + originalPad.offset.x
      const expectedY = component.center.y + originalPad.offset.y

      console.log(`  ${resultPad.padId}:`)
      console.log(
        `    Original offset: (${originalPad.offset.x}, ${originalPad.offset.y})`,
      )
      console.log(
        `    Expected absolute: (${expectedX.toFixed(2)}, ${expectedY.toFixed(2)})`,
      )
      console.log(
        `    Actual absolute: (${resultPad.absoluteCenter.x.toFixed(2)}, ${resultPad.absoluteCenter.y.toFixed(2)})`,
      )

      const deltaX = Math.abs(resultPad.absoluteCenter.x - expectedX)
      const deltaY = Math.abs(resultPad.absoluteCenter.y - expectedY)
      console.log(`    Delta: (${deltaX.toFixed(3)}, ${deltaY.toFixed(3)})`)

      // With no rotation allowed, pad positions should exactly match center + offset
      expect(deltaX).toBeLessThan(0.001) // Very small tolerance for floating point
      expect(deltaY).toBeLessThan(0.001)

      if (deltaX > 0.001 || deltaY > 0.001) {
        console.log(
          `    ❌ MISMATCH: Pad ${resultPad.padId} is not at expected position!`,
        )
      } else {
        console.log(
          `    ✅ CORRECT: Pad ${resultPad.padId} is at expected position`,
        )
      }
    }
  }
})

test("compare rotation=0 vs unconstrained to see the difference", () => {
  const inputConstrained: PackInput = {
    components: [
      {
        componentId: "U1",
        availableRotationDegrees: [0], // No rotation
        pads: [
          {
            padId: "U1_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: -5, y: 2 },
            size: { x: 1, y: 1 },
          },
          {
            padId: "U1_P2",
            networkId: "GND",
            type: "rect",
            offset: { x: -5, y: -2 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "U2",
        availableRotationDegrees: [0], // No rotation
        pads: [
          {
            padId: "U2_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: -5, y: 0 },
            size: { x: 1, y: 1 },
          },
          {
            padId: "U2_P2",
            networkId: "GND",
            type: "rect",
            offset: { x: 5, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
    ],
    minGap: 2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
    packFirst: ["U1"],
  }

  const inputUnconstrained: PackInput = {
    ...inputConstrained,
    components: inputConstrained.components.map((c) => ({
      ...c,
      availableRotationDegrees: undefined, // Allow all rotations
    })),
  }

  const resultConstrained = pack(inputConstrained)
  const resultUnconstrained = pack(inputUnconstrained)

  console.log("\n=== Constrained vs Unconstrained Comparison ===")

  const u2Constrained = resultConstrained.components.find(
    (c) => c.componentId === "U2",
  )!
  const u2Unconstrained = resultUnconstrained.components.find(
    (c) => c.componentId === "U2",
  )!

  console.log(`Constrained U2:`)
  console.log(
    `  Center: (${u2Constrained.center.x.toFixed(2)}, ${u2Constrained.center.y.toFixed(2)})`,
  )
  console.log(
    `  Rotation: ${u2Constrained.ccwRotationOffset.toFixed(1)}°`,
  )
  console.log(
    `  VCC pad: (${u2Constrained.pads[0].absoluteCenter.x.toFixed(2)}, ${u2Constrained.pads[0].absoluteCenter.y.toFixed(2)})`,
  )
  console.log(
    `  GND pad: (${u2Constrained.pads[1].absoluteCenter.x.toFixed(2)}, ${u2Constrained.pads[1].absoluteCenter.y.toFixed(2)})`,
  )

  console.log(`Unconstrained U2:`)
  console.log(
    `  Center: (${u2Unconstrained.center.x.toFixed(2)}, ${u2Unconstrained.center.y.toFixed(2)})`,
  )
  console.log(
    `  Rotation: ${u2Unconstrained.ccwRotationOffset.toFixed(1)}°`,
  )
  console.log(
    `  VCC pad: (${u2Unconstrained.pads[0].absoluteCenter.x.toFixed(2)}, ${u2Unconstrained.pads[0].absoluteCenter.y.toFixed(2)})`,
  )
  console.log(
    `  GND pad: (${u2Unconstrained.pads[1].absoluteCenter.x.toFixed(2)}, ${u2Unconstrained.pads[1].absoluteCenter.y.toFixed(2)})`,
  )

  // They should be different if rotation constraints are working
  const same =
    u2Constrained.ccwRotationOffset === u2Unconstrained.ccwRotationOffset
  console.log(`Same rotation: ${same}`)
})
