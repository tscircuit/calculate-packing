import { cju } from "@tscircuit/circuit-json-util"
import { expect, test } from "bun:test"
import type { CircuitJson, PcbComponent } from "circuit-json"
import { extractPadInfos } from "../lib/plumbing/extractPadInfos"

test.failing("extractPadInfos handles plated holes with polygon pads", () => {
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
