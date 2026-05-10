"use client"

import { useMemo, useState } from "react"
import { ChevronRight, Shield, Trash2 } from "lucide-react"
import { updateAdminCoach, deleteAdminCoach } from "@/lib/api/admin"
import { useCockpit } from "../cockpit-context"
import { T } from "../control-tokens"
import { Plate, Pill, Btn, Kicker, SearchBox, FilterPill, SelectInput } from "../controls"
import { studentRisk } from "../utils"

const STATUS_FILTERS = [
  { id: "todos" as const, label: "Todos" },
  { id: "ativos" as const, label: "Ativos" },
  { id: "pausados" as const, label: "Pausados" },
]

export function CoachesScreen() {
  const {
    coaches,
    setCoaches,
    students,
    teams,
    acting,
    act,
    isSuperAdmin,
    openCoach,
  } = useCockpit()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["id"]>("ativos")
  const [empresaFilter, setEmpresaFilter] = useState("")

  const list = useMemo(() => {
    let l = coaches
    if (statusFilter === "ativos") l = l.filter((c) => c.active)
    if (statusFilter === "pausados") l = l.filter((c) => !c.active)
    if (empresaFilter) l = l.filter((c) => c.teamId === empresaFilter)
    if (search) {
      const q = search.toLowerCase()
      l = l.filter(
        (c) =>
          (c.name ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          c.userId.toLowerCase().includes(q)
      )
    }
    return l
  }, [coaches, statusFilter, empresaFilter, search])

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Permissions banner */}
      <Plate dp style={{ padding: "16px 20px" }}>
        <Kicker cyan style={{ display: "block", marginBottom: 10 }}>
          PERMISSÕES DO COACH (OPERADOR LIMITADO)
        </Kicker>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8,
            fontFamily: T.mono,
            fontSize: 10,
            color: T.fg2,
          }}
        >
          <PermLine ok>Ver alunos atribuídos</PermLine>
          <PermLine ok>Sugerir exercício / alimento</PermLine>
          <PermLine ok>Ajustar treino / dieta dos seus alunos</PermLine>
          <PermLine no>Aprovar exercício / alimento</PermLine>
          <PermLine no>Criar empresa / time</PermLine>
          <PermLine no>Controlar outros coaches</PermLine>
        </div>
      </Plate>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar coach…" />
        <div style={{ display: "flex", gap: 6 }}>
          {STATUS_FILTERS.map((f) => (
            <FilterPill key={f.id} active={statusFilter === f.id} onClick={() => setStatusFilter(f.id)}>
              {f.label}
            </FilterPill>
          ))}
        </div>
        {isSuperAdmin && (
          <SelectInput value={empresaFilter} onChange={setEmpresaFilter}>
            <option value="" style={{ background: T.ink }}>
              Todas as empresas
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} style={{ background: T.ink }}>
                {t.name}
              </option>
            ))}
          </SelectInput>
        )}
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((coach) => {
          const myStudents = students.filter((s) => s.coachId === coach.userId)
          const criticos = myStudents.filter((s) => studentRisk(s) === "critico").length
          const team = teams.find((t) => t.id === coach.teamId)

          return (
            <Plate key={coach.userId} style={{ padding: "16px 20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <button
                  onClick={() => openCoach(coach)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    flex: 1,
                    minWidth: 0,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: T.cyanSoft,
                      border: `1px solid ${T.cyanLine}`,
                      display: "grid",
                      placeItems: "center",
                      color: T.cyan,
                      flexShrink: 0,
                    }}
                  >
                    <Shield className="h-4 w-4" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: T.mono,
                        fontSize: 13,
                        fontWeight: 900,
                        color: T.fg,
                        marginBottom: 3,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {coach.name || coach.email || coach.userId}
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3 }}>
                      {coach.email || "—"}
                      {team && ` · ${team.name}`}
                    </div>
                  </div>
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: T.mono,
                        fontSize: 8,
                        color: T.fg4,
                        letterSpacing: "0.20em",
                      }}
                    >
                      ALUNOS
                    </div>
                    <div
                      style={{
                        fontFamily: T.mono,
                        fontSize: 14,
                        fontWeight: 900,
                        color: T.cyan,
                      }}
                    >
                      {myStudents.length}
                    </div>
                  </div>
                  {criticos > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 8,
                          color: T.fg4,
                          letterSpacing: "0.20em",
                        }}
                      >
                        CRÍT.
                      </div>
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 14,
                          fontWeight: 900,
                          color: T.bad,
                        }}
                      >
                        {criticos}
                      </div>
                    </div>
                  )}
                  <Pill tone={coach.active ? "ok" : "mute"}>
                    {coach.active ? "ATIVO" : "PAUSADO"}
                  </Pill>
                  <Btn
                    ghost
                    sm
                    disabled={acting}
                    onClick={() =>
                      void act(async () => {
                        const next = await updateAdminCoach(coach.userId, { active: !coach.active })
                        setCoaches((prev) =>
                          prev.map((c) => (c.userId === coach.userId ? next.coach : c))
                        )
                      }, coach.active ? "Coach pausado." : "Coach ativado.")
                    }
                  >
                    {coach.active ? "Pausar" : "Ativar"}
                  </Btn>
                  <Btn
                    danger
                    sm
                    disabled={acting}
                    onClick={() => {
                      if (!window.confirm("Excluir coach? Reatribua alunos antes.")) return
                      void act(async () => {
                        await deleteAdminCoach(coach.userId)
                        setCoaches((prev) => prev.filter((c) => c.userId !== coach.userId))
                      }, "Coach excluído.")
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Btn>
                  <button
                    onClick={() => openCoach(coach)}
                    style={{
                      background: "none",
                      border: "none",
                      color: T.fg4,
                      cursor: "pointer",
                      padding: 4,
                    }}
                    aria-label="Abrir coach"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Plate>
          )
        })}

        {!list.length && (
          <Plate style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg3 }}>
              Nenhum coach encontrado.
            </p>
          </Plate>
        )}
      </div>
    </div>
  )
}

function PermLine({
  children,
  ok,
  no,
}: {
  children: React.ReactNode
  ok?: boolean
  no?: boolean
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          display: "grid",
          placeItems: "center",
          background: ok ? T.okS : T.badS,
          color: ok ? T.ok : T.bad,
          border: `1px solid ${ok ? "rgba(74,222,128,0.30)" : "rgba(248,113,113,0.30)"}`,
          fontSize: 9,
          fontWeight: 900,
        }}
      >
        {ok ? "✓" : "✕"}
      </span>
      <span
        style={{
          color: no ? T.fg3 : T.fg2,
          textDecoration: no ? "line-through" : "none",
        }}
      >
        {children}
      </span>
    </div>
  )
}
