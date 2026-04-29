"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, CircleHelp, Play, RotateCcw } from "lucide-react"

import { API_URL } from "@/lib/api/client"
import type { GutoWorkoutPlan } from "@/lib/api/guto"
import { getLanguage, translations } from "../translations"
import type { MissionExercise } from "../view-models"

interface MissionTabProps {
  language: string
  onAskExercise: (exercise: MissionExercise) => void
  workoutPlan?: GutoWorkoutPlan | null
  trainedToday?: boolean
  adaptedMissionToday?: boolean
  onMissionComplete: () => Promise<void> | void
  onAdaptedMissionComplete: () => Promise<void> | void
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
    start: "Iniciar missão",
    complete: "Missão executada",
    adapted: "Aceitar missão reduzida",
    completed: "Executado",
    adaptedDone: "Rota reduzida aceita",
    reset: "Reabrir execução",
    progress: "Progresso",
    block: "Bloco",
    preview: "Execução",
    closePreview: "Fechar",
    emptyTitle: "Sem treino definido",
    emptyBody: "O GUTO ainda precisa fechar quando, onde, nível, idade e dor antes de liberar a missão.",
  },
  "en-US": {
    execution: "Today's workout",
    doubt: "Question",
    series: "Sets",
    reps: "Reps",
    rest: "Rest",
    observation: "Note",
    exercise: "Exercise",
    start: "Start mission",
    complete: "Mission executed",
    adapted: "Accept reduced mission",
    completed: "Executed",
    adaptedDone: "Reduced route accepted",
    reset: "Reopen execution",
    progress: "Progress",
    block: "Block",
    preview: "Preview",
    closePreview: "Close",
    emptyTitle: "No workout locked",
    emptyBody: "GUTO still needs when, where, level, age, and pain before releasing the mission.",
  },
  "es-ES": {
    execution: "Entrenamiento del día",
    doubt: "Duda",
    series: "Series",
    reps: "Reps",
    rest: "Descanso",
    observation: "Obs",
    exercise: "Ejercicio",
    start: "Iniciar misión",
    complete: "Misión ejecutada",
    adapted: "Aceptar misión reducida",
    completed: "Ejecutado",
    adaptedDone: "Ruta reducida aceptada",
    reset: "Reabrir ejecución",
    progress: "Progreso",
    block: "Bloque",
    preview: "Ejecución",
    closePreview: "Cerrar",
    emptyTitle: "Sin entreno definido",
    emptyBody: "GUTO todavía necesita cuándo, dónde, nivel, edad y dolor antes de liberar la misión.",
  },
  "it-IT": {
    execution: "Allenamento del giorno",
    doubt: "Dubbio",
    series: "Serie",
    reps: "Ripetizioni",
    rest: "Recupero",
    observation: "Nota",
    exercise: "Esercizio",
    start: "Avvia missione",
    complete: "Missione eseguita",
    adapted: "Accetta missione ridotta",
    completed: "Eseguito",
    adaptedDone: "Rotta ridotta accettata",
    reset: "Riapri esecuzione",
    progress: "Progresso",
    block: "Blocco",
    preview: "Esecuzione",
    closePreview: "Chiudi",
    emptyTitle: "Allenamento non definito",
    emptyBody: "GUTO deve ancora chiudere quando, dove, livello, età e fastidi prima di liberare la missione.",
  },
} as const

