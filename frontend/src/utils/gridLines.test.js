import { describe, it, expect } from 'vitest'
import { threeInARowIndices, hasThreeInARow, wouldExceedTwoConsecutive } from './gridLines'

describe('threeInARowIndices', () => {
  it('returns an empty array for a line with no runs', () => {
    expect(threeInARowIndices(['sun', 'moon', 'sun', 'moon'])).toEqual([])
  })

  it('finds a single run of exactly 3', () => {
    expect(threeInARowIndices(['sun', 'sun', 'sun', 'moon'])).toEqual([0])
  })

  it('finds a run at the end of the line', () => {
    expect(threeInARowIndices(['moon', 'sun', 'sun', 'sun'])).toEqual([1])
  })

  it('reports one index per overlapping window for a run of 4', () => {
    expect(threeInARowIndices(['sun', 'sun', 'sun', 'sun'])).toEqual([0, 1])
  })

  it('finds multiple separate runs', () => {
    expect(threeInARowIndices(['sun', 'sun', 'sun', 'moon', 'moon', 'moon'])).toEqual([0, 3])
  })

  it('does not treat null as a matching value', () => {
    expect(threeInARowIndices([null, null, null, 'sun'])).toEqual([])
  })

  it('does not match across a null gap', () => {
    expect(threeInARowIndices(['sun', 'sun', null, 'sun'])).toEqual([])
  })

  it('returns an empty array for lines shorter than 3', () => {
    expect(threeInARowIndices([])).toEqual([])
    expect(threeInARowIndices(['sun'])).toEqual([])
    expect(threeInARowIndices(['sun', 'sun'])).toEqual([])
  })
})

describe('hasThreeInARow', () => {
  it('is false when there is no run of 3', () => {
    expect(hasThreeInARow(['sun', 'sun', 'moon', 'moon', 'sun', 'moon'])).toBe(false)
  })

  it('is true when a run of 3 exists', () => {
    expect(hasThreeInARow(['moon', 'sun', 'sun', 'sun', 'moon', 'moon'])).toBe(true)
  })

  it('is true for a run of more than 3', () => {
    expect(hasThreeInARow(['sun', 'sun', 'sun', 'sun', 'moon', 'moon'])).toBe(true)
  })

  it('ignores nulls', () => {
    expect(hasThreeInARow([null, null, null])).toBe(false)
  })
})

describe('wouldExceedTwoConsecutive', () => {
  it('is false when the index is null', () => {
    expect(wouldExceedTwoConsecutive(['sun', null, 'sun'], 1)).toBe(false)
  })

  it('is false for a run of exactly 2 containing the index', () => {
    expect(wouldExceedTwoConsecutive(['sun', 'sun', null, null], 0)).toBe(false)
    expect(wouldExceedTwoConsecutive(['sun', 'sun', null, null], 1)).toBe(false)
  })

  it('is true when placing the index value creates a run of 3', () => {
    expect(wouldExceedTwoConsecutive(['sun', 'sun', 'sun', null], 2)).toBe(true)
    expect(wouldExceedTwoConsecutive(['sun', 'sun', 'sun', null], 0)).toBe(true)
    expect(wouldExceedTwoConsecutive(['sun', 'sun', 'sun', null], 1)).toBe(true)
  })

  it('is true for a run longer than 3 at any index within it', () => {
    expect(wouldExceedTwoConsecutive(['sun', 'sun', 'sun', 'sun'], 0)).toBe(true)
    expect(wouldExceedTwoConsecutive(['sun', 'sun', 'sun', 'sun'], 3)).toBe(true)
  })

  it('handles the first and last index of the line', () => {
    expect(wouldExceedTwoConsecutive(['sun', 'sun', 'sun'], 0)).toBe(true)
    expect(wouldExceedTwoConsecutive(['sun', 'sun', 'sun'], 2)).toBe(true)
    expect(wouldExceedTwoConsecutive(['moon', 'sun', 'sun'], 0)).toBe(false)
  })

  it('does not count across a differing value', () => {
    expect(wouldExceedTwoConsecutive(['sun', 'sun', 'moon', 'sun', 'sun'], 2)).toBe(false)
  })
})
