import React, { useMemo, useRef, useState } from 'react'
import PuzzleGrid from '../PuzzleGrid/PuzzleGrid'
import Confetti from '../Confetti/Confetti'
import { generatePuzzle } from '../../utils/generator'
import { checkWin } from '../../utils/gameLogic'
import './UnlimitedMode.css'

const GRID_SIZE = 6

function UnlimitedMode() {
  const [puzzle, setPuzzle] = useState(() => generatePuzzle(GRID_SIZE))
  const [grid, setGrid] = useState(() => puzzle.grid.map(row => row.slice()))
  const [isComplete, setIsComplete] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiTimeoutRef = useRef(null)

  // A cell is locked iff the generator revealed it as a starting clue.
  const lockedCells = useMemo(
    () => puzzle.grid.map(row => row.map(cell => cell !== null)),
    [puzzle]
  )

  const triggerConfetti = () => {
    if (confettiTimeoutRef.current) {
      clearTimeout(confettiTimeoutRef.current)
    }
    setShowConfetti(true)
    confettiTimeoutRef.current = setTimeout(() => {
      setShowConfetti(false)
      confettiTimeoutRef.current = null
    }, 3000)
  }

  const stopConfetti = () => {
    if (confettiTimeoutRef.current) {
      clearTimeout(confettiTimeoutRef.current)
      confettiTimeoutRef.current = null
    }
    setShowConfetti(false)
  }

  const handleCellClick = (row, col) => {
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

    const complete = checkWin(newGrid, puzzle.constraints, GRID_SIZE)
    setIsComplete(complete)
    if (complete) {
      triggerConfetti()
    }
  }

  const handleNewPuzzle = () => {
    const next = generatePuzzle(GRID_SIZE)
    setPuzzle(next)
    setGrid(next.grid.map(row => row.slice()))
    setIsComplete(false)
    stopConfetti()
  }

  const handleReset = () => {
    setGrid(puzzle.grid.map(row => row.slice()))
    setIsComplete(false)
    stopConfetti()
  }

  return (
    <div className="unlimited-container">
      <Confetti active={showConfetti} />

      <PuzzleGrid
        grid={grid}
        constraints={puzzle.constraints}
        gridSize={GRID_SIZE}
        onCellClick={handleCellClick}
        lockedCells={lockedCells}
      />

      <div className="unlimited-controls">
        <div className="control-buttons">
          <button className="reset-button" onClick={handleReset}>
            Reset Puzzle
          </button>
          <button className="solve-button" onClick={handleNewPuzzle}>
            New Puzzle
          </button>
        </div>
        {isComplete && (
          <div className="win-message">🎉 Puzzle solved!</div>
        )}
      </div>
    </div>
  )
}

export default UnlimitedMode
