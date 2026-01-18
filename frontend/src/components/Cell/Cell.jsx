import React, { useState } from 'react'
import './Cell.css'

function Cell({ 
  value, 
  onClick, 
  constraints, 
  row, 
  col, 
  gridSize,
  onEdgeDrop,
  onConstraintRemove,
  draggingConstraint,
  isLocked,
  isHighlighted,
  isResultCell,
  isAffectedCell
}) {
  const [hoveredEdge, setHoveredEdge] = useState(null)

  const getSymbol = () => {
    if (value === 'sun') return '☀️'
    if (value === 'moon') return '🌙'
    return ''
  }

  const getEdgeConstraint = (edge) => {
    // Constraints are normalized: always stored with first cell having smaller indices
    // Only render on the first cell's appropriate edge to avoid duplicates
    // Horizontal constraints: render on first cell's right edge
    // Vertical constraints: render on first cell's bottom edge
    
    // Check equals constraints
    for (const [r1, c1, r2, c2] of constraints.equals) {
      // Check if this cell is the first cell and edge matches
      if (row === r1 && col === c1) {
        if (r1 === r2 && edge === 'right' && c2 === col + 1) {
          // Horizontal constraint
          return { type: 'equals', edge: { row1: r1, col1: c1, row2: r2, col2: c2 } }
        }
        if (c1 === c2 && edge === 'bottom' && r2 === row + 1) {
          // Vertical constraint
          return { type: 'equals', edge: { row1: r1, col1: c1, row2: r2, col2: c2 } }
        }
      }
    }
    
    // Check notEquals constraints
    for (const [r1, c1, r2, c2] of constraints.notEquals) {
      // Check if this cell is the first cell and edge matches
      if (row === r1 && col === c1) {
        if (r1 === r2 && edge === 'right' && c2 === col + 1) {
          // Horizontal constraint
          return { type: 'notEquals', edge: { row1: r1, col1: c1, row2: r2, col2: c2 } }
        }
        if (c1 === c2 && edge === 'bottom' && r2 === row + 1) {
          // Vertical constraint
          return { type: 'notEquals', edge: { row1: r1, col1: c1, row2: r2, col2: c2 } }
        }
      }
    }
    
    return null
  }

  const handleEdgeDragOver = (e, edge) => {
    e.preventDefault()
    e.stopPropagation()
    setHoveredEdge(edge)
  }

  const handleEdgeDragLeave = () => {
    setHoveredEdge(null)
  }

  const handleEdgeDrop = (e, edge) => {
    e.preventDefault()
    e.stopPropagation()
    setHoveredEdge(null)
    
    const constraintType = e.dataTransfer.getData('constraintType')
    if (!constraintType) return

    let edgeData = null
    if (edge === 'right' && col < gridSize - 1) {
      edgeData = { row1: row, col1: col, row2: row, col2: col + 1 }
    } else if (edge === 'left' && col > 0) {
      edgeData = { row1: row, col1: col - 1, row2: row, col2: col }
    } else if (edge === 'bottom' && row < gridSize - 1) {
      edgeData = { row1: row, col1: col, row2: row + 1, col2: col }
    } else if (edge === 'top' && row > 0) {
      edgeData = { row1: row - 1, col1: col, row2: row, col2: col }
    }

    if (edgeData && onEdgeDrop) {
      onEdgeDrop(edgeData, constraintType)
    }
  }

  const handleConstraintClick = (e, edge) => {
    e.stopPropagation()
    const constraint = getEdgeConstraint(edge)
    if (constraint && onConstraintRemove) {
      onConstraintRemove(constraint.edge)
    }
  }

  const renderEdge = (edge) => {
    const constraint = getEdgeConstraint(edge)
    const isHovered = hoveredEdge === edge
    const canDrop = draggingConstraint && (
      (edge === 'right' && col < gridSize - 1) ||
      (edge === 'left' && col > 0) ||
      (edge === 'bottom' && row < gridSize - 1) ||
      (edge === 'top' && row > 0)
    )

    return (
      <div
        className={`edge edge-${edge} ${isHovered && canDrop ? 'edge-hover' : ''} ${constraint ? 'edge-has-constraint' : ''}`}
        onDragOver={(e) => handleEdgeDragOver(e, edge)}
        onDragLeave={handleEdgeDragLeave}
        onDrop={(e) => handleEdgeDrop(e, edge)}
        onClick={(e) => constraint && handleConstraintClick(e, edge)}
      >
        {constraint && (
          <span className={`edge-constraint edge-constraint-${constraint.type} edge-constraint-${edge}`}>
            {constraint.type === 'equals' ? '=' : '×'}
          </span>
        )}
        {isHovered && canDrop && (
          <span className="edge-drop-indicator">
            {draggingConstraint === 'equals' ? '=' : '×'}
          </span>
        )}
      </div>
    )
  }

  const cellClasses = [
    'cell',
    value ? `cell-${value}` : '',
    isLocked ? 'cell-locked' : '',
    isHighlighted ? 'cell-highlighted' : '',
    isResultCell ? 'cell-result' : '',
    isAffectedCell ? 'cell-affected' : ''
  ].filter(Boolean).join(' ')

  return (
    <div 
      className={cellClasses}
      onClick={onClick}
    >
      <span className="cell-symbol">{getSymbol()}</span>
      
      {/* Edge drop zones */}
      {renderEdge('top')}
      {renderEdge('right')}
      {renderEdge('bottom')}
      {renderEdge('left')}
    </div>
  )
}

export default Cell
