"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { AlertCircle, Check, Flame, Lock, Quote, Zap } from "lucide-react"

import type { GutoMemory, GutoWorkoutPlan } from "@/lib/api/guto"
import { GutoOfficialAvatar } from "../guto-official-avatar"
import { getLanguage, translations } from "../translations"
import type { EvolutionStage } from "@/types/contract"
import type { PathDay, PathDayStatus } from "../view-models"

interface PathTabProps {
  userName: string
  language: string
  memory?: GutoMemory | null
  workoutPlan?: GutoWorkoutPlan | null
  currentEvolution: EvolutionStage
}

const pathCopy = {
  "pt-BR": {
    active: "Trilha ativa",
    visibleFailure: "Falha visível",
    debt: "Dia perdido fica cravado no material. O vazio cobra.",
    unlocked: "Desbloqueado",
    adapted: "Rota reduzida aceita",
  },
  "en-US": {
    active: "Active path",
    visibleFailure: "Visible failure",
    debt: "A missed day stays carved into the material. The void charges for it.",
    unlocked: "Unlocked",
    adapted: "Reduced route accepted",
  },
  "es-ES": {
    active: "Camino activo",
    visibleFailure: "Falla visible",
    debt: "El día perdido queda grabado en el material. El vacío cobra.",
    unlocked: "Desbloqueado",
    adapted: "Ruta reducida aceptada",
  },
  "it-IT": {
    active: "Percorso attivo",
    visibleFailure: "Errore visibile",
    debt: "Il giorno perso resta inciso nel materiale. Il vuoto presenta il conto.",
    unlocked: "Sbloccato",
    adapted: "Rotta ridotta accettata",
  },
} as const

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function buildPathDays(language: string, memory?: GutoMemory | null): PathDay[] {
  const today = new Date()
  const todayKey = toDateKey(today)
  const completedDays = new Set(memory?.completedWorkoutDates || [])
  const adaptedDays = new Set(memory?.adaptedMissionDates || [])
  const missedDays = new Set(memory?.missedMissionDates || [])

  return [-2, -1, 0, 1, 2].map((offset) => {
    const date = addDays(today, offset)
    const dateKey = toDateKey(date)
    let status: PathDayStatus = "locked"

    if (completedDays.has(dateKey) || (offset === 0 && memory?.trainedToday)) {
      status = "completed"
    } else if (adaptedDays.has(dateKey) || (offset === 0 && memory?.adaptedMissionToday)) {
      status = "adapted"
    } else if (dateKey === todayKey) {
      status = "current"
    } else if (missedDays.has(dateKey) || date < today) {
      status = "missed"
    }

    return {
      day: String(date.getDate()).padStart(2, "0"),
      label: new Intl.DateTimeFormat(language, { weekday: "short" }).format(date).toUpperCase(),
      status,
    }
  })
}

