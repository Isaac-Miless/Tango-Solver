import { describe, it, expect } from 'vitest'
import { getNextStep, solvePuzzleStepByStep, isValidPartialSolution } from './solver'

function emptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null))
}

const noConstraints = { equals: [], notEquals: [] }

describe('No-Three Rule', () => {
  it('forces the cell after two adjacent equal cells to the opposite symbol', () => {
    const grid = emptyGrid(4)
    grid[0][0] = 'sun'
    grid[0][1] = 'sun'

    const step = getNextStep(grid, noConstraints, 4)

    expect(step.ruleName).toBe('No-Three Rule')
    expect(step.resultCell).toEqual([0, 2])
    expect(step.resultValue).toBe('moon')
  })
})

describe('Parity Rule', () => {
  it('fills remaining row cells with the opposite symbol once a row hits its max', () => {
    const grid = emptyGrid(4)
    grid[0] = ['sun', 'sun', 'moon', null]

    const step = getNextStep(grid, noConstraints, 4)

    expect(step.ruleName).toBe('Parity Rule')
    expect(step.resultCell).toEqual([0, 3])
    expect(step.resultValue).toBe('moon')
  })
})

describe('Constraint Propagation', () => {
  it('propagates a known value across an equals constraint', () => {
    const grid = emptyGrid(4)
    grid[0][0] = 'sun'
    const constraints = { equals: [[0, 0, 1, 1]], notEquals: [] }

    const step = getNextStep(grid, constraints, 4)

    expect(step.ruleName).toBe('Constraint Propagation (Equals)')
    expect(step.resultCell).toEqual([1, 1])
    expect(step.resultValue).toBe('sun')
  })

  it('propagates the opposite value across a not-equals constraint', () => {
    const grid = emptyGrid(4)
    grid[0][0] = 'sun'
    const constraints = { equals: [], notEquals: [[0, 0, 1, 1]] }

    const step = getNextStep(grid, constraints, 4)

    expect(step.ruleName).toBe('Constraint Propagation (Not Equals)')
    expect(step.resultCell).toEqual([1, 1])
    expect(step.resultValue).toBe('moon')
  })
})

describe('Gap Rule', () => {
  it('forces the middle of an X _ X pattern to the opposite symbol', () => {
    // size 6 so parity (max 3 per symbol) doesn't pre-empt this rule at 2 suns
    const grid = emptyGrid(6)
    grid[0] = ['sun', null, 'sun', null, null, null]

    const step = getNextStep(grid, noConstraints, 6)

    expect(step.ruleName).toBe('Gap Rule')
    expect(step.resultCell).toEqual([0, 1])
    expect(step.resultValue).toBe('moon')
  })
})

describe('Edge Case Rule', () => {
  it('forces a cell next to matching row ends to the opposite symbol', () => {
    // size 6 so parity (max 3 per symbol) doesn't pre-empt this rule at 2 suns
    const grid = emptyGrid(6)
    grid[0] = ['sun', null, null, null, null, 'sun']

    const step = getNextStep(grid, noConstraints, 6)

    expect(step.ruleName).toBe('Edge Case Rule')
    expect(step.resultCell).toEqual([0, 1])
    expect(step.resultValue).toBe('moon')
  })
})

describe('Two Equals at End Rule', () => {
  it('forces the far end to the opposite symbol when a row starts with two equal cells', () => {
    // grid[0][2] is pre-filled so the No-Three rule does not fire first
    const grid = emptyGrid(6)
    grid[0] = ['sun', 'sun', 'moon', null, null, null]

    const step = getNextStep(grid, noConstraints, 6)

    expect(step.ruleName).toBe('Two Equals at End Rule')
    expect(step.resultCell).toEqual([0, 5])
    expect(step.resultValue).toBe('moon')
  })
})

describe('Modifier Balance Rule', () => {
  it('does not treat an already-resolved notEquals pair as a guaranteed extra symbol', () => {
    // Regression for the bug found in plans/0002: column 0 already has 2 suns
    // (max allowed for size 6) and both cells of the col-0 notEquals pair are
    // already filled — they're already counted in that total, not a pending
    // future +1. Nothing about rows 3-5 is actually forced from this alone.
    const grid = emptyGrid(6)
    grid[0][0] = 'sun'
    grid[1][0] = 'moon'
    grid[2][0] = 'sun'
    const constraints = { equals: [], notEquals: [[0, 0, 1, 0]] }

    const step = getNextStep(grid, constraints, 6)

    expect(step).toBeNull()
  })

  it('still fires when the notEquals pair is genuinely still empty', () => {
    // Column 0 has 2 suns (rows 0, 3) and 1 moon (row 1) — one more sun is
    // needed to reach max (3). The still-empty notEquals pair at rows 4-5
    // guarantees exactly one more sun between them, which would put the
    // column at its cap, so the only other empty cell (row 2) must be moon.
    const grid = emptyGrid(6)
    grid[0][0] = 'sun'
    grid[1][0] = 'moon'
    grid[3][0] = 'sun'
    const constraints = { equals: [], notEquals: [[4, 0, 5, 0]] }

    const step = getNextStep(grid, constraints, 6)

    expect(step.ruleName).toBe('Modifier Balance Rule')
    expect(step.resultCell).toEqual([2, 0])
    expect(step.resultValue).toBe('moon')
  })
})

