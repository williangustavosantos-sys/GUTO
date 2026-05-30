/**
 * Coach/Admin Panel — Design tokens (LIGHT theme)
 *
 * Source of truth: design_handoff_guto_coach_panel/light-shell.jsx (token "T")
 * + README.md. Premium light SaaS: warm off-white content, deep-navy sidebar,
 * cyan accents (brand #0E7490 on light surfaces; full #52e7ff only on the navy
 * sidebar). Inter for UI text; JetBrains Mono only for numbers/IDs.
 *
 * All keys used by the existing panel code are preserved here, remapped to the
 * light palette, so token-driven components flip to the new look automatically.
 */

export const T = {
  // base / content backgrounds
  ink: "#F0F2F5",
  bg: "#F0F2F5",
  bgAlt: "#E8EBF0",

  // panel surfaces (cards)
  panel: "#FFFFFF",
  panelDp: "#F7F8FA",
  panelHi: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#F7F8FA",
  surfaceHover: "#F2F4F7",

  // borders
  border: "#DDE1E8",
  borderHi: "#C8CDD6",
  borderStrong: "#C8CDD6",
  borderSoft: "#EAECF0",

  // text — slate ramp (content area)
  fg: "#0F172A",
  fg2: "#334155",
  fg3: "#64748B",
  fg4: "#94A3B8",
  fg5: "#CBD5E1",

  // brand cyan — content area uses darker for a11y
  cyan: "#0E7490",
  brand: "#0E7490",
  brandStrong: "#0891B2",
  brandDeep: "#155E75",
  cyanSoft: "#ECFEFF",
  brandSoft: "#ECFEFF",
  brandSoft2: "#CFFAFE",
  cyanLine: "#A5F3FC",
  brandLine: "#A5F3FC",
  // full brand cyan — only legible on the dark sidebar
  sidebarCyan: "#52e7ff",

  // sidebar — deep navy
  sidebar: "#0B1120",
  sidebarBorder: "rgba(255,255,255,0.07)",
  sidebarHover: "rgba(255,255,255,0.06)",
  sidebarActive: "rgba(82,231,255,0.13)",
  sidebarActiveBd: "rgba(82,231,255,0.60)",
  sidebarFg: "rgba(255,255,255,0.72)",
  sidebarFgActive: "#FFFFFF",
  sidebarFgMuted: "rgba(255,255,255,0.32)",
  sidebarFgGroup: "rgba(255,255,255,0.28)",

  // status
  ok: "#15803D",
  okS: "#DCFCE7",
  okLine: "#BBF7D0",
  warn: "#B45309",
  warnS: "#FEF3C7",
  warnLine: "#FDE68A",
  bad: "#B91C1C",
  badS: "#FEE2E2",
  badLine: "#FECACA",
  info: "#1D4ED8",
  infoS: "#DBEAFE",
  infoLine: "#BFDBFE",
  mute: "#475569",
  muteS: "#F1F5F9",
  muteLine: "#E2E8F0",

  // shadows (richer on warm bg)
  shadow1: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
  shadow2: "0 4px 12px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.05)",
  shadow3: "0 12px 32px rgba(15,23,42,0.10), 0 4px 12px rgba(15,23,42,0.07)",
  shadowFloat: "0 24px 60px rgba(15,23,42,0.20), 0 8px 24px rgba(15,23,42,0.10)",

  // typography
  ui: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  // Decisão do fundador: sem fonte "máquina de escrever". T.mono passa a ser a
  // MESMA do T.ui — todo o painel numa fonte só.
  mono: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
} as const

export type Tone = "neutral" | "cyan" | "ok" | "warn" | "bad" | "mute"

export const TONE_MAP: Record<
  Tone,
  { bg: string; fg: string; bd: string }
> = {
  neutral: { bg: T.muteS, fg: T.mute, bd: T.muteLine },
  cyan: { bg: T.brandSoft, fg: T.brand, bd: T.brandLine },
  ok: { bg: T.okS, fg: T.ok, bd: T.okLine },
  warn: { bg: T.warnS, fg: T.warn, bd: T.warnLine },
  bad: { bg: T.badS, fg: T.bad, bd: T.badLine },
  mute: { bg: T.muteS, fg: T.mute, bd: T.muteLine },
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
