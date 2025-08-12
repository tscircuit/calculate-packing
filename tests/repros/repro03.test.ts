import { test, expect } from "bun:test"
import { pack, getGraphicsFromPackOutput } from "../../lib"
import type { PackInput } from "../../lib"
import { getSvgFromGraphicsObject } from "graphics-debug"
import fs from "fs"

test("pack soic8 with resistor and capacitor without overlap", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "pcb_component_0",
        pads: [
          {
            padId: "pcb_component_0_pad_0",
            networkId: "net_0",
            type: "rect",
            size: { x: 0.6, y: 0.45 },
            offset: { x: -1.905, y: -0.975 },
          },
          {
            padId: "pcb_component_0_pad_1",
            networkId: "net_1",
            type: "rect",
            size: { x: 0.6, y: 0.45 },
            offset: { x: -0.635, y: -0.975 },
          },
          {
            padId: "pcb_component_0_pad_2",
            networkId: "net_2",
            type: "rect",
            size: { x: 0.6, y: 0.45 },
            offset: { x: 0.635, y: -0.975 },
          },
          {
            padId: "pcb_component_0_pad_3",
            networkId: "net_3",
            type: "rect",
            size: { x: 0.6, y: 0.45 },
            offset: { x: 1.905, y: -0.975 },
          },
          {
            padId: "pcb_component_0_pad_4",
            networkId: "net_4",
            type: "rect",
            size: { x: 0.6, y: 0.45 },
            offset: { x: 1.905, y: 0.975 },
          },
          {
            padId: "pcb_component_0_pad_5",
            networkId: "net_5",
            type: "rect",
            size: { x: 0.6, y: 0.45 },
            offset: { x: 0.635, y: 0.975 },
          },
          {
            padId: "pcb_component_0_pad_6",
            networkId: "net_6",
            type: "rect",
            size: { x: 0.6, y: 0.45 },
            offset: { x: -0.635, y: 0.975 },
          },
          {
            padId: "pcb_component_0_pad_7",
            networkId: "net_7",
            type: "rect",
            size: { x: 0.6, y: 0.45 },
            offset: { x: -1.905, y: 0.975 },
          },
        ],
      },
      {
        componentId: "pcb_component_1",
        pads: [
          {
            padId: "pcb_component_1_pad_0",
            networkId: "net_8",
            type: "rect",
            size: { x: 0.6, y: 0.5 },
            offset: { x: -0.5, y: 0 },
          },
          {
            padId: "pcb_component_1_pad_1",
            networkId: "net_9",
            type: "rect",
            size: { x: 0.6, y: 0.5 },
            offset: { x: 0.5, y: 0 },
          },
        ],
      },
      {
        componentId: "pcb_component_2",
        pads: [
          {
            padId: "pcb_component_2_pad_0",
            networkId: "net_10",
            type: "rect",
            size: { x: 0.9, y: 0.8 },
            offset: { x: -0.8, y: 0 },
          },
          {
            padId: "pcb_component_2_pad_1",
            networkId: "net_11",
            type: "rect",
            size: { x: 0.9, y: 0.8 },
            offset: { x: 0.8, y: 0 },
          },
        ],
      },
    ],
    minGap: 1.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  // Save input for debugging
  // fs.writeFileSync("tests/no-overlap-soic8-resistor-capacitor-input.json", JSON.stringify(input, null, 2))

  const output = pack(input)

  // Generate visualization
  const graphics = getGraphicsFromPackOutput(output)
  const svg = getSvgFromGraphicsObject(graphics, { backgroundColor: "white" })
  fs.writeFileSync("tests/no-overlap-soic8-resistor-capacitor-debug.svg", svg)

  // Check that all components were placed
  expect(output.components).toHaveLength(3)

  // Helper function to check if two rectangles overlap with minGap
  const rectanglesOverlap = (
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number },
    gap: number,
  ): boolean => {
    const left1 = rect1.x - rect1.width / 2 - gap / 2
    const right1 = rect1.x + rect1.width / 2 + gap / 2
    const top1 = rect1.y - rect1.height / 2 - gap / 2
    const bottom1 = rect1.y + rect1.height / 2 + gap / 2

    const left2 = rect2.x - rect2.width / 2 - gap / 2
    const right2 = rect2.x + rect2.width / 2 + gap / 2
    const top2 = rect2.y - rect2.height / 2 - gap / 2
    const bottom2 = rect2.y + rect2.height / 2 + gap / 2

    return !(
      left1 >= right2 ||
      right1 <= left2 ||
      top1 >= bottom2 ||
      bottom1 <= top2
    )
  }

  // Get bounding boxes for each component
  const componentBounds = output.components.map((component) => {
    // Calculate the bounding box of all pads after rotation
    let minX = Infinity,
      maxX = -Infinity
    let minY = Infinity,
      maxY = -Infinity

    for (const pad of component.pads) {
      // Apply rotation to pad offset
      const angle = ((component.ccwRotationOffsetDegrees || 0) * Math.PI) / 180
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      const rotatedX = pad.offset.x * cos - pad.offset.y * sin
      const rotatedY = pad.offset.x * sin + pad.offset.y * cos

      const padLeft = component.center.x + rotatedX - pad.size.x / 2
      const padRight = component.center.x + rotatedX + pad.size.x / 2
      const padTop = component.center.y + rotatedY - pad.size.y / 2
      const padBottom = component.center.y + rotatedY + pad.size.y / 2

      minX = Math.min(minX, padLeft)
      maxX = Math.max(maxX, padRight)
      minY = Math.min(minY, padTop)
      maxY = Math.max(maxY, padBottom)
    }

    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY,
      componentId: component.componentId,
    }
  })

  // Log component positions for debugging
  console.log("Component positions and bounds:")
  componentBounds.forEach((bounds, i) => {
    const component = output.components[i]
    console.log(
      `${component.componentId}: center=(${component.center.x.toFixed(3)}, ${component.center.y.toFixed(3)}), rotation=${component.ccwRotationOffsetDegrees}°`,
    )
    console.log(
      `  bounds: x=${bounds.x.toFixed(3)}, y=${bounds.y.toFixed(3)}, width=${bounds.width.toFixed(3)}, height=${bounds.height.toFixed(3)}`,
    )
  })

  // Check for overlaps between all pairs of components
  for (let i = 0; i < componentBounds.length; i++) {
    for (let j = i + 1; j < componentBounds.length; j++) {
      const overlaps = rectanglesOverlap(
        componentBounds[i],
        componentBounds[j],
        input.minGap,
      )

      if (overlaps) {
        console.log(
          `\nOVERLAP DETECTED between ${componentBounds[i].componentId} and ${componentBounds[j].componentId}`,
        )
        console.log(`Required gap: ${input.minGap}`)
        const dist = Math.sqrt(
          Math.pow(componentBounds[i].x - componentBounds[j].x, 2) +
            Math.pow(componentBounds[i].y - componentBounds[j].y, 2),
        )
        console.log(`Center distance: ${dist.toFixed(3)}`)

        // Calculate actual gap
        const bounds1 = componentBounds[i]
        const bounds2 = componentBounds[j]

        const xGap = Math.max(
          0,
          Math.abs(bounds1.x - bounds2.x) - (bounds1.width + bounds2.width) / 2,
        )
        const yGap = Math.max(
          0,
          Math.abs(bounds1.y - bounds2.y) -
            (bounds1.height + bounds2.height) / 2,
        )
        const actualGap = Math.sqrt(xGap * xGap + yGap * yGap)
        console.log(`Actual gap: ${actualGap.toFixed(3)}`)

        // This appears to be a bug in the packing algorithm where components
        // are placed at the same position
        expect(overlaps).toBe(false)
      }
    }
  }
})
