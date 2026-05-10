/**
 * Sala de Controle — Design tokens
 *
 * Source: ~/Downloads/guto-design-system/project/coach-panel/sala-shell.jsx (token "T")
 * Replicated as Tailwind-friendly CSS values + a `T` object that mirrors the
 * design-system constants for any inline style we need.
 */

export const T = {
  // base
  ink: "#04060f",
  bg: "#080e1c",

  // panel surfaces (RGBA so they layer over scanlines)
  panel: "rgba(15,22,42,0.86)",
  panelDp: "rgba(8,12,26,0.92)",
  panelHi: "rgba(22,32,58,0.90)",

  // borders
  border: "rgba(82,231,255,0.10)",
  borderHi: "rgba(82,231,255,0.26)",

  // text
  fg: "#e8f4ff",
  fg2: "rgba(232,244,255,0.60)",
  fg3: "rgba(232,244,255,0.38)",
  fg4: "rgba(232,244,255,0.18)",

  // brand
  cyan: "#52e7ff",
  cyanSoft: "rgba(82,231,255,0.14)",
  cyanLine: "rgba(82,231,255,0.24)",

  // status
  ok: "#4ade80",
  okS: "rgba(74,222,128,0.13)",
  warn: "#fbbf24",
  warnS: "rgba(251,191,36,0.13)",
  bad: "#f87171",
  badS: "rgba(248,113,113,0.13)",

  // typography
  mono: '"JetBrains Mono","SF Mono",Menlo,Monaco,Consolas,monospace',
} as const

export type Tone = "neutral" | "cyan" | "ok" | "warn" | "bad" | "mute"

export const TONE_MAP: Record<
  Tone,
  { bg: string; fg: string; bd: string }
> = {
  neutral: { bg: "rgba(232,244,255,0.06)", fg: T.fg2, bd: "rgba(232,244,255,0.10)" },
  cyan: { bg: T.cyanSoft, fg: T.cyan, bd: T.cyanLine },
  ok: { bg: T.okS, fg: T.ok, bd: "rgba(74,222,128,0.28)" },
  warn: { bg: T.warnS, fg: T.warn, bd: "rgba(251,191,36,0.28)" },
  bad: { bg: T.badS, fg: T.bad, bd: "rgba(248,113,113,0.28)" },
  mute: { bg: "rgba(232,244,255,0.04)", fg: T.fg3, bd: "rgba(232,244,255,0.08)" },
}

// ─── Plan / status helpers ─────────────────────────────────────────────────

export function planLabel(p: string | null | undefined): string {
  return ({ start: "START", pro: "PRO", elite: "ELITE", custom: "CUSTOM" } as Record<string, string>)[p ?? ""] ?? (p ?? "—").toUpperCase()
}

export function teamStatusTone(s: string | null | undefined): Tone {
  return (
    ({
      active: "ok",
      paused: "mute",
      archived: "neutral",
      // forward-compat with future backend statuses (PR #3):
      trial: "warn",
      overdue: "bad",
    } as Record<string, Tone>)[s ?? ""] ?? "neutral"
  )
}

export function teamStatusLabel(s: string | null | undefined): string {
  return (
    ({
      active: "ATIVA",
      paused: "PAUSADA",
      archived: "ARQUIVADA",
      trial: "TESTE",
      overdue: "VENCIDA",
    } as Record<string, string>)[s ?? ""] ?? (s ?? "—").toUpperCase()
  )
}
