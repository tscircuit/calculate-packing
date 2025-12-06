import type { PackInput } from "../../../lib/types"
import { PackDebugger } from "../../components/PackDebugger"

/**
 * Demo: Weak Connections vs Strong Connections
 *
 * This example demonstrates how weak connections (networkId-only) are ignored
 * during component placement when weightedConnections is specified.
 *
 * Setup:
 * - U1: Main chip with VCC, GND, and SIG pads
 * - C1: Capacitor that should be placed CLOSE to U1 (strong connection via weightedConnections)
 * - R1: Resistor that shares VCC network but should NOT influence placement (weak connection)
 *
 * Without weightedConnections: R1's VCC pad would pull the packing toward balancing all VCC pads
 * With weightedConnections: Only the U1-C1 connections matter for placement optimization
 *
 * Visual distinction:
 * - Solid lines = Strong connections (used for placement)
 * - Dashed lines = Weak connections (ignored for placement)
 */
const packInput: PackInput = {
  components: [
    {
      componentId: "U1",
      pads: [
        {
          padId: "U1.VCC",
          networkId: "VCC",
          type: "rect",
          offset: { x: -3, y: 2 },
          size: { x: 1, y: 1 },
        },
        {
          padId: "U1.GND",
          networkId: "GND",
          type: "rect",
          offset: { x: -3, y: -2 },
          size: { x: 1, y: 1 },
        },
        {
          padId: "U1.SIG1",
          networkId: "SIG1",
          type: "rect",
          offset: { x: 3, y: 2 },
          size: { x: 1, y: 1 },
        },
        {
          padId: "U1.SIG2",
          networkId: "SIG2",
          type: "rect",
          offset: { x: 3, y: -2 },
          size: { x: 1, y: 1 },
        },
      ],
    },
    {
      // C1 - Decoupling capacitor - should be placed close to U1
      // Has STRONG connections to U1 via weightedConnections
      componentId: "C1",
      pads: [
        {
          padId: "C1.1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -1, y: 0 },
          size: { x: 0.8, y: 0.8 },
        },
        {
          padId: "C1.2",
          networkId: "GND",
          type: "rect",
          offset: { x: 1, y: 0 },
          size: { x: 0.8, y: 0.8 },
        },
      ],
    },
    {
      // R1 - Pull-up resistor - placement should NOT be influenced by VCC connection
      // Has WEAK connection to U1 (same VCC network but NOT in weightedConnections)
      componentId: "R1",
      pads: [
        {
          padId: "R1.1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -0.5, y: 0 },
          size: { x: 0.6, y: 0.6 },
        },
        {
          padId: "R1.2",
          networkId: "SIG1",
          type: "rect",
          offset: { x: 0.5, y: 0 },
          size: { x: 0.6, y: 0.6 },
        },
      ],
    },
    {
      // R2 - Another resistor - also has weak VCC connection
      componentId: "R2",
      pads: [
        {
          padId: "R2.1",
          networkId: "VCC",
          type: "rect",
          offset: { x: -0.5, y: 0 },
          size: { x: 0.6, y: 0.6 },
        },
        {
          padId: "R2.2",
          networkId: "SIG2",
          type: "rect",
          offset: { x: 0.5, y: 0 },
          size: { x: 0.6, y: 0.6 },
        },
      ],
    },
  ],

  // Strong connections: Only C1 should be optimized to be close to U1
  // R1 and R2 share the VCC network but are NOT in weightedConnections,
  // so they have WEAK connections that will be shown as dashed lines
  // and will NOT influence placement optimization
  weightedConnections: [
    {
      padIds: ["U1.VCC", "C1.1"], // Strong: U1 VCC <-> C1 pin 1
      weight: 1,
    },
    {
      padIds: ["U1.GND", "C1.2"], // Strong: U1 GND <-> C1 pin 2
      weight: 1,
    },
    // Note: R1.1 and R2.1 share VCC network with U1.VCC and C1.1
    // but are NOT listed here, so they are WEAK connections
  ],

  minGap: 1,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "minimum_sum_squared_distance_to_network",
}

export default () => {
  return (
    <PackDebugger
      initialPackInput={packInput}
      title="Weak Connections Demo - Dashed lines = weak (ignored in placement)"
    />
  )
}
