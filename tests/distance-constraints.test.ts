import { test, expect, describe } from "bun:test"
import { pack } from "../lib/pack"
import { PackSolver2 } from "../lib/PackSolver2/PackSolver2"
import type { PackInput } from "../lib/types"

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Minimal 1×1 pad factory */
function makePad(padId: string, networkId = "unconnected") {
  return {
    padId,
    type: "rect" as const,
    offset: { x: 0, y: 0 },
    size: { x: 1, y: 1 },
    networkId,
  }
}

/** Two-component base input used by most tests */
function baseTwoComponentInput(): PackInput {
  return {
    components: [
      { componentId: "A", pads: [makePad("A1")], availableRotationDegrees: [0] },
      { componentId: "B", pads: [makePad("B1")], availableRotationDegrees: [0] },
    ],
    minGap: 0.5,
    packOrderStrategy: "largest_to_smallest",
    packPlacementStrategy: "minimum_sum_distance_to_network",
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("distanceConstraints — fixed_x_distance_and_orientation", () => {
  test("no distanceConstraints: pack proceeds normally without error", () => {
    const solver = new PackSolver2(baseTwoComponentInput())
    solver.solve()
    expect(solver.solved).toBe(true)
    expect(solver.packedComponents).toHaveLength(2)
  })

  test("rightChipId placed after leftChipId: X snapped to leftX + distance", () => {
    const input: PackInput = {
      ...baseTwoComponentInput(),
      distanceConstraints: [
        {
          leftChipId: "A",
          rightChipId: "B",
          type: "fixed_x_distance_and_orientation",
          distance: 10,
        },
      ],
    }

    const output = pack(input)
    const a = output.components.find((c) => c.componentId === "A")!
    const b = output.components.find((c) => c.componentId === "B")!

    expect(a).toBeDefined()
    expect(b).toBeDefined()
    // B's X must equal A's X + 10 (to within floating-point tolerance)
    expect(b.center.x).toBeCloseTo(a.center.x + 10, 6)
  })

  test("constraint is exact: B.center.x === A.center.x + distance", () => {
    const distance = 7.5
    const input: PackInput = {
      ...baseTwoComponentInput(),
      distanceConstraints: [
        {
          leftChipId: "A",
          rightChipId: "B",
          type: "fixed_x_distance_and_orientation",
          distance,
        },
      ],
    }

    const output = pack(input)
    const a = output.components.find((c) => c.componentId === "A")!
    const b = output.components.find((c) => c.componentId === "B")!
    expect(b.center.x).toBeCloseTo(a.center.x + distance, 6)
  })

  test("pad absoluteCenter reflects snapped component center", () => {
    const input: PackInput = {
      ...baseTwoComponentInput(),
      distanceConstraints: [
        {
          leftChipId: "A",
          rightChipId: "B",
          type: "fixed_x_distance_and_orientation",
          distance: 5,
        },
      ],
    }

    const output = pack(input)
    const b = output.components.find((c) => c.componentId === "B")!
    const pad = b.pads[0]!
    // Pad offset is (0,0), so absoluteCenter == component center
    expect(pad.absoluteCenter.x).toBeCloseTo(b.center.x, 6)
    expect(pad.absoluteCenter.y).toBeCloseTo(b.center.y, 6)
  })

  test("Y coordinate of B is set by the packer, not by the constraint", () => {
    // The constraint only controls X; Y should be whatever the packer chose
    const input: PackInput = {
      ...baseTwoComponentInput(),
      distanceConstraints: [
        {
          leftChipId: "A",
          rightChipId: "B",
          type: "fixed_x_distance_and_orientation",
          distance: 10,
        },
      ],
    }

    const output = pack(input)
    const a = output.components.find((c) => c.componentId === "A")!
    const b = output.components.find((c) => c.componentId === "B")!

    // B's X is constrained; B's Y may differ from A's Y (packer may choose same or different)
    expect(b.center.x).toBeCloseTo(a.center.x + 10, 6)
    // Just ensure Y is a finite number (not NaN or Infinity)
    expect(Number.isFinite(b.center.y)).toBe(true)
  })

  test("multiple constraints on three components are all respected", () => {
    const input: PackInput = {
      components: [
        { componentId: "A", pads: [makePad("A1")], availableRotationDegrees: [0] },
        { componentId: "B", pads: [makePad("B1")], availableRotationDegrees: [0] },
        { componentId: "C", pads: [makePad("C1")], availableRotationDegrees: [0] },
      ],
      minGap: 0.5,
      packOrderStrategy: "largest_to_smallest",
      packPlacementStrategy: "minimum_sum_distance_to_network",
      distanceConstraints: [
        {
          leftChipId: "A",
          rightChipId: "B",
          type: "fixed_x_distance_and_orientation",
          distance: 10,
        },
        {
          leftChipId: "A",
          rightChipId: "C",
          type: "fixed_x_distance_and_orientation",
          distance: 20,
        },
      ],
    }

    const output = pack(input)
    const a = output.components.find((c) => c.componentId === "A")!
    const b = output.components.find((c) => c.componentId === "B")!
    const c = output.components.find((c) => c.componentId === "C")!

    expect(b.center.x).toBeCloseTo(a.center.x + 10, 6)
    expect(c.center.x).toBeCloseTo(a.center.x + 20, 6)
  })

  test("constraint with distance=0 places chips at the same X (stacked)", () => {
    const input: PackInput = {
      ...baseTwoComponentInput(),
      distanceConstraints: [
        {
          leftChipId: "A",
          rightChipId: "B",
          type: "fixed_x_distance_and_orientation",
          distance: 0,
        },
      ],
    }

    const output = pack(input)
    const a = output.components.find((c) => c.componentId === "A")!
    const b = output.components.find((c) => c.componentId === "B")!
    expect(b.center.x).toBeCloseTo(a.center.x, 6)
  })

  test("negative distance places rightChipId to the left of leftChipId", () => {
    const input: PackInput = {
      ...baseTwoComponentInput(),
      distanceConstraints: [
        {
          leftChipId: "A",
          rightChipId: "B",
          type: "fixed_x_distance_and_orientation",
          distance: -8,
        },
      ],
    }

    const output = pack(input)
    const a = output.components.find((c) => c.componentId === "A")!
    const b = output.components.find((c) => c.componentId === "B")!
    expect(b.center.x).toBeCloseTo(a.center.x - 8, 6)
  })

  test("solver output reports solved=true when constraints are present", () => {
    const solver = new PackSolver2({
      ...baseTwoComponentInput(),
      distanceConstraints: [
        {
          leftChipId: "A",
          rightChipId: "B",
          type: "fixed_x_distance_and_orientation",
          distance: 15,
        },
      ],
    })
    solver.solve()
    expect(solver.solved).toBe(true)
    expect(solver.failed).toBe(false)
  })
})
