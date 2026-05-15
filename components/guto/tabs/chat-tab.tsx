"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Mic, Send, TrendingUp, Volume2, VolumeX } from "lucide-react"

import { getApiErrorMessage } from "@/lib/api/client"
import {
  cancelDiscardRequest,
  confirmProactiveMemory,
  discardProactiveMemory,
  extractProactivityEvents,
  getGutoProactive,
  openWeeklyConversation,
  requestDiscardProactiveMemory,
  sendGutoMessage,
  trackGutoEvent,
  validateProactiveMemory,
} from "@/lib/api/guto"
import type { DietMeal, GutoAvatarEmotion, GutoExpectedResponse, GutoMemory, GutoProactiveMemoryAction, GutoWorkoutPlan } from "@/lib/api/guto"
import type { EvolutionStage, SupportedLanguage } from "@/types/contract"
import type { GutoVitalStateResult } from "@/lib/guto-vital-state"
import {
  detectProfileUpdateIntent,
  isConfirmationText,
  isCancellationText,
  profileUpdateCopy,
  type ProfileUpdateIntent,
} from "@/lib/profile-update-detector"

import { GutoAvatarController } from "../guto-avatar-controller"
import { getLanguage, translations } from "../translations"
import type { MissionExercise } from "../view-models"
import { gutoAudio } from "@/lib/audio-haptics"
import { firstRealGutoName } from "@/lib/guto-profile"
import { gutoVoice } from "@/lib/guto-voice/guto-voice-service"

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
  vitalState?: GutoVitalStateResult
  initialXpGranted?: boolean
  initialXpRewardSeen?: boolean
  onXpRewardSeen?: () => void
  memory?: GutoMemory | null
  onProfileUpdate?: (field: string, value: string | number) => Promise<void>
  onMemoryPatch?: (patch: Partial<GutoMemory>) => void
  onChangeLanguage?: (language: SupportedLanguage) => void
  onOpenPrivacySettings?: () => void
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
    audioFailure: string
    emptyResponseFallback: string
    connectionError: string
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
    audioFailure: "O áudio falhou. Sem perder o ritmo: escreve a mesma resposta em uma frase curta.",
    emptyResponseFallback: "Sem distração. Executa a próxima ação agora.",
    connectionError: "Perdi conexão por um momento. Reorganiza e me envia de novo em 1 frase.",
    opening: (name) => `Finalmente${name ? `, ${name}` : ""}. Tava te esperando. Enquanto isso, já organizei nosso plano daqui pra frente. Estamos juntos — bora começar?`,
  },
  "en-US": {
    channel: "Oracle channel",
    speaking: "speaking",
    micUnavailable: "This browser did not expose speech recognition here. Type one short sentence and I will keep this moving.",
    micNoSpeech: "Not enough voice came through. Hold the mic and say one direct sentence.",
    unmute: "Enable GUTO voice",
    mute: "Mute GUTO voice",
    audioFailure: "Audio failed. No need to stop — just type your answer in one short sentence.",
    emptyResponseFallback: "No distractions. Execute the next action now.",
    connectionError: "Lost connection for a moment. Reorganize and send me again in 1 sentence.",
    opening: (name) => `Finally${name ? `, ${name}` : ""}. I was waiting for you. In the meantime, I already organized our plan from here. I'm with you — ready to start?`,
  },
  "it-IT": {
    channel: "Canale dell'oracolo",
    speaking: "parlando",
    micUnavailable: "Questo browser non ha esposto il riconoscimento vocale qui. Scrivi una frase breve e andiamo avanti.",
    micNoSpeech: "Non è arrivata abbastanza voce. Tieni premuto il microfono e di una frase diretta.",
    unmute: "Attiva la voce di GUTO",
    mute: "Silenzia la voce di GUTO",
    audioFailure: "Audio fallito. Senza perdere il ritmo: scrivi la stessa risposta in una frase breve.",
    emptyResponseFallback: "Niente distrazioni. Esegui la prossima azione adesso.",
    connectionError: "Ho perso la connessione per un momento. Riorganizza e mandami di nuovo in 1 frase.",
    opening: (name) => `Finalmente${name ? `, ${name}` : ""}. Ti stavo aspettando. Nel frattempo ho già organizzato il nostro piano da qui in avanti. Sono con te — iniziamo?`,
  },
}

// Set of all language variants of audioFailure — used to detect stale messages
// saved before language switch. Replaces the old STALE_AUDIO_FAILURE_TEXT constant.
const AUDIO_FAILURE_TEXTS = new Set(Object.values(chatCopy).map((c) => c.audioFailure))

