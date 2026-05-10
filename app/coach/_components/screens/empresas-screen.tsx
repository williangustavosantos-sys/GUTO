"use client"

import { useMemo, useState } from "react"
import { useCockpit } from "../cockpit-context"
import { T, planLabel, teamStatusLabel, teamStatusTone } from "../control-tokens"
import { Plate, Pill, SearchBox, FilterPill, UsageBar } from "../controls"
import { studentRisk } from "../utils"
import { ChevronRight } from "lucide-react"
import type { AdminTeam } from "@/lib/api/admin"

const FILTERS: { id: "todas" | "active" | "paused" | "archived"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "active", label: "Ativas" },
  { id: "paused", label: "Pausadas" },
  { id: "archived", label: "Arquivadas" },
]

export function EmpresasScreen() {
  const { teams, students, coaches, openEmpresa } = useCockpit()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("todas")

  const list = useMemo(() => {
    let l: AdminTeam[] = [...teams]
    if (filter !== "todas") l = l.filter((t) => t.status === filter)
    if (search) {
      const q = search.toLowerCase()
      l = l.filter((t) => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
    }
    return l
  }, [teams, search, filter])

  // dataset agregado para a row (count alunos/coaches/críticos da empresa)
  const empresaStats = useMemo(() => {
    const stats: Record<string, { students: number; coaches: number; critical: number }> = {}
    for (const t of teams) {
      const teamStudents = students.filter((s) => s.teamId === t.id)
      stats[t.id] = {
        students: teamStudents.length,
        coaches: coaches.filter((c) => c.teamId === t.id).length,
        critical: teamStudents.filter((s) => studentRisk(s) === "critico").length,
      }
    }
    return stats
  }, [teams, students, coaches])

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar empresa…" />
        <div style={{ display: "flex", gap: 6 }}>
          {FILTERS.map((f) => (
            <FilterPill key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(180px,2fr) 110px 80px 110px 110px 90px auto",
          gap: 14,
          padding: "0 18px 8px",
          fontFamily: T.mono,
          fontSize: 8,
          color: T.fg4,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        <span>EMPRESA / ID</span>
        <span>STATUS</span>
        <span>PLANO</span>
        <span>ALUNOS</span>
        <span>COACHES</span>
        <span>CRÍTICOS</span>
        <span></span>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {list.map((team) => {
          const stats = empresaStats[team.id] ?? { students: 0, coaches: 0, critical: 0 }
          return (
            <button
              key={team.id}
              onClick={() => openEmpresa(team)}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(180px,2fr) 110px 80px 110px 110px 90px auto",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                background: T.panel,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    color: T.fg,
                    marginBottom: 3,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {team.name}
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 10,
                    color: T.fg3,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {team.id}
                </div>
              </div>
              <Pill tone={teamStatusTone(team.status)}>{teamStatusLabel(team.status)}</Pill>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  color: T.fg2,
                  fontWeight: 900,
                  letterSpacing: "0.16em",
                }}
              >
                {planLabel(team.plan)}
              </span>
              <UsageBar value={stats.students} max={team.customLimits?.maxStudents ?? null} />
              <UsageBar value={stats.coaches} max={team.customLimits?.maxCoaches ?? null} />
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 12,
                  fontWeight: 900,
                  color: stats.critical > 0 ? T.bad : T.fg3,
                }}
              >
                {stats.critical}
              </span>
              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: `1px solid ${T.cyanLine}`,
                  background: T.cyanSoft,
                  fontFamily: T.mono,
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  color: T.cyan,
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Abrir <ChevronRight className="h-3 w-3" />
              </span>
            </button>
          )
        })}

        {!list.length && (
          <Plate style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg3 }}>
              Nenhuma empresa encontrada.
            </p>
          </Plate>
        )}
      </div>

      {/* Aviso campos pendentes */}
      <Plate
        dp
        style={{
          marginTop: 18,
          padding: "12px 16px",
          borderColor: "rgba(251,191,36,0.20)",
        }}
      >
        <p
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            color: T.fg3,
            letterSpacing: "0.10em",
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: T.warn, fontWeight: 900, letterSpacing: "0.20em" }}>
            ENDPOINT PENDENTE
          </span>{" "}
          · país, responsável, e-mail do responsável e última atividade chegam no PR{" "}
          <strong style={{ color: T.cyan }}>#3</strong> (mudança no schema do <code>Team</code>).
        </p>
      </Plate>
    </div>
  )
}
