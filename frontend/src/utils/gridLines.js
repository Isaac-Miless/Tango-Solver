/**
 * Shared "three identical symbols in a row" checks for a single line (a grid
 * row, or a column extracted via `grid.map(r => r[col])`).
 */

/**
 * Returns the start indices of every run of 3 identical, non-null values in
 * `line`. A run of 4+ identical values produces one index per overlapping
 * window (e.g. [sun,sun,sun,sun] -> [0, 1]).
 */
export function threeInARowIndices(line) {
  const indices = []
  for (let i = 0; i <= line.length - 3; i++) {
    const value = line[i]
    if (value !== null && value === line[i + 1] && value === line[i + 2]) {
      indices.push(i)
    }
  }
  return indices
}

/**
 * Whether `line` contains any run of 3 identical, non-null values.
 */
export function hasThreeInARow(line) {
  return threeInARowIndices(line).length > 0
}

/**
 * Whether the value already placed at `line[index]` is part of a run of 3+
 * identical values, counting contiguous matches outward from `index` in
 * both directions. Used to check a single just-placed move rather than
 * scanning the whole line.
 */
export function wouldExceedTwoConsecutive(line, index) {
  const value = line[index]
  if (value === null) return false

  let count = 1

  for (let i = index - 1; i >= 0 && line[i] === value; i--) {
    count++
  }

  for (let i = index + 1; i < line.length && line[i] === value; i++) {
    count++
  }

  return count > 2
}
