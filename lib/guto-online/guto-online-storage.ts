/**
 * GUTO Online — Storage
 * --------------------------------------------------------------------------
 * Sessão persistida no localStorage. Estrutura versionada:
 *
 *   {
 *     __schemaVersion: 1,
 *     sessionId, workoutKey, state, eventLog, actionHistory,
 *     createdAt, updatedAt
 *   }
 *
 * Janelas de retomada:
 *   - 0–15 min:        retoma automático.
 *   - 15 min – 12h:    pede confirmação.
 *   - +12h:            descarta/arquiva (não retoma).
 *
 * Voice mode é guardado separadamente para sobreviver entre treinos.
 */

import type { GutoOnlineEvent } from "./guto-online-events"
import {
  CURRENT_SCHEMA_VERSION,
  AUTO_RESUME_WINDOW_MS,
  MAX_SESSION_AGE_MS,
  type GutoOnlineSessionState,
  type GutoVoiceMode,
} from "./guto-online-types"

const SESSION_PREFIX = "guto-online-session:v1:"
const VOICE_MODE_KEY = "guto-online-voice-enabled"

export type GutoResumeDecision =
  | { kind: "none" }
  | { kind: "auto"; payload: GutoPersistedSession }
  | { kind: "confirm"; payload: GutoPersistedSession; ageMs: number }
  | { kind: "expired"; ageMs: number }

export interface GutoPersistedSession {
  __schemaVersion: typeof CURRENT_SCHEMA_VERSION
  sessionId: string
  workoutKey: string
  state: GutoOnlineSessionState
  eventLog: GutoOnlineEvent[]
  actionHistory: GutoOnlineEvent[]
  createdAt: number
  updatedAt: number
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function buildStorageKey(workoutKey: string): string {
  return `${SESSION_PREFIX}${workoutKey}`
}

export function saveSession(payload: Omit<GutoPersistedSession, "__schemaVersion" | "createdAt" | "updatedAt"> & { createdAt?: number }): void {
  if (!isBrowser()) return
  try {
    const now = Date.now()
    const record: GutoPersistedSession = {
      __schemaVersion: CURRENT_SCHEMA_VERSION,
      sessionId: payload.sessionId,
      workoutKey: payload.workoutKey,
      state: payload.state,
      eventLog: payload.eventLog,
      actionHistory: payload.actionHistory,
      createdAt: payload.createdAt ?? now,
      updatedAt: now,
    }
    window.localStorage.setItem(buildStorageKey(payload.workoutKey), JSON.stringify(record))
  } catch {
    // localStorage cheio ou bloqueado — não quebra o treino.
  }
}

export function loadSession(workoutKey: string): GutoPersistedSession | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(buildStorageKey(workoutKey))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GutoPersistedSession>
    if (!parsed || parsed.__schemaVersion !== CURRENT_SCHEMA_VERSION) {
      // Schema diferente: descarta para não corromper o engine novo.
      clearSession(workoutKey)
      return null
    }
    return parsed as GutoPersistedSession
  } catch {
    return null
  }
}

export function clearSession(workoutKey: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(buildStorageKey(workoutKey))
  } catch {
    // silencioso.
  }
}

export function decideResume(workoutKey: string, now: number = Date.now()): GutoResumeDecision {
  const session = loadSession(workoutKey)
  if (!session) return { kind: "none" }

  // Já terminada? Não retoma.
  if (session.state.phase === "finished") {
    clearSession(workoutKey)
    return { kind: "none" }
  }

  const ageMs = now - session.updatedAt

  if (ageMs > MAX_SESSION_AGE_MS) {
    clearSession(workoutKey)
    return { kind: "expired", ageMs }
  }

  if (ageMs <= AUTO_RESUME_WINDOW_MS) {
    return { kind: "auto", payload: session }
  }

  return { kind: "confirm", payload: session, ageMs }
}

// ─── Voice mode ──────────────────────────────────────────────────────────────

export function loadVoiceMode(): GutoVoiceMode {
  if (!isBrowser()) return "enabled"
  try {
    const value = window.localStorage.getItem(VOICE_MODE_KEY)
    if (value === "disabled") return "disabled"
    return "enabled"
  } catch {
    return "enabled"
  }
}

export function saveVoiceMode(mode: GutoVoiceMode): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(VOICE_MODE_KEY, mode)
  } catch {
    // silencioso.
  }
}
