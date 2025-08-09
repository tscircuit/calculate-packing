import { test, expect } from "bun:test"
import { pack } from "../lib"

test("verify network03 C1 and C2 pad dimensions when rotated", () => {
  // Simplified version of min-sum-distance-to-network03 focusing on C1 and C2
  const result = pack({
    components: [
      {
        componentId: "U1",
        pads: [
          {
            padId: "U1.1",
            networkId: "C1.1",
            type: "rect",
            offset: { x: -1, y: 0.1 },
            size: { x: 0.05, y: 0.05 },
          },
          {
            padId: "U1.2",
            networkId: "C1.2",
            type: "rect",
            offset: { x: -1, y: -0.1 },
            size: { x: 0.05, y: 0.05 },
          },
        ],
      },
      {
        componentId: "C1",
        pads: [
          {
            padId: "C1.1",
            networkId: "C1.1",
            type: "rect",
            offset: { x: 0, y: 0.551 },
            size: { x: 0.05, y: 0.05 },
          },
          {
            padId: "C1.2",
            networkId: "C1.2",
            type: "rect",
            offset: { x: 0, y: -0.551 },
            size: { x: 0.05, y: 0.05 },
          },
          {
            padId: "C1-body",
            networkId: "disconnected_4",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 0.529, y: 1.058 }, // Original: narrow and tall
          },
        ],
      },
      {
        componentId: "C2",
        pads: [
          {
            padId: "C2.1",
            networkId: "C1.1",
            type: "rect",
            offset: { x: 0, y: 0.551 },
            size: { x: 0.05, y: 0.05 },
          },
          {
            padId: "C2.2",
            networkId: "C1.2",
            type: "rect",
            offset: { x: 0, y: -0.551 },
            size: { x: 0.05, y: 0.05 },
          },
          {
            padId: "C2-body",
            networkId: "disconnected_5",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 0.529, y: 1.058 }, // Original: narrow and tall
          },
        ],
      },
    ],
    minGap: 0.2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  })

  const c1 = result.components.find((c) => c.componentId === "C1")!
  const c2 = result.components.find((c) => c.componentId === "C2")!

  console.log("=== Network03 Components Analysis ===")
  console.log(
    `C1: rotation=${c1.ccwRotationOffset}°, center=(${c1.center.x.toFixed(3)}, ${c1.center.y.toFixed(3)})`,
  )
  console.log(
    `C2: rotation=${c2.ccwRotationOffset}°, center=(${c2.center.x.toFixed(3)}, ${c2.center.y.toFixed(3)})`,
  )

  const c1Body = c1.pads.find((p) => p.padId === "C1-body")!
  const c2Body = c2.pads.find((p) => p.padId === "C2-body")!

  console.log(`\nPad dimensions:`)
  console.log(
    `  C1-body: ${c1Body.size.x.toFixed(3)} x ${c1Body.size.y.toFixed(3)}`,
  )
  console.log(
    `  C2-body: ${c2Body.size.x.toFixed(3)} x ${c2Body.size.y.toFixed(3)}`,
  )

  // Check if rotations resulted in proper dimension swapping
  const c1IsNarrowAndTall = c1Body.size.x < c1Body.size.y
  const c2IsWideAndShort = c2Body.size.x > c2Body.size.y

  if (c1.ccwRotationOffset === 0 || c1.ccwRotationOffset === 180) {
    console.log(
      `  C1 (${c1.ccwRotationOffset}°): Should keep original aspect - narrow and tall: ${c1IsNarrowAndTall ? "✓" : "✗"}`,
    )
    expect(c1IsNarrowAndTall).toBe(true)
  } else if (c1.ccwRotationOffset === 90 || c1.ccwRotationOffset === 270) {
    console.log(
      `  C1 (${c1.ccwRotationOffset}°): Should be wide and short: ${!c1IsNarrowAndTall ? "✓" : "✗"}`,
    )
    expect(c1IsNarrowAndTall).toBe(false)
  }

  if (c2.ccwRotationOffset === 0 || c2.ccwRotationOffset === 180) {
    console.log(
      `  C2 (${c2.ccwRotationOffset}°): Should keep original aspect - narrow and tall: ${!c2IsWideAndShort ? "✓" : "✗"}`,
    )
    expect(c2IsWideAndShort).toBe(false)
  } else if (c2.ccwRotationOffset === 90 || c2.ccwRotationOffset === 270) {
    console.log(
      `  C2 (${c2.ccwRotationOffset}°): Should be wide and short: ${c2IsWideAndShort ? "✓" : "✗"}`,
    )
    expect(c2IsWideAndShort).toBe(true)
  }

  expect(result.components.length).toBe(3)
})
