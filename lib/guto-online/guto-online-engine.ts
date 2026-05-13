/**
 * GUTO Online — Engine
 * --------------------------------------------------------------------------
 * Esse é o coração do GUTO Online. Aqui mora a regra. UI é cosmética; voz
 * é apresentação; storage é memória. O engine é quem decide o que pode
 * acontecer e quando.
 *
 * Princípios:
 *   1. Toda mudança de estado passa por dispatch(event).
 *   2. dispatch() é serializado por dispatchLock — nunca processa em
 *      paralelo, evita corrida entre voz e botão.
 *   3. Eventos com mesmo eventId são idempotentes — chegou duas vezes,
 *      conta uma.
 *   4. Eventos "semânticos" (Série feita, Exercício feito, etc.) caem em
 *      dedupe por janela de 800ms — voz e botão clicando juntos não
 *      duplicam.
 *   5. Action history (≤ 20) guarda apenas eventos passíveis de undo.
 *   6. Event log (≤ 300) é histórico cru para telemetria/debug.
 *   7. Reducer é puro: dado um state e um evento, devolve o próximo state.
 */

import type { GutoWorkoutPlan, GutoWorkoutExercise } from "@/lib/api/guto"
import type {
  GutoOnlineSessionState,
  GutoOnlinePhase,
  GutoOnlineCompletedSet,
  GutoChecklistItem,
} from "./guto-online-types"
import {
  ACTION_HISTORY_MAX,
  EVENT_LOG_MAX,
  SEMANTIC_DEDUPE_WINDOW_MS,
  makeWorkoutKey,
  isLastSetOfExercise,
  isLastExerciseOfPlan,
} from "./guto-online-types"
import {
  type GutoOnlineEvent,
  type GutoOnlineEventType,
  UNDOABLE_EVENT_TYPES,
  SEMANTIC_DEDUPE_EVENT_TYPES,
  makeEventId,
  makeSessionId,
} from "./guto-online-events"

// ─── Listener da máquina (UI escuta isso) ───────────────────────────────────

export interface GutoOnlineEngineSnapshot {
  state: GutoOnlineSessionState
  eventLog: GutoOnlineEvent[]
  actionHistory: GutoOnlineEvent[]
  lastDispatched?: GutoOnlineEvent
}

export type GutoOnlineEngineListener = (snapshot: GutoOnlineEngineSnapshot) => void

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseRestSeconds(rest?: string | null, restSeconds?: number) {
  if (typeof restSeconds === "number" && Number.isFinite(restSeconds) && restSeconds > 0) {
    return Math.round(restSeconds)
  }
  const match = String(rest || "").match(/\d+/)
  const parsed = match ? Number.parseInt(match[0], 10) : 60
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60
}

function buildInitialChecklist(exercises: GutoWorkoutExercise[]): GutoChecklistItem[] {
  const items: GutoChecklistItem[] = []
  items.push({ id: "warmup", kind: "warmup", label: "Aquecimento", done: false })

  for (const exercise of exercises) {
    const total = exercise.sets || 1
    for (let setNumber = 1; setNumber <= total; setNumber += 1) {
      items.push({
        id: `set:${exercise.id}:${setNumber}`,
        kind: "set",
        label: `${exercise.name} — série ${setNumber}`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        setNumber,
        totalSets: total,
        done: false,
      })
    }
  }

  items.push({ id: "validation", kind: "validation", label: "Validar treino", done: false })
  return items
}

function markChecklist(
  checklist: GutoChecklistItem[],
  predicate: (item: GutoChecklistItem) => boolean,
  doneAt: number,
): GutoChecklistItem[] {
  let changed = false
  const next = checklist.map((item) => {
    if (item.done || !predicate(item)) return item
    changed = true
    return { ...item, done: true, doneAt }
  })
  return changed ? next : checklist
}

function unmarkChecklist(
  checklist: GutoChecklistItem[],
  predicate: (item: GutoChecklistItem) => boolean,
): GutoChecklistItem[] {
  let changed = false
  const next = checklist.map((item) => {
    if (!item.done || !predicate(item)) return item
    changed = true
    return { ...item, done: false, doneAt: undefined }
  })
  return changed ? next : checklist
}

