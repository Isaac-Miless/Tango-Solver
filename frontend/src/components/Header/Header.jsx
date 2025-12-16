import React from 'react'
import './Header.css'

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">
          <span className="sun-emoji">☀️</span>
          Tango
          <span className="moon-emoji">🌙</span>
        </h1>
        <p className="header-subtitle">Logic Puzzle Game</p>
      </div>
    </header>
  )
}

export default Header

