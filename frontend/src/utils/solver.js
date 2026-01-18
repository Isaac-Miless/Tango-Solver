/**
 * SOLVER IMPLEMENTATION
 * 
 * This file contains the logic to solve Tango puzzles step-by-step.
 * 
 * The solver implements multiple logical rules and provides explanations
 * for each move, allowing players to learn the solving process.
 */

/**
 * Represents a solving step with explanation
 */
export class SolvingStep {
  constructor(ruleName, explanation, affectedCells, resultCell, resultValue) {
    this.ruleName = ruleName
    this.explanation = explanation
    this.affectedCells = affectedCells // Array of [row, col] pairs
    this.resultCell = resultCell // [row, col]
    this.resultValue = resultValue // 'sun' or 'moon'
  }
}

/**
 * Main solving function that returns steps instead of final solution
 * @param {Array<Array<string|null>>} grid - Starting grid state
 * @param {Object} constraints - { equals: [[r1,c1,r2,c2], ...], notEquals: [[r1,c1,r2,c2], ...] }
 * @param {number} size - Grid size
 * @returns {Array<SolvingStep>} - Array of solving steps
 */
export function solvePuzzleStepByStep(grid, constraints, size) {
  const steps = []
  const gridCopy = grid.map(row => row.slice())
  const maxIterations = size * size * 2 // Prevent infinite loops
  let iterations = 0

  while (iterations < maxIterations) {
    let madeProgress = false

    // Apply all rules in order
    const step = applyAllRules(gridCopy, constraints, size)
    
    if (step) {
      steps.push(step)
      madeProgress = true
    }

    // Check if puzzle is complete
    if (isComplete(gridCopy, size)) {
      break
    }

    if (!madeProgress) {
      // No more forced moves - puzzle might be unsolvable or needs backtracking
      break
    }

    iterations++
  }

  return steps
}

/**
 * Get the next solving step (for step-by-step mode)
 * @param {Array<Array<string|null>>} grid - Current grid state
 * @param {Object} constraints - Constraints object
 * @param {number} size - Grid size
 * @returns {SolvingStep|null} - Next step or null if no more moves
 */
export function getNextStep(grid, constraints, size) {
  const gridCopy = grid.map(row => row.slice())
  return applyAllRules(gridCopy, constraints, size)
}

/**
 * Apply all solving rules and return the first step found
 */
function applyAllRules(grid, constraints, size) {
  // Rule 1: No-three rule (two equal adjacent cells)
  let step = applyNoThreeRule(grid, constraints, size)
  if (step) return step

  // Rule 2: Parity rule (row/column balance)
  step = applyParityRule(grid, constraints, size)
  if (step) return step

  // Rule 3: Constraint propagation (equals/notEquals)
  step = applyConstraintPropagation(grid, constraints, size)
  if (step) return step

  // Rule 4: Edge cases (ends of rows/columns)
  step = applyEdgeCases(grid, constraints, size)
  if (step) return step

  // Rule 5: Gap rule (X _ X pattern)
  step = applyGapRule(grid, constraints, size)
  if (step) return step

  // Rule 6: Two equals at end rule
  step = applyTwoEqualsAtEndRule(grid, constraints, size)
  if (step) return step

  // Rule 7: Second-to-last equals first rule
  step = applySecondToLastEqualsFirstRule(grid, constraints, size)
  if (step) return step

  // Rule 8: Modifier with two equals rule
  step = applyModifierWithTwoEqualsRule(grid, constraints, size)
  if (step) return step

  // Rule 9: End with equals constraint rule
  step = applyEndWithEqualsConstraintRule(grid, constraints, size)
  if (step) return step

  return null
}

/**
 * Rule 1: If there are two equal cells next to each other,
 * then the neighbouring cells must be the opposite
 */
