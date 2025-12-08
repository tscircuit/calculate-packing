import { expect, test } from "bun:test"
import { extractPadInfos } from "../lib/plumbing/extractPadInfos"
import { cju } from "@tscircuit/circuit-json-util"
import type { PcbComponent } from "circuit-json"

test("extractPadInfos handles circle plated hole", () => {
  const soup = [
    {
      type: "pcb_component",
      pcb_component_id: "comp1",
      source_component_id: "src1",
      center: { x: 0, y: 0 },
      layer: "top",
      rotation: 0,
      width: 0,
      height: 0,
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "hole1",
      pcb_component_id: "comp1",
      pcb_port_id: "port1",
      shape: "circle",
      x: 1,
      y: 2,
      outer_diameter: 3,
      hole_diameter: 2,
      layers: ["top", "bottom"],
    },
  ]

  const db = cju(soup as any)
  const pcbComponent = soup[0] as unknown as PcbComponent

  const warnings: string[] = []
  const warn = console.warn
  console.warn = (msg?: any) => warnings.push(String(msg))

  const pads = extractPadInfos(pcbComponent, db, (id) => id ?? "")

  console.warn = warn

  expect(pads).toEqual([
    {
      padId: "hole1",
      networkId: "port1",
      size: { x: 3, y: 3 },
      absoluteCenter: { x: 1, y: 2 },
      pcbPortId: "port1",
    },
  ])
  expect(warnings).toHaveLength(0)
})

test("extractPadInfos handles pcb vias as pads", () => {
  const soup = [
    {
      type: "pcb_component",
      pcb_component_id: "comp1",
      source_component_id: "src1",
      center: { x: 0, y: 0 },
      layer: "top",
      rotation: 0,
      width: 0,
      height: 0,
    },
    {
      type: "pcb_via",
      pcb_via_id: "via1",
      pcb_component_id: "comp1",
      pcb_port_id: "port1",
      x: 5,
      y: -5,
      hole_diameter: 0.4,
      outer_diameter: 0.8,
      layers: ["top", "bottom"],
      from_layer: "top",
      to_layer: "bottom",
    },
  ]

  const db = cju(soup as any)
  const pcbComponent = soup[0] as unknown as PcbComponent

  const pads = extractPadInfos(pcbComponent, db, (id) => id ?? "")

  expect(pads).toEqual([
    {
      padId: "via1",
      networkId: "port1",
      size: { x: 0.8, y: 0.8 },
      absoluteCenter: { x: 5, y: -5 },
      pcbPortId: "port1",
    },
  ])
})
