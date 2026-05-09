"use client"

import { useMemo } from "react"
import { AlertTriangle, CheckCircle2, Users, Zap } from "lucide-react"
import { useCockpit } from "../cockpit-context"
import { studentRisk, relativeTime } from "../utils"
import { RiskBadge } from "../ui"

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent?: "cyan" | "yellow" | "red" | "green"
  onClick?: () => void
}) {
  const accentCls = {
    cyan: "border-[#00e5ff]/25 bg-[#00e5ff]/5",
    yellow: "border-yellow-500/25 bg-yellow-500/5",
    red: "border-red-500/25 bg-red-500/5",
    green: "border-emerald-500/25 bg-emerald-500/5",
  }[accent ?? "cyan"]

  const valueCls = {
    cyan: "text-[#00e5ff]",
    yellow: "text-yellow-300",
    red: "text-red-300",
    green: "text-emerald-300",
  }[accent ?? "cyan"]

  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className={`rounded-xl border p-5 text-left transition ${accentCls} ${
        onClick ? "cursor-pointer hover:brightness-110" : "cursor-default"
      }`}
    >
      <div className="mb-3 flex items-center gap-2 text-white/40">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-3xl font-black ${valueCls}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-white/30">{sub}</p>}
    </button>
  )
}

function RiskRow({ student }: { student: ReturnType<typeof useCockpit>["students"][number] }) {
  const { openStudent } = useCockpit()
  const risk = studentRisk(student)
  const lastSeen = relativeTime(student.lastValidationAt ?? student.lastActiveAt)

  return (
    <button
      type="button"
      onClick={() => void openStudent(student, "resumo")}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/7 bg-white/[0.03] px-4 py-3 text-left transition hover:border-[#00e5ff]/30 hover:bg-white/[0.05]"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">{student.name}</p>
        <p className="font-mono text-[10px] text-white/30">
          {student.lastValidationAt
            ? `último treino ${lastSeen}`
            : student.lastActiveAt
            ? `visto ${lastSeen}`
            : "sem sinal recente"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden font-mono text-xs text-white/30 sm:block">
          {student.weeklyXp} XP semana
        </span>
        <RiskBadge level={risk} />
        <span className="text-white/20">›</span>
      </div>
    </button>
  )
}

export function HojeScreen() {
  const { students, setActiveScreen, setFilter, openStudent } = useCockpit()

  const todayStr = new Date().toISOString().split("T")[0]

  const stats = useMemo(() => {
    const ativos = students.filter((s) => s.active && !s.archived)
    const validatedToday = ativos.filter((s) => s.lastValidationAt?.startsWith(todayStr))
    const criticos = ativos.filter((s) => studentRisk(s) === "critico")
    const atencao = ativos.filter((s) => studentRisk(s) === "atencao")
    const semSinal = ativos.filter((s) => studentRisk(s) === "sem-sinal")
    return { ativos, validatedToday, criticos, atencao, semSinal }
  }, [students, todayStr])

  const priorityList = useMemo(
    () =>
      [
        ...stats.criticos,
        ...stats.atencao,
        ...stats.semSinal,
      ].slice(0, 12),
    [stats]
  )

  const goToRisk = () => {
    setFilter("ativos")
    setActiveScreen("students")
  }

  return (
    <div className="p-5">
      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Alunos ativos"
          value={stats.ativos.length}
          sub="com acesso liberado"
          accent="cyan"
          onClick={() => setActiveScreen("students")}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Treinos hoje"
          value={stats.validatedToday.length}
          sub="validações no dia"
          accent="green"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Atenção"
          value={stats.atencao.length}
          sub="3–6 dias sem treinar"
          accent="yellow"
          onClick={goToRisk}
        />
        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label="Críticos"
          value={stats.criticos.length}
          sub="7+ dias sem treinar"
          accent="red"
          onClick={goToRisk}
        />
      </div>

      {/* Priority list */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30">
          Precisam de atenção agora
        </h2>
        {(stats.criticos.length + stats.atencao.length + stats.semSinal.length) > 12 && (
          <button
            onClick={goToRisk}
            className="text-[10px] font-bold text-[#00e5ff] hover:underline"
          >
            Ver todos
          </button>
        )}
      </div>

      {priorityList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-400/40" />
          <p className="text-sm font-bold text-white/40">Todos os alunos estão em dia.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {priorityList.map((student) => (
            <RiskRow key={student.userId} student={student} />
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-6">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/30">
          Ações rápidas
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveScreen("treinos")}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white"
          >
            Ver fila de treinos
          </button>
          <button
            onClick={() => setActiveScreen("dietas")}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white"
          >
            Ver fila de dietas
          </button>
          <button
            onClick={() => setActiveScreen("arena")}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/60 hover:bg-white/10 hover:text-white"
          >
            Ver ranking Arena
          </button>
        </div>
      </div>
    </div>
  )
}
