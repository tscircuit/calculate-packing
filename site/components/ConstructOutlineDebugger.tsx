import { InteractiveGraphics } from "graphics-debug/react"
import { useState, useEffect } from "react"
import { constructOutlinesFromPackedComponents } from "../../lib/constructOutlinesFromPackedComponents"
import { getComponentBounds } from "../../lib/geometry/getComponentBounds"
import type { PackedComponent } from "../../lib/types"
import type { GraphicsObject, Rect, Line } from "graphics-debug"
import { createColorMapFromStrings } from "../../lib/testing/createColorMapFromStrings"

interface ConstructOutlineDebuggerProps {
  components: PackedComponent[]
  minGap: number
  title?: string
  stepNumber?: number
}

const getGraphicsFromConstructOutlineData = (
  components: PackedComponent[],
  minGap: number,
): GraphicsObject => {
  const rects: Rect[] = []
  const lines: Line[] = []

  // Get outlines
  const outlines = constructOutlinesFromPackedComponents(components, { minGap })

  // Create color map for networks
  const allNetworkIds = Array.from(
    new Set(components.flatMap((c) => c.pads.map((p) => p.networkId))),
  )
  const colorMap = createColorMapFromStrings(allNetworkIds)

  // Render components
  for (const component of components) {
    const bounds = getComponentBounds(component, 0)
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY

    // Component body
    const rect: Rect = {
      center: { x: component.center.x, y: component.center.y },
      width,
      height,
      fill: "rgba(224,224,224,0.8)",
      label: [
        component.componentId,
        `rotation: ${((component.ccwRotationOffset * 180) / Math.PI).toFixed(1)}°`,
      ].join("\n"),
    }
    rects.push(rect)

    // Component pads
    for (const pad of component.pads) {
      const { absoluteCenter, size, padId, networkId } = pad

      const padRect: Rect = {
        center: { x: absoluteCenter.x, y: absoluteCenter.y },
        width: size.x,
        height: size.y,
        label: `${padId}\n${networkId}`,
        fill: colorMap[networkId] || "#4a90e2",
      }

      rects.push(padRect)
    }
  }

  // Render outlines
  for (const outline of outlines) {
    for (const segment of outline) {
      const line: Line = {
        points: [
          { x: segment[0].x, y: segment[0].y },
          { x: segment[1].x, y: segment[1].y },
        ],
        strokeColor: "#ff4444",
      }
      lines.push(line)
    }
  }

  return {
    coordinateSystem: "cartesian" as const,
    rects,
    lines,
  }
}

export const ConstructOutlineDebugger = ({
  components,
  minGap: initialMinGap,
  title = "Construct Outline Debugger",
  stepNumber,
}: ConstructOutlineDebuggerProps) => {
  const [minGap, setMinGap] = useState(initialMinGap)

  // Load Tailwind CSS dynamically
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

  const graphics = getGraphicsFromConstructOutlineData(components, minGap)

  return (
    <div className="m-2">
      <h2 className="text-xl font-bold mt-5 mb-5">{title}</h2>

      {stepNumber !== undefined && (
        <p className="text-gray-600  mt-4 mb-4">Step: {stepNumber}</p>
      )}

      <p className="text-gray-600 mt-4 mb-4">
        Components: {components.length}, Min Gap: {minGap}
      </p>

      {/* Control Panel */}
      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <label style={{ marginRight: "10px" }}>
            <strong>Min Gap:</strong>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={minGap}
            onChange={(e) => setMinGap(parseFloat(e.target.value))}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginRight: "10px",
            }}
          />
          <span>{minGap.toFixed(3)}</span>
        </div>

        <button
          onClick={() => setMinGap(initialMinGap)}
          style={{
            padding: "4px 12px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Reset to Original ({initialMinGap})
        </button>
      </div>

      <InteractiveGraphics graphics={graphics} />
    </div>
  )
}
