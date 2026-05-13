/**
 * GUTO Online — Tipos e State Machine
 * --------------------------------------------------------------------------
 * Esses tipos são a base do engine separado. Eles não dependem de React, de
 * voz, de storage ou de UI. Tudo o que o GUTO Online faz é traduzido em um
 * estado puro, e esse estado é o que governa tela, voz, notificação, lock
 * screen e telemetria.
 *
 * Decisão central:
 *   - O usuário NÃO escolhe um modo (texto x voz) em uma tela separada.
 *   - Um único toggle ("GUTO fala" / "GUTO em texto") liga ou desliga a voz.
 *   - O estado do treino corre normalmente em qualquer um dos dois modos.
 *
 * Decisões de máquina:
 *   - Existe sempre um exerciseIndex e um currentSet.
 *   - O descanso é controlado por um instante absoluto (restEndsAt).
 *   - Só existe UM dispatch por vez (dispatchLock no engine).
 *   - Cada evento traz eventId; dedupe semântico evita contar duas vezes.
 */

import type { GutoWorkoutExercise, GutoWorkoutPlan } from "@/lib/api/guto"

// ─── Fases do GUTO Online ────────────────────────────────────────────────────

export type GutoOnlinePhase =
  | "briefing"                // Recém aberto. GUTO explica o plano.
  | "warmup"                  // Aquecimento. Botão principal: Aquecimento feito.
  | "executing_set"           // Em série. Botão principal: Série feita / Exercício feito.
  | "resting"                 // Em descanso. Cronômetro grande + +15s / Pular.
  | "between_exercises"       // Transição curta entre exercícios.
  | "quick_talk"              // Quick Talk Mode aberto. Treino pausado.
  | "thinking"                // GUTO esperando resposta do backend.
  | "paused"                  // Sessão pausada explicitamente.
  | "pain_check"              // GUTO confirmando dor antes de seguir.
  | "substitution"            // Trocando equipamento/exercício.
  | "fatigue_adjustment"      // Ajuste de carga por fadiga.
  | "finished"                // Treino terminado. Esperando validação.

// ─── Modo de voz e modos de input ────────────────────────────────────────────

export type GutoVoiceMode = "enabled" | "disabled"

export type GutoOnlineInputMode =
  | "button"                  // Toque na tela.
  | "voice_push_to_talk"      // Segurando o botão de fala no Quick Talk.
  | "text_quick_reply"        // Digitou rápido no Quick Talk.
  | "notification_action"     // Tocou em uma ação da notificação/lock screen.

// ─── Plataforma e fonte do evento ────────────────────────────────────────────

export type GutoOnlinePlatform = "web" | "ios" | "android"

export type GutoOnlineSource =
  | "button"
  | "voice"
  | "notification"
  | "system"
  | "ai"

// ─── Snapshot de uma série ──────────────────────────────────────────────────

export interface GutoOnlineCompletedSet {
  exerciseId: string
  exerciseName: string
  setNumber: number
  completedAt: number
  source: GutoOnlineSource
  eventId: string
}

// ─── Slot do checklist ──────────────────────────────────────────────────────

export type GutoChecklistItemKind = "warmup" | "set" | "exercise" | "validation"

export interface GutoChecklistItem {
  id: string
  kind: GutoChecklistItemKind
  label: string
  exerciseId?: string
  exerciseName?: string
  setNumber?: number
  totalSets?: number
  done: boolean
  doneAt?: number
}

// ─── Estado completo da sessão ──────────────────────────────────────────────

export interface GutoOnlineSessionState {
  // ─ Identidade ─────────────────────────────────────────────
  sessionId: string
  workoutKey: string
  planFocus: string
  planDateLabel: string
  language: string
  userName?: string
  // ─ Tempo ──────────────────────────────────────────────────
  startedAt: number
  updatedAt: number
  endedAt?: number
  // ─ Fase ───────────────────────────────────────────────────
  phase: GutoOnlinePhase
  previousPhase: GutoOnlinePhase | null  // p/ retomar de quick_talk/paused
  // ─ Voz ────────────────────────────────────────────────────
  voiceMode: GutoVoiceMode
  // ─ Posição ────────────────────────────────────────────────
  exerciseIndex: number
  currentSet: number
  warmupCompleted: boolean
  // ─ Descanso ───────────────────────────────────────────────
  restEndsAt: number | null
  restPlannedSeconds: number | null
  // ─ Quick Talk ─────────────────────────────────────────────
  quickTalk: GutoQuickTalkState | null
  // ─ Última fala do GUTO + última ação visível ─────────────
  lastGutoLine: string
  lastAction: string
  // ─ Memória curta ──────────────────────────────────────────
  completedSets: GutoOnlineCompletedSet[]
  checklist: GutoChecklistItem[]
}

// ─── Quick Talk ──────────────────────────────────────────────────────────────

export type GutoQuickTalkIntent =
  | "swap_equipment"
  | "pain"
  | "fatigue"
  | "doubt_execution"
  | "off_topic"
  | "emotional"
  | "noisy_unclear"
  | "command_set_done"
  | "command_pause"
  | "command_resume"
  | "command_finish"
  | "unknown"

export interface GutoQuickTalkState {
  openedAt: number
  inputMode: GutoOnlineInputMode | null
  lastUserText?: string
  lastGutoText?: string
  intent?: GutoQuickTalkIntent
  // Indica se a próxima ação será "Entendi, continuar"
  canResume: boolean
}

// ─── Plan helpers ────────────────────────────────────────────────────────────

export interface GutoOnlinePlanLite {
  focus: string
  dateLabel: string
  scheduledFor: string
  language: string
  exercises: GutoWorkoutExercise[]
}

// ─── Constantes ──────────────────────────────────────────────────────────────

export const ACTION_HISTORY_MAX = 20
export const EVENT_LOG_MAX = 300
export const CURRENT_SCHEMA_VERSION = 1 as const

// 0–15min: retoma automático.
// 15min–12h: pede confirmação.
// +12h: descarta/arquiva.
export const AUTO_RESUME_WINDOW_MS = 15 * 60 * 1000
export const MAX_SESSION_AGE_MS = 12 * 60 * 60 * 1000

// Janela para deduplicação semântica entre voz e botão.
export const SEMANTIC_DEDUPE_WINDOW_MS = 800

// ─── Helpers de plano ────────────────────────────────────────────────────────

export function makeWorkoutKey(plan: GutoWorkoutPlan): string {
  return `${plan.focus}:${plan.scheduledFor}`
}

export function isLastSetOfExercise(
  state: Pick<GutoOnlineSessionState, "currentSet">,
  exercise: GutoWorkoutExercise | undefined,
): boolean {
  if (!exercise) return false
  const total = exercise.sets || 1
  return state.currentSet >= total
}

export function isLastExerciseOfPlan(
  exerciseIndex: number,
  totalExercises: number,
): boolean {
  return exerciseIndex >= totalExercises - 1
}
