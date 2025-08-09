import { test, expect } from "bun:test"
import type { PackedComponent } from "../lib/types"

test.skip("debug why 90° rotation is rejected - overlap check", () => {
  // This test is skipped because it depends on internal PackSolver functions
  // that are no longer available after switching to PhasedPackSolver
  // U1 is already placed at origin
  const u1: PackedComponent = {
    componentId: "U1",
    center: { x: 0, y: 0 },
    ccwRotationOffset: 0,
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
  }

  // Test U2 at different positions with 90° rotation
  const testPositions = [
    { name: "Far left", center: { x: -15, y: 0 } },
    { name: "Left", center: { x: -10, y: 0 } },
    { name: "Above", center: { x: 0, y: 10 } },
    { name: "Right", center: { x: 10, y: 0 } },
    { name: "Below", center: { x: 0, y: -10 } },
  ]

  console.log("=== Testing 90° Rotation Overlap Detection ===")

  for (const testPos of testPositions) {
    // Create U2 with 90° rotation at test position
    const u2With90: PackedComponent = {
      componentId: "U2",
      center: testPos.center,
      ccwRotationOffset: Math.PI / 2, // 90°
      pads: [
        {
          padId: "U2_P1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -5, y: 0 }, // Original offset
          size: { x: 1, y: 1 },
          // With 90° rotation: (-5,0) → (0,-5), so absolute = center + (0,-5)
          absoluteCenter: { x: testPos.center.x + 0, y: testPos.center.y - 5 },
        },
        {
          padId: "U2_P2",
          networkId: "GND",
          type: "rect",
          offset: { x: 5, y: 0 }, // Original offset
          size: { x: 1, y: 1 },
          // With 90° rotation: (5,0) → (0,5), so absolute = center + (0,5)
          absoluteCenter: { x: testPos.center.x + 0, y: testPos.center.y + 5 },
        },
      ],
    }

    // Check for overlap
    const hasOverlap = false // checkOverlap(u2With90, testPos.center, [u1], 2)

    console.log(`${testPos.name} (${testPos.center.x}, ${testPos.center.y}):`)
    console.log(
      `  U2 pads at: (${u2With90.pads[0].absoluteCenter.x}, ${u2With90.pads[0].absoluteCenter.y}) and (${u2With90.pads[1].absoluteCenter.x}, ${u2With90.pads[1].absoluteCenter.y})`,
    )
    console.log(`  Overlap detected: ${hasOverlap}`)

    if (!hasOverlap) {
      console.log(`  ✅ 90° rotation is VALID at this position`)

      // Calculate distances to U1 pads to verify
      const u1VCC = u1.pads[0].absoluteCenter
      const u1GND = u1.pads[1].absoluteCenter
      const u2VCC = u2With90.pads[0].absoluteCenter
      const u2GND = u2With90.pads[1].absoluteCenter

      const dist1 = Math.hypot(u1VCC.x - u2VCC.x, u1VCC.y - u2VCC.y)
      const dist2 = Math.hypot(u1VCC.x - u2GND.x, u1VCC.y - u2GND.y)
      const dist3 = Math.hypot(u1GND.x - u2VCC.x, u1GND.y - u2VCC.y)
      const dist4 = Math.hypot(u1GND.x - u2GND.x, u1GND.y - u2GND.y)

      const minDist = Math.min(dist1, dist2, dist3, dist4)
      console.log(
        `  Minimum pad distance: ${minDist.toFixed(2)} (required: ${2 + 0.5 + 0.5} = 3.0)`,
      )
    } else {
      console.log(`  ❌ 90° rotation is INVALID (overlap detected)`)
    }
    console.log("")
  }
})
