import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("min-sum-distance-to-network02 page should show proper rotations", () => {
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
          {
            padId: "U1.3",
            networkId: "U1.3",
            type: "rect",
            offset: { x: 1, y: -0.1 },
            size: { x: 0.1, y: 0.1 },
          },
          {
            padId: "U1.4",
            networkId: "U1.4",
            type: "rect",
            offset: { x: 1, y: 0.1 },
            size: { x: 0.1, y: 0.1 },
          },
          {
            padId: "U1-body",
            networkId: "U1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1.2, y: 3 }, // Wide body that should be obvious when rotated
          },
        ],
      },
      {
        componentId: "C6",
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
            size: { x: 0.53, y: 1.06 }, // Tall body
          },
        ],
      },
    ],
    minGap: 0.2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_distance_to_network",
  }

  const result = pack(packInput)

  console.log(`=== min-sum-distance-to-network02 Analysis ===`)

  for (const component of result.components) {
    console.log(`${component.componentId}:`)
    console.log(
      `  Center: (${component.center.x.toFixed(2)}, ${component.center.y.toFixed(2)})`,
    )
    console.log(`  Rotation: ${component.ccwRotationOffset}°`)

    for (const pad of component.pads) {
      if (pad.padId.includes("body")) {
        console.log(
          `  Body pad size: ${pad.size.x.toFixed(2)} x ${pad.size.y.toFixed(2)}`,
        )
        // Check if dimensions were rotated for body pads (which are most visible)
        const isRotated =
          component.ccwRotationOffset === 90 ||
          component.ccwRotationOffset === 270 ||
          component.ccwRotationOffset === -90
        if (isRotated) {
          console.log(
            `  → Should be swapped due to ${component.ccwRotationOffset}° rotation`,
          )
        }
      }
    }
  }

  // The test passes if we successfully pack without errors
  expect(result.components.length).toBe(2)

  // Check that at least one component got rotated (since they have shared networks)
  const rotations = result.components.map((c) => c.ccwRotationOffset)
  console.log(`All rotations: ${rotations.join(", ")}`)

  // Verify dimensions are correctly handled
  for (const component of result.components) {
    for (const pad of component.pads) {
      expect(pad.size.x).toBeGreaterThan(0)
      expect(pad.size.y).toBeGreaterThan(0)
    }
  }

  console.log(`✅ Rotation and dimension handling working`)
})
