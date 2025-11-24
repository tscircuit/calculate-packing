import type { Bounds, Point } from "@tscircuit/math-utils"
import { pointInOutline } from "../geometry/pointInOutline"

export function getInwardNormal(ccwOutlineSegment: [Point, Point]): Point {
  const [p1, p2] = ccwOutlineSegment
  return {
    x: Math.sign(-(p2.y - p1.y)),
    y: Math.sign(p2.x - p1.x),
  }
}

export function getOutwardNormal(
  outlineSegment: [Point, Point],
  ccwFullOutline: [Point, Point][],
): Point {
  const og = getOutwardNormalOg(outlineSegment, ccwFullOutline)
  return og
  // return {
  //   x: og.x * -1,
  //   y: og.y * -1,
  // }
}

export function getOutwardNormalOg(
  outlineSegment: [Point, Point],
  ccwFullOutline: [Point, Point][],
): Point {
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
  const bbox = getOutlineBoundsWithMargin(ccwFullOutline)
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

  const locLeft = pointInOutline(testLeft, ccwFullOutline)
  if (locLeft === "outside") {
    return left
  }
  const locRight = pointInOutline(testRight, ccwFullOutline)
  if (locRight === "outside") {
    return right
  }

  // Fallback 1: infer from polygon orientation (CCW => inside on left => outward is right)
  const verts: Point[] = []
  if (ccwFullOutline.length > 0) {
    verts.push(ccwFullOutline[0]![0])
    for (const seg of ccwFullOutline) {
      verts.push(seg[1]!)
    }
  }
  const signedArea = (() => {
    let a = 0
    for (let i = 0; i < verts.length; i++) {
      const v1 = verts[i]!
      const v2 = verts[(i + 1) % verts.length]!
      a += v1.x * v2.y - v2.x * v1.y
    }
    return a / 2
  })()
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
  ccwFullOutline: [Point, Point][],
  margin = 0,
): Bounds {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const [p1, p2] of ccwFullOutline) {
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
