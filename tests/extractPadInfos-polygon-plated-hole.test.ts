import { cju } from "@tscircuit/circuit-json-util"
import { expect, test } from "bun:test"
import type { CircuitJson, PcbComponent } from "circuit-json"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { extractPadInfos } from "../lib/plumbing/extractPadInfos"

test.failing("extractPadInfos handles plated holes with polygon pads", async () => {
  const circuitJson = [
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      source_component_id: "source_component_0",
      center: { x: 3, y: -2 },
      layer: "top",
      rotation: 0,
      width: 4,
      height: 4,
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pcb_plated_hole_0",
      pcb_component_id: "pcb_component_0",
      pcb_port_id: "pcb_port_0",
      shape: "hole_with_polygon_pad",
      hole_shape: "circle",
      hole_diameter: 1,
      hole_offset_x: 0,
      hole_offset_y: 0,
      pad_outline: [
        { x: -2, y: -2 },
        { x: 2, y: -2 },
        { x: 2, y: 2 },
        { x: -2, y: 2 },
      ],
      x: 3,
      y: -2,
      layers: ["top", "bottom"],
    },
  ] as CircuitJson
  const db = cju(circuitJson)

  const originalWarn = console.warn
  console.warn = () => {}
  const pads = extractPadInfos(
    db.pcb_component.get("pcb_component_0") as PcbComponent,
    db,
    (pcbPortId) => pcbPortId ?? "",
  )
  console.warn = originalWarn

  await expect(
    getSvgFromGraphicsObject({
      coordinateSystem: "cartesian",
      title: "source polygon pad (left) vs extracted packing pads (right)",
      rects: [
        {
          center: { x: -3, y: 0 },
          width: 4,
          height: 4,
          fill: "rgba(33, 150, 243, 0.15)",
          stroke: "rgba(33, 150, 243, 0.8)",
          label: "source polygon pad bounds",
        },
        {
          center: { x: 3, y: 0 },
          width: 4,
          height: 4,
          fill: "rgba(0, 0, 0, 0.03)",
          stroke: "rgba(0, 0, 0, 0.35)",
          label: "extracted packing pad bounds",
        },
        ...pads.map((pad) => ({
          center: {
            x: 3 + (pad.absoluteCenter.x - 3),
            y: pad.absoluteCenter.y + 2,
          },
          width: pad.size.x,
          height: pad.size.y,
          fill: "rgba(255, 0, 0, 0.55)",
          stroke: "rgba(180, 0, 0, 0.9)",
          label: `extracted ${pad.padId}`,
        })),
      ],
    }),
  ).toMatchSvgSnapshot(import.meta.path)

  expect(pads).toEqual([
    {
      padId: "pcb_plated_hole_0",
      networkId: "pcb_port_0",
      size: { x: 4, y: 4 },
      absoluteCenter: { x: 3, y: -2 },
      pcbPortId: "pcb_port_0",
    },
  ])
})
