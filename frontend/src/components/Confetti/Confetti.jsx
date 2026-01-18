import React, { useEffect, useState } from 'react'
import './Confetti.css'

function Confetti({ active }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (!active) {
      setParticles([])
      return
    }

    // Create 50 confetti particles
    const colors = ['#667eea', '#764ba2', '#4caf50', '#2196f3', '#ff9800', '#f44336', '#ffeb3b']
    const newParticles = Array.from({ length: 50 }, (_, i) => {
      const initialRotation = Math.random() * 360
      const rotationSpeed = (Math.random() - 0.5) * 720
      return {
        id: i,
        left: Math.random() * 100, // Random horizontal position (0-100%)
        delay: Math.random() * 0.5, // Random delay (0-0.5s)
        duration: 2 + Math.random() * 1, // Random duration (2-3s)
        color: colors[Math.floor(Math.random() * colors.length)],
        initialRotation,
        finalRotation: initialRotation + rotationSpeed * 2, // Total rotation after animation
      }
    })

    setParticles(newParticles)

    // Clear particles after animation completes
    const timeout = setTimeout(() => {
      setParticles([])
    }, 4000)

    return () => clearTimeout(timeout)
  }, [active])

  if (!active || particles.length === 0) {
    return null
  }

  return (
    <div className="confetti-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="confetti-particle"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            backgroundColor: particle.color,
            '--initial-rotation': `${particle.initialRotation}deg`,
            '--final-rotation': `${particle.finalRotation}deg`,
          }}
        />
      ))}
    </div>
  )
}

export default Confetti
