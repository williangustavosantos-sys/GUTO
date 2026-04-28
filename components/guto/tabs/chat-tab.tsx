"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Loader2, Mic, Send, Volume2, VolumeX } from "lucide-react"

import { API_URL, getApiErrorMessage } from "@/lib/api/client"
import { getGutoProactive, sendGutoMessage, trackGutoEvent } from "@/lib/api/guto"
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
  userId: string
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

interface BrowserSpeechRecognitionResult {
  transcript: string
}

interface BrowserSpeechRecognitionEvent {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: BrowserSpeechRecognitionResult
    }
  }
}

interface BrowserSpeechRecognitionErrorEvent {
  error?: string
}

interface BrowserSpeechRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
  }
}

interface StoredChatState {
  messages: Message[]
  expectedResponse: GutoExpectedResponse | null
  expectedResponseMessageId: string | null
}

const chatCopy: Record<SupportedLanguage, { channel: string; speaking: string; micUnavailable: string; unmute: string; mute: string }> = {
  "pt-BR": {
    channel: "Canal do oráculo",
    speaking: "falando",
    micUnavailable: "O microfone de fala não está disponível neste navegador. Escreve a resposta em uma frase curta.",
    unmute: "Ativar fala do GUTO",
    mute: "Silenciar fala do GUTO",
  },
  "en-US": {
    channel: "Oracle channel",
    speaking: "speaking",
    micUnavailable: "Speech microphone is not available in this browser. Type the answer in one short sentence.",
    unmute: "Enable GUTO voice",
    mute: "Mute GUTO voice",
  },
  "es-ES": {
    channel: "Canal del oráculo",
    speaking: "hablando",
    micUnavailable: "El micrófono de voz no está disponible en este navegador. Escribe la respuesta en una frase corta.",
    unmute: "Activar voz de GUTO",
    mute: "Silenciar voz de GUTO",
  },
  "it-IT": {
    channel: "Canale dell'oracolo",
    speaking: "parlando",
    micUnavailable: "Il microfono vocale non è disponibile in questo browser. Scrivi la risposta in una frase breve.",
    unmute: "Attiva la voce di GUTO",
    mute: "Silenzia la voce di GUTO",
  },
}

const openingMessage: Record<SupportedLanguage, (name: string) => string> = {
  "pt-BR": (name) => `${name}, finalmente. Tava te esperando. Enquanto isso eu já deixei três rotas prontas: academia, casa ou parque. Qual faz mais sentido pra você hoje?`,
  "en-US": (name) => `${name}, finally. I was waiting for you. While I waited, I left three routes open: gym, home, or park. Which one fits you best today?`,
  "es-ES": (name) => `${name}, por fin. Te estaba esperando. Mientras tanto dejé tres rutas abiertas: gimnasio, casa o parque. ¿Cuál te conviene más hoy?`,
  "it-IT": (name) => `${name}, finalmente. Ti stavo aspettando. Intanto ho già lasciato aperte tre strade: palestra, casa o parco. Quale ti conviene di più oggi?`,
}

const PROACTIVE_CHECK_INTERVAL_MS = 60_000
const FIRST_MESSAGE_SENT_KEY_PREFIX = "guto-first-message-sent"
const CHAT_STATE_KEY_PREFIX = "guto-chat-state"
const STALE_AUDIO_FAILURE_TEXT = "O áudio falhou. Sem perder o ritmo: escreve a mesma resposta em uma frase curta."

function formatDisplayName(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleUpperCase()
}

function normalizeAvatarEmotion(value?: string): GutoAvatarEmotion {
  return value === "alert" || value === "critical" || value === "reward" ? value : "default"
}

function getBrowserSpeechRecognition() {
  if (typeof window === "undefined") return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

function isStaleAudioFailureMessage(message: Message) {
  return message.isGuto && message.text.trim() === STALE_AUDIO_FAILURE_TEXT
}

function normalizeMessageText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase()
}

function removeConsecutiveDuplicateGutoMessages(messages: Message[]) {
  return messages.reduce<Message[]>((cleaned, message) => {
    const previous = cleaned[cleaned.length - 1]
    const isDuplicateGuto =
      previous?.isGuto &&
      message.isGuto &&
      normalizeMessageText(previous.text) === normalizeMessageText(message.text)

    if (!isDuplicateGuto) {
      cleaned.push(message)
    }

    return cleaned
  }, [])
}

function appendMessagesWithoutDuplicateGuto(previous: Message[], nextMessages: Message[]) {
  return removeConsecutiveDuplicateGutoMessages([...previous, ...nextMessages])
}

function shouldTrackFirstMessage(userId: string) {
  if (typeof window === "undefined") return false

  try {
    const key = `${FIRST_MESSAGE_SENT_KEY_PREFIX}:${userId}`
    if (window.localStorage.getItem(key)) return false
    window.localStorage.setItem(key, new Date().toISOString())
    return true
  } catch {
    return false
  }
}

function getChatStateKey(userId: string) {
  return `${CHAT_STATE_KEY_PREFIX}:${userId}`
}

