import { describe, it, expect } from "bun:test"
import { simplifyCollinearSegments } from "./simplify-collinear-segments"
import type { Point } from "@tscircuit/math-utils"

type Segment = [Point, Point]

describe("simplifyCollinearSegments", () => {
  it("should merge adjacent collinear segments into a single segment", () => {
    const outline: Segment[] = [
      [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      [{ x: 1, y: 0 }, { x: 2, y: 0 }], // Collinear with first
      [{ x: 2, y: 0 }, { x: 3, y: 0 }], // Collinear with previous
      [{ x: 3, y: 0 }, { x: 3, y: 1 }], // Not collinear - vertical
    ]

    const simplified = simplifyCollinearSegments(outline)

    expect(simplified).toHaveLength(2)
    expect(simplified[0]).toEqual([{ x: 0, y: 0 }, { x: 3, y: 0 }])
    expect(simplified[1]).toEqual([{ x: 3, y: 0 }, { x: 3, y: 1 }])
  })

  it("should handle rectangular outlines correctly", () => {
    const outline: Segment[] = [
      [{ x: 0, y: 0 }, { x: 1, y: 0 }], // Bottom edge
      [{ x: 1, y: 0 }, { x: 2, y: 0 }], // Continuation of bottom edge
      [{ x: 2, y: 0 }, { x: 2, y: 1 }], // Right edge
      [{ x: 2, y: 1 }, { x: 2, y: 2 }], // Continuation of right edge
      [{ x: 2, y: 2 }, { x: 1, y: 2 }], // Top edge
      [{ x: 1, y: 2 }, { x: 0, y: 2 }], // Continuation of top edge
      [{ x: 0, y: 2 }, { x: 0, y: 1 }], // Left edge
      [{ x: 0, y: 1 }, { x: 0, y: 0 }], // Continuation of left edge
    ]

    const simplified = simplifyCollinearSegments(outline)

    expect(simplified).toHaveLength(4)
    // Should result in 4 segments forming a proper rectangle
    expect(simplified).toContainEqual([{ x: 0, y: 0 }, { x: 2, y: 0 }]) // Bottom
    expect(simplified).toContainEqual([{ x: 2, y: 0 }, { x: 2, y: 2 }]) // Right
    expect(simplified).toContainEqual([{ x: 2, y: 2 }, { x: 0, y: 2 }]) // Top
    expect(simplified).toContainEqual([{ x: 0, y: 2 }, { x: 0, y: 0 }]) // Left
  })

  it("should preserve non-collinear segments", () => {
    const outline: Segment[] = [
      [{ x: 0, y: 0 }, { x: 1, y: 0 }],   // Horizontal
      [{ x: 1, y: 0 }, { x: 1, y: 1 }],   // Vertical - not collinear
      [{ x: 1, y: 1 }, { x: 0.5, y: 1.5 }], // Diagonal - not collinear
    ]

    const simplified = simplifyCollinearSegments(outline)

    expect(simplified).toHaveLength(3)
    expect(simplified).toEqual(outline) // Should remain unchanged
  })

  it("should handle empty outline", () => {
    const outline: Segment[] = []
    const simplified = simplifyCollinearSegments(outline)
    expect(simplified).toEqual([])
  })

  it("should handle single segment", () => {
    const outline: Segment[] = [[{ x: 0, y: 0 }, { x: 1, y: 1 }]]
    const simplified = simplifyCollinearSegments(outline)
    expect(simplified).toEqual(outline)
  })

  it("should handle tolerance correctly", () => {
    // Two segments that are nearly collinear within tolerance
    const outline: Segment[] = [
      [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      [{ x: 1, y: 0 }, { x: 2, y: 0.001 }], // Slightly off-collinear
    ]

    const simplified = simplifyCollinearSegments(outline, 0.01)

    // Should be merged because the cross product is within tolerance
    expect(simplified).toHaveLength(1)
    expect(simplified[0]).toEqual([{ x: 0, y: 0 }, { x: 2, y: 0.001 }])
  })

  it("should handle disconnected segments", () => {
    // Segments that don't connect end-to-start
    const outline: Segment[] = [
      [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      [{ x: 2, y: 0 }, { x: 3, y: 0 }], // Disconnected - starts at x=2 instead of x=1
    ]

    const simplified = simplifyCollinearSegments(outline)

    // Should remain separate since they're not connected
    expect(simplified).toHaveLength(2)
    expect(simplified).toEqual(outline)
  })

  it("should handle closed outline with wrap-around collinearity", () => {
    // A triangle where the last segment is collinear with the first
    const outline: Segment[] = [
      [{ x: 0, y: 0 }, { x: 2, y: 0 }],   // Bottom edge
      [{ x: 2, y: 0 }, { x: 1, y: 2 }],   // Right diagonal
      [{ x: 1, y: 2 }, { x: -1, y: 0 }],  // Left diagonal - ends at (-1, 0)
      [{ x: -1, y: 0 }, { x: 0, y: 0 }],  // Short horizontal - collinear with first
    ]

    const simplified = simplifyCollinearSegments(outline)

    expect(simplified).toHaveLength(3)
    // First segment should be extended to include the last segment
    expect(simplified[0]).toEqual([{ x: -1, y: 0 }, { x: 2, y: 0 }])
    expect(simplified[1]).toEqual([{ x: 2, y: 0 }, { x: 1, y: 2 }])
    expect(simplified[2]).toEqual([{ x: 1, y: 2 }, { x: -1, y: 0 }])
  })
})