function applyNoThreeRule(grid, constraints, size) {
  // Check rows
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size - 1; col++) {
      const val1 = grid[row][col]
      const val2 = grid[row][col + 1]
      
      if (val1 !== null && val1 === val2) {
        const opposite = val1 === 'sun' ? 'moon' : 'sun'
        
        // Check left neighbor
        if (col > 0 && grid[row][col - 1] === null) {
          grid[row][col - 1] = opposite
          return new SolvingStep(
            'No-Three Rule',
            `Row ${row + 1} has two ${val1 === 'sun' ? 'suns' : 'moons'} at positions ${col + 1} and ${col + 2}. To avoid three in a row, the cell at position ${col} must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
            [[row, col], [row, col + 1]],
            [row, col - 1],
            opposite
          )
        }
        
        // Check right neighbor
        if (col + 2 < size && grid[row][col + 2] === null) {
          grid[row][col + 2] = opposite
          return new SolvingStep(
            'No-Three Rule',
            `Row ${row + 1} has two ${val1 === 'sun' ? 'suns' : 'moons'} at positions ${col + 1} and ${col + 2}. To avoid three in a row, the cell at position ${col + 3} must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
            [[row, col], [row, col + 1]],
            [row, col + 2],
            opposite
          )
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    for (let row = 0; row < size - 1; row++) {
      const val1 = grid[row][col]
      const val2 = grid[row + 1][col]
      
      if (val1 !== null && val1 === val2) {
        const opposite = val1 === 'sun' ? 'moon' : 'sun'
        
        // Check top neighbor
        if (row > 0 && grid[row - 1][col] === null) {
          grid[row - 1][col] = opposite
          return new SolvingStep(
            'No-Three Rule',
            `Column ${col + 1} has two ${val1 === 'sun' ? 'suns' : 'moons'} at rows ${row + 1} and ${row + 2}. To avoid three in a row, the cell at row ${row} must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
            [[row, col], [row + 1, col]],
            [row - 1, col],
            opposite
          )
        }
        
        // Check bottom neighbor
        if (row + 2 < size && grid[row + 2][col] === null) {
          grid[row + 2][col] = opposite
          return new SolvingStep(
            'No-Three Rule',
            `Column ${col + 1} has two ${val1 === 'sun' ? 'suns' : 'moons'} at rows ${row + 1} and ${row + 2}. To avoid three in a row, the cell at row ${row + 3} must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
            [[row, col], [row + 1, col]],
            [row + 2, col],
            opposite
          )
        }
      }
    }
  }

  return null
}

/**
 * Rule 2: Parity rule - if a row/column has reached half capacity,
 * fill remaining cells with the opposite
 */
function applyParityRule(grid, constraints, size) {
  const maxAllowed = Math.floor(size / 2)

  // Check rows
  for (let row = 0; row < size; row++) {
    const rowValues = grid[row].filter(v => v !== null)
    const suns = rowValues.filter(v => v === 'sun').length
    const moons = rowValues.filter(v => v === 'moon').length

    if (suns === maxAllowed) {
      // Fill remaining with moons
      for (let col = 0; col < size; col++) {
        if (grid[row][col] === null) {
          grid[row][col] = 'moon'
          return new SolvingStep(
            'Parity Rule',
            `Row ${row + 1} already has ${maxAllowed} suns (the maximum allowed). The remaining empty cells in this row must be moons. Filling cell at position ${col + 1}.`,
            grid[row].map((val, idx) => val !== null ? [row, idx] : null).filter(x => x !== null),
            [row, col],
            'moon'
          )
        }
      }
    }

    if (moons === maxAllowed) {
      // Fill remaining with suns
      for (let col = 0; col < size; col++) {
        if (grid[row][col] === null) {
          grid[row][col] = 'sun'
          return new SolvingStep(
            'Parity Rule',
            `Row ${row + 1} already has ${maxAllowed} moons (the maximum allowed). The remaining empty cells in this row must be suns. Filling cell at position ${col + 1}.`,
            grid[row].map((val, idx) => val !== null ? [row, idx] : null).filter(x => x !== null),
            [row, col],
            'sun'
          )
        }
      }
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    const colValues = grid.map(r => r[col]).filter(v => v !== null)
    const suns = colValues.filter(v => v === 'sun').length
    const moons = colValues.filter(v => v === 'moon').length

    if (suns === maxAllowed) {
      // Fill remaining with moons
      for (let row = 0; row < size; row++) {
        if (grid[row][col] === null) {
          grid[row][col] = 'moon'
          return new SolvingStep(
            'Parity Rule',
            `Column ${col + 1} already has ${maxAllowed} suns (the maximum allowed). The remaining empty cells in this column must be moons. Filling cell at row ${row + 1}.`,
            grid.map((r, idx) => r[col] !== null ? [idx, col] : null).filter(x => x !== null),
            [row, col],
            'moon'
          )
        }
      }
    }

    if (moons === maxAllowed) {
      // Fill remaining with suns
      for (let row = 0; row < size; row++) {
        if (grid[row][col] === null) {
          grid[row][col] = 'sun'
          return new SolvingStep(
            'Parity Rule',
            `Column ${col + 1} already has ${maxAllowed} moons (the maximum allowed). The remaining empty cells in this column must be suns. Filling cell at row ${row + 1}.`,
            grid.map((r, idx) => r[col] !== null ? [idx, col] : null).filter(x => x !== null),
            [row, col],
            'sun'
          )
        }
      }
    }
  }

  return null
}

/**
 * Rule 3: Constraint propagation
 * - If one cell in an equals constraint is known, the other must match
 * - If one cell in a notEquals constraint is known, the other must be opposite
 */
function applyConstraintPropagation(grid, constraints, size) {
  // Check equals constraints
  for (const [r1, c1, r2, c2] of constraints.equals) {
    const val1 = grid[r1][c1]
    const val2 = grid[r2][c2]

    if (val1 !== null && val2 === null) {
      grid[r2][c2] = val1
      return new SolvingStep(
        'Constraint Propagation (Equals)',
        `Cell (${r1 + 1},${c1 + 1}) is ${val1 === 'sun' ? 'sun' : 'moon'} and has an equals constraint with cell (${r2 + 1},${c2 + 1}). Therefore, cell (${r2 + 1},${c2 + 1}) must also be ${val1 === 'sun' ? 'sun' : 'moon'}.`,
        [[r1, c1]],
        [r2, c2],
        val1
      )
    }

    if (val2 !== null && val1 === null) {
      grid[r1][c1] = val2
      return new SolvingStep(
        'Constraint Propagation (Equals)',
        `Cell (${r2 + 1},${c2 + 1}) is ${val2 === 'sun' ? 'sun' : 'moon'} and has an equals constraint with cell (${r1 + 1},${c1 + 1}). Therefore, cell (${r1 + 1},${c1 + 1}) must also be ${val2 === 'sun' ? 'sun' : 'moon'}.`,
        [[r2, c2]],
        [r1, c1],
        val2
      )
    }
  }

  // Check notEquals constraints
  for (const [r1, c1, r2, c2] of constraints.notEquals) {
    const val1 = grid[r1][c1]
    const val2 = grid[r2][c2]

    if (val1 !== null && val2 === null) {
      const opposite = val1 === 'sun' ? 'moon' : 'sun'
      grid[r2][c2] = opposite
      return new SolvingStep(
        'Constraint Propagation (Not Equals)',
        `Cell (${r1 + 1},${c1 + 1}) is ${val1 === 'sun' ? 'sun' : 'moon'} and has a not-equals constraint (×) with cell (${r2 + 1},${c2 + 1}). Therefore, cell (${r2 + 1},${c2 + 1}) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
        [[r1, c1]],
        [r2, c2],
        opposite
      )
    }

    if (val2 !== null && val1 === null) {
      const opposite = val2 === 'sun' ? 'moon' : 'sun'
      grid[r1][c1] = opposite
      return new SolvingStep(
        'Constraint Propagation (Not Equals)',
        `Cell (${r2 + 1},${c2 + 1}) is ${val2 === 'sun' ? 'sun' : 'moon'} and has a not-equals constraint (×) with cell (${r1 + 1},${c1 + 1}). Therefore, cell (${r1 + 1},${c1 + 1}) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
        [[r2, c2]],
        [r1, c1],
        opposite
      )
    }
  }

  return null
}

/**
 * Rule 4: Edge cases - if cells on either end of a row/col are equal,
 * the inner cells (second to last) must be opposite
 */
function applyEdgeCases(grid, constraints, size) {
  // Check rows
  for (let row = 0; row < size; row++) {
    const first = grid[row][0]
    const last = grid[row][size - 1]

    if (first !== null && last !== null && first === last) {
      const opposite = first === 'sun' ? 'moon' : 'sun'
      
      // Check second cell
      if (grid[row][1] === null) {
        grid[row][1] = opposite
        return new SolvingStep(
          'Edge Case Rule',
          `Row ${row + 1} has ${first === 'sun' ? 'sun' : 'moon'} at both ends (positions 1 and ${size}). To maintain balance and avoid patterns, the second cell (position 2) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
          [[row, 0], [row, size - 1]],
          [row, 1],
          opposite
        )
      }
      
      // Check second-to-last cell
      if (grid[row][size - 2] === null) {
        grid[row][size - 2] = opposite
        return new SolvingStep(
          'Edge Case Rule',
          `Row ${row + 1} has ${first === 'sun' ? 'sun' : 'moon'} at both ends (positions 1 and ${size}). To maintain balance and avoid patterns, the second-to-last cell (position ${size - 1}) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
          [[row, 0], [row, size - 1]],
          [row, size - 2],
          opposite
        )
      }
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    const first = grid[0][col]
    const last = grid[size - 1][col]

    if (first !== null && last !== null && first === last) {
      const opposite = first === 'sun' ? 'moon' : 'sun'
      
      // Check second cell
      if (grid[1][col] === null) {
        grid[1][col] = opposite
        return new SolvingStep(
          'Edge Case Rule',
          `Column ${col + 1} has ${first === 'sun' ? 'sun' : 'moon'} at both ends (rows 1 and ${size}). To maintain balance and avoid patterns, the second cell (row 2) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
          [[0, col], [size - 1, col]],
          [1, col],
          opposite
        )
      }
      
      // Check second-to-last cell
      if (grid[size - 2][col] === null) {
        grid[size - 2][col] = opposite
        return new SolvingStep(
          'Edge Case Rule',
          `Column ${col + 1} has ${first === 'sun' ? 'sun' : 'moon'} at both ends (rows 1 and ${size}). To maintain balance and avoid patterns, the second-to-last cell (row ${size - 1}) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
          [[0, col], [size - 1, col]],
          [size - 2, col],
          opposite
        )
      }
    }
  }

  return null
}

/**
 * Rule 5: Gap rule - if we have X _ X pattern, the middle must be opposite
 */
function applyGapRule(grid, constraints, size) {
  // Check rows
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size - 2; col++) {
      const val1 = grid[row][col]
      const val2 = grid[row][col + 2]
      const middle = grid[row][col + 1]

      if (val1 !== null && val2 !== null && val1 === val2 && middle === null) {
        const opposite = val1 === 'sun' ? 'moon' : 'sun'
        grid[row][col + 1] = opposite
        return new SolvingStep(
          'Gap Rule',
          `Row ${row + 1} has ${val1 === 'sun' ? 'sun' : 'moon'} at positions ${col + 1} and ${col + 3} with an empty cell between them. To avoid three in a row, the middle cell (position ${col + 2}) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
          [[row, col], [row, col + 2]],
          [row, col + 1],
          opposite
        )
      }
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    for (let row = 0; row < size - 2; row++) {
      const val1 = grid[row][col]
      const val2 = grid[row + 2][col]
      const middle = grid[row + 1][col]

      if (val1 !== null && val2 !== null && val1 === val2 && middle === null) {
        const opposite = val1 === 'sun' ? 'moon' : 'sun'
        grid[row + 1][col] = opposite
        return new SolvingStep(
          'Gap Rule',
          `Column ${col + 1} has ${val1 === 'sun' ? 'sun' : 'moon'} at rows ${row + 1} and ${row + 3} with an empty cell between them. To avoid three in a row, the middle cell (row ${row + 2}) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
          [[row, col], [row + 2, col]],
          [row + 1, col],
          opposite
        )
      }
    }
  }

  return null
}

/**
 * Rule 6: If there are two equal cells at one end of a row/col,
 * then the cell on the opposite end must be opposite
 */
function applyTwoEqualsAtEndRule(grid, constraints, size) {
  // Check rows - two equals at start
  for (let row = 0; row < size; row++) {
    if (grid[row][0] !== null && grid[row][1] !== null && 
        grid[row][0] === grid[row][1] && grid[row][size - 1] === null) {
      const opposite = grid[row][0] === 'sun' ? 'moon' : 'sun'
      grid[row][size - 1] = opposite
      return new SolvingStep(
        'Two Equals at End Rule',
        `Row ${row + 1} has two ${grid[row][0] === 'sun' ? 'suns' : 'moons'} at the start (positions 1 and 2). To maintain balance, the cell at the opposite end (position ${size}) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
        [[row, 0], [row, 1]],
        [row, size - 1],
        opposite
      )
    }

    // Two equals at end
    if (grid[row][size - 2] !== null && grid[row][size - 1] !== null && 
        grid[row][size - 2] === grid[row][size - 1] && grid[row][0] === null) {
      const opposite = grid[row][size - 1] === 'sun' ? 'moon' : 'sun'
      grid[row][0] = opposite
      return new SolvingStep(
        'Two Equals at End Rule',
        `Row ${row + 1} has two ${grid[row][size - 1] === 'sun' ? 'suns' : 'moons'} at the end (positions ${size - 1} and ${size}). To maintain balance, the cell at the opposite end (position 1) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
        [[row, size - 2], [row, size - 1]],
        [row, 0],
        opposite
      )
    }
  }

  // Check columns - two equals at top
  for (let col = 0; col < size; col++) {
    if (grid[0][col] !== null && grid[1][col] !== null && 
        grid[0][col] === grid[1][col] && grid[size - 1][col] === null) {
      const opposite = grid[0][col] === 'sun' ? 'moon' : 'sun'
      grid[size - 1][col] = opposite
      return new SolvingStep(
        'Two Equals at End Rule',
        `Column ${col + 1} has two ${grid[0][col] === 'sun' ? 'suns' : 'moons'} at the top (rows 1 and 2). To maintain balance, the cell at the opposite end (row ${size}) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
        [[0, col], [1, col]],
        [size - 1, col],
        opposite
      )
    }

    // Two equals at bottom
    if (grid[size - 2][col] !== null && grid[size - 1][col] !== null && 
        grid[size - 2][col] === grid[size - 1][col] && grid[0][col] === null) {
      const opposite = grid[size - 1][col] === 'sun' ? 'moon' : 'sun'
      grid[0][col] = opposite
      return new SolvingStep(
        'Two Equals at End Rule',
        `Column ${col + 1} has two ${grid[size - 1][col] === 'sun' ? 'suns' : 'moons'} at the bottom (rows ${size - 1} and ${size}). To maintain balance, the cell at the opposite end (row 1) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
        [[size - 2, col], [size - 1, col]],
        [0, col],
        opposite
      )
    }
  }

  return null
}

/**
 * Rule 7: If the second to last cell equals the first cell of a row/col,
 * then the (empty) end cell must be opposite
 */
function applySecondToLastEqualsFirstRule(grid, constraints, size) {
  // Check rows
  for (let row = 0; row < size; row++) {
    const first = grid[row][0]
    const secondToLast = grid[row][size - 2]
    const last = grid[row][size - 1]

    if (first !== null && secondToLast !== null && 
        first === secondToLast && last === null) {
      const opposite = first === 'sun' ? 'moon' : 'sun'
      grid[row][size - 1] = opposite
      return new SolvingStep(
        'Second-to-Last Equals First Rule',
        `Row ${row + 1} has ${first === 'sun' ? 'sun' : 'moon'} at position 1 and position ${size - 1} (second to last). To avoid patterns and maintain balance, the last cell (position ${size}) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
        [[row, 0], [row, size - 2]],
        [row, size - 1],
        opposite
      )
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    const first = grid[0][col]
    const secondToLast = grid[size - 2][col]
    const last = grid[size - 1][col]

    if (first !== null && secondToLast !== null && 
        first === secondToLast && last === null) {
      const opposite = first === 'sun' ? 'moon' : 'sun'
      grid[size - 1][col] = opposite
      return new SolvingStep(
        'Second-to-Last Equals First Rule',
        `Column ${col + 1} has ${first === 'sun' ? 'sun' : 'moon'} at row 1 and row ${size - 1} (second to last). To avoid patterns and maintain balance, the last cell (row ${size}) must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
        [[0, col], [size - 2, col]],
        [size - 1, col],
        opposite
      )
    }
  }

  return null
}

/**
 * Rule 8: Modifier balance rule
 * If a column/row already has (maxAllowed - 1) of one symbol, and there's a 
 * notEquals constraint in another column/row that guarantees one of its cells 
 * will be that symbol, then we can deduce values in the second column/row.
 * 
 * Example: Column 1 has 2 suns (maxAllowed=3, so 1 more sun allowed).
 * Column 2 has a notEquals constraint. If that constraint forces one cell to 
 * be sun, and column 2 already has enough suns, then other cells must be moons.
 */
function applyModifierWithTwoEqualsRule(grid, constraints, size) {
  const maxAllowed = Math.floor(size / 2)

  // Check columns - if one column is near capacity and another has constraints
  for (let col1 = 0; col1 < size; col1++) {
    const col1Values = grid.map(r => r[col1]).filter(v => v !== null)
    const col1Suns = col1Values.filter(v => v === 'sun').length
    const col1Moons = col1Values.filter(v => v === 'moon').length

    // Check if column 1 is one away from max capacity
    if (col1Suns === maxAllowed - 1 || col1Moons === maxAllowed - 1) {
      const neededSymbol = col1Suns === maxAllowed - 1 ? 'sun' : 'moon'
      const oppositeSymbol = neededSymbol === 'sun' ? 'moon' : 'sun'

      // Check other columns for notEquals constraints that might force the needed symbol
      for (let col2 = 0; col2 < size; col2++) {
        if (col1 === col2) continue

        // Find notEquals constraints in column 2
        for (const [r1, c1, r2, c2] of constraints.notEquals) {
          // Check if this constraint is in column 2
          if ((c1 === col2 && c2 === col2) || (c1 === col2 && r1 === r2)) {
            // Horizontal constraint in column 2
            continue
          }
          if (c1 === col2 && c2 !== col2) {
            // One cell is in col2, check if the other is in a different column
            // This is a cross-column constraint, skip for now
            continue
          }
        }

        // Check for notEquals constraints within column 2
        for (const [r1, c1, r2, c2] of constraints.notEquals) {
          if (c1 !== col2 || c2 !== col2) continue
          if (r1 === r2) continue // Must be vertical (same column, different rows)

          const val1 = grid[r1][c1]
          const val2 = grid[r2][c2]

          // If one cell is already the needed symbol, the other must be opposite
          if (val1 === neededSymbol && val2 === null) {
            // Check if column 2 already has maxAllowed of neededSymbol
            const col2Values = grid.map(r => r[col2]).filter(v => v !== null)
            const col2Suns = col2Values.filter(v => v === 'sun').length
            const col2Moons = col2Values.filter(v => v === 'moon').length

            if ((neededSymbol === 'sun' && col2Suns >= maxAllowed) ||
                (neededSymbol === 'moon' && col2Moons >= maxAllowed)) {
              // Column 2 can't have more of neededSymbol, so this cell must be opposite
              grid[r2][c2] = oppositeSymbol
              return new SolvingStep(
                'Modifier Balance Rule',
                `Column ${col1 + 1} needs one more ${neededSymbol === 'sun' ? 'sun' : 'moon'}, and column ${col2 + 1} has a not-equals constraint (×) at rows ${r1 + 1} and ${r2 + 1}. Since row ${r1 + 1} is ${neededSymbol === 'sun' ? 'sun' : 'moon'} and column ${col2 + 1} already has the maximum allowed ${neededSymbol === 'sun' ? 'suns' : 'moons'}, row ${r2 + 1} must be ${oppositeSymbol === 'sun' ? 'sun' : 'moon'}.`,
                [[r1, c1]],
                [r2, c2],
                oppositeSymbol
              )
            }
          }

          if (val2 === neededSymbol && val1 === null) {
            // Check if column 2 already has maxAllowed of neededSymbol
            const col2Values = grid.map(r => r[col2]).filter(v => v !== null)
            const col2Suns = col2Values.filter(v => v === 'sun').length
            const col2Moons = col2Values.filter(v => v === 'moon').length

            if ((neededSymbol === 'sun' && col2Suns >= maxAllowed) ||
                (neededSymbol === 'moon' && col2Moons >= maxAllowed)) {
              grid[r1][c1] = oppositeSymbol
              return new SolvingStep(
                'Modifier Balance Rule',
                `Column ${col1 + 1} needs one more ${neededSymbol === 'sun' ? 'sun' : 'moon'}, and column ${col2 + 1} has a not-equals constraint (×) at rows ${r1 + 1} and ${r2 + 1}. Since row ${r2 + 1} is ${neededSymbol === 'sun' ? 'sun' : 'moon'} and column ${col2 + 1} already has the maximum allowed ${neededSymbol === 'sun' ? 'suns' : 'moons'}, row ${r1 + 1} must be ${oppositeSymbol === 'sun' ? 'sun' : 'moon'}.`,
                [[r2, c2]],
                [r1, c1],
                oppositeSymbol
              )
            }
          }
        }
      }
    }
  }

  // Similar logic for rows
  for (let row1 = 0; row1 < size; row1++) {
    const row1Values = grid[row1].filter(v => v !== null)
    const row1Suns = row1Values.filter(v => v === 'sun').length
    const row1Moons = row1Values.filter(v => v === 'moon').length

    // Check if row 1 is one away from max capacity
    if (row1Suns === maxAllowed - 1 || row1Moons === maxAllowed - 1) {
      const neededSymbol = row1Suns === maxAllowed - 1 ? 'sun' : 'moon'
      const oppositeSymbol = neededSymbol === 'sun' ? 'moon' : 'sun'

      // Check other rows for notEquals constraints
      for (let row2 = 0; row2 < size; row2++) {
        if (row1 === row2) continue

        // Check for notEquals constraints within row 2
        for (const [r1, c1, r2, c2] of constraints.notEquals) {
          if (r1 !== row2 || r2 !== row2) continue
          if (c1 === c2) continue // Must be horizontal (same row, different columns)

          const val1 = grid[r1][c1]
          const val2 = grid[r2][c2]

          // If one cell is already the needed symbol, the other must be opposite
          if (val1 === neededSymbol && val2 === null) {
            // Check if row 2 already has maxAllowed of neededSymbol
            const row2Values = grid[row2].filter(v => v !== null)
            const row2Suns = row2Values.filter(v => v === 'sun').length
            const row2Moons = row2Values.filter(v => v === 'moon').length

            if ((neededSymbol === 'sun' && row2Suns >= maxAllowed) ||
                (neededSymbol === 'moon' && row2Moons >= maxAllowed)) {
              grid[r2][c2] = oppositeSymbol
              return new SolvingStep(
                'Modifier Balance Rule',
                `Row ${row1 + 1} needs one more ${neededSymbol === 'sun' ? 'sun' : 'moon'}, and row ${row2 + 1} has a not-equals constraint (×) at columns ${c1 + 1} and ${c2 + 1}. Since column ${c1 + 1} is ${neededSymbol === 'sun' ? 'sun' : 'moon'} and row ${row2 + 1} already has the maximum allowed ${neededSymbol === 'sun' ? 'suns' : 'moons'}, column ${c2 + 1} must be ${oppositeSymbol === 'sun' ? 'sun' : 'moon'}.`,
                [[r1, c1]],
                [r2, c2],
                oppositeSymbol
              )
            }
          }

          if (val2 === neededSymbol && val1 === null) {
            // Check if row 2 already has maxAllowed of neededSymbol
            const row2Values = grid[row2].filter(v => v !== null)
            const row2Suns = row2Values.filter(v => v === 'sun').length
            const row2Moons = row2Values.filter(v => v === 'moon').length

            if ((neededSymbol === 'sun' && row2Suns >= maxAllowed) ||
                (neededSymbol === 'moon' && row2Moons >= maxAllowed)) {
              grid[r1][c1] = oppositeSymbol
              return new SolvingStep(
                'Modifier Balance Rule',
                `Row ${row1 + 1} needs one more ${neededSymbol === 'sun' ? 'sun' : 'moon'}, and row ${row2 + 1} has a not-equals constraint (×) at columns ${c1 + 1} and ${c2 + 1}. Since column ${c2 + 1} is ${neededSymbol === 'sun' ? 'sun' : 'moon'} and row ${row2 + 1} already has the maximum allowed ${neededSymbol === 'sun' ? 'suns' : 'moons'}, column ${c1 + 1} must be ${oppositeSymbol === 'sun' ? 'sun' : 'moon'}.`,
                [[r2, c2]],
                [r1, c1],
                oppositeSymbol
              )
            }
          }
        }
      }
    }
  }

  // Additional case: If a column/row has (maxAllowed - 1) of one symbol and a notEquals constraint
  // in that same column/row, the constraint guarantees exactly 1 more of that symbol
  // (since one cell must be that symbol, one must be opposite).
  // Therefore, all other empty cells must be the opposite symbol.
  for (let col = 0; col < size; col++) {
    const colValues = grid.map(r => r[col]).filter(v => v !== null)
    const colSuns = colValues.filter(v => v === 'sun').length
    const colMoons = colValues.filter(v => v === 'moon').length
    const maxAllowed = Math.floor(size / 2)

    // Check if column has (maxAllowed - 1) of one symbol
    if (colSuns === maxAllowed - 1) {
      // Column needs exactly 1 more sun and (maxAllowed + 1) more moons
      // Check for notEquals constraints in this column
      for (const [r1, c1, r2, c2] of constraints.notEquals) {
        if (c1 !== col || c2 !== col) continue
        if (r1 === r2) continue // Must be vertical

        const val1 = grid[r1][c1]
        const val2 = grid[r2][c2]

        // The notEquals constraint guarantees exactly 1 sun and 1 moon between these two cells
        // Since we need exactly 1 more sun, this constraint will provide it
        // Therefore, all other empty cells in the column must be moons
        
        // Find empty cells in this column that are not part of the constraint
        for (let row = 0; row < size; row++) {
          if (row === r1 || row === r2) continue // Skip constraint cells
          if (grid[row][col] !== null) continue // Skip filled cells
          
          grid[row][col] = 'moon'
          return new SolvingStep(
            'Modifier Balance Rule',
            `Column ${col + 1} has ${maxAllowed - 1} suns and needs exactly 1 more. The not-equals constraint (×) at rows ${r1 + 1} and ${r2 + 1} will provide exactly 1 sun (one cell must be sun, one must be moon). Therefore, all other empty cells in column ${col + 1} must be moons. Filling row ${row + 1} with moon.`,
            grid.map((r, idx) => r[col] !== null ? [idx, col] : null).filter(x => x !== null).concat([[r1, c1], [r2, c2]]),
            [row, col],
            'moon'
          )
        }
      }
    }

    if (colMoons === maxAllowed - 1) {
      // Similar logic for moons
      for (const [r1, c1, r2, c2] of constraints.notEquals) {
        if (c1 !== col || c2 !== col) continue
        if (r1 === r2) continue

        const val1 = grid[r1][c1]
        const val2 = grid[r2][c2]

        // The notEquals constraint guarantees exactly 1 moon and 1 sun between these two cells
        // Since we need exactly 1 more moon, this constraint will provide it
        // Therefore, all other empty cells in the column must be suns
        
        // Find empty cells in this column that are not part of the constraint
        for (let row = 0; row < size; row++) {
          if (row === r1 || row === r2) continue // Skip constraint cells
          if (grid[row][col] !== null) continue // Skip filled cells
          
          grid[row][col] = 'sun'
          return new SolvingStep(
            'Modifier Balance Rule',
            `Column ${col + 1} has ${maxAllowed - 1} moons and needs exactly 1 more. The not-equals constraint (×) at rows ${r1 + 1} and ${r2 + 1} will provide exactly 1 moon (one cell must be moon, one must be sun). Therefore, all other empty cells in column ${col + 1} must be suns. Filling row ${row + 1} with sun.`,
            grid.map((r, idx) => r[col] !== null ? [idx, col] : null).filter(x => x !== null).concat([[r1, c1], [r2, c2]]),
            [row, col],
            'sun'
          )
        }
      }
    }
  }

  // Similar logic for rows
  for (let row = 0; row < size; row++) {
    const rowValues = grid[row].filter(v => v !== null)
    const rowSuns = rowValues.filter(v => v === 'sun').length
    const rowMoons = rowValues.filter(v => v === 'moon').length
    const maxAllowed = Math.floor(size / 2)

    if (rowSuns === maxAllowed - 1) {
      for (const [r1, c1, r2, c2] of constraints.notEquals) {
        if (r1 !== row || r2 !== row) continue
        if (c1 === c2) continue

        const val1 = grid[r1][c1]
        const val2 = grid[r2][c2]

        // The notEquals constraint guarantees exactly 1 sun and 1 moon between these two cells
        // Since we need exactly 1 more sun, this constraint will provide it
        // Therefore, all other empty cells in the row must be moons
        
        // Find empty cells in this row that are not part of the constraint
        for (let col = 0; col < size; col++) {
          if (col === c1 || col === c2) continue // Skip constraint cells
          if (grid[row][col] !== null) continue // Skip filled cells
          
          grid[row][col] = 'moon'
          return new SolvingStep(
            'Modifier Balance Rule',
            `Row ${row + 1} has ${maxAllowed - 1} suns and needs exactly 1 more. The not-equals constraint (×) at columns ${c1 + 1} and ${c2 + 1} will provide exactly 1 sun (one cell must be sun, one must be moon). Therefore, all other empty cells in row ${row + 1} must be moons. Filling column ${col + 1} with moon.`,
            grid[row].map((val, idx) => val !== null ? [row, idx] : null).filter(x => x !== null).concat([[r1, c1], [r2, c2]]),
            [row, col],
            'moon'
          )
        }
      }
    }

    if (rowMoons === maxAllowed - 1) {
      for (const [r1, c1, r2, c2] of constraints.notEquals) {
        if (r1 !== row || r2 !== row) continue
        if (c1 === c2) continue

        const val1 = grid[r1][c1]
        const val2 = grid[r2][c2]

        // The notEquals constraint guarantees exactly 1 moon and 1 sun between these two cells
        // Since we need exactly 1 more moon, this constraint will provide it
        // Therefore, all other empty cells in the row must be suns
        
        // Find empty cells in this row that are not part of the constraint
        for (let col = 0; col < size; col++) {
          if (col === c1 || col === c2) continue // Skip constraint cells
          if (grid[row][col] !== null) continue // Skip filled cells
          
          grid[row][col] = 'sun'
          return new SolvingStep(
            'Modifier Balance Rule',
            `Row ${row + 1} has ${maxAllowed - 1} moons and needs exactly 1 more. The not-equals constraint (×) at columns ${c1 + 1} and ${c2 + 1} will provide exactly 1 moon (one cell must be moon, one must be sun). Therefore, all other empty cells in row ${row + 1} must be suns. Filling column ${col + 1} with sun.`,
            grid[row].map((val, idx) => val !== null ? [row, idx] : null).filter(x => x !== null).concat([[r1, c1], [r2, c2]]),
            [row, col],
            'sun'
          )
        }
      }
    }
  }

  return null
}

/**
 * Rule 9: End with equals constraint rule
 * If one end of a column/row has a known value, and at the other end there are
 * cells connected by an equals constraint, those cells must be the opposite value.
 * 
 * Example: Column has moon at top, and bottom cells are connected by equals.
 * Since they must be equal and opposite to the top, they must be suns.
 */
function applyEndWithEqualsConstraintRule(grid, constraints, size) {
  // Check columns
  for (let col = 0; col < size; col++) {
    const top = grid[0][col]
    const bottom = grid[size - 1][col]

    // Check if top is known and bottom has equals constraint
    if (top !== null) {
      // Look for equals constraints involving bottom cells of this column
      for (const [r1, c1, r2, c2] of constraints.equals) {
        // Check if constraint is at the bottom of this column (vertical constraint)
        if (c1 === col && c2 === col && (r1 === size - 1 || r2 === size - 1)) {
          const otherRow = r1 === size - 1 ? r2 : r1
          if (otherRow < size - 2) continue // Only consider if near bottom
          
          const val1 = grid[r1][c1]
          const val2 = grid[r2][c2]
          const opposite = top === 'sun' ? 'moon' : 'sun'

          // If both are empty, they must be opposite to top
          if (val1 === null && val2 === null) {
            grid[r1][c1] = opposite
            return new SolvingStep(
              'End with Equals Constraint Rule',
              `Column ${col + 1} has ${top === 'sun' ? 'sun' : 'moon'} at the top (row 1). The bottom cells at rows ${r1 + 1} and ${r2 + 1} are connected by an equals constraint (=), so they must be equal. Since the top is ${top === 'sun' ? 'sun' : 'moon'}, these bottom cells must be ${opposite === 'sun' ? 'sun' : 'moon'}. Filling row ${r1 + 1}.`,
              [[0, col]],
              [r1, c1],
              opposite
            )
          }
        }

        // Check if constraint is horizontal at bottom row involving this column
        if (r1 === size - 1 && r2 === size - 1 && (c1 === col || c2 === col)) {
          const otherCol = c1 === col ? c2 : c1
          const val1 = grid[r1][c1]
          const val2 = grid[r2][c2]
          const opposite = top === 'sun' ? 'moon' : 'sun'

          // If the cell in this column is empty, it must be opposite to top
          if (c1 === col && val1 === null) {
            grid[r1][c1] = opposite
            return new SolvingStep(
              'End with Equals Constraint Rule',
              `Column ${col + 1} has ${top === 'sun' ? 'sun' : 'moon'} at the top (row 1). The bottom cell at row ${size} is connected by an equals constraint (=) to column ${otherCol + 1}. Since the top is ${top === 'sun' ? 'sun' : 'moon'}, the bottom cell must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
              [[0, col]],
              [r1, c1],
              opposite
            )
          }
          if (c2 === col && val2 === null) {
            grid[r2][c2] = opposite
            return new SolvingStep(
              'End with Equals Constraint Rule',
              `Column ${col + 1} has ${top === 'sun' ? 'sun' : 'moon'} at the top (row 1). The bottom cell at row ${size} is connected by an equals constraint (=) to column ${otherCol + 1}. Since the top is ${top === 'sun' ? 'sun' : 'moon'}, the bottom cell must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
              [[0, col]],
              [r2, c2],
              opposite
            )
          }
        }
      }
    }

    // Check if bottom is known and top has equals constraint
    if (bottom !== null) {
      // Look for equals constraints involving top cells of this column
      for (const [r1, c1, r2, c2] of constraints.equals) {
        // Check if constraint is at the top of this column (vertical constraint)
        if (c1 === col && c2 === col && (r1 === 0 || r2 === 0)) {
          const otherRow = r1 === 0 ? r2 : r1
          if (otherRow > 1) continue // Only consider if near top
          
          const val1 = grid[r1][c1]
          const val2 = grid[r2][c2]
          const opposite = bottom === 'sun' ? 'moon' : 'sun'

          // If both are empty, they must be opposite to bottom
          if (val1 === null && val2 === null) {
            grid[r1][c1] = opposite
            return new SolvingStep(
              'End with Equals Constraint Rule',
              `Column ${col + 1} has ${bottom === 'sun' ? 'sun' : 'moon'} at the bottom (row ${size}). The top cells at rows ${r1 + 1} and ${r2 + 1} are connected by an equals constraint (=), so they must be equal. Since the bottom is ${bottom === 'sun' ? 'sun' : 'moon'}, these top cells must be ${opposite === 'sun' ? 'sun' : 'moon'}. Filling row ${r1 + 1}.`,
              [[size - 1, col]],
              [r1, c1],
              opposite
            )
          }
        }

        // Check if constraint is horizontal at top row involving this column
        if (r1 === 0 && r2 === 0 && (c1 === col || c2 === col)) {
          const otherCol = c1 === col ? c2 : c1
          const val1 = grid[r1][c1]
          const val2 = grid[r2][c2]
          const opposite = bottom === 'sun' ? 'moon' : 'sun'

          // If the cell in this column is empty, it must be opposite to bottom
          if (c1 === col && val1 === null) {
            grid[r1][c1] = opposite
            return new SolvingStep(
              'End with Equals Constraint Rule',
              `Column ${col + 1} has ${bottom === 'sun' ? 'sun' : 'moon'} at the bottom (row ${size}). The top cell at row 1 is connected by an equals constraint (=) to column ${otherCol + 1}. Since the bottom is ${bottom === 'sun' ? 'sun' : 'moon'}, the top cell must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
              [[size - 1, col]],
              [r1, c1],
              opposite
            )
          }
          if (c2 === col && val2 === null) {
            grid[r2][c2] = opposite
            return new SolvingStep(
              'End with Equals Constraint Rule',
              `Column ${col + 1} has ${bottom === 'sun' ? 'sun' : 'moon'} at the bottom (row ${size}). The top cell at row 1 is connected by an equals constraint (=) to column ${otherCol + 1}. Since the bottom is ${bottom === 'sun' ? 'sun' : 'moon'}, the top cell must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
              [[size - 1, col]],
              [r2, c2],
              opposite
            )
          }
        }
      }
    }
  }

  // Check rows
  for (let row = 0; row < size; row++) {
    const left = grid[row][0]
    const right = grid[row][size - 1]

    // Check if left is known and right has equals constraint
    if (left !== null) {
      // Look for equals constraints involving right cells of this row
      for (const [r1, c1, r2, c2] of constraints.equals) {
        // Check if constraint is at the right of this row (horizontal constraint)
        if (r1 === row && r2 === row && (c1 === size - 1 || c2 === size - 1)) {
          const otherCol = c1 === size - 1 ? c2 : c1
          if (otherCol < size - 2) continue // Only consider if near right
          
          const val1 = grid[r1][c1]
          const val2 = grid[r2][c2]
          const opposite = left === 'sun' ? 'moon' : 'sun'

          // If both are empty, they must be opposite to left
          if (val1 === null && val2 === null) {
            grid[r1][c1] = opposite
            return new SolvingStep(
              'End with Equals Constraint Rule',
              `Row ${row + 1} has ${left === 'sun' ? 'sun' : 'moon'} at the left (column 1). The right cells at columns ${c1 + 1} and ${c2 + 1} are connected by an equals constraint (=), so they must be equal. Since the left is ${left === 'sun' ? 'sun' : 'moon'}, these right cells must be ${opposite === 'sun' ? 'sun' : 'moon'}. Filling column ${c1 + 1}.`,
              [[row, 0]],
              [r1, c1],
              opposite
            )
          }
        }

        // Check if constraint is vertical at right column involving this row
        if (c1 === size - 1 && c2 === size - 1 && (r1 === row || r2 === row)) {
          const otherRow = r1 === row ? r2 : r1
          const val1 = grid[r1][c1]
          const val2 = grid[r2][c2]
          const opposite = left === 'sun' ? 'moon' : 'sun'

          // If the cell in this row is empty, it must be opposite to left
          if (r1 === row && val1 === null) {
            grid[r1][c1] = opposite
            return new SolvingStep(
              'End with Equals Constraint Rule',
              `Row ${row + 1} has ${left === 'sun' ? 'sun' : 'moon'} at the left (column 1). The right cell at column ${size} is connected by an equals constraint (=) to row ${otherRow + 1}. Since the left is ${left === 'sun' ? 'sun' : 'moon'}, the right cell must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
              [[row, 0]],
              [r1, c1],
              opposite
            )
          }
          if (r2 === row && val2 === null) {
            grid[r2][c2] = opposite
            return new SolvingStep(
              'End with Equals Constraint Rule',
              `Row ${row + 1} has ${left === 'sun' ? 'sun' : 'moon'} at the left (column 1). The right cell at column ${size} is connected by an equals constraint (=) to row ${otherRow + 1}. Since the left is ${left === 'sun' ? 'sun' : 'moon'}, the right cell must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
              [[row, 0]],
              [r2, c2],
              opposite
            )
          }
        }
      }
    }

    // Check if right is known and left has equals constraint
    if (right !== null) {
      // Look for equals constraints involving left cells of this row
      for (const [r1, c1, r2, c2] of constraints.equals) {
        // Check if constraint is at the left of this row (horizontal constraint)
        if (r1 === row && r2 === row && (c1 === 0 || c2 === 0)) {
          const otherCol = c1 === 0 ? c2 : c1
          if (otherCol > 1) continue // Only consider if near left
          
          const val1 = grid[r1][c1]
          const val2 = grid[r2][c2]
          const opposite = right === 'sun' ? 'moon' : 'sun'

          // If both are empty, they must be opposite to right
          if (val1 === null && val2 === null) {
            grid[r1][c1] = opposite
            return new SolvingStep(
              'End with Equals Constraint Rule',
              `Row ${row + 1} has ${right === 'sun' ? 'sun' : 'moon'} at the right (column ${size}). The left cells at columns ${c1 + 1} and ${c2 + 1} are connected by an equals constraint (=), so they must be equal. Since the right is ${right === 'sun' ? 'sun' : 'moon'}, these left cells must be ${opposite === 'sun' ? 'sun' : 'moon'}. Filling column ${c1 + 1}.`,
              [[row, size - 1]],
              [r1, c1],
              opposite
            )
          }
        }

        // Check if constraint is vertical at left column involving this row
        if (c1 === 0 && c2 === 0 && (r1 === row || r2 === row)) {
          const otherRow = r1 === row ? r2 : r1
          const val1 = grid[r1][c1]
          const val2 = grid[r2][c2]
          const opposite = right === 'sun' ? 'moon' : 'sun'

          // If the cell in this row is empty, it must be opposite to right
          if (r1 === row && val1 === null) {
            grid[r1][c1] = opposite
            return new SolvingStep(
              'End with Equals Constraint Rule',
              `Row ${row + 1} has ${right === 'sun' ? 'sun' : 'moon'} at the right (column ${size}). The left cell at column 1 is connected by an equals constraint (=) to row ${otherRow + 1}. Since the right is ${right === 'sun' ? 'sun' : 'moon'}, the left cell must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
              [[row, size - 1]],
              [r1, c1],
              opposite
            )
          }
          if (r2 === row && val2 === null) {
            grid[r2][c2] = opposite
            return new SolvingStep(
              'End with Equals Constraint Rule',
              `Row ${row + 1} has ${right === 'sun' ? 'sun' : 'moon'} at the right (column ${size}). The left cell at column 1 is connected by an equals constraint (=) to row ${otherRow + 1}. Since the right is ${right === 'sun' ? 'sun' : 'moon'}, the left cell must be ${opposite === 'sun' ? 'sun' : 'moon'}.`,
              [[row, size - 1]],
              [r2, c2],
              opposite
            )
          }
        }
      }
    }
  }

  return null
}

/**
 * Check if the grid is complete
 */
function isComplete(grid, size) {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col] === null) {
        return false
      }
    }
  }
  return true
}

/**
 * Legacy function for backward compatibility - solves all at once
 */
export function solvePuzzle(grid, constraints, size) {
  const steps = solvePuzzleStepByStep(grid, constraints, size)
  const gridCopy = grid.map(row => row.slice())
  
  // Apply all steps
  for (const step of steps) {
    gridCopy[step.resultCell[0]][step.resultCell[1]] = step.resultValue
  }
  
  // Check if complete
  if (isComplete(gridCopy, size)) {
    return gridCopy
  }
  
  return null
}

/**
 * Helper function to check if a partial solution is still valid
 */
export function isValidPartialSolution(grid, constraints, size) {
  const maxAllowed = Math.floor(size / 2)

  // Check rows
  for (let row = 0; row < size; row++) {
    const rowValues = grid[row].filter(v => v !== null)
    const sunsInRow = rowValues.filter(v => v === 'sun').length
    const moonsInRow = rowValues.filter(v => v === 'moon').length

    if (sunsInRow > maxAllowed || moonsInRow > maxAllowed) {
      return false
    }

    // Check consecutive
    for (let col = 0; col < size - 2; col++) {
      const val1 = grid[row][col]
      const val2 = grid[row][col + 1]
      const val3 = grid[row][col + 2]
      
      if (val1 !== null && val1 === val2 && val2 === val3) {
        return false
      }
    }
  }

  // Check columns
  for (let col = 0; col < size; col++) {
    const colValues = grid.map(r => r[col]).filter(v => v !== null)
    const sunsInCol = colValues.filter(v => v === 'sun').length
    const moonsInCol = colValues.filter(v => v === 'moon').length

    if (sunsInCol > maxAllowed || moonsInCol > maxAllowed) {
      return false
    }

    // Check consecutive
    for (let row = 0; row < size - 2; row++) {
      const val1 = grid[row][col]
      const val2 = grid[row + 1][col]
      const val3 = grid[row + 2][col]
      
      if (val1 !== null && val1 === val2 && val2 === val3) {
        return false
      }
    }
  }

  // Check constraints
  for (const [r1, c1, r2, c2] of constraints.equals) {
    const val1 = grid[r1][c1]
    const val2 = grid[r2][c2]
    if (val1 !== null && val2 !== null && val1 !== val2) {
      return false
    }
  }

  for (const [r1, c1, r2, c2] of constraints.notEquals) {
    const val1 = grid[r1][c1]
    const val2 = grid[r2][c2]
    if (val1 !== null && val2 !== null && val1 === val2) {
      return false
    }
  }

  return true
}
