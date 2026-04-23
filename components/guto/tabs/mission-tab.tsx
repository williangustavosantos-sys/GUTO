"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { CircleHelp, Dumbbell } from "lucide-react"

import { getLanguage, translations } from "../translations"
import { missionExercisesFixture, type MissionExercise } from "../view-models"

interface MissionTabProps {
  language: string
  onAskExercise: (exercise: MissionExercise) => void
}

const missionCopy = {
  "pt-BR": {
    execution: "Treino do dia",
    doubt: "Dúvida",
    series: "Séries",
    reps: "Reps",
    rest: "Descanso",
    observation: "Obs",
    exercise: "Exercício",
  },
  "en-US": {
    execution: "Today's workout",
    doubt: "Question",
    series: "Sets",
    reps: "Reps",
    rest: "Rest",
    observation: "Note",
    exercise: "Exercise",
  },
  "es-ES": {
    execution: "Entrenamiento del día",
    doubt: "Duda",
    series: "Series",
    reps: "Reps",
    rest: "Descanso",
    observation: "Obs",
    exercise: "Ejercicio",
  },
  "it-IT": {
    execution: "Allenamento del giorno",
    doubt: "Dubbio",
    series: "Serie",
    reps: "Ripetizioni",
    rest: "Recupero",
    observation: "Nota",
    exercise: "Esercizio",
  },
} as const

export function MissionTab({ language, onAskExercise }: MissionTabProps) {
  const validLang = getLanguage(language)
  const locale = translations[validLang]
  const copy = missionCopy[validLang]

  const exercises = useMemo(
    () =>
      missionExercisesFixture.map((exercise, index) => ({
        ...exercise,
        name: locale.exercises[index]?.name ?? exercise.name,
        rest: locale.exercises[index]?.rest ?? exercise.rest,
      })),
    [locale.exercises]
  )

  return (
    <div className="relative flex h-full min-h-0 flex-col pb-3">
      <div className="px-1 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[rgba(13,35,65,0.42)]">
              {copy.execution}
            </p>
            <h1 className="mt-1 text-[1.35rem] font-black uppercase tracking-[0.08em] text-[var(--guto-navy)]">
              {locale.workoutFocus}
            </h1>
            <p className="mt-1 text-xs text-[rgba(13,35,65,0.56)]">{locale.workoutDate}</p>
          </div>

          <div className="guto-deboss-deep grid h-11 w-11 shrink-0 place-items-center rounded-full">
            <Dumbbell className="h-[18px] w-[18px] text-[var(--guto-cyan)]" />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="grid grid-cols-[minmax(0,1fr)_34px_42px_62px_34px] items-center gap-1 border-b border-white/72 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[rgba(13,35,65,0.38)]">
          <span>{copy.exercise}</span>
          <span className="text-center">{copy.series}</span>
          <span className="text-center">{copy.reps}</span>
          <span className="text-center">{copy.rest}</span>
          <span className="text-center">?</span>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-[var(--guto-panel-scroll-padding)] pt-2">
          {exercises.map((exercise, index) => (
            <motion.div
              key={exercise.id}
              className="guto-frost-panel overflow-hidden rounded-[1.15rem] px-3 py-[8px]"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025 }}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_34px_42px_62px_34px] items-center gap-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[rgba(117,165,211,0.78)] font-mono text-[10px] font-black text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="min-w-0 truncate text-[13px] font-black leading-tight text-[var(--guto-navy)]">
                    {exercise.name}
                  </h2>
                </div>
                <p className="text-center font-mono text-[12px] font-black text-[var(--guto-navy)]">
                  {exercise.sets}
                </p>
                <p className="text-center font-mono text-[12px] font-black text-[var(--guto-navy)]">
                  {exercise.reps}
                </p>
                <p className="text-center font-mono text-[11px] font-black text-[rgba(13,35,65,0.68)]">
                  {exercise.rest}
                </p>
                <button
                  type="button"
                  onClick={() => onAskExercise(exercise)}
                  className="guto-slot grid h-8 w-8 place-items-center rounded-full"
                  aria-label={`${copy.doubt}: ${exercise.name}`}
                >
                  <CircleHelp className="h-[18px] w-[18px] text-[var(--guto-cyan)]" />
                </button>
              </div>

              <div className="mt-[5px] grid grid-cols-[2.6rem_minmax(0,1fr)] gap-2">
                <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[rgba(13,35,65,0.36)]">
                  {copy.observation}
                </span>
                <p className="truncate text-[10.5px] leading-tight text-[rgba(13,35,65,0.58)]">
                  {exercise.note}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
