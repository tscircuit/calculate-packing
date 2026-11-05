import { test, expect } from "bun:test"
import { pack } from "../lib"
import { convertPackOutputToPackInput } from "../lib/plumbing/convertPackOutputToPackInput"
import type { PackInput, PackOutput } from "../lib/types"

test("convertPackOutputToPackInput should preserve availableRotationDegrees", () => {
  const packOutput: PackOutput = {
    components: [
      {
        componentId: "U1",
        center: { x: 0, y: 0 },
        ccwRotationOffset: 0,
        availableRotationDegrees: [0], // Should be preserved
        pads: [
          {
            padId: "U1_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: -5, y: 2 },
            size: { x: 1, y: 1 },
            absoluteCenter: { x: -5, y: 2 }, // Should be removed
          },
        ],
      },
      {
        componentId: "U2",
        center: { x: 10, y: 0 },
        ccwRotationOffset: Math.PI / 2, // Should be removed
        availableRotationDegrees: [0, 90], // Should be preserved
        pads: [
          {
            padId: "U2_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
            absoluteCenter: { x: 10, y: 0 }, // Should be removed
          },
        ],
      },
    ],
    minGap: 2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  const packInput = convertPackOutputToPackInput(packOutput)

  // Should preserve availableRotationDegrees
  expect(packInput.components[0]?.availableRotationDegrees).toEqual([0])
  expect(packInput.components[1]?.availableRotationDegrees).toEqual([0, 90])

  // Should remove output-only properties
  expect(packInput.components[0]).not.toHaveProperty("center")
  expect(packInput.components[0]).not.toHaveProperty("ccwRotationOffset")
  expect(packInput.components[0]?.pads[0]).not.toHaveProperty("absoluteCenter")

  // Should preserve input properties
  expect(packInput.components[0]?.componentId).toBe("U1")
  expect(packInput.components[0]?.pads[0]?.padId).toBe("U1_P1")
  expect(packInput.components[0]?.pads[0]?.offset).toEqual({ x: -5, y: 2 })
  expect(packInput.minGap).toBe(2)
  expect(packInput.packPlacementStrategy).toBe(
    "minimum_sum_squared_distance_to_network",
  )

  console.log("✅ convertPackOutputToPackInput preserves rotation constraints!")
})

test("static components keep absolute placement when converting to PackInput", () => {
  const packOutput: PackOutput = {
    components: [
      {
        componentId: "STATIC1",
        isStatic: true,
        center: { x: 12, y: -4 },
        ccwRotationOffset: 90,
        pads: [
          {
            padId: "STATIC1_P1",
            networkId: "GND",
            type: "rect",
            offset: { x: 1, y: 0 },
            size: { x: 2, y: 4 },
            absoluteCenter: { x: 13, y: -4 },
          },
        ],
      },
      {
        componentId: "DYNAMIC1",
        center: { x: 0, y: 0 },
        ccwRotationOffset: 0,
        pads: [
          {
            padId: "DYNAMIC1_P1",
            networkId: "VCC",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
            absoluteCenter: { x: 0, y: 0 },
          },
        ],
      },
    ],
    minGap: 1,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  const packInput = convertPackOutputToPackInput(packOutput)

  const staticComponent = packInput.components.find(
    (component) => component.componentId === "STATIC1",
  )
  expect(staticComponent?.isStatic).toBe(true)
  expect(staticComponent?.center).toEqual({ x: 12, y: -4 })
  expect(staticComponent?.ccwRotationOffset).toBe(90)
  expect(staticComponent?.pads[0]?.absoluteCenter).toEqual({ x: 13, y: -4 })

  const dynamicComponent = packInput.components.find(
    (component) => component.componentId === "DYNAMIC1",
  )
  expect(dynamicComponent).not.toHaveProperty("center")
  expect(dynamicComponent?.pads[0]).not.toHaveProperty("absoluteCenter")
})

test("convertPackOutputToPackInput restores unrotated local pad dimensions after 90/270deg packing", () => {
  const originalInput: PackInput = {
    components: [
      {
        componentId: "STATIC_90",
        isStatic: true,
        center: { x: 0, y: 0 },
        ccwRotationOffset: 90,
        pads: [
          {
            padId: "STATIC_90.1",
            networkId: "net1",
            type: "rect",
            offset: { x: 0, y: 1.5 },
            size: { x: 0.6, y: 1.4 },
          },
        ],
      },
      {
        componentId: "DYNAMIC_270",
        availableRotationDegrees: [270],
        pads: [
          {
            padId: "DYNAMIC_270.1",
            networkId: "net1",
            type: "rect",
            offset: { x: 0, y: 1.2 },
            size: { x: 0.5, y: 1.8 },
          },
        ],
      },
    ],
    minGap: 0.2,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  }

  const firstPass = pack(originalInput)
  const staticFirstPass = firstPass.components.find(
    (c) => c.componentId === "STATIC_90",
  )!
  const dynamicFirstPass = firstPass.components.find(
    (c) => c.componentId === "DYNAMIC_270",
  )!

  // First pass rotates both components by 90/270deg, swapping world-space pad sizes
  expect(staticFirstPass.pads[0]!.size).toEqual({ x: 1.4, y: 0.6 })
  expect(dynamicFirstPass.pads[0]!.size).toEqual({ x: 1.8, y: 0.5 })

  const roundTrippedInput = convertPackOutputToPackInput(firstPass)
  const roundTrippedStatic = roundTrippedInput.components.find(
    (c) => c.componentId === "STATIC_90",
  )!
  const roundTrippedDynamic = roundTrippedInput.components.find(
    (c) => c.componentId === "DYNAMIC_270",
  )!

  // Converted PackInput must restore unrotated local pad sizes matching pad.offset frame
  expect(roundTrippedStatic.pads[0]!.size).toEqual({ x: 0.6, y: 1.4 })
  expect(roundTrippedDynamic.pads[0]!.size).toEqual({ x: 0.5, y: 1.8 })

  // Re-packing the converted PackInput should produce identical world-space pad sizes
  const secondPass = pack(roundTrippedInput)
  const staticSecondPass = secondPass.components.find(
    (c) => c.componentId === "STATIC_90",
  )!
  const dynamicSecondPass = secondPass.components.find(
    (c) => c.componentId === "DYNAMIC_270",
  )!
  expect(staticSecondPass.pads[0]!.size).toEqual({ x: 1.4, y: 0.6 })
  expect(dynamicSecondPass.pads[0]!.size).toEqual({ x: 1.8, y: 0.5 })
})
