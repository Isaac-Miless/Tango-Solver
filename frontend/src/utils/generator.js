/**
 * PUZZLE GENERATOR
 *
 * Builds a random, fully-filled, valid Tango solution, then strips away as
 * much of it as possible while the existing pure-deduction solver can still
 * fully resolve the remainder back to that solution with zero guessing.
 *
 * Randomized backtracking is used only to build the full solution grid —
 * that's constructing an answer, not pretending to be the deductive solver.
 * The minimization step that follows relies entirely on the real solver
 * (solvePuzzleStepByStep) to decide what's safe to remove.
 */

import { validateStartingPosition } from './validator'
import { solvePuzzleStepByStep } from './solver'
import { checkWin } from './gameLogic'
import { hasThreeInARow } from './gridLines'

const DEFAULT_SIZE = 6

/**
 * @param {number} size - grid size (must be even; the app always uses 6)
 * @returns {{ grid: Array<Array<string|null>>, constraints: Object, solution: Array<Array<string>> }}
 */
export function generatePuzzle(size = DEFAULT_SIZE) {
  if (!Number.isInteger(size) || size < 2 || size % 2 !== 0) {
    throw new Error(`generatePuzzle: size must be a positive even integer, got ${size}`)
  }

  const solution = generateSolutionGrid(size)
  const { grid, constraints } = minimizeToPuzzle(solution, size)
  return { grid, constraints, solution }
}

// ---- Stage 1: random full solution grid ----

function generateSolutionGrid(size) {
  const half = size / 2
  const candidateRows = buildValidRows(size, half)
  const grid = Array.from({ length: size }, () => Array(size).fill(null))

  if (!backtrackRows(grid, 0, size, half, candidateRows)) {
    // Valid full grids are known to exist for this game at every even size
    // this app uses; this guards against a logic error rather than an
    // expected runtime condition.
    throw new Error('Failed to generate a valid solution grid')
  }

  return grid
}

function backtrackRows(grid, row, size, half, candidateRows) {
  if (row === size) return true

  for (const candidate of shuffle(candidateRows)) {
    if (fitsColumns(grid, candidate, row, half)) {
      grid[row] = candidate.slice()
      if (backtrackRows(grid, row + 1, size, half, candidateRows)) return true
      grid[row] = Array(size).fill(null)
    }
  }

  return false
}

function buildValidRows(size, half) {
  const rows = []
  for (const sunPositions of combinations(size, half)) {
    const row = Array(size).fill('moon')
    sunPositions.forEach(p => { row[p] = 'sun' })
    if (!hasThreeInARow(row)) rows.push(row)
  }
  return rows
}

function combinations(n, k) {
  const result = []
  const combo = []
  function build(start) {
    if (combo.length === k) {
      result.push(combo.slice())
      return
    }
    for (let i = start; i < n; i++) {
      combo.push(i)
      build(i + 1)
      combo.pop()
    }
  }
  build(0)
  return result
}

function fitsColumns(grid, candidateRow, row, half) {
  for (let col = 0; col < candidateRow.length; col++) {
    const value = candidateRow[col]

    let count = 1
    for (let r = 0; r < row; r++) {
      if (grid[r][col] === value) count++
    }
    if (count > half) return false

    if (row >= 2 && grid[row - 1][col] === value && grid[row - 2][col] === value) {
      return false
    }
  }
  return true
}

// ---- Stage 2: minimize to a starting position, verified by the real solver ----

function minimizeToPuzzle(solution, size) {
  let grid = solution.map(row => row.slice())
  let constraints = {
    equals: buildAllEdges(solution, size, 'equals'),
    notEquals: buildAllEdges(solution, size, 'notEquals'),
  }

  const removableCells = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      removableCells.push({ kind: 'cell', row, col })
    }
  }
  const removableConstraints = [
    ...constraints.equals.map(edge => ({ kind: 'equals', edge })),
    ...constraints.notEquals.map(edge => ({ kind: 'notEquals', edge })),
  ]

  const removalOrder = shuffle([...removableCells, ...removableConstraints])

  for (const item of removalOrder) {
    const candidateGrid = item.kind === 'cell' ? withCellCleared(grid, item.row, item.col) : grid
    const candidateConstraints = item.kind === 'cell'
      ? constraints
      : withEdgeRemoved(constraints, item.kind, item.edge)

    if (isFullySolvable(candidateGrid, candidateConstraints, size, solution)) {
      grid = candidateGrid
      constraints = candidateConstraints
    }
  }

  return { grid, constraints }
}

function buildAllEdges(solution, size, kind) {
  const edges = []
  const matches = (a, b) => (kind === 'equals' ? a === b : a !== b)

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size - 1; col++) {
      if (matches(solution[row][col], solution[row][col + 1])) {
        edges.push([row, col, row, col + 1])
      }
    }
  }
  for (let row = 0; row < size - 1; row++) {
    for (let col = 0; col < size; col++) {
      if (matches(solution[row][col], solution[row + 1][col])) {
        edges.push([row, col, row + 1, col])
      }
    }
  }
  return edges
}

function withCellCleared(grid, row, col) {
  const next = grid.map(r => r.slice())
  next[row][col] = null
  return next
}

function withEdgeRemoved(constraints, kind, edge) {
  return {
    equals: kind === 'equals' ? constraints.equals.filter(e => e !== edge) : constraints.equals,
    notEquals: kind === 'notEquals' ? constraints.notEquals.filter(e => e !== edge) : constraints.notEquals,
  }
}

function isFullySolvable(grid, constraints, size, solution) {
  const validation = validateStartingPosition(grid, constraints, size)
  if (!validation.isValid) return false

  const steps = solvePuzzleStepByStep(grid, constraints, size)
  const result = grid.map(row => row.slice())
  steps.forEach(step => {
    result[step.resultCell[0]][step.resultCell[1]] = step.resultValue
  })

  if (!checkWin(result, constraints, size)) return false
  return gridsEqual(result, solution)
}

function gridsEqual(a, b) {
  return a.every((row, r) => row.every((value, c) => value === b[r][c]))
}

// ---- Shared helper ----

function shuffle(array) {
  const copy = array.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
