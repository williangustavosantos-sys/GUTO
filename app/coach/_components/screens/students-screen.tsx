"use client"

import { useMemo, useState } from "react"
import { ChevronRight, Copy } from "lucide-react"
import { toast } from "sonner"
import { getAdminStudentInvite, regenerateAdminStudentInvite } from "@/lib/api/admin"
import { useCockpit } from "../cockpit-context"
import { T } from "../control-tokens"
import { Plate, Pill, SearchBox, FilterPill, SelectInput } from "../controls"
import { coachLabel, studentRisk, type RiskLevel } from "../utils"
import { usePanelI18n } from "@/lib/panel-i18n"

const STATUS_FILTER_IDS: ReadonlyArray<"ativos" | "pausados" | "arquivados" | "todos"> = [
  "ativos", "pausados", "arquivados", "todos",
]

function riskTone(risk: RiskLevel): "ok" | "warn" | "bad" | "mute" {
  return risk === "critico" ? "bad" : risk === "atencao" ? "warn" : risk === "sem-sinal" ? "mute" : "ok"
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
  const { t } = usePanelI18n()

  // filtros client-side adicionais (empresa + risco)
  const [empresaFilter, setEmpresaFilter] = useState("")
  const [riskFilter, setRiskFilter] = useState<"" | RiskLevel>("")

  const statusFilterLabels: Record<typeof STATUS_FILTER_IDS[number], string> = {
    ativos: t.studentsScreen.filterActive,
    pausados: t.studentsScreen.filterPaused,
    arquivados: t.studentsScreen.filterArchived,
    todos: t.studentsScreen.filterAll,
  }

  const riskShortLabel = (risk: RiskLevel): string =>
    risk === "critico" ? t.studentsScreen.riskCriticalShort
    : risk === "atencao" ? t.studentsScreen.riskAttentionShort
    : risk === "sem-sinal" ? t.studentsScreen.riskNoSignalShort
    : t.studentsScreen.riskOkShort

  const filteredList = useMemo(() => {
    let l = students
    if (empresaFilter) l = l.filter((s) => s.teamId === empresaFilter)
    if (riskFilter) l = l.filter((s) => studentRisk(s) === riskFilter)
    return l
  }, [students, empresaFilter, riskFilter])

  return (
    <>
    <style>{`
      .guto-students-screen {
        padding: clamp(14px, 3vw, 28px);
      }
      .guto-students-row {
        display: grid;
        grid-template-columns: minmax(180px, 2fr) 110px 110px 90px 110px auto auto;
        align-items: center;
        gap: 14px;
        padding: 12px 16px;
        background: ${T.panel};
        border: 1px solid ${T.border};
        border-radius: 12px;
      }
      @media (max-width: 980px) {
        .guto-students-row {
          grid-template-columns: minmax(0, 1fr) auto;
        }
        .guto-students-row-meta {
          display: none !important;
        }
      }
      @media (max-width: 640px) {
        .guto-students-row {
          grid-template-columns: minmax(0, 1fr);
          gap: 10px;
        }
        .guto-students-actions {
          display: grid !important;
          grid-template-columns: 1fr 1fr;
          width: 100%;
        }
        .guto-students-actions button {
          justify-content: center;
          width: 100%;
        }
      }
    `}</style>
    <div className="guto-students-screen">
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
        <SearchBox value={search} onChange={setSearch} placeholder={t.studentsScreen.searchPlaceholder} />
        <div style={{ display: "flex", gap: 6 }}>
          {STATUS_FILTER_IDS.map((id) => (
            <FilterPill key={id} active={filter === id} onClick={() => setFilter(id)}>
              {statusFilterLabels[id]}
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
              {t.studentsScreen.allCompanies}
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
              {t.studentsScreen.allCoaches}
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
            {t.studentsScreen.allRisks}
          </option>
          <option value="ok" style={{ background: T.ink }}>
            {t.studentsScreen.riskOk}
          </option>
          <option value="atencao" style={{ background: T.ink }}>
            {t.studentsScreen.riskAttention}
          </option>
          <option value="critico" style={{ background: T.ink }}>
            {t.studentsScreen.riskCritical}
          </option>
          <option value="sem-sinal" style={{ background: T.ink }}>
            {t.studentsScreen.riskNoSignal}
          </option>
        </SelectInput>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filteredList.map((s) => {
          const risk = studentRisk(s)
          const teamName = s.teamName ?? teams.find((t) => t.id === s.teamId)?.name ?? "—"
          return (
            <div key={s.userId} className="guto-students-row">
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
                className="guto-students-row-meta"
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  color: s.coachId ? T.fg2 : T.warn,
                  fontWeight: s.coachId ? 400 : 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={s.coachId ? coachLabel(s, coaches) : t.studentsScreen.noCoachTitle}
              >
                {s.coachId ? coachLabel(s, coaches) : t.studentsScreen.noCoach}
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.cyan, fontWeight: 700 }}>
                {s.weeklyXp} XP
              </span>
              <span
                className="guto-students-row-meta"
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
              <div className="guto-students-actions" style={{ display: "flex", gap: 8 }}>
                <button
                  title={t.studentsScreen.inviteAction}
                  onClick={async () => {
                    try {
                      const result = await getAdminStudentInvite(s.userId)
                      const link =
                        result.inviteLink ??
                        (await regenerateAdminStudentInvite(s.userId)).inviteLink
                      await navigator.clipboard.writeText(link)
                      toast.success(t.studentsScreen.inviteCopied)
                    } catch {
                      toast.error(t.studentsScreen.inviteError)
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
                  {t.studentsScreen.inviteAction}
                </button>
                <button
                  onClick={() => openStudent(s)}
                  style={{
                    minWidth: 30,
                    height: 30,
                    borderRadius: 8,
                    border: `1px solid ${T.border}`,
                    background: "rgba(232,244,255,0.06)",
                    color: T.cyan,
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                  }}
                  aria-label={t.studentsScreen.openStudentLabel}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
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
    </>
  )
}
