import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("90 degree rotation should correctly position pads", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "U1",
        availableRotationDegrees: [0],
        pads: [
          {
            padId: "U1_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: -5, y: 2 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "U2",
        availableRotationDegrees: [90], // Force 90 degree rotation
        pads: [
          {
            padId: "U2_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: -5, y: 0 }, // Should rotate to (0, -5)
            size: { x: 1, y: 1 },
          },
          {
            padId: "U2_P2",
            networkId: "GND",
            type: "rect",
            offset: { x: 5, y: 0 }, // Should rotate to (0, 5)
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

  const u2 = result.components.find((c) => c.componentId === "U2")!

  console.log("=== Rotation Math Test ===")
  console.log(
    `U2 center: (${u2.center.x.toFixed(2)}, ${u2.center.y.toFixed(2)})`,
  )
  console.log(`U2 rotation: ${u2.ccwRotationOffsetDegrees.toFixed(1)}°`)

  // Should be exactly 90 degrees
  expect(Math.abs(u2.ccwRotationOffsetDegrees - 90)).toBeLessThan(0.01)

  // Check pad positions
  const u2P1 = u2.pads.find((p) => p.padId === "U2_P1")!
  const u2P2 = u2.pads.find((p) => p.padId === "U2_P2")!

  console.log(
    `U2_P1 absolute: (${u2P1.absoluteCenter.x.toFixed(2)}, ${u2P1.absoluteCenter.y.toFixed(2)})`,
  )
  console.log(
    `U2_P2 absolute: (${u2P2.absoluteCenter.x.toFixed(2)}, ${u2P2.absoluteCenter.y.toFixed(2)})`,
  )

  // With 90° rotation:
  // Original offset (-5, 0) → rotated (0, -5) → absolute (center.x + 0, center.y - 5)
  // Original offset (5, 0) → rotated (0, 5) → absolute (center.x + 0, center.y + 5)

  const expectedP1X = u2.center.x + 0
  const expectedP1Y = u2.center.y - 5
  const expectedP2X = u2.center.x + 0
  const expectedP2Y = u2.center.y + 5

  console.log(
    `Expected U2_P1: (${expectedP1X.toFixed(2)}, ${expectedP1Y.toFixed(2)})`,
  )
  console.log(
    `Expected U2_P2: (${expectedP2X.toFixed(2)}, ${expectedP2Y.toFixed(2)})`,
  )

  expect(Math.abs(u2P1.absoluteCenter.x - expectedP1X)).toBeLessThan(0.1)
  expect(Math.abs(u2P1.absoluteCenter.y - expectedP1Y)).toBeLessThan(0.1)
  expect(Math.abs(u2P2.absoluteCenter.x - expectedP2X)).toBeLessThan(0.1)
  expect(Math.abs(u2P2.absoluteCenter.y - expectedP2Y)).toBeLessThan(0.1)

  console.log("✅ 90° rotation math is correct!")
})
