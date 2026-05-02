"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Check, Fingerprint, Languages, Send, Settings, UserRound, Volume2 } from "lucide-react"

import { BottomNavigation, type TabType } from "./bottom-navigation"
import { createGutoEffectRegistry } from "./effects"
import { ChatTab } from "./tabs/chat-tab"
import { EvolutionsTab } from "./tabs/evolutions-tab"
import { MissionTab } from "./tabs/mission-tab"
import { PathTab } from "./tabs/path-tab"
import { CalibrationScreen } from "./screens/calibration-screen"
import type { MissionExercise } from "./view-models"
import { WorkoutValidationFlow } from "./validation/workout-validation-flow"
import { getApiErrorMessage } from "@/lib/api/client"
import { getGutoMemory, saveGutoMemory, trackGutoEvent, validateGutoName, type GutoMemory, type GutoNameValidation, type GutoTelemetryEvent, type GutoWorkoutPlan } from "@/lib/api/guto"
import { clearGutoBrowserIdentity, getOrCreateGutoVisitTelemetry } from "@/lib/guto/user-id"
import type { EvolutionStage, SupportedLanguage } from "@/types/contract"

type AppStage = "intro" | "language" | "naming" | "calibration" | "pact" | "system" | "settings"
type SettingsMode = "menu" | "language" | "name"

interface StoredProfile {
  language: SupportedLanguage
  userName: string
  onboardingComplete: boolean
}

interface PendingExerciseQuestion {
  id: string
  exercise: MissionExercise
}

interface NameGate {
  status: "invalid" | "confirm"
  normalized: string
  message: string
  target: "onboarding" | "settings"
}

const STORAGE_KEY = "guto-white-lab-profile"
const DEBUG_RESET_KEY = "guto-debug-reset"
const HOLD_INTERVAL_MS = 16
const HOLD_INCREMENT = (HOLD_INTERVAL_MS / 1600) * 100

const languages = [
  { id: "pt-BR" as const, label: "Português", asset: "/assets/guto/idioma-portugues.svg" },
  { id: "en-US" as const, label: "English", asset: "/assets/guto/idioma-english.svg" },
  { id: "it-IT" as const, label: "Italiano", asset: "/assets/guto/idioma-italiano.svg" },
  { id: "es-ES" as const, label: "Español", asset: "/assets/guto/idioma-espanol.svg" },
]

const pactVeins = [0.16, 0.31, 0.5, 0.7, 0.84]
const pactNodes = [
  { left: 0.2, top: 0.28 },
  { left: 0.78, top: 0.32 },
  { left: 0.14, top: 0.62 },
  { left: 0.84, top: 0.66 },
]

const stageCopy: Record<
  SupportedLanguage,
  {
    namingTitle: string
    namingPlaceholder: string
    complete: string
    noReturn: string
    hold: string
    status: string
    connection: string
    settingsTitle: string
    settingsLanguage: string
    settingsName: string
    settingsNamePlaceholder: string
    settingsSaveName: string
    settingsClose: string
    settingsBack: string
  }
> = {
  "pt-BR": {
    namingTitle: "GUTO & ________",
    namingPlaceholder: "SEU NOME",
    complete: "Complete.",
    noReturn: "Tem certeza? Depois que apertar, o jogo fica sério.",
    hold: "Pressione e segure",
    status: "Status: Ativo",
    connection: "Conexão: Estável",
    settingsTitle: "Ajustes",
    settingsLanguage: "Idioma",
    settingsName: "Nome",
    settingsNamePlaceholder: "SEU NOME",
    settingsSaveName: "Salvar nome",
    settingsClose: "Fechar ajustes",
    settingsBack: "Voltar",
  },
  "en-US": {
    namingTitle: "GUTO & ________",
    namingPlaceholder: "YOUR NAME",
    complete: "Complete.",
    noReturn: "Are you sure? Once you tap, it gets serious.",
    hold: "Press and hold",
    status: "Status: Active",
    connection: "Connection: Stable",
    settingsTitle: "Settings",
    settingsLanguage: "Language",
    settingsName: "Name",
    settingsNamePlaceholder: "YOUR NAME",
    settingsSaveName: "Save name",
    settingsClose: "Close settings",
    settingsBack: "Back",
  },
  "es-ES": {
    namingTitle: "GUTO & ________",
    namingPlaceholder: "TU NOMBRE",
    complete: "Completa.",
    noReturn: "¿Estás seguro? Cuando toques, esto se pone serio.",
    hold: "Mantén pulsado",
    status: "Estado: Activo",
    connection: "Conexión: Estable",
    settingsTitle: "Ajustes",
    settingsLanguage: "Idioma",
    settingsName: "Nombre",
    settingsNamePlaceholder: "TU NOMBRE",
    settingsSaveName: "Guardar nombre",
    settingsClose: "Cerrar ajustes",
    settingsBack: "Volver",
  },
  "it-IT": {
    namingTitle: "GUTO & ________",
    namingPlaceholder: "IL TUO NOME",
    complete: "Completa.",
    noReturn: "Sei sicuro? Dopo che tocchi, si fa sul serio.",
    hold: "Tieni premuto",
    status: "Stato: Attivo",
    connection: "Connessione: Stabile",
    settingsTitle: "Impostazioni",
    settingsLanguage: "Lingua",
    settingsName: "Nome",
    settingsNamePlaceholder: "IL TUO NOME",
    settingsSaveName: "Salva nome",
    settingsClose: "Chiudi impostazioni",
    settingsBack: "Indietro",
  },
}

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return ["pt-BR", "en-US", "es-ES", "it-IT"].includes(value)
}

function formatGutoName(value: string) {
  return value.replace(/\s+/g, " ").trimStart().toLocaleUpperCase()
}

