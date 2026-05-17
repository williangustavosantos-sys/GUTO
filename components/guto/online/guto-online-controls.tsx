"use client"

import { CheckCircle2, Flame, MessageCircle, MoreHorizontal, ShieldAlert } from "lucide-react"

import type { GutoOnlinePhase } from "@/lib/guto-online/guto-online-types"

interface GutoOnlineControlsProps {
  phase: GutoOnlinePhase
  isLastSet: boolean
  isPlanFinished: boolean
  language?: string
  onWarmupDone: () => void
  onSetDone: () => void
  onExerciseDone: () => void
  onTalk: () => void
  onValidate: () => void
  onMoreOptions: () => void
}

const COPY: Record<string, {
  warmupDone: string
  setDone: string
  exerciseDone: string
  talk: string
  more: string
  validate: string
  validateBlocked: string
}> = {
  "pt-BR": {
    warmupDone: "Aquecimento feito",
    setDone: "Série feita",
    exerciseDone: "Exercício feito",
    talk: "Falar com GUTO",
    more: "Mais",
    validate: "Validar treino",
    validateBlocked: "Finaliza a missão antes de validar",
  },
  "en-US": {
    warmupDone: "Warm-up done",
    setDone: "Set done",
    exerciseDone: "Exercise done",
    talk: "Talk to GUTO",
    more: "More",
    validate: "Validate workout",
    validateBlocked: "Finish the mission before validating",
  },
  "it-IT": {
    warmupDone: "Riscaldamento fatto",
    setDone: "Serie fatta",
    exerciseDone: "Esercizio finito",
    talk: "Parla con GUTO",
    more: "Altro",
    validate: "Valida allenamento",
    validateBlocked: "Finisci prima di validare",
  },
}

function pickCopy(language?: string) {
  if (!language) return COPY["pt-BR"]
  if (language in COPY) return COPY[language]
  const prefix = language.split("-")[0]
  const found = Object.keys(COPY).find((key) => key.startsWith(prefix))
  return found ? COPY[found] : COPY["pt-BR"]
}

/**
 * Botões corretos por momento. Regra:
 *   - warmup:                    [Aquecimento feito] [Falar com GUTO]
 *   - executing_set + !lastSet:  [Série feita] [Falar com GUTO]
 *   - executing_set + lastSet:   [Exercício feito] [Falar com GUTO]
 *   - between_exercises:         igual ao executing_set (entra em transição rápida)
 *   - finished:                  [Validar treino]
 *   - resting / quick_talk:      este componente não renderiza nada — outras
 *                                 telas assumem.
 *
 * "Pular exercício" NÃO aparece aqui. Só em Mais (com confirmação).
 */
export function GutoOnlineControls({
  phase,
  isLastSet,
  isPlanFinished,
  language,
  onWarmupDone,
  onSetDone,
  onExerciseDone,
  onTalk,
  onValidate,
  onMoreOptions,
}: GutoOnlineControlsProps) {
  const copy = pickCopy(language)

  if (phase === "finished" || isPlanFinished) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onValidate}
          className="guto-deboss-deep flex h-14 items-center justify-center gap-2 rounded-[1.1rem] border border-[rgba(82,231,255,0.6)] bg-[rgba(82,231,255,0.16)] font-mono text-[11px] font-black uppercase tracking-[0.18em] text-(--guto-navy) active:scale-[0.99]"
        >
          <Flame className="h-4 w-4" />
          {copy.validate}
        </button>
      </div>
    )
  }

  if (phase === "warmup") {
    return (
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={onWarmupDone}
          className="flex h-14 items-center justify-center gap-2 rounded-[1.1rem] border border-[rgba(82,231,255,0.55)] bg-[rgba(82,231,255,0.16)] font-mono text-[10px] font-black uppercase tracking-[0.14em] text-(--guto-navy) active:scale-[0.98]"
        >
          <CheckCircle2 className="h-4 w-4" />
          {copy.warmupDone}
        </button>
        <button
          type="button"
          onClick={onTalk}
          className="flex h-14 items-center justify-center gap-2 rounded-[1.1rem] border border-white/70 bg-white/55 px-4 font-mono text-[10px] font-black uppercase tracking-[0.14em] active:scale-[0.98]"
        >
          <MessageCircle className="h-4 w-4" />
          {copy.talk}
        </button>
      </div>
    )
  }

  if (phase === "executing_set" || phase === "between_exercises" || phase === "paused") {
    const primary = isLastSet ? copy.exerciseDone : copy.setDone
    const handler = isLastSet ? onExerciseDone : onSetDone
    return (
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            onClick={handler}
            disabled={phase === "paused"}
            className="flex h-14 items-center justify-center gap-2 rounded-[1.1rem] border border-[rgba(82,231,255,0.55)] bg-[rgba(82,231,255,0.16)] font-mono text-[10px] font-black uppercase tracking-[0.14em] text-(--guto-navy) active:scale-[0.98] disabled:opacity-40"
          >
            <CheckCircle2 className="h-4 w-4" />
            {primary}
          </button>
          <button
            type="button"
            onClick={onTalk}
            className="flex h-14 items-center justify-center gap-2 rounded-[1.1rem] border border-white/70 bg-white/55 px-4 font-mono text-[10px] font-black uppercase tracking-[0.14em] active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" />
            {copy.talk}
          </button>
        </div>

        <button
          type="button"
          onClick={onMoreOptions}
          className="flex h-10 items-center justify-center gap-2 rounded-[0.9rem] border border-white/60 bg-white/35 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[rgba(13,35,65,0.6)] active:scale-[0.98]"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
          {copy.more}
        </button>
      </div>
    )
  }

  // pain_check / substitution / fatigue_adjustment / quick_talk / thinking → outros componentes mandam
  if (phase === "pain_check" || phase === "substitution" || phase === "fatigue_adjustment") {
    return (
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={onTalk}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/55 font-mono text-[10px] font-black uppercase tracking-[0.14em] active:scale-[0.98]"
        >
          <MessageCircle className="h-4 w-4" />
          {copy.talk}
        </button>
      </div>
    )
  }

  // briefing → nada (transição automática).
  return null
}

