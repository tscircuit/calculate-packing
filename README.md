# calculate-packing

**calculate-packing** is a small TypeScript library that ships the placement /
packing algorithm used by the [tscircuit tool-chain](https://github.com/tscircuit/tscircuit) for automatically laying out PCB components.

[Paste PackInput and Debug Online](https://calculate-packing.tscircuit.com/?fixture=%7B%22path%22%3A%22site%2Fpack%2Fpack-debugger-from-input.page.tsx%22%7D)

The solver turns a user-supplied `PackInput` (components, pads & strategy
settings) into a collision-free `PackOutput` while

- honouring a configurable clearance (`minGap`)
- keeping pads that share the same `networkId` close together
- minimising overall trace length

Internally the algorithm:

1. sorts components (largest → smallest)
2. keeps an outline (union of inflated component AABBs) of the already packed
   island(s)
3. probes outline segments for the point with the shortest distance to any pad
   on the same network
4. evaluates the four orthogonal rotations of the candidate component and
   chooses the cheapest non-overlapping one

<img width="4652" height="3508" alt="image" src="https://github.com/user-attachments/assets/a1c7f129-6e87-42d2-aa3e-3a0f39719469" />


## Installation

```bash
bun add calculate-packing      # or npm i / yarn add
```

## Quick start

```ts
import { pack, PackInput } from "calculate-packing"

const input: PackInput = {
  components: [
    {
      componentId: "C1",
      pads: [
        {
          padId: "C1_1",
          networkId: "GND",
          type: "rect",
          offset: { x: -0.6, y: 0 },
          size: { x: 1.2, y: 1 },
        },
        {
          padId: "C1_2",
          networkId: "VCC",
          type: "rect",
          offset: { x: +0.6, y: 0 },
          size: { x: 1.2, y: 1 },
        },
      ],
    },
    /* …more components… */
  ],
  minGap: 0.25,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "shortest_connection_along_outline",
}

const result = pack(input)
console.log(result.components) // → positioned & rotated components
```

See `tests/` for more elaborate examples (SVG snapshots, circuit-json fixtures).

### Restricting packing directions

Use `disabledPackDirections` to skip outline sides facing a particular direction:

```ts
const result = pack({ ...input, disabledPackDirections: ["up"] })

// To permit only right-facing outline sides:
const rightward = pack({
  ...input,
  disabledPackDirections: ["left", "up", "down"],
})
```

Directions use world coordinates: `right` is +x, `left` is -x, `up` is +y,
and `down` is -y. Each outline segment is filtered by its normal toward free
space, including obstacle outlines and pockets between components. A diagonal
side is skipped when its normal points partly in any disabled direction.
The packed extents also stay within the current component/obstacle envelope
on disabled sides, preventing later placements from drifting past those edges.
With direction restrictions enabled, use `bounds` to set additional absolute limits on the placed component extents,
including the initial dynamic seed. A seed outside these limits is moved inside
them using its rotated pad and courtyard extents; other allowed rotations can
be tried when needed. Static components retain their supplied positions.

Omitting the option, or passing `[]`, keeps the default behavior. The first
unobstructed component still seeds the layout at the usual initial position;
subsequent outline placements follow the restriction. Obstacle fallback
placement also follows it. If a restricted solve has no valid placement,
`pack()` throws the solver error instead of returning an incomplete layout.
For step-by-step solving, inspect `PackSolver2.failed` and `PackSolver2.error`.

![Rightward packing](tests/__snapshots__/disabled-pack-directions-rightward.snap.svg)

## Development

```bash
bun install       # install deps
bun test          # run unit & SVG snapshot tests
bunx tsc --noEmit # type-check
```

### Repo layout

• `lib/PackSolver` – high-level packing solver  
• `lib/geometry` – computational-geometry helpers  
• `lib/math` – low-level math utilities  
• `tests/` – unit & snapshot tests

## Public API

| export                             | purpose                                   |
| ---------------------------------- | ----------------------------------------- |
| `pack()`                           | run the solver                            |
| `convertPackOutputToPackInput()`   | strip solver-only fields                  |
| `convertCircuitJsonToPackOutput()` | circuit-json → PackOutput helper          |
| `getGraphicsFromPackOutput()`      | build a `graphics-debug` scene for review |

Everything else is internal and may change without notice.

## License

MIT – see [LICENSE](./LICENSE).
