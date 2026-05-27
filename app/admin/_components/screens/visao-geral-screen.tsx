"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Btn,
  Card,
  KpiCard,
  Num,
  Pill,
  SearchBox,
  SectionHeader,
} from "@/components/panel/atoms"
import {
  IBuilding,
  IChevR,
  IGavel,
  IShield,
  ITrend,
  IUsers,
  IZap,
} from "@/components/panel/icons"
import { usePanel } from "@/components/panel/panel-context"
import { usePanelViewport } from "@/hooks/use-panel-viewport"
import {
  empresaStatusLabel,
  empresaStatusTone,
  planLabel,
  relativeTime,
} from "@/lib/panel/helpers"
import { getAdminOverview, getCompaniesTablePage } from "@/lib/panel/data-source"
import { T, type PanelTone } from "@/lib/panel/tokens"
import type { CompanyRow, EmpresaStatus } from "@/lib/panel/types"

type StatusFilter = "todas" | EmpresaStatus

export function VisaoGeralScreen() {
  const { setActiveScreen, setShowCreate } = usePanel()
  const router = useRouter()
  const openCompany = (teamId: string) => router.push(`/admin/teams/${teamId}`)
  const { isMobile, isTablet, isDesktop } = usePanelViewport()

  // 7 KPIs — todos agregados, zero filter no client.
  const overview = useMemo(() => getAdminOverview(), [])

  // Tabela principal — Empresas.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas")
  const [search, setSearch] = useState("")
  const page = useMemo(() => {
    return getCompaniesTablePage({
      pageSize: 50,
      status: statusFilter === "todas" ? undefined : [statusFilter],
      search: search || undefined,
      sortBy: "lastActivityAt",
      sortDir: "desc",
    })
  }, [statusFilter, search])

  // Responsividade
  const screenPad = isMobile ? "20px 14px" : isTablet ? "24px 22px" : "28px 32px"
  const screenGap = isMobile ? 18 : 24
  const kpiGrid = isMobile
    ? "repeat(2, minmax(0, 1fr))"
    : isTablet
      ? "repeat(auto-fit, minmax(180px, 1fr))"
      : "repeat(7, minmax(0, 1fr))"

  return (
    <div style={{ padding: screenPad, display: "flex", flexDirection: "column", gap: screenGap }}>
      {/* KPI row — 7 cards */}
      <div style={{ display: "grid", gridTemplateColumns: kpiGrid, gap: isMobile ? 10 : 14 }}>
        <KpiCard
          icon={<IBuilding size={15} />}
          label="Empresas cadastradas"
          value={overview.teams.total}
          sub={`${overview.teams.active} ativas`}
          tone="brand"
        />
        <KpiCard
          icon={<IBuilding size={15} />}
          label="Empresas ativas"
          value={overview.teams.active}
          sub={`${overview.teams.paused} pausadas · ${overview.teams.archived} arq.`}
          tone="ok"
        />
        <KpiCard
          icon={<IShield size={15} />}
          label="Coaches ativos"
          value={overview.coaches.active}
          sub={`de ${overview.coaches.total} cadastrados`}
          tone="brand"
        />
        <KpiCard
          icon={<IUsers size={15} />}
          label="Alunos ativos"
          value={overview.students.active}
          sub={`de ${overview.students.total} totais`}
          tone="brand"
          onClick={() => setActiveScreen("alunos")}
        />
        <KpiCard
          icon={<ITrend size={15} />}
          label="Alunos em atenção"
          value={overview.students.atencao}
          sub="3 a 5 dias sem sinal"
          tone="warn"
          onClick={() => setActiveScreen("alunos")}
        />
        <KpiCard
          icon={<IZap size={15} />}
          label="Alunos críticos"
          value={overview.students.critico}
          sub="6+ dias sem sinal"
          tone="bad"
          onClick={() => setActiveScreen("alunos")}
        />
        <KpiCard
          icon={<IGavel size={15} />}
          label="Pendências"
          value={overview.pending.total}
          sub={`${overview.pending.exercises} ex · ${overview.pending.foods} alim`}
          tone="warn"
          onClick={() => setActiveScreen("aprovacoes")}
        />
      </div>

      {/* Tabela principal — Empresas */}
      <Card>
        <div
          style={{
            padding: isMobile ? "14px 16px 10px" : "16px 20px 12px",
            borderBottom: `1px solid ${T.borderSoft}`,
          }}
        >
          <SectionHeader
            title="Empresas"
            subtitle={`${page.totals.total} cadastrada${page.totals.total === 1 ? "" : "s"} · ${page.totals.active} ativa${page.totals.active === 1 ? "" : "s"}`}
            action={
              !isMobile && (
                <Btn variant="primary" sm onClick={() => setShowCreate("empresa")}>
                  + Nova empresa
                </Btn>
              )
            }
          />
          {/* Filtros + Busca */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 4,
              flexWrap: "wrap",
            }}
          >
            <StatusFilterChips value={statusFilter} onChange={setStatusFilter} totals={page.totals} />
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Buscar empresa…"
              style={{ maxWidth: isMobile ? "100%" : 280 }}
            />
          </div>
        </div>

        {page.items.length === 0 ? (
          <EmptyTableRow search={search} statusFilter={statusFilter} />
        ) : isDesktop ? (
          <CompaniesTableDesktop items={page.items} onOpen={openCompany} />
        ) : (
          <CompaniesCardList items={page.items} onOpen={openCompany} compact={isMobile} />
        )}
      </Card>
    </div>
  )
}
/* ───────────────────────────────────────────────────────────────────────── */