// ─── Estado inicial ──────────────────────────────────────────────────────────

export interface CreateInitialStateInput {
  plan: GutoWorkoutPlan
  language: string
  userName?: string
  voiceMode?: "enabled" | "disabled"
  sessionId?: string
  startedAt?: number
}

export function createInitialState(input: CreateInitialStateInput): GutoOnlineSessionState {
  const startedAt = input.startedAt ?? Date.now()
  const exercises = input.plan.exercises || []
  return {
    sessionId: input.sessionId ?? makeSessionId(),
    workoutKey: makeWorkoutKey(input.plan),
    planFocus: input.plan.focus,
    planDateLabel: input.plan.dateLabel,
    language: input.language,
    userName: input.userName,
    startedAt,
    updatedAt: startedAt,
    phase: "briefing",
    previousPhase: null,
    voiceMode: input.voiceMode ?? "enabled",
    exerciseIndex: 0,
    currentSet: 1,
    warmupCompleted: false,
    restEndsAt: null,
    restPlannedSeconds: null,
    quickTalk: null,
    lastGutoLine: "",
    lastAction: "",
    completedSets: [],
    checklist: buildInitialChecklist(exercises),
  }
}

// ─── Reducer puro ────────────────────────────────────────────────────────────

interface ReducerInput {
  state: GutoOnlineSessionState
  exercises: GutoWorkoutExercise[]
  event: GutoOnlineEvent
}

