import React from 'react'
import GameBoard from './components/GameBoard/GameBoard'
import Header from './components/Header/Header'
import './App.css'

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <GameBoard />
      </main>
    </div>
  )
}

export default App

