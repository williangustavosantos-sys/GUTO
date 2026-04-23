"use client"

import { motion } from "framer-motion"
import { AlertCircle, Check, Flame, Lock, Quote, Zap } from "lucide-react"

import { GutoOfficialAvatar } from "../guto-official-avatar"
import { getLanguage, translations } from "../translations"
import { pathDaysFixture } from "../view-models"

interface PathTabProps {
  userName: string
  language: string
}

const pathCopy = {
  "pt-BR": {
    active: "Trilha ativa",
    visibleFailure: "Falha visível",
    debt: "Dia perdido fica cravado no material. O vazio cobra.",
    unlocked: "Desbloqueado",
  },
  "en-US": {
    active: "Active path",
    visibleFailure: "Visible failure",
    debt: "A missed day stays carved into the material. The void charges for it.",
    unlocked: "Unlocked",
  },
  "es-ES": {
    active: "Camino activo",
    visibleFailure: "Falla visible",
    debt: "El día perdido queda grabado en el material. El vacío cobra.",
    unlocked: "Desbloqueado",
  },
  "it-IT": {
    active: "Percorso attivo",
    visibleFailure: "Errore visibile",
    debt: "Il giorno perso resta inciso nel materiale. Il vuoto presenta il conto.",
    unlocked: "Sbloccato",
  },
} as const

export function PathTab({ language }: PathTabProps) {
  const validLang = getLanguage(language)
  const locale = translations[validLang]
  const copy = pathCopy[validLang]
  const currentDay = pathDaysFixture.find((day) => day.status === "current") ?? pathDaysFixture[0]
  const completedCount = pathDaysFixture.filter((day) => day.status === "completed").length

  return (
    <div className="flex h-full min-h-0 flex-col pb-3">
      <div className="flex items-center justify-between gap-3 px-1 pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[rgba(13,35,65,0.42)]">
            {copy.active}
          </p>
          <h1 className="mt-1 text-[1.55rem] font-black uppercase tracking-[0.12em] text-[var(--guto-navy)]">
            {locale.pathTitle}
          </h1>
        </div>

        <div className="guto-slot rounded-full px-4 py-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(13,35,65,0.6)]">
          {locale.pathMonth}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.9rem] px-3 pb-3 pt-4">
        <div className="pointer-events-none absolute inset-0 rounded-[1.9rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.36),rgba(255,255,255,0.08))]" />
        <div className="pointer-events-none absolute inset-x-4 top-[8.6rem] h-[2px] bg-[linear-gradient(90deg,transparent,rgba(82,231,255,0.66),transparent)]" />

        <div className="relative grid grid-cols-5 items-end gap-2">
          {pathDaysFixture.slice(0, 5).map((day, index) => {
            const isCompleted = day.status === "completed"
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
          <GutoOfficialAvatar size="lg" showPlatform evolution="BABY" className="relative z-10" />
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
                  {locale.pathWorkoutDone} {locale.pathWorkoutName}
                </p>
                <p className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[rgba(117,165,211,0.95)]" />
                  {locale.pathXpYesterday}
                </p>
                <p className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-[rgba(117,165,211,0.95)]" />
                  {locale.pathStreak}
                </p>
              </div>
            </div>

            <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--guto-cyan)]">
              {locale.pathXpReward}
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