function reduce({ state, exercises, event }: ReducerInput): GutoOnlineSessionState {
  const at = event.at
  const totalExercises = exercises.length
  const currentExercise = exercises[state.exerciseIndex]

  switch (event.type) {
    case "SESSION_STARTED": {
      return {
        ...state,
        phase: state.warmupCompleted ? "executing_set" : "warmup",
        previousPhase: null,
        updatedAt: at,
      }
    }

    case "SESSION_RESUMED": {
      // Quem chama deve ter setado a fase desejada via fields no estado salvo;
      // aqui apenas confirmamos updatedAt.
      return { ...state, updatedAt: at }
    }

    case "VOICE_MODE_TOGGLED": {
      return {
        ...state,
        voiceMode: event.enabled ? "enabled" : "disabled",
        updatedAt: at,
      }
    }

    case "WARMUP_COMPLETED": {
      if (state.warmupCompleted) return state
      return {
        ...state,
        warmupCompleted: true,
        phase: totalExercises > 0 ? "executing_set" : "finished",
        lastAction: "Aquecimento finalizado",
        updatedAt: at,
        checklist: markChecklist(
          state.checklist,
          (item) => item.kind === "warmup",
          at,
        ),
      }
    }

    case "SET_COMPLETED": {
      if (!currentExercise) return state
      if (state.phase !== "executing_set") return state

      const total = currentExercise.sets || 1
      // Já era a última? Trata como EXERCISE_COMPLETED.
      if (state.currentSet > total) return state

      const completedSet: GutoOnlineCompletedSet = {
        exerciseId: currentExercise.id,
        exerciseName: currentExercise.name,
        setNumber: state.currentSet,
        completedAt: at,
        source: event.source,
        eventId: event.eventId,
      }

      const isLast = isLastSetOfExercise(state, currentExercise)
      if (isLast) {
        // Mantemos coerência: SET_COMPLETED na última série leva para
        // EXERCISE_COMPLETED automaticamente (o engine dispara o evento).
        // Aqui só marcamos a série; o handler EXERCISE_COMPLETED encerra
        // o exercício e move o índice.
        return {
          ...state,
          completedSets: [...state.completedSets, completedSet],
          lastAction: "Série registrada",
          updatedAt: at,
          checklist: markChecklist(
            state.checklist,
            (item) =>
              item.kind === "set" &&
              item.exerciseId === currentExercise.id &&
              item.setNumber === state.currentSet,
            at,
          ),
        }
      }

      const restPlanned = parseRestSeconds(currentExercise.rest, currentExercise.restSeconds)
      return {
        ...state,
        completedSets: [...state.completedSets, completedSet],
        currentSet: state.currentSet + 1,
        phase: "resting",
        restPlannedSeconds: restPlanned,
        restEndsAt: at + restPlanned * 1000,
        lastAction: "Série registrada",
        updatedAt: at,
        checklist: markChecklist(
          state.checklist,
          (item) =>
            item.kind === "set" &&
            item.exerciseId === currentExercise.id &&
            item.setNumber === state.currentSet,
          at,
        ),
      }
    }

    case "EXERCISE_COMPLETED": {
      if (!currentExercise) return state
      const isLast = isLastExerciseOfPlan(state.exerciseIndex, totalExercises)

      if (isLast) {
        return {
          ...state,
          phase: "finished",
          restEndsAt: null,
          restPlannedSeconds: null,
          lastAction: "Exercício fechado",
          updatedAt: at,
          endedAt: at,
        }
      }

      // Vai direto para executing_set. between_exercises serviria apenas
      // como ponto visual de transição, mas isso seria preso para SET_COMPLETED
      // (que só age em executing_set). Mantemos a transição implícita pela
      // fala "exercise.done.next" que escuta exerciseIndex change.
      return {
        ...state,
        exerciseIndex: state.exerciseIndex + 1,
        currentSet: 1,
        phase: "executing_set",
        restEndsAt: null,
        restPlannedSeconds: null,
        lastAction: "Exercício fechado",
        updatedAt: at,
      }
    }

    case "REST_STARTED": {
      return {
        ...state,
        phase: "resting",
        restEndsAt: event.restEndsAt,
        restPlannedSeconds: event.restPlannedSeconds,
        updatedAt: at,
      }
    }

    case "REST_EXTENDED": {
      if (state.phase !== "resting" || state.restEndsAt == null) return state
      return {
        ...state,
        restEndsAt: state.restEndsAt + event.seconds * 1000,
        restPlannedSeconds: (state.restPlannedSeconds ?? 0) + event.seconds,
        lastAction: `+${event.seconds}s de descanso`,
        updatedAt: at,
      }
    }

    case "REST_SKIPPED":
    case "REST_FINISHED": {
      if (state.phase !== "resting") return state
      return {
        ...state,
        phase: "executing_set",
        restEndsAt: null,
        restPlannedSeconds: null,
        lastAction: event.type === "REST_SKIPPED" ? "Descanso pulado" : "Descanso finalizado",
        updatedAt: at,
      }
    }

    case "QUICK_TALK_OPENED": {
      return {
        ...state,
        previousPhase: state.phase === "quick_talk" ? state.previousPhase : state.phase,
        phase: "quick_talk",
        quickTalk: {
          openedAt: at,
          inputMode: null,
          canResume: false,
        },
        updatedAt: at,
      }
    }

    case "QUICK_TALK_SUBMITTED": {
      const current = state.quickTalk ?? { openedAt: at, inputMode: null, canResume: false }
      return {
        ...state,
        quickTalk: {
          ...current,
          inputMode: event.inputMode === "voice" ? "voice_push_to_talk" : "text_quick_reply",
          lastUserText: event.text,
        },
        phase: "thinking",
        updatedAt: at,
      }
    }

    case "QUICK_TALK_RESPONDED": {
      const current = state.quickTalk ?? { openedAt: at, inputMode: null, canResume: false }
      return {
        ...state,
        phase: "quick_talk",
        quickTalk: {
          ...current,
          lastGutoText: event.text,
          intent: event.intent,
          canResume: true,
        },
        lastGutoLine: event.text,
        updatedAt: at,
      }
    }

    case "QUICK_TALK_CLOSED": {
      const target: GutoOnlinePhase = state.previousPhase ?? "executing_set"
      return {
        ...state,
        phase: target,
        previousPhase: null,
        quickTalk: null,
        updatedAt: at,
      }
    }

    case "PAIN_REPORTED": {
      return {
        ...state,
        previousPhase: state.phase,
        phase: "pain_check",
        restEndsAt: null,
        lastAction: "Pausado por dor",
        updatedAt: at,
      }
    }

    case "SWAP_REQUESTED": {
      return {
        ...state,
        previousPhase: state.phase,
        phase: "substitution",
        lastAction: "Trocando exercício",
        updatedAt: at,
      }
    }

    case "FATIGUE_REPORTED": {
      return {
        ...state,
        previousPhase: state.phase,
        phase: "fatigue_adjustment",
        lastAction: "Ajustando carga",
        updatedAt: at,
      }
    }

    case "OFF_TOPIC_REDIRECTED": {
      return { ...state, updatedAt: at }
    }

    case "VOICE_FAILED_NOISY":
    case "AI_TIMEOUT": {
      return { ...state, updatedAt: at }
    }

    case "PAUSED": {
      if (state.phase === "paused" || state.phase === "finished") return state
      return {
        ...state,
        previousPhase: state.phase,
        phase: "paused",
        restEndsAt: null,
        lastAction: "Sessão pausada",
        updatedAt: at,
      }
    }

    case "RESUMED": {
      if (state.phase !== "paused" && state.phase !== "quick_talk" && state.phase !== "pain_check" && state.phase !== "substitution" && state.phase !== "fatigue_adjustment") {
        return state
      }
      const target: GutoOnlinePhase = state.previousPhase ?? "executing_set"
      return {
        ...state,
        phase: target,
        previousPhase: null,
        lastAction: "Sessão retomada",
        updatedAt: at,
      }
    }

    case "SESSION_FINISHED": {
      return {
        ...state,
        phase: "finished",
        restEndsAt: null,
        restPlannedSeconds: null,
        endedAt: at,
        updatedAt: at,
      }
    }

    case "GUTO_SAID": {
      return {
        ...state,
        lastGutoLine: event.text,
        updatedAt: at,
      }
    }

    case "TICK": {
      // Se descanso acabou, finaliza.
      if (state.phase === "resting" && state.restEndsAt && at >= state.restEndsAt) {
        return {
          ...state,
          phase: "executing_set",
          restEndsAt: null,
          restPlannedSeconds: null,
          lastAction: "Descanso finalizado",
          updatedAt: at,
        }
      }
      return state
    }

    case "UNDO": {
      // O engine trata UNDO fora do reducer (depende de actionHistory).
      return state
    }

    default:
      return state
  }
}

