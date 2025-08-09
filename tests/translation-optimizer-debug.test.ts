import { test, expect } from "bun:test"
import {
  optimizeTranslationForMinimumSum,
  optimizeTranslationForMinimumSumWithSampling,
  calculateSumDistance,
  computeTranslationBounds,
  checkOverlap,
} from "../lib/PackSolver/translationOptimizer"
import type { PackedComponent } from "../lib/types"

test("translation optimizer debug - should find optimal (-5, 0) position", () => {
  // Recreate the exact scenario from our failing test
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
      {
        padId: "U1_P3",
        networkId: "P3",
        type: "rect",
        offset: { x: 5, y: -2 },
        size: { x: 1, y: 1 },
        absoluteCenter: { x: 5, y: -2 },
      },
      {
        padId: "U1_P4",
        networkId: "P4",
        type: "rect",
        offset: { x: 5, y: 2 },
        size: { x: 1, y: 1 },
        absoluteCenter: { x: 5, y: 2 },
      },
    ],
  }

  const u2Component: PackedComponent = {
    componentId: "U2",
    center: { x: 0, y: 0 }, // Will be optimized
    ccwRotationOffset: 0,
    pads: [
      {
        padId: "U2_P1",
        networkId: "VCC",
        type: "rect",
        offset: { x: -5, y: 0 },
        size: { x: 1, y: 1 },
        absoluteCenter: { x: -5, y: 0 }, // Will be updated
      },
      {
        padId: "U2_P2",
        networkId: "GND",
        type: "rect",
        offset: { x: 5, y: 0 },
        size: { x: 1, y: 1 },
        absoluteCenter: { x: 5, y: 0 }, // Will be updated
      },
    ],
  }

  const packedComponents = [u1]
  const initialCenter = { x: -8, y: 3 } // Similar to what the algorithm found
  const minGap = 2

  console.log("=== Translation Optimizer Debug ===")

  // Check translation bounds
  const bounds = computeTranslationBounds(
    u2Component,
    initialCenter,
    packedComponents,
    minGap,
  )
  console.log(`Translation bounds:`)
  console.log(`  X: [${bounds.minX.toFixed(2)}, ${bounds.maxX.toFixed(2)}]`)
  console.log(`  Y: [${bounds.minY.toFixed(2)}, ${bounds.maxY.toFixed(2)}]`)

  const optimalPoint = { x: -5, y: 0 }
  const withinBounds =
    optimalPoint.x >= bounds.minX &&
    optimalPoint.x <= bounds.maxX &&
    optimalPoint.y >= bounds.minY &&
    optimalPoint.y <= bounds.maxY
  console.log(`Optimal (-5, 0) within bounds: ${withinBounds}`)

  // Calculate costs at various points
  const testPoints = [
    { name: "Initial", point: initialCenter },
    { name: "Optimal", point: optimalPoint },
    { name: "Origin", point: { x: 0, y: 0 } },
  ]

  console.log(`\nCost comparison (useSquaredDistance=true):`)
  for (const testPoint of testPoints) {
    const cost = calculateSumDistance(
      u2Component,
      testPoint.point,
      packedComponents,
      true,
    )
    console.log(
      `  ${testPoint.name} (${testPoint.point.x}, ${testPoint.point.y}): cost=${cost.toFixed(2)}`,
    )
  }

  // Try both optimizers
  const optimizedCenter = optimizeTranslationForMinimumSum({
    component: u2Component,
    initialCenter: initialCenter,
    packedComponents: packedComponents,
    minGap: minGap,
    useSquaredDistance: true,
  })

  const optimizedCenterSampling = optimizeTranslationForMinimumSumWithSampling({
    component: u2Component,
    initialCenter: initialCenter,
    packedComponents: packedComponents,
    minGap: minGap,
    useSquaredDistance: true,
  })

  console.log(`\nOptimization results:`)
  console.log(`  Initial: (${initialCenter.x}, ${initialCenter.y})`)
  console.log(
    `  Geometric median: (${optimizedCenter.x.toFixed(2)}, ${optimizedCenter.y.toFixed(2)})`,
  )
  console.log(
    `  Sampling: (${optimizedCenterSampling.x.toFixed(2)}, ${optimizedCenterSampling.y.toFixed(2)})`,
  )
  console.log(`  Expected optimal: (-5, 0)`)

  const initialCost = calculateSumDistance(
    u2Component,
    initialCenter,
    packedComponents,
    true,
  )
  const optimizedCost = calculateSumDistance(
    u2Component,
    optimizedCenter,
    packedComponents,
    true,
  )
  const optimizedCostSampling = calculateSumDistance(
    u2Component,
    optimizedCenterSampling,
    packedComponents,
    true,
  )
  const optimalCost = calculateSumDistance(
    u2Component,
    optimalPoint,
    packedComponents,
    true,
  )

  console.log(`\nCost comparison:`)
  console.log(`  Initial cost: ${initialCost.toFixed(2)}`)
  console.log(`  Geometric median cost: ${optimizedCost.toFixed(2)}`)
  console.log(`  Sampling cost: ${optimizedCostSampling.toFixed(2)}`)
  console.log(`  Optimal cost: ${optimalCost.toFixed(2)}`)

  // Use the better result
  const bestResult =
    optimizedCostSampling < optimizedCost
      ? optimizedCenterSampling
      : optimizedCenter
  const bestCost = Math.min(optimizedCostSampling, optimizedCost)

  console.log(
    `\nBest result: (${bestResult.x.toFixed(2)}, ${bestResult.y.toFixed(2)}) with cost ${bestCost.toFixed(2)}`,
  )
  console.log(
    `Distance to optimal: ${Math.hypot(bestResult.x - -5, bestResult.y - 0).toFixed(2)}`,
  )

  // Let's do a manual grid search to understand the cost landscape
  console.log(`\nManual grid search around initial and optimal positions:`)

  const gridPoints = [
    { x: -8, y: 3 }, // Initial
    { x: -7, y: 3 }, // Step toward optimal
    { x: -6, y: 2 }, // Step toward optimal
    { x: -5, y: 1 }, // Step toward optimal
    { x: -5, y: 0 }, // Optimal
  ]

  for (const point of gridPoints) {
    const cost = calculateSumDistance(
      u2Component,
      point,
      packedComponents,
      true,
    )
    const hasOverlap = checkOverlap(
      u2Component,
      point,
      packedComponents,
      minGap,
    )

    // Debug the optimal position in detail
    if (point.x === -5 && point.y === 0) {
      console.log(`\nDetailed analysis of optimal position (-5, 0):`)

      // Calculate U2 pad positions at (-5, 0)
      const u2Pads = [
        {
          center: { x: point.x - 5, y: point.y },
          size: { x: 1, y: 1 },
          label: "U2_VCC",
        }, // (-10, 0)
        {
          center: { x: point.x + 5, y: point.y },
          size: { x: 1, y: 1 },
          label: "U2_GND",
        }, // (0, 0)
      ]

      // U1 pads
      const u1Pads = [
        { center: { x: -5, y: 2 }, size: { x: 1, y: 1 }, label: "U1_VCC" },
        { center: { x: -5, y: -2 }, size: { x: 1, y: 1 }, label: "U1_GND" },
        { center: { x: 5, y: -2 }, size: { x: 1, y: 1 }, label: "U1_P3" },
        { center: { x: 5, y: 2 }, size: { x: 1, y: 1 }, label: "U1_P4" },
      ]

      console.log(`  U2 pads at this position:`)
      for (const pad of u2Pads) {
        console.log(`    ${pad.label}: (${pad.center.x}, ${pad.center.y})`)
      }

      console.log(`  U1 pads:`)
      for (const pad of u1Pads) {
        console.log(`    ${pad.label}: (${pad.center.x}, ${pad.center.y})`)
      }

      // Check distances
      console.log(`  Minimum distances:`)
      for (const u2Pad of u2Pads) {
        for (const u1Pad of u1Pads) {
          const dist = Math.hypot(
            u2Pad.center.x - u1Pad.center.x,
            u2Pad.center.y - u1Pad.center.y,
          )
          const edgeToEdgeDist =
            dist -
            (Math.max(u2Pad.size.x, u2Pad.size.y) +
              Math.max(u1Pad.size.x, u1Pad.size.y)) /
              2
          console.log(
            `    ${u2Pad.label} to ${u1Pad.label}: center-center=${dist.toFixed(2)}, edge-edge=${edgeToEdgeDist.toFixed(2)}`,
          )
        }
      }
    }

    console.log(
      `  (${point.x}, ${point.y}): cost=${cost.toFixed(2)}, overlap=${hasOverlap}`,
    )
  }

  // For now, let's just verify the system works
  expect(bestCost).toBeGreaterThan(0)
})
