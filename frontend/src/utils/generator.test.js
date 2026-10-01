import { describe, it, expect } from 'vitest'
import { generatePuzzle } from './generator'
import { validateStartingPosition } from './validator'
import { solvePuzzleStepByStep } from './solver'
import { checkWin } from './gameLogic'

const SIZE = 6
// Generation is randomized — run it many times so a one-in-N bug can't hide
// behind a lucky single draw, rather than asserting one fixed output.
const ITERATIONS = 30

function countRevealed(grid) {
  return grid.reduce((sum, row) => sum + row.filter(v => v !== null).length, 0)
}

describe('generatePuzzle', () => {
  it('produces a starting position the deductive solver can fully resolve, every time', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const { grid, constraints, solution } = generatePuzzle(SIZE)

      // The solution itself must be a genuinely complete, valid grid.
      expect(checkWin(solution, SIZE)).toBe(true)

      // The starting position must be a valid, non-empty starting grid.
      const validation = validateStartingPosition(grid, constraints, SIZE)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toEqual([])

      // The real solver, with no guessing, must fully resolve it back to
      // the exact recorded solution.
      const steps = solvePuzzleStepByStep(grid, constraints, SIZE)
      const result = grid.map(row => row.slice())
      steps.forEach(step => {
        result[step.resultCell[0]][step.resultCell[1]] = step.resultValue
      })

      expect(checkWin(result, SIZE)).toBe(true)
      expect(result).toEqual(solution)
    }
  })

  it('strips away a meaningful amount of the full solution, not just one cell', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const { grid } = generatePuzzle(SIZE)
      const revealed = countRevealed(grid)

      // Minimization starts from a fully-revealed (36-cell) grid; a puzzle
      // that still reveals nearly everything would mean minimization barely
      // ran. Observed output reveals at most ~8 of 36 cells, so 15 leaves
      // comfortable margin without pinning an exact number (randomized).
      expect(revealed).toBeLessThan(15)
    }
  })

  it('produces different puzzles across calls', () => {
    const first = generatePuzzle(SIZE)
    const second = generatePuzzle(SIZE)

    // Vanishingly unlikely to collide by chance across both the random
    // solution grid and the random removal order; a collision here would
    // indicate shuffle() or the RNG usage is broken, not bad luck.
    expect(first.solution).not.toEqual(second.solution)
  })
})

describe('generatePuzzle - uniqueness', () => {
  // This suite's whole point is to catch a puzzle with more than one valid
  // completion — which would happen if a solver rule were unsound (filled a
  // cell that wasn't actually forced) without the test noticing, since the
  // other tests above only check that the solver's own output matches the
  // recorded solution, not that no *other* grid also fits the clues. So the
  // check here is deliberately an independent brute-force enumeration, not a
  // call into generator.js's own (unexported) row/column-building helpers —
  // reusing the implementation under test as its own oracle would hide
  // exactly the kind of bug this suite exists to catch.
  const ALL_FULL_GRIDS = enumerateAllValidFullGrids(SIZE)

  it('enumerated every valid full grid at this size (sanity check on the oracle itself)', () => {
    // Known count for a 6x6 Tango-style grid; if this ever changes, the
    // oracle below is broken, not the generator.
    expect(ALL_FULL_GRIDS.length).toBe(11222)
  })

  it('has exactly one full grid consistent with the starting clues and constraints', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const { grid, constraints, solution } = generatePuzzle(SIZE)

      const consistent = ALL_FULL_GRIDS.filter(candidate =>
        isConsistentWithPuzzle(candidate, grid, constraints, SIZE)
      )

      expect(consistent.length).toBe(1)
      expect(consistent[0]).toEqual(solution)
    }
  })
})

function enumerateAllValidFullGrids(size) {
  const half = size / 2
  const validRows = buildValidRowPatterns(size, half)
  const results = []
  const grid = Array.from({ length: size }, () => Array(size).fill(null))

  function backtrack(row) {
    if (row === size) {
      results.push(grid.map(r => r.slice()))
      return
    }
    for (const candidate of validRows) {
      if (fitsColumnsSoFar(grid, candidate, row, half)) {
        grid[row] = candidate
        backtrack(row + 1)
      }
    }
    grid[row] = null
  }

  backtrack(0)
  return results
}

function buildValidRowPatterns(size, half) {
  const rows = []
  const combo = []
  function build(start) {
    if (combo.length === half) {
      const row = Array(size).fill('moon')
      combo.forEach(p => { row[p] = 'sun' })
      if (!hasThreeInARow(row)) rows.push(row)
      return
    }
    for (let i = start; i < size; i++) {
      combo.push(i)
      build(i + 1)
      combo.pop()
    }
  }
  build(0)
  return rows
}

function hasThreeInARow(line) {
  for (let i = 0; i < line.length - 2; i++) {
    if (line[i] === line[i + 1] && line[i + 1] === line[i + 2]) return true
  }
  return false
}

function fitsColumnsSoFar(grid, candidateRow, row, half) {
  for (let col = 0; col < candidateRow.length; col++) {
    const value = candidateRow[col]
    let count = 1
    for (let r = 0; r < row; r++) {
      if (grid[r][col] === value) count++
    }
    if (count > half) return false
    if (row >= 2 && grid[row - 1][col] === value && grid[row - 2][col] === value) return false
  }
  return true
}

function isConsistentWithPuzzle(candidate, grid, constraints, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== null && candidate[r][c] !== grid[r][c]) return false
    }
  }
  for (const [r1, c1, r2, c2] of constraints.equals) {
    if (candidate[r1][c1] !== candidate[r2][c2]) return false
  }
  for (const [r1, c1, r2, c2] of constraints.notEquals) {
    if (candidate[r1][c1] === candidate[r2][c2]) return false
  }
  return true
}
