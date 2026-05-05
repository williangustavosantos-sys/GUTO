"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, RotateCcw, Play } from "lucide-react"

import type { GutoWorkoutPlan } from "@/lib/api/guto"
import { getLanguage, translations } from "../translations"
import type { MissionExercise } from "../view-models"

interface MissionTabProps {
  language: string
  userName?: string
  userId: string
  workoutFocus?: string
  onAskExercise: (exercise: MissionExercise) => void
  workoutPlan?: GutoWorkoutPlan | null
  trainedToday?: boolean
  adaptedMissionToday?: boolean
  onMissionComplete: () => Promise<void> | void
  onAdaptedMissionComplete: () => Promise<void> | void
  onValidateWorkout: () => void
  missingProfileFields?: string[]
}

const MUSCLE_GROUP_LABEL: Record<string, Record<string, string>> = {
  "pt-BR": { aquecimento: "Aquecimento", peito: "Peito", costas: "Costas", ombro: "Ombro", bracos: "Braços", pernas: "Pernas", abdomen: "Abdômen", triceps: "Tríceps" },
  "en-US": { aquecimento: "Warm-up", peito: "Chest", costas: "Back", ombro: "Shoulder", bracos: "Arms", pernas: "Legs", abdomen: "Core", triceps: "Triceps" },
  "it-IT": { aquecimento: "Riscaldamento", peito: "Petto", costas: "Schiena", ombro: "Spalla", bracos: "Braccia", pernas: "Gambe", abdomen: "Addome", triceps: "Tricipiti" },
  "es-ES": { aquecimento: "Calentamiento", peito: "Pecho", costas: "Espalda", ombro: "Hombro", bracos: "Brazos", pernas: "Piernas", abdomen: "Abdomen", triceps: "Tríceps" },
}

const MISSING_FIELD_LABEL: Record<string, Record<string, string>> = {
  "pt-BR": { idade: "idade", sexo: "sexo", objetivo: "objetivo", nível: "nível", local: "local", altura: "altura", peso: "peso" },
  "en-US": { idade: "age", sexo: "sex", objetivo: "goal", nível: "level", local: "location", altura: "height", peso: "weight" },
  "it-IT": { idade: "età", sexo: "sesso", objetivo: "obiettivo", nível: "livello", local: "luogo", altura: "altezza", peso: "peso" },
  "es-ES": { idade: "edad", sexo: "sexo", objetivo: "objetivo", nível: "nivel", local: "lugar", altura: "altura", peso: "peso" },
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
    preview: "Ver execução",
    closePreview: "Fechar",
    previewUnavailable: "Execução indisponível. Falta configurar o backend.",
    askGuto: "Perguntar ao GUTO",
    emptyTitle: "Sem treino definido",
    emptyBody: "O GUTO ainda precisa fechar quando, onde, nível, idade e dor antes de liberar a missão.",
    missingPrefix: "Falta fechar",
    warmup: "Aquecimento",
    mainSection: "Parte Principal",
    validateWorkout: "VALIDAR TREINO",
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
    preview: "Watch form",
    closePreview: "Close",
    previewUnavailable: "Preview unavailable. Backend setup is missing.",
    askGuto: "Ask GUTO",
    emptyTitle: "No workout locked",
    emptyBody: "GUTO still needs when, where, level, age, and pain before releasing the mission.",
    missingPrefix: "Still missing",
    warmup: "Warm-Up",
    mainSection: "Main Workout",
    validateWorkout: "VALIDATE WORKOUT",
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
    preview: "Ver ejecución",
    closePreview: "Cerrar",
    previewUnavailable: "Ejecución no disponible. Falta configurar el backend.",
    askGuto: "Preguntar a GUTO",
    emptyTitle: "Sin entreno definido",
    emptyBody: "GUTO todavía necesita cuándo, dónde, nivel, edad y dolor antes de liberar la misión.",
    missingPrefix: "Falta cerrar",
    warmup: "Calentamiento",
    mainSection: "Parte Principal",
    validateWorkout: "VALIDAR ENTRENAMIENTO",
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
    preview: "Vedi esecuzione",
    closePreview: "Chiudi",
    previewUnavailable: "Esecuzione non disponibile. Manca la configurazione backend.",
    askGuto: "Chiedi a GUTO",
    emptyTitle: "Allenamento non definito",
    emptyBody: "GUTO deve ancora chiudere quando, dove, livello, età e fastidi prima di liberare la missione.",
    missingPrefix: "Manca ancora",
    warmup: "Riscaldamento",
    mainSection: "Parte Principale",
    validateWorkout: "VALIDA ALLENAMENTO",
  },
} as const


