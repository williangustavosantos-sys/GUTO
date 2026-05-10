"use client"

import type { CSSProperties, ReactNode } from "react"
import { T, TONE_MAP, type Tone } from "./control-tokens"

/**
 * Sala de Controle — Atomic components
 *
 * Mirrors the atoms from ~/Downloads/guto-design-system/project/coach-panel/sala-shell.jsx
 * (Plate, Kicker, Label, Pill, Btn, SearchBox, DataRow, SectionTitle, Field,
 * TextInput, SelectInput) translated to typed React + the project's CSS-in-JS
 * conventions.
 *
 * The legacy ui.tsx atoms (Panel, ActionButton, Field, etc.) remain untouched
 * so we don't break older screens during the migration.
 */

// ─── Plate ────────────────────────────────────────────────────────────────────

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
        background: dp ? T.panelDp : hi ? T.panelHi : T.panel,
        border: `1px solid ${glow ? T.cyanLine : T.border}`,
        borderRadius: 14,
        boxShadow: glow
          ? `0 0 28px rgba(82,231,255,0.15), inset 0 0 0 1px ${T.cyanLine}`
          : "0 4px 20px rgba(0,0,0,0.35)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
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
        fontFamily: T.mono,
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: cyan ? T.cyan : T.fg3,
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
        fontFamily: T.mono,
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: T.fg3,
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
        gap: 5,
        height: 20,
        padding: "0 9px",
        borderRadius: 999,
        background: p.bg,
        color: p.fg,
        border: `1px solid ${p.bd}`,
        fontFamily: T.mono,
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
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
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        height: sm ? 34 : 40,
        padding: `0 ${sm ? 12 : 16}px`,
        borderRadius: 999,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        background: cyan
          ? "linear-gradient(135deg,#7df0ff,#1ec5e0)"
          : ghost
            ? "transparent"
            : danger
              ? T.badS
              : "rgba(232,244,255,0.07)",
        color: cyan ? "#04131e" : danger ? T.bad : T.fg,
        border: cyan
          ? "1px solid transparent"
          : ghost
            ? `1px solid ${T.cyanLine}`
            : danger
              ? "1px solid rgba(248,113,113,0.30)"
              : `1px solid ${T.border}`,
        fontFamily: T.mono,
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: "0.20em",
        textTransform: "uppercase",
        boxShadow: cyan ? "0 0 18px rgba(82,231,255,0.28)" : "none",
        transition: "all 160ms ease",
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
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: T.fg3,
          pointerEvents: "none",
        }}
        viewBox="0 0 24 24"
        width={14}
        height={14}
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
          paddingLeft: 36,
          paddingRight: 14,
          background: "rgba(0,0,0,0.30)",
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.45)",
          fontFamily: T.mono,
          fontSize: 12,
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
        borderBottom: `1px solid ${T.border}`,
        padding: "10px 0",
        fontFamily: T.mono,
        fontSize: 11,
      }}
    >
      <span style={{ color: T.fg3 }}>{label}</span>
      <span style={{ color: T.fg, fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>{value}</span>
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
        height: 40,
        padding: "0 14px",
        background: "rgba(0,0,0,0.35)",
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        boxShadow: "inset 0 2px 6px rgba(0,0,0,0.45)",
        color: T.fg,
        fontFamily: T.mono,
        fontSize: 12,
        outline: "none",
        opacity: disabled ? 0.5 : 1,
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
        padding: "0 12px",
        background: "rgba(0,0,0,0.35)",
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        boxShadow: "inset 0 2px 6px rgba(0,0,0,0.45)",
        color: T.fg,
        fontFamily: T.mono,
        fontSize: 12,
        outline: "none",
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
        <span style={{ fontFamily: T.mono, fontSize: 9, color: T.fg4, lineHeight: 1.5 }}>
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
    tone === "ok" ? T.ok : tone === "warn" ? T.warn : tone === "bad" ? T.bad : T.cyan
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.35)",
        border: `1px solid ${T.border}`,
      }}
    >
      <span style={{ color: toneColor, display: "flex" }}>{icon}</span>
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 8,
          fontWeight: 900,
          color: T.fg4,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 10,
          fontWeight: 900,
          color: toneColor,
          letterSpacing: "0.04em",
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── StatCard ────────────────────────────────────────────────────────────────

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
  const colors = { cyan: T.cyan, ok: T.ok, warn: T.warn, bad: T.bad }
  const softs = { cyan: T.cyanSoft, ok: T.okS, warn: T.warnS, bad: T.badS }
  const c = colors[tone]
  const s = softs[tone]
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        background: s,
        border: `1px solid ${c}28`,
        borderRadius: 16,
        padding: "18px 18px 16px",
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        flex: 1,
        minWidth: 160,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: `${c}99`, marginBottom: 10 }}>
        {icon}
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 32, fontWeight: 900, color: c, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: T.mono, fontSize: 10, color: `${c}70`, marginTop: 6 }}>
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
  const tone = pct >= 95 ? T.bad : pct >= 80 ? T.warn : T.cyan
  return (
    <div>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 11,
          fontWeight: 700,
          color: T.fg,
          marginBottom: 4,
        }}
      >
        {value}
        <span style={{ color: T.fg4 }}>/{cap || "∞"}</span>
      </div>
      <div
        style={{
          height: 3,
          background: "rgba(0,0,0,0.4)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: tone,
            boxShadow: `0 0 6px ${tone}`,
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
        border: active ? `1px solid ${T.cyan}` : `1px solid ${T.border}`,
        background: active ? T.cyan : "transparent",
        color: active ? "#04131e" : T.fg3,
        fontFamily: T.mono,
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
      {typeof count === "number" && count > 0 && (
        <span
          style={{
            background: active ? "rgba(4,19,30,0.3)" : T.cyanSoft,
            color: active ? "#04131e" : T.cyan,
            borderRadius: 999,
            padding: "1px 6px",
            fontSize: 8,
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
