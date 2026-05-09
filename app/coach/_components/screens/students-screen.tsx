"use client"

import { useMemo, useState } from "react"
import { ChevronRight, Copy } from "lucide-react"
import { toast } from "sonner"
import { getAdminStudentInvite, regenerateAdminStudentInvite } from "@/lib/api/admin"
import { useCockpit } from "../cockpit-context"
import { T } from "../control-tokens"
import { Plate, Pill, SearchBox, FilterPill, SelectInput } from "../controls"
import { coachLabel, studentRisk, type RiskLevel } from "../utils"

const STATUS_FILTERS: { id: "ativos" | "pausados" | "arquivados" | "todos"; label: string }[] = [
  { id: "ativos", label: "Ativos" },
  { id: "pausados", label: "Pausados" },
  { id: "arquivados", label: "Arquivados" },
  { id: "todos", label: "Todos" },
]

function riskTone(risk: RiskLevel): "ok" | "warn" | "bad" | "mute" {
  return risk === "critico" ? "bad" : risk === "atencao" ? "warn" : risk === "sem-sinal" ? "mute" : "ok"
}
function riskShortLabel(risk: RiskLevel): string {
  return risk === "critico" ? "CRÍTICO" : risk === "atencao" ? "ATENÇÃO" : risk === "sem-sinal" ? "S/SINAL" : "EM DIA"
}

export function StudentsScreen() {
  const {
    students,
    coaches,
    teams,
    search,
    setSearch,
    filter,
    setFilter,
    coachFilter,
    setCoachFilter,
    isAdmin,
    isSuperAdmin,
    openStudent,
  } = useCockpit()

  // filtros client-side adicionais (empresa + risco)
  const [empresaFilter, setEmpresaFilter] = useState("")
  const [riskFilter, setRiskFilter] = useState<"" | RiskLevel>("")

  const filteredList = useMemo(() => {
    let l = students
    if (empresaFilter) l = l.filter((s) => s.teamId === empresaFilter)
    if (riskFilter) l = l.filter((s) => studentRisk(s) === riskFilter)
    return l
  }, [students, empresaFilter, riskFilter])

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Search + filtros principais */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar nome, email ou telefone…" />
        <div style={{ display: "flex", gap: 6 }}>
          {STATUS_FILTERS.map((f) => (
            <FilterPill key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Filtros secundários */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
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
        {isAdmin && (
          <SelectInput value={coachFilter} onChange={setCoachFilter}>
            <option value="" style={{ background: T.ink }}>
              Todos os coaches
            </option>
            {coaches.map((c) => (
              <option key={c.userId} value={c.userId} style={{ background: T.ink }}>
                {c.name || c.email || c.userId}
              </option>
            ))}
          </SelectInput>
        )}
        <SelectInput value={riskFilter} onChange={(v) => setRiskFilter(v as RiskLevel | "")}>
          <option value="" style={{ background: T.ink }}>
            Todos os riscos
          </option>
          <option value="ok" style={{ background: T.ink }}>
            Em dia
          </option>
          <option value="atencao" style={{ background: T.ink }}>
            Atenção
          </option>
          <option value="critico" style={{ background: T.ink }}>
            Crítico
          </option>
          <option value="sem-sinal" style={{ background: T.ink }}>
            Sem sinal
          </option>
        </SelectInput>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filteredList.map((s) => {
          const risk = studentRisk(s)
          const teamName = s.teamName ?? teams.find((t) => t.id === s.teamId)?.name ?? "—"
          return (
            <div
              key={s.userId}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(180px,2fr) 110px 110px 90px 110px auto auto",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                background: T.panel,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
              }}
            >
              <button
                onClick={() => openStudent(s)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  textAlign: "left",
                  cursor: "pointer",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.fg,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginBottom: 2,
                  }}
                >
                  {s.name}
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 9,
                    color: T.fg3,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.email || s.userId}
                </div>
              </button>
              <Pill tone={riskTone(risk)}>{riskShortLabel(risk)}</Pill>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  color: T.fg2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={coachLabel(s, coaches)}
              >
                {coachLabel(s, coaches)}
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.cyan, fontWeight: 700 }}>
                {s.weeklyXp} XP
              </span>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  color: T.fg3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={teamName}
              >
                {teamName}
              </span>
              <button
                title="Copiar convite"
                onClick={async () => {
                  try {
                    const result = await getAdminStudentInvite(s.userId)
                    const link =
                      result.inviteLink ??
                      (await regenerateAdminStudentInvite(s.userId)).inviteLink
                    await navigator.clipboard.writeText(link)
                    toast.success("Link copiado.")
                  } catch {
                    toast.error("Não foi possível copiar o convite.")
                  }
                }}
                style={{
                  height: 30,
                  padding: "0 10px",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: "rgba(232,244,255,0.06)",
                  color: T.fg3,
                  cursor: "pointer",
                  fontFamily: T.mono,
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Copy className="h-3 w-3" />
                Convite
              </button>
              <button
                onClick={() => openStudent(s)}
                style={{
                  background: "none",
                  border: "none",
                  color: T.fg4,
                  cursor: "pointer",
                  padding: 4,
                }}
                aria-label="Abrir aluno"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )
        })}

        {!filteredList.length && (
          <Plate style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg3 }}>
              Nenhum aluno encontrado.
            </p>
          </Plate>
        )}
      </div>
    </div>
  )
}
