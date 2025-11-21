import React, { useEffect } from "react"
import { LargestRectOutsideOutlineFromPointSolver } from "../../lib/LargestRectOutsideOutlineFromPointSolver"
import type { Point } from "../../lib/geometry/types"
import type { Bounds } from "@tscircuit/math-utils"
import { InteractiveGraphics } from "graphics-debug/react"

export type Rect = { x: number; y: number; w: number; h: number }

export default function LargestRectOutsideOutlineSolver01Page() {
  const fullOutline: Point[] = [
    { x: -0.8, y: 0.325 },
    { x: -1.225, y: 0.325 },
    { x: -1.225, y: -0.325 },
    { x: -0.8, y: -0.325 },
    { x: -0.8, y: -0.5 },
    { x: 0.8, y: -0.5 },
    { x: 0.8, y: -0.325 },
    { x: 1.225, y: -0.325 },
    { x: 1.225, y: 0.325 },
    { x: 0.8, y: 0.325 },
    { x: 0.8, y: 0.5 },
    { x: -0.8, y: 0.5 },
  ]

  const globalBounds: Bounds = {
    minX: -2.1774186,
    minY: -1.4524186000000006,
    maxX: 2.1774186,
    maxY: 1.4524186000000006,
  }

  const origin: Point = {
    x: -1.0125000000000002,
    y: 0.3251,
  }

  const solver = new LargestRectOutsideOutlineFromPointSolver({
    ccwFullOutline: fullOutline,
    origin,
    globalBounds,
  })

  solver.solve()
  const result = solver.getLargestRect()

  useEffect(() => {
    if (typeof document === "undefined") return
    if (
      !document.querySelector(
        'script[src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"]',
      )
    ) {
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"
      document.head.appendChild(script)
    }
  }, [])

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold mt-5 mb-5">
        LargestRectOutsideOutlineSolver Test 01
      </h2>
      <div className="mb-5">
        <h3 className="text-lg font-bold mt-4 mb-4">Input Data:</h3>
        <div>
          Origin: ({origin.x.toFixed(3)}, {origin.y.toFixed(3)})
        </div>
        <div>Outline points: {fullOutline.length}</div>
        <div>
          Global bounds: [{globalBounds.minX.toFixed(3)},{" "}
          {globalBounds.minY.toFixed(3)}] to [{globalBounds.maxX.toFixed(3)},{" "}
          {globalBounds.maxY.toFixed(3)}]
        </div>
      </div>
      <div className="mb-5">
        <h3 className="text-lg font-bold mt-4 mb-4">Result:</h3>
        {result ? (
          <div>
            <div>
              Rectangle found: x={result.x.toFixed(3)}, y={result.y.toFixed(3)},
              w={result.w.toFixed(3)}, h={result.h.toFixed(3)}
            </div>
            <div>Area: {(result.w * result.h).toFixed(3)}</div>
          </div>
        ) : (
          <div>No rectangle found</div>
        )}
      </div>
      <div className="border-2 border-gray-800 mx-auto max-w-xl">
        {solver && <InteractiveGraphics graphics={solver.visualize()} />}
      </div>
    </div>
  )
}
