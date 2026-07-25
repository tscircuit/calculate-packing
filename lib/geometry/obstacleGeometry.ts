import Flatten from "@flatten-js/core"
import type { Bounds } from "@tscircuit/math-utils"
import type { InputObstacle } from "../types"

const CURVE_SEGMENTS = 64

const getEllipsePoints = (opts: {
  center: { x: number; y: number }
  radiusX: number
  radiusY: number
}) => {
  const { center, radiusX, radiusY } = opts
  return Array.from({ length: CURVE_SEGMENTS }, (_, index) => {
    const angle = (index / CURVE_SEGMENTS) * Math.PI * 2
    return {
      x: center.x + radiusX * Math.cos(angle),
      y: center.y + radiusY * Math.sin(angle),
    }
  })
}

const getPillPoints = (opts: {
  center: { x: number; y: number }
  width: number
  height: number
}) => {
  const { center, width, height } = opts
  const semicircleSegments = CURVE_SEGMENTS / 2

  if (Math.abs(width - height) < 1e-12) {
    return getEllipsePoints({
      center,
      radiusX: width / 2,
      radiusY: height / 2,
    })
  }

  if (width > height) {
    const radius = height / 2
    const straightHalfLength = (width - height) / 2
    const rightCenter = { x: center.x + straightHalfLength, y: center.y }
    const leftCenter = { x: center.x - straightHalfLength, y: center.y }

    return [
      ...Array.from({ length: semicircleSegments + 1 }, (_, index) => {
        const angle = -Math.PI / 2 + (index / semicircleSegments) * Math.PI
        return {
          x: rightCenter.x + radius * Math.cos(angle),
          y: rightCenter.y + radius * Math.sin(angle),
        }
      }),
      ...Array.from({ length: semicircleSegments + 1 }, (_, index) => {
        const angle = Math.PI / 2 + (index / semicircleSegments) * Math.PI
        return {
          x: leftCenter.x + radius * Math.cos(angle),
          y: leftCenter.y + radius * Math.sin(angle),
        }
      }),
    ]
  }

  const radius = width / 2
  const straightHalfLength = (height - width) / 2
  const topCenter = { x: center.x, y: center.y + straightHalfLength }
  const bottomCenter = { x: center.x, y: center.y - straightHalfLength }

  return [
    ...Array.from({ length: semicircleSegments + 1 }, (_, index) => {
      const angle = (index / semicircleSegments) * Math.PI
      return {
        x: topCenter.x + radius * Math.cos(angle),
        y: topCenter.y + radius * Math.sin(angle),
      }
    }),
    ...Array.from({ length: semicircleSegments + 1 }, (_, index) => {
      const angle = Math.PI + (index / semicircleSegments) * Math.PI
      return {
        x: bottomCenter.x + radius * Math.cos(angle),
        y: bottomCenter.y + radius * Math.sin(angle),
      }
    }),
  ]
}

/** Returns a counterclockwise outline for an obstacle, optionally inflated. */
export const getObstacleOutlinePoints = (
  obstacle: InputObstacle,
  expansion = 0,
): Array<{ x: number; y: number }> => {
  const center = obstacle.absoluteCenter
  const width = obstacle.width + expansion * 2
  const height = obstacle.height + expansion * 2

  if (!(width > 0) || !(height > 0)) return []

  let points: Array<{ x: number; y: number }>
  switch (obstacle.shape) {
    case "circle":
      points = getEllipsePoints({
        center,
        radiusX: width / 2,
        radiusY: height / 2,
      })
      break
    case "oval":
      points = getEllipsePoints({
        center,
        radiusX: width / 2,
        radiusY: height / 2,
      })
      break
    case "pill":
    case "rotated_pill":
      points = getPillPoints({ center, width, height })
      break
    case "rect":
    default: {
      const halfWidth = width / 2
      const halfHeight = height / 2
      points = [
        { x: center.x - halfWidth, y: center.y - halfHeight },
        { x: center.x + halfWidth, y: center.y - halfHeight },
        { x: center.x + halfWidth, y: center.y + halfHeight },
        { x: center.x - halfWidth, y: center.y + halfHeight },
      ]
      break
    }
  }

  return points
}

