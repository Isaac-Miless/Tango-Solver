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
    expect(checkWin(grid, 4)).toBe(false)
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
    expect(checkWin(grid, 4)).toBe(true)
  })

  it('returns false when a row has an unequal split of symbols', () => {
    const grid = [
      ['sun', 'sun', 'sun', 'moon'],
      ['moon', 'moon', 'sun', 'sun'],
      ['sun', 'moon', 'sun', 'moon'],
      ['moon', 'sun', 'moon', 'moon'],
    ]
    expect(checkWin(grid, 4)).toBe(false)
  })
})