export function PathTab({ language, memory, workoutPlan, currentEvolution }: PathTabProps) {
  const validLang = getLanguage(language)
  const locale = translations[validLang]
  const copy = pathCopy[validLang]
  const pathDays = useMemo(() => buildPathDays(validLang, memory), [memory, validLang])
  const currentDay = pathDays[2] ?? pathDays[0]
  const completedCount = pathDays.filter((day) => day.status === "completed").length
  const monthLabel = new Intl.DateTimeFormat(validLang, { month: "long", year: "numeric" }).format(new Date()).toUpperCase()
  const focus = workoutPlan?.focus || locale.pathWorkoutName
  const streak = memory?.streak ?? 0
  const isAdaptedToday = Boolean(memory?.adaptedMissionToday)
  const xpReward = memory?.trainedToday ? "+100 XP" : isAdaptedToday ? "+50 XP" : "0 XP"
  const avatarEmotion = (memory?.totalXp ?? 0) === 0 ? "critical" : memory?.trainedToday ? "reward" : isAdaptedToday ? "alert" : "default"

  return (
    <div className="flex h-full min-h-0 flex-col pb-3">
      <div className="px-1 pb-3 text-center">
        <h1 className="mx-auto max-w-[18rem] text-balance text-[1.55rem] font-black uppercase leading-tight tracking-[0.12em] text-[var(--guto-navy)]">
          {locale.pathTitle}
        </h1>

        <div className="guto-slot mx-auto mt-2 w-fit rounded-full px-4 py-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(13,35,65,0.6)]">
          {monthLabel}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.9rem] px-3 pb-3 pt-4">
        <div className="pointer-events-none absolute inset-0 rounded-[1.9rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.36),rgba(255,255,255,0.08))]" />
        <div className="pointer-events-none absolute inset-x-4 top-[8.6rem] h-[2px] bg-[linear-gradient(90deg,transparent,rgba(82,231,255,0.66),transparent)]" />

        <div className="relative grid grid-cols-5 items-end gap-2">
          {pathDays.map((day, index) => {
            const isCompleted = day.status === "completed"
            const isAdapted = day.status === "adapted"
            const isCurrent = day.status === "current"
            const isMissed = day.status === "missed"

            return (
              <motion.div
                key={`${day.label}-${day.day}`}
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={
                    isCurrent
                      ? "guto-deboss-deep grid h-[4.35rem] w-[4.35rem] place-items-center rounded-full border border-[rgba(82,231,255,0.42)]"
                      : isCompleted
                        ? "guto-deboss grid h-12 w-12 place-items-center rounded-full border border-[rgba(82,231,255,0.32)]"
                        : isAdapted
                          ? "guto-deboss grid h-12 w-12 place-items-center rounded-full border border-[rgba(117,165,211,0.24)] opacity-80"
                        : isMissed
                          ? "grid h-12 w-12 place-items-center rounded-full border border-[rgba(13,35,65,0.08)] bg-[rgba(152,163,177,0.2)] shadow-[inset_4px_4px_12px_rgba(95,105,119,0.14)]"
                          : "grid h-10 w-10 place-items-center rounded-full border border-white/60 bg-white/35 text-[rgba(13,35,65,0.28)]"
                  }
                >
                  <span
                    className={
                      isCurrent
                        ? "text-xl font-black text-[rgba(13,35,65,0.66)]"
                        : "font-mono text-sm font-black text-[rgba(13,35,65,0.46)]"
                    }
                  >
                    {day.day}
                  </span>
                </div>

                <div className="h-5">
                  {isCompleted ? (
                    <Check className="h-4 w-4 rounded-full bg-[rgba(117,165,211,0.8)] p-[2px] text-white" />
                  ) : isAdapted ? (
                    <Zap className="h-4 w-4 text-[rgba(117,165,211,0.95)]" />
                  ) : isMissed ? (
                    <AlertCircle className="h-4 w-4 text-[rgba(13,35,65,0.32)]" />
                  ) : day.status === "locked" ? (
                    <Lock className="h-3.5 w-3.5 text-[rgba(13,35,65,0.26)]" />
                  ) : null}
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="relative mt-3 flex flex-1 flex-col items-center justify-center">
          <div className="absolute h-44 w-44 rounded-full border border-[rgba(82,231,255,0.18)] bg-[radial-gradient(circle,rgba(82,231,255,0.12)_0%,transparent_64%)]" />
          <GutoOfficialAvatar
            size="lg"
            showPlatform
            evolution={currentEvolution}
            emotion={avatarEmotion}
            className="relative z-10"
          />
          <div className="guto-slot relative z-10 mt-[-0.4rem] rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(13,35,65,0.58)]">
            {copy.unlocked}
          </div>
        </div>

        <motion.div
          className="guto-frost-panel relative rounded-[1.75rem] px-4 py-4"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-10 place-items-center rounded-full bg-[rgba(117,165,211,0.78)] text-sm font-black text-white">
                  {currentDay.day}
                </span>
                <h2 className="truncate text-sm font-black text-[var(--guto-navy)]">
                  {locale.pathDayLabel}
                </h2>
              </div>

              <div className="mt-3 space-y-2 font-mono text-[11px] leading-tight text-[rgba(13,35,65,0.64)]">
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 rounded-full bg-[rgba(117,165,211,0.8)] p-[2px] text-white" />
                  {isAdaptedToday && !memory?.trainedToday ? copy.adapted : `${locale.pathWorkoutDone} ${focus}`}
                </p>
                <p className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[rgba(117,165,211,0.95)]" />
                  {memory?.trainedToday ? "+100 XP hoje" : isAdaptedToday ? "+50 XP hoje" : locale.pathXpYesterday}
                </p>
                <p className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-[rgba(117,165,211,0.95)]" />
                  {streak > 0 ? `+${streak} dias na sequência` : locale.pathStreak}
                </p>
              </div>
            </div>

            <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--guto-cyan)]">
              {xpReward}
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(13,35,65,0.08)]">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(117,165,211,0.6),rgba(82,231,255,0.95))]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, completedCount * 26 + 18)}%` }}
              transition={{ duration: 0.8, delay: 0.25 }}
            />
          </div>

          <blockquote className="mt-4 flex items-start gap-2 text-center text-xs leading-relaxed text-[rgba(13,35,65,0.66)]">
            <Quote className="mt-0.5 h-4 w-4 shrink-0 text-[rgba(117,165,211,0.56)]" />
            <span>{locale.pathQuote}</span>
          </blockquote>
        </motion.div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3 rounded-[1.5rem] border border-white/70 bg-white/38 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(13,35,65,0.38)]">
            {copy.visibleFailure}
          </p>
          <p className="mt-1 text-xs leading-snug text-[rgba(13,35,65,0.62)]">{copy.debt}</p>
        </div>
        <div className="guto-deboss-deep grid h-11 w-11 place-items-center rounded-full">
          <Flame className="h-4 w-4 text-[var(--guto-cyan)]" />
        </div>
      </div>
    </div>
  )
}
