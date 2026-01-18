import React, { useState, useRef, useEffect } from 'react'
import Cell from '../Cell/Cell'
import ConstraintToolbar from '../ConstraintToolbar/ConstraintToolbar'
import StepHistoryPanel from '../StepHistoryPanel/StepHistoryPanel'
import { checkWin } from '../../utils/gameLogic'
import { validateStartingPosition } from '../../utils/validator'
import { solvePuzzle, solvePuzzleStepByStep, getNextStep } from '../../utils/solver'
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
  const [allSteps, setAllSteps] = useState([])
  const [viewingStepIndex, setViewingStepIndex] = useState(null)
  const [isViewingHistory, setIsViewingHistory] = useState(false)
  const [initialGrid, setInitialGrid] = useState(null)
  const [latestGrid, setLatestGrid] = useState(null) // Track the latest/final grid state
  const boardRef = useRef(null)
  const stepHistoryWrapperRef = useRef(null)
  
  // Match step history width to board width when stacked, and height to board height
  useEffect(() => {
    const matchDimensions = () => {
      if (boardRef.current && stepHistoryWrapperRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect()
        const boardWidth = boardRect.width
        const boardHeight = boardRect.height
        
        if (window.innerWidth <= 1024) {
          // When stacked (mobile/tablet), match width
          if (boardWidth > 0) {
            stepHistoryWrapperRef.current.style.width = `${boardWidth}px`
            stepHistoryWrapperRef.current.style.maxWidth = `${boardWidth}px`
            stepHistoryWrapperRef.current.style.minWidth = `${boardWidth}px`
          }
        } else {
          // When side-by-side (desktop), reset width but match height
          stepHistoryWrapperRef.current.style.width = ''
          stepHistoryWrapperRef.current.style.maxWidth = ''
          stepHistoryWrapperRef.current.style.minWidth = ''
        }
        
        // Always match height to board height (for max-height of panel)
        if (boardHeight > 0 && stepHistoryWrapperRef.current) {
          const stepHistoryPanel = stepHistoryWrapperRef.current.querySelector('.step-history-panel')
          if (stepHistoryPanel) {
            stepHistoryPanel.style.maxHeight = `${boardHeight}px`
          }
        }
      }
    }
    
    // Use requestAnimationFrame to ensure DOM is fully rendered
    const rafId = requestAnimationFrame(() => {
      matchDimensions()
      // Also check after a small delay to catch any late renders
      setTimeout(matchDimensions, 100)
    })
    
    window.addEventListener('resize', matchDimensions)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', matchDimensions)
    }
  }, [grid, allSteps.length, isViewingHistory])

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
    setAllSteps([])
    setViewingStepIndex(null)
    setIsViewingHistory(false)
    setInitialGrid(null)
    setLatestGrid(null)
  }

  const handleSolve = () => {
    // Clear previous errors
    setValidationError(null)
    setIsSolving(true)
    setStepByStepMode(false)
    setCurrentStep(null)
    setHighlightedCells(new Set())
    setSolvingExplanation(null)
    setViewingStepIndex(null)
    setIsViewingHistory(false)

    // Check if puzzle is already solved
    if (checkWin(grid, GRID_SIZE)) {
      setValidationError('Puzzle is already solved!')
      setIsSolving(false)
      return
    }

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
    
    // Save initial grid state
    setInitialGrid(grid.map(row => row.slice()))

    // Attempt to solve and get all steps
    try {
      const steps = solvePuzzleStepByStep(grid, constraints, GRID_SIZE)
      setAllSteps(steps)
      
      if (steps.length === 0) {
        // Unlock cells on failure
        setLockedCells(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)))
        setValidationError('Puzzle could not be solved.')
      } else {
        // Apply all steps to get final solution
        const solvedGrid = grid.map(row => row.slice())
        steps.forEach(step => {
          solvedGrid[step.resultCell[0]][step.resultCell[1]] = step.resultValue
        })
        
        // Keep cells locked and update with solution
        setGrid(solvedGrid)
        setLatestGrid(solvedGrid.map(row => row.slice())) // Store latest grid
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
    setAllSteps([])
    setViewingStepIndex(null)
    setIsViewingHistory(false)

    // Check if puzzle is already solved
    if (checkWin(grid, GRID_SIZE)) {
      setValidationError('Puzzle is already solved!')
      setStepByStepMode(false)
      return
    }

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
    
    // Save initial grid state
    const initialGridState = grid.map(row => row.slice())
    setInitialGrid(initialGridState)
    setLatestGrid(initialGridState) // Initialize latest grid to starting state

    // Get first step
    handleNextStep()
  }

  const handleNextStep = () => {
    try {
      // If viewing history, use the latest grid state instead of current displayed grid
      const gridToUse = isViewingHistory && latestGrid ? latestGrid : grid
      
      const step = getNextStep(gridToUse, constraints, GRID_SIZE)
      
      if (!step) {
        setValidationError('No more moves can be made. Puzzle may be unsolvable or complete.')
        setStepByStepMode(false)
        setCurrentStep(null)
        setHighlightedCells(new Set())
        setSolvingExplanation(null)
        return
      }

      // If we were viewing history, exit history view first
      if (isViewingHistory) {
        setIsViewingHistory(false)
        setViewingStepIndex(null)
        // Restore to latest grid state
        if (latestGrid) {
          setGrid(latestGrid.map(row => row.slice()))
        }
      }

      // Add step to history
      setAllSteps(prev => [...prev, step])

      // Apply the step to the grid we're using
      const newGrid = gridToUse.map(row => row.slice())
      newGrid[step.resultCell[0]][step.resultCell[1]] = step.resultValue
      setGrid(newGrid)
      setLatestGrid(newGrid.map(row => row.slice())) // Update latest grid

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
    setIsViewingHistory(false)
    setViewingStepIndex(null)
  }

  const handleStepClick = (stepIndex) => {
    if (stepIndex < 0 || stepIndex >= allSteps.length) return

    const step = allSteps[stepIndex]
    setIsViewingHistory(true)
    setViewingStepIndex(stepIndex)

    // Show the grid state after this step (so user can see the move that was made)
    if (step.gridStateAfter) {
      setGrid(step.gridStateAfter.map(row => row.slice()))
    } else if (step.gridStateBefore) {
      // Fallback: if after state not available, use before and apply the step
      const gridAfter = step.gridStateBefore.map(row => row.slice())
      gridAfter[step.resultCell[0]][step.resultCell[1]] = step.resultValue
      setGrid(gridAfter)
    }

    // Set highlighting for this step
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
  }

  const handleExitHistoryView = () => {
    setIsViewingHistory(false)
    setViewingStepIndex(null)
    setHighlightedCells(new Set())
    setSolvingExplanation(null)
    setCurrentStep(null)
    
    // Restore to final state (apply all steps from initial grid)
    if (allSteps.length > 0 && initialGrid) {
      const finalGrid = initialGrid.map(row => row.slice())
      allSteps.forEach(step => {
        finalGrid[step.resultCell[0]][step.resultCell[1]] = step.resultValue
      })
      setGrid(finalGrid)
    }
  }

  return (
    <div className="game-container">
      <ConstraintToolbar 
        onDragStart={setDraggingConstraint}
        onDragEnd={() => setDraggingConstraint(null)}
      />
      
      <div className="game-layout">
        <div className="game-board-wrapper">
          <div className="game-board" ref={boardRef}>
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
        
        {allSteps.length > 0 && (
          <div className="step-history-wrapper" ref={stepHistoryWrapperRef}>
            {isViewingHistory && (
              <button 
                className="exit-history-button"
                onClick={handleExitHistoryView}
              >
                Exit History View
              </button>
            )}
            <StepHistoryPanel
              steps={allSteps}
              selectedStepIndex={viewingStepIndex}
              onStepClick={handleStepClick}
            />
          </div>
        )}
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
