import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import circuitJson from "./circuit-json-pack-conversion01.json"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"

const withRelativePositionMode = (pcbComponentId: string): CircuitJson =>
  circuitJson.map((element) =>
    element.type === "pcb_component" &&
    element.pcb_component_id === pcbComponentId
      ? { ...element, position_mode: "relative_to_group_anchor" as const }
      : element,
  ) as CircuitJson

test("convertCircuitJsonToPackOutput marks specified pcb components as static", () => {
  const staticComponentId = "pcb_component_0"

  const packOutput = convertCircuitJsonToPackOutput(
    circuitJson as CircuitJson,
    {
      staticPcbComponentIds: [staticComponentId],
    },
  )

  const staticComponent = packOutput.components.find(
    (component) => component.componentId === staticComponentId,
  )
  expect(staticComponent?.isStatic).toBe(true)

  const dynamicComponent = packOutput.components.find(
    (component) => component.componentId !== staticComponentId,
  )
  expect(dynamicComponent?.isStatic ?? false).toBe(false)
})

test("a static relative component remains a pad-bearing component", () => {
  const staticComponentId = "pcb_component_0"
  const relativeCircuitJson = withRelativePositionMode(staticComponentId)
  const authoredComponent = relativeCircuitJson.find(
    (element) =>
      element.type === "pcb_component" &&
      element.pcb_component_id === staticComponentId,
  )
  if (!authoredComponent || authoredComponent.type !== "pcb_component") {
    throw new Error(`Expected ${staticComponentId} in the circuit fixture`)
  }

  const packOutput = convertCircuitJsonToPackOutput(relativeCircuitJson, {
    staticPcbComponentIds: [staticComponentId],
  })

  const staticComponent = packOutput.components.find(
    (component) => component.componentId === staticComponentId,
  )
  expect(staticComponent).toMatchObject({
    componentId: staticComponentId,
    isStatic: true,
  })
  expect(staticComponent?.center).toEqual(authoredComponent.center)
  expect(staticComponent?.pads.map(({ padId }) => padId)).toEqual([
    "pcb_smtpad_0",
    "pcb_smtpad_1",
  ])
  expect(
    packOutput.obstacles?.some(
      (obstacle) => obstacle.obstacleId === staticComponentId,
    ),
  ).toBe(false)
})

test("a static relative component contributes weighted connections", () => {
  const staticComponentId = "pcb_component_0"
  const relativeCircuitJson = withRelativePositionMode(staticComponentId)

  const packOutput = convertCircuitJsonToPackOutput(relativeCircuitJson, {
    staticPcbComponentIds: [staticComponentId],
  })

  expect(packOutput.weightedConnections).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        padIds: expect.arrayContaining(["pcb_smtpad_0"]),
      }),
      expect.objectContaining({
        padIds: expect.arrayContaining(["pcb_smtpad_1"]),
      }),
    ]),
  )
})

test("a relative component remains an obstacle unless explicitly static", () => {
  const relativeComponentId = "pcb_component_0"
  const relativeCircuitJson = withRelativePositionMode(relativeComponentId)

  const packOutput = convertCircuitJsonToPackOutput(relativeCircuitJson)

  expect(
    packOutput.components.some(
      (component) => component.componentId === relativeComponentId,
    ),
  ).toBe(false)
  expect(
    packOutput.obstacles?.some(
      (obstacle) => obstacle.obstacleId === relativeComponentId,
    ),
  ).toBe(true)
})

test("maximum trace lengths are preserved in packing connections", () => {
  const circuitJsonWithMaximumLengths = circuitJson.map((element) => {
    if (element.type !== "source_trace") return element
    if (
      element.source_trace_id !== "source_trace_0" &&
      element.source_trace_id !== "source_trace_6"
    ) {
      return element
    }
    return { ...element, max_length: 1 }
  }) as CircuitJson

  const packOutput = convertCircuitJsonToPackOutput(
    circuitJsonWithMaximumLengths,
  )
  const maximumDistanceConnections = packOutput.weightedConnections?.filter(
    (connection) => connection.maxDistance === 1,
  )

  expect(maximumDistanceConnections).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        padIds: expect.arrayContaining(["pcb_smtpad_4", "pcb_smtpad_11"]),
        maxDistance: 1,
      }),
      expect.objectContaining({
        padIds: expect.arrayContaining(["pcb_smtpad_10", "pcb_smtpad_0"]),
        maxDistance: 1,
      }),
    ]),
  )
})
