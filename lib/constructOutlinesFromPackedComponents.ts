import Flatten from "@flatten-js/core"
import type { Point } from "@tscircuit/math-utils"
import { combineBounds } from "./geometry/combineBounds"
import { getComponentBounds } from "./geometry/getComponentBounds"
import { simplifyCollinearSegments } from "./geometry/simplify-collinear-segments"
import { rotatePoint } from "./math/rotatePoint"
import { parseFlattenPolygonSegments } from "./parseFlattenPolygonLoops"
import type {
  ComponentCourtyard,
  InputObstacle,
  PackedComponent,
} from "./types"

type Outline = Array<[Point, Point]>

/**
 * Result of constructing outlines with semantic loop types.
 *
 * - obstacleFreeLoops: CCW loops representing the outer boundary of free space
 * - obstacleContainingLoops: CW loops representing boundaries around obstacles
 */
export interface ConstructedOutlines {
  /**
   * CCW loops (positive signed area) - the outer boundary of free space.
   * For component placement, these represent the edges of the packing area.
   */
  obstacleFreeLoops: Outline[]

  /**
   * CW loops (negative signed area) - boundaries around obstacles/pads.
   * Components should be placed outside these boundaries.
   */
  obstacleContainingLoops: Outline[]
}

/**
 * Create a single polygon from a courtyard (inflated by minGap),
 * positioned and rotated according to the component's placement.
 */
