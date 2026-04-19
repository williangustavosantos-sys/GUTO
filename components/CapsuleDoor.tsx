"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface CapsuleDoorProps {
  onComplete?: () => void
}

const IDLE_MS = 1500
const OPEN_MS = 700

export default function CapsuleDoor({ onComplete }: CapsuleDoorProps) {
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    const idleTimer = setTimeout(() => setOpening(true), IDLE_MS)
    const doneTimer = setTimeout(() => onComplete?.(), IDLE_MS + OPEN_MS)

    return () => {
      clearTimeout(idleTimer)
      clearTimeout(doneTimer)
    }
  }, [onComplete])

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-white select-none pointer-events-none">
      {/* linhas geométricas sutis */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* brilho azul central */}
      <motion.div
        className="absolute w-[340px] h-[340px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.20) 0%, rgba(59,130,246,0.06) 40%, rgba(59,130,246,0) 75%)",
        }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [0.98, 1.03, 0.98] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* logo */}
      <motion.h1
        className="relative z-10 text-7xl sm:text-8xl font-black tracking-tighter text-transparent bg-clip-text"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #dbe7ff 0%, #8db3ff 35%, #d4e2ff 60%, #79a0ff 100%)",
          filter: "drop-shadow(0 0 16px rgba(59,130,246,0.35))",
        }}
        animate={{
          scale: [1, 1.04, 1],
          opacity: [0.86, 1, 0.86],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        GUTO
      </motion.h1>

      {/* porta tecnológica */}
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 bg-white border-r border-blue-100"
        animate={{ x: opening ? "-100%" : "0%" }}
        transition={{ duration: OPEN_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2 bg-white border-l border-blue-100"
        animate={{ x: opening ? "100%" : "0%" }}
        transition={{ duration: OPEN_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}