// ─── Undo: aplica o inverso do último evento desfazível ──────────────────────

function applyUndo(
  state: GutoOnlineSessionState,
  exercises: GutoWorkoutExercise[],
  last: GutoOnlineEvent | undefined,
): GutoOnlineSessionState {
  if (!last) return state

  switch (last.type) {
    case "SET_COMPLETED": {
      // Tira o último set completado, volta o currentSet e sai de descanso.
      const completedSets = state.completedSets.slice(0, -1)
      const undoneSet = state.completedSets[state.completedSets.length - 1]
      if (!undoneSet) return state

      const exerciseIndex = exercises.findIndex((ex) => ex.id === undoneSet.exerciseId)
      if (exerciseIndex < 0) return state

      return {
        ...state,
        completedSets,
        exerciseIndex,
        currentSet: undoneSet.setNumber,
        phase: "executing_set",
        restEndsAt: null,
        restPlannedSeconds: null,
        lastAction: "Desfeito: série",
        updatedAt: Date.now(),
        checklist: unmarkChecklist(
          state.checklist,
          (item) =>
            item.kind === "set" &&
            item.exerciseId === undoneSet.exerciseId &&
            item.setNumber === undoneSet.setNumber,
        ),
      }
    }

    case "EXERCISE_COMPLETED": {
      // Volta para o exercício anterior, última série dele.
      const prevIndex = Math.max(0, state.exerciseIndex - 1)
      const prevExercise = exercises[prevIndex]
      const total = prevExercise?.sets || 1
      return {
        ...state,
        exerciseIndex: prevIndex,
        currentSet: total,
        phase: "executing_set",
        restEndsAt: null,
        restPlannedSeconds: null,
        endedAt: undefined,
        lastAction: "Desfeito: exercício",
        updatedAt: Date.now(),
      }
    }

    case "WARMUP_COMPLETED": {
      return {
        ...state,
        warmupCompleted: false,
        phase: "warmup",
        lastAction: "Desfeito: aquecimento",
        updatedAt: Date.now(),
        checklist: unmarkChecklist(state.checklist, (item) => item.kind === "warmup"),
      }
    }

    case "REST_SKIPPED": {
      // Não há como recriar o restEndsAt — segue em executing_set.
      return state
    }

    case "PAUSED": {
      const target: GutoOnlinePhase = state.previousPhase ?? "executing_set"
      return {
        ...state,
        phase: target,
        previousPhase: null,
        lastAction: "Desfeito: pausa",
        updatedAt: Date.now(),
      }
    }

    case "SESSION_FINISHED": {
      return {
        ...state,
        phase: "executing_set",
        endedAt: undefined,
        lastAction: "Desfeito: finalização",
        updatedAt: Date.now(),
      }
    }

    default:
      return state
  }
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export interface GutoOnlineEngineOptions {
  plan: GutoWorkoutPlan
  language: string
  userName?: string
  voiceMode?: "enabled" | "disabled"
  initialState?: GutoOnlineSessionState
  initialEventLog?: GutoOnlineEvent[]
  initialActionHistory?: GutoOnlineEvent[]
  onSideEffect?: (event: GutoOnlineEvent, state: GutoOnlineSessionState) => void
}

export class GutoOnlineEngine {
  private state: GutoOnlineSessionState
  private exercises: GutoWorkoutExercise[]
  private eventLog: GutoOnlineEvent[] = []
  private actionHistory: GutoOnlineEvent[] = []
  private seenEventIds: Set<string> = new Set()
  private lastBySemanticType: Map<GutoOnlineEventType, number> = new Map()

  private dispatchLock = false
  private dispatchQueue: GutoOnlineEvent[] = []
  private listeners: Set<GutoOnlineEngineListener> = new Set()
  private onSideEffect?: (event: GutoOnlineEvent, state: GutoOnlineSessionState) => void

  constructor(options: GutoOnlineEngineOptions) {
    this.exercises = options.plan.exercises || []
    this.state =
      options.initialState ??
      createInitialState({
        plan: options.plan,
        language: options.language,
        userName: options.userName,
        voiceMode: options.voiceMode,
      })
    this.eventLog = (options.initialEventLog || []).slice(-EVENT_LOG_MAX)
    this.actionHistory = (options.initialActionHistory || []).slice(-ACTION_HISTORY_MAX)
    this.onSideEffect = options.onSideEffect

    // Pré-popula seenEventIds com o que estava no log salvo.
    for (const event of this.eventLog) {
      this.seenEventIds.add(event.eventId)
    }
  }

  // ─ Subscrição ──────────────────────────────────────────────────────────

  subscribe(listener: GutoOnlineEngineListener): () => void {
    this.listeners.add(listener)
    listener(this.snapshot())
    return () => {
      this.listeners.delete(listener)
    }
  }

  snapshot(): GutoOnlineEngineSnapshot {
    return {
      state: this.state,
      eventLog: this.eventLog,
      actionHistory: this.actionHistory,
    }
  }

  getState(): GutoOnlineSessionState {
    return this.state
  }

  getExercises(): GutoWorkoutExercise[] {
    return this.exercises
  }

  // ─ Dispatch ────────────────────────────────────────────────────────────

  dispatch(event: GutoOnlineEvent): void {
    this.dispatchQueue.push(event)
    void this.drain()
  }

  private async drain(): Promise<void> {
    if (this.dispatchLock) return
    this.dispatchLock = true

    try {
      while (this.dispatchQueue.length > 0) {
        const event = this.dispatchQueue.shift()
        if (!event) break
        this.processEvent(event)
      }
    } finally {
      this.dispatchLock = false
    }
  }

  private processEvent(event: GutoOnlineEvent): void {
    // ─ Idempotência por eventId ────────────────────────────────
    if (this.seenEventIds.has(event.eventId)) return

    // ─ Dedupe semântico ────────────────────────────────────────
    if (SEMANTIC_DEDUPE_EVENT_TYPES.has(event.type)) {
      const last = this.lastBySemanticType.get(event.type)
      if (last && event.at - last < SEMANTIC_DEDUPE_WINDOW_MS) {
        return
      }
      this.lastBySemanticType.set(event.type, event.at)
    }

    // ─ UNDO é tratado separadamente ────────────────────────────
    if (event.type === "UNDO") {
      const lastUndoable = [...this.actionHistory].reverse().find((entry) =>
        UNDOABLE_EVENT_TYPES.has(entry.type),
      )
      if (!lastUndoable) return

      // Remove o último undoable do histórico
      const idx = this.actionHistory.lastIndexOf(lastUndoable)
      if (idx >= 0) {
        this.actionHistory = [
          ...this.actionHistory.slice(0, idx),
          ...this.actionHistory.slice(idx + 1),
        ]
      }
      this.state = applyUndo(this.state, this.exercises, lastUndoable)
      this.pushToLog(event)
      this.emit(event)
      return
    }

    // ─ Reduce ───────────────────────────────────────────────────
    const nextState = reduce({ state: this.state, exercises: this.exercises, event })
    this.state = nextState

    // ─ Action history ──────────────────────────────────────────
    if (UNDOABLE_EVENT_TYPES.has(event.type)) {
      this.actionHistory.push(event)
      if (this.actionHistory.length > ACTION_HISTORY_MAX) {
        this.actionHistory = this.actionHistory.slice(-ACTION_HISTORY_MAX)
      }
    }

    // ─ Auto-promoção: SET_COMPLETED na última série gera EXERCISE_COMPLETED ─
    if (event.type === "SET_COMPLETED") {
      const exercise = this.exercises[this.state.exerciseIndex]
      // Se a série foi a última, currentSet ainda estará > total dentro do estado anterior;
      // o reducer não avançou (caímos no branch isLast).
      // Verificamos pela presença do completedSet recém adicionado.
      const lastCompleted = this.state.completedSets[this.state.completedSets.length - 1]
      if (
        exercise &&
        lastCompleted &&
        lastCompleted.exerciseId === exercise.id &&
        lastCompleted.setNumber >= (exercise.sets || 1)
      ) {
        const followUp: GutoOnlineEvent = {
          type: "EXERCISE_COMPLETED",
          eventId: makeEventId("ev_auto"),
          at: event.at,
          source: event.source,
        }
        // Empilha; vai drenar logo após esse processEvent voltar.
        this.dispatchQueue.unshift(followUp)
      }
    }

    this.pushToLog(event)
    this.emit(event)
  }

  private pushToLog(event: GutoOnlineEvent) {
    this.seenEventIds.add(event.eventId)
    this.eventLog.push(event)
    if (this.eventLog.length > EVENT_LOG_MAX) {
      // Limpa seenEventIds dos itens descartados para não vazar memória.
      const dropped = this.eventLog.slice(0, this.eventLog.length - EVENT_LOG_MAX)
      for (const e of dropped) this.seenEventIds.delete(e.eventId)
      this.eventLog = this.eventLog.slice(-EVENT_LOG_MAX)
    }
  }

  private emit(event: GutoOnlineEvent) {
    this.onSideEffect?.(event, this.state)
    const snap = this.snapshot()
    for (const listener of this.listeners) listener({ ...snap, lastDispatched: event })
  }

  // ─ Helpers para a UI ───────────────────────────────────────────────────

  currentExercise(): GutoWorkoutExercise | undefined {
    return this.exercises[this.state.exerciseIndex]
  }

  isLastSet(): boolean {
    return isLastSetOfExercise(this.state, this.currentExercise())
  }

  progressLabel(): string {
    const total = this.exercises.length
    if (!total) return "0/0"
    return `${Math.min(this.state.exerciseIndex + 1, total)}/${total}`
  }
}
