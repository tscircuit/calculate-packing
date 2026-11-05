import type { PackInput, PackOutput } from "../types"

/**
 * Strip all “output only” properties (those added by the pack() solver)
 * so the result can be fed back into pack() again or compared against an
 * original PackInput.  Everything else must be preserved verbatim.
 *
 * NOTE:
 * – PackInput.components is an array of **InputComponent**,
 *   while PackOutput.components is an array of **PackedComponent**.
 *   We therefore have to:
 *     • copy componentId
 *     • copy each pad but drop `absoluteCenter`
 *     • drop `center` and `ccwRotationOffset`
 */
export const convertPackOutputToPackInput = (packed: PackOutput): PackInput => {
  const strippedComponents = packed.components.map((pc) => {
    const normalizedRotation = (((pc.ccwRotationOffset ?? 0) % 360) + 360) % 360
    const shouldUnswapDimensions =
      normalizedRotation === 90 || normalizedRotation === 270
    const unswapPadSize = <T extends { size: { x: number; y: number } }>(
      pad: T,
    ): T => ({
      ...pad,
      size: shouldUnswapDimensions
        ? { x: pad.size.y, y: pad.size.x }
        : { ...pad.size },
    })

    return {
      ...(pc.isStatic
        ? {
            ...pc,
            pads: pc.pads.map((pad) => unswapPadSize(pad)),
          }
        : {
            componentId: pc.componentId,
            availableRotationDegrees: pc.availableRotationDegrees, // Preserve rotation constraints
            pads: pc.pads.map(({ absoluteCenter: _ac, ...rest }) =>
              unswapPadSize(rest),
            ),
            courtyard: pc.courtyard,
          }),
    }
  })

  /* eslint-disable @typescript-eslint/consistent-type-assertions */
  return {
    ...packed,
    // overwrite the components field with strippedComponents
    components: strippedComponents,
  } as unknown as PackInput
}
