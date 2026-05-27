"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { type RankingItem, avatarStageLabel, sourceLabel } from "./utils"

// ─── Panel ────────────────────────────────────────────────────────────────────

export function Panel({
  title,
  children,
  className = "",
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.10em] text-[#0E7490]">
        {title}
      </h3>
      {children}
    </section>
  )
}

// ─── DataRow ──────────────────────────────────────────────────────────────────

export function DataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="text-right text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

export function ActionButton({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={`h-11 justify-center border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 ${
        danger ? "border-red-300 text-red-600 hover:bg-red-600 hover:text-white" : ""
      }`}
    >
      {children}
    </Button>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

export function Field({
  label,
  value,
  onChange,
  className = "",
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
  type?: string
  placeholder?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[12.5px] font-medium text-slate-600">
        {label}
      </span>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
      />
    </label>
  )
}

// ─── Metric ───────────────────────────────────────────────────────────────────

export function Metric({
  label,
  value,
  cyan,
}: {
  label: string
  value: ReactNode
  cyan?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p
        className={`overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm font-semibold ${
          cyan ? "text-[#0E7490]" : "text-slate-700"
        }`}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </p>
    </div>
  )
}

// ─── LogList ──────────────────────────────────────────────────────────────────

import type { AdminLog } from "@/lib/api/admin"

export function LogList({ logs, empty }: { logs: AdminLog[]; empty: string }) {
  if (!logs.length) return <p className="text-sm text-slate-500">{empty}</p>
  return (
    <div className="grid gap-2">
      {logs.slice(0, 80).map((log, index) => (
        <div
          key={log.id || index}
          className="rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              {log.action || "ação"}
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {log.timestamp ? new Date(log.timestamp).toLocaleString("pt-BR") : "-"}
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-slate-400">
            {log.actorRole || "-"} · {log.actorUserId || "-"}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── PlanStatus ───────────────────────────────────────────────────────────────

export function PlanStatus({ source, locked }: { source?: string; locked?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className="border-[#0E7490]/40 text-[#0E7490]">
        {sourceLabel(source)}
      </Badge>
      <Badge variant={locked ? "default" : "secondary"}>
        {locked ? "Bloqueado contra GUTO" : "GUTO pode atualizar"}
      </Badge>
    </div>
  )
}

// ─── RankingSection ───────────────────────────────────────────────────────────

export function RankingSection({
  title,
  items,
  showStreak,
}: {
  title: string
  items: RankingItem[]
  showStreak?: boolean
}) {
  return (
    <Panel title={title}>
      <div className="grid gap-2">
        {items.map((item) => (
          <div
            key={item.userId}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <div>
              <p className="font-semibold text-slate-900">
                {item.position}º {item.pairName}
              </p>
              <p className="font-mono text-[11px] text-slate-400">
                {avatarStageLabel(item.avatarStage)}
                {showStreak && item.currentStreak ? ` · ${item.currentStreak}d` : ""}
              </p>
            </div>
            <p className="font-mono text-sm font-semibold text-[#0E7490]">{item.xp} XP</p>
          </div>
        ))}
        {!items.length && <p className="text-sm text-slate-500">Sem ranking.</p>}
      </div>
    </Panel>
  )
}

// ─── RiskBadge ────────────────────────────────────────────────────────────────

import type { RiskLevel } from "./utils"

export function RiskBadge({ level }: { level: RiskLevel }) {
  if (level === "ok") return null
  const config = {
    atencao: { label: "ATENÇÃO", cls: "border-amber-300 bg-amber-50 text-amber-700" },
    critico: { label: "CRÍTICO", cls: "border-red-300 bg-red-50 text-red-700" },
    "sem-sinal": { label: "SEM SINAL", cls: "border-slate-300 bg-slate-100 text-slate-500" },
  }
  const { label, cls } = config[level]
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}
