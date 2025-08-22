// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  MultiOffsetIrlsSolver,
  type Point,
  type OffsetPadPoint,
} from "../../lib/solver-utils/MultiOffsetIrlsSolver"

type InteractionMode = "add-pad" | "add-target" | "assign-target" | "drag"

export default function MultiOffsetIrlsVisualizer() {
  const canvasRef = useRef(null)
  const [centerPosition, setCenterPosition] = useState<Point>({
    x: 400,
    y: 250,
  })
  const [offsetPadPoints, setOffsetPadPoints] = useState<OffsetPadPoint[]>([
    { id: "pad1", offsetX: -200, offsetY: -50 },
    { id: "pad2", offsetX: 200, offsetY: 50 },
  ])
  const [targetPoints, setTargetPoints] = useState<Point[]>([
    { x: 150, y: 100 },
    { x: 250, y: 150 },
    { x: 550, y: 200 },
    { x: 650, y: 250 },
  ])
  const [targetPointMap, setTargetPointMap] = useState<Map<string, Point[]>>(
    new Map([
      [
        "pad1",
        [
          { x: 150, y: 100 },
          { x: 250, y: 150 },
        ],
      ],
      [
        "pad2",
        [
          { x: 550, y: 200 },
          { x: 650, y: 250 },
        ],
      ],
    ]),
  )
  const [mode, setMode] = useState<InteractionMode>("drag")
  const [selectedPadId, setSelectedPadId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItem, setDraggedItem] = useState<{
    type: "pad" | "target" | "center"
    id: string
    index?: number
  } | null>(null)
  const [solver, setSolver] = useState<MultiOffsetIrlsSolver | null>(null)
  const [optimalPosition, setOptimalPosition] = useState<Point | null>(null)
  const [iterationCount, setIterationCount] = useState<number | null>(null)

  const colors = [
    "#4CAF50",
    "#2196F3",
    "#FF9800",
    "#9C27B0",
    "#F44336",
    "#607D8B",
  ]

  const getColorForPad = (padId: string) => {
    const index = offsetPadPoints.findIndex((pad) => pad.id === padId)
    return colors[index % colors.length]
  }

  const calculateDistance = useCallback((p1: Point, p2: Point) => {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw connections from pads to their assigned targets
    for (const pad of offsetPadPoints) {
      const assignedTargets = targetPointMap.get(pad.id) || []
      const color = getColorForPad(pad.id)
      
      // Calculate current absolute position of this offset pad
      const padAbsolutePos = {
        x: centerPosition.x + pad.offsetX,
        y: centerPosition.y + pad.offsetY
      }

      ctx.strokeStyle = `${color}60` // Semi-transparent
      ctx.lineWidth = 2

      for (const target of assignedTargets) {
        ctx.beginPath()
        ctx.moveTo(padAbsolutePos.x, padAbsolutePos.y)
        ctx.lineTo(target.x, target.y)
        ctx.stroke()

        // Draw distance at midpoint
        const distance = calculateDistance(padAbsolutePos, target)
        const midX = (padAbsolutePos.x + target.x) / 2
        const midY = (padAbsolutePos.y + target.y) / 2

        // Background for text
        ctx.fillStyle = "white"
        ctx.font = "10px Arial"
        const textWidth = ctx.measureText(distance.toFixed(1)).width
        ctx.fillRect(midX - textWidth / 2 - 2, midY - 6, textWidth + 4, 12)

        // Distance text
        ctx.fillStyle = "#333"
        ctx.textAlign = "center"
        ctx.fillText(distance.toFixed(1), midX, midY + 3)
      }
    }

    // Draw all target points
    for (const target of targetPoints) {
      // Check which pad(s) this target is assigned to
      let assignedToPad = null
      for (const [padId, assignedTargets] of targetPointMap) {
        if (assignedTargets.some((t) => t.x === target.x && t.y === target.y)) {
          assignedToPad = padId
          break
        }
      }

      if (assignedToPad) {
        ctx.fillStyle = getColorForPad(assignedToPad)
      } else {
        ctx.fillStyle = "#DDD" // Unassigned targets are gray
      }

      ctx.beginPath()
      ctx.arc(target.x, target.y, 6, 0, 2 * Math.PI)
      ctx.fill()

      // Border for unassigned targets
      if (!assignedToPad) {
        ctx.strokeStyle = "#999"
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    // Draw center position (large red circle)
    ctx.fillStyle = "#f44336"
    ctx.beginPath()
    ctx.arc(centerPosition.x, centerPosition.y, 8, 0, 2 * Math.PI)
    ctx.fill()
    
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw offset pad points (relative to center)
    for (const pad of offsetPadPoints) {
      const color = getColorForPad(pad.id)
      
      const padAbsolutePos = {
        x: centerPosition.x + pad.offsetX,
        y: centerPosition.y + pad.offsetY
      }
      
      // Main circle
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(padAbsolutePos.x, padAbsolutePos.y, 12, 0, 2 * Math.PI)
      ctx.fill()

      // Border
      ctx.strokeStyle = "#333"
      ctx.lineWidth = 2
      ctx.stroke()

      // Selected highlight
      if (selectedPadId === pad.id) {
        ctx.strokeStyle = "#FFF"
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // Draw line from center to pad to show offset
      ctx.strokeStyle = "#999"
      ctx.lineWidth = 1
      ctx.setLineDash([2, 2])
      ctx.beginPath()
      ctx.moveTo(centerPosition.x, centerPosition.y)
      ctx.lineTo(padAbsolutePos.x, padAbsolutePos.y)
      ctx.stroke()
      ctx.setLineDash([])

      // Label
      ctx.fillStyle = "#FFF"
      ctx.font = "bold 10px Arial"
      ctx.textAlign = "center"
      ctx.fillText(pad.id.replace("pad", ""), padAbsolutePos.x, padAbsolutePos.y + 3)
    }

    // Draw optimal position if calculated
    if (optimalPosition) {
      ctx.strokeStyle = "#4CAF50"
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(optimalPosition.x - 15, optimalPosition.y)
      ctx.lineTo(optimalPosition.x + 15, optimalPosition.y)
      ctx.moveTo(optimalPosition.x, optimalPosition.y - 15)
      ctx.lineTo(optimalPosition.x, optimalPosition.y + 15)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [
    offsetPadPoints,
    targetPoints,
    targetPointMap,
    selectedPadId,
    optimalPosition,
    centerPosition,
    calculateDistance,
  ])

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

  const isNearPoint = (pos: Point, target: Point, threshold: number) => {
    return calculateDistance(pos, target) < threshold
  }

  const findNearestPad = (pos: Point) => {
    for (const pad of offsetPadPoints) {
      const padAbsolutePos = {
        x: centerPosition.x + pad.offsetX,
        y: centerPosition.y + pad.offsetY
      }
      if (isNearPoint(pos, padAbsolutePos, 15)) {
        return pad
      }
    }
    return null
  }
  
  const isNearCenter = (pos: Point) => {
    return isNearPoint(pos, centerPosition, 12)
  }

  const findNearestTarget = (pos: Point) => {
    for (let i = 0; i < targetPoints.length; i++) {
      if (isNearPoint(pos, targetPoints[i], 10)) {
        return { target: targetPoints[i], index: i }
      }
    }
    return null
  }

  const handleMouseDown = (e) => {
    const pos = getMousePos(e)

    if (mode === "add-pad") {
      const newPadId = `pad${offsetPadPoints.length + 1}`
      const offsetX = pos.x - centerPosition.x
      const offsetY = pos.y - centerPosition.y
      setOffsetPadPoints((prev) => [
        ...prev,
        { id: newPadId, offsetX, offsetY },
      ])
      setTargetPointMap((prev) => new Map(prev.set(newPadId, [])))
    } else if (mode === "add-target") {
      setTargetPoints((prev) => [...prev, { x: pos.x, y: pos.y }])
    } else if (mode === "assign-target") {
      const nearestPad = findNearestPad(pos)
      const nearestTarget = findNearestTarget(pos)

      if (nearestPad) {
        setSelectedPadId(nearestPad.id)
      } else if (nearestTarget && selectedPadId) {
        // Assign target to selected pad
        setTargetPointMap((prev) => {
          const newMap = new Map(prev)
          const currentTargets = newMap.get(selectedPadId) || []
          const targetAlreadyAssigned = currentTargets.some(
            (t) =>
              t.x === nearestTarget.target.x && t.y === nearestTarget.target.y,
          )

          if (!targetAlreadyAssigned) {
            newMap.set(selectedPadId, [...currentTargets, nearestTarget.target])
          } else {
            // Remove assignment if already assigned
            newMap.set(
              selectedPadId,
              currentTargets.filter(
                (t) =>
                  !(
                    t.x === nearestTarget.target.x &&
                    t.y === nearestTarget.target.y
                  ),
              ),
            )
          }
          return newMap
        })
      }
    } else if (mode === "drag") {
      const nearestPad = findNearestPad(pos)
      const nearestTarget = findNearestTarget(pos)
      
      if (isNearCenter(pos)) {
        setIsDragging(true)
        setDraggedItem({ type: "center", id: "center" })
      } else if (nearestPad) {
        setIsDragging(true)
        setDraggedItem({ type: "pad", id: nearestPad.id })
      } else if (nearestTarget) {
        setIsDragging(true)
        setDraggedItem({
          type: "target",
          id: "target",
          index: nearestTarget.index,
        })
      }
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !draggedItem) return

    const pos = getMousePos(e)

    if (draggedItem.type === "center") {
      setCenterPosition({ x: pos.x, y: pos.y })
    } else if (draggedItem.type === "pad") {
      // Update the offset of the pad relative to center
      const offsetX = pos.x - centerPosition.x
      const offsetY = pos.y - centerPosition.y
      setOffsetPadPoints((prev) =>
        prev.map((pad) =>
          pad.id === draggedItem.id ? { ...pad, offsetX, offsetY } : pad,
        ),
      )
    } else if (
      draggedItem.type === "target" &&
      draggedItem.index !== undefined
    ) {
      setTargetPoints((prev) =>
        prev.map((target, i) =>
          i === draggedItem.index ? { x: pos.x, y: pos.y } : target,
        ),
      )

      // Update assignments to use new position
      setTargetPointMap((prev) => {
        const newMap = new Map()
        for (const [padId, targets] of prev) {
          const updatedTargets = targets.map((target, i) =>
            target === targetPoints[draggedItem.index!]
              ? { x: pos.x, y: pos.y }
              : target,
          )
          newMap.set(padId, updatedTargets)
        }
        return newMap
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDraggedItem(null)
  }

  const solve = () => {
    if (offsetPadPoints.length === 0) return

    const solver = new MultiOffsetIrlsSolver({
      offsetPadPoints: offsetPadPoints.map((pad) => ({ ...pad })),
      targetPointMap: new Map(targetPointMap),
      initialPosition: centerPosition,
      epsilon: 1e-6,
      maxIterations: 100,
    })

    setSolver(solver)
    solver.solve()

    const result = solver.getBestPosition()
    setOptimalPosition(result)
    setIterationCount(solver.iterations)

    // Update center position to optimal position
    setCenterPosition(result)
  }

  const clearAll = () => {
    setOffsetPadPoints([])
    setTargetPoints([])
    setTargetPointMap(new Map())
    setOptimalPosition(null)
    setIterationCount(null)
    setSolver(null)
    setSelectedPadId(null)
    setCenterPosition({ x: 400, y: 250 })
  }

  const resetToExample = () => {
    const exampleCenter = { x: 400, y: 250 }
    const examplePads = [
      { id: "pad1", offsetX: -200, offsetY: -50 },
      { id: "pad2", offsetX: 200, offsetY: 50 },
    ]
    const exampleTargets = [
      { x: 150, y: 100 },
      { x: 250, y: 150 },
      { x: 550, y: 200 },
      { x: 650, y: 250 },
    ]
    const exampleMap = new Map([
      [
        "pad1",
        [
          { x: 150, y: 100 },
          { x: 250, y: 150 },
        ],
      ],
      [
        "pad2",
        [
          { x: 550, y: 200 },
          { x: 650, y: 250 },
        ],
      ],
    ])

    setCenterPosition(exampleCenter)
    setOffsetPadPoints(examplePads)
    setTargetPoints(exampleTargets)
    setTargetPointMap(exampleMap)
    setOptimalPosition(null)
    setIterationCount(null)
    setSolver(null)
    setSelectedPadId(null)
  }

  const totalDistance = solver ? solver.getTotalDistance() : 0
  const optimalDistance =
    optimalPosition && solver
      ? solver.getTotalDistance(optimalPosition)
      : null

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg p-6 shadow-lg">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
        Multi-Offset IRLS Algorithm Visualizer
      </h1>

      <div className="text-center mb-4 text-gray-600 text-sm">
        Single center position (red) with multiple offset pads relative to it, optimizing distance to assigned targets
      </div>

      <div className="flex justify-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setMode("add-pad")}
          className={`px-3 py-2 text-sm rounded transition-colors ${
            mode === "add-pad"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Add Pad
        </button>
        <button
          onClick={() => setMode("add-target")}
          className={`px-3 py-2 text-sm rounded transition-colors ${
            mode === "add-target"
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Add Target
        </button>
        <button
          onClick={() => setMode("assign-target")}
          className={`px-3 py-2 text-sm rounded transition-colors ${
            mode === "assign-target"
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Assign Targets
        </button>
        <button
          onClick={() => setMode("drag")}
          className={`px-3 py-2 text-sm rounded transition-colors ${
            mode === "drag"
              ? "bg-purple-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Drag
        </button>

        <div className="border-l border-gray-300 mx-2"></div>

        <button
          onClick={solve}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Solve
        </button>
        <button
          onClick={resetToExample}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Reset Example
        </button>
        <button
          onClick={clearAll}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Clear All
        </button>
      </div>

      {selectedPadId && mode === "assign-target" && (
        <div className="text-center mb-2 text-sm">
          <span className="bg-orange-100 px-2 py-1 rounded">
            Selected: {selectedPadId} - Click target points to assign/unassign
          </span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="border-2 border-gray-300 block mx-auto cursor-crosshair"
      />

      <div className="flex justify-center gap-8 mt-4 text-sm">
        <div>
          <strong>Pads:</strong> {offsetPadPoints.length}
        </div>
        <div>
          <strong>Targets:</strong> {targetPoints.length}
        </div>
        <div>
          <strong>Total Distance:</strong>{" "}
          <span className="text-blue-600">{totalDistance.toFixed(2)}</span>
        </div>
        <div>
          <strong>Optimal Distance:</strong>{" "}
          <span className="text-green-600">
            {optimalDistance?.toFixed(2) || "--"}
          </span>
        </div>
        <div>
          <strong>Iterations:</strong>{" "}
          <span className="text-green-600">{iterationCount || "--"}</span>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <div>
          <strong>Add Pad:</strong> Click to add offset pad points relative to center (large colored circles)
        </div>
        <div>
          <strong>Add Target:</strong> Click to add target points (small circles)
        </div>
        <div>
          <strong>Assign Targets:</strong> Click a pad to select, then click targets to assign/unassign
        </div>
        <div>
          <strong>Drag:</strong> Drag the red center point, offset pads, or targets
        </div>
        <div>Colors indicate which targets are assigned to which pads. Dashed lines show pad offsets.</div>
      </div>
    </div>
  )
}
