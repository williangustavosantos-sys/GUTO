"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mic, MicOff, Pause, Play, RotateCcw, ShieldAlert, Shuffle, X } from "lucide-react"

import type { GutoWorkoutExercise, GutoWorkoutPlan } from "@/lib/api/guto"
import { GutoAvatar } from "@/components/guto/guto-avatar"
import { gutoVoice } from "@/lib/guto-voice/guto-voice-service"
import { API_URL } from "@/lib/api/client"

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

// ─── Session persistence ──────────────────────────────────────────────────────
// GUTO nunca descarta memória sem validar.
// Estado é salvo no localStorage e restaurado se menos de 2h passaram.

interface PersistedSession {
  phase: OnlinePhase
  exerciseIndex: number
  currentSet: number
  workoutKey: string
  savedAt: number
}

const SESSION_PERSIST_PREFIX = "guto-online-session:"
const SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000 // 2 horas

function makeSessionKey(plan: GutoWorkoutPlan): string {
  return `${SESSION_PERSIST_PREFIX}${plan.focus}:${plan.scheduledFor}`
}

function saveSessionState(key: string, state: Omit<PersistedSession, "savedAt">): void {
  try {
    const data: PersistedSession = { ...state, savedAt: Date.now() }
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // localStorage pode estar cheio ou bloqueado — não quebra o treino
  }
}

function loadSessionState(key: string): PersistedSession | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const data = JSON.parse(raw) as PersistedSession
    if (Date.now() - data.savedAt > SESSION_MAX_AGE_MS) {
      localStorage.removeItem(key)
      return null
    }
    return data
  } catch {
    return null
  }
}

function clearSessionState(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // silencioso — irrelevante para o fluxo
  }
}

// ─── AI exception call ────────────────────────────────────────────────────────
// GUTO pergunta como amigo. Quando não entende, ele pede clareza.
// Quando entende (dor, troca, fadiga), ele responde com contexto real.
// Timeout de 4s — se demorar, usa fallback local sem avisar de erro.

type ExceptionType = "pain" | "substitute" | "fatigue" | "unknown_command"

const EXCEPTION_FALLBACKS: Record<ExceptionType, string> = {
  pain:            "Para. Me fala curto: é dor, cansaço ou dúvida de execução? Quero entender antes de seguir.",
  substitute:      "Tudo bem. Qual equipamento você tem agora? Me fala e eu adapto na hora.",
  fatigue:         "Entendido. Quanto você aguenta nessa carga? Baixa 20%, mantém a técnica e me fala quando a série fechar.",
  unknown_command: "Não entendi bem o que você falou. Me diz: é dor, cansaço, troca de exercício ou a série fechou?",
}

async function askGutoOnline(
  type: ExceptionType,
  context: {
    exerciseName?: string
    exerciseMuscle?: string
    currentSet?: number
    totalSets?: number
    userMessage?: string
    alternatives?: string[]
  }
): Promise<string | null> {
  const token = typeof window !== "undefined"
    ? window.localStorage.getItem("guto-auth-token")
    : null

  if (!API_URL) return null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    const res = await fetch(`${API_URL}/guto/online/exception`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ type, context }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) return null
    const data = (await res.json()) as { text?: string }
    return data.text ?? null
  } catch {
    // Timeout, rede offline, etc — GUTO usa fallback local sem expor erro técnico
    return null
  }
}

// ─── Padrões de comando por idioma ───────────────────────────────────────────
// GUTO ouve como amigo: entende variações naturais em PT, EN e IT.
// Se o usuário falar de forma ligeiramente diferente, ainda é reconhecido.

interface CommandPatterns {
  pain: RegExp
  setDone: RegExp
  swap: RegExp
  fatigue: RegExp
  pause: RegExp
  resume: RegExp
  finish: RegExp
  wake: RegExp
}

const COMMAND_PATTERNS: Record<string, CommandPatterns> = {
  "pt-BR": {
    wake:     /^(guto|gudo|gutoo|gutu|ei guto|oi guto)\b/,
    pain:     /(doeu|dor|fisgada|pontada|travou|incomod)/,
    setDone:  /(serie feita|série feita|feito|fiz|terminei|acabei|aquecimento finalizado)/,
    swap:     /(ocupad|troca|substitui|sem maquina|sem máquina)/,
    fatigue:  /(pesad|cansad|sem ar|falhei)/,
    pause:    /(pausa|para|espera)/,
    resume:   /(continua|voltei|segue|bora)/,
    finish:   /(finaliza|encerra|acabou)/,
  },
  "en-US": {
    wake:     /^(guto|hey guto|hi guto)\b/,
    pain:     /(hurt|pain|ache|twinge|pulled|strain|sore)/,
    setDone:  /(set done|done|finished|completed|i did it|that.s it|all done)/,
    swap:     /(busy|swap|substitute|no machine|no equipment|occupied)/,
    fatigue:  /(heavy|tired|out of breath|failed|exhausted|can.t)/,
    pause:    /(pause|stop|wait|hold on)/,
    resume:   /(continue|i.m back|let.s go|resume|keep going)/,
    finish:   /(finish|end|done for today|wrap up)/,
  },
  "it-IT": {
    wake:     /^(guto|ehi guto|ciao guto)\b/,
    pain:     /(fa male|dolore|fitta|fitto|stirato|distorto|fastidio)/,
    setDone:  /(serie fatta|finito|ho finito|completato|fatto|l.ho fatto)/,
    swap:     /(occupato|cambio|sostituisci|senza macchina|non c.è)/,
    fatigue:  /(pesante|stanco|senza fiato|ho fallito|non ce la faccio)/,
    pause:    /(pausa|fermati|aspetta)/,
    resume:   /(continua|sono tornato|dai|riprendi)/,
    finish:   /(finisci|chiudi|basta per oggi)/,
  },
}

