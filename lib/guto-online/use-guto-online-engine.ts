"use client"

/**
 * GUTO Online — Hook React do Engine
 * --------------------------------------------------------------------------
 * O hook é fino. Ele cria/recupera o engine, expõe state + dispatch e cuida
 * da persistência no localStorage a cada mudança. Nada de regra de negócio
 * aqui — regra está no engine. Nada de UI — UI está nos componentes.
 *
 * Retomada de sessão:
 *   - 0–15min: hidrata o engine com o estado salvo e dispara SESSION_RESUMED.
 *   - 15min–12h: expõe um pendingResume para a UI confirmar.
 *   - +12h: descarta silenciosamente.
 *
 * O hook também guarda voice mode em localStorage (cross-session).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { GutoWorkoutPlan } from "@/lib/api/guto"
import {
  GutoOnlineEngine,
  type GutoOnlineEngineSnapshot,
  createInitialState,
} from "./guto-online-engine"
import type {
  GutoOnlineEvent,
} from "./guto-online-events"
import { makeEventId, makeSessionId } from "./guto-online-events"
import type {
  GutoOnlineSessionState,
  GutoOnlinePhase,
  GutoVoiceMode,
} from "./guto-online-types"
import { makeWorkoutKey } from "./guto-online-types"
import {
  clearSession,
  decideResume,
  loadVoiceMode,
  saveSession,
  saveVoiceMode,
  type GutoPersistedSession,
} from "./guto-online-storage"

interface UseGutoOnlineEngineOptions {
  plan: GutoWorkoutPlan
  language: string
  userName?: string
  enabled: boolean
  onSideEffect?: (event: GutoOnlineEvent, state: GutoOnlineSessionState) => void
}

export interface PendingResumeState {
  payload: GutoPersistedSession
  ageMinutes: number
}

export interface UseGutoOnlineEngineResult {
  ready: boolean
  state: GutoOnlineSessionState
  eventLog: GutoOnlineEvent[]
  actionHistory: GutoOnlineEvent[]
  lastDispatched?: GutoOnlineEvent
  pendingResume: PendingResumeState | null
  acceptResume: () => void
  declineResume: () => void
  dispatch: (event: GutoOnlineEvent) => void
  // Helpers de ergonomia
  toggleVoiceMode: () => void
  setVoiceMode: (mode: GutoVoiceMode) => void
  undo: () => void
}

export function useGutoOnlineEngine(options: UseGutoOnlineEngineOptions): UseGutoOnlineEngineResult {
  const workoutKey = useMemo(() => makeWorkoutKey(options.plan), [options.plan])
  const engineRef = useRef<GutoOnlineEngine | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const [pendingResume, setPendingResume] = useState<PendingResumeState | null>(null)
  const [snapshot, setSnapshot] = useState<GutoOnlineEngineSnapshot | null>(null)
  // Mantém referência ao último callback de telemetria sem atualizar durante render
  // (react-hooks/refs proíbe). useEffect roda depois do commit.
  const sideEffectRef = useRef(options.onSideEffect)
  useEffect(() => {
    sideEffectRef.current = options.onSideEffect
  }, [options.onSideEffect])

  // ─── Inicialização / retomada ────────────────────────────────────────────

  useEffect(() => {
    if (!options.enabled) return

    const decision = decideResume(workoutKey)
    const voiceMode = loadVoiceMode()

    let engine: GutoOnlineEngine

    if (decision.kind === "auto") {
      const payload = decision.payload
      // Garante coerência: se sessionId não estiver bom, regenera.
      const sessionId = payload.sessionId || makeSessionId()
      engine = new GutoOnlineEngine({
        plan: options.plan,
        language: options.language,
        userName: options.userName,
        voiceMode,
        initialState: { ...payload.state, sessionId, voiceMode },
        initialEventLog: payload.eventLog,
        initialActionHistory: payload.actionHistory,
        onSideEffect: (event, state) => sideEffectRef.current?.(event, state),
      })

      engine.dispatch({
        type: "SESSION_RESUMED",
        eventId: makeEventId("resume"),
        at: Date.now(),
        source: "system",
      })
    } else if (decision.kind === "confirm") {
      // Cria engine novo, mas guarda o payload para a UI decidir.
      engine = new GutoOnlineEngine({
        plan: options.plan,
        language: options.language,
        userName: options.userName,
        voiceMode,
        onSideEffect: (event, state) => sideEffectRef.current?.(event, state),
      })
      setPendingResume({
        payload: decision.payload,
        ageMinutes: Math.round(decision.ageMs / 60_000),
      })
    } else {
      // expired ou none — começa do zero.
      engine = new GutoOnlineEngine({
        plan: options.plan,
        language: options.language,
        userName: options.userName,
        voiceMode,
        onSideEffect: (event, state) => sideEffectRef.current?.(event, state),
      })
      engine.dispatch({
        type: "SESSION_STARTED",
        eventId: makeEventId("start"),
        at: Date.now(),
        source: "system",
      })
    }

    engineRef.current = engine
    unsubscribeRef.current?.()
    unsubscribeRef.current = engine.subscribe(setSnapshot)
    return () => {
      unsubscribeRef.current?.()
      unsubscribeRef.current = null
      engineRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.enabled, workoutKey])

  // ─── Persistência a cada mudança ─────────────────────────────────────────

  useEffect(() => {
    if (!snapshot) return
    // Não persiste briefing recém aberto sem nenhum evento — não há nada a recuperar.
    if (snapshot.state.phase === "briefing" && snapshot.eventLog.length === 0) return

    // Treino terminado: limpa.
    if (snapshot.state.phase === "finished") {
      clearSession(snapshot.state.workoutKey)
      return
    }

    saveSession({
      sessionId: snapshot.state.sessionId,
      workoutKey: snapshot.state.workoutKey,
      state: snapshot.state,
      eventLog: snapshot.eventLog,
      actionHistory: snapshot.actionHistory,
      createdAt: snapshot.state.startedAt,
    })
  }, [snapshot])

  // ─── Dispatch + helpers ─────────────────────────────────────────────────

  const dispatch = useCallback((event: GutoOnlineEvent) => {
    engineRef.current?.dispatch(event)
  }, [])

  const setVoiceMode = useCallback(
    (mode: GutoVoiceMode) => {
      saveVoiceMode(mode)
      dispatch({
        type: "VOICE_MODE_TOGGLED",
        eventId: makeEventId("voice"),
        at: Date.now(),
        enabled: mode === "enabled",
        source: "button",
      })
    },
    [dispatch],
  )

  const toggleVoiceMode = useCallback(() => {
    const current = engineRef.current?.getState().voiceMode ?? "enabled"
    setVoiceMode(current === "enabled" ? "disabled" : "enabled")
  }, [setVoiceMode])

  const undo = useCallback(() => {
    dispatch({
      type: "UNDO",
      eventId: makeEventId("undo"),
      at: Date.now(),
      source: "button",
    })
  }, [dispatch])

  const acceptResume = useCallback(() => {
    if (!pendingResume) return
    const payload = pendingResume.payload
    const voiceMode = loadVoiceMode()
    const newEngine = new GutoOnlineEngine({
      plan: options.plan,
      language: options.language,
      userName: options.userName,
      voiceMode,
      initialState: { ...payload.state, voiceMode },
      initialEventLog: payload.eventLog,
      initialActionHistory: payload.actionHistory,
      onSideEffect: (event, state) => sideEffectRef.current?.(event, state),
    })
    // Limpa subscription antiga antes de trocar de engine.
    unsubscribeRef.current?.()
    engineRef.current = newEngine
    unsubscribeRef.current = newEngine.subscribe(setSnapshot)
    newEngine.dispatch({
      type: "SESSION_RESUMED",
      eventId: makeEventId("resume"),
      at: Date.now(),
      source: "button",
    })
    setPendingResume(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingResume])

  const declineResume = useCallback(() => {
    if (!pendingResume) return
    clearSession(pendingResume.payload.workoutKey)
    setPendingResume(null)
    engineRef.current?.dispatch({
      type: "SESSION_STARTED",
      eventId: makeEventId("start"),
      at: Date.now(),
      source: "button",
    })
  }, [pendingResume])

  // ─── Fallback de state quando snapshot ainda não chegou ──────────────────

  const fallbackState = useMemo<GutoOnlineSessionState>(
    () =>
      createInitialState({
        plan: options.plan,
        language: options.language,
        userName: options.userName,
      }),
    [options.plan, options.language, options.userName],
  )

  // Engine só emite snapshot depois de criado e subscrito; basta o snapshot existir.
  // Ler engineRef.current aqui violaria react-hooks/refs.
  return {
    ready: snapshot !== null,
    state: snapshot?.state ?? fallbackState,
    eventLog: snapshot?.eventLog ?? [],
    actionHistory: snapshot?.actionHistory ?? [],
    lastDispatched: snapshot?.lastDispatched,
    pendingResume,
    acceptResume,
    declineResume,
    dispatch,
    toggleVoiceMode,
    setVoiceMode,
    undo,
  }
}

// ─── Helpers de visibilidade de botão por fase ──────────────────────────────

export function isPhaseExecuting(phase: GutoOnlinePhase): boolean {
  return phase === "executing_set" || phase === "between_exercises"
}

export function isPhaseResting(phase: GutoOnlinePhase): boolean {
  return phase === "resting"
}

export function isPhaseInTalk(phase: GutoOnlinePhase): boolean {
  return (
    phase === "quick_talk" ||
    phase === "pain_check" ||
    phase === "substitution" ||
    phase === "fatigue_adjustment" ||
    phase === "thinking"
  )
}
