import type { PackedComponent, InputObstacle } from "./types"
import type { Point } from "@tscircuit/math-utils"
import Flatten from "@flatten-js/core"
import { rotatePoint } from "./math/rotatePoint"
import { simplifyCollinearSegments } from "./geometry/simplify-collinear-segments"
import { getComponentBounds } from "./geometry/getComponentBounds"
import { combineBounds } from "./geometry/combineBounds"

type Outline = Array<[Point, Point]>

const EPSILON = 1e-9

const offsetPolygonPoints = (
  points: Array<{ x: number; y: number }>,
  offset: number,
) => {
  if (points.length < 3 || Math.abs(offset) < EPSILON) {
    return points.map((p) => ({ ...p }))
  }

  const normalized = [...points]
  const first = normalized[0]!
  const last = normalized[normalized.length - 1]!
  if (
    Math.abs(first.x - last.x) < EPSILON &&
    Math.abs(first.y - last.y) < EPSILON
  ) {
    normalized.pop()
  }
  const n = normalized.length
  if (n < 3) return normalized.map((p) => ({ ...p }))

  let signedArea = 0
  for (let i = 0; i < n; i++) {
    const p1 = normalized[i]!
    const p2 = normalized[(i + 1) % n]!
    signedArea += p1.x * p2.y - p2.x * p1.y
  }
  const isCCW = signedArea > 0

  const lines = normalized.map((point, i) => {
    const next = normalized[(i + 1) % n]!
    const dir = { x: next.x - point.x, y: next.y - point.y }
    const length = Math.hypot(dir.x, dir.y) || 1
    const dirNorm = { x: dir.x / length, y: dir.y / length }
    const outwardNormal = isCCW
      ? { x: dirNorm.y, y: -dirNorm.x }
      : { x: -dirNorm.y, y: dirNorm.x }
    const offsetPoint = {
      x: point.x + outwardNormal.x * offset,
      y: point.y + outwardNormal.y * offset,
    }
    const offsetNext = {
      x: next.x + outwardNormal.x * offset,
      y: next.y + outwardNormal.y * offset,
    }
    return {
      point: offsetPoint,
      direction: {
        x: offsetNext.x - offsetPoint.x,
        y: offsetNext.y - offsetPoint.y,
      },
    }
  })

  const intersectLines = (
    p1: { x: number; y: number },
    d1: { x: number; y: number },
    p2: { x: number; y: number },
    d2: { x: number; y: number },
  ) => {
    const cross = d1.x * d2.y - d1.y * d2.x
    if (Math.abs(cross) < EPSILON) {
      return null
    }
    const diff = { x: p2.x - p1.x, y: p2.y - p1.y }
    const t = (diff.x * d2.y - diff.y * d2.x) / cross
    return { x: p1.x + t * d1.x, y: p1.y + t * d1.y }
  }

  const offsetVertices = normalized.map((_, i) => {
    const prevLine = lines[(i - 1 + n) % n]!
    const currLine = lines[i]!
    const intersection = intersectLines(
      prevLine.point,
      prevLine.direction,
      currLine.point,
      currLine.direction,
    )
    if (intersection) return intersection
    // Fallback for nearly parallel lines: use the start point of the current offset edge
    return { ...currLine.point }
  })

  return offsetVertices
}

/**
 * Create polygons from pads (inflated by minGap) along with their AABB in world coords
 */
type PadShape = {
  poly: Flatten.Polygon
  bbox: { minX: number; minY: number; maxX: number; maxY: number }
}
const createPadPolygons = (
  component: PackedComponent,
  minGap: number,
): PadShape[] => {
  return component.pads.map((pad) => {
    const hw = pad.size.x / 2 + minGap
    const hh = pad.size.y / 2 + minGap

    const localCorners = [
      { x: pad.offset.x - hw, y: pad.offset.y - hh },
      { x: pad.offset.x + hw, y: pad.offset.y - hh },
      { x: pad.offset.x + hw, y: pad.offset.y + hh },
      { x: pad.offset.x - hw, y: pad.offset.y + hh },
    ]

    const worldCorners = localCorners.map((corner) => {
      const rotated = rotatePoint(
        corner,
        (component.ccwRotationOffset * Math.PI) / 180,
      )
      return {
        x: rotated.x + component.center.x,
        y: rotated.y + component.center.y,
      }
    })

    const arr = worldCorners.map(({ x, y }) => [x, y] as [number, number])
    const poly = new Flatten.Polygon(arr)

    const xs = worldCorners.map((p) => p.x)
    const ys = worldCorners.map((p) => p.y)
    const bbox = {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    }

    return { poly, bbox }
  })
}

const createObstaclePolygons = (
  obstacles: InputObstacle[],
  minGap: number,
): PadShape[] => {
  return obstacles.map((obs) => {
    const hw = obs.width / 2 + minGap
    const hh = obs.height / 2 + minGap
    const cx = obs.absoluteCenter.x
    const cy = obs.absoluteCenter.y

    const worldCorners = [
      { x: cx - hw, y: cy - hh },
      { x: cx + hw, y: cy - hh },
      { x: cx + hw, y: cy + hh },
      { x: cx - hw, y: cy + hh },
    ]

    const arr = worldCorners.map(({ x, y }) => [x, y] as [number, number])
    const poly = new Flatten.Polygon(arr)

    const xs = worldCorners.map((p) => p.x)
    const ys = worldCorners.map((p) => p.y)
    const bbox = {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    }

    return { poly, bbox }
  })
}

/**
 * Construct a set of outlines from a list of packed components.
 *
 * The outline is a list of line segments that form a closed polygon. Surrounding
 * one or more PackedComponents.
 *
 * The outlines are always at least minGap away from the edge of any pad.
 *
 */
