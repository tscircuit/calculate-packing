import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import { convertPackOutputToPackInput } from "../../lib/plumbing/convertPackOutputToPackInput"
import circuitJson from "./repro10/XiaoRP2040Board.circuit.circuit.json"

test.skip("repro10 - debug iteration 4006 viableBounds issue", async () => {
  const packOutput = convertCircuitJsonToPackOutput(circuitJson as CircuitJson, {
    shouldAddInnerObstacles: true,
    source_group_id: "source_group_0",
  })
  const packInput = convertPackOutputToPackInput(packOutput)

  const solver = new PackSolver2({
    ...packInput,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
    minGap: 0.4,
  })

  // Step to iteration 4006
  for (let i = 0; i < 4006; i++) {
    solver.step()
  }

  // Visualize at this iteration
  const graphics = solver.visualize()
  console.log("Iteration 4006 visualization:")
  console.log(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
    }),
  )

  // Get the current single component solver to inspect
  const singleSolver = (solver as any).activeSubSolver
  console.log("\nsingleSolver exists:", !!singleSolver)
  if (singleSolver) {
    console.log("\nCurrent segment index:", singleSolver.currentSegmentIndex)
    console.log("Current rotation index:", singleSolver.currentRotationIndex)
    console.log("Number of outlines:", singleSolver.outlines?.length)

    // Log outline orientations
    if (singleSolver.outlines) {
      for (let i = 0; i < singleSolver.outlines.length; i++) {
        const outline = singleSolver.outlines[i]
        // Calculate signed area
        let area = 0
        for (const [p1, p2] of outline) {
          area += p1.x * p2.y - p2.x * p1.y
        }
        area /= 2
        console.log(`  Outline ${i}: ${outline.length} segments, area=${area.toFixed(2)}, winding=${area > 0 ? "CCW" : "CW"}`)
      }
    }

    // Get the active subsolver info
    const activeSubSolver = singleSolver.activeSubSolver
    console.log("\nactiveSubSolver exists:", !!activeSubSolver)
    if (activeSubSolver) {
      console.log("\nActive subsolver:")
      console.log("  outlineSegment:", JSON.stringify(activeSubSolver.outlineSegment))
      console.log("  ccwFullOutline length:", activeSubSolver.ccwFullOutline?.length)

      // Calculate signed area of the outline being used
      if (activeSubSolver.ccwFullOutline) {
        let area = 0
        for (const [p1, p2] of activeSubSolver.ccwFullOutline) {
          area += p1.x * p2.y - p2.x * p1.y
        }
        area /= 2
        console.log(`  ccwFullOutline winding: area=${area.toFixed(2)}, ${area > 0 ? "CCW" : "CW"}`)
      }

      console.log("  largestRectOrigin:", JSON.stringify(activeSubSolver.largestRectOrigin))
      console.log("  largestRectMidPoint:", JSON.stringify(activeSubSolver.largestRectMidPoint))
      console.log("  viableBounds:", JSON.stringify(activeSubSolver.viableBounds))
      console.log("  viableOutlineSegment:", JSON.stringify(activeSubSolver.viableOutlineSegment))

      // Print a few segments around segment 26
      const queuedSegments = singleSolver.queuedOutlineSegments
      if (queuedSegments && queuedSegments.length > 26) {
        const seg = queuedSegments[26]
        console.log("\n  Queued segment 26:")
        console.log("    segment:", JSON.stringify(seg.segment))
        console.log("    segmentIndex:", seg.segmentIndex)
      }

      // Print the segment and compute expected outward normal
      const [p1, p2] = activeSubSolver.outlineSegment
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const len = Math.hypot(dx, dy)
      const dirX = dx / len
      const dirY = dy / len
      const left = { x: -dirY, y: dirX }
      const right = { x: dirY, y: -dirX }
      console.log("\n  Segment direction:", JSON.stringify({ dirX, dirY }))
      console.log("  Left normal:", JSON.stringify(left))
      console.log("  Right normal:", JSON.stringify(right))
      console.log("  For CCW (positive area), outward should be 'right'")

      // Check which way the origin was offset
      const midX = (p1.x + p2.x) / 2
      const midY = (p1.y + p2.y) / 2
      const originOffsetX = activeSubSolver.largestRectOrigin.x - midX
      const originOffsetY = activeSubSolver.largestRectOrigin.y - midY
      console.log("  Midpoint:", JSON.stringify({ x: midX, y: midY }))
      console.log("  Origin offset from midpoint:", JSON.stringify({ x: originOffsetX.toFixed(6), y: originOffsetY.toFixed(6) }))

      // Find which outline contains this segment
      const currentQueuedSeg = singleSolver.queuedOutlineSegments[singleSolver.currentSegmentIndex]
      console.log("\n  Current queued segment info:")
      console.log("    segmentIndex:", currentQueuedSeg?.segmentIndex)

      // Print all outlines with their windings
      for (let outlineIdx = 0; outlineIdx < singleSolver.outlines.length; outlineIdx++) {
        const outline = singleSolver.outlines[outlineIdx]
        let area = 0
        for (const [p1, p2] of outline) {
          area += p1.x * p2.y - p2.x * p1.y
        }
        area /= 2
        console.log(`\n  Outline ${outlineIdx} (${outline.length} segments, area=${area.toFixed(2)}, ${area > 0 ? "CCW" : "CW"}):`);
        for (let i = 0; i < outline.length; i++) {
          const [s1, s2] = outline[i]
          // Check if this is the current segment
          const isCurrent = currentQueuedSeg &&
            Math.abs(s1.x - activeSubSolver.outlineSegment[0].x) < 0.001 &&
            Math.abs(s1.y - activeSubSolver.outlineSegment[0].y) < 0.001 &&
            Math.abs(s2.x - activeSubSolver.outlineSegment[1].x) < 0.001 &&
            Math.abs(s2.y - activeSubSolver.outlineSegment[1].y) < 0.001
          const marker = isCurrent ? " <-- CURRENT SEGMENT" : ""
          console.log(`    [${i}]: (${s1.x.toFixed(2)}, ${s1.y.toFixed(2)}) -> (${s2.x.toFixed(2)}, ${s2.y.toFixed(2)})${marker}`)
        }
      }
    }
  }
})

test("repro10 - final output after running PackSolver2 to completion", async () => {
  // Convert circuitJson to packOutput, then to packInput
  const packOutput = convertCircuitJsonToPackOutput(
    circuitJson as CircuitJson,
    {
      shouldAddInnerObstacles: true,
      source_group_id: "source_group_0",
    },
  )
  const packInput = convertPackOutputToPackInput(packOutput)

  // Run PackSolver2 to completion
  const solver = new PackSolver2({
    ...packInput,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
    minGap: 0.4,
  })
  solver.solve()

  expect(
    getSvgFromGraphicsObject(solver.visualize(), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
