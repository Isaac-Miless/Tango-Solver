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