// ─── Mais opções (modal simples controlado externamente) ────────────────────

interface MoreOptionsProps {
  open: boolean
  onClose: () => void
  onSkipExercise: () => void
  onPauseSession: () => void
  onUndoLast: () => void
  language?: string
}

const MORE_COPY: Record<string, {
  title: string
  skip: string
  skipConfirm: string
  pause: string
  undo: string
  close: string
}> = {
  "pt-BR": {
    title: "Mais opções",
    skip: "Pular este exercício",
    skipConfirm: "Tem certeza? Vai contar como pulado.",
    pause: "Pausar sessão",
    undo: "Desfazer última ação",
    close: "Voltar",
  },
  "en-US": {
    title: "More options",
    skip: "Skip this exercise",
    skipConfirm: "Are you sure? It will count as skipped.",
    pause: "Pause session",
    undo: "Undo last action",
    close: "Back",
  },
  "it-IT": {
    title: "Altre opzioni",
    skip: "Salta questo esercizio",
    skipConfirm: "Sicuro? Conterà come saltato.",
    pause: "Metti in pausa",
    undo: "Annulla ultima azione",
    close: "Indietro",
  },
}

function pickMoreCopy(language?: string) {
  if (!language) return MORE_COPY["pt-BR"]
  if (language in MORE_COPY) return MORE_COPY[language]
  const prefix = language.split("-")[0]
  const found = Object.keys(MORE_COPY).find((key) => key.startsWith(prefix))
  return found ? MORE_COPY[found] : MORE_COPY["pt-BR"]
}

export function GutoOnlineMoreOptions({
  open,
  onClose,
  onSkipExercise,
  onPauseSession,
  onUndoLast,
  language,
}: MoreOptionsProps) {
  if (!open) return null
  const copy = pickMoreCopy(language)

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[rgba(13,35,65,0.4)] px-4 pb-6 pt-12"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[1.4rem] border border-white/80 bg-white/95 p-4 shadow-[0_30px_80px_rgba(13,35,65,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between">
          <h3 className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-(--guto-navy)">
            {copy.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[rgba(13,35,65,0.6)]"
          >
            {copy.close}
          </button>
        </header>

        <ul className="mt-3 flex flex-col gap-2">
          <li>
            <button
              type="button"
              onClick={onUndoLast}
              className="flex w-full items-center justify-between rounded-2xl border border-white/70 bg-white/55 px-4 py-3 text-left font-mono text-[10px] font-black uppercase tracking-[0.14em] active:scale-[0.99]"
            >
              {copy.undo}
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={onPauseSession}
              className="flex w-full items-center justify-between rounded-2xl border border-white/70 bg-white/55 px-4 py-3 text-left font-mono text-[10px] font-black uppercase tracking-[0.14em] active:scale-[0.99]"
            >
              {copy.pause}
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(copy.skipConfirm)) {
                  onSkipExercise()
                }
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-[rgba(157,43,43,0.22)] bg-[rgba(157,43,43,0.08)] px-4 py-3 text-left font-mono text-[10px] font-black uppercase tracking-[0.14em] text-destructive active:scale-[0.99]"
            >
              <ShieldAlert className="mr-2 inline h-4 w-4" />
              {copy.skip}
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}