const PROACTIVE_CHECK_INTERVAL_MS = 60_000
const FIRST_MESSAGE_SENT_KEY_PREFIX = "guto-first-message-sent"
const CHAT_STATE_KEY_PREFIX = "guto-chat-state"
const INITIAL_XP_REWARD_SEEN_KEY_PREFIX = "guto-initial-xp-reward-seen"
const PROACTIVITY_EXTRACTION_KEY_PREFIX = "guto-proactivity-extracted"
const PROACTIVITY_WEEKLY_OPENED_KEY_PREFIX = "guto-proactivity-weekly-opened"
const PROACTIVITY_ACTION_KEY_PREFIX = "guto-proactivity-action"
const GUTO_OPERATIONAL_TIME_ZONE = process.env.NEXT_PUBLIC_GUTO_TIME_ZONE || "Europe/Rome"
// Minimum number of messages in chat (user + GUTO) before triggering extraction
const PROACTIVITY_MIN_MESSAGES_FOR_EXTRACTION = 6

function getGutoDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: GUTO_OPERATIONAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

/** Returns ISO week key "YYYY-WNN" for the given date */
function getISOWeekKey(date = new Date()): string {
  const [year, month, day] = getGutoDateKey(date).split("-").map(Number) as [number, number, number]
  const tmp = new Date(Date.UTC(year, month - 1, day))
  const dayOfWeek = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayOfWeek)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

/** True if this week's proactivity extraction has already been triggered from this browser */
function hasExtractedThisWeek(userId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    const weekKey = getISOWeekKey()
    return window.localStorage.getItem(`${PROACTIVITY_EXTRACTION_KEY_PREFIX}:${userId}:${weekKey}`) === "1"
  } catch {
    return false
  }
}

function markExtractedThisWeek(userId: string): void {
  if (typeof window === "undefined") return
  try {
    const weekKey = getISOWeekKey()
    window.localStorage.setItem(`${PROACTIVITY_EXTRACTION_KEY_PREFIX}:${userId}:${weekKey}`, "1")
  } catch {}
}

/** True if the weekly Monday opening has already been fired this week */
function hasOpenedWeeklyThisWeek(userId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    const weekKey = getISOWeekKey()
    return window.localStorage.getItem(`${PROACTIVITY_WEEKLY_OPENED_KEY_PREFIX}:${userId}:${weekKey}`) === "1"
  } catch {
    return false
  }
}

function markOpenedWeeklyThisWeek(userId: string): void {
  if (typeof window === "undefined") return
  try {
    const weekKey = getISOWeekKey()
    window.localStorage.setItem(`${PROACTIVITY_WEEKLY_OPENED_KEY_PREFIX}:${userId}:${weekKey}`, "1")
  } catch {}
}

/** True if today is Monday */
function isTodayMonday(): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: GUTO_OPERATIONAL_TIME_ZONE,
    weekday: "long",
  }).format(new Date())
  return weekday.toLowerCase() === "monday"
}

function getProactivityActionKey(userId: string, action: GutoProactiveMemoryAction): string {
  const outcome = action.type === "validate" ? action.outcome : "none"
  return `${PROACTIVITY_ACTION_KEY_PREFIX}:${userId}:${action.type}:${action.memoryId}:${outcome}`
}

function hasProcessedProactivityAction(storageKey: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(storageKey) === "1"
  } catch {
    return false
  }
}

function markProcessedProactivityAction(storageKey: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey, "1")
  } catch {}
}

function clearProcessedProactivityAction(storageKey: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(storageKey)
  } catch {}
}

function formatDisplayName(value: string) {
  return firstRealGutoName(value)
}

function normalizeAvatarEmotion(value?: string): GutoAvatarEmotion {
  return value === "alert" || value === "critical" || value === "reward" ? value : "default"
}

