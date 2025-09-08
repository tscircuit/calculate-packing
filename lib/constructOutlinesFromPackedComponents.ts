import type { PackedComponent } from "./types"
import type { Point } from "@tscircuit/math-utils"
import Flatten from "@flatten-js/core"
import { rotatePoint } from "./math/rotatePoint"
import { simplifyCollinearSegments } from "./geometry/simplify-collinear-segments"
import { getComponentBounds } from "./geometry/getComponentBounds"
import { combineBounds } from "./geometry/combineBounds"

type Outline = Array<[Point, Point]>

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
  } = {},
): Outline[] => {
  const { minGap = 0 } = opts
  if (components.length === 0) return []
  const bounds = combineBounds(
    components.map((c) => getComponentBounds(c, minGap)),
  )

  // Build pad polygons (inflated by minGap) and pre-filter contained/degenerate ones
  const allPadShapes: {
    poly: Flatten.Polygon
    bbox: { minX: number; minY: number; maxX: number; maxY: number }
  }[] = []
  for (const component of components) {
    const padShapes = createPadPolygons(component, minGap)
    allPadShapes.push(...padShapes)
  }
  if (allPadShapes.length === 0) return []

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
  const outlines: Outline[] = []
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

  return outlines
}
