// Validate a move according to Tango rules
export function validateMove(grid, constraints, row, col) {
  // Check row constraints: equal suns and moons
  const rowValues = grid[row].filter(v => v !== null)
  const sunsInRow = rowValues.filter(v => v === 'sun').length
  const moonsInRow = rowValues.filter(v => v === 'moon').length
  const maxInRow = Math.floor(grid[row].length / 2)

  if (sunsInRow > maxInRow || moonsInRow > maxInRow) {
    return false
  }

  // Check column constraints: equal suns and moons
  const colValues = grid.map(r => r[col]).filter(v => v !== null)
  const sunsInCol = colValues.filter(v => v === 'sun').length
  const moonsInCol = colValues.filter(v => v === 'moon').length
  const maxInCol = Math.floor(grid.length / 2)

  if (sunsInCol > maxInCol || moonsInCol > maxInCol) {
    return false
  }

  // Check consecutive symbols (no more than 2)
  if (hasThreeConsecutive(grid[row], col)) {
    return false
  }

  const colArray = grid.map(r => r[col])
  if (hasThreeConsecutive(colArray, row)) {
    return false
  }

  // Check equals constraints
  for (const [r1, c1, r2, c2] of constraints.equals) {
    const val1 = grid[r1][c1]
    const val2 = grid[r2][c2]
    if (val1 !== null && val2 !== null && val1 !== val2) {
      return false
    }
  }

  // Check not-equals constraints
  for (const [r1, c1, r2, c2] of constraints.notEquals) {
    const val1 = grid[r1][c1]
    const val2 = grid[r2][c2]
    if (val1 !== null && val2 !== null && val1 === val2) {
      return false
    }
  }

  return true
}

// Check if there are three consecutive identical values
function hasThreeConsecutive(arr, index) {
  const value = arr[index]
  if (value === null) return false

  // Check left/right or up/down
  let count = 1

  // Check before
  for (let i = index - 1; i >= 0 && arr[i] === value; i--) {
    count++
  }

  // Check after
  for (let i = index + 1; i < arr.length && arr[i] === value; i++) {
    count++
  }

  return count > 2
}

// Check if the puzzle is complete and correct
export function checkWin(grid, size) {
  // Check all cells are filled
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col] === null) {
        return false
      }
    }
  }

  // Check each row has equal suns and moons
  for (let row = 0; row < size; row++) {
    const suns = grid[row].filter(v => v === 'sun').length
    const moons = grid[row].filter(v => v === 'moon').length
    if (suns !== moons) {
      return false
    }
  }

  // Check each column has equal suns and moons
  for (let col = 0; col < size; col++) {
    const colValues = grid.map(r => r[col])
    const suns = colValues.filter(v => v === 'sun').length
    const moons = colValues.filter(v => v === 'moon').length
    if (suns !== moons) {
      return false
    }
  }

  // Check no three consecutive
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size - 2; col++) {
      if (grid[row][col] === grid[row][col + 1] &&
        grid[row][col] === grid[row][col + 2] &&
        grid[row][col] !== null) {
        return false
      }
    }
  }

  for (let col = 0; col < size; col++) {
    for (let row = 0; row < size - 2; row++) {
      if (grid[row][col] === grid[row + 1][col] &&
        grid[row][col] === grid[row + 2][col] &&
        grid[row][col] !== null) {
        return false
      }
    }
  }

  return true
}