function getBrowserSpeechRecognition() {
  if (typeof window === "undefined") return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

function isStaleAudioFailureMessage(message: Message) {
  return message.isGuto && AUDIO_FAILURE_TEXTS.has(message.text.trim())
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
    if (!messages.some((message) => !message.isGuto)) return null
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
  evolution = "baby",
  pendingExerciseQuestion,
  onExerciseQuestionHandled,
  pendingFoodQuestion,
  onFoodQuestionHandled,
  onWorkoutPlanUpdated,
  vitalState,
  initialXpGranted = false,
  initialXpRewardSeen = false,
  onXpRewardSeen,
  memory,
  onProfileUpdate,
  onMemoryPatch,
  onChangeLanguage,
  onOpenPrivacySettings,
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
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const speechTranscriptRef = useRef("")
  const speechResultHandledRef = useRef(false)
  const handledExerciseQuestionRef = useRef<string | null>(null)
  const proactiveInFlightRef = useRef(false)
  const sendInFlightRef = useRef(false)
  const lastProactiveKeyRef = useRef<string | null>(null)
  const processedProactiveActionKeysRef = useRef<Set<string>>(new Set())
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
  const pendingProfileUpdateRef = useRef<ProfileUpdateIntent | null>(null)

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
      gutoVoice.stop()
    }
  }, [])

  const lastGutoIndex = useMemo(
    () => messages.reduce((acc, msg, index) => (msg.isGuto ? index : acc), -1),
    [messages]
  )

  const synthesizeAndPlay = useCallback(async (text: string, lang: SupportedLanguage) => {
    console.info("[GUTO_VOICE] speak", { language: lang, textLength: text.length, source: "chat" })
    await gutoVoice.speak({
      text,
      language: lang,
      source: "chat",
      preferStatic: false,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    })
  }, [])

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
  }, [isMuted, language, onWorkoutPlanUpdated, synthesizeAndPlay])

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

  const handleProactiveMemoryAction = useCallback(async (action?: GutoProactiveMemoryAction | null) => {
    if (!action?.memoryId) return

    const storageKey = getProactivityActionKey(userId, action)
    const memoryKey = storageKey

    if (processedProactiveActionKeysRef.current.has(memoryKey) || hasProcessedProactivityAction(storageKey)) {
      return
    }
    processedProactiveActionKeysRef.current.add(memoryKey)
    markProcessedProactivityAction(storageKey)

    try {
      let ok = false
      if (action.type === "confirm") {
        ok = await confirmProactiveMemory(action.memoryId)
      } else if (action.type === "discard") {
        ok = await discardProactiveMemory(action.memoryId)
      } else if (action.type === "request_discard") {
        ok = await requestDiscardProactiveMemory(action.memoryId)
      } else if (action.type === "cancel_discard_request") {
        ok = await cancelDiscardRequest(action.memoryId)
      } else {
        ok = await validateProactiveMemory(action.memoryId, action.outcome)
      }

      if (!ok) {
        processedProactiveActionKeysRef.current.delete(memoryKey)
        clearProcessedProactivityAction(storageKey)
        if (process.env.NODE_ENV !== "production") {
          console.warn("[GUTO][proactivity] action failed", action)
        }
      }
    } catch (error) {
      processedProactiveActionKeysRef.current.delete(memoryKey)
      clearProcessedProactivityAction(storageKey)
      if (process.env.NODE_ENV !== "production") {
        console.warn("[GUTO][proactivity] action error", { action, error })
      }
    }
  }, [userId])

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

      const fala = data?.fala?.trim() || copy.emptyResponseFallback
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
      if (data.memoryPatch && Object.keys(data.memoryPatch).length > 0) {
        onMemoryPatch?.(data.memoryPatch)
      }
      if (data.acao === "changeLanguage" && data.memoryPatch?.language) {
        const nextLang = data.memoryPatch.language as SupportedLanguage
        if (["pt-BR", "en-US", "it-IT"].includes(nextLang)) {
          onChangeLanguage?.(nextLang)
        }
      }
      if (data.acao === "requestDeleteAccount") {
        onOpenPrivacySettings?.()
      }
      void handleProactiveMemoryAction(data.proactiveMemoryAction)

      // ── Proactivity: Monday weekly opening signal ──────────────────────────
      // On Monday, when the proactive briefing arrives, mark weekly as opened
      // so the backend knows the weekly conversation happened this week.
      if (isTodayMonday() && !hasOpenedWeeklyThisWeek(userId)) {
        markOpenedWeeklyThisWeek(userId)
        void openWeeklyConversation().catch(() => {})
      }

      // ── Proactivity: background event extraction ───────────────────────────
      // After enough messages on a Monday (or any day), extract proactive events
      // from the conversation. Fires once per week, silently in background.
      const currentMessages = messagesRef.current
      const shouldExtract =
        !hasExtractedThisWeek(userId) &&
        currentMessages.length >= PROACTIVITY_MIN_MESSAGES_FOR_EXTRACTION
      if (shouldExtract) {
        markExtractedThisWeek(userId)
        // Build conversation text from recent messages (last 20)
        const conversationText = currentMessages
          .slice(-20)
          .map((m) => `${m.isGuto ? "GUTO" : "USER"}: ${m.text}`)
          .join("\n")
        void extractProactivityEvents(conversationText, safeLanguage).catch(() => {})
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
          text: copy.connectionError,
          isGuto: true,
          timestamp: new Date(),
          avatarEmotion: "default",
        },
      ])
    } finally {
      sendInFlightRef.current = false
      setIsSending(false)
    }
  }, [
    handleProactiveMemoryAction,
    isMuted,
    language,
    onChangeLanguage,
    onMemoryPatch,
    onOpenPrivacySettings,
    onWorkoutPlanUpdated,
    synthesizeAndPlay,
    userId,
    userName,
  ])

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

  const addGutoMessage = (text: string, emotion: GutoAvatarEmotion = "default") => {
    const msg: Message = { id: `g-pu-${Date.now()}`, text, isGuto: true, timestamp: new Date(), avatarEmotion: emotion }
    setMessages((prev) => appendMessagesWithoutDuplicateGuto(prev, [msg]))
    return msg
  }

  const handleSend = async () => {
    if (!input.trim() || isSending) return
    const text = input.trim()
    const copy = profileUpdateCopy[validLang]

    // ── Phase 4: profile update confirmation flow ────────────────────────────
    const pending = pendingProfileUpdateRef.current
    if (pending) {
      const lower = text.toLowerCase()

      if (isConfirmationText(lower)) {
        // Show user's confirmation in chat
        setMessages((prev) => [
          ...prev,
          { id: `u-confirm-${Date.now()}`, text, isGuto: false, timestamp: new Date() },
        ])
        setInput("")
        pendingProfileUpdateRef.current = null

        // Apply the profile change
        try {
          await onProfileUpdate?.(pending.field, pending.value)
        } catch {
          // persistência falhou silenciosamente; o toast de erro será exibido pelo parent
        }
        const successText = copy.success(pending.humanLabel, pending.humanValue)
        addGutoMessage(successText, "reward")
        if (!isMuted) void synthesizeAndPlay(successText, validLang)
        return
      }

      if (isCancellationText(lower)) {
        setMessages((prev) => [
          ...prev,
          { id: `u-cancel-${Date.now()}`, text, isGuto: false, timestamp: new Date() },
        ])
        setInput("")
        pendingProfileUpdateRef.current = null
        addGutoMessage(copy.cancelled)
        if (!isMuted) void synthesizeAndPlay(copy.cancelled, validLang)
        return
      }

      // Neither confirm nor cancel → clear pending and fall through to normal chat
      pendingProfileUpdateRef.current = null
    }

    // ── Phase 4: detect new profile update intent ────────────────────────────
    if (onProfileUpdate) {
      const intent = detectProfileUpdateIntent(text, validLang)
      if (intent) {
        setMessages((prev) => [
          ...prev,
          { id: `u-intent-${Date.now()}`, text, isGuto: false, timestamp: new Date() },
        ])
        setInput("")

        if (intent.blocked) {
          addGutoMessage(copy.blocked, "alert")
          if (!isMuted) void synthesizeAndPlay(copy.blocked, validLang)
          return
        }

        const confirmText =
          intent.confirmationLevel === "required"
            ? copy.requiredConfirm(intent.humanLabel, intent.humanValue)
            : copy.lightConfirm(intent.humanLabel, intent.humanValue)

        pendingProfileUpdateRef.current = intent
        addGutoMessage(confirmText)
        if (!isMuted) void synthesizeAndPlay(confirmText, validLang)
        return
      }
    }

    // ── Normal chat flow ─────────────────────────────────────────────────────
    const dietCtx = activeDietContextRef.current
    if (dietCtx) {
      activeDietContextRef.current = null
      await sendTextToGuto(text, `${dietCtx} Pergunta do usuário: ${text}`)
    } else {
      await sendTextToGuto(text)
    }
  }

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

            if (next) {
              gutoVoice.stop()
              setIsSpeaking(false)
            } else if (!next) {
              const testPhrases: Record<SupportedLanguage, string> = {
                "pt-BR": "Voz ativada. Agora eu estou contigo.",
                "en-US": "Voice enabled. I am with you now.",
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

      {/* Avatar — ancorado na base. Opacidade reduz conforme dias de ausência (Tamagotchi). */}
      <div className="guto-chat-avatar-stage absolute z-10 flex flex-col items-center justify-end pb-[clamp(16px,4vh,32px)]">
        <div
          className="relative flex w-[clamp(320px,96vw,440px)] flex-col items-center justify-end transition-opacity duration-1000"
          style={{ opacity: vitalState?.opacity ?? 1 }}
        >
          <GutoAvatarController
            stage={evolution}
            size="xl"
            showPlatform={false}
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
