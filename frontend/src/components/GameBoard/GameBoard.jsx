import React, { useState } from 'react'
import Cell from '../Cell/Cell'
import ConstraintToolbar from '../ConstraintToolbar/ConstraintToolbar'
import { checkWin } from '../../utils/gameLogic'
import { validateStartingPosition } from '../../utils/validator'
import { solvePuzzle } from '../../utils/solver'
import './GameBoard.css'

const GRID_SIZE = 6

function GameBoard() {
  // Initialize with blank grid
  const [grid, setGrid] = useState(() => 
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  )
  const [constraints, setConstraints] = useState({ equals: [], notEquals: [] })
  const [isComplete, setIsComplete] = useState(false)
  const [draggingConstraint, setDraggingConstraint] = useState(null) // 'equals' or 'notEquals'
  const [validationError, setValidationError] = useState(null)
  const [isSolving, setIsSolving] = useState(false)

  const handleCellClick = (row, col) => {
    const newGrid = grid.map(r => [...r])
    const currentValue = newGrid[row][col]
    
    // Cycle through: empty -> sun -> moon -> empty
    if (currentValue === null) {
      newGrid[row][col] = 'sun'
    } else if (currentValue === 'sun') {
      newGrid[row][col] = 'moon'
    } else {
      newGrid[row][col] = null
    }

    setGrid(newGrid)
    
    // Check win condition
    if (checkWin(newGrid, GRID_SIZE)) {
      setIsComplete(true)
    } else {
      setIsComplete(false)
    }
  }

  const handleEdgeDrop = (edge, constraintType) => {
    if (!constraintType) return

    let { row1, col1, row2, col2 } = edge
    
    // Normalize constraint: always store with first cell having smaller indices
    // For horizontal: smaller col first
    // For vertical: smaller row first
    if (row1 === row2) {
      // Horizontal constraint
      if (col1 > col2) {
        [col1, col2] = [col2, col1]
      }
    } else {
      // Vertical constraint
      if (row1 > row2) {
        [row1, row2, col1, col2] = [row2, row1, col2, col1]
      }
    }
    
    // Remove any existing constraint on this edge
    setConstraints(prev => ({
      equals: prev.equals.filter(c => 
        !((c[0] === row1 && c[1] === col1 && c[2] === row2 && c[3] === col2) ||
          (c[0] === row2 && c[1] === col2 && c[2] === row1 && c[3] === col1))
      ),
      notEquals: prev.notEquals.filter(c => 
        !((c[0] === row1 && c[1] === col1 && c[2] === row2 && c[3] === col2) ||
          (c[0] === row2 && c[1] === col2 && c[2] === row1 && c[3] === col1))
      )
    }))

    // Add new constraint (normalized)
    if (constraintType === 'equals') {
      setConstraints(prev => ({
        ...prev,
        equals: [...prev.equals, [row1, col1, row2, col2]]
      }))
    } else if (constraintType === 'notEquals') {
      setConstraints(prev => ({
        ...prev,
        notEquals: [...prev.notEquals, [row1, col1, row2, col2]]
      }))
    }
  }

  const handleConstraintRemove = (edge) => {
    const { row1, col1, row2, col2 } = edge
    setConstraints(prev => ({
      equals: prev.equals.filter(c => 
        !((c[0] === row1 && c[1] === col1 && c[2] === row2 && c[3] === col2) ||
          (c[0] === row2 && c[1] === col2 && c[2] === row1 && c[3] === col1))
      ),
      notEquals: prev.notEquals.filter(c => 
        !((c[0] === row1 && c[1] === col1 && c[2] === row2 && c[3] === col2) ||
          (c[0] === row2 && c[1] === col2 && c[2] === row1 && c[3] === col1))
      )
    }))
  }

  const clearGrid = () => {
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)))
    setConstraints({ equals: [], notEquals: [] })
    setIsComplete(false)
    setValidationError(null)
  }

  const handleSolve = () => {
    // Clear previous errors
    setValidationError(null)
    setIsSolving(true)

    // Validate starting position
    const validation = validateStartingPosition(grid, constraints, GRID_SIZE)
    
    if (!validation.isValid) {
      setValidationError(validation.errors.join('. '))
      setIsSolving(false)
      return
    }

    // Attempt to solve
    try {
      const solvedGrid = solvePuzzle(grid, constraints, GRID_SIZE)
      
      if (solvedGrid === null) {
        setValidationError('Puzzle could not be solved. The solver is not yet implemented or the puzzle is unsolvable.')
      } else {
        setGrid(solvedGrid)
        setIsComplete(checkWin(solvedGrid, GRID_SIZE))
        setValidationError(null)
      }
    } catch (error) {
      setValidationError(`Error solving puzzle: ${error.message}`)
    } finally {
      setIsSolving(false)
    }
  }

  return (
    <div className="game-container">
      <ConstraintToolbar 
        onDragStart={setDraggingConstraint}
        onDragEnd={() => setDraggingConstraint(null)}
      />
      
      <div className="game-board-wrapper">
        <div className="game-board">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="game-row">
              {row.map((cell, colIndex) => {
                const cellConstraints = {
                  equals: constraints.equals.filter(c => 
                    (c[0] === rowIndex && c[1] === colIndex) || 
                    (c[2] === rowIndex && c[3] === colIndex)
                  ),
                  notEquals: constraints.notEquals.filter(c => 
                    (c[0] === rowIndex && c[1] === colIndex) || 
                    (c[2] === rowIndex && c[3] === colIndex)
                  )
                }
                
                return (
                  <Cell
                    key={`${rowIndex}-${colIndex}`}
                    value={cell}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    constraints={constraints}
                    row={rowIndex}
                    col={colIndex}
                    gridSize={GRID_SIZE}
                    onEdgeDrop={handleEdgeDrop}
                    onConstraintRemove={handleConstraintRemove}
                    draggingConstraint={draggingConstraint}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="game-controls">
        <div className="control-buttons">
          <button className="reset-button" onClick={clearGrid}>
            Clear Grid
          </button>
          <button 
            className="solve-button" 
            onClick={handleSolve}
            disabled={isSolving}
          >
            {isSolving ? 'Solving...' : 'Solve Puzzle'}
          </button>
        </div>
        {validationError && (
          <div className="error-message">
            ⚠️ {validationError}
          </div>
        )}
        {isComplete && !validationError && (
          <div className="win-message">
            🎉 Puzzle solved!
          </div>
        )}
      </div>
      
      <div className="game-rules">
        <h3>Instructions:</h3>
        <ul>
          <li>Click cells to place sun ☀️ or moon 🌙 symbols</li>
          <li>Drag "=" or "×" from the toolbar and drop on edges between cells</li>
          <li>Click a constraint to remove it</li>
          <li>Each row and column must have equal suns and moons</li>
          <li>No more than two identical symbols in a row</li>
        </ul>
      </div>
    </div>
  )
}

export default GameBoard
