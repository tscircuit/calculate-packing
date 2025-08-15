import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

// Helper function to transform body bounds to absolute coordinates
// This mirrors the logic in transformComponentBodyBounds.ts for testing
function getTransformedBodyBounds(comp: any) {
  if (!comp.bodyBounds) return null

  const rotationAngle = ((comp.ccwRotationOffset || 0) * Math.PI) / 180
  const corners = [
    { x: comp.bodyBounds.minX, y: comp.bodyBounds.minY },
    { x: comp.bodyBounds.maxX, y: comp.bodyBounds.minY },
    { x: comp.bodyBounds.maxX, y: comp.bodyBounds.maxY },
    { x: comp.bodyBounds.minX, y: comp.bodyBounds.maxY },
  ]

  const transformedCorners = corners.map((corner) => {
    const cos = Math.cos(rotationAngle)
    const sin = Math.sin(rotationAngle)
    return {
      x: comp.center.x + (corner.x * cos - corner.y * sin),
      y: comp.center.y + (corner.x * sin + corner.y * cos),
    }
  })

  return {
    minX: Math.min(...transformedCorners.map((c) => c.x)),
    maxX: Math.max(...transformedCorners.map((c) => c.x)),
    minY: Math.min(...transformedCorners.map((c) => c.y)),
    maxY: Math.max(...transformedCorners.map((c) => c.y)),
  }
}

