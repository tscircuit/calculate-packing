import { describe, it, expect } from "bun:test"
import {
  computeTranslationBounds,
  calculateSumDistance,
  checkOverlap,
  optimizeTranslationForMinimumSum,
} from "../lib/PackSolver/translationOptimizer"
import type { PackedComponent } from "../lib/types"

describe("Translation Optimizer Unit Tests", () => {
  const createTestComponent = (
    componentId: string,
    center = { x: 0, y: 0 },
    padOffsets = [{ x: 0, y: 0 }],
    networkIds = ["VCC"],
  ): PackedComponent => ({
    componentId,
    center,
    ccwRotationOffset: 0,
    pads: padOffsets.map((offset, i) => ({
      padId: `${componentId}_P${i + 1}`,
      networkId: networkIds[i] || "VCC",
      type: "rect" as const,
      offset,
      size: { x: 1, y: 1 },
      absoluteCenter: {
        x: center.x + offset.x,
        y: center.y + offset.y,
      },
    })),
  })

  describe("calculateSumDistance", () => {
    it("should return 0 for no connected pads", () => {
      const component = createTestComponent(
        "U1",
        { x: 0, y: 0 },
        [{ x: 0, y: 0 }],
        ["NET1"],
      )
      const candidateCenter = { x: 0, y: 0 }
      const packedComponents = [
        createTestComponent("U2", { x: 10, y: 0 }, [{ x: 0, y: 0 }], ["NET2"]),
      ]

      const distance = calculateSumDistance(
        component,
        candidateCenter,
        packedComponents,
      )
      expect(distance).toBe(0)
    })

    it("should calculate correct sum distance for connected pads", () => {
      const component = createTestComponent(
        "U1",
        { x: 0, y: 0 },
        [{ x: 0, y: 0 }],
        ["VCC"],
      )
      const candidateCenter = { x: 0, y: 0 }
      const packedComponents = [
        createTestComponent("U2", { x: 10, y: 0 }, [{ x: 0, y: 0 }], ["VCC"]),
      ]

      const distance = calculateSumDistance(
        component,
        candidateCenter,
        packedComponents,
      )
      expect(distance).toBe(10) // Distance between (0,0) and (10,0)
    })

    it("should find minimum distance when multiple same-network pads exist", () => {
      const component = createTestComponent(
        "U1",
        { x: 0, y: 0 },
        [{ x: 0, y: 0 }],
        ["VCC"],
      )
      const candidateCenter = { x: 0, y: 0 }
      const packedComponents = [
        createTestComponent("U2", { x: 10, y: 0 }, [{ x: 0, y: 0 }], ["VCC"]),
        createTestComponent("U3", { x: 3, y: 0 }, [{ x: 0, y: 0 }], ["VCC"]),
      ]

      const distance = calculateSumDistance(
        component,
        candidateCenter,
        packedComponents,
      )
      expect(distance).toBe(3) // Should pick closer pad at (3,0)
    })
  })

  describe("checkOverlap", () => {
    it("should detect no overlap when components are far apart", () => {
      const component = createTestComponent("U1")
      const candidateCenter = { x: 0, y: 0 }
      const packedComponents = [createTestComponent("U2", { x: 20, y: 0 })]
      const minGap = 2

      const hasOverlap = checkOverlap(
        component,
        candidateCenter,
        packedComponents,
        minGap,
      )
      expect(hasOverlap).toBe(false)
    })

    it("should detect overlap when components are too close", () => {
      const component = createTestComponent("U1")
      const candidateCenter = { x: 0, y: 0 }
      const packedComponents = [createTestComponent("U2", { x: 1, y: 0 })]
      const minGap = 2

      const hasOverlap = checkOverlap(
        component,
        candidateCenter,
        packedComponents,
        minGap,
      )
      expect(hasOverlap).toBe(true)
    })
  })

  describe("optimizeTranslationForMinimumSum", () => {
    it("should optimize position to minimize distance", () => {
      const component = createTestComponent(
        "U1",
        { x: 0, y: 0 },
        [{ x: 0, y: 0 }],
        ["VCC"],
      )
      const initialCenter = { x: 0, y: 0 }
      const packedComponents = [
        createTestComponent("U2", { x: 10, y: 0 }, [{ x: 0, y: 0 }], ["VCC"]),
      ]
      const minGap = 2

      const optimizedCenter = optimizeTranslationForMinimumSum({
        component,
        initialCenter,
        packedComponents,
        minGap,
      })

      // Should move closer to the packed component (towards positive X)
      expect(optimizedCenter.x).toBeGreaterThan(initialCenter.x)
    })

    it("should not move beyond bounds", () => {
      const component = createTestComponent(
        "U1",
        { x: 0, y: 0 },
        [{ x: 0, y: 0 }],
        ["VCC"],
      )
      const initialCenter = { x: 0, y: 0 }
      const packedComponents = [
        createTestComponent("U2", { x: 2, y: 0 }, [{ x: 0, y: 0 }], ["VCC"]),
      ]
      const minGap = 2

      const optimizedCenter = optimizeTranslationForMinimumSum({
        component,
        initialCenter,
        packedComponents,
        minGap,
      })

      // Should respect the minimum gap constraint
      const distanceBetweenCenters = Math.abs(optimizedCenter.x - 2)
      expect(distanceBetweenCenters).toBeGreaterThanOrEqual(minGap)
    })

    it("should handle multiple networks", () => {
      const component = createTestComponent(
        "U1",
        { x: 0, y: 0 },
        [
          { x: -1, y: 0 },
          { x: 1, y: 0 },
        ],
        ["VCC", "GND"],
      )
      const initialCenter = { x: 0, y: 0 }
      const packedComponents = [
        createTestComponent("U2", { x: 10, y: 0 }, [{ x: 0, y: 0 }], ["VCC"]),
        createTestComponent("U3", { x: -10, y: 0 }, [{ x: 0, y: 0 }], ["GND"]),
      ]
      const minGap = 2

      const optimizedCenter = optimizeTranslationForMinimumSum({
        component,
        initialCenter,
        packedComponents,
        minGap,
      })

      // Should find a position that balances both network connections
      // Since VCC pad is at -1 and GND pad is at +1, and packed components
      // are at +10 and -10, the optimal position should be close to center
      expect(Math.abs(optimizedCenter.x)).toBeLessThan(3)
    })
  })
})
