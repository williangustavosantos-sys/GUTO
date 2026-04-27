"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Loader2, Mic, Send, Volume2, VolumeX } from "lucide-react"

import { API_URL, getApiErrorMessage } from "@/lib/api/client"
import { getGutoProactive, sendGutoMessage } from "@/lib/api/guto"
import type { GutoAvatarEmotion, GutoExpectedResponse, GutoWorkoutPlan } from "@/lib/api/guto"
import type { EvolutionStage, SupportedLanguage } from "@/types/contract"

import { GutoOfficialAvatar } from "../guto-official-avatar"
import { getLanguage, translations } from "../translations"
import type { MissionExercise } from "../view-models"

interface PendingExerciseQuestion {
  id: string
  exercise: MissionExercise
}

interface ChatTabProps {
  userName: string
  language: string
  evolution?: EvolutionStage
  pendingExerciseQuestion?: PendingExerciseQuestion | null
  onExerciseQuestionHandled?: () => void
  onWorkoutPlanUpdated?: (plan: GutoWorkoutPlan | null) => void
  isDepleted?: boolean
}

interface Message {
  id: string
  text: string
  isGuto: boolean
  timestamp: Date
  avatarEmotion?: GutoAvatarEmotion
}

const chatCopy: Record<SupportedLanguage, { channel: string; speaking: string }> = {
  "pt-BR": { channel: "Canal do oráculo", speaking: "falando" },
  "en-US": { channel: "Oracle channel", speaking: "speaking" },
  "es-ES": { channel: "Canal del oráculo", speaking: "hablando" },
  "it-IT": { channel: "Canale dell'oracolo", speaking: "parlando" },
}

const openingMessage: Record<SupportedLanguage, (name: string) => string> = {
  "pt-BR": (name) => `${name}, finalmente. Tava te esperando. Enquanto isso eu já deixei três rotas prontas: academia, casa ou parque. Qual faz mais sentido pra você hoje?`,
  "en-US": (name) => `${name}, finally. I was waiting for you. While I waited, I left three routes open: gym, home, or park. Which one fits you best today?`,
  "es-ES": (name) => `${name}, por fin. Te estaba esperando. Mientras tanto dejé tres rutas abiertas: gimnasio, casa o parque. Cual te conviene mas hoy?`,
  "it-IT": (name) => `${name}, finalmente. Ti stavo aspettando. Intanto ho gia lasciato aperte tre strade: palestra, casa o parco. Quale ti conviene di piu oggi?`,
}

const GUTO_USER_ID = "local-user"
const PROACTIVE_CHECK_INTERVAL_MS = 60_000

function formatDisplayName(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleUpperCase()
}

function normalizeAvatarEmotion(value?: string): GutoAvatarEmotion {
  return value === "alert" || value === "critical" || value === "reward" ? value : "default"
}