export function MissionTab({
  language,
  onAskExercise,
  workoutPlan,
  trainedToday = false,
  adaptedMissionToday = false,
  onMissionComplete,
  onAdaptedMissionComplete,
}: MissionTabProps) {
  const validLang = getLanguage(language)
  const locale = translations[validLang]
  const copy = missionCopy[validLang]
  const [started, setStarted] = useState(false)
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [previewExerciseId, setPreviewExerciseId] = useState<string | null>(null)

  const exercises = useMemo(() => workoutPlan?.exercises || [], [workoutPlan])
  const missionKey = workoutPlan?.scheduledFor || workoutPlan?.focus || "empty"
  const completedCount = completedExerciseIds.length
  const progress = exercises.length ? Math.round((completedCount / exercises.length) * 100) : 0
  const canComplete = started && exercises.length > 0 && completedCount === exercises.length && !trainedToday
  const canAcceptAdapted = started && completedCount > 0 && !trainedToday && !adaptedMissionToday
  const exerciseBlocks = useMemo(
    () =>
      Array.from({ length: Math.ceil(exercises.length / 2) }, (_, index) =>
        exercises.slice(index * 2, index * 2 + 2)
      ),
    [exercises]
  )

  useEffect(() => {
    setStarted(Boolean(trainedToday || adaptedMissionToday))
    setCompletedExerciseIds(trainedToday ? exercises.map((exercise) => exercise.id) : [])
    setPreviewExerciseId(null)
  }, [adaptedMissionToday, exercises, missionKey, trainedToday])

  const toggleExercise = (exerciseId: string) => {
    if (trainedToday || adaptedMissionToday) return
    setStarted(true)
    setCompletedExerciseIds((current) =>
      current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId]
    )
  }

  const completeMission = async () => {
    if (!canComplete || isCompleting) return
    setIsCompleting(true)
    try {
      await onMissionComplete()
    } finally {
      setIsCompleting(false)
    }
  }

  const completeAdaptedMission = async () => {
    if (!canAcceptAdapted || isCompleting) return
    setIsCompleting(true)
    try {
      await onAdaptedMissionComplete()
    } finally {
      setIsCompleting(false)
    }
  }

  if (!workoutPlan?.exercises?.length) {
    return (
      <div className="relative grid h-full min-h-0 place-items-center pb-2">
        <div className="mx-auto max-w-[18rem] text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[rgba(13,35,65,0.42)]">
            {copy.execution}
          </p>
          <h1 className="mt-2 text-[1.2rem] font-black uppercase leading-tight tracking-[0.08em] text-[var(--guto-navy)]">
            {copy.emptyTitle}
          </h1>
          <p className="mt-3 text-[12px] leading-relaxed text-[rgba(13,35,65,0.62)]">
            {copy.emptyBody}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col pb-2">
      <div className="px-1 pb-2 text-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[rgba(13,35,65,0.42)]">
          {copy.execution}
        </p>
        <h1 className="mx-auto mt-0.5 max-w-[18rem] text-balance text-[1.3rem] font-black uppercase leading-tight tracking-[0.08em] text-[var(--guto-navy)]">
          {workoutPlan?.focus || locale.workoutFocus}
        </h1>
        <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[rgba(13,35,65,0.56)]">
          {workoutPlan?.dateLabel || locale.workoutDate}
        </p>
      </div>

      <div className="mb-2 grid grid-cols-[1fr_auto] items-center gap-3 rounded-[1rem] border border-white/70 bg-white/36 px-3 py-1.5">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[rgba(13,35,65,0.38)]">
            {copy.progress}
          </p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[rgba(13,35,65,0.08)]">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(82,231,255,0.58),rgba(82,231,255,0.98))]"
              animate={{ width: `${trainedToday ? 100 : progress}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (trainedToday || adaptedMissionToday) return
            if (started) {
              setStarted(false)
              setCompletedExerciseIds([])
              return
            }
            setStarted(true)
          }}
          className="guto-slot grid h-9 w-9 place-items-center rounded-full disabled:opacity-45"
          disabled={trainedToday || adaptedMissionToday}
          aria-label={started ? copy.reset : copy.start}
        >
          {started ? <RotateCcw className="h-4 w-4 text-[var(--guto-cyan)]" /> : <Play className="h-4 w-4 text-[var(--guto-cyan)]" />}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-[var(--guto-panel-scroll-padding)] pt-1">
          {exerciseBlocks.map((block, blockIndex) => (
            <section key={`block-${blockIndex}`} className="space-y-1.5">
              <div className="flex items-center justify-between px-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[rgba(13,35,65,0.38)]">
                <span>{copy.block} {String(blockIndex + 1).padStart(2, "0")}</span>
                <span>{block.length}x</span>
              </div>

              {block.map((exercise) => {
                const exerciseIndex = exercises.findIndex((item) => item.id === exercise.id)
                const isDone = trainedToday || completedExerciseIds.includes(exercise.id)

                return (
                  <motion.div
                    key={exercise.id}
                    className="guto-frost-panel overflow-hidden rounded-[1rem] px-2.5 py-2"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: exerciseIndex * 0.025 }}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => toggleExercise(exercise.id)}
                        className="guto-slot grid h-8 w-8 shrink-0 place-items-center rounded-full"
                        aria-label={`${copy.completed}: ${exercise.name}`}
                        aria-pressed={isDone}
                      >
                        <CheckCircle2
                          className={isDone ? "h-[17px] w-[17px] text-[var(--guto-cyan)]" : "h-[17px] w-[17px] text-[rgba(13,35,65,0.25)]"}
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[rgba(117,165,211,0.78)] font-mono text-[9px] font-black text-white">
                            {String(exerciseIndex + 1).padStart(2, "0")}
                          </span>
                          <h2 className="min-w-0 flex-1 truncate text-[13px] font-black leading-tight text-[var(--guto-navy)]">
                            {exercise.name}
                          </h2>
                          <button
                            type="button"
                            onClick={() => onAskExercise(exercise)}
                            className="guto-slot grid h-7 w-7 shrink-0 place-items-center rounded-full"
                            aria-label={`${copy.doubt}: ${exercise.name}`}
                          >
                            <CircleHelp className="h-[16px] w-[16px] text-[var(--guto-cyan)]" />
                          </button>
                        </div>

                        <div className="mt-1.5 flex items-center gap-3 font-mono text-[10px] font-black text-[var(--guto-navy)]">
                          <span>{exercise.sets} <span className="font-semibold text-[rgba(13,35,65,0.48)]">{copy.series.toLowerCase()}</span></span>
                          <span>{exercise.reps} <span className="font-semibold text-[rgba(13,35,65,0.48)]">{copy.reps.toLowerCase()}</span></span>
                          <span>{exercise.rest} <span className="font-semibold text-[rgba(13,35,65,0.48)]">{copy.rest.toLowerCase()}</span></span>
                        </div>

                        <p className="mt-1 line-clamp-1 text-[10px] leading-tight text-[rgba(13,35,65,0.56)]">
                          <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-[rgba(13,35,65,0.34)]">{copy.observation}:</span>{" "}
                          {exercise.note}
                        </p>

                        {exercise.animationUrl && API_URL ? (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => setPreviewExerciseId((current) => current === exercise.id ? null : exercise.id)}
                              className="guto-slot inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 font-mono text-[8px] font-black uppercase tracking-[0.12em] text-[var(--guto-navy)]"
                              aria-expanded={previewExerciseId === exercise.id}
                            >
                              <Play className="h-3.5 w-3.5 text-[var(--guto-cyan)]" />
                              {previewExerciseId === exercise.id ? copy.closePreview : copy.preview}
                            </button>

                            {previewExerciseId === exercise.id ? (
                              <div className="mt-2 overflow-hidden rounded-[0.85rem] border border-[rgba(82,231,255,0.44)] bg-white/62">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`${API_URL}${exercise.animationUrl}`}
                                  alt={`${copy.preview}: ${exercise.name}`}
                                  loading="lazy"
                                  className="mx-auto aspect-video max-h-40 w-full object-contain"
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </section>
          ))}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={completeMission}
          disabled={!canComplete || isCompleting}
          className="guto-deboss-deep h-11 rounded-[1.05rem] font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--guto-navy)] disabled:opacity-45"
        >
          {trainedToday ? copy.completed : copy.complete}
        </button>

        <button
          type="button"
          onClick={completeAdaptedMission}
          disabled={!canAcceptAdapted || isCompleting}
          className="guto-slot h-10 rounded-[1.05rem] font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[var(--guto-navy)] disabled:opacity-35"
        >
          {adaptedMissionToday ? copy.adaptedDone : copy.adapted}
        </button>
      </div>
    </div>
  )
}
