"use client"

/**
 * GUTO Online — Telemetry
 * --------------------------------------------------------------------------
 * Faz dois trabalhos:
 *   1. Mapeia GutoOnlineEvent → nome canônico (online_set_done, online_voice_failed…)
 *   2. Faz o envio com fallback localStorage (offline-safe)
 *
 * Não bloqueia: se a rede falhar, guarda o batch em localStorage e tenta
 * mandar de novo na próxima abertura. Nunca lança erro.
 */

import { API_URL } from "@/lib/api/client"
import type { GutoOnlineEvent } from "./guto-online-events"
import type { GutoOnlineSessionState, GutoOnlinePlatform } from "./guto-online-types"

const TELEMETRY_BUFFER_KEY = "guto-online-telemetry-buffer:v1"
const MAX_BUFFER_SIZE = 200
const FLUSH_INTERVAL_MS = 5_000

interface TelemetryEnvelope {
  eventId: string
  eventType: string
  rawType: string
  sessionId: string
  workoutKey: string
  appVersion: string
  platform: GutoOnlinePlatform
  source: string
  createdAt: number
  payload: Record<string, unknown>
}

const EVENT_TYPE_MAP: Partial<Record<GutoOnlineEvent["type"], string>> = {
  SESSION_STARTED: "online_session_started",
  SESSION_RESUMED: "online_session_resumed",
  VOICE_MODE_TOGGLED: "online_voice_mode_toggled",
  WARMUP_COMPLETED: "online_warmup_completed",
  SET_COMPLETED: "online_set_done",
  EXERCISE_COMPLETED: "online_exercise_done",
  REST_STARTED: "online_rest_started",
  REST_FINISHED: "online_rest_finished",
  REST_EXTENDED: "online_rest_extended",
  REST_SKIPPED: "online_rest_skipped",
  QUICK_TALK_OPENED: "online_quick_talk_opened",
  QUICK_TALK_SUBMITTED: "online_quick_talk_submitted",
  QUICK_TALK_RESPONDED: "online_quick_talk_responded",
  QUICK_TALK_CLOSED: "online_quick_talk_closed",
  OFF_TOPIC_REDIRECTED: "online_off_topic_redirected",
  PAIN_REPORTED: "online_pain_reported",
  SWAP_REQUESTED: "online_swap_requested",
  FATIGUE_REPORTED: "online_fatigue_reported",
  VOICE_FAILED_NOISY: "online_voice_failed",
  AI_TIMEOUT: "online_ai_timeout",
  UNDO: "online_undo_used",
  SESSION_FINISHED: "online_session_finished",
  // PAUSED / RESUMED / TICK / GUTO_SAID não vão para telemetria — são internos.
}

function detectPlatform(): GutoOnlinePlatform {
  if (typeof navigator === "undefined") return "web"
  const ua = navigator.userAgent || ""
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios"
  if (/Android/i.test(ua)) return "android"
  return "web"
}

function getAppVersion(): string {
  if (typeof process !== "undefined") {
    return process.env.NEXT_PUBLIC_APP_VERSION || "dev"
  }
  return "dev"
}

function isBrowser() {
  return typeof window !== "undefined"
}

function loadBuffer(): TelemetryEnvelope[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(TELEMETRY_BUFFER_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TelemetryEnvelope[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveBuffer(buffer: TelemetryEnvelope[]) {
  if (!isBrowser()) return
  try {
    const truncated = buffer.slice(-MAX_BUFFER_SIZE)
    window.localStorage.setItem(TELEMETRY_BUFFER_KEY, JSON.stringify(truncated))
  } catch {
    // silencioso.
  }
}

function authToken(): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem("guto-auth-token")
  } catch {
    return null
  }
}

async function trySend(batch: TelemetryEnvelope[]): Promise<boolean> {
  if (!isBrowser() || !API_URL || !batch.length) return false
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const token = authToken()
    const response = await fetch(`${API_URL}/telemetry/online`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ events: batch }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}

class GutoOnlineTelemetry {
  private buffer: TelemetryEnvelope[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private platform: GutoOnlinePlatform = detectPlatform()
  private appVersion: string = getAppVersion()

  start() {
    if (!isBrowser() || this.timer) return
    this.buffer = loadBuffer()
    this.timer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS)
    // Tenta drenar o que ficou salvo de sessões anteriores.
    void this.flush()
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  track(event: GutoOnlineEvent, state: GutoOnlineSessionState) {
    const mapped = EVENT_TYPE_MAP[event.type]
    if (!mapped) return

    const payload: Record<string, unknown> = {}
    // Snapshot mínimo do contexto, sem texto livre nem PII.
    payload.phase = state.phase
    payload.exerciseIndex = state.exerciseIndex
    payload.currentSet = state.currentSet
    payload.voiceMode = state.voiceMode

    if ("seconds" in event && typeof event.seconds === "number") {
      payload.seconds = event.seconds
    }
    if ("intent" in event) {
      payload.intent = event.intent
    }
    if ("inputMode" in event) {
      payload.inputMode = event.inputMode
    }

    const envelope: TelemetryEnvelope = {
      eventId: event.eventId,
      eventType: mapped,
      rawType: event.type,
      sessionId: state.sessionId,
      workoutKey: state.workoutKey,
      appVersion: this.appVersion,
      platform: this.platform,
      source: event.source,
      createdAt: event.at,
      payload,
    }

    this.buffer.push(envelope)
    if (this.buffer.length > MAX_BUFFER_SIZE) {
      this.buffer = this.buffer.slice(-MAX_BUFFER_SIZE)
    }
    saveBuffer(this.buffer)
  }

  async flush() {
    if (!this.buffer.length) return
    const batch = [...this.buffer]
    const ok = await trySend(batch)
    if (ok) {
      // Limpa o que conseguimos enviar.
      this.buffer = this.buffer.slice(batch.length)
      saveBuffer(this.buffer)
    }
  }
}

export const gutoOnlineTelemetry = new GutoOnlineTelemetry()
