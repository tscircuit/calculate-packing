/**
 * A tiny uniform spatial grid hash used by the analytical packer's legalizer to
 * find near-neighbour components without computing all O(n^2) pairs.
 *
 * Cells are keyed by integer grid coordinates `"<cx>,<cy>"`. Each entry stores
 * an item index. The grid is rebuilt every sweep (cheap: a Map of small arrays)
 * because component positions change each iteration. The caller chooses
 * `cellSize` strictly greater than the interaction range so the 3x3 neighbour
 * query provably sees every overlapping pair.
 */
export class SpatialGridHash {
  private cellSize: number
  private cells: Map<string, number[]> = new Map()

  constructor(cellSize: number) {
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
   * including the cell containing (x, y). Order is deterministic.
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
