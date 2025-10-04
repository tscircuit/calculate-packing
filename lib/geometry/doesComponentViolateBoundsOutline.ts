import type { PackedComponent } from "../types"
import { pointInOutline } from "./pointInOutline"

export type BoundsOutlinePoint = { x: number; y: number }

const EPSILON = 1e-9

const normalizeOutline = (
  outline: BoundsOutlinePoint[],
): BoundsOutlinePoint[] => {
  if (outline.length === 0) return []
  const normalized = [...outline]
  const first = normalized[0]!
  const last = normalized[normalized.length - 1]!
  if (
    Math.abs(first.x - last.x) < EPSILON &&
    Math.abs(first.y - last.y) < EPSILON
  ) {
    normalized.pop()
  }
  return normalized
}

const orientation = (
  p: BoundsOutlinePoint,
  q: BoundsOutlinePoint,
  r: BoundsOutlinePoint,
): number => {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y)
  if (Math.abs(val) < EPSILON) return 0
  return val > 0 ? 1 : -1
}

const onSegment = (
  p: BoundsOutlinePoint,
  q: BoundsOutlinePoint,
  r: BoundsOutlinePoint,
): boolean => {
  return (
    q.x <= Math.max(p.x, r.x) + EPSILON &&
    q.x + EPSILON >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) + EPSILON &&
    q.y + EPSILON >= Math.min(p.y, r.y)
  )
}

const segmentsIntersect = (
  p1: BoundsOutlinePoint,
  q1: BoundsOutlinePoint,
  p2: BoundsOutlinePoint,
  q2: BoundsOutlinePoint,
): boolean => {
  const o1 = orientation(p1, q1, p2)
  const o2 = orientation(p1, q1, q2)
  const o3 = orientation(p2, q2, p1)
  const o4 = orientation(p2, q2, q1)

  if (o1 !== o2 && o3 !== o4) return true

  if (o1 === 0 && onSegment(p1, p2, q1)) return true
  if (o2 === 0 && onSegment(p1, q2, q1)) return true
  if (o3 === 0 && onSegment(p2, p1, q2)) return true
  if (o4 === 0 && onSegment(p2, q1, q2)) return true

  return false
}

const isPointInsideRect = (
  point: BoundsOutlinePoint,
  rect: { minX: number; minY: number; maxX: number; maxY: number },
): boolean => {
  return (
    point.x >= rect.minX - EPSILON &&
    point.x <= rect.maxX + EPSILON &&
    point.y >= rect.minY - EPSILON &&
    point.y <= rect.maxY + EPSILON
  )
}

const getExpandedPadRect = (
  pad: PackedComponent["pads"][number],
  minGap: number,
): {
  rect: { minX: number; minY: number; maxX: number; maxY: number }
  corners: BoundsOutlinePoint[]
} => {
  const halfWidth = pad.size.x / 2 + minGap
  const halfHeight = pad.size.y / 2 + minGap
  const center = pad.absoluteCenter

  const rect = {
    minX: center.x - halfWidth,
    minY: center.y - halfHeight,
    maxX: center.x + halfWidth,
    maxY: center.y + halfHeight,
  }

  const corners: BoundsOutlinePoint[] = [
    { x: rect.minX, y: rect.minY },
    { x: rect.maxX, y: rect.minY },
    { x: rect.maxX, y: rect.maxY },
    { x: rect.minX, y: rect.maxY },
  ]

  return { rect, corners }
}

export const doesComponentViolateBoundsOutline = (
  component: PackedComponent,
  outline: BoundsOutlinePoint[] | undefined,
  minGap: number,
): boolean => {
  if (!outline || outline.length < 3) return false
  const normalizedOutline = normalizeOutline(outline)
  if (normalizedOutline.length < 3) return false
  const outlineSegments: Array<[BoundsOutlinePoint, BoundsOutlinePoint]> =
    normalizedOutline.map(
      (point, idx) =>
        [point, normalizedOutline[(idx + 1) % normalizedOutline.length]!] as [
          BoundsOutlinePoint,
          BoundsOutlinePoint,
        ],
    )

  for (const pad of component.pads) {
    const { rect, corners } = getExpandedPadRect(pad, minGap)

    for (const corner of corners) {
      const location = pointInOutline(corner, outlineSegments)
      if (location === "inside") {
        return true
      }
    }

    for (const vertex of normalizedOutline) {
      if (isPointInsideRect(vertex, rect)) {
        return true
      }
    }

    const rectEdges: Array<[BoundsOutlinePoint, BoundsOutlinePoint]> = [
      [corners[0]!, corners[1]!],
      [corners[1]!, corners[2]!],
      [corners[2]!, corners[3]!],
      [corners[3]!, corners[0]!],
    ]

    for (let i = 0; i < normalizedOutline.length; i++) {
      const a = normalizedOutline[i]!
      const b = normalizedOutline[(i + 1) % normalizedOutline.length]!

      for (const [r1, r2] of rectEdges) {
        if (segmentsIntersect(a, b, r1, r2)) {
          return true
        }
      }
    }
  }

  return false
}
