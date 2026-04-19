"use client"

import { useEffect, useState } from "react"

interface Particle {
  id: number
  x: number
  y: number
  delay: number
  duration: number
  size: number
}

export function ParticlesBackground() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const generated: Particle[] = []
    for (let i = 0; i < 30; i++) {
      generated.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100 + 100,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 6,
        size: 2 + Math.random() * 3,
      })
    }
    setParticles(generated)
  }, [])

  return (
    <div className="particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
