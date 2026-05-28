"use client"

import { useMemo } from "react"
import { Building2, CheckCircle2, ChevronRight, Gavel, Users, Zap } from "lucide-react"
import { useCockpit } from "../cockpit-context"
import { T } from "../control-tokens"
import { Plate, Pill, Btn, SectionTitle, StatCard } from "../controls"
import { studentRisk, relativeTime, type RiskLevel } from "../utils"
import type { AdminStudent, AdminTeam } from "@/lib/api/admin"
import { activeClientTeams, clientTeams } from "@/lib/panel-rules"

function riskTone(risk: RiskLevel): "ok" | "warn" | "bad" | "mute" {
  return risk === "critico" ? "bad" : risk === "atencao" ? "warn" : risk === "sem-sinal" ? "mute" : "ok"
}
function riskLabel(risk: RiskLevel): string {
  return risk === "critico" ? "CRÍTICO" : risk === "atencao" ? "ATENÇÃO" : risk === "sem-sinal" ? "SEM SINAL" : "EM DIA"
}

export function HojeScreen() {
  const { students, teams, openStudent, openEmpresa, setActiveScreen, isSuperAdmin } = useCockpit()

  const todayStr = new Date().toISOString().split("T")[0]
  const stats = useMemo(() => {
    const ativos = students.filter((s) => s.active && !s.archived)
    return {
      ativos,
      validatedToday: ativos.filter((s) => s.lastValidationAt?.startsWith(todayStr)),
      criticos: ativos.filter((s) => studentRisk(s) === "critico"),
      atencao: ativos.filter((s) => studentRisk(s) === "atencao"),
      semSinal: ativos.filter((s) => studentRisk(s) === "sem-sinal"),
    }
  }, [students, todayStr])

  // Empresas = clientes B2B reais. GUTO_CORE (empresa interna) NÃO conta como
  // cliente nem entra no total; pausadas/arquivadas não contam como ativas.
  const empresasAtivas = useMemo(() => activeClientTeams(teams), [teams])
  const empresasCliente = useMemo(() => clientTeams(teams), [teams])

  const priorityList: AdminStudent[] = useMemo(
    () => [...stats.criticos, ...stats.atencao, ...stats.semSinal].slice(0, 8),
    [stats]
  )

  return (
    <div style={{ padding: "clamp(14px, 3vw, 28px)", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(156px, 1fr))",
          gap: 12,
        }}
      >
        {isSuperAdmin && (
          <StatCard
            icon={<Building2 className="h-3.5 w-3.5" />}
            label="Empresas ativas"
            value={empresasAtivas.length}
            sub={`${empresasCliente.length} cliente(s) cadastrada(s)`}
            tone="cyan"
            onClick={() => setActiveScreen("empresas")}
          />
        )}
        <StatCard
          icon={<Users className="h-3.5 w-3.5" />}
          label="Ativos"
          value={stats.ativos.length}
          sub="alunos com acesso"
          tone="cyan"
          onClick={() => setActiveScreen("students")}
        />
        <StatCard
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          label="Treinos hoje"
          value={stats.validatedToday.length}
          sub="validações no dia"
          tone="ok"
        />
        <StatCard
          icon={<Zap className="h-3.5 w-3.5" />}
          label="Críticos"
          value={stats.criticos.length}
          sub="6+ dias parado"
          tone="bad"
          onClick={() => setActiveScreen("students")}
        />
        <StatCard
          icon={<Gavel className="h-3.5 w-3.5" />}
          label="Atenção"
          value={stats.atencao.length}
          sub="3-5 dias parado"
          tone="warn"
          onClick={() => setActiveScreen("students")}
        />
      </div>

      {/* Two columns: priority + empresas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isSuperAdmin && empresasAtivas.length > 0
            ? "repeat(auto-fit, minmax(min(100%, 360px), 1fr))"
            : "1fr",
          gap: 18,
        }}
      >
        <div>
          <SectionTitle
            action={
              priorityList.length >= 6 && (
                <Btn ghost sm onClick={() => setActiveScreen("students")}>
                  Ver todos
                </Btn>
              )
            }
          >
            ALUNOS QUE PRECISAM DE ATENÇÃO
          </SectionTitle>

          {priorityList.length === 0 ? (
            <Plate style={{ padding: "48px 24px", textAlign: "center" }}>
              <CheckCircle2 className="mx-auto mb-3 h-7 w-7" style={{ color: T.ok }} />
              <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg2 }}>Todos em dia.</p>
            </Plate>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {priorityList.map((s) => {
                const risk = studentRisk(s)
                return (
                  <button
                    key={s.userId}
                    onClick={() => openStudent(s)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 16px",
                      background: T.panel,
                      border: `1px solid ${T.border}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 12,
                          fontWeight: 700,
                          color: T.fg,
                          marginBottom: 3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {s.name}
                      </div>
                      <div style={{ fontFamily: T.mono, fontSize: 9, color: T.fg3 }}>
                        {s.lastValidationAt
                          ? `último treino ${relativeTime(s.lastValidationAt)}`
                          : "sem sinal"}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3 }}>
                        {s.weeklyXp} XP
                      </span>
                      <Pill tone={riskTone(risk)}>{riskLabel(risk)}</Pill>
                      <ChevronRight className="h-3 w-3" style={{ color: T.fg4 }} />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {isSuperAdmin && empresasAtivas.length > 0 && (
          <div>
            <SectionTitle
              action={
                <Btn ghost sm onClick={() => setActiveScreen("empresas")}>
                  Ver todas
                </Btn>
              }
            >
              EMPRESAS ATIVAS
            </SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {empresasAtivas.slice(0, 5).map((team) => (
                <EmpresaRow key={team.id} team={team} onClick={() => openEmpresa(team)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmpresaRow({ team, onClick }: { team: AdminTeam; onClick: () => void }) {
  const { students, coaches } = useCockpit()
  const teamStudents = students.filter((s) => s.teamId === team.id).length
  const teamCoaches = coaches.filter((c) => c.teamId === team.id).length

  return (
    <button
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto auto",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div>
        <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.fg, marginBottom: 2 }}>
          {team.name}
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 9, color: T.fg3 }}>
          {teamStudents} alunos · {teamCoaches} coaches
        </div>
      </div>
      <Pill
        tone={team.status === "active" ? "ok" : team.status === "paused" ? "mute" : "neutral"}
      >
        {team.status.toUpperCase()}
      </Pill>
      <ChevronRight className="h-3 w-3" style={{ color: T.fg4 }} />
    </button>
  )
}
