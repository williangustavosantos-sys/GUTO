"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Mic, Send, X } from "lucide-react"

import { sendGutoMessage } from "@/lib/api/guto"
import type { SupportedLanguage } from "@/types/contract"

import { getLanguage, translations } from "../translations"
import {
  initialMissionAssistState,
  missionExercisesFixture,
  type MissionAssistMessage,
  type MissionAssistState,
} from "../view-models"

interface MissionTabProps {
  userName: string
  language: string
}

const missionCopy = {
  "pt-BR": {
    execution: "Execução do dia",
    exercise: "Exercício",
    talk: "Falar com Guto",
    channel: "Canal do exercício",
    input: "Fala com Guto sobre esta execução.",
  },
  "en-US": {
    execution: "Today's execution",
    exercise: "Exercise",
    talk: "Talk to Guto",
    channel: "Exercise channel",
    input: "Talk to Guto about this execution.",
  },
  "es-ES": {
    execution: "Ejecución del día",
    exercise: "Ejercicio",
    talk: "Hablar con Guto",
    channel: "Canal del ejercicio",
    input: "Habla con Guto sobre esta ejecución.",
  },
  "it-IT": {
    execution: "Esecuzione del giorno",
    exercise: "Esercizio",
    talk: "Parla con Guto",
    channel: "Canale dell'esercizio",
    input: "Parla con Guto di questa esecuzione.",
  },
} as const

export function MissionTab({ userName, language }: MissionTabProps) {
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

  const [assistState, setAssistState] = useState<MissionAssistState>(initialMissionAssistState)
  const activeExercise = exercises.find((exercise) => exercise.id === assistState.exerciseId) ?? null

  const openAssist = (exerciseId: string) => {
    const exercise = exercises.find((item) => item.id === exerciseId)
    if (!exercise) return

    const intro: MissionAssistMessage = {
      id: `assist-intro-${exercise.id}`,
      role: "guto",
      text: exercise.cue,
    }

    setAssistState({
      exerciseId,
      draft: "",
      isSending: false,
      messages: [intro],
    })
  }

  const closeAssist = () => {
    setAssistState(initialMissionAssistState)
  }

  const handleAssistSend = async () => {
    if (!activeExercise || !assistState.draft.trim() || assistState.isSending) return

    const userText = assistState.draft.trim()
    const safeLanguage = getLanguage(language) as SupportedLanguage
    const userMessage: MissionAssistMessage = {
      id: `assist-user-${Date.now()}`,
      role: "user",
      text: userText,
    }

    const nextMessages = [...assistState.messages, userMessage]
    setAssistState((current) => ({
      ...current,
      draft: "",
      isSending: true,
      messages: nextMessages,
    }))

    try {
      const data = await sendGutoMessage({
        profile: { name: userName || "Usuário" },
        input: `Contexto do treino: exercício ${activeExercise.name}, ${activeExercise.sets} séries, ${activeExercise.reps} reps, descanso ${activeExercise.rest}. Pedido do usuário: ${userText}`,
        language: safeLanguage,
        history: nextMessages.map((message) => ({
          role: message.role === "guto" ? "model" : "user",
          parts: [{ text: message.text }],
        })),
      })

      const reply: MissionAssistMessage = {
        id: `assist-guto-${Date.now()}`,
        role: "guto",
        text: data?.fala?.trim() || "Ajusta a execução. Menos ego, mais precisão.",
      }

      setAssistState((current) => ({
        ...current,
        isSending: false,
        messages: [...current.messages, reply],
      }))
    } catch {
      setAssistState((current) => ({
        ...current,
        isSending: false,
        messages: [
          ...current.messages,
          {
            id: `assist-guto-err-${Date.now()}`,
            role: "guto",
            text: "Conexão falhou. Reenvia em uma frase objetiva.",
          },
        ],
      }))
    }
  }

  return (
    <div className="relative flex h-full flex-col pb-4">
      <div className="px-1 pb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[rgba(13,35,65,0.42)]">
          {copy.execution}
        </p>
        <h1 className="mt-2 text-[1.9rem] font-black tracking-[0.12em] text-[var(--guto-navy)]">
          {locale.missionTitle}
        </h1>
        <p className="mt-1 text-sm text-[rgba(13,35,65,0.58)]">
          {locale.workoutDate} · {locale.workoutFocus}
        </p>
      </div>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto pr-1 pb-40">
        {exercises.map((exercise, index) => (
          <motion.article
            key={exercise.id}
            className="guto-deboss rounded-[1.9rem] px-4 py-4"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[rgba(13,35,65,0.38)]">
                  {copy.exercise}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--guto-navy)]">{exercise.name}</h2>
              </div>
              {exercise.xp ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--guto-cyan)]">
                  +{exercise.xp} XP
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-sm text-[rgba(13,35,65,0.62)]">{exercise.cue}</p>

            <div className="guto-slot mt-4 flex items-center justify-between gap-3 rounded-[1.4rem] px-3 py-3">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(13,35,65,0.38)]">
                  {exercise.sets} {locale.setsLabel} · {exercise.reps} {locale.repsLabel} · {exercise.rest}
                </p>
              </div>

              <button
                type="button"
                onClick={() => openAssist(exercise.id)}
                className="guto-deboss flex items-center gap-2 rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--guto-navy)]"
              >
                <Mic className="h-3.5 w-3.5 text-[var(--guto-cyan)]" />
                {copy.talk}
              </button>
            </div>
          </motion.article>
        ))}
      </div>

      <AnimatePresence>
        {activeExercise && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 pb-1"
            initial={{ y: 220, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 220, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
          >
            <div className="guto-frost-panel pointer-events-auto rounded-[1.9rem] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[rgba(13,35,65,0.38)]">
                    {copy.channel}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-[var(--guto-navy)]">
                    {activeExercise.name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeAssist}
                  className="guto-deboss flex h-10 w-10 items-center justify-center rounded-2xl"
                  aria-label="Fechar painel"
                >
                  <X className="h-4 w-4 text-[rgba(13,35,65,0.52)]" />
                </button>
              </div>

              <div className="no-scrollbar mt-4 max-h-32 space-y-3 overflow-y-auto pr-1">
                {assistState.messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "guto"
                        ? "text-sm text-[var(--guto-navy)]"
                        : "text-right text-sm text-[rgba(13,35,65,0.58)]"
                    }
                  >
                    {message.text}
                  </div>
                ))}
              </div>

              <div className="guto-slot mt-4 flex items-center gap-2 rounded-[1.5rem] px-2 py-2">
                <button
                  type="button"
                  className="guto-deboss flex h-10 w-10 items-center justify-center rounded-2xl"
                  aria-label="Canal de voz"
                >
                  <Mic className="h-4 w-4 text-[var(--guto-cyan)]" />
                </button>

                <input
                  type="text"
                  value={assistState.draft}
                  onChange={(event) =>
                    setAssistState((current) => ({ ...current, draft: event.target.value }))
                  }
                  onKeyDown={(event) => event.key === "Enter" && handleAssistSend()}
                  placeholder={copy.input}
                  className="flex-1 bg-transparent px-2 py-2 text-sm text-[var(--guto-navy)] outline-none placeholder:text-[rgba(13,35,65,0.36)]"
                />

                <button
                  type="button"
                  onClick={handleAssistSend}
                  disabled={assistState.isSending || !assistState.draft.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(82,231,255,0.92)] text-[var(--guto-navy)] disabled:opacity-35"
                  aria-label="Enviar para Guto"
                >
                  {assistState.isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
