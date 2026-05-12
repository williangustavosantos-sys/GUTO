"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mic, MicOff, Pause, Play, RotateCcw, ShieldAlert, Shuffle, X } from "lucide-react"

import type { GutoWorkoutExercise, GutoWorkoutPlan } from "@/lib/api/guto"
import { GutoAvatar } from "@/components/guto/guto-avatar"
import { gutoVoice } from "@/lib/guto-voice/guto-voice-service"

type OnlinePhase = "briefing" | "executing" | "resting" | "paused" | "finished"
type AudioState = "idle" | "listening" | "speaking" | "unsupported"

type RecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string }
  }>
}

interface GutoOnlineSessionProps {
  open: boolean
  onClose: () => void
  workoutPlan: GutoWorkoutPlan
  language: string
  userName?: string
  onFinish?: () => void
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function parseRestSeconds(rest?: string | null, restSeconds?: number) {
  if (typeof restSeconds === "number" && Number.isFinite(restSeconds) && restSeconds > 0) {
    return Math.round(restSeconds)
  }

  const match = String(rest || "").match(/\d+/)
  const parsed = match ? Number.parseInt(match[0], 10) : 60
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60
}

function formatRest(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes <= 0) return `${rest}s`
  return `${minutes}:${String(rest).padStart(2, "0")}`
}

