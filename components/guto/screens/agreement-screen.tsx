"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Fingerprint } from "lucide-react"
import { ParticlesBackground } from "../particles-background"

interface AgreementScreenProps {
  userName: string
  language?: string
  onComplete: () => void
}

const commitmentTexts: Record<
  string,
  { title: string; subtitle: string; instruction: string; complete: string }
> = {
  "pt-BR": {
    title: "Sem volta.",
    subtitle: "A gente executa.",
    instruction: "Segure para confirmar o acordo",
    complete: "Pacto selado.",
  },
  "it-IT": {
    title: "Senza ritorno.",
    subtitle: "Noi eseguiamo.",
    instruction: "Tieni premuto per confermare l'accordo",
    complete: "Patto suggellato.",
  },
  "es-ES": {
    title: "Sin vuelta atrás.",
    subtitle: "Nosotros ejecutamos.",
    instruction: "Mantén presionado para confirmar el acuerdo",
    complete: "Pacto sellado.",
  },
  "en-US": {
    title: "No turning back.",
    subtitle: "We execute.",
    instruction: "Hold to confirm the agreement",
    complete: "Pact sealed.",
  },
}

const HOLD_TOTAL_MS = 1600
const STEP_MS = 16
const INCREMENT = (STEP_MS / HOLD_TOTAL_MS) * 100

export function AgreementScreen({ userName, language = "pt-BR", onComplete }: AgreementScreenProps) {
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const commitment = useMemo(
    () => commitmentTexts[language] ?? commitmentTexts["pt-BR"],
    [language]
  )

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const completePact = useCallback(() => {
    setIsComplete(true)
    setIsHolding(false)
    clearTimer()
    setTimeout(onComplete, 420)
  }, [onComplete])

  const startHold = useCallback(() => {
    if (isComplete || isHolding) return

    setIsHolding(true)
    intervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        const next = Math.min(prev + INCREMENT, 100)
        if (next >= 100) completePact()
        return next
      })
    }, STEP_MS)
  }, [isComplete, isHolding, completePact])

  const endHold = useCallback(() => {
    if (isComplete) return
    setIsHolding(false)
    clearTimer()
    setHoldProgress(0)
  }, [isComplete])

  return (
    <motion.section
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden px-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,0.5) 50%, rgba(226,232,240,0.3) 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ParticlesBackground />

      <div
        className="absolute inset-4 rounded-3xl opacity-20"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, oklch(0.70 0.10 200 / 0.1) 50%, transparent 100%)",
          border: "1px solid oklch(0.70 0.10 200 / 0.2)",
        }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.45 }}
      >
        <motion.div
          className="mb-8"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.45 }}
        >
          <h1
            className="text-5xl font-black tracking-tight"
            style={{
              background:
                "linear-gradient(180deg, #c0d0e8 0%, #7a9cc9 25%, #a8c0dc 50%, #5a7fb0 75%, #8faed0 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 2px 4px oklch(0.40 0.08 240 / 0.4))",
            }}
          >
            GUTO
          </h1>
          <span className="text-muted-foreground/50 text-lg">&</span>
          <h2
            className="text-4xl font-light italic tracking-wide max-w-[90vw] break-words"
            style={{
              background: "linear-gradient(180deg, #b8c8d8 0%, #8aa0b8 50%, #a0b8c8 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {userName}
          </h2>
        </motion.div>

        <motion.div
          className="mb-16 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-2xl font-semibold text-foreground/80">{commitment.title}</p>
          <p className="text-lg text-muted-foreground/60">{commitment.subtitle}</p>
        </motion.div>

        <motion.div
          className="relative"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
        >
          <div
            className="absolute inset-0 -m-8 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, oklch(0.70 0.18 200 / ${holdProgress / 100}) ${
                holdProgress * 3.6
              }deg, transparent ${holdProgress * 3.6}deg)`,
            }}
          />

          <svg className="absolute inset-0 -m-4 w-[calc(100%+32px)] h-[calc(100%+32px)]" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="oklch(0.70 0.18 200 / 0.2)" strokeWidth="4" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="oklch(0.70 0.18 200)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={339.292}
              strokeDashoffset={339.292 * (1 - holdProgress / 100)}
              transform="rotate(-90 60 60)"
              style={{ filter: "drop-shadow(0 0 8px oklch(0.70 0.18 200 / 0.6))" }}
            />
          </svg>

          <motion.button
            type="button"
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onPointerCancel={endHold}
            className="relative w-24 h-24 rounded-full glass-strong flex items-center justify-center transition-all touch-none"
            animate={{
              scale: isHolding ? 0.96 : 1,
              boxShadow: isHolding
                ? "0 0 40px oklch(0.70 0.18 200 / 0.5), inset 0 0 20px oklch(0.70 0.18 200 / 0.2)"
                : "0 8px 30px oklch(0.50 0.08 240 / 0.15)",
            }}
            whileHover={{ scale: isComplete ? 1 : 1.03 }}
            disabled={isComplete}
            aria-label="Segurar para selar pacto"
          >
            <motion.div
              animate={{ scale: isHolding ? [1, 1.15, 1] : 1 }}
              transition={{ duration: 0.55, repeat: isHolding ? Infinity : 0 }}
            >
              <Fingerprint
                className={`w-10 h-10 transition-colors ${
                  isComplete ? "text-green-500" : isHolding ? "text-cyan-400" : "text-primary/60"
                }`}
              />
            </motion.div>
          </motion.button>

          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 rounded-full opacity-60"
            style={{
              background: "radial-gradient(ellipse at center, oklch(0.70 0.18 200 / 0.4) 0%, transparent 70%)",
            }}
          />
        </motion.div>

        <motion.p
          className="mt-8 text-sm text-muted-foreground/50 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          {isComplete ? commitment.complete : commitment.instruction}
        </motion.p>
      </motion.div>
    </motion.section>
  )
}