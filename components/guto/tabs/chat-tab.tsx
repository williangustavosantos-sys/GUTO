"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Mic, Send, TrendingUp, Volume2, VolumeX } from "lucide-react"

import { API_URL, getApiErrorMessage } from "@/lib/api/client"
import { getGutoProactive, sendGutoMessage, trackGutoEvent } from "@/lib/api/guto"
import type { DietMeal, GutoAvatarEmotion, GutoExpectedResponse, GutoWorkoutPlan } from "@/lib/api/guto"
import type { EvolutionStage, SupportedLanguage } from "@/types/contract"

import { GutoOfficialAvatar } from "../guto-official-avatar"
import { getLanguage, translations } from "../translations"
import type { MissionExercise } from "../view-models"
import { gutoAudio } from "@/lib/audio-haptics"

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
  pendingFoodQuestion?: { food: DietMeal["foods"][0]; meal: DietMeal } | null
  onFoodQuestionHandled?: () => void
  onWorkoutPlanUpdated?: (plan: GutoWorkoutPlan | null) => void
  isDepleted?: boolean
  initialXpGranted?: boolean
  initialXpRewardSeen?: boolean
  onXpRewardSeen?: () => void
  memory?: import("@/lib/api/guto").GutoMemory | null
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

const chatCopy: Record<
  SupportedLanguage,
  {
    channel: string
    speaking: string
    micUnavailable: string
    micNoSpeech: string
    unmute: string
    mute: string
    opening: (name: string) => string
  }
> = {
  "pt-BR": {
    channel: "Canal do oráculo",
    speaking: "falando",
    micUnavailable: "Este navegador não liberou reconhecimento de fala aqui. Digita em uma frase curta que eu sigo contigo.",
    micNoSpeech: "Não entrou voz suficiente. Segura o microfone e fala uma frase direta.",
    unmute: "Ativar fala do GUTO",
    mute: "Silenciar fala do GUTO",
    opening: (name) => `${name ? `${name}, ` : ""}chegou. Missão viva. Me diz em uma frase: vai treinar agora ou precisa ajustar a rota?`,
  },
  "en-US": {
    channel: "Oracle channel",
    speaking: "speaking",
    micUnavailable: "This browser did not expose speech recognition here. Type one short sentence and I will keep this moving.",
    micNoSpeech: "Not enough voice came through. Hold the mic and say one direct sentence.",
    unmute: "Enable GUTO voice",
    mute: "Mute GUTO voice",
    opening: (name) => `${name ? `${name}, ` : ""}you are in. Mission stays alive. Tell me in one sentence: training now or adjusting the route?`,
  },
  "es-ES": {
    channel: "Canal del oráculo",
    speaking: "hablando",
    micUnavailable: "Este navegador no expuso reconocimiento de voz aquí. Escribe una frase corta y seguimos.",
    micNoSpeech: "No entró suficiente voz. Mantén el micrófono y di una frase directa.",
    unmute: "Activar voz de GUTO",
    mute: "Silenciar voz de GUTO",
    opening: (name) => `${name ? `${name}, ` : ""}llegaste. La misión sigue viva. Dime en una frase: entrenas ahora o ajustamos la ruta?`,
  },
  "it-IT": {
    channel: "Canale dell'oracolo",
    speaking: "parlando",
    micUnavailable: "Questo browser non ha esposto il riconoscimento vocale qui. Scrivi una frase breve e andiamo avanti.",
    micNoSpeech: "Non è arrivata abbastanza voce. Tieni premuto il microfono e di una frase diretta.",
    unmute: "Attiva la voce di GUTO",
    mute: "Silenzia la voce di GUTO",
    opening: (name) => `${name ? `${name}, ` : ""}sei dentro. La missione resta viva. Dimmi in una frase: ti alleni ora o adattiamo la rotta?`,
  },
}