function normalizeGutoName(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function validateGutoNameLocally(value: string): GutoNameValidation {
  const normalized = normalizeGutoName(value)
  const lower = normalized.toLocaleLowerCase("pt-BR")
  const suspiciousNames = new Set(["banana", "teste", "asdf", "qwerty", "nome", "usuario", "usuário", "nada", "ovo"])

  if (normalized.length < 2) {
    return { status: "invalid", normalized, message: "Nome curto demais. Me dá um nome real." }
  }

  if (normalized.length > 20) {
    return { status: "invalid", normalized, message: "Nome longo demais. Usa até 20 caracteres." }
  }

  if (!/^[\p{L} ]+$/u.test(normalized)) {
    return { status: "invalid", normalized, message: "Nome não precisa de número nem símbolo. Só letras." }
  }

  if (suspiciousNames.has(lower)) {
    return {
      status: "confirm",
      normalized,
      message: `Esse é o nome que você quer que eu use com você: ${normalized}?`,
    }
  }

  return { status: "valid", normalized, message: "Nome aceito." }
}

function resolveEvolutionStage(totalXp = 0): EvolutionStage {
  if (totalXp >= 5000) return "ELIT"
  if (totalXp >= 3000) return "ADULT"
  if (totalXp >= 1500) return "TEEN"
  return "BABY"
}

async function resolveGutoNameValidation(value: string) {
  try {
    return await validateGutoName(value)
  } catch {
    return validateGutoNameLocally(value)
  }
}

function readStorageItem(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorageItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Safari/private browsing can block storage; the app must still run.
  }
}

function removeStorageItem(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Storage is optional for first-run access.
  }
}


