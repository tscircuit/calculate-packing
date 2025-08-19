// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from "react"
import { IrlsSolver, type Point } from "../../lib/solver-utils/IrlsSolver"

export default function OptimalPointFinder() {
  const canvasRef = useRef(null)
  const [staticPoints, setStaticPoints] = useState<Point[]>([
    { x: 150, y: 100 },
    { x: 300, y: 80 },
    { x: 450, y: 150 },
    { x: 600, y: 120 },
    { x: 700, y: 200 },
  ])
  const [movingPoint, setMovingPoint] = useState<Point>({ x: 400, y: 350 })
  const [isDragging, setIsDragging] = useState(false)
  const [solver, setSolver] = useState<IrlsSolver | null>(null)
  const [optimalPoint, setOptimalPoint] = useState<Point | null>(null)
  const [iterationCount, setIterationCount] = useState<number | null>(null)

  const lineY = 350
  const lineStart = 50
  const lineEnd = 750

  const calculateDistance = useCallback((p1, p2) => {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
  }, [])

  const calculateTotalDistance = useCallback(
    (x) => {
      return staticPoints.reduce((sum, point) => {
        return sum + calculateDistance({ x, y: lineY }, point)
      }, 0)
    },
    [staticPoints, calculateDistance],
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw horizontal line
    ctx.strokeStyle = "#2196F3"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(lineStart, lineY)
    ctx.lineTo(lineEnd, lineY)
    ctx.stroke()

    // Draw line endpoints
    ctx.fillStyle = "#2196F3"
    ctx.fillRect(lineStart - 3, lineY - 5, 6, 10)
    ctx.fillRect(lineEnd - 3, lineY - 5, 6, 10)

    // Draw static points
    ctx.fillStyle = "#4CAF50"
    for (const point of staticPoints) {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Draw lines from moving point to static points with distances
    ctx.strokeStyle = "#666"
    ctx.lineWidth = 1
    ctx.fillStyle = "#333"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"

    for (const point of staticPoints) {
      // Draw line
      ctx.beginPath()
      ctx.moveTo(movingPoint.x, movingPoint.y)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()

      // Calculate and draw distance at midpoint
      const distance = calculateDistance(movingPoint, point)

      const midX = (movingPoint.x + point.x) / 2
      const midY = (movingPoint.y + point.y) / 2

      // Background for text
      ctx.fillStyle = "white"
      ctx.fillRect(midX - 15, midY - 8, 30, 16)

      // Distance text
      ctx.fillStyle = "#333"
      ctx.fillText(distance.toFixed(1), midX, midY + 4)
    }

    // Draw moving point
    ctx.fillStyle = "#f44336"
    ctx.beginPath()
    ctx.arc(movingPoint.x, movingPoint.y, 10, 0, 2 * Math.PI)
    ctx.fill()

    // Draw optimal point if calculated
    if (optimalPoint) {
      ctx.strokeStyle = "#4CAF50"
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(optimalPoint.x, lineY - 20)
      ctx.lineTo(optimalPoint.x, lineY + 20)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [staticPoints, movingPoint, optimalPoint, calculateDistance])

  useEffect(() => {
    draw()
  }, [draw])

  const getMousePos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const isNearPoint = (pos, point, threshold) => {
    return (
      Math.sqrt((pos.x - point.x) ** 2 + (pos.y - point.y) ** 2) < threshold
    )
  }

  const handleMouseDown = (e) => {
    const pos = getMousePos(e)

    // Check if clicking on moving point
    if (isNearPoint(pos, movingPoint, 15)) {
      setIsDragging(true)
    }
    // Check if clicking above the line to add static point
    else if (pos.y < lineY - 20) {
      setStaticPoints((prev) => [...prev, { x: pos.x, y: pos.y }])
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return

    const pos = getMousePos(e)
    // Constrain moving point to the horizontal line
    const constrainedX = Math.max(lineStart, Math.min(lineEnd, pos.x))
    setMovingPoint((prev) => ({ ...prev, x: constrainedX }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // IRLS / Weiszfeld algorithm for geometric median on a line using IrlsSolver
  const solve = () => {
    if (staticPoints.length === 0) return

    // Create constraint function to keep point on the horizontal line
    const constraintFn = (point: Point): Point => ({
      x: Math.max(lineStart, Math.min(lineEnd, point.x)),
      y: lineY
    })

    const irlsSolver = new IrlsSolver({
      targetPoints: staticPoints,
      initialPosition: movingPoint,
      constraintFn,
      epsilon: 1e-6,
      maxIterations: 100
    })

    setSolver(irlsSolver)
    irlsSolver.solve()

    const result = irlsSolver.getBestPosition()
    setOptimalPoint(result)
    setMovingPoint(result)
    setIterationCount(irlsSolver.iterations)
  }

  const clearPoints = () => {
    setStaticPoints([])
    setOptimalPoint(null)
    setIterationCount(null)
    setSolver(null)
    setMovingPoint({ x: 400, y: lineY })
  }

  const totalDistance = solver ? solver.getTotalDistance(movingPoint) : calculateTotalDistance(movingPoint.x)
  const optimalDistance = optimalPoint
    ? (solver ? solver.getTotalDistance(optimalPoint) : calculateTotalDistance(optimalPoint.x))
    : null

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg p-6 shadow-lg">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
        Optimal Point Finder - IRLS/Weiszfeld Algorithm
      </h1>

      <div className="text-center mb-5 text-gray-600 text-sm">
        Click above the blue line to add static points • Drag the red moving
        point along the blue line • Press Solve to find the optimal position
        using IRLS/Weiszfeld algorithm
      </div>

      <div className="flex justify-center gap-4 mb-5 flex-wrap">
        <button
          onClick={solve}
          className="px-5 py-2 bg-green-500 text-white border-none rounded cursor-pointer text-sm transition-colors hover:bg-green-600"
        >
          Solve for Optimal Point
        </button>
        <button
          onClick={clearPoints}
          className="px-5 py-2 bg-red-500 text-white border-none rounded cursor-pointer text-sm transition-colors hover:bg-red-600"
        >
          Clear All Points
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="border-2 border-gray-800 block mx-auto cursor-crosshair"
      />

      <div className="flex justify-center gap-8 mt-4 font-bold">
        <div>
          Total Distance:{" "}
          <span className="text-blue-600">{totalDistance.toFixed(2)}</span>
        </div>
        <div>
          Optimal Distance:{" "}
          <span className="text-green-600">
            {optimalDistance?.toFixed(2) || "--"}
          </span>
        </div>
        <div>
          Iterations:{" "}
          <span className="text-green-600">{iterationCount || "--"}</span>
        </div>
      </div>
    </div>
  )
}
