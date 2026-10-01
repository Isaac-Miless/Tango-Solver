import { describe, it, expect } from 'vitest'
import { validateMove, checkWin } from './gameLogic'

function emptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null))
}

const noConstraints = { equals: [], notEquals: [] }

describe('validateMove', () => {
  it('allows a move that keeps row/column balance and has no 3-in-a-row', () => {
    const grid = emptyGrid(4)
    grid[0][0] = 'sun'
    expect(validateMove(grid, noConstraints, 0, 0)).toBe(true)
  })

  it('rejects a move that creates three consecutive identical symbols', () => {
    const grid = emptyGrid(4)
    grid[0] = ['sun', 'sun', 'sun', null]
    expect(validateMove(grid, noConstraints, 0, 2)).toBe(false)
  })

  it('rejects a move that breaks an equals constraint', () => {
    const grid = emptyGrid(4)
    grid[0][0] = 'sun'
    grid[1][1] = 'moon'
    const constraints = { equals: [[0, 0, 1, 1]], notEquals: [] }
    expect(validateMove(grid, constraints, 1, 1)).toBe(false)
  })
})

describe('checkWin', () => {
  it('returns false while the grid still has empty cells', () => {
    const grid = emptyGrid(4)
    grid[0] = ['sun', 'moon', null, null]
    expect(checkWin(grid, noConstraints, 4)).toBe(false)
  })

  it('returns true for a fully filled, balanced, valid grid', () => {
    // A hand-verified complete valid 4x4 Tango solution:
    // row/col suns == moons, no 3-in-a-row anywhere.
    const grid = [
      ['sun', 'sun', 'moon', 'moon'],
      ['moon', 'moon', 'sun', 'sun'],
      ['sun', 'moon', 'sun', 'moon'],
      ['moon', 'sun', 'moon', 'sun'],
    ]
    expect(checkWin(grid, noConstraints, 4)).toBe(true)
  })

  it('returns false when a row has an unequal split of symbols', () => {
    const grid = [
      ['sun', 'sun', 'sun', 'moon'],
      ['moon', 'moon', 'sun', 'sun'],
      ['sun', 'moon', 'sun', 'moon'],
      ['moon', 'sun', 'moon', 'moon'],
    ]
    expect(checkWin(grid, noConstraints, 4)).toBe(false)
  })

  it('returns false when a complete, otherwise-valid grid violates an equals constraint', () => {
    // Regression: checkWin used to only check fill/balance/no-3-in-a-row and
    // never looked at constraints at all, so a complete grid that broke a
    // visible "=" or "x" clue was still reported as a win. Caught by
    // adversarial review of Unlimited mode (plans/0006), which showed this
    // was reachable in practice: 40/40 generated puzzles had at least one
    // complete grid that matched the starting clues, broke a constraint, and
    // still passed the old checkWin.
    const grid = [
      ['sun', 'sun', 'moon', 'moon'],
      ['moon', 'moon', 'sun', 'sun'],
      ['sun', 'moon', 'sun', 'moon'],
      ['moon', 'sun', 'moon', 'sun'],
    ]
    // (0,0)='sun' and (0,1)='sun' already agree, so this constraint is
    // trivially satisfied — use a pair that's actually equal in the grid
    // but constrained to be different instead, to force a real violation.
    const constraints = { equals: [], notEquals: [[0, 0, 0, 1]] }
    expect(checkWin(grid, constraints, 4)).toBe(false)
  })

  it('returns false when a complete, otherwise-valid grid violates a not-equals constraint', () => {
    const grid = [
      ['sun', 'sun', 'moon', 'moon'],
      ['moon', 'moon', 'sun', 'sun'],
      ['sun', 'moon', 'sun', 'moon'],
      ['moon', 'sun', 'moon', 'sun'],
    ]
    // (0,0)='sun' and (1,0)='moon' are already different, so constrain them
    // to be equal instead, to force a real violation.
    const constraints = { equals: [[0, 0, 1, 0]], notEquals: [] }
    expect(checkWin(grid, constraints, 4)).toBe(false)
  })

  it('returns true when a complete grid satisfies all given constraints', () => {
    const grid = [
      ['sun', 'sun', 'moon', 'moon'],
      ['moon', 'moon', 'sun', 'sun'],
      ['sun', 'moon', 'sun', 'moon'],
      ['moon', 'sun', 'moon', 'sun'],
    ]
    const constraints = {
      equals: [[0, 0, 0, 1]], // both 'sun' — satisfied
      notEquals: [[0, 0, 1, 0]], // 'sun' vs 'moon' — satisfied
    }
    expect(checkWin(grid, constraints, 4)).toBe(true)
  })
})