function StatusFilterChips({
  value,
  onChange,
  totals,
}: {
  value: StatusFilter
  onChange: (s: StatusFilter) => void
  totals: { total: number; active: number; paused: number; archived: number }
}) {
  const chips: Array<{ key: StatusFilter; label: string; count: number }> = [
    { key: "todas", label: "Todas", count: totals.total },
    { key: "active", label: "Ativas", count: totals.active },
    { key: "paused", label: "Pausadas", count: totals.paused },
    { key: "archived", label: "Arquivadas", count: totals.archived },
  ]
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {chips.map((c) => {
        const active = value === c.key
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            style={{
              height: 28,
              padding: "0 10px",
              borderRadius: 999,
              border: `1px solid ${active ? T.brandLine : T.border}`,
              background: active ? T.brandSoft : T.surface,
              color: active ? T.brand : T.fg3,
              fontFamily: T.ui,
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            {c.label}
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 11,
                color: active ? T.brand : T.fg4,
                opacity: 0.9,
              }}
            >
              {c.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function EmptyTableRow({
  search,
  statusFilter,
}: {
  search: string
  statusFilter: StatusFilter
}) {
  const reason =
    search.trim().length > 0
      ? `Nenhuma empresa bate com "${search}".`
      : statusFilter === "todas"
        ? "Nenhuma empresa cadastrada ainda."
        : `Nenhuma empresa com status "${statusFilter}".`
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          background: T.muteSoft,
          display: "grid",
          placeItems: "center",
          color: T.fg4,
          margin: "0 auto 12px",
        }}
      >
        <IBuilding size={20} />
      </div>
      <div style={{ fontFamily: T.ui, fontSize: 13.5, color: T.fg2 }}>{reason}</div>
    </div>
  )
}

/* ── Desktop table (≥1024) ───────────────────────────────────────────────── */

const TABLE_GRID_COLS = "1.4fr 90px 90px 110px 110px 80px 80px 100px 110px 24px"

function CompaniesTableDesktop({
  items,
  onOpen,
}: {
  items: CompanyRow[]
  onOpen: (teamId: string) => void
}) {
  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: TABLE_GRID_COLS,
          alignItems: "center",
          gap: 10,
          padding: "10px 22px",
          background: T.surfaceAlt,
          borderBottom: `1px solid ${T.borderSoft}`,
          fontFamily: T.ui,
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: T.fg3,
        }}
      >
        <span>Empresa</span>
        <span>Status</span>
        <span>Plano</span>
        <span>Coaches</span>
        <span>Alunos</span>
        <span style={{ textAlign: "right" }}>Atenção</span>
        <span style={{ textAlign: "right" }}>Críticos</span>
        <span style={{ textAlign: "right" }}>Pendências</span>
        <span>Última ativ.</span>
        <span />
      </div>
      {/* Rows */}
      {items.map((row, i) => (
        <button
          key={row.teamId}
          type="button"
          onClick={() => onOpen(row.teamId)}
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: TABLE_GRID_COLS,
            alignItems: "center",
            gap: 10,
            padding: "13px 22px",
            background: T.surface,
            border: "none",
            borderTop: i === 0 ? "none" : `1px solid ${T.borderSoft}`,
            cursor: "pointer",
            textAlign: "left",
            transition: "background 120ms ease",
            font: "inherit",
            color: T.fg,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.surface)}
        >
          {/* Nome */}
          <span
            style={{
              fontFamily: T.ui,
              fontSize: 13.5,
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {row.name}
          </span>
          {/* Status */}
          <Pill tone={empresaStatusTone(row.status) as PanelTone} dot>
            {empresaStatusLabel(row.status)}
          </Pill>
          {/* Plano */}
          <Pill tone="mute">{planLabel(row.plan)}</Pill>
          {/* Coaches */}
          <Num c={T.fg2}>
            {row.usage.coaches} / {row.limits.maxCoaches ?? "∞"}
          </Num>
          {/* Alunos */}
          <Num c={T.fg2}>
            {row.usage.students} / {row.limits.maxStudents ?? "∞"}
          </Num>
          {/* Atenção */}
          <Num c={row.risk.atencao > 0 ? T.warn : T.fg4} style={{ textAlign: "right" }}>
            {row.risk.atencao}
          </Num>
          {/* Críticos */}
          <Num c={row.risk.critico > 0 ? T.bad : T.fg4} style={{ textAlign: "right" }}>
            {row.risk.critico}
          </Num>
          {/* Pendências */}
          <Num c={row.pending.total > 0 ? T.warn : T.fg4} style={{ textAlign: "right" }}>
            {row.pending.total}
          </Num>
          {/* Última atividade */}
          <span style={{ fontFamily: T.ui, fontSize: 12.5, color: T.fg3 }}>
            {relativeTime(row.lastActivityAt)}
          </span>
          {/* Chevron */}
          <IChevR size={14} style={{ color: T.fg4 }} />
        </button>
      ))}
    </div>
  )
}

