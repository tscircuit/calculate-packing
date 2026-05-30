/**
 * A tiny uniform spatial grid hash used by the force-directed packer to find
 * near-neighbour components for repulsion without computing all O(n^2) pairs.
 *
 * Cells are keyed by integer grid coordinates `"<cx>,<cy>"`. Each entry stores
 * an arbitrary item index. The grid is rebuilt every iteration (cheap: a Map of
 * small arrays) because component positions change each step.
 *
 * This is intentionally minimal (a spike). It does not handle items larger than
 * a single cell specially — the caller chooses `cellSize` close to the median
 * component size, and we look at the 3x3 block of neighbouring cells, which is
 * sufficient for the near-equal-sized components produced by the packer. Very
 * large components could therefore miss collisions with distant cells; this is
 * documented as a known limitation.
 */
export class SpatialGridHash {
  private cellSize: number
  private cells: Map<string, number[]> = new Map()

  constructor(cellSize: number) {
    // Guard against degenerate cell sizes which would explode the hash.
    this.cellSize = cellSize > 1e-6 ? cellSize : 1
  }

  private key(cx: number, cy: number): string {
    return `${cx},${cy}`
  }

  private cellCoord(v: number): number {
    return Math.floor(v / this.cellSize)
  }

  clear(): void {
    this.cells.clear()
  }

  /** Insert item `index` at world position (x, y). */
  insert(index: number, x: number, y: number): void {
    const cx = this.cellCoord(x)
    const cy = this.cellCoord(y)
    const k = this.key(cx, cy)
    const bucket = this.cells.get(k)
    if (bucket) {
      bucket.push(index)
    } else {
      this.cells.set(k, [index])
    }
  }

  /**
   * Returns indices of items in the 3x3 block of cells surrounding (x, y),
   * including the cell containing (x, y) itself. Order is deterministic
   * (iteration over a fixed dx/dy nested loop, buckets preserve insertion
   * order).
   */
  queryNeighbors(x: number, y: number): number[] {
    const cx = this.cellCoord(x)
    const cy = this.cellCoord(y)
    const result: number[] = []
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const bucket = this.cells.get(this.key(cx + dx, cy + dy))
        if (bucket) result.push(...bucket)
      }
    }
    return result
  }
}
