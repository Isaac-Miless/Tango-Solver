import React, { useEffect, useMemo, useRef, useState } from 'react'
import PuzzleGrid from '../PuzzleGrid/PuzzleGrid'
import Confetti from '../Confetti/Confetti'
import { generatePuzzle } from '../../utils/generator'
import { checkWin } from '../../utils/gameLogic'
import { validateStartingPosition } from '../../utils/validator'
import { getNextStep } from '../../utils/solver'
import './UnlimitedMode.css'

const GRID_SIZE = 6
const HINT_COOLDOWN_SECONDS = 10

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function UnlimitedMode() {
  const [puzzle, setPuzzle] = useState(() => generatePuzzle(GRID_SIZE))
  const [grid, setGrid] = useState(() => puzzle.grid.map(row => row.slice()))
  const [isComplete, setIsComplete] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiTimeoutRef = useRef(null)

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerIntervalRef = useRef(null)

  const [hintMessage, setHintMessage] = useState(null)
  const [hintStep, setHintStep] = useState(null)
  const [hintCooldown, setHintCooldown] = useState(0)
  const hintCooldownIntervalRef = useRef(null)

  // A cell is locked iff the generator revealed it as a starting clue.
  const lockedCells = useMemo(
    () => puzzle.grid.map(row => row.map(cell => cell !== null)),
    [puzzle]
  )

  const hintHighlightedCells = useMemo(() => {
    const set = new Set()
    if (!hintStep) return set
    hintStep.affectedCells.forEach(([r, c]) => set.add(`${r},${c}`))
    set.add(`${hintStep.resultCell[0]},${hintStep.resultCell[1]}`)
    return set
  }, [hintStep])

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }

  const startTimer = () => {
    stopTimer()
    setElapsedSeconds(0)
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1)
    }, 1000)
  }

  // Start the timer once on mount; stopped on unmount for cleanliness (this
  // view never actually unmounts in practice — see Phase A — but a real
  // interval leak is worth guarding regardless).
  useEffect(() => {
    startTimer()
    return stopTimer
  }, [])

  const clearHint = () => {
    setHintMessage(null)
    setHintStep(null)
  }

  const stopHintCooldown = () => {
    if (hintCooldownIntervalRef.current) {
      clearInterval(hintCooldownIntervalRef.current)
      hintCooldownIntervalRef.current = null
    }
    setHintCooldown(0)
  }

  const startHintCooldown = () => {
    if (hintCooldownIntervalRef.current) {
      clearInterval(hintCooldownIntervalRef.current)
    }
    setHintCooldown(HINT_COOLDOWN_SECONDS)
    hintCooldownIntervalRef.current = setInterval(() => {
      setHintCooldown(s => (s <= 1 ? 0 : s - 1))
    }, 1000)
  }

  // Clearing the interval is a side effect, kept out of the setHintCooldown
  // updater above (which StrictMode can invoke twice) and done here instead,
  // once the state it depends on has actually committed.
  useEffect(() => {
    if (hintCooldown === 0 && hintCooldownIntervalRef.current) {
      clearInterval(hintCooldownIntervalRef.current)
      hintCooldownIntervalRef.current = null
    }
  }, [hintCooldown])

  // Stop all intervals on unmount (defensive — see startTimer's comment).
  useEffect(() => {
    return () => {
      stopTimer()
      stopHintCooldown()
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current)
      }
    }
  }, [])

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
    if (isComplete || lockedCells[row][col]) {
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
    clearHint()

    const complete = checkWin(newGrid, puzzle.constraints, GRID_SIZE)
    setIsComplete(complete)
    if (complete) {
      stopTimer()
      triggerConfetti()
    }
  }

  const handleNewPuzzle = () => {
    const next = generatePuzzle(GRID_SIZE)
    setPuzzle(next)
    setGrid(next.grid.map(row => row.slice()))
    setIsComplete(false)
    stopConfetti()
    clearHint()
    stopHintCooldown()
    startTimer()
  }

  const handleReset = () => {
    setGrid(puzzle.grid.map(row => row.slice()))
    setIsComplete(false)
    stopConfetti()
    clearHint()
    startTimer()
  }

  const handleHint = () => {
    if (hintCooldown > 0 || isComplete) {
      return
    }

    const validation = validateStartingPosition(grid, puzzle.constraints, GRID_SIZE)
    if (!validation.isValid) {
      setHintMessage(validation.errors.join('. '))
      setHintStep(null)
    } else {
      const step = getNextStep(grid, puzzle.constraints, GRID_SIZE)
      if (step) {
        setHintStep(step)
        setHintMessage(null)
      } else {
        // The clues alone are always solvable by pure deduction (the
        // generator guarantees this), so reaching a valid, incomplete grid
        // with no forced move means some earlier placement — while not
        // breaking any rule — doesn't match the actual solution.
        setHintMessage("No forced move from here. One of your placements may not match the solution, even though it doesn't break a rule.")
        setHintStep(null)
      }
    }

    startHintCooldown()
  }

  return (
    <div className="unlimited-container">
      <Confetti active={showConfetti} />

      <div className="unlimited-timer">⏱ {formatTime(elapsedSeconds)}</div>

      <PuzzleGrid
        grid={grid}
        constraints={puzzle.constraints}
        gridSize={GRID_SIZE}
        onCellClick={handleCellClick}
        lockedCells={lockedCells}
        highlightedCells={hintHighlightedCells}
        currentStep={hintStep}
      />

      <div className="unlimited-controls">
        <div className="control-buttons">
          <button className="reset-button" onClick={handleReset}>
            Reset Puzzle
          </button>
          <button
            className="hint-button"
            onClick={handleHint}
            disabled={hintCooldown > 0 || isComplete}
          >
            {hintCooldown > 0 ? `Hint (${hintCooldown}s)` : 'Hint'}
          </button>
          <button className="solve-button" onClick={handleNewPuzzle}>
            New Puzzle
          </button>
        </div>

        {hintStep && (
          <div className="solving-explanation">
            <div className="explanation-rule">{hintStep.ruleName}</div>
            <div className="explanation-text">{hintStep.explanation}</div>
            <div className="explanation-caveat">
              Assumes your current entries are correct — if one isn't, this
              move follows from the mistake, not from the real solution.
            </div>
          </div>
        )}

        {hintMessage && (
          <div className="error-message">{hintMessage}</div>
        )}

        {isComplete && (
          <div className="win-message">
            🎉 Puzzle solved in {formatTime(elapsedSeconds)}!
          </div>
        )}
      </div>
    </div>
  )
}

export default UnlimitedMode
