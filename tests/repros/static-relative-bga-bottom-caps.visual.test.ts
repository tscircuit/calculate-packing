import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { runTscircuitCode } from "tscircuit"
import { getComponentBounds } from "../../lib/geometry/getComponentBounds"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import { convertCircuitJsonToPackOutput } from "../../lib/plumbing/convertCircuitJsonToPackOutput"
import { convertPackOutputToPackInput } from "../../lib/plumbing/convertPackOutputToPackInput"
import type { PackedComponent } from "../../lib/types"

const svgNumber = (value: number) => Number(value.toFixed(3)).toString()

const renderPackingComparison = ({
  beforeComponents,
  afterComponents,
  fixedBgaId,
}: {
  beforeComponents: PackedComponent[]
  afterComponents: PackedComponent[]
  fixedBgaId: string
}) => {
  const overviewWorld = { minX: -2, maxX: 11, minY: -2, maxY: 6 }
  const panelY = 75

  const renderPanel = ({
    panelX,
    title,
    subtitle,
    components,
    showCrossSection,
  }: {
    panelX: number
    title: string
    subtitle: string
    components: PackedComponent[]
    showCrossSection: boolean
  }) => {
    const world = showCrossSection
      ? { minX: 5.5, maxX: 10.5, minY: 0.5, maxY: 5.5 }
      : overviewWorld
    const scale = showCrossSection ? 64 : 40
    const plotOffsetX = showCrossSection ? 120 : 20
    const plotWidth = (world.maxX - world.minX) * scale
    const plotHeight = (world.maxY - world.minY) * scale
    const toX = (x: number) => panelX + plotOffsetX + (x - world.minX) * scale
    const toY = (y: number) => panelY + 85 + (world.maxY - y) * scale
    const bga = components.find(
      (component) => component.componentId === fixedBgaId,
    )!
    const capacitors = components.filter(
      (component) => component.componentId !== fixedBgaId,
    )
    const bgaBounds = getComponentBounds(bga)

    const gridLines: string[] = []
    for (let x = Math.ceil(world.minX); x <= Math.floor(world.maxX); x++) {
      gridLines.push(
        `<line x1="${toX(x)}" y1="${toY(world.maxY)}" x2="${toX(x)}" y2="${toY(world.minY)}" stroke="#e2e8f0" stroke-width="1"/>`,
      )
    }
    for (let y = Math.ceil(world.minY); y <= Math.floor(world.maxY); y++) {
      gridLines.push(
        `<line x1="${toX(world.minX)}" y1="${toY(y)}" x2="${toX(world.maxX)}" y2="${toY(y)}" stroke="#e2e8f0" stroke-width="1"/>`,
      )
    }

    const connectionLines = showCrossSection
      ? []
      : capacitors.flatMap((capacitor) =>
          capacitor.pads.flatMap((capacitorPad) => {
            const bgaPad = bga.pads.find(
              (pad) => pad.networkId === capacitorPad.networkId,
            )
            if (!bgaPad) return []
            return [
              `<line x1="${svgNumber(toX(capacitorPad.absoluteCenter.x))}" y1="${svgNumber(toY(capacitorPad.absoluteCenter.y))}" x2="${svgNumber(toX(bgaPad.absoluteCenter.x))}" y2="${svgNumber(toY(bgaPad.absoluteCenter.y))}" stroke="#7c3aed" stroke-width="2" stroke-dasharray="6 4" opacity="0.75"/>`,
            ]
          }),
        )

    const renderComponent = (
      component: PackedComponent,
      label: string,
      isBga: boolean,
      componentIndex = 0,
    ) => {
      const bounds = getComponentBounds(component)
      const x = toX(bounds.minX)
      const y = toY(bounds.maxY)
      const width = (bounds.maxX - bounds.minX) * scale
      const height = (bounds.maxY - bounds.minY) * scale
      const bodyFill = isBga ? "#fecaca" : "#bfdbfe"
      const stroke = isBga ? "#dc2626" : "#2563eb"
      const padFill = isBga ? "#ef4444" : "#1d4ed8"
      const labelGraphics = !label
        ? ""
        : isBga
          ? `<text x="${svgNumber(x + width / 2)}" y="${svgNumber(y - 9)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="${stroke}" paint-order="stroke" stroke="#ffffff" stroke-width="5">${label}</text>`
          : showCrossSection && componentIndex === 0
            ? `
              <line x1="${svgNumber(x - 5)}" y1="${svgNumber(y + height / 2)}" x2="${svgNumber(x + width / 2)}" y2="${svgNumber(y + height / 2)}" stroke="${stroke}" stroke-width="2"/>
              <text x="${svgNumber(x - 10)}" y="${svgNumber(y + height / 2 + 5)}" text-anchor="end" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="${stroke}" paint-order="stroke" stroke="#ffffff" stroke-width="5">${label}</text>
            `
            : showCrossSection
              ? `
                <line x1="${svgNumber(x + width / 2)}" y1="${svgNumber(y + height / 2)}" x2="${svgNumber(x + width + 5)}" y2="${svgNumber(y + height / 2)}" stroke="${stroke}" stroke-width="2"/>
                <text x="${svgNumber(x + width + 10)}" y="${svgNumber(y + height / 2 + 5)}" text-anchor="start" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="${stroke}" paint-order="stroke" stroke="#ffffff" stroke-width="5">${label}</text>
              `
              : `<text x="${svgNumber(x + width / 2)}" y="${svgNumber(y - 9)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="${stroke}" paint-order="stroke" stroke="#ffffff" stroke-width="5">${label}</text>`

      return `
        <g data-component-id="${component.componentId}" data-pcb-layer="${isBga ? "top" : "bottom"}">
          <rect x="${svgNumber(x)}" y="${svgNumber(y)}" width="${svgNumber(width)}" height="${svgNumber(height)}" rx="4" fill="${bodyFill}" fill-opacity="${isBga ? "0.58" : "0.82"}" stroke="${stroke}" stroke-width="3" ${isBga ? "" : 'stroke-dasharray="7 4"'}/>
          ${component.pads
            .map(
              (pad) => `
                <rect x="${svgNumber(toX(pad.absoluteCenter.x) - (pad.size.x * scale) / 2)}" y="${svgNumber(toY(pad.absoluteCenter.y) - (pad.size.y * scale) / 2)}" width="${svgNumber(pad.size.x * scale)}" height="${svgNumber(pad.size.y * scale)}" rx="2" fill="${padFill}" fill-opacity="${isBga ? "0.82" : "0.95"}"/>
              `,
            )
            .join("")}
          ${labelGraphics}
        </g>
      `
    }

    const componentGraphics = [
      renderComponent(bga, "U1 · TOP BGA", true),
      ...capacitors.map((capacitor, index) =>
        renderComponent(
          capacitor,
          showCrossSection
            ? `C${index + 1} · BOTTOM`
            : index === 0
              ? "C1 + C2 · BOTTOM"
              : "",
          false,
          index,
        ),
      ),
    ].join("")

    const overlapAnnotation = showCrossSection
      ? `
        <rect x="${svgNumber(toX(bgaBounds.minX) - 10)}" y="${svgNumber(toY(bgaBounds.maxY) - 30)}" width="${svgNumber((bgaBounds.maxX - bgaBounds.minX) * scale + 20)}" height="${svgNumber((bgaBounds.maxY - bgaBounds.minY) * scale + 54)}" rx="8" fill="none" stroke="#7c3aed" stroke-width="3" stroke-dasharray="9 5"/>
        <text x="${svgNumber(toX((bgaBounds.minX + bgaBounds.maxX) / 2))}" y="${svgNumber(toY(bgaBounds.minY) + 39)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#6d28d9">SAME X/Y · OPPOSITE PCB FACES</text>
      `
      : ""

    const footer = showCrossSection
      ? `
        <g aria-label="cross-section">
          <text x="${panelX + 280}" y="525" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#334155">SIDE CROSS-SECTION</text>
          <line x1="${panelX + 145}" y1="582" x2="${panelX + 415}" y2="582" stroke="#64748b" stroke-width="9"/>
          <text x="${panelX + 430}" y="587" font-family="Arial, sans-serif" font-size="12" fill="#475569">PCB</text>
          <rect x="${panelX + 205}" y="542" width="150" height="28" rx="5" fill="#fecaca" stroke="#dc2626" stroke-width="3"/>
          <text x="${panelX + 280}" y="561" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#991b1b">U1 · TOP</text>
          <rect x="${panelX + 220}" y="594" width="55" height="22" rx="4" fill="#bfdbfe" stroke="#2563eb" stroke-width="3"/>
          <rect x="${panelX + 285}" y="594" width="55" height="22" rx="4" fill="#bfdbfe" stroke="#2563eb" stroke-width="3"/>
          <line x1="${panelX + 247.5}" y1="536" x2="${panelX + 247.5}" y2="622" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="4 4"/>
          <line x1="${panelX + 312.5}" y1="536" x2="${panelX + 312.5}" y2="622" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="4 4"/>
          <text x="${panelX + 280}" y="642" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#1d4ed8">SAME X/Y, OPPOSITE FACES · C1 + C2 UNDER U1</text>
        </g>
      `
      : `
        <g>
          <text x="${panelX + 280}" y="548" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#475569">C1 and C2 start away from fixed U1</text>
          <text x="${panelX + 280}" y="578" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Long purple ratsnests show the unresolved placement</text>
        </g>
      `

    return `
      <g data-panel="${showCrossSection ? "after" : "before"}">
        <rect x="${panelX}" y="${panelY}" width="560" height="595" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
        <text x="${panelX + 280}" y="${panelY + 34}" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#0f172a">${title}</text>
        <text x="${panelX + 280}" y="${panelY + 58}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#475569">${subtitle}</text>
        <rect x="${toX(world.minX)}" y="${toY(world.maxY)}" width="${plotWidth}" height="${plotHeight}" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
        ${gridLines.join("")}
        ${connectionLines.join("")}
        ${componentGraphics}
        ${overlapAnnotation}
        ${footer}
      </g>
    `
  }

  return `
    <svg width="1200" height="700" viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="700" fill="#eef2f7"/>
      <text x="600" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#0f172a">BOTTOM-SIDE DECOUPLING PLACEMENT · TOP VIEW OVERLAYS BOTH SIDES</text>
      <g aria-label="legend">
        <rect x="410" y="44" width="18" height="12" fill="#fecaca" stroke="#dc2626" stroke-width="2"/>
        <text x="436" y="55" font-family="Arial, sans-serif" font-size="13" fill="#991b1b">TOP BGA</text>
        <rect x="540" y="44" width="18" height="12" fill="#bfdbfe" stroke="#2563eb" stroke-width="2" stroke-dasharray="4 2"/>
        <text x="566" y="55" font-family="Arial, sans-serif" font-size="13" fill="#1d4ed8">BOTTOM CAPACITORS</text>
      </g>
      ${renderPanel({
        panelX: 20,
        title: "BEFORE PACKING",
        subtitle: "Fixed top BGA and unplaced bottom capacitors",
        components: beforeComponents,
        showCrossSection: false,
      })}
      ${renderPanel({
        panelX: 620,
        title: "AFTER PACKING · UNDER U1",
        subtitle: "Magnified top view: blue bottom parts share U1's X/Y",
        components: afterComponents,
        showCrossSection: true,
      })}
    </svg>
  `
    .replaceAll(/[ \t]+$/gm, "")
    .trim()
}

