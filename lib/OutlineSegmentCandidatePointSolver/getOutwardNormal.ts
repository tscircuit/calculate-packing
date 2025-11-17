import type { Bounds, Point } from "@tscircuit/math-utils"
import { pointInOutline } from "../geometry/pointInOutline"

import { ensureCcwOutlineSegments, getOutlineSignedArea } from "./ccwOutline"

export function getOutwardNormal(
  outlineSegment: [Point, Point],
  ccwFullOutline: [Point, Point][],
): Point {
  const normalizedOutline = ensureCcwOutlineSegments(ccwFullOutline)
  const [p1, p2] = outlineSegment
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const len = Math.hypot(dx, dy)

  if (len === 0) {
    return { x: 0, y: 1 } // Default normal for degenerate segment
  }

  // Normalized segment direction
  const dirX = dx / len
  const dirY = dy / len

  // Two possible normals (perpendicular to segment)
  const left = { x: -dirY, y: dirX }
  const right = { x: dirY, y: -dirX }

  // Segment midpoint
  const mid = {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }

  // Use a scale-aware test distance to reduce numeric issues
  const bbox = getOutlineBoundsWithMargin(normalizedOutline)
  const scale = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY) || 1
  const testDistance = Math.max(1e-4, 1e-3 * scale)

  // Test points offset from the segment midpoint in both normal directions
  const testLeft = {
    x: mid.x + left.x * testDistance,
    y: mid.y + left.y * testDistance,
  }
  const testRight = {
    x: mid.x + right.x * testDistance,
    y: mid.y + right.y * testDistance,
  }

  const locLeft = pointInOutline(testLeft, normalizedOutline)
  if (locLeft === "outside") {
    return left
  }
  const locRight = pointInOutline(testRight, normalizedOutline)
  if (locRight === "outside") {
    return right
  }

  // Fallback 1: rely on orientation (CCW => inside on left => outward is right)
  const signedArea = getOutlineSignedArea(normalizedOutline)
  if (Math.abs(signedArea) > 1e-12) {
    return signedArea > 0 ? right : left
  }

  // Fallback 2: push away from outline bbox center
  const center = {
    x: (bbox.minX + bbox.maxX) / 2,
    y: (bbox.minY + bbox.maxY) / 2,
  }
  const away = { x: mid.x - center.x, y: mid.y - center.y }
  const dotLeft = left.x * away.x + left.y * away.y
  const dotRight = right.x * away.x + right.y * away.y
  return dotRight >= dotLeft ? right : left
}

function getOutlineBoundsWithMargin(
  ccwOutline: [Point, Point][],
  margin = 0,
): Bounds {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const [p1, p2] of ccwOutline) {
    minX = Math.min(minX, p1.x, p2.x)
    minY = Math.min(minY, p1.y, p2.y)
    maxX = Math.max(maxX, p1.x, p2.x)
    maxY = Math.max(maxY, p1.y, p2.y)
  }

  return {
    minX: minX - margin,
    minY: minY - margin,
    maxX: maxX + margin,
    maxY: maxY + margin,
  }
}