function readStoredChatState(userId: string): StoredChatState | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(getChatStateKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      messages?: Array<Omit<Message, "timestamp"> & { timestamp?: string }>
      expectedResponse?: GutoExpectedResponse | null
      expectedResponseMessageId?: string | null
    }
    const messages = Array.isArray(parsed.messages)
      ? parsed.messages
          .filter((message) => typeof message.text === "string" && typeof message.id === "string")
          .slice(-24)
          .map((message) => ({
            ...message,
            timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
          }))
      : []

    if (!messages.length) return null
    return {
      messages: removeConsecutiveDuplicateGutoMessages(
        messages.filter((message) => !isStaleAudioFailureMessage(message))
      ),
      expectedResponse: parsed.expectedResponse || null,
      expectedResponseMessageId: parsed.expectedResponseMessageId || null,
    }
  } catch {
    return null
  }
}

function writeStoredChatState(userId: string, state: StoredChatState) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(
      getChatStateKey(userId),
      JSON.stringify({
        messages: state.messages.slice(-24).map((message) => ({
          ...message,
          timestamp: message.timestamp.toISOString(),
        })),
        expectedResponse: state.expectedResponse,
        expectedResponseMessageId: state.expectedResponseMessageId,
      })
    )
  } catch {}
}

export function ChatTab({
  userId,
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
  const storedChatState = useMemo(() => readStoredChatState(userId), [userId])
  const initialChatState = useMemo(
    () =>
      storedChatState || {
        messages: [
          {
            id: "guto-initial",
            text: initialGutoMessage,
            isGuto: true,
            timestamp: new Date(),
            avatarEmotion: "default" as GutoAvatarEmotion,
          },
        ],
        expectedResponse: null,
        expectedResponseMessageId: null,
      },
    [initialGutoMessage, storedChatState]
  )

  const [messages, setMessages] = useState<Message[]>(initialChatState.messages)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isRecording, setIsRecording] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>(messages)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const speechTranscriptRef = useRef("")
  const speechResultHandledRef = useRef(false)
  const handledExerciseQuestionRef = useRef<string | null>(null)
  const proactiveInFlightRef = useRef(false)
  const sendInFlightRef = useRef(false)
  const lastProactiveKeyRef = useRef<string | null>(null)
  const arrivalBriefingRequestedRef = useRef(false)
  const shouldForceArrivalBriefingRef = useRef(!storedChatState)
  const pendingExpectedResponseRef = useRef<GutoExpectedResponse | null>(initialChatState.expectedResponse)
  const pendingExpectedResponseMessageIdRef = useRef<string | null>(initialChatState.expectedResponseMessageId)

  useEffect(() => {
    messagesRef.current = messages
    writeStoredChatState(userId, {
      messages,
      expectedResponse: pendingExpectedResponseRef.current,
      expectedResponseMessageId: pendingExpectedResponseMessageIdRef.current,
    })
  }, [messages, userId])

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
        userId,
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

        return appendMessagesWithoutDuplicateGuto(prev, [gutoMessage])
      })

      if (!isMuted) {
        await synthesizeAndPlay(fala, safeLanguage)
      }
    } catch (error) {
      console.warn(`Proatividade do GUTO indisponível: ${getApiErrorMessage(error)}`)
    } finally {
      proactiveInFlightRef.current = false
    }
  }, [isMuted, isSending, language, synthesizeAndPlay, userId])

  useEffect(() => {
    const shouldForceArrivalBriefing = shouldForceArrivalBriefingRef.current
    shouldForceArrivalBriefingRef.current = false

    void checkProactiveMessage(shouldForceArrivalBriefing)
    const timer = window.setInterval(() => {
      void checkProactiveMessage()
    }, PROACTIVE_CHECK_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [checkProactiveMessage])

  const startRecording = async () => {
    if (isSending || isRecording) return

    const SpeechRecognition = getBrowserSpeechRecognition()
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        speechTranscriptRef.current = ""
        speechResultHandledRef.current = false
        recognition.lang = getLanguage(language)
        recognition.continuous = false
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onresult = (event) => {
          const parts: string[] = []
          for (let index = 0; index < event.results.length; index += 1) {
            const transcript = event.results[index]?.[0]?.transcript
            if (transcript) parts.push(transcript)
          }
          speechTranscriptRef.current = parts.join(" ").replace(/\s+/g, " ").trim()
        }

        recognition.onerror = (event) => {
          console.warn("Reconhecimento de voz indisponível:", event.error)
        }

        recognition.onend = () => {
          setIsRecording(false)
          speechRecognitionRef.current = null
          if (speechResultHandledRef.current) return

          const transcript = speechTranscriptRef.current.trim()
          speechResultHandledRef.current = true
          if (transcript) {
            void sendTextToGuto(transcript)
            return
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `g-speech-empty-${Date.now()}`,
              text: copy.micUnavailable,
              isGuto: true,
              timestamp: new Date(),
              avatarEmotion: "default",
            },
          ])
        }

        speechRecognitionRef.current = recognition
        recognition.start()
        setIsRecording(true)
        return
      } catch (error) {
        console.warn("Reconhecimento de voz do navegador falhou:", error)
        speechRecognitionRef.current = null
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `g-speech-unavailable-${Date.now()}`,
        text: copy.micUnavailable,
        isGuto: true,
        timestamp: new Date(),
        avatarEmotion: "default",
      },
    ])
  }

  const stopRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop()
      } catch (error) {
        console.warn("Falha ao parar reconhecimento de voz:", error)
      }
      return
    }

    setIsRecording(false)
  }

  const sendTextToGuto = useCallback(async (displayText: string, modelInput = displayText) => {
    if (sendInFlightRef.current) return
    sendInFlightRef.current = true

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

    if (shouldTrackFirstMessage(userId)) {
      void trackGutoEvent({
        event: "first_message_sent",
        userId,
        language: safeLanguage,
        metadata: { inputType: "text" },
      }).catch((error) => {
        console.warn(`Evento do GUTO não registrado: ${getApiErrorMessage(error)}`)
      })
    }

    try {
      const lastVisibleGuto = [...messagesRef.current].reverse().find((message) => message.isGuto)
      const expectedResponse =
        lastVisibleGuto?.id &&
        pendingExpectedResponseMessageIdRef.current === lastVisibleGuto.id
          ? pendingExpectedResponseRef.current
          : null

      const data = await sendGutoMessage({
        profile: { name: userName || "Usuário", userId },
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

      setMessages((prev) => appendMessagesWithoutDuplicateGuto(prev, [gutoMessage]))
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
      sendInFlightRef.current = false
      setIsSending(false)
    }
  }, [isMuted, language, onWorkoutPlanUpdated, synthesizeAndPlay, userId, userName])

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
  const visibleMessages = messages.slice(-8)

  return (
    <div className="guto-chat-stage relative h-full min-h-0 overflow-hidden">
      <div className="guto-top-strip absolute left-0 top-[1.03%] z-40 h-[9.27%] w-full border-y border-[var(--guto-cyan)]">
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
        className="guto-chat-sound-toggle absolute z-40"
        data-audio-active={!isMuted}
        aria-label={isMuted ? copy.unmute : copy.mute}
        aria-pressed={!isMuted}
      >
        {isMuted ? <VolumeX className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
      </button>

      <div className="pointer-events-none absolute left-1/2 top-[45%] z-10 h-[min(51dvh,430px)] w-[min(96vw,28rem)] -translate-x-1/2 -translate-y-1/2">
        <GutoOfficialAvatar
          size="xl"
          showPlatform={false}
          evolution={evolution}
          emotion={isDepleted ? "critical" : latestGuto.avatarEmotion || "default"}
          className="h-full w-full"
        />
      </div>

      <div
        ref={scrollRef}
        className="absolute left-0 right-0 top-[54%] bottom-[calc(var(--guto-chat-input-bottom)+72px)] z-30 overflow-y-auto px-5 pb-3"
      >
        <div className="flex min-h-full flex-col justify-end gap-3">
          {visibleMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={
                message.isGuto
                  ? "mx-auto w-full max-w-[20rem] rounded-[18px] border border-[var(--guto-cyan)]/80 bg-white/70 px-4 py-3 text-center font-mono text-[clamp(11px,2.8vw,13px)] font-black leading-snug text-[var(--guto-navy)] shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_18px_38px_rgba(137,151,168,0.12)] backdrop-blur-md"
                  : "ml-auto max-w-[70%] rounded-[18px] border border-white/80 bg-white/80 px-4 py-2 text-right text-xs font-semibold leading-snug text-[rgba(13,35,65,0.68)] shadow-[0_12px_26px_rgba(137,151,168,0.1)] backdrop-blur-md"
              }
            >
              {message.text}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute left-[8.46%] z-50 h-[58px] w-[81.34%] bottom-[var(--guto-chat-input-bottom)]">
        <div className="guto-chat-input h-full rounded-[18px] px-3 py-2">
          <div className="flex h-[42px] items-center gap-3">
            <motion.button
              type="button"
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerLeave={() => isRecording && stopRecording()}
              disabled={isSending}
              className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full text-[var(--guto-cyan)]"
              animate={isRecording ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.8, repeat: isRecording ? Infinity : 0 }}
              aria-label="Microfone"
            >
              <Mic className="h-[28px] w-[28px]" style={{ color: isRecording ? "#c03535" : "var(--guto-cyan)" }} />
            </motion.button>

            <input
              type="text"
              placeholder={locale.placeholder}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.repeat) return
                event.preventDefault()
                void handleSend()
              }}
              className="min-w-0 flex-1 bg-transparent text-center text-[16px] font-semibold leading-none tracking-normal text-[var(--guto-navy)] outline-none placeholder:text-[#a6aeb1]"
            />

            <motion.button
              type="button"
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full text-[var(--guto-cyan)] disabled:opacity-35"
              whileTap={{ scale: isSending ? 1 : 0.94 }}
              aria-label="Enviar mensagem"
            >
              {isSending ? <Loader2 className="h-[24px] w-[24px] animate-spin" /> : <Send className="h-[27px] w-[27px]" />}
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
