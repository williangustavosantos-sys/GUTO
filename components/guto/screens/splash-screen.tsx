"use client"

import { motion } from "framer-motion"
import { ParticlesBackground } from "../particles-background"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,0.5) 50%, rgba(226,232,240,0.3) 100%)"
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ParticlesBackground />

      {/* Background geometric pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='%234B6BFB' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Central glow effect */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, oklch(0.70 0.18 200 / 0.5) 0%, transparent 70%)"
        }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* GUTO Logo */}
        <motion.h1 
          className="text-7xl font-black tracking-tight"
          style={{
            background: "linear-gradient(180deg, #c0d0e8 0%, #7a9cc9 25%, #a8c0dc 50%, #5a7fb0 75%, #8faed0 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 4px 30px oklch(0.50 0.10 240 / 0.3)",
            filter: "drop-shadow(0 2px 4px oklch(0.40 0.08 240 / 0.4))"
          }}
          animate={{
            textShadow: [
              "0 4px 30px oklch(0.50 0.10 240 / 0.3)",
              "0 4px 50px oklch(0.60 0.15 200 / 0.5)",
              "0 4px 30px oklch(0.50 0.10 240 / 0.3)",
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          GUTO
        </motion.h1>

        {/* Glow line under logo */}
        <motion.div
          className="mt-4 h-1 rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent 0%, #22d3ee 50%, transparent 100%)"
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 120, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />

        {/* Loading indicator */}
        <motion.div
          className="mt-8 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/60"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Auto advance after animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        onAnimationComplete={onComplete}
      />
    </motion.div>
  )
}
