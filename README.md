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