const PROACTIVE_CHECK_INTERVAL_MS = 60_000
const FIRST_MESSAGE_SENT_KEY_PREFIX = "guto-first-message-sent"
const CHAT_STATE_KEY_PREFIX = "guto-chat-state"
const INITIAL_XP_REWARD_SEEN_KEY_PREFIX = "guto-initial-xp-reward-seen"
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

function getInitialXpRewardSeenKey(userId: string) {
  return `${INITIAL_XP_REWARD_SEEN_KEY_PREFIX}:${userId}`
}

function readInitialXpRewardSeen(userId: string) {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(getInitialXpRewardSeenKey(userId)) === "true"
  } catch {
    return false
  }
}

function writeInitialXpRewardSeen(userId: string) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(getInitialXpRewardSeenKey(userId), "true")
  } catch {}
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
  pendingFoodQuestion,
  onFoodQuestionHandled,
  onWorkoutPlanUpdated,
  isDepleted = false,
  initialXpGranted = false,
  initialXpRewardSeen = false,
  onXpRewardSeen,
  memory,
}: ChatTabProps) {
  const validLang = getLanguage(language)
  const locale = translations[validLang]
  const copy = chatCopy[validLang]
  const brandName = formatDisplayName(userName || "")
  const storedChatState = useMemo(() => readStoredChatState(userId), [userId])
  const localOpeningMessage = useMemo<Message>(
    () => ({
      id: `g-local-opening-${userId}-${validLang}`,
      text: copy.opening(brandName),
      isGuto: true,
      timestamp: new Date(),
      avatarEmotion: "default",
    }),
    [brandName, copy, userId, validLang]
  )
  const initialChatState = useMemo(
    () =>
      storedChatState || {
        messages: [localOpeningMessage],
        expectedResponse: null,
        expectedResponseMessageId: null,
      },
    [localOpeningMessage, storedChatState]
  )

  const [messages, setMessages] = useState<Message[]>(initialChatState.messages)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [showXpReward, setShowXpReward] = useState(false)

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
  const shouldForceArrivalBriefingRef = useRef((() => {
    if (!storedChatState || storedChatState.messages.length === 0) return false
    const lastMsg = storedChatState.messages[storedChatState.messages.length - 1]
    if (!lastMsg || !lastMsg.timestamp) return true
    const timeDiff = Date.now() - new Date(lastMsg.timestamp).getTime()
    return timeDiff > 4 * 60 * 60 * 1000 // 4 hours
  })())
  const pendingExpectedResponseRef = useRef<GutoExpectedResponse | null>(initialChatState.expectedResponse)
  const pendingExpectedResponseMessageIdRef = useRef<string | null>(initialChatState.expectedResponseMessageId)

  const previousMessagesLengthRef = useRef(messages.length)

  useEffect(() => {
    if (messages.length > previousMessagesLengthRef.current) {
      const newMessages = messages.slice(previousMessagesLengthRef.current)
      if (newMessages.some((m) => m.isGuto)) {
        gutoAudio.playGutoFeedback("message")
      }
    }
    previousMessagesLengthRef.current = messages.length
  }, [messages])

  useEffect(() => {
    if (isSending) {
      gutoAudio.playGutoSound("guto_typing_loop")
    } else {
      gutoAudio.stopGutoSound("guto_typing_loop")
    }
    return () => gutoAudio.stopGutoSound("guto_typing_loop")
  }, [isSending])

  useEffect(() => {
    messagesRef.current = messages
    writeStoredChatState(userId, {
      messages,
      expectedResponse: pendingExpectedResponseRef.current,
      expectedResponseMessageId: pendingExpectedResponseMessageIdRef.current,
    })
  }, [messages, userId])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(`guto-voice-enabled-${userId}`)
      if (stored === "true") {
        setIsMuted(false)
      }
    } catch {}
  }, [userId])


  
  useEffect(() => {
    if (initialXpGranted && !initialXpRewardSeen && !readInitialXpRewardSeen(userId)) {
      writeInitialXpRewardSeen(userId)
      onXpRewardSeen?.()
      const timer = setTimeout(() => {
        gutoAudio.playGutoFeedback("success")
        setShowXpReward(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [initialXpGranted, initialXpRewardSeen, onXpRewardSeen, userId])

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

  const playBase64Mp3 = useCallback(async (audioBase64: string, meta?: Record<string, unknown>) => {
    if (!audioBase64 || audioBase64.length < 100) {
      console.warn("[GUTO_VOICE] empty_audio_payload", meta)
      return
    }

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
      console.info("[GUTO_VOICE] playback_started", meta)
    } catch (error) {
      setIsSpeaking(false)
      console.error("[GUTO_VOICE] playback_failed", { ...meta, error })
    }
  }, [])

  const synthesizeAndPlay = useCallback(async (text: string, lang: SupportedLanguage) => {
    try {
      console.info("[GUTO_VOICE] request", { language: lang, textLength: text.length })
      const token =
        typeof window !== "undefined" ? window.localStorage.getItem("guto-auth-token") : null
      const response = await fetch(`${API_URL}/voz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, language: lang }),
      })

      const data = await response.json()

      if (!response.ok || !data?.audioContent) {
        console.error("[GUTO_VOICE] synthesis_failed", {
          status: response.status,
          language: lang,
          data,
        })
        return
      }

      console.info("[GUTO_VOICE] synthesis_ok", {
        language: lang,
        voiceUsed: data.voiceUsed,
        languageCode: data.languageCode,
      })
      await playBase64Mp3(data.audioContent, {
        language: lang,
        voiceUsed: data.voiceUsed,
        languageCode: data.languageCode,
      })
    } catch (error) {
      console.error("[GUTO_VOICE] request_failed", { language: lang, error })
    }
  }, [playBase64Mp3])

  const checkProactiveMessage = useCallback(async (forceArrivalBriefing = false) => {
    if (proactiveInFlightRef.current || sendInFlightRef.current) return
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
        if (forceArrivalBriefing && prev.length === 0) {
          return [gutoMessage]
        }

        return appendMessagesWithoutDuplicateGuto(prev, [gutoMessage])
      })

      // Propagate workout plan to mission tab
      if (data.acao === "updateWorkout" && data.workoutPlan) {
        onWorkoutPlanUpdated?.(data.workoutPlan)
      }

      if (!isMuted) {
        await synthesizeAndPlay(fala, safeLanguage)
      }
    } catch (error) {
      console.warn(`Proatividade do GUTO indisponível: ${getApiErrorMessage(error)}`)
    } finally {
      proactiveInFlightRef.current = false
    }
  }, [isMuted, language, onWorkoutPlanUpdated, synthesizeAndPlay, userId])

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
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "unknown"
    let microphonePermission = "unknown"
    try {
      const permission = await navigator.permissions?.query({ name: "microphone" as PermissionName })
      microphonePermission = permission?.state || "unknown"
    } catch {
      microphonePermission = "unavailable"
    }

    console.info("[GUTO_MIC] start", {
      userAgent,
      microphonePermission,
      speechRecognitionAvailable: Boolean(SpeechRecognition),
      nativeSpeechRecognition: typeof window !== "undefined" ? Boolean(window.SpeechRecognition) : false,
      webkitSpeechRecognition: typeof window !== "undefined" ? Boolean(window.webkitSpeechRecognition) : false,
      language: getLanguage(language),
    })

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
          console.warn("[GUTO_MIC] recognition_error", {
            error: event.error,
            microphonePermission,
            speechRecognitionAvailable: true,
          })
        }

        recognition.onend = () => {
          setIsRecording(false)
          speechRecognitionRef.current = null
          if (speechResultHandledRef.current) return

          const transcript = speechTranscriptRef.current.trim()
          speechResultHandledRef.current = true
          if (transcript) {
            console.info("[GUTO_MIC] transcript_ready", { length: transcript.length })
            void sendTextToGuto(transcript)
            return
          }

          console.info("[GUTO_MIC] no_transcript", { microphonePermission })
          setMessages((prev) => [
            ...prev,
            {
              id: `g-speech-empty-${Date.now()}`,
              text: copy.micNoSpeech,
              isGuto: true,
              timestamp: new Date(),
              avatarEmotion: "default",
            },
          ])
        }

        speechRecognitionRef.current = recognition
        recognition.start()
        setIsRecording(true)
        console.info("[GUTO_MIC] recognition_started")
        return
      } catch (error) {
        console.warn("[GUTO_MIC] recognition_start_failed", {
          error,
          microphonePermission,
          speechRecognitionAvailable: true,
        })
        speechRecognitionRef.current = null
      }
    }

    console.warn("[GUTO_MIC] speech_recognition_unavailable", {
      userAgent,
      microphonePermission,
      speechRecognitionAvailable: false,
    })
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
        console.warn("[GUTO_MIC] recognition_stop_failed", { error })
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
        history: messagesRef.current.slice(-6).map((message) => ({
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

  // Handle meal doubt from diet tab
  // Keeps the diet context active for follow-up replies so GUTO knows it's a nutrition thread
  const activeDietContextRef = useRef<string | null>(null)
  const handledFoodQuestionRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pendingFoodQuestion || isSending) return
    const { food, meal } = pendingFoodQuestion
    const key = `${food.name}-${meal.id}`
    if (handledFoodQuestionRef.current === key) return
    handledFoodQuestionRef.current = key

    const goalMap: Record<string, string> = {
      fat_loss: "Emagrecimento",
      muscle_gain: "Hipertrofia",
      conditioning: "Condicionamento",
      mobility_health: "Saúde",
      consistency: "Consistência",
    }
    const goalLabel = memory?.trainingGoal ? goalMap[memory.trainingGoal] || memory.trainingGoal : "não informado"
    const sexLabel = memory?.biologicalSex === "female" ? "mulher" : memory?.biologicalSex === "male" ? "homem" : "não informado"
    const countryLabel = memory?.country ? `mora em ${memory.country}` : ""
    const mealFoodsList = meal.foods.map((f) => `${f.name} (${f.quantity})`).join(", ")
    const profileStr = [sexLabel, memory?.userAge ? `${memory.userAge} anos` : "", memory?.heightCm ? `${memory.heightCm}cm` : "", memory?.weightKg ? `${memory.weightKg}kg` : "", countryLabel].filter(Boolean).join(", ")

    const dietCtx = `[CONTEXTO DIETA — responda sobre NUTRIÇÃO, não sobre treino] Alimento: "${food.name}" (${food.quantity}). Refeição: "${meal.name}" (${meal.time}). Refeição completa: ${mealFoodsList}. Objetivo: ${goalLabel}. Perfil: ${profileStr}. Restrições: ${memory?.foodRestrictions || "nenhuma"}.`

    // Store context so follow-up messages carry it
    activeDietContextRef.current = dietCtx

    const displayText = `❓ ${food.name} (${food.quantity})`
    const modelInput = `${dietCtx} O usuário vai fazer uma dúvida sobre este alimento. Aguarde e responda com substituição, porção ou esclarecimento. Direto, máximo 2 frases.`

    void sendTextToGuto(displayText, modelInput).finally(() => {
      onFoodQuestionHandled?.()
    })
  }, [isSending, onFoodQuestionHandled, pendingFoodQuestion, sendTextToGuto, memory])

  const handleSend = async () => {
    if (!input.trim() || isSending) return
    const text = input.trim()
    // If there's an active diet context, include it so GUTO doesn't deflect to training
    const dietCtx = activeDietContextRef.current
    if (dietCtx) {
      // Clear after user sends their question (one follow-up cycle is enough)
      activeDietContextRef.current = null
      await sendTextToGuto(text, `${dietCtx} Pergunta do usuário: ${text}`)
    } else {
      await sendTextToGuto(text)
    }
  }

  const latestGuto = messages[lastGutoIndex] ?? messages[0] ?? { avatarEmotion: "default" as GutoAvatarEmotion }
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
        onClick={() => {
          gutoAudio.playGutoFeedback("tap")
          setIsMuted((prev) => {
            const next = !prev
            try {
              window.localStorage.setItem(`guto-voice-enabled-${userId}`, next ? "false" : "true")
            } catch {}

            if (next && currentAudioRef.current) {
              currentAudioRef.current.pause()
              currentAudioRef.current = null
              setIsSpeaking(false)
            } else if (!next) {
              const testPhrases: Record<SupportedLanguage, string> = {
                "pt-BR": "Voz ativada. Agora eu estou contigo.",
                "en-US": "Voice enabled. I am with you now.",
                "es-ES": "Voz activada. Ahora estoy contigo.",
                "it-IT": "Voce attivata. Ora sono con te."
              }
              const phrase = testPhrases[validLang as SupportedLanguage] || testPhrases["pt-BR"]
              void synthesizeAndPlay(phrase, validLang as SupportedLanguage)
            }
            return next
          })
        }}
        className="guto-chat-sound-toggle absolute z-40"
        data-audio-active={!isMuted}
        aria-label={isMuted ? copy.unmute : copy.mute}
        aria-pressed={!isMuted}
      >
        {isMuted ? <VolumeX className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
      </button>

      {/* Avatar — ancorado na base */}
      <div className="guto-chat-avatar-stage pointer-events-none absolute z-10 flex flex-col items-center justify-end pb-[clamp(16px,4vh,32px)]">
        <div className="relative flex w-[clamp(320px,96vw,440px)] flex-col items-center justify-end">
          <GutoOfficialAvatar
            size="xl"
            showPlatform={false}
            evolution={evolution}
            emotion={isDepleted ? "critical" : latestGuto.avatarEmotion || "default"}
          />
        </div>
      </div>

      {/* Mensagens — z-30 flutua sobre o avatar/cápsula como camada holográfica */}
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
                  ? "mx-auto w-full max-w-[20rem] rounded-[20px] border border-[rgba(82,231,255,0.72)] px-4 py-3 text-center font-mono text-[clamp(11px,2.8vw,13px)] font-black leading-snug text-[var(--guto-navy)]"
                  : "ml-auto max-w-[70%] rounded-[18px] border border-white/80 bg-white/90 px-4 py-2 text-right text-xs font-semibold leading-snug text-[rgba(13,35,65,0.68)] shadow-[0_12px_26px_rgba(137,151,168,0.1)]"
              }
              style={message.isGuto ? {
                background: "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(248,251,255,0.82) 100%)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.96), 0 8px 32px rgba(82,231,255,0.10), 0 2px 12px rgba(13,35,65,0.06)",
              } : undefined}
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
              onPointerDown={() => {
                gutoAudio.playGutoFeedback("tap")
                startRecording()
              }}
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
              onClick={() => {
                gutoAudio.playGutoFeedback("tap")
                void handleSend()
              }}
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

      <AnimatePresence>
        {showXpReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -100 }}
            transition={{ 
              duration: 0.8, 
              ease: [0.22, 1, 0.36, 1],
              scale: { type: "spring", damping: 12, stiffness: 200 }
            }}
            onAnimationComplete={() => {
              setTimeout(() => setShowXpReward(false), 3000)
            }}
            className="pointer-events-none absolute inset-0 z-[100] flex flex-col items-center justify-center"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-40px] rounded-full bg-[radial-gradient(circle,rgba(82,231,255,0.4)_0%,rgba(255,255,255,0)_70%)] blur-xl"
              />
              <div className="relative flex flex-col items-center">
                <div className="mb-2 text-[var(--guto-cyan)] drop-shadow-[0_0_15px_rgba(82,231,255,0.8)]">
                  <TrendingUp className="h-16 w-16 stroke-[3]" />
                </div>
                <div className="guto-chrome-text text-6xl font-black italic tracking-tighter">
                  +100 XP
                </div>
                <div className="mt-2 rounded-full border border-[var(--guto-cyan)]/30 bg-black/70 px-4 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--guto-cyan)]">
                  Prêmio Inicial • Guto Ativo
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
