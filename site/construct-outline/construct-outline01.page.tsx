import React, { useState, useRef, useEffect } from "react"
import { constructOutlinesFromPackedComponents } from "../../lib/constructOutlinesFromPackedComponents"
import { getComponentBounds } from "../../lib/geometry/getComponentBounds"
import { rotatePoint } from "../../lib/math/rotatePoint"
import type { PackedComponent, OutputPad } from "../../lib/types"
import type { Point } from "@tscircuit/math-utils"

// React component
const OutlineVisualization: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [minGap, setMinGap] = useState(20)

  // Generate 4 random components
  const [components, setComponents] = useState<PackedComponent[]>(() => {
    const generateRandomComponent = (id: string): PackedComponent => {
      const numPads = Math.floor(Math.random() * 4) + 2 // 2-5 pads
      const pads: OutputPad[] = []

      for (let i = 0; i < numPads; i++) {
        const offset = {
          x: (Math.random() - 0.5) * 60,
          y: (Math.random() - 0.5) * 60,
        }
        const size = {
          x: Math.random() * 20 + 10,
          y: Math.random() * 20 + 10,
        }

        pads.push({
          padId: `pad-${id}-${i}`,
          networkId: `net-${i}`,
          type: "rect",
          offset,
          size,
          absoluteCenter: { x: 0, y: 0 }, // Will be calculated
        })
      }

      return {
        componentId: id,
        center: {
          x: Math.random() * 400 + 200,
          y: Math.random() * 300 + 150,
        },
        ccwRotationOffset: Math.random() * Math.PI * 2,
        pads,
      }
    }

    return [
      generateRandomComponent("comp1"),
      generateRandomComponent("comp2"),
      generateRandomComponent("comp3"),
      generateRandomComponent("comp4"),
    ]
  })

  // Update absolute centers when components change
  useEffect(() => {
    setComponents((prevComponents) =>
      prevComponents.map((component) => ({
        ...component,
        pads: component.pads.map((pad) => ({
          ...pad,
          absoluteCenter: {
            x: component.center.x + pad.offset.x,
            y: component.center.y + pad.offset.y,
          },
        })),
      })),
    )
  }, [])

  const outlines = constructOutlinesFromPackedComponents(components, { minGap })

  const handleMouseDown = (e: React.MouseEvent, componentId: string) => {
    const component = components.find((c) => c.componentId === componentId)
    if (!component) return

    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    setDraggedComponent(componentId)
    setDragOffset({
      x: mouseX - component.center.x,
      y: mouseY - component.center.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedComponent) return

    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    setComponents((prevComponents) =>
      prevComponents.map((component) => {
        if (component.componentId === draggedComponent) {
          const newCenter = {
            x: mouseX - dragOffset.x,
            y: mouseY - dragOffset.y,
          }
          return {
            ...component,
            center: newCenter,
            pads: component.pads.map((pad) => ({
              ...pad,
              absoluteCenter: {
                x: newCenter.x + pad.offset.x,
                y: newCenter.y + pad.offset.y,
              },
            })),
          }
        }
        return component
      }),
    )
  }

  const handleMouseUp = () => {
    setDraggedComponent(null)
  }

  const renderComponent = (component: PackedComponent) => {
    const bounds = getComponentBounds(component, 0)

    return (
      <g key={component.componentId}>
        {/* Component body */}
        <rect
          x={bounds.minX}
          y={bounds.minY}
          width={bounds.maxX - bounds.minX}
          height={bounds.maxY - bounds.minY}
          fill="#e0e0e0"
          stroke="#666"
          strokeWidth="2"
          rx="4"
          style={{ cursor: "move" }}
          onMouseDown={(e) => handleMouseDown(e, component.componentId)}
        />

        {/* Component label */}
        <text
          x={component.center.x}
          y={component.center.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill="#333"
          style={{ pointerEvents: "none" }}
        >
          {component.componentId}
        </text>

        {/* Pads */}
        {component.pads.map((pad) => {
          const corners = [
            {
              x: pad.offset.x - pad.size.x / 2,
              y: pad.offset.y - pad.size.y / 2,
            },
            {
              x: pad.offset.x + pad.size.x / 2,
              y: pad.offset.y - pad.size.y / 2,
            },
            {
              x: pad.offset.x + pad.size.x / 2,
              y: pad.offset.y + pad.size.y / 2,
            },
            {
              x: pad.offset.x - pad.size.x / 2,
              y: pad.offset.y + pad.size.y / 2,
            },
          ]

          const rotatedCorners = corners.map((corner) =>
            rotatePoint(corner, component.ccwRotationOffset, { x: 0, y: 0 }),
          )

          const worldCorners = rotatedCorners.map((corner) => ({
            x: corner.x + component.center.x,
            y: corner.y + component.center.y,
          }))

          const pathData =
            `M ${worldCorners[0]!.x} ${worldCorners[0]!.y} ` +
            worldCorners
              .slice(1)
              .map((p) => `L ${p.x} ${p.y}`)
              .join(" ") +
            " Z"

          return (
            <path
              key={pad.padId}
              d={pathData}
              fill="#4a90e2"
              stroke="#2c5aa0"
              strokeWidth="1"
            />
          )
        })}
      </g>
    )
  }

  const renderOutlines = () => {
    return outlines.map((outline, outlineIndex) => (
      <g key={outlineIndex}>
        {outline.map((segment, segmentIndex) => (
          <line
            key={segmentIndex}
            x1={segment[0].x}
            y1={segment[0].y}
            x2={segment[1].x}
            y2={segment[1].y}
            stroke="#ff4444"
            strokeWidth="3"
            strokeDasharray="5,5"
          />
        ))}
      </g>
    ))
  }

  return (
    <div className="w-full h-screen bg-gray-100 p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">
          Draggable Components Outline Visualization
        </h2>
        <p className="text-gray-600 mb-4">
          Drag the components around to see how the outline adapts. The red
          dashed line shows the computed outline.
        </p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span>Min Gap:</span>
            <input
              type="range"
              min="0"
              max="50"
              value={minGap}
              onChange={(e) => setMinGap(parseInt(e.target.value))}
              className="w-32"
            />
            <span>{minGap}px</span>
          </label>
        </div>
      </div>

      <svg
        ref={svgRef}
        width="800"
        height="600"
        className="border border-gray-300 bg-white rounded-lg shadow-lg"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid background */}
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#f0f0f0"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Render outlines first (behind components) */}
        {renderOutlines()}

        {/* Render components */}
        {components.map(renderComponent)}

        {/* Legend */}
        <g transform="translate(20, 20)">
          <rect
            x="0"
            y="0"
            width="200"
            height="80"
            fill="white"
            stroke="#ccc"
            strokeWidth="1"
            rx="4"
          />
          <text x="10" y="20" fontSize="14" fontWeight="bold">
            Legend:
          </text>
          <line
            x1="10"
            y1="35"
            x2="30"
            y2="35"
            stroke="#ff4444"
            strokeWidth="3"
            strokeDasharray="5,5"
          />
          <text x="35" y="39" fontSize="12">
            Outline (min gap: {minGap}px)
          </text>
          <rect
            x="10"
            y="45"
            width="15"
            height="10"
            fill="#4a90e2"
            stroke="#2c5aa0"
          />
          <text x="30" y="54" fontSize="12">
            Component Pads
          </text>
          <rect
            x="10"
            y="60"
            width="15"
            height="10"
            fill="#e0e0e0"
            stroke="#666"
          />
          <text x="30" y="69" fontSize="12">
            Component Body
          </text>
        </g>
      </svg>
    </div>
  )
}

export default OutlineVisualization