function getPatterns(language: string): CommandPatterns {
  if (language in COMMAND_PATTERNS) return COMMAND_PATTERNS[language]
  // Fallback: tenta pelo prefixo (pt-BR → pt)
  const prefix = language.split("-")[0]
  const found = Object.keys(COMMAND_PATTERNS).find((k) => k.startsWith(prefix))
  return found ? COMMAND_PATTERNS[found] : COMMAND_PATTERNS["pt-BR"]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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

// ─── Componente ───────────────────────────────────────────────────────────────

export function GutoOnlineSession({
  open,
  onClose,
  workoutPlan,
  language,
  userName,
  onFinish,
}: GutoOnlineSessionProps) {
  const exercises = useMemo(() => workoutPlan.exercises || [], [workoutPlan.exercises])
  const sessionKey = useMemo(() => makeSessionKey(workoutPlan), [workoutPlan])

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
  // Permite que respostas IA assíncronas atualizem a linha só se o contexto não mudou
  const currentContextRef = useRef<string>("")

  const currentExercise: GutoWorkoutExercise | undefined = exercises[exerciseIndex]
  const displayName = userName?.trim()
  const totalExercises = exercises.length
  const totalSets = currentExercise?.sets || 1
  const restRemaining = restEndsAt ? Math.max(0, Math.ceil((restEndsAt - now) / 1000)) : 0
  const progressLabel = totalExercises
    ? `${Math.min(exerciseIndex + 1, totalExercises)}/${totalExercises}`
    : "0/0"

  // ─── Persistência de sessão ──────────────────────────────────────────────────

  // Salva estado sempre que muda — menos quando está briefing ou finished
  useEffect(() => {
    if (!open || phase === "briefing") return
    saveSessionState(sessionKey, {
      phase,
      exerciseIndex,
      currentSet,
      workoutKey: sessionKey,
    })
  }, [open, phase, exerciseIndex, currentSet, sessionKey])

  // ─── Reconhecimento de voz ────────────────────────────────────────────────────

  const stopRecognition = useCallback(() => {
    listeningEnabledRef.current = false
    try {
      recognitionRef.current?.stop()
    } catch {
      // Browser recognition pode jogar exceção quando já parado.
    }
  }, [])

  const speak = useCallback(
    async (intentKey: string, fallbackText: string) => {
      setLastGutoLine(fallbackText)
      try {
        recognitionRef.current?.stop()
      } catch {
        // Evita eco enquanto GUTO fala.
      }

      await gutoVoice.speak({
        intentKey,
        text: fallbackText,
        language,
        source: "online",
        preferStatic: false,
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
                // SpeechRecognition já iniciado ou browser negou o mic.
              }
            }
          }, 350)
        },
      })
    },
    [language],
  )

  // ─── Lógica de sessão ─────────────────────────────────────────────────────────

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
    // Apaga persistência só quando o treino realmente fechou
    clearSessionState(sessionKey)
    void speak("session.close.win", "Treino fechado. A gente apareceu hoje.")
    onFinish?.()
  }, [onFinish, sessionKey, speak, stopRecognition])

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

  // GUTO não chuta. Se o usuário disse que doeu, ele pergunta o que doeu.
  const handlePain = useCallback(() => {
    setPhase("paused")
    setRestEndsAt(null)
    setLastAction("Pausado por dor")
    const contextKey = `pain:${exerciseIndex}:${currentSet}`
    currentContextRef.current = contextKey

    // Responde imediatamente como amigo — não fica em silêncio esperando a IA
    void speak("session.pain.ask", "Para. Me fala curto: é dor, cansaço ou dúvida de execução? Quero entender antes de seguir.")

    // Chama IA em paralelo para resposta mais contextual
    void askGutoOnline("pain", {
      exerciseName: currentExercise?.name,
      exerciseMuscle: currentExercise?.muscleGroup,
      currentSet,
      totalSets,
    }).then((aiText) => {
      if (aiText && currentContextRef.current === contextKey) {
        setLastGutoLine(aiText)
      }
    })
  }, [currentExercise, currentSet, exerciseIndex, speak, totalSets])

  // GUTO não descarta a troca sem entender o contexto
  const handleSwap = useCallback(() => {
    const alternative = currentExercise?.alternatives?.[0]
    const contextKey = `swap:${exerciseIndex}:${currentSet}`
    currentContextRef.current = contextKey

    if (alternative) {
      const line = `Vai de ${alternative}. Mesma missão, sem quebrar o treino.`
      setLastAction("Troca orientada")
      void speak("set.swap.direct", line)
    } else {
      // Sem alternativa definida — GUTO pergunta o que tem disponível
      setLastAction("Aguardando contexto de troca")
      void speak("set.swap.ask", "Tudo bem. Qual equipamento você tem agora? Me fala e eu adapto.")

      // Chama IA para sugestão inteligente de substituição
      void askGutoOnline("substitute", {
        exerciseName: currentExercise?.name,
        exerciseMuscle: currentExercise?.muscleGroup,
      }).then((aiText) => {
        if (aiText && currentContextRef.current === contextKey) {
          setLastGutoLine(aiText)
        }
      })
    }
  }, [currentExercise, currentSet, exerciseIndex, speak])

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
    void speak("session.paused.hold", "Pausado. Eu fico aqui. Quando voltar, fala comigo e a gente segue.")
  }, [phase, speak])

  const handleTranscript = useCallback(
    (rawText: string) => {
      const text = normalize(rawText)
      if (!text || speakingRef.current) return

      setLastTranscript(rawText)
      const shortCommand = text.split(" ").length <= 6
      const p = getPatterns(language)
      const hasWake = p.wake.test(text)
      const command = text.replace(/^(ei|oi|ehi|oye|hey|hi|ciao|hola)?\s*guto+\s*/, "").trim()
      const canActWithoutWake = phase === "executing" || phase === "resting"
      if (!hasWake && !canActWithoutWake && !shortCommand) return

      if (p.pain.test(command)) {
        handlePain()
      } else if (p.setDone.test(command)) {
        handleSetDone()
      } else if (p.swap.test(command)) {
        handleSwap()
      } else if (p.fatigue.test(command)) {
        const contextKey = `fatigue:${exerciseIndex}:${currentSet}`
        currentContextRef.current = contextKey
        setLastAction("Carga/ritmo ajustado")

        // Resposta imediata — não deixa o usuário sem resposta
        void speak("set.fatigue.adjust", "A gente ajusta. Baixa o ego, segura a técnica e continua comigo.")

        // IA para resposta mais contextual se disponível
        void askGutoOnline("fatigue", {
          exerciseName: currentExercise?.name,
          currentSet,
          totalSets,
          userMessage: rawText,
        }).then((aiText) => {
          if (aiText && currentContextRef.current === contextKey) {
            setLastGutoLine(aiText)
          }
        })
      } else if (p.pause.test(command)) {
        handlePauseToggle()
      } else if (p.resume.test(command)) {
        if (phase === "paused") handlePauseToggle()
      } else if (p.finish.test(command)) {
        finishSession()
      } else {
        // GUTO não entendeu. Ele pede clareza como amigo, não joga erro.
        const contextKey = `unknown:${Date.now()}`
        currentContextRef.current = contextKey
        setLastAction("Aguardando clareza")

        // Resposta imediata que orienta sem ser robótica
        const fallback = EXCEPTION_FALLBACKS.unknown_command
        void speak("session.unknown.ask", fallback)

        // Tenta IA para resposta contextual ao que o usuário disse
        void askGutoOnline("unknown_command", {
          exerciseName: currentExercise?.name,
          userMessage: rawText,
          currentSet,
        }).then((aiText) => {
          if (aiText && currentContextRef.current === contextKey) {
            setLastGutoLine(aiText)
          }
        })
      }
    },
    [
      currentExercise,
      currentSet,
      exerciseIndex,
      finishSession,
      handlePain,
      handlePauseToggle,
      handleSetDone,
      handleSwap,
      language,
      phase,
      speak,
      totalSets,
    ],
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
              // Já iniciado ou browser negou.
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

  // ─── Efeitos ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return

    // Tenta restaurar sessão salva antes de iniciar do zero
    const saved = loadSessionState(sessionKey)

    if (saved && saved.phase !== "finished" && saved.phase !== "briefing") {
      // GUTO retoma de onde parou — não descarta progresso sem perguntar
      setExerciseIndex(saved.exerciseIndex)
      setCurrentSet(saved.currentSet)
      // Se estava em descanso, volta em pausa para o usuário confirmar
      setPhase(saved.phase === "resting" ? "paused" : saved.phase)
      setRestEndsAt(null) // descanso vencido — não conta tempo que passou com app fechado

      const resumeExercise = exercises[saved.exerciseIndex]
      const resumeLine = resumeExercise
        ? `Voltou. Estávamos em ${resumeExercise.name}, série ${saved.currentSet}. Quer continuar daqui?`
        : "Voltou. A gente continua de onde parou."

      void speak("session.entry.returning", resumeLine)
    } else {
      // Sessão nova
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
    }

    startListening()

    return () => {
      stopRecognition()
      gutoVoice.stop()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]) // Só re-executa quando o modal abre — não em cada mudança de estado

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
              clearSessionState(sessionKey)
              void speak("session.entry.returning", "Reiniciando. A gente começa do início.")
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
