import React from 'react'
import './ModeNav.css'

const MODES = [
  { id: 'solver', label: 'Solver' },
  { id: 'learn', label: 'Learn' },
  { id: 'unlimited', label: 'Unlimited' },
]

function ModeNav({ mode, onModeChange }) {
  return (
    <nav className="mode-nav" aria-label="App mode">
      {MODES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`mode-nav-button${mode === id ? ' active' : ''}`}
          onClick={() => onModeChange(id)}
          aria-pressed={mode === id}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}

export default ModeNav
