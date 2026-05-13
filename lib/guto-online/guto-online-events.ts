/**
 * GUTO Online — Eventos
 * --------------------------------------------------------------------------
 * Todo movimento dentro do GUTO Online vira um evento. Eventos têm sempre:
 *   - type: o que aconteceu
 *   - eventId: identificador único (para idempotência)
 *   - at: timestamp (Date.now())
 *   - source: de onde veio (button | voice | notification | system | ai)
 *
 * Esses eventos passam pela fila do engine e são reduzidos por uma função
 * pura. Isso permite undo, retomada, telemetria e debug sem acoplamento com
 * a UI.
 */

import type { GutoOnlineSource, GutoQuickTalkIntent } from "./guto-online-types"

// ─── Eventos disparáveis ─────────────────────────────────────────────────────

export type GutoOnlineEvent =
  | { type: "SESSION_STARTED"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "SESSION_RESUMED"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "VOICE_MODE_TOGGLED"; eventId: string; at: number; enabled: boolean; source: GutoOnlineSource }
  | { type: "WARMUP_COMPLETED"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "SET_COMPLETED"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "EXERCISE_COMPLETED"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "REST_STARTED"; eventId: string; at: number; restPlannedSeconds: number; restEndsAt: number; source: GutoOnlineSource }
  | { type: "REST_EXTENDED"; eventId: string; at: number; seconds: number; restEndsAt: number; source: GutoOnlineSource }
  | { type: "REST_SKIPPED"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "REST_FINISHED"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "QUICK_TALK_OPENED"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "QUICK_TALK_SUBMITTED"; eventId: string; at: number; text: string; inputMode: "voice" | "text"; source: GutoOnlineSource }
  | { type: "QUICK_TALK_RESPONDED"; eventId: string; at: number; text: string; intent: GutoQuickTalkIntent; source: GutoOnlineSource }
  | { type: "QUICK_TALK_CLOSED"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "PAIN_REPORTED"; eventId: string; at: number; message?: string; source: GutoOnlineSource }
  | { type: "SWAP_REQUESTED"; eventId: string; at: number; message?: string; source: GutoOnlineSource }
  | { type: "FATIGUE_REPORTED"; eventId: string; at: number; message?: string; source: GutoOnlineSource }
  | { type: "OFF_TOPIC_REDIRECTED"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "VOICE_FAILED_NOISY"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "AI_TIMEOUT"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "PAUSED"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "RESUMED"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "UNDO"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "SESSION_FINISHED"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "TICK"; eventId: string; at: number; source: GutoOnlineSource }
  | { type: "GUTO_SAID"; eventId: string; at: number; intentKey: string; text: string; source: GutoOnlineSource }

export type GutoOnlineEventType = GutoOnlineEvent["type"]

// ─── Conjunto de eventos passíveis de undo ───────────────────────────────────

export const UNDOABLE_EVENT_TYPES = new Set<GutoOnlineEventType>([
  "SET_COMPLETED",
  "EXERCISE_COMPLETED",
  "REST_SKIPPED",
  "WARMUP_COMPLETED",
  "PAUSED",
  "SESSION_FINISHED",
])

// ─── Eventos que NÃO podem ser desfeitos ─────────────────────────────────────

export const NON_UNDOABLE_EVENT_TYPES = new Set<GutoOnlineEventType>([
  "SESSION_STARTED",
  "SESSION_RESUMED",
  "REST_STARTED",
  "REST_FINISHED",
  "REST_EXTENDED",
  "PAIN_REPORTED",
  "SWAP_REQUESTED",
  "FATIGUE_REPORTED",
  "VOICE_MODE_TOGGLED",
  "QUICK_TALK_OPENED",
  "QUICK_TALK_SUBMITTED",
  "QUICK_TALK_RESPONDED",
  "QUICK_TALK_CLOSED",
  "OFF_TOPIC_REDIRECTED",
  "VOICE_FAILED_NOISY",
  "AI_TIMEOUT",
  "RESUMED",
  "TICK",
  "GUTO_SAID",
  "UNDO",
])

// ─── Eventos com dedupe semântico ────────────────────────────────────────────
// Se o mesmo tipo de evento chega em < SEMANTIC_DEDUPE_WINDOW_MS, é descartado.

export const SEMANTIC_DEDUPE_EVENT_TYPES = new Set<GutoOnlineEventType>([
  "SET_COMPLETED",
  "EXERCISE_COMPLETED",
  "REST_SKIPPED",
  "WARMUP_COMPLETED",
  "SESSION_FINISHED",
])

// ─── EventId helper ──────────────────────────────────────────────────────────

export function makeEventId(prefix: string = "ev"): string {
  const time = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${time}_${rand}`
}

// ─── Sessão Id ───────────────────────────────────────────────────────────────

export function makeSessionId(): string {
  return makeEventId("session")
}
