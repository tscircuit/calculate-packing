import type { PackedComponent } from "./types"
import type { Point } from "@tscircuit/math-utils"
import Flatten from "@flatten-js/core"
import { getComponentBounds } from "./geometry/getComponentBounds"

type Outline = Array<[Point, Point]>

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

  /* --- build a rectangle-polygon for every component (inflated by minGap) --- */
  const rectPolys = components.map((c) => {
    const b = getComponentBounds(c, minGap)
    return new Flatten.Polygon([
      [b.minX, b.minY],
      [b.maxX, b.minY],
      [b.maxX, b.maxY],
      [b.minX, b.maxY],
    ])
  })
  if (rectPolys.length === 0) return []

  /* --- unite all rectangles into one (or several) islands --- */
  let union = rectPolys[0]!
  for (let i = 1; i < rectPolys.length; i++) {
    union = Flatten.BooleanOperations.unify(union, rectPolys[i]!)
  }

  /* --- extract the external outlines of every island --- */
  const outlines: Outline[] = []
  for (const face of union!.faces as any) {
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
    outlines.push(outline)
  }

  return outlines
}
