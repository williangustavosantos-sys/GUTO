"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Activity, ArrowLeft, Check, CheckCircle2, Dumbbell, Fingerprint, Languages, Loader2, MapPin, Send, Settings, UserRound, Volume2, Zap } from "lucide-react"

import { BottomNavigation, type TabType } from "./bottom-navigation"
import { createGutoEffectRegistry } from "./effects"
import { ArenaTab } from "./tabs/arena-tab"
import { ChatTab } from "./tabs/chat-tab"
import { DietTab } from "./tabs/diet-tab"
import { EvolutionsTab } from "./tabs/evolutions-tab"
import { MissionTab } from "./tabs/mission-tab"
import { PathTab } from "./tabs/path-tab"
import { CalibrationScreen } from "./screens/calibration-screen"
import type { MissionExercise } from "./view-models"
import { WorkoutValidationFlow } from "./validation/workout-validation-flow"
import { getApiErrorMessage } from "@/lib/api/client"
import { getGutoMemory, saveGutoMemory, trackGutoEvent, validateGutoName, type DietFood, type DietMeal, type GutoMemory, type GutoNameValidation, type GutoTelemetryEvent, type GutoWorkoutPlan } from "@/lib/api/guto"
import { useAuth } from "@/components/auth-provider"
import { getInvite, claimInvite } from "@/lib/api/auth"
import type { EvolutionStage, SupportedLanguage } from "@/types/contract"
import { resolveGutoEvolutionStage } from "@/lib/guto-evolution"
import { translations } from "./translations"
import { gutoAudio } from "@/lib/audio-haptics"
import {
  firstRealGutoName,
  formatGutoDisplayName,
  hasCompleteGutoCalibration,
  isGenericGutoName,
  resolveGutoLanguage,
  resolveGutoProfile,
  type StoredGutoProfile,
} from "@/lib/guto-profile"
import { createLocalWorkoutPlan, getWorkoutMissingFields, localizeGutoWorkoutPlan } from "@/lib/workout-plan"

type AppStage = "intro" | "language" | "invite_claim" | "naming" | "calibration" | "pact" | "system" | "settings"
type SettingsMode = "menu" | "language" | "name" | "profile" | "goal" | "location" | "pathology" | "physicaldata" | "residence" | "food_restrictions"
type IntroPlaybackState = "idle" | "starting" | "playing" | "finishing" | "finished"

const PENDING_INVITE_TOKEN_KEY = "guto-pending-invite-token"
const ENTRY_MODE_KEY = "guto-entry-mode"
const SELECTED_LANGUAGE_KEY = "guto-selected-language"
const ONBOARDING_LANGUAGE_KEY = "guto-onboarding-language"
const PRIVATE_STAGES = new Set<AppStage>(["naming", "calibration", "pact", "system", "settings"])

interface StoredProfile extends StoredGutoProfile {
  language: SupportedLanguage
  userName: string
  onboardingComplete: boolean
  calibrationComplete?: boolean
  pactAccepted?: boolean
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
const STORAGE_VERSION = 2  // bump aqui para forçar reset em todos os dispositivos
const STORAGE_VERSION_KEY = "guto-storage-version"
const DEBUG_RESET_KEY = "guto-debug-reset"
const HOLD_INTERVAL_MS = 16
const HOLD_INCREMENT = (HOLD_INTERVAL_MS / 1600) * 100
const INTRO_VIDEO_MS = 4000

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
    settingsProfile: string
    settingsGoal: string
    settingsLocation: string
    settingsPathology: string
    settingsPhysicalData: string
    settingsResidence: string
    settingsFoodRestrictions: string
    settingsSave: string
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
    settingsProfile: "Perfil",
    settingsGoal: "Objetivo",
    settingsLocation: "Local",
    settingsPathology: "Limitações",
    settingsPhysicalData: "Peso / Altura",
    settingsResidence: "Onde Mora",
    settingsFoodRestrictions: "Restrições",
    settingsSave: "Salvar",
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
    settingsProfile: "Profile",
    settingsGoal: "Goal",
    settingsLocation: "Location",
    settingsPathology: "Limitations",
    settingsPhysicalData: "Weight / Height",
    settingsResidence: "Where You Live",
    settingsFoodRestrictions: "Restrictions",
    settingsSave: "Save",
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
    settingsProfile: "Perfil",
    settingsGoal: "Objetivo",
    settingsLocation: "Local",
    settingsPathology: "Limitaciones",
    settingsPhysicalData: "Peso / Altura",
    settingsResidence: "Dónde Vives",
    settingsFoodRestrictions: "Restricciones",
    settingsSave: "Guardar",
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
    settingsProfile: "Profilo",
    settingsGoal: "Obiettivo",
    settingsLocation: "Luogo",
    settingsPathology: "Limitazioni",
    settingsPhysicalData: "Peso / Altezza",
    settingsResidence: "Dove Abiti",
    settingsFoodRestrictions: "Restrizioni",
    settingsSave: "Salva",
  },
}

const inviteClaimCopy: Record<SupportedLanguage, {
  title: string; greetingPrefix: string; invited: string; createPass: string; confirmPass: string
  mismatch: string; tooShort: string; cta: string; activated: string; starting: string; back: string
  invalid: string; activationFailed: string
}> = {
  "pt-BR": {
    title: "Ativar acesso",
    greetingPrefix: "Ol\u00e1,", invited: "Voc\u00ea foi convidado para entrar no GUTO.",
    createPass: "Criar Senha", confirmPass: "Confirmar Senha",
    mismatch: "As senhas n\u00e3o coincidem.", tooShort: "A senha deve ter pelo menos 6 caracteres.",
    cta: "ATIVAR MEU GUTO", activated: "CONTA ATIVADA COM SUCESSO.", starting: "Iniciando sistema...", back: "Voltar para o In\u00edcio",
    invalid: "Convite inv\u00e1lido, expirado ou j\u00e1 utilizado.", activationFailed: "Erro ao ativar convite. Tente novamente.",
  },
  "en-US": {
    title: "Activate access",
    greetingPrefix: "Hi,", invited: "You've been invited to join GUTO.",
    createPass: "Create Password", confirmPass: "Confirm Password",
    mismatch: "Passwords don't match.", tooShort: "Password must be at least 6 characters.",
    cta: "ACTIVATE MY GUTO", activated: "ACCOUNT ACTIVATED SUCCESSFULLY.", starting: "Starting system...", back: "Back to Start",
    invalid: "Invalid, expired, or already used invite.", activationFailed: "Could not activate invite. Try again.",
  },
  "es-ES": {
    title: "Activar acceso",
    greetingPrefix: "Hola,", invited: "Has sido invitado a unirte a GUTO.",
    createPass: "Crear Contrase\u00f1a", confirmPass: "Confirmar Contrase\u00f1a",
    mismatch: "Las contrase\u00f1as no coinciden.", tooShort: "La contrase\u00f1a debe tener al menos 6 caracteres.",
    cta: "ACTIVAR MI GUTO", activated: "CUENTA ACTIVADA CON \u00c9XITO.", starting: "Iniciando sistema...", back: "Volver al Inicio",
    invalid: "Invitaci\u00f3n inv\u00e1lida, expirada o ya utilizada.", activationFailed: "No se pudo activar la invitaci\u00f3n. Int\u00e9ntalo de nuevo.",
  },
  "it-IT": {
    title: "Attiva accesso",
    greetingPrefix: "Ciao,", invited: "Sei stato invitato a entrare in GUTO.",
    createPass: "Crea Password", confirmPass: "Conferma Password",
    mismatch: "Le password non corrispondono.", tooShort: "La password deve avere almeno 6 caratteri.",
    cta: "ATTIVA IL MIO GUTO", activated: "ACCOUNT ATTIVATO CON SUCCESSO.", starting: "Avvio sistema...", back: "Torna all'Inizio",
    invalid: "Invito non valido, scaduto o gi\u00e0 utilizzato.", activationFailed: "Impossibile attivare l'invito. Riprova.",
  },
}

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return ["pt-BR", "en-US", "es-ES", "it-IT"].includes(value)
}

