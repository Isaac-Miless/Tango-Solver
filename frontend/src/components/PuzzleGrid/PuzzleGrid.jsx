import React from 'react'
import Cell from '../Cell/Cell'
import './PuzzleGrid.css'

/**
 * Renders a Tango grid of Cell components. Shared by GameBoard (Solver
 * mode, where constraints are editable and solver steps get highlighted)
 * and UnlimitedMode (where constraints are fixed puzzle clues and there's
 * no solver highlighting) — onEdgeDrop/onConstraintRemove/draggingConstraint
 * and highlightedCells/currentStep are all optional, since Cell already
 * no-ops safely when they're omitted.
 */
function PuzzleGrid({
  grid,
  constraints,
  gridSize,
  onCellClick,
  lockedCells,
  highlightedCells,
  currentStep,
  onEdgeDrop,
  onConstraintRemove,
  draggingConstraint,
  boardRef,
}) {
  return (
    <div className="puzzle-grid" ref={boardRef}>
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="puzzle-grid-row">
          {row.map((cell, colIndex) => {
            const cellKey = `${rowIndex},${colIndex}`
            const isHighlighted = Boolean(highlightedCells && highlightedCells.has(cellKey))
            const isResultCell = Boolean(
              currentStep &&
              currentStep.resultCell[0] === rowIndex &&
              currentStep.resultCell[1] === colIndex
            )
            const isAffectedCell = Boolean(
              currentStep &&
              currentStep.affectedCells.some(([r, c]) => r === rowIndex && c === colIndex)
            )

            return (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                value={cell}
                onClick={() => onCellClick(rowIndex, colIndex)}
                constraints={constraints}
                row={rowIndex}
                col={colIndex}
                gridSize={gridSize}
                onEdgeDrop={onEdgeDrop}
                onConstraintRemove={onConstraintRemove}
                draggingConstraint={draggingConstraint}
                isLocked={lockedCells ? lockedCells[rowIndex][colIndex] : false}
                isHighlighted={isHighlighted}
                isResultCell={isResultCell}
                isAffectedCell={isAffectedCell}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default PuzzleGrid
