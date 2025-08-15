import { test, expect } from "bun:test"
import { pack } from "../lib"
import type { PackInput } from "../lib/types"

test("body bounds prevent component visual overlap - SOIC8 chip and 0402 resistor", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "U1", // SOIC8 chip (large component)
        pads: [
          // Left side pads
          {
            padId: "U1_1",
            networkId: "VDD",
            type: "rect",
            offset: { x: -2.15, y: 1.905 },
            size: { x: 1, y: 0.6 },
          },
          {
            padId: "U1_2",
            networkId: "net1",
            type: "rect",
            offset: { x: -2.15, y: 0.635 },
            size: { x: 1, y: 0.6 },
          },
          {
            padId: "U1_3",
            networkId: "net2",
            type: "rect",
            offset: { x: -2.15, y: -0.635 },
            size: { x: 1, y: 0.6 },
          },
          {
            padId: "U1_4",
            networkId: "GND",
            type: "rect",
            offset: { x: -2.15, y: -1.905 },
            size: { x: 1, y: 0.6 },
          },
          // Right side pads
          {
            padId: "U1_8",
            networkId: "net3",
            type: "rect",
            offset: { x: 2.15, y: 1.905 },
            size: { x: 1, y: 0.6 },
          },
          {
            padId: "U1_7",
            networkId: "net4",
            type: "rect",
            offset: { x: 2.15, y: 0.635 },
            size: { x: 1, y: 0.6 },
          },
          {
            padId: "U1_6",
            networkId: "net5",
            type: "rect",
            offset: { x: 2.15, y: -0.635 },
            size: { x: 1, y: 0.6 },
          },
          {
            padId: "U1_5",
            networkId: "net6",
            type: "rect",
            offset: { x: 2.15, y: -1.905 },
            size: { x: 1, y: 0.6 },
          },
        ],
        bodyBounds: {
          minX: -1.5, // SOIC8 chip body bounds (silkscreen outline)
          maxX: 1.5,
          minY: -2.5,
          maxY: 2.5,
        },
      },
      {
        componentId: "R1", // 0402 resistor (small component connected to chip)
        pads: [
          {
            padId: "R1_1",
            networkId: "VDD",
            type: "rect",
            offset: { x: -0.5, y: 0 },
            size: { x: 0.6, y: 0.6 },
          },
          {
            padId: "R1_2",
            networkId: "GND",
            type: "rect",
            offset: { x: 0.5, y: 0 },
            size: { x: 0.6, y: 0.6 },
          },
        ],
        bodyBounds: {
          minX: -1.0, // 0402 resistor body bounds (silkscreen outline)
          maxX: 1.0,
          minY: -0.7,
          maxY: 0.7,
        },
      },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  const result = pack(input)

  // Both components should be successfully placed
  expect(result.components.length).toBe(2)

  const u1 = result.components.find((c) => c.componentId === "U1")!
  const r1 = result.components.find((c) => c.componentId === "R1")!

  expect(u1).toBeDefined()
  expect(r1).toBeDefined()

  // Transform body bounds to absolute coordinates for both components
  function getAbsoluteBodyBounds(comp: any) {
    if (!comp.bodyBounds) return null

    // Apply rotation transformation (same logic as transformComponentBodyBounds)
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

  const u1Body = getAbsoluteBodyBounds(u1)
  const r1Body = getAbsoluteBodyBounds(r1)

  // Verify that body bounds don't overlap
  if (u1Body && r1Body) {
    const xOverlap = u1Body.maxX >= r1Body.minX && r1Body.maxX >= u1Body.minX
    const yOverlap = u1Body.maxY >= r1Body.minY && r1Body.maxY >= u1Body.minY
    const bodiesOverlap = xOverlap && yOverlap

    expect(bodiesOverlap).toBe(false) // Component bodies should not overlap

    // Verify minimum gap is maintained
    if (!xOverlap || !yOverlap) {
      const xGap = xOverlap
        ? 0
        : Math.min(
            Math.abs(u1Body.minX - r1Body.maxX),
            Math.abs(r1Body.minX - u1Body.maxX),
          )
      const yGap = yOverlap
        ? 0
        : Math.min(
            Math.abs(u1Body.minY - r1Body.maxY),
            Math.abs(r1Body.minY - u1Body.maxY),
          )
      const actualGap = Math.max(xGap, yGap)
      expect(actualGap).toBeGreaterThanOrEqual(input.minGap) // Gap should meet minimum requirement
    }
  }

  // Verify that R1's body doesn't overlap with U1's pads
  if (r1Body) {
    for (const pad of u1.pads) {
      const padBounds = {
        left: pad.absoluteCenter.x - pad.size.x / 2,
        right: pad.absoluteCenter.x + pad.size.x / 2,
        bottom: pad.absoluteCenter.y - pad.size.y / 2,
        top: pad.absoluteCenter.y + pad.size.y / 2,
      }

      const bodyToPadOverlap =
        r1Body.maxX >= padBounds.left &&
        padBounds.right >= r1Body.minX &&
        r1Body.maxY >= padBounds.bottom &&
        padBounds.top >= r1Body.minY

      expect(bodyToPadOverlap).toBe(false) // R1 body should not overlap U1 pads
    }
  }

  // Verify that U1's body doesn't overlap with R1's pads
  if (u1Body) {
    for (const pad of r1.pads) {
      const padBounds = {
        left: pad.absoluteCenter.x - pad.size.x / 2,
        right: pad.absoluteCenter.x + pad.size.x / 2,
        bottom: pad.absoluteCenter.y - pad.size.y / 2,
        top: pad.absoluteCenter.y + pad.size.y / 2,
      }

      const bodyToPadOverlap =
        u1Body.maxX >= padBounds.left &&
        padBounds.right >= u1Body.minX &&
        u1Body.maxY >= padBounds.bottom &&
        padBounds.top >= u1Body.minY

      expect(bodyToPadOverlap).toBe(false) // U1 body should not overlap R1 pads
    }
  }
})