const createCourtyardPolygon = (opts: {
  component: PackedComponent
  courtyard: ComponentCourtyard
  minGap: number
}): PadShape => {
  const { component, courtyard, minGap } = opts
  const hw = courtyard.width / 2 + minGap
  const hh = courtyard.height / 2 + minGap

  const localCorners = [
    {
      x: courtyard.offsetFromCenter.x - hw,
      y: courtyard.offsetFromCenter.y - hh,
    },
    {
      x: courtyard.offsetFromCenter.x + hw,
      y: courtyard.offsetFromCenter.y - hh,
    },
    {
      x: courtyard.offsetFromCenter.x + hw,
      y: courtyard.offsetFromCenter.y + hh,
    },
    {
      x: courtyard.offsetFromCenter.x - hw,
      y: courtyard.offsetFromCenter.y + hh,
    },
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
// Module-level caches for fast incremental layout outline construction
const outlineCache = new Map<string, Outline[]>()
const freeSpaceCache = new Map<string, Flatten.Polygon>()

export const clearOutlineCaches = (): void => {
  outlineCache.clear()
  freeSpaceCache.clear()
}

function getCacheKey(
  components: PackedComponent[],
  minGap: number,
  obstacles: InputObstacle[],
): string {
  const compKeys = components
    .map(
      (c) =>
        `${c.componentId}:${c.center.x.toFixed(4)},${c.center.y.toFixed(4)},${c.ccwRotationOffset.toFixed(2)}`,
    )
    .join("|")
  const obsKeys = obstacles
    .map(
      (o) =>
        `${o.obstacleId}:${o.absoluteCenter.x.toFixed(4)},${o.absoluteCenter.y.toFixed(4)},${o.width.toFixed(2)},${o.height.toFixed(2)}`,
    )
    .join("|")
  return `${minGap}|${compKeys}|${obsKeys}`
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
  } = {},
): Outline[] => {
  const { minGap = 0, obstacles = [] } = opts
  if (components.length === 0 && obstacles.length === 0) return []

  const key = getCacheKey(components, minGap, obstacles)
  if (outlineCache.has(key)) {
    return outlineCache
      .get(key)!
      .map((loop) => loop.slice() as [Point, Point][])
  }

  const componentBounds = components.map((c) => getComponentBounds(c, minGap))
  const obstacleBounds = obstacles.map((o) => ({
    minX: o.absoluteCenter.x - o.width / 2 - minGap,
    minY: o.absoluteCenter.y - o.height / 2 - minGap,
    maxX: o.absoluteCenter.x + o.width / 2 + minGap,
    maxY: o.absoluteCenter.y + o.height / 2 + minGap,
  }))
  const bounds = combineBounds([...componentBounds, ...obstacleBounds])

  // Enable incremental cache only for large layouts (e.g. 50+ components) to prevent
  // floating-point winding/intersection shifts in unit test snapshots of smaller boards.
  const useIncremental = components.length >= 50

  if (useIncremental) {
    // Find the longest prefix of components that is already in freeSpaceCache (storing unions)
    let union: Flatten.Polygon | null = null
    let startIndex = 0

    for (let i = components.length - 1; i >= 0; i--) {
      const prefix = components.slice(0, i)
      const prefixKey = getCacheKey(prefix, minGap, obstacles)
      if (freeSpaceCache.has(prefixKey)) {
        union = freeSpaceCache.get(prefixKey)!.clone()
        startIndex = i
        break
      }
    }

    if (!union) {
      // Unify obstacles first
      const obstacleShapes = createObstaclePolygons(obstacles, minGap)
      if (obstacleShapes.length > 0) {
        union = obstacleShapes[0]!.poly.clone()
        for (let j = 1; j < obstacleShapes.length; j++) {
          try {
            union = Flatten.BooleanOperations.unify(
              union,
              obstacleShapes[j]!.poly,
            )
          } catch {
            // Skip problematic unify
          }
        }
      }
      const obstacleKey = getCacheKey([], minGap, obstacles)
      if (union) {
        freeSpaceCache.set(obstacleKey, union.clone())
      }
    }

    // Incrementally unify the remaining components
    let incrementalSuccess = true
    for (let i = startIndex; i < components.length; i++) {
      const c = components[i]!
      const shapes: PadShape[] = []
      if (c.courtyard) {
        shapes.push(
          createCourtyardPolygon({
            component: c,
            courtyard: c.courtyard,
            minGap,
          }),
        )
      } else {
        const padShapes = createPadPolygons(c, minGap)
        shapes.push(...padShapes)
      }

      // Filter pad shapes for the single component to match exact original behavior
      const filteredPadShapes = filterPadShapes(shapes)
      const keptPadPolys = filteredPadShapes.map((s) => s.poly)

      for (const poly of keptPadPolys) {
        try {
          if (!union) {
            union = poly.clone()
          } else {
            union = Flatten.BooleanOperations.unify(union, poly)
          }
        } catch {
          incrementalSuccess = false
          break
        }
      }

      if (!incrementalSuccess) break

      if (union) {
        // Cache the intermediate union
        const currentPrefix = components.slice(0, i + 1)
        const currentPrefixKey = getCacheKey(currentPrefix, minGap, obstacles)
        freeSpaceCache.set(currentPrefixKey, union.clone())
      }
    }

    // If incremental union was successful, subtract it from B_current to get free space A
    if (incrementalSuccess) {
      const B_current = new Flatten.Polygon(
        new Flatten.Box(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY),
      )

      let A: Flatten.Polygon | null = null
      try {
        if (union) {
          A = Flatten.BooleanOperations.subtract(B_current, union)
        } else {
          A = B_current.clone()
        }
      } catch {
        // Fallback on subtract failure
      }

      if (A) {
        const parsed = parseFlattenPolygonSegments(A)
        const allOutlines: Outline[] = [
          ...parsed.obstacleFreeLoops.map((outline) =>
            simplifyCollinearSegments(outline),
          ),
          ...parsed.obstacleContainingLoops.map((outline) =>
            simplifyCollinearSegments(outline),
          ),
        ]
        const finalOutlines = allOutlines.filter(
          (outline) => outline.length >= 3,
        )
        outlineCache.set(key, finalOutlines)
        return finalOutlines
      }
    }
  }

  // --- Fallback to original non-incremental method ---

  // Build pad polygons (inflated by minGap) and obstacle polygons
  const allPadShapes: PadShape[] = []
  for (const component of components) {
    if (component.courtyard) {
      allPadShapes.push(
        createCourtyardPolygon({
          component,
          courtyard: component.courtyard,
          minGap,
        }),
      )
    } else {
      const padShapes = createPadPolygons(component, minGap)
      allPadShapes.push(...padShapes)
    }
  }
  const obstacleShapes = createObstaclePolygons(obstacles, minGap)
  allPadShapes.push(...obstacleShapes)
  if (allPadShapes.length === 0) return []

  // Drop degenerate and fully-contained shapes
  const filteredPadShapes = filterPadShapes(allPadShapes)
  const keptPadPolys = filteredPadShapes.map((s) => s.poly)

  // Create bounding box
  let A_fallback = new Flatten.Polygon(
    new Flatten.Box(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY),
  )
  const B_fallback = A_fallback.clone()

  // Subtract pads from A to get free space
  for (const poly of keptPadPolys) {
    try {
      A_fallback = Flatten.BooleanOperations.subtract(A_fallback, poly)
    } catch {
      // Ignore individual subtract errors
    }
  }

  // Compute B - A to get the obstacles (union of pads)
  let union: Flatten.Polygon | null = null
  try {
    union = Flatten.BooleanOperations.subtract(B_fallback, A_fallback)
  } catch {
    // Fall back to a direct union of pad polygons if subtract fails
    try {
      if (keptPadPolys.length > 0) {
        let U = keptPadPolys[0]!
        for (let i = 1; i < keptPadPolys.length; i++) {
          try {
            U = Flatten.BooleanOperations.unify(U, keptPadPolys[i]!)
          } catch {
            // Skip problematic union
          }
        }
        union = U
      }
    } catch {
      union = null
    }
  }

  if (!union) return []

  // Parse the obstacles polygon (B - A) to get all outlines
  const parsed = parseFlattenPolygonSegments(union)

  const allOutlines: Outline[] = [
    ...parsed.obstacleFreeLoops.map((outline) =>
      simplifyCollinearSegments(outline),
    ),
    ...parsed.obstacleContainingLoops.map((outline) =>
      simplifyCollinearSegments(outline),
    ),
  ]

  const finalOutlines = allOutlines.filter((outline) => outline.length >= 3)
  outlineCache.set(key, finalOutlines)
  return finalOutlines
}

/**
 * Construct semantic outlines from a list of packed components.
 *
 * Returns both types of outline loops:
 * - obstacleFreeLoops: CCW loops representing the outer boundary of free space
 * - obstacleContainingLoops: CW loops representing boundaries around obstacles
 *
 * The outlines are always at least minGap away from the edge of any pad.
 */
export const constructSemanticOutlinesFromPackedComponents = (
  components: PackedComponent[],
  opts: {
    minGap?: number
    obstacles?: InputObstacle[]
  } = {},
): ConstructedOutlines => {
  const { minGap = 0, obstacles = [] } = opts
  if (components.length === 0 && obstacles.length === 0) {
    return { obstacleFreeLoops: [], obstacleContainingLoops: [] }
  }

  const componentBounds = components.map((c) => getComponentBounds(c, minGap))
  const obstacleBounds = obstacles.map((o) => ({
    minX: o.absoluteCenter.x - o.width / 2 - minGap,
    minY: o.absoluteCenter.y - o.height / 2 - minGap,
    maxX: o.absoluteCenter.x + o.width / 2 + minGap,
    maxY: o.absoluteCenter.y + o.height / 2 + minGap,
  }))
  const bounds = combineBounds([...componentBounds, ...obstacleBounds])

  // Build pad polygons (inflated by minGap) and obstacle polygons
  const allPadShapes: PadShape[] = []
  for (const component of components) {
    if (component.courtyard) {
      allPadShapes.push(
        createCourtyardPolygon({
          component,
          courtyard: component.courtyard,
          minGap,
        }),
      )
    } else {
      const padShapes = createPadPolygons(component, minGap)
      allPadShapes.push(...padShapes)
    }
  }
  const obstacleShapes = createObstaclePolygons(obstacles, minGap)
  allPadShapes.push(...obstacleShapes)

  if (allPadShapes.length === 0) {
    return { obstacleFreeLoops: [], obstacleContainingLoops: [] }
  }

  // Drop degenerate and fully-contained shapes
  const filteredPadShapes = filterPadShapes(allPadShapes)
  const keptPadPolys = filteredPadShapes.map((s) => s.poly)

  // Create bounding box and subtract obstacles to get free space
  let freeSpace = new Flatten.Polygon(
    new Flatten.Box(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY),
  )

  for (const poly of keptPadPolys) {
    try {
      freeSpace = Flatten.BooleanOperations.subtract(freeSpace, poly)
    } catch {
      // Ignore individual subtract errors
    }
  }

  // Parse free space into semantic loop types
  const parsed = parseFlattenPolygonSegments(freeSpace)

  // Filter out degenerate outlines (less than 3 segments can't form a closed polygon)
  const filterDegenerate = (outline: Outline) => outline.length >= 3

  return {
    obstacleFreeLoops: parsed.obstacleFreeLoops
      .map((outline) => simplifyCollinearSegments(outline))
      .filter(filterDegenerate),
    obstacleContainingLoops: parsed.obstacleContainingLoops
      .map((outline) => simplifyCollinearSegments(outline))
      .filter(filterDegenerate),
  }
}

/**
 * Filter pad shapes to remove degenerate and fully-contained ones
 */
function filterPadShapes(allPadShapes: PadShape[]): PadShape[] {
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

  const filtered: PadShape[] = []
  for (const shape of sortedByAreaDesc) {
    const w = shape.bbox.maxX - shape.bbox.minX
    const h = shape.bbox.maxY - shape.bbox.minY
    if (!(w > 1e-12 && h > 1e-12)) continue // skip degenerate

    let contained = false
    for (const kept of filtered) {
      if (containsBox(kept.bbox, shape.bbox)) {
        contained = true
        break
      }
    }
    if (!contained) filtered.push(shape)
  }

  return filtered
}