describe('Adjacent Equals Constraint Rule', () => {
  it('still fires when the equals-constrained pair is genuinely adjacent to the known cell', () => {
    const grid = emptyGrid(6)
    grid[1][5] = 'moon'
    const constraints = { equals: [[2, 5, 3, 5]], notEquals: [] }

    const step = getNextStep(grid, constraints, 6)

    expect(step.ruleName).toBe('Adjacent Equals Constraint Rule')
    expect(step.resultCell).toEqual([2, 5])
    expect(step.resultValue).toBe('sun')
  })

  it('does not fire when the equals-constrained pair is not adjacent to each other', () => {
    // Regression for this rule's own bug found in plans/0002: rows 1 and 3
    // are tied together, but they aren't adjacent to each other, so knowing
    // row 0 doesn't force either of them — row 1 could still legally match
    // row 0's value.
    const grid = emptyGrid(6)
    grid[0][0] = 'moon'
    const constraints = { equals: [[1, 0, 3, 0]], notEquals: [] }

    const step = getNextStep(grid, constraints, 6)

    expect(step).toBeNull()
  })

  it('no longer produces the removed End with Equals Constraint Rule\'s unsound fill', () => {
    // Regression for the deleted rule's counterexample from plans/0001: a
    // known cell at the very top of a column with an equals pair "near" the
    // bottom (rows 3-4) but not adjacent to the known cell or to row 0. The
    // old rule wrongly forced this pair to the opposite value; correctly,
    // nothing here is forced (sun at rows 3-4 is an equally legal
    // continuation of this partial column).
    const grid = emptyGrid(6)
    grid[0][0] = 'sun'
    const constraints = { equals: [[3, 0, 4, 0]], notEquals: [] }

    const step = getNextStep(grid, constraints, 6)

    expect(step).toBeNull()
  })
})

describe('solvePuzzleStepByStep', () => {
  it('returns no steps and does not throw on an already-empty grid', () => {
    const grid = emptyGrid(6)
    const steps = solvePuzzleStepByStep(grid, noConstraints, 6)
    expect(steps).toEqual([])
  })

  it('chains multiple rules across iterations without overwriting a filled cell', () => {
    // grid[0] = ['sun', 'sun', ...] forces two separate deductions in sequence:
    // No-Three Rule fills [0,2]='moon', then (with [0,2] now filled so No-Three
    // no longer applies) Two Equals at End Rule fills [0,5]='moon'.
    const grid = emptyGrid(6)
    grid[0] = ['sun', 'sun', null, null, null, null]

    const steps = solvePuzzleStepByStep(grid, noConstraints, 6)

    expect(steps.map(s => s.ruleName)).toEqual(['No-Three Rule', 'Two Equals at End Rule'])
    expect(steps[0].resultCell).toEqual([0, 2])
    expect(steps[1].resultCell).toEqual([0, 5])

    // Replaying every step onto a fresh grid should never hit an already-filled cell
    const replay = emptyGrid(6)
    replay[0] = ['sun', 'sun', null, null, null, null]
    for (const step of steps) {
      const [r, c] = step.resultCell
      expect(replay[r][c]).toBeNull()
      replay[r][c] = step.resultValue
    }
  })
})

describe('isValidPartialSolution', () => {
  it('accepts a partial grid within row/column limits with no violations', () => {
    const grid = emptyGrid(4)
    grid[0] = ['sun', 'moon', null, null]
    expect(isValidPartialSolution(grid, noConstraints, 4)).toBe(true)
  })

  it('rejects a row with more than the allowed count of one symbol', () => {
    const grid = emptyGrid(4)
    grid[0] = ['sun', 'sun', 'sun', null]
    expect(isValidPartialSolution(grid, noConstraints, 4)).toBe(false)
  })

  it('rejects three consecutive identical symbols', () => {
    const grid = emptyGrid(6)
    grid[0] = ['sun', 'sun', 'sun', null, null, null]
    expect(isValidPartialSolution(grid, noConstraints, 6)).toBe(false)
  })

  it('rejects a grid that violates an equals constraint', () => {
    const grid = emptyGrid(4)
    grid[0][0] = 'sun'
    grid[1][1] = 'moon'
    const constraints = { equals: [[0, 0, 1, 1]], notEquals: [] }
    expect(isValidPartialSolution(grid, constraints, 4)).toBe(false)
  })

  it('rejects a grid that violates a not-equals constraint', () => {
    const grid = emptyGrid(4)
    grid[0][0] = 'sun'
    grid[1][1] = 'sun'
    const constraints = { equals: [], notEquals: [[0, 0, 1, 1]] }
    expect(isValidPartialSolution(grid, constraints, 4)).toBe(false)
  })
})
