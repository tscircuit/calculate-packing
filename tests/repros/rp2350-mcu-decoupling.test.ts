import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { PackSolver2 } from "../../lib/PackSolver2/PackSolver2"
import { rp2350McuPackInput } from "./rp2350-mcu-decoupling/packInput"

// Real-world reproduction: the RP2350A MCU subsystem of the tscircuit "anchor"
// board (RP2350A + QSPI flash + two crystals + ~14 per-VDD decoupling caps +
// status LEDs + USB/I2C resistors). This is the exact PackInput PackSolver2
// receives. The per-VDD decoupling caps all share the V3_3_DIG/GND networkId,
// so the solver has no cap<->pin information and packs them as an
// interchangeable group rather than onto their pins. SVG snapshot tracks
// placement quality / regressions on a genuine board.
test("rp2350-mcu-decoupling - PackSolver2 on the anchor RP2350A MCU group", () => {
  const solver = new PackSolver2(rp2350McuPackInput)

  solver.solve()

  expect(solver.failed).toBe(false)

  expect(
    getSvgFromGraphicsObject(solver.visualize(), {
      backgroundColor: "white",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
