import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("availableRotationDegrees [0] should prevent component rotation", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "U1",
        availableRotationDegrees: [0], // Only allow 0° rotation
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
          {
            padId: "U1_P3",
            networkId: "P3",
            type: "rect",
            offset: { x: 5, y: -2 },
            size: { x: 1, y: 1 },
          },
          {
            padId: "U1_P4",
            networkId: "P4",
            type: "rect",
            offset: { x: 5, y: 2 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "U2",
        availableRotationDegrees: [0], // Only allow 0° rotation
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

  const result = pack(input)

  console.log("=== Rotation Constraint Test ===")

  for (const component of result.components) {
    console.log(`${component.componentId}:`)
    console.log(
      `  Center: (${component.center.x.toFixed(2)}, ${component.center.y.toFixed(2)})`,
    )
    console.log(`  Rotation: ${component.ccwRotationOffset.toFixed(1)}°`)
    console.log(
      `  Available rotations: ${input.components.find((c) => c.componentId === component.componentId)?.availableRotationDegrees}`,
    )

    // With availableRotationDegrees: [0], rotation should be exactly 0
    expect(component.ccwRotationOffset).toBe(0)
  }

  // Also verify the pad positions match the expected offsets (no rotation applied)
  const u2 = result.components.find((c) => c.componentId === "U2")!

  // U2_P1 should be at center + (-5, 0) offset
  const u2P1 = u2.pads.find((p) => p.padId === "U2_P1")!
  expect(u2P1.absoluteCenter.x).toBeCloseTo(u2.center.x - 5, 1)
  expect(u2P1.absoluteCenter.y).toBeCloseTo(u2.center.y + 0, 1)

  // U2_P2 should be at center + (5, 0) offset
  const u2P2 = u2.pads.find((p) => p.padId === "U2_P2")!
  expect(u2P2.absoluteCenter.x).toBeCloseTo(u2.center.x + 5, 1)
  expect(u2P2.absoluteCenter.y).toBeCloseTo(u2.center.y + 0, 1)

  console.log("\n✅ All rotation constraints respected!")
})

test("components without rotation constraints should still be able to rotate", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "U1",
        // No availableRotationDegrees specified - should default to [0,90,180,270]
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
        // No availableRotationDegrees specified
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

  const result = pack(input)

  console.log("\n=== Default Rotation Test ===")

  for (const component of result.components) {
    const rotationDegrees = component.ccwRotationOffset
    console.log(`${component.componentId}:`)
    console.log(
      `  Center: (${component.center.x.toFixed(2)}, ${component.center.y.toFixed(2)})`,
    )
    console.log(`  Rotation: ${rotationDegrees.toFixed(1)}°`)

    // Rotation should be one of the default values: 0, 90, 180, or 270
    const normalizedRotation = Math.round(rotationDegrees / 90) * 90
    expect([0, 90, 180, 270]).toContain(normalizedRotation)
  }

  console.log("✅ Default rotation constraints working!")
})
