"use client"

import { useEffect, useMemo, useState } from "react"
import { MessageCircle, Plus, SkipForward } from "lucide-react"

import type { GutoWorkoutExercise } from "@/lib/api/guto"

interface GutoOnlineRestModeProps {
  restEndsAt: number | null
  restPlannedSeconds: number | null
  currentExercise: GutoWorkoutExercise | undefined
  nextSetNumber: number
  totalSets: number
  remainingSetsInExercise: number
  language?: string
  onExtend: (seconds: number) => void
  onSkip: () => void
  onTalk: () => void
}

const COPY: Record<string, {
  label: string
  next: (ex: string, set: number, total: number) => string
  remaining: (n: number) => string
  add: string
  skip: string
  talk: string
}> = {
  "pt-BR": {
    label: "DESCANSO",
    next: (ex, set, total) => `${ex} · próxima série ${set}/${total}`,
    remaining: (n) => (n === 1 ? "Falta 1 série desse exercício." : `Faltam ${n} séries desse exercício.`),
    add: "+15s",
    skip: "Pular descanso",
    talk: "Falar com GUTO",
  },
  "en-US": {
    label: "REST",
    next: (ex, set, total) => `${ex} · next set ${set}/${total}`,
    remaining: (n) => (n === 1 ? "1 set left in this exercise." : `${n} sets left in this exercise.`),
    add: "+15s",
    skip: "Skip rest",
    talk: "Talk to GUTO",
  },
  "it-IT": {
    label: "RIPOSO",
    next: (ex, set, total) => `${ex} · prossima serie ${set}/${total}`,
    remaining: (n) => (n === 1 ? "Resta 1 serie." : `Restano ${n} serie.`),
    add: "+15s",
    skip: "Salta riposo",
    talk: "Parla con GUTO",
  },
}

function pickCopy(language?: string) {
  if (!language) return COPY["pt-BR"]
  if (language in COPY) return COPY[language]
  const prefix = language.split("-")[0]
  const found = Object.keys(COPY).find((key) => key.startsWith(prefix))
  return found ? COPY[found] : COPY["pt-BR"]
}

function format(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60
  if (minutes <= 0) return `${rest}s`
  return `${minutes}:${String(rest).padStart(2, "0")}`
}

/**
 * Tela de descanso. Cronômetro grande, +15s, pular, falar com GUTO.
 * Quando o tempo zera, o engine vai detectar via TICK e mudar a fase.
 * Esta tela só apresenta o estado.
 */
export function GutoOnlineRestMode({
  restEndsAt,
  restPlannedSeconds,
  currentExercise,
  nextSetNumber,
  totalSets,
  remainingSetsInExercise,
  language,
  onExtend,
  onSkip,
  onTalk,
}: GutoOnlineRestModeProps) {
  const copy = pickCopy(language)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [])

  const remainingSeconds = useMemo(() => {
    if (!restEndsAt) return 0
    return Math.max(0, Math.ceil((restEndsAt - now) / 1000))
  }, [restEndsAt, now])

  const planned = restPlannedSeconds ?? 60
  const progress = planned > 0 ? Math.min(1, Math.max(0, 1 - remainingSeconds / planned)) : 0
  const halfwayPassed = remainingSeconds <= Math.round(planned / 2)

  return (
    <section className="guto-premium-card flex w-full flex-col items-center gap-4 p-5">
      <p className="guto-tab-kicker text-[10px] text-(--guto-navy)">
        {copy.label}
      </p>

      <div className="relative grid h-44 w-44 place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(13,35,65,0.08)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke={halfwayPassed ? "var(--guto-cyan)" : "rgba(82,231,255,0.55)"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
          />
        </svg>
        <span className="font-mono text-[2.2rem] font-black tracking-[0.04em] text-(--guto-navy)">
          {format(remainingSeconds)}
        </span>
      </div>

      {currentExercise && (
        <div className="text-center">
          <p className="text-[15px] font-bold leading-snug text-[rgba(13,35,65,0.84)]">
            {copy.next(currentExercise.name, nextSetNumber, totalSets)}
          </p>
          {remainingSetsInExercise > 0 && (
            <p className="guto-readable-label mt-1 text-(--guto-cyan)">
              {copy.remaining(remainingSetsInExercise)}
            </p>
          )}
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-2 min-[390px]:grid-cols-3">
        <button
          type="button"
          onClick={() => onExtend(15)}
          className="guto-cta-compact h-12 border-white/70 bg-white/55 text-[rgba(13,35,65,0.72)]"
        >
          <Plus className="h-3.5 w-3.5" />
          {copy.add}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="guto-cta-compact h-12"
        >
          <SkipForward className="h-3.5 w-3.5" />
          {copy.skip}
        </button>
        <button
          type="button"
          onClick={onTalk}
          className="guto-cta-compact h-12 border-white/70 bg-white/55 text-[rgba(13,35,65,0.72)]"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {copy.talk}
        </button>
      </div>
    </section>
  )
}
