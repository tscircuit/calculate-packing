import type { PackInput, PackOutput } from "../types"

/**
 * Strip all “output only” properties (those added by the pack() solver)
 * so the result can be fed back into pack() again or compared against an
 * original PackInput. Restore local pad dimensions from the rotated output.
 *
 * NOTE:
 * – PackInput.components is an array of **InputComponent**,
 *   while PackOutput.components is an array of **PackedComponent**.
 *   We therefore have to:
 *     • copy componentId
 *     • copy each pad but drop `absoluteCenter`
 *     • drop `center` and `ccwRotationOffset`
 *   Static components retain their placement and absolute pad centers.
 */
export const convertPackOutputToPackInput = (packed: PackOutput): PackInput => {
  const strippedComponents = packed.components.map((pc) => {
    const normalizedRotation = ((pc.ccwRotationOffset % 360) + 360) % 360
    const shouldSwapDimensions =
      normalizedRotation === 90 || normalizedRotation === 270
    const pads = pc.pads.map(({ absoluteCenter, ...pad }) => ({
      ...pad,
      // The solver rotates pad sizes into board coordinates. Offsets remain
      // local, so restore the matching local sizes before the next pack.
      size: shouldSwapDimensions
        ? { x: pad.size.y, y: pad.size.x }
        : { ...pad.size },
      ...(pc.isStatic ? { absoluteCenter } : {}),
    }))

    if (pc.isStatic) return { ...pc, pads }

    return {
      componentId: pc.componentId,
      availableRotationDegrees: pc.availableRotationDegrees,
      pads,
      courtyard: pc.courtyard,
    }
  })

  return {
    ...packed,
    components: strippedComponents,
  }
}
