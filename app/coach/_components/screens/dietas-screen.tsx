"use client"

import { useMemo, useState } from "react"
import { Utensils } from "lucide-react"
import { useCockpit } from "../cockpit-context"
import { studentRisk, relativeTime } from "../utils"
import { RiskBadge } from "../ui"
import type { AdminStudent } from "@/lib/api/admin"

type QueueFilter = "todos" | "critico" | "atencao" | "sem-sinal"

function StudentDietRow({ student }: { student: AdminStudent }) {
  const { openStudent } = useCockpit()
  const risk = studentRisk(student)

  return (
    <button
      type="button"
      onClick={() => void openStudent(student, "dieta")}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/7 bg-white/[0.035] px-4 py-4 text-left transition hover:border-[#00e5ff]/30 hover:bg-white/[0.05]"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="truncate font-bold text-white">{student.name}</span>
          <RiskBadge level={risk} />
        </div>
        <p className="font-mono text-[10px] text-white/30">
          {student.lastValidationAt
            ? `última validação ${relativeTime(student.lastValidationAt)}`
            : student.lastActiveAt
            ? `visto ${relativeTime(student.lastActiveAt)}`
            : "sem sinal de atividade"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden font-mono text-[11px] text-white/30 sm:block">
          {student.monthlyXp} XP / mês
        </span>
        <span className="rounded-md border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#00e5ff]">
          Editar dieta ›
        </span>
      </div>
    </button>
  )
}

export function DietasScreen() {
  const { students } = useCockpit()
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("todos")

  const ativos = useMemo(() => students.filter((s) => s.active && !s.archived), [students])

  const sorted = useMemo(() => {
    const order: Record<string, number> = { critico: 0, atencao: 1, "sem-sinal": 2, ok: 3 }
    const filtered =
      queueFilter === "todos"
        ? ativos
        : ativos.filter((s) => studentRisk(s) === queueFilter)
    return [...filtered].sort(
      (a, b) => (order[studentRisk(a)] ?? 9) - (order[studentRisk(b)] ?? 9)
    )
  }, [ativos, queueFilter])

  const counts = useMemo(() => ({
    critico: ativos.filter((s) => studentRisk(s) === "critico").length,
    atencao: ativos.filter((s) => studentRisk(s) === "atencao").length,
    "sem-sinal": ativos.filter((s) => studentRisk(s) === "sem-sinal").length,
  }), [ativos])

  const FILTERS: { id: QueueFilter; label: string; count?: number }[] = [
    { id: "todos", label: "Todos" },
    { id: "critico", label: "Críticos", count: counts.critico },
    { id: "atencao", label: "Atenção", count: counts.atencao },
    { id: "sem-sinal", label: "Sem sinal", count: counts["sem-sinal"] },
  ]

  return (
    <div className="p-5">
      <div className="mb-2">
        <p className="text-[11px] text-white/35">
          Alunos ordenados por urgência. Clique para editar a dieta diretamente.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setQueueFilter(id)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${
              queueFilter === id
                ? "border-[#00e5ff] bg-[#00e5ff] text-[#0a0f1e]"
                : "border-white/10 bg-white/5 text-white/40 hover:text-white"
            }`}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span
                className={`rounded-full px-1.5 text-[9px] font-black ${
                  queueFilter === id ? "bg-[#0a0f1e] text-[#00e5ff]" : "bg-white/10"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-16 text-center">
          <Utensils className="mx-auto mb-3 h-8 w-8 text-white/20" />
          <p className="text-sm text-white/35">Nenhum aluno nesta fila.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {sorted.map((student) => (
            <StudentDietRow key={student.userId} student={student} />
          ))}
        </div>
      )}
    </div>
  )
}
