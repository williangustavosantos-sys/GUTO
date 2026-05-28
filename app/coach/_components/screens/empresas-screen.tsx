"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useCockpit } from "../cockpit-context"
import { T, planLabel, teamStatusLabel, teamStatusTone } from "../control-tokens"
import { Plate, Pill, Btn, SearchBox, FilterPill, UsageBar } from "../controls"
import { studentRisk } from "../utils"
import { Archive, ChevronRight, MoreVertical, Pause, Play, Sparkles, Trash2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cleanupEmptyTeams, deleteAdminTeam, updateAdminTeam, type AdminTeam } from "@/lib/api/admin"
import { ApiError } from "@/lib/api/client"
import { clientTeams } from "@/lib/panel-rules"
import { usePanelI18n } from "@/lib/panel-i18n"

const FILTER_IDS: ReadonlyArray<"todas" | "active" | "paused" | "archived"> = [
  "todas", "active", "paused", "archived",
]

export function EmpresasScreen() {
  const { teams, students, coaches, openEmpresa, setTeams, isSuperAdmin } = useCockpit()
  const { t } = usePanelI18n()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<(typeof FILTER_IDS)[number]>("todas")
  const [cleaning, setCleaning] = useState(false)
  const [actionPendingId, setActionPendingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const filterLabels: Record<typeof FILTER_IDS[number], string> = {
    todas: t.empresasScreen.filterAll,
    active: t.empresasScreen.filterActive,
    paused: t.empresasScreen.filterPaused,
    archived: t.empresasScreen.filterArchived,
  }

  // Pausar / Reativar / Arquivar empresa. Super_admin apenas (PATCH /admin/teams).
  async function handleStatusChange(team: AdminTeam, newStatus: "active" | "paused" | "archived") {
    if (newStatus === team.status) return
    setOpenMenuId(null)
    const verb = newStatus === "active"
      ? t.empresasScreen.actions.changeStatusVerbActivate
      : newStatus === "paused"
        ? t.empresasScreen.actions.changeStatusVerbPause
        : t.empresasScreen.actions.changeStatusVerbArchive
    if (!window.confirm(t.empresasScreen.actions.changeStatusConfirm(verb, team.name))) return
    setActionPendingId(team.id)
    try {
      const { team: updated } = await updateAdminTeam(team.id, { status: newStatus })
      setTeams((prev) => prev.map((t) => (t.id === team.id ? updated : t)))
      toast.success(t.empresasScreen.actions.changeStatusSuccess(team.name, teamStatusLabel(newStatus)))
    } catch {
      toast.error(t.empresasScreen.actions.changeStatusError)
    } finally {
      setActionPendingId(null)
    }
  }

  // Excluir empresa (apenas vazia). 409 com members → toast detalhado (4.B
  // troca por modal com ações). Bloqueia GUTO_CORE no backend.
  async function handleDelete(team: AdminTeam) {
    setOpenMenuId(null)
    if (!window.confirm(t.empresasScreen.actions.deleteConfirm(team.name))) return
    setActionPendingId(team.id)
    try {
      await deleteAdminTeam(team.id)
      setTeams((prev) => prev.filter((t) => t.id !== team.id))
      toast.success(t.empresasScreen.actions.deleteSuccess(team.name))
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const details = (err.details as { members?: { coaches: number; students: number } } | undefined)?.members
        if (details) {
          toast.error(
            t.empresasScreen.actions.deleteNotEmpty(details.coaches, details.students),
            { duration: 6000 },
          )
        } else {
          toast.error(err.message || t.empresasScreen.actions.deleteError)
        }
      } else if (err instanceof ApiError && err.status === 400 && err.code === "GUTO_CORE_PROTECTED") {
        toast.error(t.empresasScreen.actions.deleteCoreBlocked)
      } else {
        toast.error(t.empresasScreen.actions.deleteError)
      }
    } finally {
      setActionPendingId(null)
    }
  }

  // Limpeza operacional segura: remove só empresas SEM coaches e SEM alunos
  // (vazias/teste), preserva GUTO_CORE e empresas com membros. Ação explícita
  // do super admin — nunca automática.
  async function handleCleanupEmpty() {
    if (cleaning) return
    if (!window.confirm(t.empresasScreen.cleanEmptyConfirm)) return
    setCleaning(true)
    try {
      const { removedCount, removed } = await cleanupEmptyTeams()
      const removedIds = new Set(removed.map((r) => r.id))
      setTeams((prev) => prev.filter((t) => !removedIds.has(t.id)))
      toast.success(removedCount > 0 ? t.empresasScreen.cleanEmptySuccess(removedCount) : t.empresasScreen.cleanEmptyEmpty)
    } catch {
      toast.error(t.empresasScreen.cleanEmptyError)
    } finally {
      setCleaning(false)
    }
  }

  const list = useMemo(() => {
    // GUTO_CORE é empresa interna do sistema, não cliente B2B: fora da lista.
    let l: AdminTeam[] = clientTeams(teams)
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
    <>
    <style>{`
      .guto-empresas-screen {
        padding: clamp(14px, 3vw, 28px);
      }
      .guto-empresas-header,
      .guto-empresas-row {
        display: grid;
        grid-template-columns: minmax(180px, 2fr) 110px 80px 110px 110px 90px auto;
        gap: 14px;
      }
      .guto-empresas-row {
        align-items: center;
        padding: 14px 18px;
        background: ${T.panel};
        border: 1px solid ${T.border};
        border-radius: 12px;
        cursor: pointer;
        text-align: left;
      }
      @media (max-width: 980px) {
        .guto-empresas-header {
          display: none;
        }
        .guto-empresas-row {
          grid-template-columns: minmax(0, 1fr) auto;
        }
        .guto-empresas-row-meta {
          display: none !important;
        }
      }
      @media (max-width: 640px) {
        .guto-empresas-row {
          grid-template-columns: minmax(0, 1fr);
          gap: 10px;
        }
        .guto-empresas-open {
          justify-content: center;
          width: 100%;
        }
      }
    `}</style>
    <div className="guto-empresas-screen">
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
        <SearchBox value={search} onChange={setSearch} placeholder={t.empresasScreen.searchPlaceholder} />
        <div style={{ display: "flex", gap: 6 }}>
          {FILTER_IDS.map((id) => (
            <FilterPill key={id} active={filter === id} onClick={() => setFilter(id)}>
              {filterLabels[id]}
            </FilterPill>
          ))}
        </div>
        {isSuperAdmin && (
          <div style={{ marginLeft: "auto" }}>
            <Btn sm disabled={cleaning} onClick={handleCleanupEmpty}>
              <Sparkles className="h-3 w-3" />
              {cleaning ? t.empresasScreen.cleaningEmpty : t.empresasScreen.cleanEmpty}
            </Btn>
          </div>
        )}
      </div>

      {/* Header row */}
      <div
        className="guto-empresas-header"
        style={{
          padding: "0 18px 8px",
          fontFamily: T.mono,
          fontSize: 8,
          color: T.fg4,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        <span>{t.empresasScreen.headerCompany}</span>
        <span>{t.empresasScreen.headerStatus}</span>
        <span>{t.empresasScreen.headerPlan}</span>
        <span>{t.empresasScreen.headerStudents}</span>
        <span>{t.empresasScreen.headerCoaches}</span>
        <span>{t.empresasScreen.headerCriticals}</span>
        <span></span>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {list.map((team) => {
          const stats = empresaStats[team.id] ?? { students: 0, coaches: 0, critical: 0 }
          const isPending = actionPendingId === team.id
          // Linha: agora é div clicável (não <button>) para permitir botões
          // aninhados (menu de ações). Acessível via Enter/Space.
          return (
            <div
              key={team.id}
              role="button"
              tabIndex={0}
              onClick={() => openEmpresa(team)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  openEmpresa(team)
                }
              }}
              className="guto-empresas-row"
              aria-busy={isPending}
              style={{ opacity: isPending ? 0.55 : 1 }}
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
                className="guto-empresas-row-meta"
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
              <span className="guto-empresas-row-meta">
                <UsageBar value={stats.students} max={team.customLimits?.maxStudents ?? null} />
              </span>
              <span className="guto-empresas-row-meta">
                <UsageBar value={stats.coaches} max={team.customLimits?.maxCoaches ?? null} />
              </span>
              <span
                className="guto-empresas-row-meta"
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
                className="guto-empresas-row-cta"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  justifyContent: "flex-end",
                }}
              >
                <span
                  className="guto-empresas-open"
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
                  {t.empresasScreen.rowOpen} <ChevronRight className="h-3 w-3" />
                </span>
                {isSuperAdmin && (
                  <Popover
                    open={openMenuId === team.id}
                    onOpenChange={(open) => setOpenMenuId(open ? team.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={t.empresasScreen.actions.menuLabel(team.name)}
                        disabled={isPending}
                        style={{
                          width: 28,
                          height: 28,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 6,
                          background: "transparent",
                          border: `1px solid ${T.border}`,
                          color: T.fg3,
                          cursor: isPending ? "wait" : "pointer",
                        }}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      onClick={(e) => e.stopPropagation()}
                      align="end"
                      sideOffset={6}
                      style={{
                        padding: 6,
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                        width: 200,
                      }}
                    >
                      <ActionMenuItem
                        icon={<Play className="h-3.5 w-3.5" />}
                        label={t.empresasScreen.actions.activate}
                        disabled={team.status === "active"}
                        onClick={() => handleStatusChange(team, "active")}
                      />
                      <ActionMenuItem
                        icon={<Pause className="h-3.5 w-3.5" />}
                        label={t.empresasScreen.actions.pause}
                        disabled={team.status === "paused"}
                        onClick={() => handleStatusChange(team, "paused")}
                      />
                      <ActionMenuItem
                        icon={<Archive className="h-3.5 w-3.5" />}
                        label={t.empresasScreen.actions.archive}
                        disabled={team.status === "archived"}
                        onClick={() => handleStatusChange(team, "archived")}
                      />
                      <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
                      <ActionMenuItem
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        label={t.empresasScreen.actions.delete}
                        danger
                        onClick={() => handleDelete(team)}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </span>
            </div>
          )
        })}

        {!list.length && (
          <Plate style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg3 }}>
              {t.empresasScreen.empty}
            </p>
          </Plate>
        )}
      </div>

    </div>
    </>
  )
}

function ActionMenuItem({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onClick()
      }}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "8px 10px",
        background: "transparent",
        border: "none",
        borderRadius: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: T.ui,
        fontSize: 13,
        color: danger ? T.bad : T.fg,
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = T.bg
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent"
      }}
    >
      {icon}
      {label}
    </button>
  )
}
