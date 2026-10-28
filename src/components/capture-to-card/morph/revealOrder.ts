/** Deterministic diagonal wave with slight per-cell variation (stable across renders). */
export function diagonalRevealOrder(cols: number, rows: number): number[] {
  const cells: { idx: number; key: number }[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col
      const jitter = ((idx * 7 + row * 3) % 5) * 0.035
      cells.push({ idx, key: row + col + jitter })
    }
  }
  cells.sort((a, b) => a.key - b.key || a.idx - b.idx)
  return cells.map((cell) => cell.idx)
}

export function windowProgress(global: number, start: number, end: number): number {
  if (global <= start) return 0
  if (global >= end) return 1
  return (global - start) / (end - start)
}
