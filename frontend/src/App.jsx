import React, { useState } from 'react'
import GameBoard from './components/GameBoard/GameBoard'
import Header from './components/Header/Header'
import ModeNav from './components/ModeNav/ModeNav'
import LearnMode from './components/LearnMode/LearnMode'
import UnlimitedMode from './components/UnlimitedMode/UnlimitedMode'
import './App.css'

function App() {
  const [mode, setMode] = useState('solver')

  return (
    <div className="app">
      <Header />
      <ModeNav mode={mode} onModeChange={setMode} />
      <main className="main-content">
        {/* All three stay mounted so switching modes never loses in-progress
            Solver state (grid, constraints, step history) — only visibility
            toggles. */}
        <div className={mode === 'solver' ? 'mode-view' : 'mode-view mode-view-hidden'}>
          <GameBoard />
        </div>
        <div className={mode === 'learn' ? 'mode-view' : 'mode-view mode-view-hidden'}>
          <LearnMode />
        </div>
        <div className={mode === 'unlimited' ? 'mode-view' : 'mode-view mode-view-hidden'}>
          <UnlimitedMode />
        </div>
      </main>
    </div>
  )
}

export default App