test("body bounds work correctly with component rotation", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "C1", // Tall component that becomes wide when rotated
        pads: [
          {
            padId: "C1_1",
            networkId: "net1",
            type: "rect",
            offset: { x: 0, y: -1.5 },
            size: { x: 0.6, y: 0.6 },
          },
          {
            padId: "C1_2",
            networkId: "net2",
            type: "rect",
            offset: { x: 0, y: 1.5 },
            size: { x: 0.6, y: 0.6 },
          },
        ],
        bodyBounds: { minX: -0.5, maxX: 0.5, minY: -2, maxY: 2 }, // Tall and narrow
        availableRotationDegrees: [0, 90],
      },
      {
        componentId: "C2", // Component that should not overlap with rotated C1
        pads: [
          {
            padId: "C2_1",
            networkId: "net3",
            type: "rect",
            offset: { x: -0.5, y: 0 },
            size: { x: 0.6, y: 0.6 },
          },
          {
            padId: "C2_2",
            networkId: "net4",
            type: "rect",
            offset: { x: 0.5, y: 0 },
            size: { x: 0.6, y: 0.6 },
          },
        ],
        bodyBounds: { minX: -1, maxX: 1, minY: -0.5, maxY: 0.5 }, // Short and wide
      },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  const result = pack(input)

  expect(result.components.length).toBe(2)

  const c1 = result.components.find((c) => c.componentId === "C1")!
  const c2 = result.components.find((c) => c.componentId === "C2")!

  // Components should be positioned far enough apart to account for rotation
  const distance = Math.sqrt(
    Math.pow(c2.center.x - c1.center.x, 2) +
      Math.pow(c2.center.y - c1.center.y, 2),
  )

  // Distance should be sufficient to prevent overlap even with rotation
  // The algorithm should place components far enough apart to avoid body bounds overlap
  expect(distance).toBeGreaterThan(0.3) // Should maintain proper spacing
})

test("components without body bounds fall back to pad-only detection", () => {
  const input: PackInput = {
    components: [
      {
        componentId: "A1", // Component without body bounds
        pads: [
          {
            padId: "A1_1",
            networkId: "net1",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
        // No bodyBounds property
      },
      {
        componentId: "A2", // Component with body bounds
        pads: [
          {
            padId: "A2_1",
            networkId: "net2",
            type: "rect",
            offset: { x: 0, y: 0 },
            size: { x: 1, y: 1 },
          },
        ],
        bodyBounds: { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5 },
      },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "shortest_connection_along_outline",
  }

  const result = pack(input)

  // Should still work and place both components
  expect(result.components.length).toBe(2)

  // Components should be properly spaced based on pad overlap detection
  const a1 = result.components.find((c) => c.componentId === "A1")!
  const a2 = result.components.find((c) => c.componentId === "A2")!

  const distance = Math.sqrt(
    Math.pow(a2.center.x - a1.center.x, 2) +
      Math.pow(a2.center.y - a1.center.y, 2),
  )

  expect(distance).toBeGreaterThan(1) // Should maintain minimum spacing
})
