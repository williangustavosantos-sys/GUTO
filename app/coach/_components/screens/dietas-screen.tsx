"use client"

import { useMemo, useState } from "react"
import { UtensilsCrossed } from "lucide-react"
import { useCockpit } from "../cockpit-context"
import { T } from "../control-tokens"
import { Plate, Pill, FilterPill } from "../controls"
import { studentRisk, relativeTime, coachLabel, type RiskLevel } from "../utils"
import type { AdminStudent } from "@/lib/api/admin"

type QueueFilter = "todos" | "critico" | "atencao" | "sem-sinal"

function riskTone(risk: RiskLevel): "ok" | "warn" | "bad" | "mute" {
  return risk === "critico" ? "bad" : risk === "atencao" ? "warn" : risk === "sem-sinal" ? "mute" : "ok"
}
function riskLabel(risk: RiskLevel): string {
  return risk === "critico" ? "CRÍTICO" : risk === "atencao" ? "ATENÇÃO" : risk === "sem-sinal" ? "SEM SINAL" : "EM DIA"
}

export function DietasScreen() {
  const { students, coaches, openStudent } = useCockpit()
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("todos")

  const ativos = useMemo(() => students.filter((s) => s.active && !s.archived), [students])

  const sorted = useMemo(() => {
    const order: Record<string, number> = { critico: 0, atencao: 1, "sem-sinal": 2, ok: 3 }
    const filtered =
      queueFilter === "todos" ? ativos : ativos.filter((s) => studentRisk(s) === queueFilter)
    return [...filtered].sort((a, b) => (order[studentRisk(a)] ?? 9) - (order[studentRisk(b)] ?? 9))
  }, [ativos, queueFilter])

  const counts = useMemo(
    () => ({
      critico: ativos.filter((s) => studentRisk(s) === "critico").length,
      atencao: ativos.filter((s) => studentRisk(s) === "atencao").length,
      "sem-sinal": ativos.filter((s) => studentRisk(s) === "sem-sinal").length,
    }),
    [ativos]
  )

  const FILTERS: { id: QueueFilter; label: string; count?: number }[] = [
    { id: "todos", label: "Todos" },
    { id: "critico", label: "Críticos", count: counts.critico },
    { id: "atencao", label: "Atenção", count: counts.atencao },
    { id: "sem-sinal", label: "Sem sinal", count: counts["sem-sinal"] },
  ]

  return (
    <div style={{ padding: "24px 28px" }}>
      <p style={{ fontFamily: T.mono, fontSize: 11, color: T.fg3, marginBottom: 14 }}>
        Alunos ordenados por urgência. Clique para abrir direto na aba Dieta.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map(({ id, label, count }) => (
          <FilterPill key={id} active={queueFilter === id} onClick={() => setQueueFilter(id)} count={count}>
            {label}
          </FilterPill>
        ))}
      </div>

      {sorted.length === 0 ? (
        <Plate style={{ padding: 48, textAlign: "center" }}>
          <UtensilsCrossed className="mx-auto mb-3 h-7 w-7" style={{ color: T.fg4 }} />
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg3 }}>
            Nenhum aluno nesta fila.
          </p>
        </Plate>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sorted.map((s) => (
            <QueueRow key={s.userId} student={s} coachName={coachLabel(s, coaches)} />
          ))}
        </div>
      )}
    </div>
  )

  function QueueRow({ student, coachName }: { student: AdminStudent; coachName: string }) {
    const risk = studentRisk(student)
    return (
      <button
        onClick={() => openStudent(student, "dieta")}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          padding: "14px 18px",
          background: T.panel,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
            <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.fg }}>
              {student.name}
            </span>
            <Pill tone={riskTone(risk)}>{riskLabel(risk)}</Pill>
          </div>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3 }}>
            {student.lastValidationAt
              ? `última validação ${relativeTime(student.lastValidationAt)}`
              : "sem sinal"}
            {" · "}
            {coachName}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3 }}>
            {student.monthlyXp} XP
          </span>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${T.cyanLine}`,
              background: T.cyanSoft,
              fontFamily: T.mono,
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: "0.18em",
              color: T.cyan,
              textTransform: "uppercase",
            }}
          >
            Editar dieta ›
          </span>
        </div>
      </button>
    )
  }
}