export function MissionTab({
  language,
  userName,
  userId: _userId,
  workoutFocus: _workoutFocus,
  onAskExercise,
  workoutPlan,
  trainedToday = false,
  adaptedMissionToday = false,
  onMissionComplete: _onMissionComplete,
  onAdaptedMissionComplete: _onAdaptedMissionComplete,
  onValidateWorkout,
  missingProfileFields = [],
}: MissionTabProps) {
  const validLang = getLanguage(language)
  const locale = translations[validLang]
  const copy = missionCopy[validLang]
  const missingLabels = missingProfileFields.map((field) => MISSING_FIELD_LABEL[validLang]?.[field] || field)
  const [started, setStarted] = useState(false)
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([])
  const exercises = useMemo(() => workoutPlan?.exercises || [], [workoutPlan])
  const missionKey = workoutPlan?.scheduledFor || workoutPlan?.focus || "empty"
  const completedCount = completedExerciseIds.length
  const progress = exercises.length ? Math.round((completedCount / exercises.length) * 100) : 0
  const canComplete = started && exercises.length > 0 && completedCount === exercises.length && !trainedToday

  const warmupExercises = useMemo(
    () => exercises.filter((e) => e.muscleGroup === "aquecimento"),
    [exercises]
  )
  const mainExercises = useMemo(
    () => exercises.filter((e) => e.muscleGroup !== "aquecimento"),
    [exercises]
  )

  useEffect(() => {
    setStarted(Boolean(trainedToday || adaptedMissionToday))
    setCompletedExerciseIds(trainedToday ? exercises.map((exercise) => exercise.id) : [])
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
            {missingLabels.length ? `${copy.missingPrefix}: ${missingLabels.join(", ")}.` : copy.emptyBody}
          </p>
        </div>
      </div>
    )
  }

  const renderSectionHeader = (label: string) => (
    <div className="flex items-center gap-2 px-0.5 pt-3 pb-1.5">
      <div className="h-px flex-1 bg-[rgba(82,231,255,0.3)]" />
      <span className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[var(--guto-cyan)]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[rgba(82,231,255,0.3)]" />
    </div>
  )

  const renderExerciseCard = (exercise: MissionExercise, index: number) => {
    if (!exercise.videoUrl) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[GUTO] Exercise "${exercise.id}" reached the UI without videoUrl — card suppressed.`)
      }
      return null
    }

    const exerciseIndex = exercises.findIndex((item) => item.id === exercise.id)
    const isDone = trainedToday || completedExerciseIds.includes(exercise.id)
    const categoryLabel = MUSCLE_GROUP_LABEL[validLang]?.[exercise.muscleGroup] || exercise.muscleGroup

    return (
      <motion.div
        key={`${exercise.id}-${index}`}
        className="guto-frost-panel overflow-hidden rounded-[1.25rem] p-3"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: exerciseIndex * 0.025 }}
      >
        {/* Card header: checkbox + name + ? */}
        <div className="flex items-center gap-2 mb-2.5">
          <button
            type="button"
            onClick={() => toggleExercise(exercise.id)}
            className="guto-slot grid h-8 w-8 shrink-0 place-items-center rounded-full"
            aria-label={`${copy.completed}: ${exercise.name}`}
            aria-pressed={isDone}
          >
            <CheckCircle2
              className={isDone ? "h-[18px] w-[18px] text-[var(--guto-cyan)]" : "h-[18px] w-[18px] text-[rgba(13,35,65,0.22)]"}
            />
          </button>

          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="text-[13px] font-black uppercase leading-tight tracking-[0.05em] text-[var(--guto-navy)]">
              {exercise.name}
            </h2>
            <span className="mt-0.5 rounded-full bg-[rgba(117,165,211,0.16)] px-2 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.1em] text-[rgba(13,35,65,0.48)] inline-block w-fit">
              {categoryLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onAskExercise(exercise)}
            className="guto-slot grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[rgba(82,231,255,0.35)] bg-[rgba(82,231,255,0.08)]"
            aria-label={`${copy.doubt}: ${exercise.name}`}
          >
            <span className="font-mono text-[11px] font-black text-[var(--guto-cyan)]">?</span>
          </button>
        </div>

        {/* Card body: metrics (left) + video (right) */}
        <div className="flex items-start gap-2.5">
          {/* Metrics + obs */}
          <div className="min-w-0 flex-1">
            <div className="flex items-end gap-3 mb-2">
              <div className="text-center">
                <div className="text-[18px] font-black leading-none text-[var(--guto-navy)]">{exercise.sets}</div>
                <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[rgba(13,35,65,0.42)]">{copy.series}</div>
              </div>
              <div className="h-6 w-px bg-[rgba(13,35,65,0.08)]" />
              <div className="text-center">
                <div className="text-[18px] font-black leading-none text-[var(--guto-navy)]">{exercise.reps}</div>
                <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[rgba(13,35,65,0.42)]">{copy.reps}</div>
              </div>
              <div className="h-6 w-px bg-[rgba(13,35,65,0.08)]" />
              <div className="text-center">
                <div className="text-[14px] font-black leading-none text-[var(--guto-navy)]">{exercise.rest}</div>
                <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[rgba(13,35,65,0.42)]">{copy.rest}</div>
              </div>
            </div>

            {exercise.note && (
              <p className="text-[10px] leading-snug text-[rgba(13,35,65,0.55)] line-clamp-2">
                <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-[rgba(13,35,65,0.32)]">{copy.observation}: </span>
                {exercise.note}
              </p>
            )}
          </div>

          {/* Video thumbnail */}
          <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[0.85rem] border border-[rgba(82,231,255,0.4)] bg-white/60">
            <video
              src={exercise.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              controls={false}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col pb-2">
      {/* Header */}
      <div className="px-1 pb-4 pt-2 text-center shrink-0">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[var(--guto-cyan)] mb-1">
          {copy.execution} • {workoutPlan?.dateLabel || locale.workoutDate}
        </p>
        <h1 className="mx-auto max-w-[18rem] text-balance text-[1.25rem] font-black uppercase leading-tight tracking-[0.08em] text-[var(--guto-navy)]">
          {workoutPlan?.focus || locale.workoutFocus}
        </h1>
      </div>

      {/* Progress bar + start/reset */}
      <div className="mb-2.5 grid grid-cols-[1fr_auto] items-center gap-3 rounded-[1rem] border border-white/70 bg-white/36 px-3 py-1.5">
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

      {/* Exercise sections */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-3 pt-0.5">
          {warmupExercises.length > 0 && (
            <section className="space-y-2">
              {renderSectionHeader(copy.warmup)}
              {warmupExercises.map(renderExerciseCard)}
            </section>
          )}

          {mainExercises.length > 0 && (
            <section className="space-y-2">
              {renderSectionHeader(copy.mainSection)}
              {mainExercises.map(renderExerciseCard)}
            </section>
          )}
        </div>
      </div>

      {/* Action — único botão final */}
      <div className="mt-2">
        <button
          type="button"
          onClick={onValidateWorkout}
          disabled={!canComplete && !trainedToday}
          className="guto-deboss-deep h-11 w-full rounded-[1.05rem] border border-[rgba(82,231,255,0.5)] font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--guto-cyan)] disabled:opacity-30"
        >
          {copy.validateWorkout}
        </button>
      </div>
    </div>
  )
}
