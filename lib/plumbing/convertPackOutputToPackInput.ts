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
  const strippedComponents = packed.components.map((pc) => ({
    componentId: pc.componentId,
    availableRotationDegrees: pc.availableRotationDegrees, // Preserve rotation constraints
    bodyBounds: pc.bodyBounds, // Preserve component body bounds for overlap detection
    pads: pc.pads.map(({ absoluteCenter: _ac, ...rest }) => rest),
  }))

  /* eslint-disable @typescript-eslint/consistent-type-assertions */
  return {
    ...packed,
    // overwrite the components field with strippedComponents
    components: strippedComponents,
  } as unknown as PackInput
}