test("REGRESSION: this test should FAIL on main branch (without body bounds fix)", () => {
  // This test is designed to demonstrate the bug that existed before our fix
  // On main branch (without body bounds support):
  // - Components would be placed too close together
  // - Only pad overlap detection would run (not body bounds)
  // - Visual overlap would occur even though electrical connections are correct

  const input: PackInput = {
    components: [
      {
        componentId: "CHIP_LARGE",
        pads: [
          // Large chip with pads on the edges, body bounds extend beyond pads
          {
            padId: "CHIP_L1",
            networkId: "VDD",
            type: "rect",
            offset: { x: -3, y: 0 },
            size: { x: 0.8, y: 0.8 },
          },
          {
            padId: "CHIP_R1",
            networkId: "GND",
            type: "rect",
            offset: { x: 3, y: 0 },
            size: { x: 0.8, y: 0.8 },
          },
        ],
        // Body bounds extend significantly beyond the pads
        bodyBounds: {
          minX: -4, // Body extends 1mm beyond left pad
          maxX: 4, // Body extends 1mm beyond right pad
          minY: -2,
          maxY: 2,
        },
      },
      {
        componentId: "RESISTOR_SMALL",
        pads: [
          // Small resistor connected between VDD and GND
          {
            padId: "R_1",
            networkId: "VDD",
            type: "rect",
            offset: { x: -0.4, y: 0 },
            size: { x: 0.4, y: 0.4 },
          },
          {
            padId: "R_2",
            networkId: "GND",
            type: "rect",
            offset: { x: 0.4, y: 0 },
            size: { x: 0.4, y: 0.4 },
          },
        ],
        bodyBounds: {
          minX: -0.8,
          maxX: 0.8,
          minY: -0.3,
          maxY: 0.3,
        },
      },
    ],
    minGap: 0.1, // Small gap to encourage close placement
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  const result = pack(input)

  const chip = result.components.find((c) => c.componentId === "CHIP_LARGE")!
  const resistor = result.components.find(
    (c) => c.componentId === "RESISTOR_SMALL",
  )!

  const chipBody = getTransformedBodyBounds(chip)
  const resistorBody = getTransformedBodyBounds(resistor)

  console.log(`\n=== REGRESSION TEST RESULTS ===`)
  console.log(
    `Chip center: (${chip.center.x.toFixed(2)}, ${chip.center.y.toFixed(2)})`,
  )
  console.log(
    `Resistor center: (${resistor.center.x.toFixed(2)}, ${resistor.center.y.toFixed(2)})`,
  )

  // Debug: Check if body bounds are being detected
  console.log(`Chip has bodyBounds: ${chip.bodyBounds ? "YES" : "NO"}`)
  console.log(`Resistor has bodyBounds: ${resistor.bodyBounds ? "YES" : "NO"}`)

  if (chipBody && resistorBody) {
    console.log(
      `Chip body: (${chipBody.minX.toFixed(2)}, ${chipBody.minY.toFixed(2)}) to (${chipBody.maxX.toFixed(2)}, ${chipBody.maxY.toFixed(2)})`,
    )
    console.log(
      `Resistor body: (${resistorBody.minX.toFixed(2)}, ${resistorBody.minY.toFixed(2)}) to (${resistorBody.maxX.toFixed(2)}, ${resistorBody.maxY.toFixed(2)})`,
    )

    const xOverlap =
      chipBody.maxX >= resistorBody.minX && resistorBody.maxX >= chipBody.minX
    const yOverlap =
      chipBody.maxY >= resistorBody.minY && resistorBody.maxY >= chipBody.minY
    const bodiesOverlap = xOverlap && yOverlap

    console.log(
      `Bodies overlap: ${bodiesOverlap ? "YES - BUG PRESENT!" : "NO - FIX WORKING!"}`,
    )

    if (bodiesOverlap) {
      console.log(`❌ REGRESSION DETECTED: Component bodies are overlapping`)
      console.log(
        `   This indicates body bounds overlap detection is NOT working`,
      )
    } else {
      console.log(`✅ FIX CONFIRMED: Components properly separated`)

      // Calculate the gap between bodies
      let gap = 0
      if (!xOverlap) {
        gap = Math.min(
          Math.abs(chipBody.minX - resistorBody.maxX),
          Math.abs(resistorBody.minX - chipBody.maxX),
        )
      } else if (!yOverlap) {
        gap = Math.min(
          Math.abs(chipBody.minY - resistorBody.maxY),
          Math.abs(resistorBody.minY - chipBody.maxY),
        )
      }
      console.log(`   Gap between bodies: ${gap.toFixed(3)}mm`)
    }

    // The critical test: With our fix, bodies should NOT overlap
    expect(bodiesOverlap).toBe(false)

    // Additional verification: check body-to-pad overlaps
    let bodyToPadOverlap = false

    // Check if resistor body overlaps with chip pads
    for (const pad of chip.pads) {
      const padBounds = {
        left: pad.absoluteCenter.x - pad.size.x / 2,
        right: pad.absoluteCenter.x + pad.size.x / 2,
        bottom: pad.absoluteCenter.y - pad.size.y / 2,
        top: pad.absoluteCenter.y + pad.size.y / 2,
      }

      const overlap =
        resistorBody.maxX >= padBounds.left &&
        padBounds.right >= resistorBody.minX &&
        resistorBody.maxY >= padBounds.bottom &&
        padBounds.top >= resistorBody.minY

      if (overlap) {
        bodyToPadOverlap = true
        console.log(
          `❌ BODY-TO-PAD OVERLAP: Resistor body overlaps with chip pad ${pad.padId}`,
        )
        break
      }
    }

    // Check if chip body overlaps with resistor pads
    for (const pad of resistor.pads) {
      const padBounds = {
        left: pad.absoluteCenter.x - pad.size.x / 2,
        right: pad.absoluteCenter.x + pad.size.x / 2,
        bottom: pad.absoluteCenter.y - pad.size.y / 2,
        top: pad.absoluteCenter.y + pad.size.y / 2,
      }

      const overlap =
        chipBody.maxX >= padBounds.left &&
        padBounds.right >= chipBody.minX &&
        chipBody.maxY >= padBounds.bottom &&
        padBounds.top >= chipBody.minY

      if (overlap) {
        bodyToPadOverlap = true
        console.log(
          `❌ BODY-TO-PAD OVERLAP: Chip body overlaps with resistor pad ${pad.padId}`,
        )
        break
      }
    }

    if (!bodyToPadOverlap) {
      console.log(
        `✅ NO BODY-TO-PAD OVERLAPS: All pads clear of component bodies`,
      )
    }

    expect(bodyToPadOverlap).toBe(false)
  }

  console.log(`=== END REGRESSION TEST ===\n`)
})

test("VERIFICATION: components should be connected electrically despite body separation", () => {
  // Verify that our fix doesn't break electrical connectivity
  // Components should still be positioned to minimize electrical connection distance
  // while maintaining proper visual (body bounds) separation

  const input: PackInput = {
    components: [
      {
        componentId: "IC1",
        pads: [
          {
            padId: "VCC",
            networkId: "power",
            type: "rect",
            offset: { x: -1, y: 1 },
            size: { x: 0.5, y: 0.5 },
          },
          {
            padId: "GND",
            networkId: "ground",
            type: "rect",
            offset: { x: -1, y: -1 },
            size: { x: 0.5, y: 0.5 },
          },
        ],
        bodyBounds: { minX: -1.5, maxX: 1.5, minY: -1.5, maxY: 1.5 },
      },
      {
        componentId: "C1", // Capacitor connected between power and ground
        pads: [
          {
            padId: "C1+",
            networkId: "power",
            type: "rect",
            offset: { x: -0.3, y: 0 },
            size: { x: 0.3, y: 0.3 },
          },
          {
            padId: "C1-",
            networkId: "ground",
            type: "rect",
            offset: { x: 0.3, y: 0 },
            size: { x: 0.3, y: 0.3 },
          },
        ],
        bodyBounds: { minX: -0.5, maxX: 0.5, minY: -0.4, maxY: 0.4 },
      },
    ],
    minGap: 0.2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline", // Minimize connection distance
  }

  const result = pack(input)

  const ic = result.components.find((c) => c.componentId === "IC1")!
  const cap = result.components.find((c) => c.componentId === "C1")!

  // Calculate connection distances
  const vccIC = ic.pads.find((p) => p.networkId === "power")!
  const vccCap = cap.pads.find((p) => p.networkId === "power")!
  const gndIC = ic.pads.find((p) => p.networkId === "ground")!
  const gndCap = cap.pads.find((p) => p.networkId === "ground")!

  const powerDistance = Math.sqrt(
    Math.pow(vccCap.absoluteCenter.x - vccIC.absoluteCenter.x, 2) +
      Math.pow(vccCap.absoluteCenter.y - vccIC.absoluteCenter.y, 2),
  )

  const groundDistance = Math.sqrt(
    Math.pow(gndCap.absoluteCenter.x - gndIC.absoluteCenter.x, 2) +
      Math.pow(gndCap.absoluteCenter.y - gndIC.absoluteCenter.y, 2),
  )

  console.log(`\n=== ELECTRICAL CONNECTIVITY TEST ===`)
  console.log(`Power connection distance: ${powerDistance.toFixed(3)}mm`)
  console.log(`Ground connection distance: ${groundDistance.toFixed(3)}mm`)
  console.log(
    `Total connection cost: ${(powerDistance + groundDistance).toFixed(3)}mm`,
  )

  // Verify components are positioned for good electrical connections
  // (distances should be reasonable, not excessive due to body bounds constraints)
  expect(powerDistance).toBeLessThan(5) // Should be reasonably close
  expect(groundDistance).toBeLessThan(5) // Should be reasonably close

  // But bodies should still not overlap

  const icBody = getTransformedBodyBounds(ic)
  const capBody = getTransformedBodyBounds(cap)

  if (icBody && capBody) {
    const xOverlap = icBody.maxX >= capBody.minX && capBody.maxX >= icBody.minX
    const yOverlap = icBody.maxY >= capBody.minY && capBody.maxY >= icBody.minY
    const bodiesOverlap = xOverlap && yOverlap

    console.log(`Bodies overlap: ${bodiesOverlap ? "YES" : "NO"}`)
    expect(bodiesOverlap).toBe(false) // Bodies should not overlap

    console.log(`✅ ELECTRICAL + VISUAL: Good connections without body overlap`)
  }

  console.log(`=== END ELECTRICAL TEST ===\n`)
})
