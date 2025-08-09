import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("test each C6 rotation to find truly optimal choice", () => {
  const baseInput: PackInput = {
    components: [
      {
        componentId: "U1",
        availableRotationDegrees: [0], // Fix U1 at 0°
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
          {
            padId: "U1-body",
            networkId: "U1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1.2, y: 3 },
          },
        ],
      },
      {
        componentId: "C6",
        availableRotationDegrees: [0], // We'll change this for each test
        pads: [
          {
            padId: "C6.1",
            networkId: "C1.1",
            type: "rect",
            offset: { x: 0, y: 0.55 },
            size: { x: 0.1, y: 0.1 },
          },
          {
            padId: "C6.2",
            networkId: "C1.2",
            type: "rect",
            offset: { x: 0, y: -0.55 },
            size: { x: 0.1, y: 0.1 },
          },
          {
            padId: "C6-body",
            networkId: "C6",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 0.529, y: 1.058 },
          },
        ],
      },
    ],
    minGap: 0.2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  const rotationResults: Array<{
    rotation: number
    squaredSum: number
    center: { x: number; y: number }
  }> = []

  console.log(`=== Testing Each C6 Rotation with Translation Optimization ===`)

  for (const rotation of [0, 90, 180, 270]) {
    const testInput = {
      ...baseInput,
      components: [
        baseInput.components[0]!, // U1 unchanged
        {
          ...baseInput.components[1]!,
          availableRotationDegrees: [rotation], // Force this specific rotation
        },
      ],
    }

    const result = pack(testInput)
    const u1 = result.components[0]!
    const c6 = result.components[1]!

    // Calculate final squared distances
    const u1_c11 = u1.pads.find((p) => p.networkId === "C1.1")!
    const u1_c12 = u1.pads.find((p) => p.networkId === "C1.2")!
    const c6_c11 = c6.pads.find((p) => p.networkId === "C1.1")!
    const c6_c12 = c6.pads.find((p) => p.networkId === "C1.2")!

    const c11_dist = Math.hypot(
      u1_c11.absoluteCenter.x - c6_c11.absoluteCenter.x,
      u1_c11.absoluteCenter.y - c6_c11.absoluteCenter.y,
    )
    const c12_dist = Math.hypot(
      u1_c12.absoluteCenter.x - c6_c12.absoluteCenter.x,
      u1_c12.absoluteCenter.y - c6_c12.absoluteCenter.y,
    )
    const squaredSum = c11_dist * c11_dist + c12_dist * c12_dist

    rotationResults.push({
      rotation,
      squaredSum,
      center: { x: c6.center.x, y: c6.center.y },
    })

    console.log(
      `${rotation}°: center=(${c6.center.x.toFixed(3)}, ${c6.center.y.toFixed(3)}), squaredSum=${squaredSum.toFixed(3)}`,
    )
  }

  // Find the truly optimal rotation
  const optimalResult = rotationResults.reduce((best, current) =>
    current.squaredSum < best.squaredSum ? current : best,
  )

  console.log(`\n=== Results ===`)
  console.log(
    `Optimal rotation: ${optimalResult.rotation}° with squaredSum=${optimalResult.squaredSum.toFixed(3)}`,
  )

  // Now test what the algorithm actually chooses when all rotations are available
  const openInput = {
    ...baseInput,
    components: [
      baseInput.components[0]!, // U1 unchanged
      {
        ...baseInput.components[1]!,
        // Remove rotation constraints - let algorithm choose
        availableRotationDegrees: undefined,
      },
    ],
  }

  const openResult = pack(openInput)
  const openC6 = openResult.components[1]!

  console.log(
    `Algorithm chose: ${openC6.ccwRotationOffset}° (should match optimal ${optimalResult.rotation}°)`,
  )

  expect(openResult.components.length).toBe(2)
})
