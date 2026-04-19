"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"

interface CapsuleDoorProps {
  onComplete?: () => void
}

export default function CapsuleDoor({ onComplete }: CapsuleDoorProps) {

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete()
      } 
    }, 2000)

    // Limpeza de memória caso o componente seja desmontado antes do tempo
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white overflow-hidden select-none pointer-events-none">
      <motion.h1
        className="text-8xl font-black tracking-tighter bg-linear-to-b from-gray-300 via-gray-100 to-gray-400 text-transparent bg-clip-text drop-shadow-sm"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        GUTO
      </motion.h1>
    </div>
  )
}