/* ── Tablet/Mobile cards (<1024) ─────────────────────────────────────────── */

function CompaniesCardList({
  items,
  onOpen,
  compact,
}: {
  items: CompanyRow[]
  onOpen: (teamId: string) => void
  compact: boolean
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((row, i) => (
        <button
          key={row.teamId}
          type="button"
          onClick={() => onOpen(row.teamId)}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: compact ? "14px 16px" : "16px 22px",
            background: T.surface,
            border: "none",
            borderTop: i === 0 ? "none" : `1px solid ${T.borderSoft}`,
            cursor: "pointer",
            textAlign: "left",
            transition: "background 120ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.surface)}
        >
          {/* Linha 1: nome + status + chevron */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                flex: 1,
                fontFamily: T.ui,
                fontSize: 14,
                fontWeight: 600,
                color: T.fg,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {row.name}
            </div>
            <Pill tone={empresaStatusTone(row.status) as PanelTone} dot>
              {empresaStatusLabel(row.status)}
            </Pill>
            <IChevR size={14} style={{ color: T.fg4, flexShrink: 0 }} />
          </div>
          {/* Linha 2: plano + última atividade */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: T.ui,
              fontSize: 12,
              color: T.fg3,
            }}
          >
            <span>Plano {planLabel(row.plan)}</span>
            <span>·</span>
            <span>ativ. {relativeTime(row.lastActivityAt)}</span>
          </div>
          {/* Grid 2x2 de datapoints */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
              marginTop: 4,
            }}
          >
            <Datapoint label="Coaches" value={`${row.usage.coaches} / ${row.limits.maxCoaches ?? "∞"}`} />
            <Datapoint label="Alunos" value={`${row.usage.students} / ${row.limits.maxStudents ?? "∞"}`} />
            <Datapoint
              label="Atenção"
              value={String(row.risk.atencao)}
              valueColor={row.risk.atencao > 0 ? T.warn : T.fg}
            />
            <Datapoint
              label="Críticos"
              value={String(row.risk.critico)}
              valueColor={row.risk.critico > 0 ? T.bad : T.fg}
            />
          </div>
        </button>
      ))}
    </div>
  )
}

function Datapoint({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div
      style={{
        padding: "8px 10px",
        background: T.surfaceAlt,
        borderRadius: 8,
        border: `1px solid ${T.borderSoft}`,
      }}
    >
      <div
        style={{
          fontFamily: T.ui,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: T.fg4,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 14,
          fontWeight: 600,
          color: valueColor ?? T.fg,
        }}
      >
        {value}
      </div>
    </div>
  )
}
