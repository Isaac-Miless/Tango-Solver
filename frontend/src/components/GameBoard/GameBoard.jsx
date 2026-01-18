import React, { useState } from 'react'
import Cell from '../Cell/Cell'
import ConstraintToolbar from '../ConstraintToolbar/ConstraintToolbar'
import { checkWin } from '../../utils/gameLogic'
import { validateStartingPosition } from '../../utils/validator'
import { solvePuzzle, getNextStep } from '../../utils/solver'
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
  const [lockedCells, setLockedCells] = useState(() => 
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  )
  const [stepByStepMode, setStepByStepMode] = useState(false)
  const [currentStep, setCurrentStep] = useState(null)
  const [highlightedCells, setHighlightedCells] = useState(new Set())
  const [solvingExplanation, setSolvingExplanation] = useState(null)

  const handleCellClick = (row, col) => {
    // Don't allow editing locked cells
    if (lockedCells[row][col]) {
      return
    }

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
    setLockedCells(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)))
    setStepByStepMode(false)
    setCurrentStep(null)
    setHighlightedCells(new Set())
    setSolvingExplanation(null)
  }

  const handleSolve = () => {
    // Clear previous errors
    setValidationError(null)
    setIsSolving(true)
    setStepByStepMode(false)
    setCurrentStep(null)
    setHighlightedCells(new Set())
    setSolvingExplanation(null)

    // Validate starting position
    const validation = validateStartingPosition(grid, constraints, GRID_SIZE)
    
    if (!validation.isValid) {
      setValidationError(validation.errors.join('. '))
      setIsSolving(false)
      return
    }

    // Lock all cells that have values (starting cells)
    const newLockedCells = grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => cell !== null)
    )
    setLockedCells(newLockedCells)

    // Attempt to solve
    try {
      const solvedGrid = solvePuzzle(grid, constraints, GRID_SIZE)
      
      if (solvedGrid === null) {
        // Unlock cells on failure
        setLockedCells(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)))
        setValidationError('Puzzle could not be solved.')
      } else {
        // Keep cells locked and update with solution
        setGrid(solvedGrid)
        setIsComplete(checkWin(solvedGrid, GRID_SIZE))
        setValidationError(null)
      }
    } catch (error) {
      // Unlock cells on error
      setLockedCells(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)))
      setValidationError(`Error solving puzzle: ${error.message}`)
    } finally {
      setIsSolving(false)
    }
  }

  const handleSolveStepByStep = () => {
    // Clear previous errors
    setValidationError(null)
    setStepByStepMode(true)
    setCurrentStep(null)
    setHighlightedCells(new Set())
    setSolvingExplanation(null)

    // Validate starting position
    const validation = validateStartingPosition(grid, constraints, GRID_SIZE)
    
    if (!validation.isValid) {
      setValidationError(validation.errors.join('. '))
      setStepByStepMode(false)
      return
    }

    // Lock all cells that have values (starting cells)
    const newLockedCells = grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => cell !== null)
    )
    setLockedCells(newLockedCells)

    // Get first step
    handleNextStep()
  }

  const handleNextStep = () => {
    try {
      const step = getNextStep(grid, constraints, GRID_SIZE)
      
      if (!step) {
        setValidationError('No more moves can be made. Puzzle may be unsolvable or complete.')
        setStepByStepMode(false)
        setCurrentStep(null)
        setHighlightedCells(new Set())
        setSolvingExplanation(null)
        return
      }

      // Apply the step
      const newGrid = grid.map(row => row.slice())
      newGrid[step.resultCell[0]][step.resultCell[1]] = step.resultValue
      setGrid(newGrid)

      // Set highlighting
      const highlightSet = new Set()
      step.affectedCells.forEach(([r, c]) => {
        highlightSet.add(`${r},${c}`)
      })
      highlightSet.add(`${step.resultCell[0]},${step.resultCell[1]}`)
      setHighlightedCells(highlightSet)

      // Set explanation
      setSolvingExplanation({
        ruleName: step.ruleName,
        explanation: step.explanation
      })
      setCurrentStep(step)

      // Check if complete
      if (checkWin(newGrid, GRID_SIZE)) {
        setIsComplete(true)
        setStepByStepMode(false)
        setHighlightedCells(new Set())
      }
    } catch (error) {
      setValidationError(`Error solving step: ${error.message}`)
      setStepByStepMode(false)
    }
  }

  const handleStopStepByStep = () => {
    setStepByStepMode(false)
    setCurrentStep(null)
    setHighlightedCells(new Set())
    setSolvingExplanation(null)
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
                
                const cellKey = `${rowIndex},${colIndex}`
                const isHighlighted = highlightedCells.has(cellKey)
                const isResultCell = currentStep && 
                  currentStep.resultCell[0] === rowIndex && 
                  currentStep.resultCell[1] === colIndex
                const isAffectedCell = currentStep && 
                  currentStep.affectedCells.some(([r, c]) => r === rowIndex && c === colIndex)

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
                    isLocked={lockedCells[rowIndex][colIndex]}
                    isHighlighted={isHighlighted}
                    isResultCell={isResultCell}
                    isAffectedCell={isAffectedCell}
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
          {!stepByStepMode ? (
            <>
              <button 
                className="solve-button" 
                onClick={handleSolve}
                disabled={isSolving}
              >
                {isSolving ? 'Solving...' : 'Solve All'}
              </button>
              <button 
                className="solve-button step-button" 
                onClick={handleSolveStepByStep}
                disabled={isSolving}
              >
                Solve Step-by-Step
              </button>
            </>
          ) : (
            <>
              <button 
                className="solve-button step-button" 
                onClick={handleNextStep}
              >
                Next Step
              </button>
              <button 
                className="reset-button" 
                onClick={handleStopStepByStep}
              >
                Stop
              </button>
            </>
          )}
        </div>
        {solvingExplanation && (
          <div className="solving-explanation">
            <div className="explanation-rule">{solvingExplanation.ruleName}</div>
            <div className="explanation-text">{solvingExplanation.explanation}</div>
          </div>
        )}
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
