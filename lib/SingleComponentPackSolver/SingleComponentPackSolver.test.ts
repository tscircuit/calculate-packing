import { test, expect } from "bun:test"
import { SingleComponentPackSolver } from "./SingleComponentPackSolver"
import type { InputComponent, PackedComponent } from "../types"

test("SingleComponentPackSolver can pack a single component", () => {
  const packedComponents: PackedComponent[] = [
    {
      componentId: "comp1",
      center: { x: 0, y: 0 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "pad1",
          type: "rect",
          offset: { x: 0, y: 0 },
          size: { x: 1, y: 1 },
          networkId: "net1",
          absoluteCenter: { x: 0, y: 0 },
        },
      ],
    },
  ]

  const componentToPack: InputComponent = {
    componentId: "comp2",
    pads: [
      {
        padId: "pad2",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 1, y: 1 },
        networkId: "net1", // Same network as existing component
      },
    ],
    availableRotationDegrees: [0, 90, 180, 270],
  }

  const solver = new SingleComponentPackSolver({
    componentToPack,
    packedComponents,
    packPlacementStrategy: "minimum_sum_distance_to_network",
    minGap: 0.1,
  })

  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)

  const result = solver.getResult()
  expect(result).toBeDefined()
  expect(result?.componentId).toBe("comp2")
  expect(result?.center).toBeDefined()
  expect(result?.pads).toHaveLength(1)
})

test("SingleComponentPackSolver handles disconnected components", () => {
  const packedComponents: PackedComponent[] = [
    {
      componentId: "comp1",
      center: { x: 0, y: 0 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "pad1",
          type: "rect",
          offset: { x: 0, y: 0 },
          size: { x: 1, y: 1 },
          networkId: "net1",
          absoluteCenter: { x: 0, y: 0 },
        },
      ],
    },
  ]

  const componentToPack: InputComponent = {
    componentId: "comp2",
    pads: [
      {
        padId: "pad2",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 1, y: 1 },
        networkId: "net2", // Different network - disconnected
      },
    ],
    availableRotationDegrees: [0],
  }

  const solver = new SingleComponentPackSolver({
    componentToPack,
    packedComponents,
    packPlacementStrategy: "minimum_sum_distance_to_network",
    minGap: 0.1,
  })

  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)

  const result = solver.getResult()
  expect(result).toBeDefined()
})

test("SingleComponentPackSolver visualization works", () => {
  // Use a case with existing packed components to test all phases
  const packedComponents: PackedComponent[] = [
    {
      componentId: "comp1",
      center: { x: 0, y: 0 },
      ccwRotationOffset: 0,
      pads: [
        {
          padId: "pad1",
          type: "rect",
          offset: { x: 0, y: 0 },
          size: { x: 1, y: 1 },
          networkId: "net1",
          absoluteCenter: { x: 0, y: 0 },
        },
      ],
    },
  ]

  const componentToPack: InputComponent = {
    componentId: "comp2",
    pads: [
      {
        padId: "pad2",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 1, y: 1 },
        networkId: "net1",
      },
    ],
    availableRotationDegrees: [0],
  }

  const solver = new SingleComponentPackSolver({
    componentToPack,
    packedComponents,
    packPlacementStrategy: "minimum_sum_distance_to_network",
    minGap: 0.1,
  })

  // Test visualization in each phase
  solver.setup()

  // Outline phase
  expect(solver.currentPhase).toBe("outline")
  const outlineViz = solver.visualize()
  expect(outlineViz).toBeDefined()
  expect(outlineViz.texts).toBeDefined()

  // Step through phases
  solver.step() // Should move to segment_candidate phase
  expect(solver.currentPhase).toBe("segment_candidate")

  const candidateViz = solver.visualize()
  expect(candidateViz).toBeDefined()

  // Finish solving
  solver.solve()
  expect(solver.solved).toBe(true)

  const finalViz = solver.visualize()
  expect(finalViz).toBeDefined()
})

test("SingleComponentPackSolver handles empty packed components", () => {
  const packedComponents: PackedComponent[] = []
  const componentToPack: InputComponent = {
    componentId: "comp1",
    pads: [
      {
        padId: "pad1",
        type: "rect",
        offset: { x: 0, y: 0 },
        size: { x: 1, y: 1 },
        networkId: "net1",
      },
    ],
    availableRotationDegrees: [0],
  }

  const solver = new SingleComponentPackSolver({
    componentToPack,
    packedComponents,
    packPlacementStrategy: "minimum_sum_distance_to_network",
    minGap: 0.1,
  })

  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)

  const result = solver.getResult()
  expect(result).toBeDefined()
  expect(result?.center).toEqual({ x: 0, y: 0 })
})
