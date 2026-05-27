"use client"

import type { CSSProperties, ReactNode } from "react"
import { T, TONE_MAP, type Tone } from "./control-tokens"

/**
 * Coach/Admin Panel — Atomic components (LIGHT theme)
 *
 * Mirrors the atoms from design_handoff_guto_coach_panel/light-shell.jsx
 * (Card/Plate, Kicker, Label, Pill, Btn, SearchBox, DataRow, SectionTitle,
 * Field, TextInput, SelectInput) translated to typed React. UI text uses Inter
 * (T.ui); JetBrains Mono (T.mono) is reserved for numbers/IDs.
 */

// ─── Plate (Card) ──────────────────────────────────────────────────────────────

export function Plate({
  children,
  style,
  dp,
  hi,
  glow,
  className = "",
}: {
  children: ReactNode
  style?: CSSProperties
  dp?: boolean
  hi?: boolean
  glow?: boolean
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        background: dp ? T.surfaceAlt : hi ? T.surface : T.surface,
        border: `1px solid ${glow ? T.brandLine : T.border}`,
        borderRadius: 12,
        boxShadow: glow ? "0 1px 2px rgba(8,145,178,0.06)" : T.shadow1,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Kicker / Label ──────────────────────────────────────────────────────────

export function Kicker({
  children,
  cyan,
  style,
}: {
  children: ReactNode
  cyan?: boolean
  style?: CSSProperties
}) {
  return (
    <span
      style={{
        fontFamily: T.ui,
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: cyan ? T.brand : T.fg4,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: "block",
        fontFamily: T.ui,
        fontSize: 12.5,
        fontWeight: 500,
        color: T.fg2,
        marginBottom: 6,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

export function Pill({
  tone = "neutral",
  children,
  style,
}: {
  tone?: Tone
  children: ReactNode
  style?: CSSProperties
}) {
  const p = TONE_MAP[tone]
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
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  )
}

// ─── Btn ──────────────────────────────────────────────────────────────────────

export function Btn({
  children,
  onClick,
  cyan,
  ghost,
  danger,
  sm,
  disabled,
  style,
  type = "button",
  title,
}: {
  children: ReactNode
  onClick?: () => void
  cyan?: boolean
  ghost?: boolean
  danger?: boolean
  sm?: boolean
  disabled?: boolean
  style?: CSSProperties
  type?: "button" | "submit"
  title?: string
}) {
  let bg: string
  let fg: string
  let bd: string
  let sh = "none"
  if (cyan) {
    bg = T.brandStrong
    fg = "#FFFFFF"
    bd = T.brandStrong
    sh = "0 1px 2px rgba(8,145,178,0.25)"
  } else if (danger) {
    bg = T.surface
    fg = T.bad
    bd = T.badLine
  } else if (ghost) {
    bg = "transparent"
    fg = T.fg2
    bd = "transparent"
  } else {
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
      title={title}
      style={{
        height: sm ? 32 : 38,
        padding: `0 ${sm ? 12 : 14}px`,
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        background: bg,
        color: fg,
        border: `1px solid ${bd}`,
        fontFamily: T.ui,
        fontSize: sm ? 12.5 : 13.5,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        boxShadow: sh,
        transition: "all 140ms ease",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ─── SearchBox ────────────────────────────────────────────────────────────────

export function SearchBox({
  value,
  onChange,
  placeholder,
  maxWidth = 340,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxWidth?: number
}) {
  return (
    <div style={{ position: "relative", flex: 1, maxWidth }}>
      <svg
        style={{
          position: "absolute",
          left: 11,
          top: "50%",
          transform: "translateY(-50%)",
          color: T.fg4,
          pointerEvents: "none",
        }}
        viewBox="0 0 24 24"
        width={15}
        height={15}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
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

// ─── DataRow / SectionTitle ──────────────────────────────────────────────────

export function CtrlDataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${T.borderSoft}`,
        padding: "11px 0",
        fontFamily: T.ui,
        fontSize: 13.5,
      }}
    >
      <span style={{ color: T.fg3 }}>{label}</span>
      <span style={{ color: T.fg, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  )
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <Kicker cyan>{children}</Kicker>
      {action}
    </div>
  )
}

// ─── TextInput / SelectInput / CtrlField ─────────────────────────────────────

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        height: 38,
        padding: "0 12px",
        background: T.surface,
        border: `1px solid ${T.borderStrong}`,
        borderRadius: 8,
        color: T.fg,
        fontFamily: T.ui,
        fontSize: 13.5,
        outline: "none",
        opacity: disabled ? 0.55 : 1,
      }}
    />
  )
}

export function SelectInput({
  value,
  onChange,
  children,
  width,
}: {
  value: string
  onChange?: (v: string) => void
  children: ReactNode
  width?: number | string
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        height: 38,
        padding: "0 10px",
        background: T.surface,
        border: `1px solid ${T.borderStrong}`,
        borderRadius: 8,
        color: T.fg,
        fontFamily: T.ui,
        fontSize: 13.5,
        outline: "none",
        cursor: "pointer",
        width,
      }}
    >
      {children}
    </select>
  )
}

export function CtrlField({
  label,
  hint,
  children,
  span,
}: {
  label: string
  hint?: string
  children: ReactNode
  span?: number
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        gridColumn: span ? `span ${span}` : "auto",
      }}
    >
      <Label>{label}</Label>
      {children}
      {hint && (
        <span style={{ fontFamily: T.ui, fontSize: 12, color: T.fg4, lineHeight: 1.5 }}>
          {hint}
        </span>
      )}
    </div>
  )
}

// ─── TelemetryStamp ──────────────────────────────────────────────────────────

export function TelemetryStamp({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: ReactNode
  label: string
  value: string
  tone?: Tone
}) {
  const toneColor =
    tone === "ok" ? T.ok : tone === "warn" ? T.warn : tone === "bad" ? T.bad : T.brand
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 8,
        background: T.surfaceAlt,
        border: `1px solid ${T.border}`,
      }}
    >
      <span style={{ color: toneColor, display: "flex" }}>{icon}</span>
      <span
        style={{
          fontFamily: T.ui,
          fontSize: 10,
          fontWeight: 600,
          color: T.fg4,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 12,
          fontWeight: 600,
          color: toneColor,
          letterSpacing: "0.02em",
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── StatCard (KPI) ────────────────────────────────────────────────────────────

export function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "cyan",
  onClick,
}: {
  icon: ReactNode
  label: string
  value: string | number
  sub?: string
  tone?: "cyan" | "ok" | "warn" | "bad"
  onClick?: () => void
}) {
  const colors = { cyan: T.brand, ok: T.ok, warn: T.warn, bad: T.bad }
  const softs = { cyan: T.brandSoft, ok: T.okS, warn: T.warnS, bad: T.badS }
  const c = colors[tone]
  const s = softs[tone]
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        boxShadow: T.shadow1,
        padding: "18px 18px 16px",
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        flex: 1,
        minWidth: 160,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <span
          style={{
            fontFamily: T.ui,
            fontSize: 13,
            fontWeight: 500,
            color: T.fg2,
          }}
        >
          {label}
        </span>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: s,
            color: c,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 600, color: T.fg, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: T.ui, fontSize: 12.5, color: T.fg3, marginTop: 6 }}>
          {sub}
        </div>
      )}
    </button>
  )
}

// ─── UsageBar ────────────────────────────────────────────────────────────────

export function UsageBar({
  value,
  max,
}: {
  value: number
  max: number | null | undefined
}) {
  const cap = max ?? 0
  const pct = Math.min(100, cap > 0 ? (value / cap) * 100 : 0)
  const tone = pct >= 95 ? T.bad : pct >= 80 ? T.warn : T.brand
  return (
    <div>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 13,
          fontWeight: 600,
          color: T.fg,
          marginBottom: 4,
        }}
      >
        {value}
        <span style={{ color: T.fg4 }}>/{cap || "∞"}</span>
      </div>
      <div
        style={{
          height: 4,
          background: T.muteLine,
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: tone,
          }}
        />
      </div>
    </div>
  )
}

// ─── FilterPills ─────────────────────────────────────────────────────────────

export function FilterPill({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 32,
        padding: "0 14px",
        borderRadius: 999,
        cursor: "pointer",
        border: active ? `1px solid ${T.brandStrong}` : `1px solid ${T.borderStrong}`,
        background: active ? T.brandStrong : T.surface,
        color: active ? "#FFFFFF" : T.fg3,
        fontFamily: T.ui,
        fontSize: 12.5,
        fontWeight: 500,
        letterSpacing: "0",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
      {typeof count === "number" && count > 0 && (
        <span
          style={{
            background: active ? "rgba(255,255,255,0.25)" : T.brandSoft,
            color: active ? "#FFFFFF" : T.brand,
            borderRadius: 999,
            padding: "1px 6px",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