function formatGutoName(value: string) {
  return formatGutoDisplayName(value)
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

const resolveEvolutionStage = resolveGutoEvolutionStage

async function resolveGutoNameValidation(value: string, userId?: string) {
  try {
    return await validateGutoName(value, userId)
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

function clearPendingInviteStorage() {
  removeStorageItem(PENDING_INVITE_TOKEN_KEY)
  removeStorageItem(ENTRY_MODE_KEY)
}

function writeOnboardingLanguageStorage(language: SupportedLanguage) {
  writeStorageItem(SELECTED_LANGUAGE_KEY, language)
  writeStorageItem(ONBOARDING_LANGUAGE_KEY, language)
  if (process.env.NODE_ENV === "development") {
    console.info("[GUTO_LANGUAGE] persisted", { language, source: "onboarding" })
  }
}

function writeConfirmedLanguageStorage(language: SupportedLanguage) {
  writeStorageItem(SELECTED_LANGUAGE_KEY, language)
  removeStorageItem(ONBOARDING_LANGUAGE_KEY)
  if (process.env.NODE_ENV === "development") {
    console.info("[GUTO_LANGUAGE] persisted", { language, source: "settings" })
  }
}

function readResolvedStoredLanguage({
  scope = "private",
  sessionLanguage,
  localProfileLanguage,
  memoryLanguage,
  fallbackLanguage,
}: {
  scope?: "onboarding" | "private"
  sessionLanguage?: string | null
  localProfileLanguage?: string | null
  memoryLanguage?: string | null
  fallbackLanguage?: string | null
}) {
  const resolved = resolveGutoLanguage({
    scope,
    sessionLanguage,
    onboardingLanguage: readStorageItem(ONBOARDING_LANGUAGE_KEY),
    localProfileLanguage,
    memoryLanguage,
    globalStoredLanguage: readStorageItem(SELECTED_LANGUAGE_KEY),
    fallbackLanguage,
  })
  if (process.env.NODE_ENV === "development") {
    console.info("[GUTO_LANGUAGE] resolved", { scope, language: resolved })
  }
  return resolved
}

function getPublicEntryStage(hasInviteToken: boolean, skipIntro: boolean): AppStage {
  if (skipIntro) return hasInviteToken ? "invite_claim" : "language"
  return "intro"
}

function hasStoredName(profile?: StoredProfile | null) {
  return Boolean(firstRealGutoName(profile?.userName))
}

function hasMemoryName(memory?: GutoMemory | null) {
  return Boolean(firstRealGutoName(memory?.name))
}

function hasMemoryCalibration(memory?: GutoMemory | null) {
  return hasCompleteGutoCalibration(memory)
}

function resolveAuthenticatedStage(
  user: { userId: string } | null | undefined,
  profile?: StoredProfile | null,
  memory?: GutoMemory | null
): AppStage {
  if (!user) return "intro"

  console.log("[GUTO_ONBOARDING] authenticated user detected", user.userId)
  console.log("[GUTO_ONBOARDING] profile loaded", Boolean(profile))

  if (profile?.onboardingComplete || profile?.pactAccepted) {
    console.log("[GUTO_ONBOARDING] complete -> system")
    console.log("[GUTO_ONBOARDING] resolved stage system")
    return "system"
  }

  if (!hasStoredName(profile) && !hasMemoryName(memory)) {
    console.log("[GUTO_ONBOARDING] missing name")
    console.log("[GUTO_ONBOARDING] resolved stage naming")
    return "naming"
  }

  if (!profile?.calibrationComplete && !hasMemoryCalibration(memory)) {
    console.log("[GUTO_ONBOARDING] missing calibration")
    console.log("[GUTO_ONBOARDING] resolved stage calibration")
    return "calibration"
  }

  console.log("[GUTO_ONBOARDING] missing pact")
  console.log("[GUTO_ONBOARDING] resolved stage pact")
  return "pact"
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
  const { user, login, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [stage, setStage] = useState<AppStage>(skipIntro ? "language" : "intro")
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("pt-BR")
  const [draftName, setDraftName] = useState("")
  const [committedName, setCommittedName] = useState("")
  const [activeTab, setActiveTab] = useState<TabType>("guto")
  const [evolution, setEvolution] = useState<EvolutionStage>("baby")
  const [activeLanguageGlow, setActiveLanguageGlow] = useState<SupportedLanguage | null>(null)
  const [rotatingLanguage, setRotatingLanguage] = useState(false)
  const [isHoldingPact, setIsHoldingPact] = useState(false)
  const [pactProgress, setPactProgress] = useState(0)
  const [whiteout, setWhiteout] = useState(false)
  const [introNeedsActivation, setIntroNeedsActivation] = useState(true)
  const [introPlaybackState, setIntroPlaybackState] = useState<IntroPlaybackState>("idle")
  const [settingsMode, setSettingsMode] = useState<SettingsMode>("menu")
  const [settingsNameDraft, setSettingsNameDraft] = useState("")
  const [settingsSexDraft, setSettingsSexDraft] = useState<"male" | "female" | null>(null)
  const [settingsAgeDraft, setSettingsAgeDraft] = useState("")
  const [settingsGoalDraft, setSettingsGoalDraft] = useState<string | null>(null)
  const [settingsLocationDraft, setSettingsLocationDraft] = useState<string | null>(null)
  const [settingsPathologyDraft, setSettingsPathologyDraft] = useState("")
  const [pendingExerciseQuestion, setPendingExerciseQuestion] =
    useState<PendingExerciseQuestion | null>(null)
  const [pendingFoodQuestion, setPendingFoodQuestion] = useState<{ food: DietFood; meal: DietMeal } | null>(null)
  const [workoutPlan, setWorkoutPlan] = useState<GutoWorkoutPlan | null>(null)
  const [memory, setMemory] = useState<GutoMemory | null>(null)
  const [gutoUserId, setGutoUserId] = useState(user?.userId || "guest")
  const [nameGate, setNameGate] = useState<NameGate | null>(null)
  const [isValidatingName, setIsValidatingName] = useState(false)
  const [showValidationFlow, setShowValidationFlow] = useState(false)
  const [arenaRefreshKey, setArenaRefreshKey] = useState(0)
  const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(null)
  const [inviteClaimData, setInviteClaimData] = useState<{ name: string; userId: string; coachId: string } | null>(null)
  const [invitePassword, setInvitePassword] = useState("")
  const [inviteConfirmPassword, setInviteConfirmPassword] = useState("")
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)

  const timersRef = useRef<number[]>([])
  const pactIntervalRef = useRef<number | null>(null)
  const introSafetyTimerRef = useRef<number | null>(null)
  const introFinishedRef = useRef(false)
  const introStartedRef = useRef(false)
  const introStartedAtRef = useRef(0)
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

  const clearIntroSafetyTimer = useCallback(() => {
    if (introSafetyTimerRef.current) {
      window.clearTimeout(introSafetyTimerRef.current)
      introSafetyTimerRef.current = null
    }
  }, [])

  const persistProfile = useCallback(
    (next: Partial<StoredProfile>) => {
      if (typeof window === "undefined" || !user?.userId) return

      const storageKey = `${STORAGE_KEY}-${user.userId}`
      const existingRaw = readStorageItem(storageKey)
      let existing: StoredProfile = {
        language: selectedLanguage,
        userName: committedName,
        onboardingComplete: false,
      }

      if (existingRaw) {
        try {
          existing = JSON.parse(existingRaw) as StoredProfile
        } catch {
          removeStorageItem(storageKey)
        }
      }

      const payload: StoredProfile = {
        ...existing,
        language: selectedLanguage,
        userName: committedName,
        ...next,
      }

      writeStorageItem(storageKey, JSON.stringify(payload))
    },
    [committedName, selectedLanguage, user]
  )

  const persistMemory = useCallback(
    async (payload: Parameters<typeof saveGutoMemory>[0]) => {
      setMemory((prev) => (prev ? { ...prev, ...payload } : (payload as import("@/lib/api/guto").GutoMemory)))
      if (!user?.userId) return
      try {
        const updated = await saveGutoMemory({
          userId: gutoUserId,
          language: selectedLanguage,
          ...payload,
        })
        setMemory(updated)
        return updated
      } catch (error) {
        console.warn(`Memória do GUTO não sincronizada: ${getApiErrorMessage(error)}`)
      }
    },
    [gutoUserId, selectedLanguage, user?.userId]
  )

  const trackBehaviorEvent = useCallback(
    (event: GutoTelemetryEvent, metadata?: Record<string, unknown>) => {
      if (!user?.userId) return
      void trackGutoEvent({
        event,
        userId: gutoUserId,
        language: selectedLanguage,
        metadata,
      }).catch((error) => {
        console.warn(`Evento do GUTO não registrado: ${getApiErrorMessage(error)}`)
      })
    },
    [gutoUserId, selectedLanguage, user?.userId]
  )

  const previousStageRef = useRef<AppStage | null>(null)

  useEffect(() => {
    if (previousStageRef.current && previousStageRef.current !== stage) {
      gutoAudio.playGutoFeedback('transition')
    }
    previousStageRef.current = stage
  }, [stage])

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
    if (authLoading) return
    let cancelled = false

    if (!user?.userId) {
      const savedLang = readResolvedStoredLanguage({ scope: "onboarding", fallbackLanguage: language })
      const savedInviteToken = localStorage.getItem(PENDING_INVITE_TOKEN_KEY)
      const savedEntryMode = localStorage.getItem(ENTRY_MODE_KEY)
      setSelectedLanguage(savedLang)
      if (savedInviteToken) {
        setPendingInviteToken(savedInviteToken)
        if (savedEntryMode !== "invite") localStorage.setItem(ENTRY_MODE_KEY, "invite")
        setStage(getPublicEntryStage(true, skipIntro))
      } else if (savedEntryMode === "invite") {
        localStorage.removeItem(ENTRY_MODE_KEY)
      } else {
        setStage(getPublicEntryStage(false, skipIntro))
      }
      setIsHydrated(true)
      return
    }

    const hydrateAuthenticatedUser = async () => {
      try {
        const currentUserId = user.userId
        setGutoUserId(currentUserId)

        const search = new URLSearchParams(window.location.search)
        const forceResetParam = search.get("forceReset") === "1"
        const presetName = search.get("presetName")

        const userStorageKey = `${STORAGE_KEY}-${currentUserId}`
        const userVersionKey = `${STORAGE_VERSION_KEY}-${currentUserId}`

        const storedVersion = parseInt(readStorageItem(userVersionKey) ?? "0", 10)
        const versionOutdated = storedVersion < STORAGE_VERSION

        const shouldReset =
          search.get("guto-reset") === "1" || forceResetParam || readStorageItem(DEBUG_RESET_KEY) === "1" || versionOutdated

        console.log(`[GUTO_FLOW] useEffect init - guto-reset detected: ${shouldReset}`);

        if (shouldReset) {
          removeStorageItem(userStorageKey)
          removeStorageItem(DEBUG_RESET_KEY)
          writeStorageItem(userVersionKey, String(STORAGE_VERSION))
        } else {
          writeStorageItem(userVersionKey, String(STORAGE_VERSION))
        }

        // Cleanup URL parameters precisely once without triggering a re-render
        if (search.has("guto-reset") || search.has("forceReset") || search.has("skip-intro")) {
          console.log("[GUTO_FLOW] Removendo parametros guto-reset e skip-intro da URL...");
          const url = new URL(window.location.href);
          url.searchParams.delete("guto-reset");
          url.searchParams.delete("skip-intro");
          url.searchParams.delete("forceReset");
          url.searchParams.delete("presetName");
          window.history.replaceState({}, document.title, url.toString());
        }

        const storedRaw = readStorageItem(userStorageKey)
        let stored: StoredProfile | null = null

        if (storedRaw) {
          try {
            stored = JSON.parse(storedRaw) as StoredProfile
          } catch {
            removeStorageItem(userStorageKey)
          }
        }

        let loadedMemory: GutoMemory | null = null
        try {
          loadedMemory = await getGutoMemory(currentUserId)
        } catch {
          loadedMemory = null
        }

        if (cancelled) return

        if (loadedMemory) {
          setMemory(loadedMemory)
          setEvolution(resolveEvolutionStage(loadedMemory.totalXp || 0))
          setWorkoutPlan(loadedMemory.lastWorkoutPlan?.exercises?.length ? loadedMemory.lastWorkoutPlan : null)
        }

        const persistedLanguage = readResolvedStoredLanguage({
          scope: "private",
          localProfileLanguage: stored?.language,
          memoryLanguage: loadedMemory?.language,
          fallbackLanguage: language,
        })
        if (process.env.NODE_ENV === "development") {
          console.info("[GUTO_LANGUAGE] resolved after auth:", persistedLanguage)
        }
        const resolvedProfile = resolveGutoProfile({
          user,
          stored,
          memory: loadedMemory,
          fallbackName: firstRealGutoName(presetName, userName),
        })
        const resolvedName = resolvedProfile.displayName

        setSelectedLanguage(persistedLanguage)
        writeStorageItem(SELECTED_LANGUAGE_KEY, persistedLanguage)
        if (process.env.NODE_ENV === "development") {
          console.info("[GUTO_LANGUAGE] applied in private app:", persistedLanguage)
        }
        setDraftName(resolvedName)
        setCommittedName(resolvedName)
        if (resolvedName) {
          persistProfile({ userName: resolvedName, language: persistedLanguage, onboardingComplete: Boolean(stored?.onboardingComplete) })
          if (!loadedMemory || isGenericGutoName(loadedMemory.name)) {
            void persistMemory({ name: resolvedName, language: persistedLanguage })
          }
        }
        setStage(resolveAuthenticatedStage(user, stored, loadedMemory))
      } catch {
        if (cancelled) return
        const safeLanguage = readResolvedStoredLanguage({ scope: "private", fallbackLanguage: language })
        setSelectedLanguage(safeLanguage)
        setDraftName(formatGutoName(userName || ""))
        setCommittedName(formatGutoName(userName || ""))
        setStage(resolveAuthenticatedStage(user, null, null))
      } finally {
        if (!cancelled) setIsHydrated(true)
      }
    }

    void hydrateAuthenticatedUser()

    return () => {
      cancelled = true
      clearScheduled()
      clearPactInterval()
      clearIntroSafetyTimer()
    }
  }, [authLoading, clearIntroSafetyTimer, clearPactInterval, clearScheduled, language, skipIntro, user?.userId, userName])

  useEffect(() => {
    if (authLoading || !isHydrated) return

    if (user && user.role !== "student") {
      router.replace("/coach")
      return
    }

    // VISITORS (unauthenticated) flow: Always Intro -> Video -> Language
    // Never redirect to login if we haven't reached the language selection stage yet
    if (!user) {
      if (stage !== "intro" && stage !== "language" && stage !== "invite_claim") {
        // If somehow in a private stage without being logged in, reset to intro
        if (PRIVATE_STAGES.has(stage)) {
          console.log("[GUTO_FLOW] Unauthorized access to private stage, resetting to intro")
          setStage("intro")
        }
      }
      return
    }

    // AUTHENTICATED users flow: public stages are not repeated, but private onboarding cannot be skipped.
    if (!PRIVATE_STAGES.has(stage)) {
      clearPendingInviteStorage()
      setPendingInviteToken(null)
      setStage(resolveAuthenticatedStage(user, null, memory))
      return
    }
  }, [authLoading, isHydrated, memory, router, stage, user])

  useEffect(() => {
    if (stage === "intro") {
      console.log("[GUTO_FLOW] intro screen mounted")
      introFinishedRef.current = false
      introStartedRef.current = false
      clearIntroSafetyTimer()
      setIntroNeedsActivation(true)
      setIntroPlaybackState("idle")
    }
  }, [clearIntroSafetyTimer, stage])

  const startSystem = useCallback(
    (finalName: string, finalLanguage: SupportedLanguage) => {
      if (pactCompleteRef.current) return
      pactCompleteRef.current = true
      gutoAudio.stopGutoSound("hold_charge")
      gutoAudio.playGutoFeedback("hold_complete")

      effectRegistry.emit("whiteout")
      persistProfile({
        language: finalLanguage,
        userName: finalName,
        calibrationComplete: true,
        pactAccepted: true,
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

  // ── Unique completer: ONLY sets stage to language, never decides login/invite ─
  const completeIntroToLanguage = useCallback(() => {
    if (introFinishedRef.current) return
    introFinishedRef.current = true
    clearIntroSafetyTimer()
    effectRegistry.emit("portal_open")
    setIntroPlaybackState("finished")
    console.log("[GUTO_FLOW] intro finished -> language")
    setStage("language")
  }, [clearIntroSafetyTimer, effectRegistry])

  const restartPortalVideo = useCallback(() => {
    const video = portalVideoRef.current
    if (!video || introStartedRef.current) return

    video.pause()
    video.controls = false
    video.defaultMuted = true
    video.muted = true
    video.volume = 1
    // Force back to frame 0 so Safari doesn't show a pre-buffered frame
    try { video.currentTime = 0 } catch { /* ignore Safari timing errors */ }
  }, [])

  // ── Single entry point for the intro — always 4000ms, no variable timers ──
  const startIntroVideo = useCallback(() => {
    gutoAudio.playGutoFeedback("tap")
    if (introStartedRef.current) return // prevent double-tap
    console.log("[GUTO_FLOW] start intro clicked")
    clearIntroSafetyTimer()
    introStartedRef.current = true
    introStartedAtRef.current = Date.now()
    introFinishedRef.current = false
    setIntroPlaybackState("starting")

    const video = portalVideoRef.current

    // SAFARI FIX: Reset to frame 0 BEFORE making the video visible.
    // Safari pre-buffers frames during preload, so we must seek back
    // imperatively before the visibility state change triggers a re-render.
    if (video) {
      video.pause()
      try { video.currentTime = 0 } catch { /* Safari rejects before metadata — ignore */ }
    }

    // Now safe to reveal the video (React re-render will show frame 0)
    setIntroNeedsActivation(false)

    // Safety timer is the MASTER control: 4000ms fixed
    console.log("[GUTO_FLOW] starting 4000ms master timer")
    introSafetyTimerRef.current = window.setTimeout(completeIntroToLanguage, INTRO_VIDEO_MS)

    if (!video) {
      console.log("[GUTO_FLOW] video play attempt — no element, using timer only")
      return
    }

    video.controls = false
    video.playsInline = true
    video.setAttribute("playsinline", "")
    video.setAttribute("webkit-playsinline", "")

    // Use requestAnimationFrame so the seek to 0 has been painted
    // before we start playback — critical for Safari
    requestAnimationFrame(() => {
      console.log("[GUTO_FLOW] video play attempt")

      // Try unmuted first
      video.muted = false
      video.defaultMuted = false
      video.volume = 1

      video.play()
        .then(() => {
          console.log("[GUTO_FLOW] video play success")
          setIntroPlaybackState("playing")
        })
        .catch(() => {
          console.log("[GUTO_FLOW] video play failed, trying muted")
          video.muted = true
          video.defaultMuted = true
          video.setAttribute("muted", "")
          video.play()
            .then(() => {
              console.log("[GUTO_FLOW] video play success (muted)")
              setIntroPlaybackState("playing")
            })
            .catch(() => {
              console.log("[GUTO_FLOW] muted play failed, fallback visual only")
            })
        })
    })
  }, [clearIntroSafetyTimer, completeIntroToLanguage])

  const handleIntroVideoEnded = useCallback(() => {
    console.log("[GUTO_FLOW] video playback ended naturally")
  }, [])

  const handleLanguageSelect = useCallback(
    (lang: SupportedLanguage) => {
      gutoAudio.playGutoFeedback("select")
      if (rotatingLanguage) return

      effectRegistry.emit("language_select", { meta: { language: lang } })
      setSelectedLanguage(lang)
      writeOnboardingLanguageStorage(lang)
      if (process.env.NODE_ENV === "development") {
        console.info("[GUTO_LANGUAGE] onboarding selected:", lang)
      }
      console.log("[GUTO_FLOW] language selected", lang)

      if (!user) {
        if (typeof window !== "undefined") {
          const pendingToken = localStorage.getItem(PENDING_INVITE_TOKEN_KEY)
          
          if (pendingToken) {
            console.log("[GUTO_FLOW] pending invite", true)
            console.log("[GUTO_FLOW] after language target", "invite_claim")
            setPendingInviteToken(pendingToken)
            setActiveLanguageGlow(lang)
            setRotatingLanguage(true)
            schedule(() => {
              setStage("invite_claim")
              setRotatingLanguage(false)
              setActiveLanguageGlow(null)
            }, 560)
            return
          }
        }
        
        console.log("[GUTO_FLOW] pending invite", false)
        const target = `/login?lang=${lang}`
        console.log("[GUTO_FLOW] after language target", target)
        router.push(target)
        return
      }

      // If user is already logged in (re-selecting language or returning)
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
    [effectRegistry, persistMemory, persistProfile, rotatingLanguage, router, schedule, user]
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
    async (calibration: Parameters<typeof saveGutoMemory>[0]) => {
      setStage("pact")
      persistProfile({ calibrationComplete: true, onboardingComplete: false })
      await persistMemory(calibration)
      trackBehaviorEvent("calibration_completed", { ...calibration })
      
      // Proactively trigger diet generation in background so it's ready when they open the tab
      try {
        const { generateDietPlan } = await import("@/lib/api/guto")
        await generateDietPlan(gutoUserId, selectedLanguage)
      } catch (err) {
        console.warn("[GUTO] Proactive diet generation failed:", err)
      }
    },
    [gutoUserId, persistMemory, selectedLanguage, trackBehaviorEvent]
  )

  const handleFoodDoubt = useCallback((food: DietFood, meal: DietMeal) => {
    setPendingFoodQuestion({ food, meal })
    setActiveTab("guto")
  }, [])

  const handleSeal = useCallback(
    async (confirmedName = false) => {
      gutoAudio.playGutoFeedback("tap")
      const normalizedName = normalizeGutoName(draftName)
      if (!normalizedName || isValidatingName) return

      setIsValidatingName(true)
      const validation = await resolveGutoNameValidation(normalizedName, gutoUserId)
      setIsValidatingName(false)

      if (validation.status === "invalid") {
        gutoAudio.playGutoFeedback("error")
        setNameGate({
          status: "invalid",
          normalized: validation.normalized,
          message: validation.message,
          target: "onboarding",
        })
        return
      }

      if (validation.status === "confirm" && !confirmedName) {
        gutoAudio.playGutoFeedback("error")
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
    gutoAudio.playGutoFeedback("tap")
    setSettingsNameDraft(committedName || formatGutoName(userName || ""))
    setSettingsSexDraft(memory?.biologicalSex === "male" || memory?.biologicalSex === "female" ? memory.biologicalSex : null)
    setSettingsAgeDraft(memory?.userAge ? String(memory.userAge) : "")
    setSettingsGoalDraft(memory?.trainingGoal ?? null)
    setSettingsLocationDraft(memory?.preferredTrainingLocation ?? null)
    setSettingsPathologyDraft(memory?.trainingPathology && memory.trainingPathology !== "sem dor" ? memory.trainingPathology : "")
    setSettingsMode("menu")
    setNameGate(null)
    setStage("settings")
  }, [committedName, memory, userName])

  const handleSettingsBack = useCallback(() => {
    gutoAudio.playGutoFeedback("tap")
    setActiveLanguageGlow(null)

    if (settingsMode !== "menu") {
      setSettingsMode("menu")
      return
    }

    setStage("system")
  }, [settingsMode])

  const handleSettingsLanguageSelect = useCallback(
    (lang: SupportedLanguage) => {
      gutoAudio.playGutoFeedback("select")
      effectRegistry.emit("language_select", { meta: { language: lang, source: "settings" } })
      setSelectedLanguage(lang)
      writeConfirmedLanguageStorage(lang)
      if (process.env.NODE_ENV === "development") {
        console.info("[GUTO_LANGUAGE] settings changed", lang)
      }
      setWorkoutPlan((current) => localizeGutoWorkoutPlan(current, lang))
      setActiveLanguageGlow(null)
      setSettingsMode("menu")
      setStage("system")
      persistProfile({ language: lang, onboardingComplete: true })
      void persistMemory({ language: lang }).then((updated) => {
        if (updated?.lastWorkoutPlan?.exercises?.length) {
          setWorkoutPlan(localizeGutoWorkoutPlan(updated.lastWorkoutPlan, lang))
        }
        if (process.env.NODE_ENV === "development") {
          console.info("[GUTO_BACKEND_PROFILE] language synced", lang)
        }
      })
    },
    [effectRegistry, persistMemory, persistProfile]
  )

  const saveSettingsName = useCallback(
    async (confirmedName = false) => {
      const normalizedName = normalizeGutoName(settingsNameDraft)
      if (!normalizedName || isValidatingName) return

      setIsValidatingName(true)
      const validation = await resolveGutoNameValidation(normalizedName, gutoUserId)
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

  const saveProfileSettings = useCallback(() => {
    const ageNum = parseInt(settingsAgeDraft, 10)
    const isAgeValid = !isNaN(ageNum) && ageNum >= 14 && ageNum <= 99
    if (!settingsSexDraft || !isAgeValid) return
    persistMemory({ biologicalSex: settingsSexDraft, userAge: ageNum })
    setMemory((prev) => prev ? { ...prev, biologicalSex: settingsSexDraft, userAge: ageNum } : prev)
    setSettingsMode("menu")
    setStage("system")
  }, [persistMemory, settingsAgeDraft, settingsSexDraft])

  const saveGoalSettings = useCallback(() => {
    if (!settingsGoalDraft) return
    const goal = settingsGoalDraft as "consistency" | "fat_loss" | "muscle_gain" | "conditioning" | "mobility_health"
    persistMemory({ trainingGoal: goal })
    setMemory((prev) => prev ? { ...prev, trainingGoal: goal } : prev)
    setSettingsMode("menu")
    setStage("system")
  }, [persistMemory, settingsGoalDraft])

  const saveLocationSettings = useCallback(() => {
    if (!settingsLocationDraft) return
    const loc = settingsLocationDraft as "gym" | "home" | "park" | "mixed"
    persistMemory({ preferredTrainingLocation: loc })
    setMemory((prev) => prev ? { ...prev, preferredTrainingLocation: loc } : prev)
    setSettingsMode("menu")
    setStage("system")
  }, [persistMemory, settingsLocationDraft])

  const savePathologySettings = useCallback(() => {
    const val = settingsPathologyDraft.trim() || "sem dor"
    persistMemory({ trainingPathology: val })
    setMemory((prev) => prev ? { ...prev, trainingPathology: val } : prev)
    setSettingsMode("menu")
    setStage("system")
  }, [persistMemory, settingsPathologyDraft])

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
    if (!user?.userId) return
    let cancelled = false

    void getGutoMemory(gutoUserId)
      .then((memory) => {
        if (cancelled) return
        setMemory(memory)
        if (memory?.name && memory.name.toLocaleLowerCase("pt-BR") !== "operador") {
          const memoryName = formatGutoName(memory.name)
          setDraftName((prev) => prev || memoryName)
          setCommittedName((prev) => prev || memoryName)
        }
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
  }, [gutoUserId, user?.userId])


  useEffect(() => {
    if (!memory || workoutPlan?.exercises?.length) return
    const localPlan = createLocalWorkoutPlan(memory, selectedLanguage)
    if (!localPlan) return
    console.log("[GUTO_WORKOUT] complete calibration -> local workout fallback")
    setWorkoutPlan(localPlan)
    void persistMemory({ lastWorkoutPlan: localPlan } as Parameters<typeof saveGutoMemory>[0]).catch(() => {})
  }, [memory, persistMemory, selectedLanguage, workoutPlan])

  const stopHold = useCallback(() => {
    if (stage !== "pact" || pactProgress >= 100 || pactCompleteRef.current) return
    clearPactInterval()
    gutoAudio.stopGutoSound('hold_charge')
    setIsHoldingPact(false)
    setPactProgress(0)
  }, [clearPactInterval, pactProgress, stage])

  // ── Invite claim flow ──────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "invite_claim" || !pendingInviteToken) return
    let cancelled = false
    setInviteLoading(true)
    setInviteClaimData(null)
    setInviteError(null)
    getInvite(pendingInviteToken)
      .then((data) => {
        if (cancelled) return
        setInviteClaimData(data)
        setInviteLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        void err
        clearPendingInviteStorage()
        setPendingInviteToken(null)
        setInviteError(inviteClaimCopy[selectedLanguage].invalid)
        setInviteLoading(false)
      })
    return () => { cancelled = true }
  }, [stage, pendingInviteToken, selectedLanguage])

  const handleInviteClaim = useCallback(async () => {
    if (!pendingInviteToken || inviteSubmitting) return
    const ic = inviteClaimCopy[selectedLanguage]
    if (invitePassword !== inviteConfirmPassword) {
      gutoAudio.playGutoFeedback("error")
      setInviteError(ic.mismatch)
      return
    }
    if (invitePassword.length < 6) {
      gutoAudio.playGutoFeedback("error")
      setInviteError(ic.tooShort)
      return
    }
    setInviteSubmitting(true)
    setInviteError(null)
    try {
      const res = await claimInvite(pendingInviteToken, invitePassword)
      setInviteSuccess(true)
      clearPendingInviteStorage()
      setPendingInviteToken(null)
      schedule(() => {
        console.log("[GUTO_INVITE] claim success -> resolve onboarding stage")
        login({ ...res, role: res.role ?? "student" })
        const inviteResolvedName = firstRealGutoName(res.name, inviteClaimData?.name)
        setGutoUserId(res.userId)
        writeOnboardingLanguageStorage(selectedLanguage)
        if (inviteResolvedName) {
          setDraftName(inviteResolvedName)
          setCommittedName(inviteResolvedName)
          writeStorageItem(`${STORAGE_KEY}-${res.userId}`, JSON.stringify({
            language: selectedLanguage,
            userName: inviteResolvedName,
            onboardingComplete: false,
          }))
          void saveGutoMemory({ userId: res.userId, name: inviteResolvedName, language: selectedLanguage }).catch(() => {})
        }
        console.log("[GUTO_ONBOARDING] resolved stage naming")
        setStage("naming")
        router.replace("/")
      }, 2000)
    } catch (err: unknown) {
      void err
      gutoAudio.playGutoFeedback("error")
      setInviteError(ic.activationFailed)
      setInviteSubmitting(false)
    }
  }, [pendingInviteToken, inviteSubmitting, selectedLanguage, invitePassword, inviteConfirmPassword, inviteClaimData, login, router, schedule])

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
    gutoAudio.playGutoFeedback("success")
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
    gutoAudio.playGutoFeedback("success")
    setMemory(updated)
    setEvolution(resolveEvolutionStage(updated.totalXp || 0))
    trackBehaviorEvent("mission_completed", { missionType: "adapted" })
    setActiveTab("caminho")
  }, [gutoUserId, selectedLanguage, trackBehaviorEvent])

  const resolvedProfile = resolveGutoProfile({
    user,
    memory,
    fallbackName: firstRealGutoName(committedName, userName),
  })
  const userLabel = resolvedProfile.displayName || firstRealGutoName(committedName, userName) || ""
  const workoutMissingFields = getWorkoutMissingFields(memory)
  const localizedWorkoutPlan = useMemo(
    () => localizeGutoWorkoutPlan(workoutPlan, selectedLanguage),
    [selectedLanguage, workoutPlan]
  )
  const locale = stageCopy[selectedLanguage]
  const isGutoDepleted = (memory?.totalXp ?? 100) === 0
  const canSaveSettingsName =
    Boolean(formatGutoName(settingsNameDraft)) &&
    formatGutoName(settingsNameDraft) !== userLabel &&
    !isValidatingName

  const chatContent = useMemo(() => (
    <ChatTab
      key={`chat-${gutoUserId}-${selectedLanguage}`}
      userId={gutoUserId}
      userName={userLabel}
      language={selectedLanguage}
      evolution={evolution}
      memory={memory}
      pendingExerciseQuestion={pendingExerciseQuestion}
      onExerciseQuestionHandled={() => setPendingExerciseQuestion(null)}
      pendingFoodQuestion={pendingFoodQuestion}
      onFoodQuestionHandled={() => setPendingFoodQuestion(null)}
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
  ), [evolution, gutoUserId, isGutoDepleted, memory, pendingExerciseQuestion, pendingFoodQuestion, persistMemory, selectedLanguage, userLabel])

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "guto":
        return null
      case "caminho":
        return (
          <PathTab
            userName={userLabel}
            language={selectedLanguage}
            memory={memory}
            workoutPlan={localizedWorkoutPlan}
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
            workoutFocus={localizedWorkoutPlan?.focusKey || "full_body"}
            onAskExercise={handleExerciseQuestion}
            workoutPlan={localizedWorkoutPlan}
            trainedToday={Boolean(memory?.trainedToday)}
            adaptedMissionToday={Boolean(memory?.adaptedMissionToday)}
            onMissionComplete={handleMissionComplete}
            onAdaptedMissionComplete={handleAdaptedMissionComplete}
            onValidateWorkout={() => setShowValidationFlow(true)}
            missingProfileFields={workoutMissingFields}
          />
        )
      case "arena":
        return (
          <ArenaTab
            userId={gutoUserId}
            language={selectedLanguage}
            translations={translations[selectedLanguage]}
            refreshKey={arenaRefreshKey}
            currentUserName={userLabel}
          />
        )
      case "dieta":
        return (
          <DietTab
            userId={gutoUserId}
            language={selectedLanguage}
            onFoodDoubt={handleFoodDoubt}
            memory={memory}
          />
        )
      default:
        return null
    }
  }, [activeTab, gutoUserId, handleAdaptedMissionComplete, handleExerciseQuestion, handleFoodDoubt, handleMissionComplete, localizedWorkoutPlan, memory, selectedLanguage, userLabel, workoutMissingFields])

  if (authLoading || !isHydrated || (user && user.role !== "student")) {
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
            data-intro-playback-state={introPlaybackState}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.36 }}
          >
            <video
              ref={portalVideoRef}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ visibility: introNeedsActivation ? "hidden" : "visible" }}
              playsInline
              webkit-playsinline="true"
              preload="auto"
              muted
              disablePictureInPicture
              controls={false}
              onLoadedMetadata={restartPortalVideo}
              onCanPlay={restartPortalVideo}
              onEnded={handleIntroVideoEnded}
            >
              <source src="/assets/guto/abertura-guto.mp4" type="video/mp4" />
            </video>

            {introNeedsActivation && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-white/8 backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-3 relative z-50 pointer-events-auto">
                  <button
                    type="button"
                    id="guto-start-button"
                    onClick={startIntroVideo}
                    className="guto-intro-sound-button inline-flex items-center gap-3 rounded-full px-5 py-3 text-[11px] font-black uppercase tracking-normal shadow-md"
                    aria-label="Iniciar GUTO"
                  >
                    <Volume2 className="h-5 w-5" />
                    INICIAR GUTO
                  </button>
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

        {stage === "invite_claim" && (
          <motion.section
            key="invite_claim"
            className="guto-main-screen absolute inset-0 z-30 flex flex-col items-center justify-center px-8"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.42 }}
          >
            <div className="flex w-full max-w-sm flex-col items-center">
              <div className="mb-8 flex flex-col items-center text-center">
                <Image
                  src="/assets/guto/logo_guto.png"
                  alt="GUTO"
                  width={180}
                  height={60}
                  priority
                  className="mb-5 h-auto w-[180px] max-w-[78%] object-contain drop-shadow-sm"
                />
                {inviteLoading && (
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--guto-cyan)]" />
                )}
                {!inviteLoading && inviteClaimData && !inviteSuccess && (
                  <>
                    <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[rgba(13,35,65,0.45)]">
                      {inviteClaimCopy[selectedLanguage].title}
                    </p>
                    <h1 className="font-mono text-sm font-black uppercase tracking-[0.1em] text-[var(--guto-navy)]">
                      {inviteClaimCopy[selectedLanguage].greetingPrefix}{" "}
                      <span className="text-[var(--guto-cyan)]">{inviteClaimData.name}</span>
                    </h1>
                    <p className="mt-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.4)]">
                      {inviteClaimCopy[selectedLanguage].invited}
                    </p>
                  </>
                )}
                {!inviteLoading && !inviteClaimData && inviteError && (
                  <p className="font-mono text-xs font-black uppercase text-red-500">{inviteError}</p>
                )}
              </div>

              {!inviteLoading && inviteSuccess && (
                <div className="flex flex-col items-center space-y-4 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <p className="font-mono text-[11px] font-black uppercase tracking-widest text-[var(--guto-navy)]">
                    {inviteClaimCopy[selectedLanguage].activated}
                  </p>
                  <p className="font-mono text-[9px] font-black uppercase tracking-widest text-[rgba(13,35,65,0.4)]">
                    {inviteClaimCopy[selectedLanguage].starting}
                  </p>
                </div>
              )}

              {!inviteLoading && !inviteSuccess && inviteClaimData && (
                <form
                  onSubmit={(e) => { e.preventDefault(); void handleInviteClaim() }}
                  className="w-full space-y-4"
                >
                  <div className="guto-deboss rounded-2xl p-4">
                    <label className="mb-1.5 block font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
                      {inviteClaimCopy[selectedLanguage].createPass}
                    </label>
                    <input
                      type="password"
                      value={invitePassword}
                      onChange={(e) => { setInvitePassword(e.target.value); setInviteError(null) }}
                      className="w-full border-none bg-transparent font-mono text-sm font-black text-[var(--guto-navy)] outline-none placeholder:text-[rgba(13,35,65,0.2)]"
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="guto-deboss rounded-2xl p-4">
                    <label className="mb-1.5 block font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
                      {inviteClaimCopy[selectedLanguage].confirmPass}
                    </label>
                    <input
                      type="password"
                      value={inviteConfirmPassword}
                      onChange={(e) => { setInviteConfirmPassword(e.target.value); setInviteError(null) }}
                      className="w-full border-none bg-transparent font-mono text-sm font-black text-[var(--guto-navy)] outline-none placeholder:text-[rgba(13,35,65,0.2)]"
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  {inviteError && (
                    <p className="text-center font-mono text-[10px] font-black uppercase text-red-500">{inviteError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={inviteSubmitting}
                    className="mt-2 flex h-14 w-full items-center justify-center rounded-full bg-[var(--guto-cyan)] font-mono text-xs font-black uppercase tracking-[0.2em] text-[var(--guto-navy)] shadow-[0_4px_20px_rgba(82,231,255,0.3)] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {inviteSubmitting
                      ? <Loader2 className="h-5 w-5 animate-spin" />
                      : inviteClaimCopy[selectedLanguage].cta}
                  </button>
                </form>
              )}

              {!inviteLoading && !inviteClaimData && !inviteSuccess && (
                <button
                  type="button"
                  onClick={() => router.push(`/login?lang=${selectedLanguage}`)}
                  className="mt-8 font-mono text-[10px] font-black uppercase tracking-widest text-[var(--guto-cyan)] underline"
                >
                  {inviteClaimCopy[selectedLanguage].back}
                </button>
              )}
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
                onPointerDown={() => {
                  if (isHoldingPact || pactCompleteRef.current) return
                  gutoAudio.playGutoFeedback("hold_charge")
                  setIsHoldingPact(true)
                }}
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
              <div
                className={activeTab === "guto" ? "min-h-0 flex-1" : "pointer-events-none absolute inset-0 opacity-0"}
                aria-hidden={activeTab !== "guto"}
              >
                {chatContent}
              </div>
              {activeTab !== "guto" && (
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
              <div className="guto-language-grid grid grid-cols-2 gap-3 pt-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { gutoAudio.playGutoFeedback("tap"); setSettingsMode("language"); }}
                  aria-label={locale.settingsLanguage}
                  className="guto-language-card guto-settings-choice-card group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] p-4"
                >
                  <Languages className="guto-settings-choice-icon" strokeWidth={2.2} />
                  <span className="guto-settings-choice-label">{locale.settingsLanguage}</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { gutoAudio.playGutoFeedback("tap"); setSettingsMode("name"); }}
                  aria-label={locale.settingsName}
                  className="guto-language-card guto-settings-choice-card group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] p-4"
                >
                  <UserRound className="guto-settings-choice-icon" strokeWidth={2.2} />
                  <span className="guto-settings-choice-label">{locale.settingsName}</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { gutoAudio.playGutoFeedback("tap"); setSettingsMode("profile"); }}
                  aria-label={locale.settingsProfile}
                  className="guto-language-card guto-settings-choice-card group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] p-4"
                >
                  <Activity className="guto-settings-choice-icon" strokeWidth={2.2} />
                  <span className="guto-settings-choice-label">{locale.settingsProfile}</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { gutoAudio.playGutoFeedback("tap"); setSettingsMode("goal"); }}
                  aria-label={locale.settingsGoal}
                  className="guto-language-card guto-settings-choice-card group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] p-4"
                >
                  <Dumbbell className="guto-settings-choice-icon" strokeWidth={2.2} />
                  <span className="guto-settings-choice-label">{locale.settingsGoal}</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { gutoAudio.playGutoFeedback("tap"); setSettingsMode("location"); }}
                  aria-label={locale.settingsLocation}
                  className="guto-language-card guto-settings-choice-card group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] p-4"
                >
                  <MapPin className="guto-settings-choice-icon" strokeWidth={2.2} />
                  <span className="guto-settings-choice-label">{locale.settingsLocation}</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { gutoAudio.playGutoFeedback("tap"); setSettingsMode("pathology"); }}
                  aria-label={locale.settingsPathology}
                  className="guto-language-card guto-settings-choice-card group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] p-4"
                >
                  <Zap className="guto-settings-choice-icon" strokeWidth={2.2} />
                  <span className="guto-settings-choice-label">{locale.settingsPathology}</span>
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

            {settingsMode === "profile" && (() => {
              const t = translations[selectedLanguage].calibration
              const ageNum = parseInt(settingsAgeDraft, 10)
              const isAgeValid = !isNaN(ageNum) && ageNum >= 14 && ageNum <= 99
              const canSave = Boolean(settingsSexDraft && isAgeValid)
              return (
                <div className="flex flex-1 flex-col gap-4 pt-2">
                  <div className="guto-slot rounded-[1.5rem] px-5 py-4">
                    <p className="mb-3 font-mono text-[8px] font-black uppercase tracking-[0.2em] text-[rgba(13,35,65,0.42)]">
                      {t.sexOptions.male} / {t.sexOptions.female}
                    </p>
                    <div className="flex gap-2">
                      {(["male", "female"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSettingsSexDraft(s)}
                          className={`flex-1 rounded-full border py-2 font-mono text-[10px] font-black uppercase tracking-[0.12em] transition-all ${
                            settingsSexDraft === s
                              ? "border-[rgba(82,231,255,0.75)] bg-[rgba(82,231,255,0.18)] text-[var(--guto-cyan)]"
                              : "border-[rgba(82,231,255,0.28)] bg-white/50 text-[rgba(13,35,65,0.65)]"
                          }`}
                        >
                          {s === "male" ? t.sexOptions.male : t.sexOptions.female}
                        </button>
                      ))}
                    </div>
                    <p className="mt-4 mb-2 font-mono text-[8px] font-black uppercase tracking-[0.2em] text-[rgba(13,35,65,0.42)]">
                      {t.ageLabel}
                    </p>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={14}
                      max={99}
                      value={settingsAgeDraft}
                      onChange={(e) => setSettingsAgeDraft(e.target.value)}
                      placeholder="--"
                      autoComplete="off"
                      className="w-full rounded-full border border-[rgba(82,231,255,0.45)] bg-white px-4 py-2.5 text-center font-mono text-[14px] font-black text-[var(--guto-navy)] outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!canSave}
                    onClick={saveProfileSettings}
                    className={`h-12 w-full rounded-full font-mono text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                      canSave
                        ? "bg-[var(--guto-cyan)] text-[var(--guto-navy)] shadow-[0_4px_16px_rgba(82,231,255,0.3)]"
                        : "bg-white/40 text-[rgba(13,35,65,0.3)] border border-[rgba(13,35,65,0.08)]"
                    }`}
                  >
                    {locale.settingsSave}
                  </button>
                </div>
              )
            })()}

            {settingsMode === "goal" && (() => {
              const t = translations[selectedLanguage].calibration
              type GoalKey = "consistency" | "fat_loss" | "muscle_gain" | "conditioning" | "mobility_health"
              return (
                <div className="flex flex-1 flex-col gap-4 pt-2">
                  <div className="guto-slot rounded-[1.5rem] px-5 py-4">
                    <div className="flex flex-wrap justify-center gap-2">
                      {(Object.entries(t.objectiveChips) as [GoalKey, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSettingsGoalDraft(key)}
                          className={`rounded-full border px-4 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.1em] transition-all ${
                            settingsGoalDraft === key
                              ? "border-[rgba(82,231,255,0.75)] bg-[rgba(82,231,255,0.18)] text-[var(--guto-cyan)]"
                              : "border-[rgba(82,231,255,0.28)] bg-white/50 text-[rgba(13,35,65,0.65)]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!settingsGoalDraft}
                    onClick={saveGoalSettings}
                    className={`h-12 w-full rounded-full font-mono text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                      settingsGoalDraft
                        ? "bg-[var(--guto-cyan)] text-[var(--guto-navy)] shadow-[0_4px_16px_rgba(82,231,255,0.3)]"
                        : "bg-white/40 text-[rgba(13,35,65,0.3)] border border-[rgba(13,35,65,0.08)]"
                    }`}
                  >
                    {locale.settingsSave}
                  </button>
                </div>
              )
            })()}

            {settingsMode === "location" && (() => {
              const t = translations[selectedLanguage].calibration
              type LocationKey = "gym" | "home" | "park" | "mixed"
              return (
                <div className="flex flex-1 flex-col gap-4 pt-2">
                  <div className="guto-slot rounded-[1.5rem] px-5 py-4">
                    <div className="flex flex-wrap justify-center gap-2">
                      {(Object.entries(t.locationOptions) as [LocationKey, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSettingsLocationDraft(key)}
                          className={`rounded-full border px-4 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.1em] transition-all ${
                            settingsLocationDraft === key
                              ? "border-[rgba(82,231,255,0.75)] bg-[rgba(82,231,255,0.18)] text-[var(--guto-cyan)]"
                              : "border-[rgba(82,231,255,0.28)] bg-white/50 text-[rgba(13,35,65,0.65)]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!settingsLocationDraft}
                    onClick={saveLocationSettings}
                    className={`h-12 w-full rounded-full font-mono text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                      settingsLocationDraft
                        ? "bg-[var(--guto-cyan)] text-[var(--guto-navy)] shadow-[0_4px_16px_rgba(82,231,255,0.3)]"
                        : "bg-white/40 text-[rgba(13,35,65,0.3)] border border-[rgba(13,35,65,0.08)]"
                    }`}
                  >
                    {locale.settingsSave}
                  </button>
                </div>
              )
            })()}

            {settingsMode === "pathology" && (
              <div className="flex flex-1 flex-col gap-4 pt-2">
                <div className="guto-slot rounded-[1.5rem] px-5 py-4">
                  <input
                    type="text"
                    value={settingsPathologyDraft}
                    onChange={(e) => setSettingsPathologyDraft(e.target.value)}
                    placeholder={translations[selectedLanguage].calibration.pathologyPlaceholder}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full rounded-full border border-[rgba(82,231,255,0.45)] bg-white px-4 py-2.5 font-mono text-[12px] text-[var(--guto-navy)] placeholder-[rgba(13,35,65,0.3)] outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={savePathologySettings}
                  className="h-12 w-full rounded-full bg-[var(--guto-cyan)] font-mono text-[11px] font-black uppercase tracking-[0.2em] text-[var(--guto-navy)] shadow-[0_4px_16px_rgba(82,231,255,0.3)]"
                >
                  {locale.settingsSave}
                </button>
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
            workoutFocus={localizedWorkoutPlan?.focusKey || "full_body"}
            workoutLabel={localizedWorkoutPlan?.focus || ""}
            onComplete={(validationHistory) => {
              // Optimistic: update validation history immediately
              setMemory((prev) => prev ? { ...prev, validationHistory } : prev)
              setShowValidationFlow(false)
              setActiveTab("caminho")
              // Refresh full memory so totalXp, trainedToday, streak sync everywhere
              getGutoMemory(gutoUserId).then((fresh) => {
                if (fresh) setMemory(fresh)
              }).catch(() => {})
              // Tell ArenaTab to refetch rankings
              setArenaRefreshKey((k) => k + 1)
            }}
            onClose={() => setShowValidationFlow(false)}
          />
        </div>
      )}
    </div>
  )
}
