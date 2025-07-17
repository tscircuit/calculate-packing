import type { Point } from "@tscircuit/math-utils"

/** 2-D cross product (O→A × O→B). */
export const cross = (O: Point, A: Point, B: Point): number =>
  (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x)
