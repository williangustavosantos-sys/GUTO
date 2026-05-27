// GUTO Sala de Controle / Empresa Portal / Coach Portal — design tokens.
// Light theme: warm off-white content area + deep-navy sidebar + cyan accent.
// Direct port from design_handoff_guto_coach_panel/light-shell.jsx `T` object.
export const T = {
  bg: "#F0F2F5",
  bgAlt: "#E8EBF0",
  surface: "#FFFFFF",
  surfaceAlt: "#F7F8FA",
  surfaceHover: "#F2F4F7",

  sidebar: "#0B1120",
  sidebarBorder: "rgba(255,255,255,0.07)",
  sidebarHover: "rgba(255,255,255,0.06)",
  sidebarActive: "rgba(82,231,255,0.13)",
  sidebarActiveBd: "rgba(82,231,255,0.60)",
  sidebarFg: "rgba(255,255,255,0.72)",
  sidebarFgActive: "#FFFFFF",
  sidebarFgMuted: "rgba(255,255,255,0.32)",
  sidebarFgGroup: "rgba(255,255,255,0.28)",

  fg: "#0F172A",
  fg2: "#334155",
  fg3: "#64748B",
  fg4: "#94A3B8",
  fg5: "#CBD5E1",

  border: "#DDE1E8",
  borderStrong: "#C8CDD6",
  borderSoft: "#EAECF0",

  brand: "#0E7490",
  brandStrong: "#0891B2",
  brandDeep: "#155E75",
  brandSoft: "#ECFEFF",
  brandSoft2: "#CFFAFE",
  brandLine: "#A5F3FC",
  cyan: "#52e7ff",
  cyanGlow: "rgba(82,231,255,0.18)",

  ok: "#15803D",
  okSoft: "#DCFCE7",
  okLine: "#BBF7D0",
  warn: "#B45309",
  warnSoft: "#FEF3C7",
  warnLine: "#FDE68A",
  bad: "#B91C1C",
  badSoft: "#FEE2E2",
  badLine: "#FECACA",
  info: "#1D4ED8",
  infoSoft: "#DBEAFE",
  infoLine: "#BFDBFE",
  mute: "#475569",
  muteSoft: "#F1F5F9",
  muteLine: "#E2E8F0",

  ui: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, Monaco, Consolas, monospace',

  shadow1: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
  shadow2: "0 4px 12px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.05)",
  shadow3: "0 12px 32px rgba(15,23,42,0.10), 0 4px 12px rgba(15,23,42,0.07)",
  shadowFloat: "0 24px 60px rgba(15,23,42,0.20), 0 8px 24px rgba(15,23,42,0.10)",
} as const

export type PanelTone = "mute" | "brand" | "ok" | "warn" | "bad" | "info" | "neutral"