export function ChatTab({
  userName,
  language,
  evolution = "BABY",
  pendingExerciseQuestion,
  onExerciseQuestionHandled,
  onWorkoutPlanUpdated,
  isDepleted = false,
}: ChatTabProps) {
  const validLang = getLanguage(language)
  const locale = translations[validLang]
  const copy = chatCopy[validLang]
  const brandName = formatDisplayName(userName || "OPERADOR")
  const initialGutoMessage = openingMessage[validLang](brandName)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "guto-initial",
      text: initialGutoMessage,
      isGuto: true,
      timestamp: new Date(),
      avatarEmotion: "default" as GutoAvatarEmotion,
    },
  ])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isRecording, setIsRecording] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>(messages)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const handledExerciseQuestionRef = useRef<string | null>(null)
  const proactiveInFlightRef = useRef(false)
  const lastProactiveKeyRef = useRef<string | null>(null)
  const arrivalBriefingRequestedRef = useRef(false)
  const pendingExpectedResponseRef = useRef<GutoExpectedResponse | null>(null)
  const pendingExpectedResponseMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0]?.id !== "guto-initial") return current

      pendingExpectedResponseRef.current = null
      pendingExpectedResponseMessageIdRef.current = null

      const next = [
        {
          ...current[0],
          text: initialGutoMessage,
          avatarEmotion: "default" as GutoAvatarEmotion,
        },
      ]
      messagesRef.current = next
      return next
    })
  }, [initialGutoMessage])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
    }
  }, [])

  const lastGutoIndex = useMemo(
    () => messages.reduce((acc, msg, index) => (msg.isGuto ? index : acc), -1),
    [messages]
  )

  const playBase64Mp3 = useCallback(async (audioBase64: string) => {
    if (!audioBase64 || audioBase64.length < 100) return

    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }

      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`)
      currentAudioRef.current = audio
      setIsSpeaking(true)

      audio.onended = () => setIsSpeaking(false)
      audio.onerror = () => setIsSpeaking(false)

      await audio.play()
    } catch (error) {
      setIsSpeaking(false)
      console.error("Erro ao reproduzir áudio:", error)
    }
  }, [])

  const synthesizeAndPlay = useCallback(async (text: string, lang: SupportedLanguage) => {
    try {
      const response = await fetch(`${API_URL}/voz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: lang }),
      })

      const data = await response.json()

      if (!response.ok || !data?.audioContent) {
        console.error("Falha ao gerar voz:", data)
        return
      }

      await playBase64Mp3(data.audioContent)
    } catch (error) {
      console.error("Erro na rota /voz:", error)
    }
  }, [playBase64Mp3])

  const checkProactiveMessage = useCallback(async (forceArrivalBriefing = false) => {
    if (proactiveInFlightRef.current || isSending) return
    if (forceArrivalBriefing && arrivalBriefingRequestedRef.current) return

    proactiveInFlightRef.current = true
    if (forceArrivalBriefing) {
      arrivalBriefingRequestedRef.current = true
    }
    const safeLanguage = getLanguage(language) as SupportedLanguage

    try {
      const data = await getGutoProactive({
        userId: GUTO_USER_ID,
        language: safeLanguage,
        force: forceArrivalBriefing,
      })
      const fala = data.fala?.trim()
      if (!data.due || !fala) {
        if (forceArrivalBriefing) {
          pendingExpectedResponseRef.current = null
          pendingExpectedResponseMessageIdRef.current = null
        }
        return
      }

      const proactiveKey = `${data.slot || "slot"}-${fala}`
      if (lastProactiveKeyRef.current === proactiveKey) return
      lastProactiveKeyRef.current = proactiveKey

      const messageId = `g-proactive-${Date.now()}`
      const gutoMessage: Message = {
        id: messageId,
        text: fala,
        isGuto: true,
        timestamp: new Date(),
        avatarEmotion: normalizeAvatarEmotion(data.avatarEmotion),
      }

      pendingExpectedResponseRef.current = data.expectedResponse || null
      pendingExpectedResponseMessageIdRef.current = data.expectedResponse ? messageId : null

      setMessages((prev) => {
        if (forceArrivalBriefing && prev.length === 1 && prev[0]?.id === "guto-initial") {
          return [gutoMessage]
        }

        return [...prev, gutoMessage]
      })

      if (!isMuted) {
        await synthesizeAndPlay(fala, safeLanguage)
      }
    } catch (error) {
      console.warn(`Proatividade do GUTO indisponível: ${getApiErrorMessage(error)}`)
    } finally {
      proactiveInFlightRef.current = false
    }
  }, [isMuted, isSending, language, synthesizeAndPlay])

  useEffect(() => {
    void checkProactiveMessage(true)
    const timer = window.setInterval(() => {
      void checkProactiveMessage()
    }, PROACTIVE_CHECK_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [checkProactiveMessage])

  const sendAudio = async (blob: Blob) => {
    setIsSending(true)
    const formData = new FormData()
    formData.append("audio", blob)
    formData.append("language", language)

    try {
      const response = await fetch(`${API_URL}/guto-audio`, { method: "POST", body: formData })
      const data = await response.json()

      const gutoMessage: Message = {
        id: `g-audio-${Date.now()}`,
        text: data.fala || "Executado.",
        isGuto: true,
        timestamp: new Date(),
        avatarEmotion: normalizeAvatarEmotion(data.avatarEmotion),
      }

      setMessages((prev) => [...prev, gutoMessage])
      if (data.acao === "updateWorkout" && data.workoutPlan) {
        onWorkoutPlanUpdated?.(data.workoutPlan)
      }
      pendingExpectedResponseRef.current = null
      pendingExpectedResponseMessageIdRef.current = null

      if (!isMuted && data.audioContent) {
        await playBase64Mp3(data.audioContent)
      }
    } catch (error) {
      console.error("Erro no envio do áudio:", error)
    } finally {
      setIsSending(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => audioChunksRef.current.push(event.data)
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        await sendAudio(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Erro ao acessar microfone", error)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const sendTextToGuto = useCallback(async (displayText: string, modelInput = displayText) => {
    const safeLanguage = getLanguage(language) as SupportedLanguage

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      text: displayText,
      isGuto: false,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsSending(true)

    try {
      const lastVisibleGuto = [...messagesRef.current].reverse().find((message) => message.isGuto)
      const expectedResponse =
        lastVisibleGuto?.id &&
        pendingExpectedResponseMessageIdRef.current === lastVisibleGuto.id
          ? pendingExpectedResponseRef.current
          : null

      const data = await sendGutoMessage({
        profile: { name: userName || "Usuário", userId: GUTO_USER_ID },
        input: modelInput,
        language: safeLanguage,
        history: messagesRef.current.map((message) => ({
          role: message.isGuto ? "model" : "user",
          parts: [{ text: message.text }],
        })),
        expectedResponse,
      })

      const fala = data?.fala?.trim() || "Sem distração. Executa a próxima ação agora."
      const messageId = `g-${Date.now()}`
      pendingExpectedResponseRef.current = data?.expectedResponse || null
      pendingExpectedResponseMessageIdRef.current = data?.expectedResponse ? messageId : null

      const gutoMessage: Message = {
        id: messageId,
        text: fala,
        isGuto: true,
        timestamp: new Date(),
        avatarEmotion: normalizeAvatarEmotion(data.avatarEmotion),
      }

      setMessages((prev) => [...prev, gutoMessage])
      if (data.acao === "updateWorkout" && data.workoutPlan) {
        onWorkoutPlanUpdated?.(data.workoutPlan)
      }

      if (!isMuted) {
        await synthesizeAndPlay(fala, safeLanguage)
      }
    } catch {
      pendingExpectedResponseRef.current = null
      pendingExpectedResponseMessageIdRef.current = null
      setMessages((prev) => [
        ...prev,
        {
          id: `g-err-${Date.now()}`,
          text: "Perdi conexão por um momento. Reorganiza e me envia de novo em 1 frase.",
          isGuto: true,
          timestamp: new Date(),
          avatarEmotion: "default",
        },
      ])
    } finally {
      setIsSending(false)
    }
  }, [isMuted, language, onWorkoutPlanUpdated, synthesizeAndPlay, userName])

  useEffect(() => {
    if (!pendingExerciseQuestion || isSending) return
    if (handledExerciseQuestionRef.current === pendingExerciseQuestion.id) return

    handledExerciseQuestionRef.current = pendingExerciseQuestion.id
    const { exercise } = pendingExerciseQuestion
    const displayText = `Dúvida: ${exercise.name}`
    const modelInput = [
      "O usuário apertou o botão de dúvida no treino do dia.",
      `Exercício: ${exercise.name}.`,
      `Séries: ${exercise.sets}. Repetições: ${exercise.reps}. Descanso: ${exercise.rest}.`,
      `Instrução base: ${exercise.cue}`,
      `Observação do GUTO: ${exercise.note}`,
      "Explique como executar com clareza, corrija os principais erros e termine dizendo que ele pode perguntar a dúvida específica na mesma conversa.",
    ].join(" ")

    void sendTextToGuto(displayText, modelInput).finally(() => {
      onExerciseQuestionHandled?.()
    })
  }, [isSending, onExerciseQuestionHandled, pendingExerciseQuestion, sendTextToGuto])

  const handleSend = async () => {
    if (!input.trim() || isSending) return
    await sendTextToGuto(input.trim())
  }

  const latestGuto = messages[lastGutoIndex] ?? messages[0]
  const latestUser = [...messages].reverse().find((message) => !message.isGuto)

  return (
    <div className="guto-chat-stage relative h-full min-h-0 overflow-hidden">
      <div className="guto-top-strip absolute left-0 top-[1.03%] z-20 h-[9.27%] w-full border-y border-[var(--guto-cyan)]">
        <div className="guto-chat-brand" aria-label={brandName ? `GUTO e ${brandName}` : "GUTO"}>
          <Image
            src="/assets/guto/logo_guto.png"
            alt="GUTO"
            width={104}
            height={33}
            priority
            className="guto-chat-brand-logo"
          />
        </div>
        {brandName && (
          <div className="guto-chat-partner">
            <span className="guto-chat-partner-amp" aria-hidden="true">
              &
            </span>
            <span className="guto-chat-partner-name">{brandName}</span>
          </div>
        )}
      </div>

      <div
        className="guto-chat-bubble absolute left-[21.89%] z-10 h-[16.2%] w-[57.71%] rounded-[18px]"
        style={{
          top: "calc(var(--guto-chat-header-top) + var(--guto-chat-header-height) + clamp(10px, 1.9dvh, 18px))",
        }}
      >
        <div className="guto-chat-bubble-copy">
          <motion.p
            key={latestGuto.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="guto-chat-bubble-text"
          >
            {latestGuto.text}
          </motion.p>
        </div>
      </div>

      <div className="guto-chat-avatar-stage absolute flex items-center justify-center">
          <GutoOfficialAvatar
            size="xl"
            showPlatform={false}
            evolution={evolution}
            emotion={isDepleted ? "critical" : latestGuto.avatarEmotion || "default"}
            className="h-full w-full"
          />
        </div>

      <button
        type="button"
        onClick={() =>
          setIsMuted((prev) => {
            const next = !prev
            if (next && currentAudioRef.current) {
              currentAudioRef.current.pause()
              currentAudioRef.current = null
              setIsSpeaking(false)
            }
            return next
          })
        }
        className="guto-chat-sound-toggle absolute z-30"
        data-audio-active={!isMuted}
        aria-label={isMuted ? "Ativar fala do GUTO" : "Silenciar fala do GUTO"}
        aria-pressed={!isMuted}
      >
        {isMuted ? <VolumeX className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
      </button>

        {latestUser && (
          <motion.div
            key={latestUser.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="guto-latest-user-bubble absolute left-1/2 z-20 max-w-[84%] -translate-x-1/2 rounded-[1.1rem] border border-white/80 bg-white/45 px-4 py-2 text-center text-xs font-semibold tracking-normal text-[rgba(13,35,65,0.58)] backdrop-blur-md"
          >
            {latestUser.text}
          </motion.div>
        )}

      <div className="guto-chat-input-anchor absolute left-[8.46%] z-30 h-[58px] w-[81.34%]">
        <div className="guto-chat-input h-full rounded-[18px] px-3 py-2">
          <div className="flex h-full items-center gap-3">
            <motion.button
              type="button"
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerLeave={() => isRecording && stopRecording()}
              className="grid h-[30px] w-[29px] shrink-0 place-items-center rounded-full text-[var(--guto-cyan)]"
              animate={isRecording ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.8, repeat: isRecording ? Infinity : 0 }}
              aria-label="Microfone"
            >
              <Mic className="h-[30px] w-[29px]" style={{ color: isRecording ? "#c03535" : "var(--guto-cyan)" }} />
            </motion.button>

            <input
              type="text"
              placeholder={locale.placeholder}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleSend()}
              className="min-w-0 flex-1 bg-transparent text-center text-[16px] font-semibold leading-none tracking-[0.3px] text-[var(--guto-navy)] outline-none placeholder:text-[#a6aeb1]"
            />

            <motion.button
              type="button"
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="grid h-[30px] w-[29px] shrink-0 place-items-center rounded-full text-[var(--guto-cyan)] disabled:opacity-35"
              whileTap={{ scale: isSending ? 1 : 0.94 }}
              aria-label="Enviar mensagem"
            >
              {isSending ? <Loader2 className="h-[25px] w-[25px] animate-spin" /> : <Send className="h-[30px] w-[29px]" />}
            </motion.button>
          </div>
        </div>

        {isSpeaking && !isMuted && (
          <div className="mt-2 text-center font-mono text-[9px] uppercase tracking-normal text-[var(--guto-cyan)]">
            {copy.speaking}
          </div>
        )}
      </div>
    </div>
  )
}
