import type { Point } from "@tscircuit/math-utils"

const EPS = 1e-9

const pointsAlmostEqual = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) <= EPS && Math.abs(a.y - b.y) <= EPS

export const outlineSegmentsToVertices = (
  outline: [Point, Point][],
): Point[] => {
  if (outline.length === 0) return []

  const vertices: Point[] = []
  const firstSegment = outline[0]
  if (!firstSegment) return vertices

  vertices.push({ x: firstSegment[0].x, y: firstSegment[0].y })
  for (const [, end] of outline) {
    vertices.push({ x: end.x, y: end.y })
  }

  if (vertices.length >= 2) {
    const first = vertices[0]!
    const last = vertices[vertices.length - 1]!
    if (pointsAlmostEqual(first, last)) {
      vertices.pop()
    }
  }

  return vertices
}

export const getOutlineSignedArea = (outline: [Point, Point][]): number => {
  const vertices = outlineSegmentsToVertices(outline)
  if (vertices.length < 3) return 0

  let area = 0
  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i]!
    const next = vertices[(i + 1) % vertices.length]!
    area += current.x * next.y - next.x * current.y
  }

  return area / 2
}

export const ensureCcwOutlineSegments = (
  outline: [Point, Point][],
): [Point, Point][] => {
  const area = getOutlineSignedArea(outline)
  if (area >= 0 || outline.length === 0) {
    return outline
  }

  const vertices = outlineSegmentsToVertices(outline)
  if (vertices.length < 2) return outline

  const reversed = [...vertices].reverse()
  const ccwSegments: [Point, Point][] = []

  for (let i = 0; i < reversed.length; i++) {
    const start = reversed[i]!
    const end = reversed[(i + 1) % reversed.length]!
    ccwSegments.push([
      { x: start.x, y: start.y },
      { x: end.x, y: end.y },
    ])
  }

  return ccwSegments
}
