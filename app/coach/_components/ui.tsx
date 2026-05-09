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
    <section className={`rounded-xl border border-white/8 bg-white/[0.035] p-4 ${className}`}>
      <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-[#00e5ff]">
        {title}
      </h3>
      {children}
    </section>
  )
}

// ─── DataRow ──────────────────────────────────────────────────────────────────

export function DataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] py-2.5 last:border-0">
      <span className="text-xs text-white/35">{label}</span>
      <div className="text-right text-xs font-bold text-white">{value}</div>
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
      className={`h-11 justify-center border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10 ${
        danger ? "border-red-500/30 text-red-300 hover:bg-red-500 hover:text-white" : ""
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
      <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">
        {label}
      </span>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/25"
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
      <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-white/20">{label}</p>
      <p
        className={`overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs font-bold ${
          cyan ? "text-[#00e5ff]" : "text-white/60"
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
  if (!logs.length) return <p className="text-sm text-white/35">{empty}</p>
  return (
    <div className="grid gap-2">
      {logs.slice(0, 80).map((log, index) => (
        <div
          key={log.id || index}
          className="rounded-lg border border-white/7 bg-black/15 p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-white">
              {log.action || "ação"}
            </span>
            <span className="font-mono text-[10px] text-white/35">
              {log.timestamp ? new Date(log.timestamp).toLocaleString("pt-BR") : "-"}
            </span>
          </div>
          <p className="mt-1 font-mono text-[10px] text-white/35">
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
      <Badge variant="outline" className="border-[#00e5ff]/35 text-[#00e5ff]">
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
            className="flex items-center justify-between rounded-lg bg-black/15 p-3"
          >
            <div>
              <p className="font-bold text-white">
                {item.position}º {item.pairName}
              </p>
              <p className="font-mono text-[10px] text-white/35">
                {avatarStageLabel(item.avatarStage)}
                {showStreak && item.currentStreak ? ` · ${item.currentStreak}d` : ""}
              </p>
            </div>
            <p className="font-mono text-sm font-black text-[#00e5ff]">{item.xp} XP</p>
          </div>
        ))}
        {!items.length && <p className="text-sm text-white/35">Sem ranking.</p>}
      </div>
    </Panel>
  )
}

// ─── RiskBadge ────────────────────────────────────────────────────────────────

import type { RiskLevel } from "./utils"

export function RiskBadge({ level }: { level: RiskLevel }) {
  if (level === "ok") return null
  const config = {
    atencao: { label: "ATENÇÃO", cls: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300" },
    critico: { label: "CRÍTICO", cls: "border-red-500/40 bg-red-500/10 text-red-300" },
    "sem-sinal": { label: "SEM SINAL", cls: "border-white/20 bg-white/5 text-white/40" },
  }
  const { label, cls } = config[level]
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${cls}`}>
      {label}
    </span>
  )
}
