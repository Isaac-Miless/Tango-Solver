import { describe, it, expect } from 'vitest'
import { validateStartingPosition } from './validator'

function emptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null))
}

const noConstraints = { equals: [], notEquals: [] }

describe('validateStartingPosition', () => {
  it('rejects a completely empty grid', () => {
    const grid = emptyGrid(6)
    const result = validateStartingPosition(grid, noConstraints, 6)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Grid cannot be completely empty')
  })

  it('accepts a valid partially-filled grid', () => {
    const grid = emptyGrid(6)
    grid[0] = ['sun', 'moon', null, null, null, null]
    const result = validateStartingPosition(grid, noConstraints, 6)
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('flags a row with too many of one symbol', () => {
    const grid = emptyGrid(6)
    grid[0] = ['sun', 'sun', 'sun', 'sun', null, null]
    const result = validateStartingPosition(grid, noConstraints, 6)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('too many suns'))).toBe(true)
  })

  it('flags 3+ consecutive identical symbols in a column', () => {
    const grid = emptyGrid(6)
    grid[0][0] = 'moon'
    grid[1][0] = 'moon'
    grid[2][0] = 'moon'
    const result = validateStartingPosition(grid, noConstraints, 6)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('consecutive'))).toBe(true)
  })

  it('flags a violated equals constraint', () => {
    const grid = emptyGrid(6)
    grid[0][0] = 'sun'
    grid[1][1] = 'moon'
    const constraints = { equals: [[0, 0, 1, 1]], notEquals: [] }
    const result = validateStartingPosition(grid, constraints, 6)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('must be equal'))).toBe(true)
  })

  it('flags a violated not-equals constraint', () => {
    const grid = emptyGrid(6)
    grid[0][0] = 'sun'
    grid[1][1] = 'sun'
    const constraints = { equals: [], notEquals: [[0, 0, 1, 1]] }
    const result = validateStartingPosition(grid, constraints, 6)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('must be different'))).toBe(true)
  })
})
