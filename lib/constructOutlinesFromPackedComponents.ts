import type { PackedComponent } from "./types"
import type { Point } from "@tscircuit/math-utils"
import Flatten from "@flatten-js/core"
import { rotatePoint } from "./math/rotatePoint"

type Outline = Array<[Point, Point]>

/**
 * Create a polygon from individual pads within a component, inflated by minGap
 */
const createPadPolygons = (
  component: PackedComponent,
  minGap: number,
): Flatten.Polygon[] => {
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
        (component.ccwRotationOffsetDegrees * Math.PI) / 180,
      )
      return [
        rotated.x + component.center.x,
        rotated.y + component.center.y,
      ] as [number, number]
    })

    return new Flatten.Polygon(worldCorners)
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

  /* --- build polygon for every pad (inflated by minGap) --- */
  const allPadPolys: Flatten.Polygon[] = []
  for (const component of components) {
    const padPolys = createPadPolygons(component, minGap)
    allPadPolys.push(...padPolys)
  }
  if (allPadPolys.length === 0) return []

  /* --- unite all pad polygons into one (or several) islands --- */
  let union = allPadPolys[0]!
  for (let i = 1; i < allPadPolys.length; i++) {
    union = Flatten.BooleanOperations.unify(union, allPadPolys[i]!)
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