export const getObstaclePolygon = (
  obstacle: InputObstacle,
  expansion = 0,
): Flatten.Polygon => {
  const center = new Flatten.Point(
    obstacle.absoluteCenter.x,
    obstacle.absoluteCenter.y,
  )
  const width = obstacle.width + expansion * 2
  const height = obstacle.height + expansion * 2

  if (obstacle.shape === "circle") {
    return new Flatten.Polygon(new Flatten.Circle(center, width / 2))
  }

  if (obstacle.shape === "pill" || obstacle.shape === "rotated_pill") {
    let shapes: Array<Flatten.Segment | Flatten.Arc>

    if (width >= height) {
      const radius = height / 2
      const straightHalfLength = (width - height) / 2
      const leftX = center.x - straightHalfLength
      const rightX = center.x + straightHalfLength
      const leftBottom = new Flatten.Point(leftX, center.y - radius)
      const rightBottom = new Flatten.Point(rightX, center.y - radius)
      const rightTop = new Flatten.Point(rightX, center.y + radius)
      const leftTop = new Flatten.Point(leftX, center.y + radius)

      shapes = [
        new Flatten.Segment(leftBottom, rightBottom),
        new Flatten.Arc(
          new Flatten.Point(rightX, center.y),
          radius,
          -Math.PI / 2,
          Math.PI / 2,
          true,
        ),
        new Flatten.Segment(rightTop, leftTop),
        new Flatten.Arc(
          new Flatten.Point(leftX, center.y),
          radius,
          Math.PI / 2,
          (Math.PI * 3) / 2,
          true,
        ),
      ]
    } else {
      const radius = width / 2
      const straightHalfLength = (height - width) / 2
      const bottomY = center.y - straightHalfLength
      const topY = center.y + straightHalfLength
      const bottomRight = new Flatten.Point(center.x + radius, bottomY)
      const topRight = new Flatten.Point(center.x + radius, topY)
      const topLeft = new Flatten.Point(center.x - radius, topY)
      const bottomLeft = new Flatten.Point(center.x - radius, bottomY)

      shapes = [
        new Flatten.Segment(bottomRight, topRight),
        new Flatten.Arc(
          new Flatten.Point(center.x, topY),
          radius,
          0,
          Math.PI,
          true,
        ),
        new Flatten.Segment(topLeft, bottomLeft),
        new Flatten.Arc(
          new Flatten.Point(center.x, bottomY),
          radius,
          Math.PI,
          Math.PI * 2,
          true,
        ),
      ]
    }

    return new Flatten.Polygon(shapes)
  }

  const points = getObstacleOutlinePoints(obstacle, expansion)
  return new Flatten.Polygon(
    points.map(({ x, y }) => [x, y] as [number, number]),
  )
}

export const getObstacleBounds = (
  obstacle: InputObstacle,
  expansion = 0,
): Bounds => {
  const polygon = getObstaclePolygon(obstacle, expansion)
  if (polygon.isEmpty()) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }
  const box = polygon.box

  return {
    minX: box.xmin,
    minY: box.ymin,
    maxX: box.xmax,
    maxY: box.ymax,
  }
}

export const getDistanceBetweenBoxAndObstacle = (
  box: {
    center: { x: number; y: number }
    width: number
    height: number
  },
  obstacle: InputObstacle,
) => {
  const centerDeltaX = Math.abs(box.center.x - obstacle.absoluteCenter.x)
  const centerDeltaY = Math.abs(box.center.y - obstacle.absoluteCenter.y)

  if (!obstacle.shape || obstacle.shape === "rect") {
    const gapX = Math.max(0, centerDeltaX - (box.width + obstacle.width) / 2)
    const gapY = Math.max(0, centerDeltaY - (box.height + obstacle.height) / 2)
    return Math.hypot(gapX, gapY)
  }

  if (obstacle.shape === "circle") {
    const gapX = Math.max(0, centerDeltaX - box.width / 2)
    const gapY = Math.max(0, centerDeltaY - box.height / 2)
    return Math.max(0, Math.hypot(gapX, gapY) - obstacle.width / 2)
  }

  const halfWidth = box.width / 2
  const halfHeight = box.height / 2
  const boxPolygon = new Flatten.Polygon([
    [box.center.x - halfWidth, box.center.y - halfHeight],
    [box.center.x + halfWidth, box.center.y - halfHeight],
    [box.center.x + halfWidth, box.center.y + halfHeight],
    [box.center.x - halfWidth, box.center.y + halfHeight],
  ])
  const obstaclePolygon = getObstaclePolygon(obstacle)

  return boxPolygon.distanceTo(obstaclePolygon)[0]
}
