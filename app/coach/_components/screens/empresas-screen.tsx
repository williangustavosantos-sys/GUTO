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

const FILTERS: { id: "todas" | "active" | "paused" | "archived"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "active", label: "Ativas" },
  { id: "paused", label: "Pausadas" },
  { id: "archived", label: "Arquivadas" },
]

export function EmpresasScreen() {
  const { teams, students, coaches, openEmpresa, setTeams, isSuperAdmin } = useCockpit()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("todas")
  const [cleaning, setCleaning] = useState(false)
  const [actionPendingId, setActionPendingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Pausar / Reativar / Arquivar empresa. Super_admin apenas (PATCH /admin/teams).
  async function handleStatusChange(team: AdminTeam, newStatus: "active" | "paused" | "archived") {
    if (newStatus === team.status) return
    setOpenMenuId(null)
    const verb = newStatus === "active" ? "Reativar" : newStatus === "paused" ? "Pausar" : "Arquivar"
    if (!window.confirm(`${verb} a empresa "${team.name}"?`)) return
    setActionPendingId(team.id)
    try {
      const { team: updated } = await updateAdminTeam(team.id, { status: newStatus })
      setTeams((prev) => prev.map((t) => (t.id === team.id ? updated : t)))
      toast.success(`Empresa "${team.name}" agora está ${teamStatusLabel(newStatus)}.`)
    } catch {
      toast.error("Não foi possível alterar o status da empresa.")
    } finally {
      setActionPendingId(null)
    }
  }

  // Excluir empresa (apenas vazia). 409 com members → toast detalhado (4.B
  // troca por modal com ações). Bloqueia GUTO_CORE no backend.
  async function handleDelete(team: AdminTeam) {
    setOpenMenuId(null)
    if (!window.confirm(`Excluir a empresa "${team.name}" definitivamente? Esta ação não pode ser desfeita.`)) return
    setActionPendingId(team.id)
    try {
      await deleteAdminTeam(team.id)
      setTeams((prev) => prev.filter((t) => t.id !== team.id))
      toast.success(`Empresa "${team.name}" excluída.`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const details = (err.details as { members?: { coaches: number; students: number } } | undefined)?.members
        if (details) {
          toast.error(
            `Não dá pra excluir: ${details.coaches} coach(es) e ${details.students} aluno(s) vinculado(s). Realoque ou arquive antes.`,
            { duration: 6000 },
          )
        } else {
          toast.error(err.message || "Empresa não está vazia.")
        }
      } else if (err instanceof ApiError && err.status === 400 && err.code === "GUTO_CORE_PROTECTED") {
        toast.error("A empresa interna GUTO_CORE não pode ser removida.")
      } else {
        toast.error("Não foi possível excluir a empresa.")
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
    if (!window.confirm("Remover empresas VAZIAS (sem coaches e sem alunos)? GUTO_CORE e empresas com membros são preservadas. Ação não destrutiva de dados de alunos.")) return
    setCleaning(true)
    try {
      const { removedCount, removed } = await cleanupEmptyTeams()
      const removedIds = new Set(removed.map((r) => r.id))
      setTeams((prev) => prev.filter((t) => !removedIds.has(t.id)))
      toast.success(removedCount > 0 ? `${removedCount} empresa(s) vazia(s) removida(s).` : "Nenhuma empresa vazia encontrada.")
    } catch {
      toast.error("Não foi possível limpar empresas vazias.")
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
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar empresa…" />
        <div style={{ display: "flex", gap: 6 }}>
          {FILTERS.map((f) => (
            <FilterPill key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </FilterPill>
          ))}
        </div>
        {isSuperAdmin && (
          <div style={{ marginLeft: "auto" }}>
            <Btn sm disabled={cleaning} onClick={handleCleanupEmpty}>
              <Sparkles className="h-3 w-3" />
              {cleaning ? "Limpando…" : "Limpar vazias"}
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
                  Abrir <ChevronRight className="h-3 w-3" />
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
                        aria-label={`Ações da empresa ${team.name}`}
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
                        label="Reativar"
                        disabled={team.status === "active"}
                        onClick={() => handleStatusChange(team, "active")}
                      />
                      <ActionMenuItem
                        icon={<Pause className="h-3.5 w-3.5" />}
                        label="Pausar"
                        disabled={team.status === "paused"}
                        onClick={() => handleStatusChange(team, "paused")}
                      />
                      <ActionMenuItem
                        icon={<Archive className="h-3.5 w-3.5" />}
                        label="Arquivar"
                        disabled={team.status === "archived"}
                        onClick={() => handleStatusChange(team, "archived")}
                      />
                      <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
                      <ActionMenuItem
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        label="Excluir"
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
              Nenhuma empresa encontrada.
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
