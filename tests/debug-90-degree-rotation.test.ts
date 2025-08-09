import { test, expect } from "bun:test"
import { rotatePoint } from "../lib/math/rotatePoint"

test("debug 90 degree rotation - should make horizontal pads vertical", () => {
  console.log("=== Debugging 90° Rotation ===")

  // Original horizontal pad offsets
  const leftPad = { x: -5, y: 0 } // Left of center
  const rightPad = { x: 5, y: 0 } // Right of center

  console.log(`Original pads (horizontal):`)
  console.log(`  Left pad offset: (${leftPad.x}, ${leftPad.y})`)
  console.log(`  Right pad offset: (${rightPad.x}, ${rightPad.y})`)

  // Apply 90° CCW rotation
  const rotation90 = Math.PI / 2 // 90 degrees in radians

  const rotatedLeft = rotatePoint(leftPad, rotation90)
  const rotatedRight = rotatePoint(rightPad, rotation90)

  console.log(`\nAfter 90° CCW rotation (should be vertical):`)
  console.log(
    `  Left pad rotated to: (${rotatedLeft.x.toFixed(2)}, ${rotatedLeft.y.toFixed(2)})`,
  )
  console.log(
    `  Right pad rotated to: (${rotatedRight.x.toFixed(2)}, ${rotatedRight.y.toFixed(2)})`,
  )

  // With 90° CCW rotation:
  // (x, y) → (-y, x)
  // (-5, 0) → (0, -5) [below center]
  // (5, 0) → (0, 5)   [above center]

  expect(Math.abs(rotatedLeft.x - 0)).toBeLessThan(0.01) // Should be at x=0
  expect(Math.abs(rotatedLeft.y - -5)).toBeLessThan(0.01) // Should be at y=-5 (below)
  expect(Math.abs(rotatedRight.x - 0)).toBeLessThan(0.01) // Should be at x=0
  expect(Math.abs(rotatedRight.y - 5)).toBeLessThan(0.01) // Should be at y=5 (above)

  console.log(`\nExpected result: VERTICAL arrangement`)
  console.log(`  One pad above center (0, 5)`)
  console.log(`  One pad below center (0, -5)`)

  if (Math.abs(rotatedLeft.y - rotatedRight.y) > 9) {
    console.log(
      `✅ SUCCESS: Pads are vertically separated by ${Math.abs(rotatedLeft.y - rotatedRight.y)}`,
    )
  } else {
    console.log(`❌ FAIL: Pads are not properly vertical`)
  }
})

test("test actual packing with 90 degree constraint", () => {
  const { pack } = require("../lib")

  const input = {
    components: [
      {
        componentId: "U1",
        availableRotationDegrees: [0],
        pads: [
          {
            padId: "U1_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "U2",
        availableRotationDegrees: [90], // FORCE 90 degrees only
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
  const u2 = result.components.find((c: any) => c.componentId === "U2")!

  console.log("\n=== Actual Packing Result ===")
  console.log(`U2 rotation: ${u2.ccwRotationOffset.toFixed(1)}°`)
  console.log(
    `U2 center: (${u2.center.x.toFixed(1)}, ${u2.center.y.toFixed(1)})`,
  )

  const pad1 = u2.pads[0]
  const pad2 = u2.pads[1]

  console.log(
    `Pad 1: (${pad1.absoluteCenter.x.toFixed(1)}, ${pad1.absoluteCenter.y.toFixed(1)})`,
  )
  console.log(
    `Pad 2: (${pad2.absoluteCenter.x.toFixed(1)}, ${pad2.absoluteCenter.y.toFixed(1)})`,
  )

  // Check if pads are arranged vertically (same X, different Y)
  const sameX = Math.abs(pad1.absoluteCenter.x - pad2.absoluteCenter.x) < 0.5
  const differentY = Math.abs(pad1.absoluteCenter.y - pad2.absoluteCenter.y) > 5

  console.log(
    `Same X coordinate: ${sameX} (diff: ${Math.abs(pad1.absoluteCenter.x - pad2.absoluteCenter.x).toFixed(2)})`,
  )
  console.log(
    `Different Y coordinate: ${differentY} (diff: ${Math.abs(pad1.absoluteCenter.y - pad2.absoluteCenter.y).toFixed(2)})`,
  )

  if (sameX && differentY) {
    console.log(`✅ U2 is VERTICAL as expected`)
  } else {
    console.log(`❌ U2 is still HORIZONTAL - rotation constraint not working!`)
  }

  // Must be exactly 90 degrees
  expect(Math.abs(u2.ccwRotationOffset - 90)).toBeLessThan(0.01)
  // Must be vertical
  expect(sameX).toBe(true)
  expect(differentY).toBe(true)
})