/**
 * Reproduces the input shape used by core's layer-by-layer pcbPack adapter:
 * a top-side BGA has an authored position while bottom-side decoupling
 * capacitors remain movable. The adapter lists the BGA as static during the
 * bottom-layer solve so its pads guide network scoring without turning its
 * entire footprint into a rectangular keepout.
 */
test("static relative BGA guides bottom-side capacitor placement", async () => {
  const circuitJson = await runTscircuitCode(`
    export default () => (
      <board routingDisabled>
        <chip name="U1" footprint="bga16" pcbX={8} pcbY={3} />
        <capacitor
          name="C1"
          footprint="0402"
          capacitance="100nF"
          layer="bottom"
        />
        <capacitor
          name="C2"
          footprint="0402"
          capacitance="100nF"
          layer="bottom"
        />
        <trace from=".U1 > .pin6" to=".C1 > .pin1" />
        <trace from=".U1 > .pin7" to=".C1 > .pin2" />
        <trace from=".U1 > .pin10" to=".C2 > .pin1" />
        <trace from=".U1 > .pin11" to=".C2 > .pin2" />
      </board>
    )
  `)

  const fixedBga = circuitJson.find(
    (element) => element.type === "pcb_component",
  )
  if (fixedBga?.type !== "pcb_component") {
    throw new Error("Expected U1 to produce a pcb_component")
  }
  expect(fixedBga.layer).toBe("top")

  const capacitorComponentIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "pcb_component" &&
      element.pcb_component_id !== fixedBga.pcb_component_id
        ? [element.pcb_component_id]
        : [],
    ),
  )
  expect(capacitorComponentIds.size).toBe(2)
  const bgaPads = circuitJson.flatMap((element) =>
    element.type === "pcb_smtpad" &&
    element.pcb_component_id === fixedBga.pcb_component_id
      ? [element]
      : [],
  )
  const capacitorPads = circuitJson.flatMap((element) =>
    element.type === "pcb_smtpad" &&
    element.pcb_component_id !== undefined &&
    capacitorComponentIds.has(element.pcb_component_id)
      ? [element]
      : [],
  )
  expect(bgaPads.length).toBeGreaterThan(0)
  expect(bgaPads.every((pad) => pad.layer === "top")).toBe(true)
  expect(capacitorPads).toHaveLength(4)
  expect(capacitorPads.every((pad) => pad.layer === "bottom")).toBe(true)

  // Core assigns this mode to explicitly positioned PCB components.
  const circuitJsonWithPositionMode = circuitJson.map((element) =>
    element.type === "pcb_component" &&
    element.pcb_component_id === fixedBga.pcb_component_id
      ? { ...element, position_mode: "relative_to_group_anchor" as const }
      : element,
  )

  const convertedOutput = convertCircuitJsonToPackOutput(
    circuitJsonWithPositionMode as unknown as CircuitJson,
    {
      staticPcbComponentIds: [fixedBga.pcb_component_id],
    },
  )
  const bottomLayerPackInput = convertPackOutputToPackInput(convertedOutput)
  const minGap = 0.15
  const solver = new PackSolver2({
    ...bottomLayerPackInput,
    components: bottomLayerPackInput.components.map((component) =>
      component.componentId === fixedBga.pcb_component_id
        ? {
            ...component,
            // Core uses the fixed top-side BGA as a pad-bearing network
            // reference during the bottom-layer solve. Its physical footprint
            // does not block parts on the opposite copper side.
            courtyard: {
              offsetFromCenter: { x: 0, y: 0 },
              width: 1e-6,
              height: 1e-6,
            },
          }
        : component,
    ),
    minGap,
    packPlacementStrategy: "minimum_sum_squared_distance_to_network",
  })

  solver.solve()

  expect(solver.failed).toBe(false)
  const packedBga = solver.packedComponents.find(
    ({ componentId }) => componentId === fixedBga.pcb_component_id,
  )
  expect(packedBga).toMatchObject({
    isStatic: true,
    center: { x: 8, y: 3 },
  })

  const packedCapacitors = solver.packedComponents.filter(
    ({ componentId }) => componentId !== fixedBga.pcb_component_id,
  )
  expect(packedCapacitors).toHaveLength(2)
  const packedBgaBounds = getComponentBounds(packedBga!)
  for (const capacitor of packedCapacitors) {
    expect(
      Math.hypot(capacitor.center.x - 8, capacitor.center.y - 3),
    ).toBeLessThan(2.1)
    const capacitorBounds = getComponentBounds(capacitor)
    expect(capacitorBounds.minX).toBeGreaterThan(packedBgaBounds.minX)
    expect(capacitorBounds.maxX).toBeLessThan(packedBgaBounds.maxX)
    expect(capacitorBounds.minY).toBeGreaterThan(packedBgaBounds.minY)
    expect(capacitorBounds.maxY).toBeLessThan(packedBgaBounds.maxY)
  }

  const firstCapBounds = getComponentBounds(packedCapacitors[0]!)
  const secondCapBounds = getComponentBounds(packedCapacitors[1]!)
  const gapX = Math.max(
    firstCapBounds.minX - secondCapBounds.maxX,
    secondCapBounds.minX - firstCapBounds.maxX,
    0,
  )
  const gapY = Math.max(
    firstCapBounds.minY - secondCapBounds.maxY,
    secondCapBounds.minY - firstCapBounds.maxY,
    0,
  )
  expect(Math.hypot(gapX, gapY)).toBeGreaterThanOrEqual(minGap - 1e-6)

  const comparisonSvg = renderPackingComparison({
    beforeComponents: convertedOutput.components,
    afterComponents: solver.packedComponents,
    fixedBgaId: fixedBga.pcb_component_id,
  })
  const snapshotUrl = new URL(
    "./__snapshots__/static-relative-bga-bottom-caps.visual.snap.svg",
    import.meta.url,
  )
  if (process.env.BUN_UPDATE_SNAPSHOTS) {
    await Bun.write(snapshotUrl, `${comparisonSvg}\n`)
  }
  const snapshotSvg = await Bun.file(snapshotUrl).text()

  expect(comparisonSvg).toBe(snapshotSvg.trim())
})
