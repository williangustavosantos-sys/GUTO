"use client"

import type { CSSProperties, ReactNode } from "react"
import { ISearch } from "./icons"
import { T, type PanelTone } from "@/lib/panel/tokens"

interface CommonProps {
  style?: CSSProperties
}

export function Card({
  children,
  style,
  padded,
  accent,
}: CommonProps & {
  children: ReactNode
  padded?: boolean
  accent?: boolean
}) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${accent ? T.brandLine : T.border}`,
        borderRadius: 12,
        boxShadow: accent ? "0 1px 2px rgba(8,145,178,0.06)" : T.shadow1,
        padding: padded ? "20px 22px" : 0,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function SectionHeader({
  title,
  subtitle,
  action,
  style,
}: CommonProps & {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
        gap: 16,
        ...style,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 14,
            fontWeight: 600,
            color: T.fg,
            letterSpacing: "-0.005em",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontFamily: T.ui, fontSize: 13, color: T.fg3, marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {action}
    </div>
  )
}

export function Kicker({
  children,
  style,
  brand,
}: CommonProps & { children: ReactNode; brand?: boolean }) {
  return (
    <span
      style={{
        fontFamily: T.ui,
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: brand ? T.brand : T.fg4,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

const PILL_TONE_MAP: Record<PanelTone, { bg: string; fg: string; bd: string }> = {
  mute: { bg: T.muteSoft, fg: T.mute, bd: T.muteLine },
  brand: { bg: T.brandSoft, fg: T.brand, bd: T.brandLine },
  ok: { bg: T.okSoft, fg: T.ok, bd: T.okLine },
  warn: { bg: T.warnSoft, fg: T.warn, bd: T.warnLine },
  bad: { bg: T.badSoft, fg: T.bad, bd: T.badLine },
  info: { bg: T.infoSoft, fg: T.info, bd: T.infoLine },
  neutral: { bg: T.muteSoft, fg: T.mute, bd: T.muteLine },
}

export function Pill({
  tone = "mute",
  children,
  style,
  dot,
}: CommonProps & {
  tone?: PanelTone
  children: ReactNode
  dot?: boolean
}) {
  const p = PILL_TONE_MAP[tone] ?? PILL_TONE_MAP.mute
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 22,
        padding: "0 9px",
        borderRadius: 999,
        background: p.bg,
        color: p.fg,
        border: `1px solid ${p.bd}`,
        fontFamily: T.ui,
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: p.fg,
          }}
        />
      )}
      {children}
    </span>
  )
}

type BtnVariant = "default" | "primary" | "ghost" | "danger"

export function Btn({
  children,
  onClick,
  variant = "default",
  sm,
  type = "button",
  disabled,
  style,
}: CommonProps & {
  children: ReactNode
  onClick?: () => void
  variant?: BtnVariant
  sm?: boolean
  type?: "button" | "submit" | "reset"
  disabled?: boolean
}) {
  const h = sm ? 32 : 38
  let bg: string, fg: string, bd: string, sh: string
  switch (variant) {
    case "primary":
      bg = T.brandStrong
      fg = "#FFFFFF"
      bd = T.brandStrong
      sh = "0 1px 2px rgba(8,145,178,0.25)"
      break
    case "danger":
      bg = T.surface
      fg = T.bad
      bd = T.badLine
      sh = "none"
      break
    case "ghost":
      bg = "transparent"
      fg = T.fg2
      bd = "transparent"
      sh = "none"
      break
    default:
      bg = T.surface
      fg = T.fg
      bd = T.borderStrong
      sh = T.shadow1
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: h,
        padding: `0 ${sm ? 12 : 14}px`,
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        background: bg,
        color: fg,
        border: `1px solid ${bd}`,
        fontFamily: T.ui,
        fontSize: sm ? 12.5 : 13.5,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        boxShadow: sh,
        transition: "filter 140ms ease, transform 80ms ease",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  style,
}: CommonProps & {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div style={{ position: "relative", flex: 1, maxWidth: 340, ...style }}>
      <span
        style={{
          position: "absolute",
          left: 11,
          top: "50%",
          transform: "translateY(-50%)",
          color: T.fg4,
          pointerEvents: "none",
        }}
      >
        <ISearch size={15} sw={2} />
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Buscar…"}
        style={{
          width: "100%",
          height: 38,
          paddingLeft: 34,
          paddingRight: 12,
          background: T.surface,
          border: `1px solid ${T.borderStrong}`,
          borderRadius: 8,
          fontFamily: T.ui,
          fontSize: 13.5,
          color: T.fg,
          outline: "none",
        }}
      />
    </div>
  )
}

export function Num({
  children,
  c,
  style,
}: CommonProps & { children: ReactNode; c?: string }) {
  return (
    <span
      style={{
        fontFamily: T.mono,
        fontSize: 13,
        fontWeight: 500,
        color: c ?? T.fg,
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {children}
    </span>
  )
}

// Initial-only avatar with deterministic colour palette based on the name hash.
const AVATAR_PALETTES: Array<{ bg: string; fg: string }> = [
  { bg: "#ECFEFF", fg: "#0E7490" },
  { bg: "#F0F9FF", fg: "#0369A1" },
  { bg: "#F5F3FF", fg: "#6D28D9" },
  { bg: "#FDF2F8", fg: "#BE185D" },
  { bg: "#FEF3C7", fg: "#A16207" },
  { bg: "#ECFDF5", fg: "#047857" },
  { bg: "#FEF2F2", fg: "#B91C1C" },
]

export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const initials = (name || "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  const hash = [...(name || "")].reduce((a, c) => a + c.charCodeAt(0), 0)
  const p = AVATAR_PALETTES[hash % AVATAR_PALETTES.length]
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: p.bg,
        color: p.fg,
        display: "grid",
        placeItems: "center",
        fontFamily: T.ui,
        fontSize: size > 34 ? 13 : 11.5,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  )
}

type KpiTone = "brand" | "ok" | "warn" | "bad"

const KPI_TONE_MAP: Record<KpiTone, { iconBg: string; iconFg: string }> = {
  brand: { iconBg: T.brandSoft, iconFg: T.brand },
  ok: { iconBg: T.okSoft, iconFg: T.ok },
  warn: { iconBg: T.warnSoft, iconFg: T.warn },
  bad: { iconBg: T.badSoft, iconFg: T.bad },
}

export function KpiCard({
  icon,
  label,
  value,
  sub,
  tone = "brand",
  onClick,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: KpiTone
  onClick?: () => void
}) {
  const c = KPI_TONE_MAP[tone]
  const interactive = Boolean(onClick)
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: "18px 18px 16px",
        textAlign: "left",
        cursor: interactive ? "pointer" : "default",
        boxShadow: T.shadow1,
        flex: 1,
        minWidth: 160,
        transition: "border-color 140ms ease, box-shadow 140ms ease",
        font: "inherit",
        color: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span style={{ fontFamily: T.ui, fontSize: 13, color: T.fg2, fontWeight: 500 }}>{label}</span>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: c.iconBg,
            color: c.iconFg,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      </div>
      <div
        style={{
          fontFamily: T.ui,
          fontSize: 28,
          fontWeight: 600,
          color: T.fg,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: T.ui, fontSize: 12.5, color: T.fg3, marginTop: 6 }}>{sub}</div>
      )}
    </button>
  )
}