export function GutoApp({
  userName,
  language,
  skipIntro = false,
}: {
  userName: string
  language: string
  skipIntro?: boolean
}) {
  const [isHydrated, setIsHydrated] = useState(true)
  const [stage, setStage] = useState<AppStage>(skipIntro ? "language" : "intro")
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("pt-BR")
  const [draftName, setDraftName] = useState("")
  const [committedName, setCommittedName] = useState("")
  const [activeTab, setActiveTab] = useState<TabType>("guto")
  const [evolution, setEvolution] = useState<EvolutionStage>("BABY")
  const [activeLanguageGlow, setActiveLanguageGlow] = useState<SupportedLanguage | null>(null)
  const [rotatingLanguage, setRotatingLanguage] = useState(false)
  const [isHoldingPact, setIsHoldingPact] = useState(false)
  const [pactProgress, setPactProgress] = useState(0)
  const [whiteout, setWhiteout] = useState(false)
  const [introNeedsActivation, setIntroNeedsActivation] = useState(true)
  const [settingsMode, setSettingsMode] = useState<SettingsMode>("menu")
  const [settingsNameDraft, setSettingsNameDraft] = useState("")
  const [pendingExerciseQuestion, setPendingExerciseQuestion] =
    useState<PendingExerciseQuestion | null>(null)
  const [workoutPlan, setWorkoutPlan] = useState<GutoWorkoutPlan | null>(null)
  const [memory, setMemory] = useState<GutoMemory | null>(null)
  const [gutoUserId, setGutoUserId] = useState("local-user")
  const [nameGate, setNameGate] = useState<NameGate | null>(null)
  const [isValidatingName, setIsValidatingName] = useState(false)
  const [showValidationFlow, setShowValidationFlow] = useState(false)

  const timersRef = useRef<number[]>([])
  const pactIntervalRef = useRef<number | null>(null)
  const pactCompleteRef = useRef(false)
  const portalVideoRef = useRef<HTMLVideoElement | null>(null)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const effectRegistry = useMemo(() => createGutoEffectRegistry(), [])

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((id) => id !== timer)
      callback()
    }, delay)
    timersRef.current.push(timer)
  }, [])

  const clearScheduled = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }, [])

  const clearPactInterval = useCallback(() => {
    if (pactIntervalRef.current) {
      window.clearInterval(pactIntervalRef.current)
      pactIntervalRef.current = null
    }
  }, [])

  const persistProfile = useCallback(
    (next: Partial<StoredProfile>) => {
      if (typeof window === "undefined") return

      const existingRaw = readStorageItem(STORAGE_KEY)
      let existing: StoredProfile = {
        language: selectedLanguage,
        userName: committedName,
        onboardingComplete: false,
      }

      if (existingRaw) {
        try {
          existing = JSON.parse(existingRaw) as StoredProfile
        } catch {
          removeStorageItem(STORAGE_KEY)
        }
      }

      const payload: StoredProfile = {
        ...existing,
        language: selectedLanguage,
        userName: committedName,
        ...next,
      }

      writeStorageItem(STORAGE_KEY, JSON.stringify(payload))
    },
    [committedName, selectedLanguage]
  )

  const persistMemory = useCallback(
    (payload: Parameters<typeof saveGutoMemory>[0]) => {
      void saveGutoMemory({
        userId: gutoUserId,
        language: selectedLanguage,
        ...payload,
      }).catch((error) => {
        console.warn(`Memória do GUTO não sincronizada: ${getApiErrorMessage(error)}`)
      })
    },
    [gutoUserId, selectedLanguage]
  )

  const trackBehaviorEvent = useCallback(
    (event: GutoTelemetryEvent, metadata?: Record<string, unknown>) => {
      void trackGutoEvent({
        event,
        userId: gutoUserId,
        language: selectedLanguage,
        metadata,
      }).catch((error) => {
        console.warn(`Evento do GUTO não registrado: ${getApiErrorMessage(error)}`)
      })
    },
    [gutoUserId, selectedLanguage]
  )

  useEffect(() => {
    const shell = shellRef.current
    if (!shell || typeof window === "undefined") return

    let frame = 0

    const syncViewport = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const visualViewport = window.visualViewport
        const viewportHeight = Math.max(320, Math.round(visualViewport?.height ?? window.innerHeight))
        const viewportWidth = Math.round(visualViewport?.width ?? window.innerWidth)
        const offsetTop = Math.max(0, Math.round(visualViewport?.offsetTop ?? 0))
        const keyboardOffset = Math.max(0, Math.round(window.innerHeight - viewportHeight - offsetTop))
        const activeElement = document.activeElement
        const isTextInput =
          activeElement instanceof HTMLElement &&
          activeElement.matches("input, textarea, [contenteditable='true']")
        const keyboardOpen = isTextInput && (keyboardOffset > 60 || window.innerHeight - viewportHeight > 60)

        shell.style.setProperty("--guto-viewport-height", keyboardOpen ? `${viewportHeight}px` : "100dvh")
        shell.style.setProperty("--guto-viewport-width", `${viewportWidth}px`)
        shell.style.setProperty("--guto-keyboard-offset", `${keyboardOffset}px`)
        shell.toggleAttribute("data-keyboard-open", keyboardOpen)
      })
    }

    syncViewport()
    window.addEventListener("resize", syncViewport)
    window.addEventListener("orientationchange", syncViewport)
    window.addEventListener("focusin", syncViewport)
    window.addEventListener("focusout", syncViewport)
    window.visualViewport?.addEventListener("resize", syncViewport)
    window.visualViewport?.addEventListener("scroll", syncViewport)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", syncViewport)
      window.removeEventListener("orientationchange", syncViewport)
      window.removeEventListener("focusin", syncViewport)
      window.removeEventListener("focusout", syncViewport)
      window.visualViewport?.removeEventListener("resize", syncViewport)
      window.visualViewport?.removeEventListener("scroll", syncViewport)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const search = new URLSearchParams(window.location.search)
      const shouldReset =
        search.get("guto-reset") === "1" || readStorageItem(DEBUG_RESET_KEY) === "1"
      const shouldSkipIntro = skipIntro || search.get("skip-intro") === "1"

      if (shouldReset) {
        removeStorageItem(STORAGE_KEY)
        removeStorageItem(DEBUG_RESET_KEY)
        clearGutoBrowserIdentity()
      }

      const safeLanguage = isSupportedLanguage(language) ? language : "pt-BR"
      const visit = getOrCreateGutoVisitTelemetry()
      setGutoUserId(visit.userId)
      if (visit.isNewUser) {
        void trackGutoEvent({
          event: "user_created",
          userId: visit.userId,
          language: safeLanguage,
        }).catch((error) => {
          console.warn(`Evento do GUTO não registrado: ${getApiErrorMessage(error)}`)
        })
      }
      if (visit.returnedNextDay) {
        void trackGutoEvent({
          event: "user_returned_next_day",
          userId: visit.userId,
          language: safeLanguage,
        }).catch((error) => {
          console.warn(`Evento do GUTO não registrado: ${getApiErrorMessage(error)}`)
        })
      }
      const storedRaw = readStorageItem(STORAGE_KEY)

      if (storedRaw) {
        const stored = JSON.parse(storedRaw) as StoredProfile
        const persistedLanguage = isSupportedLanguage(stored.language) ? stored.language : safeLanguage
        const persistedName = formatGutoName(stored.userName || userName || "")

        setSelectedLanguage(persistedLanguage)
        setDraftName(persistedName)
        setCommittedName(persistedName)
        setStage(stored.onboardingComplete ? "system" : shouldSkipIntro ? "language" : "intro")
      } else {
        setSelectedLanguage(safeLanguage)
        setDraftName(formatGutoName(userName || ""))
        setCommittedName(formatGutoName(userName || ""))
        setStage(shouldSkipIntro ? "language" : "intro")
      }
    } catch {
      const safeLanguage = isSupportedLanguage(language) ? language : "pt-BR"
      setSelectedLanguage(safeLanguage)
      setDraftName(formatGutoName(userName || ""))
      setCommittedName(formatGutoName(userName || ""))
      setStage(skipIntro ? "language" : "intro")
    } finally {
      setIsHydrated(true)
    }

    return () => {
      clearScheduled()
      clearPactInterval()
    }
  }, [clearPactInterval, clearScheduled, language, skipIntro, userName])

  const startSystem = useCallback(
    (finalName: string, finalLanguage: SupportedLanguage) => {
      if (pactCompleteRef.current) return
      pactCompleteRef.current = true

      effectRegistry.emit("whiteout")
      persistProfile({
        language: finalLanguage,
        userName: finalName,
        onboardingComplete: true,
      })
      persistMemory({
        name: finalName,
        language: finalLanguage,
        trainedToday: false,
      })
      trackBehaviorEvent("pact_completed", { finalLanguage })
      setPactProgress(100)
      setIsHoldingPact(false)
      setWhiteout(true)
      schedule(() => {
        setStage("system")
      }, 140)
      schedule(() => {
        setWhiteout(false)
        setPactProgress(0)
      }, 860)
    },
    [effectRegistry, persistMemory, persistProfile, schedule, trackBehaviorEvent]
  )

  const handleIntroComplete = useCallback(() => {
    effectRegistry.emit("portal_open")
    setStage("language")
  }, [effectRegistry])

  const restartPortalVideo = useCallback(() => {
    const video = portalVideoRef.current
    if (!video) return

    video.pause()
    video.controls = false
    video.defaultMuted = true
    video.muted = true
    video.volume = 1
    video.currentTime = 0
  }, [])

  const activateIntroSound = useCallback(() => {
    const video = portalVideoRef.current
    if (!video) {
      setIntroNeedsActivation(false)
      return
    }

    video.defaultMuted = false
    video.muted = false
    video.volume = 1
    video.controls = false
    video.playsInline = true
    video.setAttribute("playsinline", "")
    video.setAttribute("webkit-playsinline", "")
    try {
      video.currentTime = 0
    } catch {
      // iOS can reject seeking before metadata is fully ready.
    }
    video
      .play()
      .then(() => {
        setIntroNeedsActivation(false)
      })
      .catch(() => {
        video.defaultMuted = true
        video.muted = true
        video
          .play()
          .then(() => {
            setIntroNeedsActivation(false)
          })
          .catch(() => {
            setIntroNeedsActivation(false)
            handleIntroComplete()
          })
      })
  }, [handleIntroComplete])

  const handleLanguageSelect = useCallback(
    (lang: SupportedLanguage) => {
      if (rotatingLanguage) return

      effectRegistry.emit("language_select", { meta: { language: lang } })
      setSelectedLanguage(lang)
      setActiveLanguageGlow(lang)
      setNameGate(null)
      setRotatingLanguage(true)
      persistProfile({ language: lang, onboardingComplete: false })
      persistMemory({ language: lang })
      schedule(() => {
        setStage("naming")
        setRotatingLanguage(false)
        setActiveLanguageGlow(null)
      }, 560)
    },
    [effectRegistry, persistMemory, persistProfile, rotatingLanguage, schedule]
  )

  const commitOnboardingName = useCallback(
    (name: string, confirmedName = false) => {
      const normalizedName = formatGutoName(name)
      if (!normalizedName) return

      setNameGate(null)
      setCommittedName(normalizedName)
      pactCompleteRef.current = false
      setPactProgress(0)
      setIsHoldingPact(false)
      setWhiteout(false)
      setStage("calibration")
      effectRegistry.emit("seal_complete", {
        meta: { nameLength: normalizedName.length, language: selectedLanguage },
      })
      persistProfile({ userName: normalizedName, language: selectedLanguage, onboardingComplete: false })
      persistMemory({ name: normalizedName, confirmedName })
    },
    [effectRegistry, persistMemory, persistProfile, selectedLanguage]
  )

  const handleCalibrationComplete = useCallback(
    (calibration: Parameters<typeof saveGutoMemory>[0]) => {
      setStage("pact")
      persistMemory(calibration)
      trackBehaviorEvent("calibration_completed", { ...calibration })
    },
    [persistMemory, trackBehaviorEvent]
  )

  const handleSeal = useCallback(
    async (confirmedName = false) => {
      const normalizedName = normalizeGutoName(draftName)
      if (!normalizedName || isValidatingName) return

      setIsValidatingName(true)
      const validation = await resolveGutoNameValidation(normalizedName)
      setIsValidatingName(false)

      if (validation.status === "invalid") {
        setNameGate({
          status: "invalid",
          normalized: validation.normalized,
          message: validation.message,
          target: "onboarding",
        })
        return
      }

      if (validation.status === "confirm" && !confirmedName) {
        setNameGate({
          status: "confirm",
          normalized: validation.normalized,
          message: validation.message,
          target: "onboarding",
        })
        return
      }

      commitOnboardingName(validation.normalized, confirmedName)
    },
    [commitOnboardingName, draftName, isValidatingName]
  )

  const openSettings = useCallback(() => {
    setSettingsNameDraft(committedName || formatGutoName(userName || ""))
    setSettingsMode("menu")
    setNameGate(null)
    setStage("settings")
  }, [committedName, userName])

  const handleSettingsBack = useCallback(() => {
    setActiveLanguageGlow(null)

    if (settingsMode !== "menu") {
      setSettingsMode("menu")
      return
    }

    setStage("system")
  }, [settingsMode])

  const handleSettingsLanguageSelect = useCallback(
    (lang: SupportedLanguage) => {
      effectRegistry.emit("language_select", { meta: { language: lang, source: "settings" } })
      setSelectedLanguage(lang)
      setActiveLanguageGlow(null)
      setSettingsMode("menu")
      setStage("system")
      persistProfile({ language: lang, onboardingComplete: true })
      persistMemory({ language: lang })
    },
    [effectRegistry, persistMemory, persistProfile]
  )

  const saveSettingsName = useCallback(
    async (confirmedName = false) => {
      const normalizedName = normalizeGutoName(settingsNameDraft)
      if (!normalizedName || isValidatingName) return

      setIsValidatingName(true)
      const validation = await resolveGutoNameValidation(normalizedName)
      setIsValidatingName(false)

      if (validation.status === "invalid") {
        setNameGate({
          status: "invalid",
          normalized: validation.normalized,
          message: validation.message,
          target: "settings",
        })
        return
      }

      if (validation.status === "confirm" && !confirmedName) {
        setNameGate({
          status: "confirm",
          normalized: validation.normalized,
          message: validation.message,
          target: "settings",
        })
        return
      }

      const finalName = formatGutoName(validation.normalized)
      setNameGate(null)
      setDraftName(finalName)
      setCommittedName(finalName)
      persistProfile({ userName: finalName, onboardingComplete: true })
      persistMemory({ name: finalName, confirmedName })
      setSettingsNameDraft(finalName)
      setSettingsMode("menu")
      setStage("system")
    },
    [isValidatingName, persistMemory, persistProfile, settingsNameDraft]
  )

  useEffect(() => {
    if (stage !== "pact" || !isHoldingPact) {
      clearPactInterval()
      return
    }

    pactIntervalRef.current = window.setInterval(() => {
      setPactProgress((current) => {
        const next = Math.min(current + HOLD_INCREMENT, 100)
        effectRegistry.emit("pact_hold_tick", { value: next })

        if (next >= 100) {
          clearPactInterval()
          startSystem(
            committedName || formatGutoName(draftName || userName || ""),
            selectedLanguage
          )
        }

        return next
      })
    }, HOLD_INTERVAL_MS)

    return clearPactInterval
  }, [
    clearPactInterval,
    committedName,
    draftName,
    effectRegistry,
    isHoldingPact,
    selectedLanguage,
    stage,
    startSystem,
    userName,
  ])

  useEffect(() => {
    let cancelled = false

    void getGutoMemory(gutoUserId)
      .then((memory) => {
        if (cancelled) return
        setMemory(memory)
        setEvolution(resolveEvolutionStage(memory?.totalXp || 0))
        if (memory?.lastWorkoutPlan?.exercises?.length) {
          setWorkoutPlan(memory.lastWorkoutPlan)
        } else {
          setWorkoutPlan((prev) => prev ? prev : null)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [gutoUserId])

  const stopHold = useCallback(() => {
    if (stage !== "pact" || pactProgress >= 100 || pactCompleteRef.current) return
    clearPactInterval()
    setIsHoldingPact(false)
    setPactProgress(0)
  }, [clearPactInterval, pactProgress, stage])

  const handleExerciseQuestion = useCallback((exercise: MissionExercise) => {
    setPendingExerciseQuestion({
      id: `${exercise.id}-${Date.now()}`,
      exercise,
    })
    setActiveTab("guto")
  }, [])

  const handleMissionComplete = useCallback(async () => {
    const updated = await saveGutoMemory({
      userId: gutoUserId,
      language: selectedLanguage,
      xpEvent: "complete_daily_mission",
    })
    setMemory(updated)
    setEvolution(resolveEvolutionStage(updated.totalXp || 0))
    trackBehaviorEvent("mission_completed", { missionType: "daily" })
    setActiveTab("caminho")
  }, [gutoUserId, selectedLanguage, trackBehaviorEvent])

  const handleAdaptedMissionComplete = useCallback(async () => {
    const updated = await saveGutoMemory({
      userId: gutoUserId,
      language: selectedLanguage,
      xpEvent: "accept_adapted_mission",
    })
    setMemory(updated)
    setEvolution(resolveEvolutionStage(updated.totalXp || 0))
    trackBehaviorEvent("mission_completed", { missionType: "adapted" })
    setActiveTab("caminho")
  }, [gutoUserId, selectedLanguage, trackBehaviorEvent])

  const userLabel = committedName || formatGutoName(userName || "")
  const locale = stageCopy[selectedLanguage]
  const isGutoDepleted = (memory?.totalXp ?? 100) === 0
  const canSaveSettingsName =
    Boolean(formatGutoName(settingsNameDraft)) &&
    formatGutoName(settingsNameDraft) !== userLabel &&
    !isValidatingName

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "guto":
        return (
          <ChatTab
            key={`chat-${gutoUserId}`}
            userId={gutoUserId}
            userName={userLabel}
            language={selectedLanguage}
            evolution={evolution}
            pendingExerciseQuestion={pendingExerciseQuestion}
            onExerciseQuestionHandled={() => setPendingExerciseQuestion(null)}
            onWorkoutPlanUpdated={setWorkoutPlan}
            isDepleted={isGutoDepleted}
            initialXpGranted={memory?.initialXpGranted}
            initialXpRewardSeen={memory?.initialXpRewardSeen}
            onXpRewardSeen={() => {
              if (memory) {
                const updated = { ...memory, initialXpRewardSeen: true };
                setMemory(updated);
                persistMemory({ initialXpRewardSeen: true });
              }
            }}
          />
        )
      case "caminho":
        return (
          <PathTab
            userName={userLabel}
            language={selectedLanguage}
            memory={memory}
            workoutPlan={workoutPlan}
            currentEvolution={evolution}
            validationHistory={memory?.validationHistory}
          />
        )
      case "evolucoes":
        return (
          <EvolutionsTab
            userName={userLabel}
            language={selectedLanguage}
            currentEvolution={evolution}
            memory={memory}
          />
        )
      case "missao":
        return (
          <MissionTab
            language={selectedLanguage}
            userName={userLabel}
            userId={gutoUserId}
            workoutFocus={workoutPlan?.focusKey || "full_body"}
            onAskExercise={handleExerciseQuestion}
            workoutPlan={workoutPlan}
            trainedToday={Boolean(memory?.trainedToday)}
            adaptedMissionToday={Boolean(memory?.adaptedMissionToday)}
            onMissionComplete={handleMissionComplete}
            onAdaptedMissionComplete={handleAdaptedMissionComplete}
            onValidateWorkout={() => setShowValidationFlow(true)}
          />
        )
      default:
        return (
          <ChatTab
            key={`chat-${gutoUserId}`}
            userId={gutoUserId}
            userName={userLabel}
            language={selectedLanguage}
            evolution={evolution}
            pendingExerciseQuestion={pendingExerciseQuestion}
            onExerciseQuestionHandled={() => setPendingExerciseQuestion(null)}
            onWorkoutPlanUpdated={setWorkoutPlan}
            isDepleted={isGutoDepleted}
          />
        )
    }
  }, [activeTab, evolution, gutoUserId, handleAdaptedMissionComplete, handleExerciseQuestion, handleMissionComplete, isGutoDepleted, memory, pendingExerciseQuestion, selectedLanguage, userLabel, workoutPlan])

  if (!isHydrated) {
    return (
      <div className="sala-guto flex min-h-dvh items-center justify-center">
        <div className="guto-chrome-text text-5xl font-black tracking-[0.28em]">GUTO</div>
      </div>
    )
  }

  return (
    <div ref={shellRef} className="sala-guto">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[var(--guto-varnish)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[18%] h-px bg-[linear-gradient(90deg,transparent,rgba(82,231,255,0.28),transparent)]" />

      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <motion.section
            key="intro"
            className="absolute inset-0 z-40 overflow-hidden bg-white"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.36 }}
          >
            <video
              ref={portalVideoRef}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              preload="auto"
              disablePictureInPicture
              controls={false}
              onLoadedMetadata={restartPortalVideo}
              onEnded={handleIntroComplete}
            >
              <source src="/assets/guto/abertura-guto.mp4#t=0.001" type="video/mp4" />
            </video>

            {introNeedsActivation && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-white/8 backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={activateIntroSound}
                    className="guto-intro-sound-button inline-flex items-center gap-3 rounded-full px-5 py-3 text-[11px] font-black uppercase tracking-normal"
                    aria-label="Ativar som original do GUTO"
                  >
                    <Volume2 className="h-5 w-5" />
                    INICIAR GUTO
                  </button>
                  <Link
                    href="/?skip-intro=1&guto-reset=1"
                    className="guto-intro-skip rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-normal"
                  >
                    Entrar
                  </Link>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {stage === "language" && (
          <motion.section
            key="language"
            className="guto-main-screen absolute inset-0 z-30 flex items-center justify-center px-8"
            initial={skipIntro ? false : { rotateY: 0, opacity: 0 }}
            animate={{
              rotateY: rotatingLanguage ? 180 : 0,
              opacity: rotatingLanguage ? 0 : 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.56, ease: [0.66, 0, 0.18, 1] }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="guto-language-grid grid grid-cols-2">
              {languages.map((lang) => (
                <motion.button
                  key={lang.id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onHoverStart={() => setActiveLanguageGlow(lang.id)}
                  onHoverEnd={() => setActiveLanguageGlow((current) => (current === lang.id ? null : current))}
                  onPointerDown={() => setActiveLanguageGlow(lang.id)}
                  onPointerUp={() => {
                    if (!rotatingLanguage) {
                      setActiveLanguageGlow(null)
                    }
                  }}
                  onPointerCancel={() => setActiveLanguageGlow(null)}
                  onPointerLeave={() => {
                    if (!rotatingLanguage) {
                      setActiveLanguageGlow(null)
                    }
                  }}
                  onClick={() => handleLanguageSelect(lang.id)}
                  aria-label={lang.label}
                  className="guto-language-card group relative flex items-center overflow-hidden rounded-[18px]"
                  data-active={activeLanguageGlow === lang.id || (rotatingLanguage && selectedLanguage === lang.id)}
                >
                  <Image
                    src={lang.asset}
                    alt=""
                    aria-hidden="true"
                    width={70}
                    height={70}
                    className="guto-language-vector"
                  />
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {stage === "naming" && (
          <motion.section
            key="naming"
            className="guto-main-screen absolute inset-0 z-30 flex flex-col items-center px-8"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.42 }}
          >
            <div className="guto-name-stage flex w-full flex-1 flex-col items-center">
              <motion.div
                className="guto-name-lockup"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image
                  src="/assets/guto/logo_guto.png"
                  alt="GUTO"
                  width={268}
                  height={86}
                  priority
                  className="guto-name-logo"
                />
                <div className="guto-name-ampersand" aria-hidden="true">
                  &
                </div>
                <div className="guto-name-partner" aria-live="polite">
                  {draftName.trim()}
                </div>
              </motion.div>

              <div className="guto-name-input-block mt-auto w-full pb-[max(env(safe-area-inset-bottom),2.75rem)]">
                <div className="guto-name-slit mx-auto flex w-full max-w-[24rem] items-center gap-3 rounded-full px-5 py-3">
                  <input
                    type="text"
                    value={draftName}
                    onChange={(event) => {
                      setNameGate(null)
                      setDraftName(formatGutoName(event.target.value).slice(0, 24))
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void handleSeal()
                    }}
                    placeholder={locale.namingPlaceholder}
                    autoFocus
                    className="min-w-0 flex-1 border-none bg-transparent text-center font-mono text-xl font-black uppercase tracking-normal text-[var(--guto-cyan)] outline-none placeholder:text-[rgba(13,35,65,0.24)]"
                  />
                  <motion.button
                    type="button"
                    aria-label="Enviar nome"
                    onClick={() => void handleSeal()}
                    disabled={!draftName.trim() || isValidatingName}
                    whileTap={{ scale: 0.92 }}
                    className="guto-name-send flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-30"
                  >
                    <Send className="h-5 w-5" strokeWidth={2.4} />
                  </motion.button>
                </div>
                {nameGate?.target === "onboarding" && (
                  <div className="mx-auto mt-3 w-full max-w-[24rem] rounded-[18px] border border-white/70 bg-white/92 px-4 py-3 text-center shadow-[inset_4px_4px_12px_rgba(105,119,138,0.16),inset_-4px_-4px_12px_rgba(255,255,255,0.82)]">
                    <p className="font-mono text-[11px] font-black uppercase leading-snug tracking-normal text-[var(--guto-navy)]">
                      {nameGate.message}
                    </p>
                    {nameGate.status === "confirm" && (
                      <div className="mt-3 flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSeal(true)}
                          className="rounded-full bg-[var(--guto-cyan)] px-4 py-2 text-[10px] font-black uppercase tracking-normal text-white"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setNameGate(null)}
                          className="rounded-full border border-[rgba(13,35,65,0.14)] bg-white/55 px-4 py-2 text-[10px] font-black uppercase tracking-normal text-[var(--guto-navy)]"
                        >
                          Alterar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {stage === "calibration" && (
          <motion.section
            key="calibration"
            className="guto-main-screen absolute inset-0 z-30 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4 }}
          >
            <CalibrationScreen 
              language={selectedLanguage} 
              onComplete={handleCalibrationComplete} 
            />
          </motion.section>
        )}

        {stage === "pact" && (
          <motion.section
            key="pact"
            className="guto-main-screen absolute inset-0 z-30 flex flex-col items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0">
              <motion.div
                className="guto-pact-ignition absolute inset-0"
                animate={{
                  opacity: isHoldingPact ? Math.min(0.82, pactProgress / 115) : 0,
                }}
              />

              {pactVeins.map((left, index) => (
                <motion.div
                  key={left}
                  className="guto-pact-vein absolute bottom-0 w-0.5 origin-bottom rounded-full"
                  style={{ left: `${left * 100}%`, height: `${30 + index * 10}%` }}
                  animate={{
                    scaleY: 0.08 + pactProgress / 100,
                    opacity: pactProgress > 0 ? 0.16 + pactProgress / 130 : 0,
                  }}
                />
              ))}

              {pactNodes.map((node, index) => (
                <motion.div
                  key={`${node.left}-${node.top}`}
                  className="guto-pact-node absolute h-2.5 w-2.5 rounded-full"
                  style={{ left: `${node.left * 100}%`, top: `${node.top * 100}%` }}
                  animate={{
                    opacity: pactProgress > 12 + index * 14 ? 1 : 0,
                    scale: pactProgress > 12 + index * 14 ? [0.8, 1.45, 1] : 0.8,
                  }}
                  transition={{ duration: 0.55, repeat: isHoldingPact ? Infinity : 0, repeatDelay: 0.5 }}
                />
              ))}
            </div>

            <p className="guto-pact-title mb-9">
              {locale.noReturn}
            </p>

            <div className="relative flex items-center justify-center">
              <motion.div
                className="guto-pact-field pointer-events-none absolute h-80 w-80 rounded-full"
                animate={{
                  opacity: isHoldingPact ? 1 : 0.36,
                  scale: isHoldingPact ? [0.96, 1.05, 0.96] : 1,
                }}
                transition={{ duration: 1.2, repeat: isHoldingPact ? Infinity : 0, ease: "easeInOut" }}
              />

              {[0, 1, 2].map((ring) => (
                <motion.div
                  key={ring}
                  className="guto-pact-shock pointer-events-none absolute h-44 w-44 rounded-full"
                  animate={{
                    opacity: isHoldingPact ? [0, 0.46, 0] : 0,
                    scale: isHoldingPact ? [1, 1.58 + ring * 0.18, 1.78 + ring * 0.18] : 1,
                  }}
                  transition={{
                    duration: 1.45,
                    delay: ring * 0.22,
                    repeat: isHoldingPact ? Infinity : 0,
                    ease: "easeOut",
                  }}
                />
              ))}

              <svg className="absolute -inset-7 h-56 w-56 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(13,35,65,0.08)" strokeWidth="4" />
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="rgba(82,231,255,0.94)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="427"
                  strokeDashoffset={427 - (427 * pactProgress) / 100}
                  style={{ filter: "drop-shadow(0 0 10px rgba(82,231,255,0.36))" }}
                />
              </svg>

              <motion.button
                type="button"
                onPointerDown={() => setIsHoldingPact(true)}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                aria-label="Selar pacto"
                className="guto-biometric-scanner relative flex h-44 w-44 touch-none items-center justify-center rounded-full"
                animate={{
                  scale: isHoldingPact ? (pactProgress > 70 ? [0.95, 1.02, 0.97] : 0.97) : 1,
                  boxShadow: isHoldingPact
                    ? "inset 8px 9px 20px rgba(105,119,138,0.32), inset -9px -9px 18px rgba(255,255,255,0.96), inset 0 0 26px rgba(82,231,255,0.44), 0 0 34px rgba(82,231,255,0.22)"
                    : undefined,
                }}
                transition={{ duration: 0.42, repeat: isHoldingPact && pactProgress > 70 ? Infinity : 0 }}
              >
                <div className="absolute inset-5 rounded-full border border-white/80" />
                <motion.div
                  className="guto-pact-scan absolute inset-7 rounded-full"
                  animate={{ opacity: isHoldingPact ? 1 : 0, y: isHoldingPact ? ["-32%", "32%", "-32%"] : "-32%" }}
                  transition={{ duration: 1.15, repeat: isHoldingPact ? Infinity : 0, ease: "easeInOut" }}
                />
                <motion.div
                  className="guto-pact-core absolute inset-[2.35rem] rounded-full"
                  animate={{
                    opacity: isHoldingPact ? 1 : 0.2,
                    scale: isHoldingPact ? [0.94, 1.08, 0.94] : 1,
                  }}
                  transition={{ duration: 0.9, repeat: isHoldingPact ? Infinity : 0 }}
                />
                <Fingerprint
                  className="relative z-10 h-14 w-14"
                  style={{ color: isHoldingPact ? "var(--guto-cyan)" : "rgba(13,35,65,0.38)" }}
                />
              </motion.button>
            </div>

            <p className="guto-pact-hold mt-8">
              {isHoldingPact
                ? pactProgress > 70
                  ? `SELANDO ${Math.round(pactProgress)}%`
                  : `CONECTANDO ${Math.round(pactProgress)}%`
                : locale.hold}
            </p>
          </motion.section>
        )}

        {stage === "system" && (
          <motion.section
            key="system"
            className="guto-main-screen absolute inset-0 z-20 flex h-full min-h-0 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="relative flex min-h-0 flex-1 flex-col">
              {activeTab === "guto" ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    className="min-h-0 flex-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.24 }}
                  >
                    {tabContent}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="mx-4 mb-[var(--guto-bottom-nav-space)] mt-[max(env(safe-area-inset-top),1.1rem)] flex min-h-0 flex-1 flex-col">
                <div className="guto-deboss flex min-h-0 flex-1 flex-col rounded-[2.25rem] px-4 py-4">
                  <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        className="h-full"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.24 }}
                      >
                        {tabContent}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                </div>
              )}

              <div className="guto-bottom-nav absolute inset-x-0 bottom-0 z-30">
                <BottomNavigation
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  language={selectedLanguage}
                />
              </div>

              <div className="absolute right-4 top-[max(env(safe-area-inset-top),1rem)] z-40">
                <motion.button
                  type="button"
                  aria-label={locale.settingsTitle}
                  onClick={openSettings}
                  whileTap={{ scale: 0.94 }}
                  className="guto-settings-trigger grid h-10 w-10 place-items-center rounded-full"
                >
                  <Settings className="h-4 w-4" strokeWidth={2.2} />
                </motion.button>
              </div>
            </div>
          </motion.section>
        )}

        {stage === "settings" && (
          <motion.section
            key="settings"
            className="guto-main-screen absolute inset-0 z-30 flex flex-col px-8"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div className="guto-settings-topbar flex items-center justify-between">
              <motion.button
                type="button"
                aria-label={settingsMode === "menu" ? locale.settingsClose : locale.settingsBack}
                onClick={handleSettingsBack}
                whileTap={{ scale: 0.94 }}
                className="guto-settings-trigger grid h-10 w-10 place-items-center rounded-full"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
              </motion.button>
              <p className="guto-settings-page-title">
                {settingsMode === "language"
                  ? locale.settingsLanguage
                  : settingsMode === "name"
                    ? locale.settingsName
                    : locale.settingsTitle}
              </p>
              <div className="h-10 w-10" aria-hidden="true" />
            </div>

            {settingsMode === "menu" && (
              <div className="guto-language-grid grid grid-cols-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSettingsMode("language")}
                  aria-label={locale.settingsLanguage}
                  className="guto-language-card guto-settings-choice-card group relative flex items-center overflow-hidden rounded-[18px]"
                >
                  <Languages className="guto-settings-choice-icon" strokeWidth={2.2} />
                  <span className="guto-settings-choice-label">{locale.settingsLanguage}</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSettingsMode("name")}
                  aria-label={locale.settingsName}
                  className="guto-language-card guto-settings-choice-card group relative flex items-center overflow-hidden rounded-[18px]"
                >
                  <UserRound className="guto-settings-choice-icon" strokeWidth={2.2} />
                  <span className="guto-settings-choice-label">{locale.settingsName}</span>
                </motion.button>
              </div>
            )}

            {settingsMode === "language" && (
              <div className="guto-language-grid grid grid-cols-2">
                {languages.map((lang) => (
                  <motion.button
                    key={lang.id}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onHoverStart={() => setActiveLanguageGlow(lang.id)}
                    onHoverEnd={() =>
                      setActiveLanguageGlow((current) => (current === lang.id ? null : current))
                    }
                    onPointerDown={() => setActiveLanguageGlow(lang.id)}
                    onPointerUp={() => setActiveLanguageGlow(null)}
                    onPointerCancel={() => setActiveLanguageGlow(null)}
                    onPointerLeave={() => setActiveLanguageGlow(null)}
                    onClick={() => handleSettingsLanguageSelect(lang.id)}
                    aria-label={lang.label}
                    className="guto-language-card group relative flex items-center overflow-hidden rounded-[18px]"
                    data-active={activeLanguageGlow === lang.id || selectedLanguage === lang.id}
                  >
                    <Image
                      src={lang.asset}
                      alt=""
                      aria-hidden="true"
                      width={70}
                      height={70}
                      className="guto-language-vector"
                    />
                  </motion.button>
                ))}
              </div>
            )}

            {settingsMode === "name" && (
              <div className="guto-name-stage flex w-full flex-1 flex-col items-center">
                <motion.div
                  className="guto-name-lockup"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Image
                    src="/assets/guto/logo_guto.png"
                    alt="GUTO"
                    width={268}
                    height={86}
                    className="guto-name-logo"
                  />
                  <div className="guto-name-ampersand" aria-hidden="true">
                    &
                  </div>
                  <div className="guto-name-partner" aria-live="polite">
                    {settingsNameDraft.trim()}
                  </div>
                </motion.div>

                <form
                  className="guto-name-input-block mt-auto w-full pb-[max(env(safe-area-inset-bottom),2.75rem)]"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void saveSettingsName()
                  }}
                >
                  <div className="guto-name-slit mx-auto flex w-full max-w-[24rem] items-center gap-3 rounded-full px-5 py-3">
                    <input
                      type="text"
                      value={settingsNameDraft}
                      onChange={(event) => {
                        setNameGate(null)
                        setSettingsNameDraft(formatGutoName(event.target.value).slice(0, 24))
                      }}
                      placeholder={locale.settingsNamePlaceholder}
                      autoFocus
                      className="min-w-0 flex-1 border-none bg-transparent text-center font-mono text-xl font-black uppercase tracking-normal text-[var(--guto-cyan)] outline-none placeholder:text-[rgba(13,35,65,0.24)]"
                    />
                    <motion.button
                      type="submit"
                      aria-label={locale.settingsSaveName}
                      disabled={!canSaveSettingsName}
                      whileTap={{ scale: 0.92 }}
                      className="guto-name-send flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-30"
                    >
                      <Check className="h-5 w-5" strokeWidth={2.6} />
                    </motion.button>
                  </div>
                  {nameGate?.target === "settings" && (
                    <div className="mx-auto mt-3 w-full max-w-[24rem] rounded-[18px] border border-white/70 bg-white/92 px-4 py-3 text-center shadow-[inset_4px_4px_12px_rgba(105,119,138,0.16),inset_-4px_-4px_12px_rgba(255,255,255,0.82)]">
                      <p className="font-mono text-[11px] font-black uppercase leading-snug tracking-normal text-[var(--guto-navy)]">
                        {nameGate.message}
                      </p>
                      {nameGate.status === "confirm" && (
                        <div className="mt-3 flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => void saveSettingsName(true)}
                            className="rounded-full bg-[var(--guto-cyan)] px-4 py-2 text-[10px] font-black uppercase tracking-normal text-white"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setNameGate(null)}
                            className="rounded-full border border-[rgba(13,35,65,0.14)] bg-white/55 px-4 py-2 text-[10px] font-black uppercase tracking-normal text-[var(--guto-navy)]"
                          >
                            Alterar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {whiteout && (
          <motion.div
            key="whiteout"
            className="absolute inset-0 z-40 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          />
        )}
      </AnimatePresence>

      {showValidationFlow && (
        <div className="fixed inset-0 z-50">
          <WorkoutValidationFlow
            language={selectedLanguage}
            userId={gutoUserId}
            workoutFocus={workoutPlan?.focusKey || "full_body"}
            workoutLabel={workoutPlan?.focus || ""}
            onComplete={(validationHistory) => {
              setMemory((prev) => prev ? { ...prev, validationHistory } : prev)
              setShowValidationFlow(false)
              setActiveTab("caminho")
            }}
            onClose={() => setShowValidationFlow(false)}
          />
        </div>
      )}
    </div>
  )
}
