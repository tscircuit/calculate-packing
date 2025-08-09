import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("degrees should work correctly with rotation constraints", () => {
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
        availableRotationDegrees: [90], // Force 90 degrees (should be vertical)
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

  console.log("=== Testing Degree-based Rotation ===")
  console.log(
    `U2 center: (${u2.center.x.toFixed(1)}, ${u2.center.y.toFixed(1)})`,
  )
  console.log(`U2 rotation: ${u2.ccwRotationOffset}° (should be 90°)`)

  const pad1 = u2.pads[0]
  const pad2 = u2.pads[1]
  console.log(`U2 pads:`)
  console.log(
    `  ${pad1?.padId}: (${pad1?.absoluteCenter?.x.toFixed(1)}, ${pad1?.absoluteCenter?.y.toFixed(1)})`,
  )
  console.log(
    `  ${pad2?.padId}: (${pad2?.absoluteCenter?.x.toFixed(1)}, ${pad2?.absoluteCenter?.y.toFixed(1)})`,
  )

  // Should be exactly 90 degrees (not radians!)
  expect(u2.ccwRotationOffset).toBe(90)

  // Should be vertical (same X, different Y)
  const sameX = Math.abs((pad1?.absoluteCenter?.x ?? 0) - (pad2?.absoluteCenter?.x ?? 0)) < 0.5
  const differentY = Math.abs((pad1?.absoluteCenter?.y ?? 0) - (pad2?.absoluteCenter?.y ?? 0)) > 8

  console.log(`Is vertical? ${sameX && differentY}`)
  expect(sameX).toBe(true)
  expect(differentY).toBe(true)

  // With better optimization, should find a reasonable position (not too far away)
  const distanceFromOrigin = Math.hypot(u2.center.x, u2.center.y)
  console.log(`Distance from origin: ${distanceFromOrigin.toFixed(1)}`)

  // Should be closer to origin with improved optimization
  expect(distanceFromOrigin).toBeLessThan(15) // Previously was ~13, should be even better now
})

test("multiple rotation options should work", () => {
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
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
      },
      {
        componentId: "U2",
        availableRotationDegrees: [-90, 90], // Allow both +90° and -90°
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
  const u2 = result.components.find((c) => c.componentId === "U2")!

  console.log(`\n=== Multiple Rotation Options ===`)
  console.log(`U2 rotation: ${u2.ccwRotationOffset}° (should be 90° or 270°)`)

  // Should be one of the allowed rotations (270° is equivalent to -90°)
  expect([90, 270]).toContain(u2.ccwRotationOffset)

  console.log(`✅ U2 correctly chose rotation: ${u2.ccwRotationOffset}°`)
})
