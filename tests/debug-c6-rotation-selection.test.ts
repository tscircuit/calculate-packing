import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("debug C6 rotation selection in network02", () => {
  // Simplified version focusing on C6's placement
  const packInput: PackInput = {
    components: [
      {
        componentId: "U1",
        pads: [
          {
            padId: "U1.1",
            networkId: "C1.1",
            type: "rect",
            offset: { x: -1, y: 0.1 },
            size: { x: 0.1, y: 0.1 },
          },
          {
            padId: "U1.2",
            networkId: "C1.2",
            type: "rect",
            offset: { x: -1, y: -0.1 },
            size: { x: 0.1, y: 0.1 },
          },
        ],
      },
      {
        componentId: "C6",
        pads: [
          {
            padId: "C6.1",
            networkId: "C1.1", // Connects to U1.1
            type: "rect",
            offset: { x: 0, y: 0.55 },
            size: { x: 0.1, y: 0.1 },
          },
          {
            padId: "C6.2",
            networkId: "C1.2", // Connects to U1.2
            type: "rect",
            offset: { x: 0, y: -0.55 },
            size: { x: 0.1, y: 0.1 },
          },
          {
            padId: "C6-body",
            networkId: "C6",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 0.529, y: 1.058 }, // Narrow and tall
          },
        ],
      },
    ],
    minGap: 0.2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  const result = pack(packInput)

  console.log(`=== C6 Rotation Selection Analysis ===`)

  const u1 = result.components.find((c) => c.componentId === "U1")!
  const c6 = result.components.find((c) => c.componentId === "C6")!

  console.log(`U1 pads:`)
  for (const pad of u1.pads) {
    if (pad.networkId.startsWith("C1.")) {
      console.log(
        `  ${pad.padId} (${pad.networkId}): (${pad.absoluteCenter.x.toFixed(3)}, ${pad.absoluteCenter.y.toFixed(3)})`,
      )
    }
  }

  console.log(`\nC6 result:`)
  console.log(`  Rotation: ${c6.ccwRotationOffset}°`)
  console.log(
    `  Center: (${c6.center.x.toFixed(3)}, ${c6.center.y.toFixed(3)})`,
  )

  for (const pad of c6.pads) {
    if (pad.networkId.startsWith("C1.")) {
      console.log(
        `  ${pad.padId} (${pad.networkId}): (${pad.absoluteCenter.x.toFixed(3)}, ${pad.absoluteCenter.y.toFixed(3)})`,
      )
    }
  }

  // Calculate distances to see if rotation choice makes sense
  const u1_c11_pad = u1.pads.find((p) => p.networkId === "C1.1")!
  const u1_c12_pad = u1.pads.find((p) => p.networkId === "C1.2")!
  const c6_c11_pad = c6.pads.find((p) => p.networkId === "C1.1")!
  const c6_c12_pad = c6.pads.find((p) => p.networkId === "C1.2")!

  const c11_distance = Math.hypot(
    u1_c11_pad.absoluteCenter.x - c6_c11_pad.absoluteCenter.x,
    u1_c11_pad.absoluteCenter.y - c6_c11_pad.absoluteCenter.y,
  )
  const c12_distance = Math.hypot(
    u1_c12_pad.absoluteCenter.x - c6_c12_pad.absoluteCenter.x,
    u1_c12_pad.absoluteCenter.y - c6_c12_pad.absoluteCenter.y,
  )

  console.log(`\nDistances:`)
  console.log(`  C1.1 network: ${c11_distance.toFixed(3)}`)
  console.log(`  C1.2 network: ${c12_distance.toFixed(3)}`)
  console.log(
    `  Total squared: ${(c11_distance * c11_distance + c12_distance * c12_distance).toFixed(3)}`,
  )

  console.log(
    `\nNow let's manually check what would happen with different rotations...`,
  )

  // Test different rotation manually to see if current choice is optimal
  const c6_input = packInput.components[1]!

  for (const testRotation of [0, 90, 180, 270]) {
    console.log(`\n--- Testing ${testRotation}° rotation for C6 ---`)

    // Simulate where C6 pads would be at this rotation (assuming same center)
    const c6_center = c6.center

    for (const pad of c6_input.pads) {
      if (!pad.networkId.startsWith("C1.")) continue

      // Rotate the offset
      const angle_rad = (testRotation * Math.PI) / 180
      const cos_a = Math.cos(angle_rad)
      const sin_a = Math.sin(angle_rad)
      const rotated_offset = {
        x: pad.offset.x * cos_a - pad.offset.y * sin_a,
        y: pad.offset.x * sin_a + pad.offset.y * cos_a,
      }

      const absolute_pos = {
        x: c6_center.x + rotated_offset.x,
        y: c6_center.y + rotated_offset.y,
      }

      // Find target pad on U1
      const target_pad = u1.pads.find((p) => p.networkId === pad.networkId)!
      const distance = Math.hypot(
        absolute_pos.x - target_pad.absoluteCenter.x,
        absolute_pos.y - target_pad.absoluteCenter.y,
      )

      console.log(
        `  ${pad.padId}: distance to ${target_pad.padId} = ${distance.toFixed(3)}`,
      )
    }
  }

  expect(result.components.length).toBe(2)
})