export const constructOutlinesFromPackedComponents = (
  components: PackedComponent[],
  opts: {
    minGap?: number
    obstacles?: InputObstacle[]
    boundsOutline?: Array<{ x: number; y: number }>
  } = {},
): Outline[] => {
  const { minGap = 0, obstacles = [], boundsOutline } = opts
  const hasBoundsOutline = Boolean(boundsOutline && boundsOutline.length >= 3)
  if (!hasBoundsOutline && components.length === 0 && obstacles.length === 0)
    return []

  const componentBounds = components.map((c) => getComponentBounds(c, minGap))
  const obstacleBounds = obstacles.map((o) => ({
    minX: o.absoluteCenter.x - o.width / 2 - minGap,
    minY: o.absoluteCenter.y - o.height / 2 - minGap,
    maxX: o.absoluteCenter.x + o.width / 2 + minGap,
    maxY: o.absoluteCenter.y + o.height / 2 + minGap,
  }))

  const outlines: Outline[] = []

  // Build pad polygons (inflated by minGap) and obstacle polygons; pre-filter contained/degenerate ones
  const allPadShapes: {
    poly: Flatten.Polygon
    bbox: { minX: number; minY: number; maxX: number; maxY: number }
  }[] = []
  for (const component of components) {
    const padShapes = createPadPolygons(component, minGap)
    allPadShapes.push(...padShapes)
  }
  const obstacleShapes = createObstaclePolygons(obstacles, minGap)
  allPadShapes.push(...obstacleShapes)

  if (allPadShapes.length > 0) {
    const bounds = combineBounds([...componentBounds, ...obstacleBounds])

    // Drop degenerate (zero-area) and fully-contained pad shapes to reduce boolean ops
    const areaOfBox = (b: {
      minX: number
      minY: number
      maxX: number
      maxY: number
    }) => Math.max(0, b.maxX - b.minX) * Math.max(0, b.maxY - b.minY)
    const containsBox = (
      outer: { minX: number; minY: number; maxX: number; maxY: number },
      inner: { minX: number; minY: number; maxX: number; maxY: number },
      eps = 1e-9,
    ) =>
      outer.minX - eps <= inner.minX &&
      outer.minY - eps <= inner.minY &&
      outer.maxX + eps >= inner.maxX &&
      outer.maxY + eps >= inner.maxY

    const sortedByAreaDesc = [...allPadShapes].sort(
      (a, b) => areaOfBox(b.bbox) - areaOfBox(a.bbox),
    )
    const filteredPadShapes: typeof allPadShapes = []
    for (const shape of sortedByAreaDesc) {
      const w = shape.bbox.maxX - shape.bbox.minX
      const h = shape.bbox.maxY - shape.bbox.minY
      if (!(w > 1e-12 && h > 1e-12)) continue // skip degenerate
      // Skip if fully contained within any already-kept shape
      let contained = false
      for (const kept of filteredPadShapes) {
        if (containsBox(kept.bbox, shape.bbox)) {
          contained = true
          break
        }
      }
      if (!contained) filteredPadShapes.push(shape)
    }

    const keptPadPolys: Flatten.Polygon[] = filteredPadShapes.map((s) => s.poly)

    let A = new Flatten.Polygon(
      new Flatten.Box(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY),
    )
    const B = A.clone()

    for (let i = 0; i < keptPadPolys.length; i++) {
      try {
        A = Flatten.BooleanOperations.subtract(A, keptPadPolys[i]!)
      } catch (e) {
        // Ignore individual subtract errors; we'll still try to form outlines
      }
    }

    let union: Flatten.Polygon | null = null
    try {
      union = Flatten.BooleanOperations.subtract(B, A)
    } catch (e) {
      // Fall back to a direct union of pad polygons if subtract fails
      try {
        if (keptPadPolys.length > 0) {
          let U = keptPadPolys[0]!
          for (let i = 1; i < keptPadPolys.length; i++) {
            try {
              U = Flatten.BooleanOperations.unify(U, keptPadPolys[i]!)
            } catch {
              // Skip problematic union; continue trying to merge the rest
            }
          }
          union = U
        }
      } catch {
        union = null
      }
    }

    /* --- extract the external outlines of every island --- */
    if (union) {
      for (const face of (union as any).faces as any) {
        if (face.isHole) continue /* skip hole faces – we want outer bounds */
        const outline: Outline = []
        let edge = face.first
        if (!edge) continue
        do {
          const shp: any = edge.shape
          const ps = (shp.start ?? shp.ps) as Flatten.Point
          const pe = (shp.end ?? shp.pe) as Flatten.Point
          outline.push([
            { x: ps.x, y: ps.y },
            { x: pe.x, y: pe.y },
          ])
          edge = edge.next
        } while (edge !== face.first)

        // Simplify collinear segments in the outline
        const simplifiedOutline = simplifyCollinearSegments(outline)
        outlines.push(simplifiedOutline)
      }
    }
  }

  if (hasBoundsOutline && boundsOutline) {
    const outlineOffset = minGap > 0 ? minGap + EPSILON : minGap
    const offsetPoints = offsetPolygonPoints(boundsOutline, outlineOffset)
    if (offsetPoints.length >= 3) {
      const polygonOutline: Outline = []
      for (let i = 0; i < offsetPoints.length; i++) {
        const current = offsetPoints[i]!
        const next = offsetPoints[(i + 1) % offsetPoints.length]!
        polygonOutline.push([
          { x: current.x, y: current.y },
          { x: next.x, y: next.y },
        ])
      }
      outlines.push(simplifyCollinearSegments(polygonOutline))
    }
  }

  return outlines
}
