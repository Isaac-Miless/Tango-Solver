import React from 'react'
import './ConstraintToolbar.css'

function ConstraintToolbar({ onDragStart, onDragEnd }) {
  const handleDragStart = (e, type) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('constraintType', type)
    onDragStart(type)
  }

  const handleDragEnd = () => {
    onDragEnd()
  }

  return (
    <div className="constraint-toolbar">
      <h3 className="toolbar-title">Constraints</h3>
      <div className="toolbar-items">
        <div 
          className="constraint-item constraint-equals"
          draggable
          onDragStart={(e) => handleDragStart(e, 'equals')}
          onDragEnd={handleDragEnd}
        >
          <span className="constraint-symbol">=</span>
          <span className="constraint-label">Same</span>
        </div>
        <div 
          className="constraint-item constraint-not-equals"
          draggable
          onDragStart={(e) => handleDragStart(e, 'notEquals')}
          onDragEnd={handleDragEnd}
        >
          <span className="constraint-symbol">×</span>
          <span className="constraint-label">Different</span>
        </div>
      </div>
    </div>
  )
}

export default ConstraintToolbar

