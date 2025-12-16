/**
 * Validates that a puzzle starting position is valid before solving.
 * 
 * A valid starting position must:
 * - Not have more than half the grid size of any symbol in a row/column
 * - Not have 3+ consecutive identical symbols
 * - Not violate any constraint rules
 * - Have at least some cells filled (not completely empty)
 * 
 * @param {Array<Array<string|null>>} grid - The current grid state
 * @param {Object} constraints - Object with equals and notEquals arrays
 * @param {number} size - Grid size (e.g., 6)
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateStartingPosition(grid, constraints, size) {
  const errors = []
  const maxAllowed = Math.floor(size / 2)

  // Check if grid is completely empty
  const hasAnyFilled = grid.some(row => row.some(cell => cell !== null))
  if (!hasAnyFilled) {
    errors.push('Grid cannot be completely empty')
  }

  // Check each row
  for (let row = 0; row < size; row++) {
    const rowValues = grid[row].filter(v => v !== null)
    const sunsInRow = rowValues.filter(v => v === 'sun').length
    const moonsInRow = rowValues.filter(v => v === 'moon').length

    if (sunsInRow > maxAllowed) {
      errors.push(`Row ${row + 1} has too many suns (${sunsInRow} > ${maxAllowed})`)
    }
    if (moonsInRow > maxAllowed) {
      errors.push(`Row ${row + 1} has too many moons (${moonsInRow} > ${maxAllowed})`)
    }

    // Check for 3+ consecutive identical symbols in row
    for (let col = 0; col < size - 2; col++) {
      const val1 = grid[row][col]
      const val2 = grid[row][col + 1]
      const val3 = grid[row][col + 2]
      
      if (val1 !== null && val1 === val2 && val2 === val3) {
        errors.push(`Row ${row + 1} has 3+ consecutive ${val1 === 'sun' ? 'suns' : 'moons'} starting at column ${col + 1}`)
      }
    }
  }

  // Check each column
  for (let col = 0; col < size; col++) {
    const colValues = grid.map(r => r[col]).filter(v => v !== null)
    const sunsInCol = colValues.filter(v => v === 'sun').length
    const moonsInCol = colValues.filter(v => v === 'moon').length

    if (sunsInCol > maxAllowed) {
      errors.push(`Column ${col + 1} has too many suns (${sunsInCol} > ${maxAllowed})`)
    }
    if (moonsInCol > maxAllowed) {
      errors.push(`Column ${col + 1} has too many moons (${moonsInCol} > ${maxAllowed})`)
    }

    // Check for 3+ consecutive identical symbols in column
    for (let row = 0; row < size - 2; row++) {
      const val1 = grid[row][col]
      const val2 = grid[row + 1][col]
      const val3 = grid[row + 2][col]
      
      if (val1 !== null && val1 === val2 && val2 === val3) {
        errors.push(`Column ${col + 1} has 3+ consecutive ${val1 === 'sun' ? 'suns' : 'moons'} starting at row ${row + 1}`)
      }
    }
  }

  // Check equals constraints
  for (const [r1, c1, r2, c2] of constraints.equals) {
    const val1 = grid[r1][c1]
    const val2 = grid[r2][c2]
    
    if (val1 !== null && val2 !== null && val1 !== val2) {
      errors.push(`Constraint violation: Cells (${r1 + 1},${c1 + 1}) and (${r2 + 1},${c2 + 1}) must be equal but have different values`)
    }
  }

  // Check not-equals constraints
  for (const [r1, c1, r2, c2] of constraints.notEquals) {
    const val1 = grid[r1][c1]
    const val2 = grid[r2][c2]
    
    if (val1 !== null && val2 !== null && val1 === val2) {
      errors.push(`Constraint violation: Cells (${r1 + 1},${c1 + 1}) and (${r2 + 1},${c2 + 1}) must be different but have the same value`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