export function GutoOnlineSession({
  open,
  onClose,
  workoutPlan,
  language,
  userName,
  onFinish,
}: GutoOnlineSessionProps) {
  const exercises = useMemo(() => workoutPlan.exercises || [], [workoutPlan.exercises])
  const [phase, setPhase] = useState<OnlinePhase>("briefing")
  const [audioState, setAudioState] = useState<AudioState>("idle")
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [lastGutoLine, setLastGutoLine] = useState("Estou contigo. O treino não fica sozinho agora.")
  const [lastTranscript, setLastTranscript] = useState("")
  const [lastAction, setLastAction] = useState("")
  const recognitionRef = useRef<RecognitionLike | null>(null)
  const listeningEnabledRef = useRef(false)
  const speakingRef = useRef(false)

  const currentExercise: GutoWorkoutExercise | undefined = exercises[exerciseIndex]
  const displayName = userName?.trim()
  const totalExercises = exercises.length
  const totalSets = currentExercise?.sets || 1
  const restRemaining = restEndsAt ? Math.max(0, Math.ceil((restEndsAt - now) / 1000)) : 0
  const progressLabel = totalExercises
    ? `${Math.min(exerciseIndex + 1, totalExercises)}/${totalExercises}`
    : "0/0"

  const stopRecognition = useCallback(() => {
    listeningEnabledRef.current = false
    try {
      recognitionRef.current?.stop()
    } catch {
      // Browser recognition can throw when already stopped.
    }
  }, [])

  const speak = useCallback(
    async (intentKey: string, fallbackText: string) => {
      setLastGutoLine(fallbackText)
      try {
        recognitionRef.current?.stop()
      } catch {
        // Avoid echo while GUTO is speaking.
      }

      await gutoVoice.speak({
        intentKey,
        text: fallbackText,
        language,
        source: "online",
        onStart: () => {
          setAudioState("speaking")
          speakingRef.current = true
        },
        onEnd: () => {
          speakingRef.current = false
          setAudioState(listeningEnabledRef.current ? "listening" : "idle")
          setTimeout(() => {
            if (listeningEnabledRef.current && !speakingRef.current) {
              try {
                recognitionRef.current?.start()
              } catch {
                // SpeechRecognition throws if it is already started.
              }
            }
          }, 350)
        },
      })
    },
    [language],
  )

  const startRest = useCallback(
    (exercise: GutoWorkoutExercise) => {
      const restSeconds = parseRestSeconds(exercise.rest, exercise.restSeconds)
      setPhase("resting")
      setRestEndsAt(Date.now() + restSeconds * 1000)
      const intent = restSeconds <= 45 ? "set.rest.short" : "set.rest.long"
      void speak(intent, `Boa. Série anotada. Descansa ${restSeconds} segundos e fica comigo.`)
    },
    [speak],
  )

  const finishSession = useCallback(() => {
    setPhase("finished")
    setRestEndsAt(null)
    stopRecognition()
    void speak("session.close.win", "Treino fechado. A gente apareceu hoje.")
    onFinish?.()
  }, [onFinish, speak, stopRecognition])

  const handleSetDone = useCallback(() => {
    if (!currentExercise || phase === "finished") return
    setLastAction("Série registrada")
    void speak("set.done.clean", "Boa. Série anotada, seguimos juntos.")

    if (currentSet < totalSets) {
      setCurrentSet((value) => value + 1)
      startRest(currentExercise)
      return
    }

    const nextIndex = exerciseIndex + 1
    if (nextIndex >= totalExercises) {
      finishSession()
      return
    }

    setExerciseIndex(nextIndex)
    setCurrentSet(1)
    setPhase("executing")
    setRestEndsAt(null)
    const nextExercise = exercises[nextIndex]
    void speak(
      "set.return.now",
      `${nextExercise.name} agora. A gente segue junto, execução limpa.`,
    )
  }, [
    currentExercise,
    currentSet,
    exerciseIndex,
    exercises,
    finishSession,
    phase,
    speak,
    startRest,
    totalExercises,
    totalSets,
  ])

  const handlePain = useCallback(() => {
    setPhase("paused")
    setRestEndsAt(null)
    setLastAction("Pausado por dor")
    void speak("session.error.understood", "Calma. Para esse movimento e me fala curto: é dor, cansaço ou dúvida de execução?")
  }, [speak])

  const handleSwap = useCallback(() => {
    const alternative = currentExercise?.alternatives?.[0]
    const line = alternative
      ? `Vai de ${alternative}. Mesma missão, sem quebrar o treino.`
      : "Equipamento ocupado. Mantém a missão viva e escolhe uma variação segura do mesmo padrão."
    setLastAction("Troca orientada")
    void speak("set.cobranca.distraction", line)
  }, [currentExercise?.alternatives, speak])

  const handlePauseToggle = useCallback(() => {
    if (phase === "paused") {
      setPhase("executing")
      setLastAction("Sessão retomada")
      void speak("set.return.now", "Volta comigo. A missão continua daqui.")
      return
    }
    setPhase("paused")
    setRestEndsAt(null)
    setLastAction("Sessão pausada")
    void speak("session.error.understood", "Pausado. Eu fico aqui. Quando voltar, fala comigo e a gente segue.")
  }, [phase, speak])

  const handleTranscript = useCallback(
    (rawText: string) => {
      const text = normalize(rawText)
      if (!text || speakingRef.current) return

      setLastTranscript(rawText)
      const shortCommand = text.split(" ").length <= 6
      const hasWake = /^(guto|gudo|gutoo|gutu|ei guto|oi guto)\b/.test(text)
      const command = text.replace(/^(ei|oi)?\s*guto+\s*/, "").trim()
      const canActWithoutWake = phase === "executing" || phase === "resting"
      if (!hasWake && !canActWithoutWake && !shortCommand) return

      if (/(doeu|dor|fisgada|pontada|travou|incomod)/.test(command)) {
        handlePain()
      } else if (/(serie feita|série feita|feito|fiz|terminei|acabei|aquecimento finalizado)/.test(command)) {
        handleSetDone()
      } else if (/(ocupad|troca|substitui|sem maquina|sem máquina)/.test(command)) {
        handleSwap()
      } else if (/(pesad|cansad|sem ar|falhei)/.test(command)) {
        setLastAction("Carga/ritmo ajustado")
        void speak("set.cobranca.slow_pace", "A gente ajusta. Baixa o ego, segura a técnica e continua comigo.")
      } else if (/(pausa|para|espera)/.test(command)) {
        handlePauseToggle()
      } else if (/(continua|voltei|segue|bora)/.test(command)) {
        if (phase === "paused") handlePauseToggle()
      } else if (/(finaliza|encerra|acabou)/.test(command)) {
        finishSession()
      } else {
        setLastAction("Rota mantida")
        void speak("set.cobranca.distraction", "Eu ouvi. Mas agora a rota é treino. Me fala dor, troca, cansaço ou série feita.")
      }
    },
    [finishSession, handlePain, handlePauseToggle, handleSetDone, handleSwap, phase, speak],
  )

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setAudioState("unsupported")
      return
    }

    if (!recognitionRef.current) {
      const recognition = new Recognition()
      recognition.lang = language
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (event) => {
        const last = event.results[event.results.length - 1]
        if (last?.isFinal) handleTranscript(last[0].transcript)
      }
      recognition.onerror = () => {
        setAudioState("idle")
      }
      recognition.onend = () => {
        if (listeningEnabledRef.current && !speakingRef.current) {
          setTimeout(() => {
            try {
              recognition.start()
              setAudioState("listening")
            } catch {
              // Already started or browser denied the mic.
            }
          }, 300)
        }
      }
      recognitionRef.current = recognition as RecognitionLike
    }

    listeningEnabledRef.current = true
    try {
      const recognition = recognitionRef.current
      if (!recognition) return
      recognition.lang = language
      recognition.start()
      setAudioState("listening")
    } catch {
      setAudioState("listening")
    }
  }, [handleTranscript, language])

  useEffect(() => {
    if (!open) return
    setPhase("briefing")
    setExerciseIndex(0)
    setCurrentSet(1)
    setRestEndsAt(null)
    void speak(
      "session.entry.first_time",
      displayName
        ? `${displayName}, estamos juntos nessa. Bora iniciar, hoje a gente não falha.`
        : "Estamos juntos nessa. Bora iniciar, hoje a gente não falha.",
    )
    setTimeout(() => {
      setPhase("executing")
      if (exercises[0]) {
        void speak("set.return.now", `${exercises[0].name} agora. Primeira série. Eu tô contigo.`)
      }
    }, 2200)
    startListening()

    return () => {
      stopRecognition()
      gutoVoice.stop()
    }
  }, [displayName, exercises, open, speak, startListening, stopRecognition])

  useEffect(() => {
    if (!open) return
    const timer = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(timer)
  }, [open])

  useEffect(() => {
    if (!open || phase !== "resting" || !restEndsAt || restEndsAt > now) return
    setRestEndsAt(null)
    setPhase("executing")
    void speak("set.return.now", "Volta comigo. Próxima série agora.")
  }, [now, open, phase, restEndsAt, speak])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex bg-[radial-gradient(circle_at_top,rgba(82,231,255,0.18),transparent_34%),linear-gradient(180deg,#f8fcff_0%,#eaf4fb_54%,#dbe8f2_100%)] text-[var(--guto-navy)]">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.24em] text-[var(--guto-cyan)]">
              GUTO PERSONAL ONLINE
            </p>
            <h1 className="mt-1 text-[1rem] font-black uppercase tracking-[0.08em]">
              {phase === "finished" ? "Treino fechado" : "Presença ativa"}
            </h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/48 text-[var(--guto-navy)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
            aria-label="Fechar GUTO Online"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <main className="flex min-h-0 flex-1 flex-col items-center justify-between gap-4 py-4">
          <section className="flex w-full flex-col items-center">
            <div className="relative">
              <div className="absolute inset-8 rounded-full bg-[rgba(82,231,255,0.2)] blur-2xl" />
              <GutoAvatar size="xl" showPlatform={false} className="relative" />
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-3 py-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  audioState === "listening"
                    ? "bg-emerald-400"
                    : audioState === "speaking"
                      ? "bg-[var(--guto-cyan)]"
                      : "bg-slate-300"
                }`}
              />
              <span className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[rgba(13,35,65,0.54)]">
                {audioState === "listening"
                  ? "escutando"
                  : audioState === "speaking"
                    ? "falando"
                    : audioState === "unsupported"
                      ? "voz indisponível"
                      : "online"}
              </span>
            </div>
          </section>

          <section className="w-full rounded-[1.35rem] border border-white/75 bg-white/52 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_18px_60px_rgba(13,35,65,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[8px] font-black uppercase tracking-[0.18em] text-[rgba(13,35,65,0.42)]">
                  Exercício {progressLabel}
                </p>
                <h2 className="mt-1 text-[1.1rem] font-black uppercase leading-tight tracking-[0.04em]">
                  {currentExercise?.name || workoutPlan.focus}
                </h2>
                <p className="mt-1 text-[12px] font-semibold text-[rgba(13,35,65,0.58)]">
                  Série {Math.min(currentSet, totalSets)} de {totalSets} · {currentExercise?.reps || "reps"} · {currentExercise?.rest || "descanso"}
                </p>
              </div>
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-[rgba(82,231,255,0.34)] bg-[rgba(82,231,255,0.1)]">
                <span className="font-mono text-[1.1rem] font-black text-[var(--guto-cyan)]">
                  {phase === "resting" ? formatRest(restRemaining) : phase === "paused" ? "PA" : "ON"}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-[1rem] border border-[rgba(13,35,65,0.07)] bg-white/48 p-3">
              <p className="text-[13px] font-bold leading-snug text-[rgba(13,35,65,0.78)]">
                {lastGutoLine}
              </p>
              {lastTranscript && (
                <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[rgba(13,35,65,0.36)]">
                  ouvi: {lastTranscript}
                </p>
              )}
              {lastAction && (
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--guto-cyan)]">
                  {lastAction}
                </p>
              )}
            </div>
          </section>

          <section className="grid w-full grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSetDone}
              disabled={phase === "finished"}
              className="h-14 rounded-[1.1rem] border border-[rgba(82,231,255,0.5)] bg-[rgba(82,231,255,0.13)] font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[var(--guto-navy)] disabled:opacity-40"
            >
              Série feita
            </button>
            <button
              type="button"
              onClick={handlePauseToggle}
              disabled={phase === "finished"}
              className="flex h-14 items-center justify-center gap-2 rounded-[1.1rem] border border-white/70 bg-white/48 font-mono text-[10px] font-black uppercase tracking-[0.14em] disabled:opacity-40"
            >
              {phase === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {phase === "paused" ? "Continua" : "Pausa"}
            </button>
            <button
              type="button"
              onClick={handleSwap}
              disabled={phase === "finished"}
              className="flex h-12 items-center justify-center gap-2 rounded-[1rem] border border-white/70 bg-white/36 font-mono text-[9px] font-black uppercase tracking-[0.12em] disabled:opacity-40"
            >
              <Shuffle className="h-4 w-4" />
              Trocar
            </button>
            <button
              type="button"
              onClick={handlePain}
              disabled={phase === "finished"}
              className="flex h-12 items-center justify-center gap-2 rounded-[1rem] border border-[rgba(157,43,43,0.22)] bg-[rgba(157,43,43,0.06)] font-mono text-[9px] font-black uppercase tracking-[0.12em] text-[var(--destructive)] disabled:opacity-40"
            >
              <ShieldAlert className="h-4 w-4" />
              Doeu
            </button>
          </section>
        </main>

        <footer className="grid grid-cols-[1fr_auto] items-center gap-2">
          <button
            type="button"
            onClick={audioState === "listening" ? stopRecognition : startListening}
            className="flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-white/70 bg-white/44 font-mono text-[9px] font-black uppercase tracking-[0.14em]"
          >
            {audioState === "listening" ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {audioState === "listening" ? "Desativar escuta" : "Ativar escuta"}
          </button>
          <button
            type="button"
            onClick={() => {
              setExerciseIndex(0)
              setCurrentSet(1)
              setPhase("executing")
              setRestEndsAt(null)
              void speak("session.entry.returning", "Voltou. Boa. A gente continua junto de onde parou.")
            }}
            className="grid h-11 w-11 place-items-center rounded-[1rem] border border-white/70 bg-white/44"
            aria-label="Reiniciar sessão online"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </footer>
      </div>
      <span className="sr-only">GUTO Online carregado</span>
    </div>
  )
}
