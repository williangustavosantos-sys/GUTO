"use client"

import { useMemo, useState } from "react"
import { Avatar, Btn, Card, KpiCard, Num, Pill, SearchBox, SectionHeader } from "@/components/panel/atoms"
import { Breadcrumb } from "@/components/panel/breadcrumb"
import {
  IChevR,
  IDumbbell,
  IFork,
  IGavel,
  ILog,
  IShield,
  ITrend,
  IUsers,
  IZap,
} from "@/components/panel/icons"
import { usePanelViewport } from "@/hooks/use-panel-viewport"
import {
  empresaStatusLabel,
  empresaStatusTone,
  planLabel,
  relativeTime,
  subLabel,
} from "@/lib/panel/helpers"
import {
  getCompanyArena,
  getCompanyCoaches,
  getCompanyLogs,
  getCompanyPending,
  getCompanyStudents,
} from "@/lib/panel/data-source"
import { T, type PanelTone } from "@/lib/panel/tokens"
import type {
  ArenaEntry,
  CompanyArenaRanking,
  CompanyDetail,
  CompanyLogRow,
  CompanyPendingItem,
  CoachSummaryRow,
  PanelRiskClass,
  StudentRiskFilter,
  StudentSummaryRow,
} from "@/lib/panel/types"

export function CompanyDetailScreen({ detail }: { detail: CompanyDetail }) {
  const { isMobile, isTablet, isDesktop } = usePanelViewport()
  const screenPad = isMobile ? "20px 14px" : isTablet ? "24px 22px" : "28px 32px"

  return (
    <div style={{ padding: screenPad, display: "flex", flexDirection: "column", gap: isMobile ? 18 : 22 }}>
      <Header detail={detail} />
      <SummaryAndCapacity detail={detail} />
      <RiskKpis detail={detail} />
      <CoachesSection teamId={detail.team.teamId} totalCoaches={detail.usage.coaches} />
      <StudentsSection teamId={detail.team.teamId} totalStudents={detail.usage.students} />
      <PendingSection teamId={detail.team.teamId} />
      <ArenaSection teamId={detail.team.teamId} isDesktopOrTablet={isDesktop || isTablet} />
      <LogsSection teamId={detail.team.teamId} />
    </div>
  )
}

/* ─── HEADER ─────────────────────────────────────────────────────────────── */

function Header({ detail }: { detail: CompanyDetail }) {
  const { isMobile } = usePanelViewport()
  return (
    <Card padded>
      <Breadcrumb
        items={[
          { label: "Empresas", href: "/admin" },
          { label: detail.team.name },
        ]}
      />
      <div
        style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          gap: 14,
          marginTop: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: T.ui,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: T.brand,
              marginBottom: 6,
            }}
          >
            EMPRESA
          </div>
          <div
            style={{
              fontFamily: T.ui,
              fontSize: isMobile ? 22 : 26,
              fontWeight: 700,
              color: T.fg,
              letterSpacing: "-0.015em",
              lineHeight: 1.15,
              wordBreak: "break-word",
            }}
          >
            {detail.team.name}
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: T.ui,
              fontSize: 13,
              color: T.fg3,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span>ID: <code style={{ fontFamily: T.mono, fontSize: 12.5 }}>{detail.team.teamId}</code></span>
            <span style={{ color: T.fg4 }}>·</span>
            <span>Última atividade {relativeTime(detail.lastActivityAt)}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Pill tone={empresaStatusTone(detail.team.status) as PanelTone} dot>
            {empresaStatusLabel(detail.team.status)}
          </Pill>
          <Pill tone="mute">Plano {planLabel(detail.team.plan)}</Pill>
        </div>
      </div>
    </Card>
  )
}

/* ─── SUMMARY + CAPACIDADE ───────────────────────────────────────────────── */

function SummaryAndCapacity({ detail }: { detail: CompanyDetail }) {
  const { isMobile, isTablet } = usePanelViewport()
  const grid = isMobile
    ? "repeat(2, minmax(0, 1fr))"
    : isTablet
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(4, minmax(0, 1fr))"
  const coachesAlertTone = capacityToneFor(detail.capacity.coaches)
  const studentsAlertTone = capacityToneFor(detail.capacity.students)
  const coachesAlertText = capacityText(detail.capacity.coaches, "coaches")
  const studentsAlertText = capacityText(detail.capacity.students, "alunos")

  return (
    <div>
      <SectionHeader
        title="Plano e capacidade"
        subtitle={`Plano ${planLabel(detail.team.plan)} — uso atual vs. limite contratado`}
      />
      <div style={{ display: "grid", gridTemplateColumns: grid, gap: isMobile ? 10 : 14 }}>
        <KpiCard
          icon={<IShield size={15} />}
          label="Coaches usados"
          value={`${detail.usage.coaches} / ${formatLimit(detail.limits.maxCoaches)}`}
          sub={coachesAlertText}
          tone={coachesAlertTone}
        />
        <KpiCard
          icon={<IUsers size={15} />}
          label="Alunos usados"
          value={`${detail.usage.students} / ${formatLimit(detail.limits.maxStudents)}`}
          sub={studentsAlertText}
          tone={studentsAlertTone}
        />
        <KpiCard
          icon={<IShield size={15} />}
          label="Vagas de coach"
          value={formatVacancy(detail.vacancies.coaches)}
          sub={detail.vacancies.coaches === null ? "Sem limite (custom)" : "restantes no plano"}
          tone="brand"
        />
        <KpiCard
          icon={<IUsers size={15} />}
          label="Vagas de aluno"
          value={formatVacancy(detail.vacancies.students)}
          sub={detail.vacancies.students === null ? "Sem limite (custom)" : "restantes no plano"}
          tone="brand"
        />
      </div>
    </div>
  )
}

function capacityToneFor(c: CompanyDetail["capacity"]["coaches"]): "brand" | "warn" | "bad" {
  if (c === "reached") return "bad"
  if (c === "approaching") return "warn"
  return "brand"
}

function capacityText(c: CompanyDetail["capacity"]["coaches"], label: string): string {
  if (c === "reached") return `Limite de ${label} atingido`
  if (c === "approaching") return `Limite de ${label} próximo`
  return `Uso saudável de ${label}`
}

function formatLimit(n: number | null): string {
  return n === null ? "∞" : String(n)
}

function formatVacancy(n: number | null): string {
  return n === null ? "∞" : String(n)
}

/* ─── RISK KPIs ──────────────────────────────────────────────────────────── */

function RiskKpis({ detail }: { detail: CompanyDetail }) {
  const { isMobile, isTablet } = usePanelViewport()
  const grid = isMobile
    ? "repeat(2, minmax(0, 1fr))"
    : isTablet
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(4, minmax(0, 1fr))"
  return (
    <div>
      <SectionHeader title="Risco operacional" subtitle="Distribuição dos alunos da empresa por estado" />
      <div style={{ display: "grid", gridTemplateColumns: grid, gap: isMobile ? 10 : 14 }}>
        <KpiCard
          icon={<ITrend size={15} />}
          label="Em atenção"
          value={detail.risk.atencao}
          sub="3 a 5 dias sem sinal"
          tone="warn"
        />
        <KpiCard
          icon={<IZap size={15} />}
          label="Críticos"
          value={detail.risk.critico}
          sub="6+ dias sem sinal"
          tone="bad"
        />
        <KpiCard
          icon={<IUsers size={15} />}
          label="Sem 1º acesso"
          value={detail.risk.semPrimeiroAcesso}
          sub="Conta criada · sem login"
          tone="warn"
        />
        <KpiCard
          icon={<IUsers size={15} />}
          label="Convite pendente"
          value={detail.risk.convitePendente}
          sub="Pagamento ainda pendente"
          tone="warn"
        />
      </div>
    </div>
  )
}

/* ─── COACHES ────────────────────────────────────────────────────────────── */

function CoachesSection({ teamId, totalCoaches }: { teamId: string; totalCoaches: number }) {
  const { isMobile } = usePanelViewport()
  const page = useMemo(() => getCompanyCoaches(teamId, { pageSize: 50 }), [teamId])
  return (
    <Card>
      <div
        style={{
          padding: isMobile ? "14px 16px 10px" : "16px 20px 12px",
          borderBottom: `1px solid ${T.borderSoft}`,
        }}
      >
        <SectionHeader
          title="Coaches da empresa"
          subtitle={`${totalCoaches} coach${totalCoaches === 1 ? "" : "es"} cadastrado${totalCoaches === 1 ? "" : "s"}`}
        />
      </div>
      {page.items.length === 0 ? (
        <EmptyBlock icon={<IShield size={20} />} text="Nenhum coach cadastrado nesta empresa." />
      ) : (
        <div>
          {page.items.map((row, i) => (
            <CoachRow key={row.coachId} row={row} isFirst={i === 0} />
          ))}
        </div>
      )}
    </Card>
  )
}

function CoachRow({ row, isFirst }: { row: CoachSummaryRow; isFirst: boolean }) {
  const { isMobile } = usePanelViewport()
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
          ? "auto 1fr auto"
          : "auto 1.4fr 80px 80px 80px 100px 24px",
        alignItems: "center",
        gap: 12,
        padding: isMobile ? "12px 16px" : "12px 22px",
        borderTop: isFirst ? "none" : `1px solid ${T.borderSoft}`,
        background: T.surface,
        cursor: "default",
      }}
    >
      <Avatar name={row.name} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 13.5,
            fontWeight: 500,
            color: T.fg,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {row.name}
        </div>
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 12,
            color: T.fg3,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {row.email}
        </div>
      </div>
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <Num c={T.fg2}>{row.studentsTotal} alunos</Num>
          <div style={{ display: "flex", gap: 6 }}>
            {row.risk.atencao > 0 && (
              <Pill tone="warn" style={{ height: 18, fontSize: 10.5, padding: "0 6px" }}>
                {row.risk.atencao}
              </Pill>
            )}
            {row.risk.critico > 0 && (
              <Pill tone="bad" style={{ height: 18, fontSize: 10.5, padding: "0 6px" }}>
                {row.risk.critico}
              </Pill>
            )}
          </div>
        </div>
      ) : (
        <>
          <Num c={T.fg2}>{row.studentsTotal}</Num>
          <Num c={row.risk.atencao > 0 ? T.warn : T.fg4}>{row.risk.atencao}</Num>
          <Num c={row.risk.critico > 0 ? T.bad : T.fg4}>{row.risk.critico}</Num>
          <span style={{ fontFamily: T.ui, fontSize: 12, color: T.fg3 }}>
            {row.lastActionAt ? relativeTime(row.lastActionAt) : "—"}
          </span>
          {/* Coach detail é Fase 2c.3 — sem chevron clicável ainda */}
          <span style={{ color: T.fg5, fontSize: 12 }}>—</span>
        </>
      )}
    </div>
  )
}

/* ─── ALUNOS ─────────────────────────────────────────────────────────────── */

const STUDENT_FILTER_OPTIONS: Array<{ key: StudentRiskFilter; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "atencao", label: "Atenção" },
  { key: "critico", label: "Críticos" },
  { key: "sem-primeiro-acesso", label: "Sem 1º acesso" },
  { key: "convite-pendente", label: "Convite pendente" },
  { key: "pausados", label: "Pausados" },
  { key: "arquivados", label: "Arquivados" },
]

function StudentsSection({ teamId, totalStudents }: { teamId: string; totalStudents: number }) {
  const { isMobile } = usePanelViewport()
  const [search, setSearch] = useState("")
  const [riskFilter, setRiskFilter] = useState<StudentRiskFilter>("todos")
  const [coachFilter, setCoachFilter] = useState<string>("todos")

  const coachesPage = useMemo(() => getCompanyCoaches(teamId, { pageSize: 100 }), [teamId])
  const studentsPage = useMemo(
    () =>
      getCompanyStudents(teamId, {
        pageSize: 50,
        search: search || undefined,
        riskFilter,
        coachId: coachFilter === "todos" ? undefined : coachFilter,
      }),
    [teamId, search, riskFilter, coachFilter],
  )

  return (
    <Card>
      <div
        style={{
          padding: isMobile ? "14px 16px 10px" : "16px 20px 12px",
          borderBottom: `1px solid ${T.borderSoft}`,
        }}
      >
        <SectionHeader
          title="Alunos da empresa"
          subtitle={`${totalStudents} aluno${totalStudents === 1 ? "" : "s"} no time — filtra por coach ou risco`}
        />
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: 10,
            marginTop: 4,
            flexWrap: "wrap",
          }}
        >
          {/* Filtro por coach */}
          <select
            value={coachFilter}
            onChange={(e) => setCoachFilter(e.target.value)}
            style={{
              height: 32,
              padding: "0 10px",
              borderRadius: 8,
              border: `1px solid ${T.borderStrong}`,
              background: T.surface,
              fontFamily: T.ui,
              fontSize: 12.5,
              color: T.fg,
              cursor: "pointer",
              outline: "none",
              flexShrink: 0,
            }}
          >
            <option value="todos">Todos os coaches</option>
            {coachesPage.items.map((c) => (
              <option key={c.coachId} value={c.coachId}>
                {c.name}
              </option>
            ))}
          </select>
          {/* Filtro por risco */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STUDENT_FILTER_OPTIONS.map((opt) => {
              const active = riskFilter === opt.key
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setRiskFilter(opt.key)}
                  style={{
                    height: 28,
                    padding: "0 10px",
                    borderRadius: 999,
                    border: `1px solid ${active ? T.brandLine : T.border}`,
                    background: active ? T.brandSoft : T.surface,
                    color: active ? T.brand : T.fg3,
                    fontFamily: T.ui,
                    fontSize: 11.5,
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar aluno…"
            style={{ maxWidth: isMobile ? "100%" : 260 }}
          />
        </div>
      </div>

      {studentsPage.items.length === 0 ? (
        <EmptyBlock
          icon={<IUsers size={20} />}
          text={
            search
              ? `Nenhum aluno bate com "${search}".`
              : riskFilter !== "todos"
                ? `Nenhum aluno no filtro "${riskFilter}".`
                : "Nenhum aluno cadastrado na empresa."
          }
        />
      ) : (
        <div>
          {studentsPage.items.map((row, i) => (
            <StudentRow key={row.userId} row={row} isFirst={i === 0} />
          ))}
        </div>
      )}
    </Card>
  )
}

const RISK_PILL_MAP: Record<PanelRiskClass, { tone: PanelTone; label: string }> = {
  ok: { tone: "ok", label: "Em dia" },
  atencao: { tone: "warn", label: "Atenção" },
  critico: { tone: "bad", label: "Crítico" },
  "sem-sinal": { tone: "mute", label: "Sem sinal" },
  pausado: { tone: "mute", label: "Pausado" },
  "convite-pendente": { tone: "warn", label: "Convite pendente" },
  "sem-primeiro-acesso": { tone: "warn", label: "Sem 1º acesso" },
}

function StudentRow({ row, isFirst }: { row: StudentSummaryRow; isFirst: boolean }) {
  const { isMobile } = usePanelViewport()
  const risk = RISK_PILL_MAP[row.risk]
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
          ? "auto 1fr auto"
          : "auto 1.4fr 1fr 110px 100px 24px",
        alignItems: "center",
        gap: 12,
        padding: isMobile ? "12px 16px" : "12px 22px",
        borderTop: isFirst ? "none" : `1px solid ${T.borderSoft}`,
        background: T.surface,
      }}
    >
      <Avatar name={row.name} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 13.5,
            fontWeight: 500,
            color: T.fg,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {row.name}
        </div>
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 12,
            color: T.fg3,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Coach {row.coachName} · {subLabel(row.subscriptionStatus)}
        </div>
      </div>
      {isMobile ? (
        <Pill tone={risk.tone} dot>
          {risk.label}
        </Pill>
      ) : (
        <>
          <span
            style={{
              fontFamily: T.ui,
              fontSize: 12.5,
              color: T.fg3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {row.lastValidationAt
              ? `Validado ${relativeTime(row.lastValidationAt)}`
              : row.lastActiveAt
                ? `Ativo ${relativeTime(row.lastActiveAt)}`
                : "Sem sinal"}
          </span>
          <Pill tone={risk.tone} dot>
            {risk.label}
          </Pill>
          <Num c={T.fg2}>{row.weeklyXp} XP</Num>
          {/* Aluno detail é Fase 2c.4 — sem chevron clicável ainda */}
          <span style={{ color: T.fg5, fontSize: 12 }}>—</span>
        </>
      )}
    </div>
  )
}

/* ─── PENDÊNCIAS ─────────────────────────────────────────────────────────── */

function PendingSection({ teamId }: { teamId: string }) {
  const { isMobile } = usePanelViewport()
  const resume = useMemo(() => getCompanyPending(teamId), [teamId])
  return (
    <Card>
      <div
        style={{
          padding: isMobile ? "14px 16px 10px" : "16px 20px 12px",
          borderBottom: `1px solid ${T.borderSoft}`,
        }}
      >
        <SectionHeader
          title="Pendências operacionais"
          subtitle={`${resume.totals.total} item${resume.totals.total === 1 ? "" : "s"} aguardando aprovação`}
          action={
            <Btn variant="ghost" sm>
              Ver fila de aprovações
              <IChevR size={13} />
            </Btn>
          }
        />
      </div>
      {resume.items.length === 0 ? (
        <EmptyBlock icon={<IGavel size={20} />} text="Sem pendências para esta empresa." />
      ) : (
        <div>
          {resume.items.map((item, i) => (
            <PendingRow key={item.id} item={item} isFirst={i === 0} />
          ))}
        </div>
      )}
    </Card>
  )
}

function PendingRow({ item, isFirst }: { item: CompanyPendingItem; isFirst: boolean }) {
  const { isMobile } = usePanelViewport()
  const Icon = item.kind === "exercise" ? IDumbbell : item.kind === "food" ? IFork : IGavel
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "auto 1fr auto" : "auto 1.6fr 1fr 100px",
        alignItems: "center",
        gap: 12,
        padding: isMobile ? "12px 16px" : "12px 22px",
        borderTop: isFirst ? "none" : `1px solid ${T.borderSoft}`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: T.warnSoft,
          color: T.warn,
          border: `1px solid ${T.warnLine}`,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={14} />
      </div>
      <div
        style={{
          fontFamily: T.ui,
          fontSize: 13.5,
          fontWeight: 500,
          color: T.fg,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {item.title}
      </div>
      {!isMobile && (
        <span style={{ fontFamily: T.ui, fontSize: 12.5, color: T.fg3 }}>
          Enviado por {item.submittedByName}
        </span>
      )}
      <span style={{ fontFamily: T.ui, fontSize: 12, color: T.fg3, textAlign: "right" }}>
        {item.submittedAt === "—" ? "—" : relativeTime(item.submittedAt)}
      </span>
    </div>
  )
}

/* ─── ARENA ──────────────────────────────────────────────────────────────── */

function ArenaSection({ teamId, isDesktopOrTablet }: { teamId: string; isDesktopOrTablet: boolean }) {
  const weekly = useMemo(() => getCompanyArena(teamId, "weekly"), [teamId])
  const monthly = useMemo(() => getCompanyArena(teamId, "monthly"), [teamId])
  return (
    <div>
      <SectionHeader
        title="Arena da empresa"
        subtitle="Ranking semanal e mensal do time. Arena Geral é global."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isDesktopOrTablet ? "1fr 1fr" : "minmax(0, 1fr)",
          gap: isDesktopOrTablet ? 16 : 14,
        }}
      >
        <ArenaCard title="Arena Semanal" ranking={weekly} />
        <ArenaCard title="Arena Mensal" ranking={monthly} />
      </div>
    </div>
  )
}

function ArenaCard({ title, ranking }: { title: string; ranking: CompanyArenaRanking }) {
  const { isMobile } = usePanelViewport()
  return (
    <Card>
      <div
        style={{
          padding: isMobile ? "14px 16px 10px" : "16px 20px 12px",
          borderBottom: `1px solid ${T.borderSoft}`,
        }}
      >
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 14,
            fontWeight: 600,
            color: T.fg,
            letterSpacing: "-0.005em",
          }}
        >
          {title} — {ranking.teamName}
        </div>
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 12.5,
            color: T.fg3,
            marginTop: 2,
          }}
        >
          Top {ranking.items.length} de {ranking.totalVisible} visíveis
        </div>
      </div>
      {ranking.items.length === 0 ? (
        <EmptyBlock icon={<ITrend size={20} />} text="Nenhum aluno visível na Arena ainda." />
      ) : (
        <div>
          {ranking.items.map((row, i) => (
            <ArenaRow key={row.userId} row={row} isFirst={i === 0} />
          ))}
        </div>
      )}
    </Card>
  )
}

function ArenaRow({ row, isFirst }: { row: ArenaEntry; isFirst: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "32px 1fr auto auto",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderTop: isFirst ? "none" : `1px solid ${T.borderSoft}`,
      }}
    >
      <PositionPill pos={row.position} />
      <div
        style={{
          fontFamily: T.ui,
          fontSize: 13.5,
          fontWeight: 500,
          color: T.fg,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {row.displayName}
      </div>
      <Num c={T.fg2}>{row.xp} XP</Num>
      <span style={{ fontFamily: T.ui, fontSize: 11, color: T.fg4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {row.avatarStage}
      </span>
    </div>
  )
}

function PositionPill({ pos }: { pos: number }) {
  const isMedal = pos <= 3
  const bg = pos === 1 ? "#FEF3C7" : pos === 2 ? "#E2E8F0" : pos === 3 ? "#FED7AA" : T.muteSoft
  const fg = pos === 1 ? "#A16207" : pos === 2 ? "#475569" : pos === 3 ? "#C2410C" : T.fg3
  return (
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: 999,
        background: bg,
        color: fg,
        display: "grid",
        placeItems: "center",
        fontFamily: T.mono,
        fontSize: 12,
        fontWeight: 700,
        border: isMedal ? "none" : `1px solid ${T.borderSoft}`,
      }}
    >
      {pos}
    </span>
  )
}

/* ─── LOGS ───────────────────────────────────────────────────────────────── */

const LOG_LABELS: Record<string, string> = {
  "student.workout.saved": "Treino salvo",
  "student.workout.locked": "Treino travado",
  "student.diet.generated": "Dieta gerada",
  "student.access.paused": "Acesso pausado",
  "student.xp.weekly.reset": "Reset XP semanal",
  "student.created": "Aluno criado",
  "coach.created": "Coach criado",
  "student.calibration.updated": "Calibragem atualizada",
  "team.plan.updated": "Plano da empresa atualizado",
  "student.invite.regenerated": "Convite regenerado",
}

function LogsSection({ teamId }: { teamId: string }) {
  const { isMobile } = usePanelViewport()
  const logs = useMemo(() => getCompanyLogs(teamId, 20), [teamId])
  return (
    <Card>
      <div
        style={{
          padding: isMobile ? "14px 16px 10px" : "16px 20px 12px",
          borderBottom: `1px solid ${T.borderSoft}`,
        }}
      >
        <SectionHeader
          title="Logs da empresa"
          subtitle={`Últimas ${logs.items.length} ações ${logs.items.length === 1 ? "registrada" : "registradas"}`}
        />
      </div>
      {logs.items.length === 0 ? (
        <EmptyBlock icon={<ILog size={20} />} text="Sem logs para esta empresa ainda." />
      ) : (
        <div>
          {logs.items.map((log, i) => (
            <LogRow key={log.id} log={log} isFirst={i === 0} />
          ))}
        </div>
      )}
    </Card>
  )
}

function LogRow({ log, isFirst }: { log: CompanyLogRow; isFirst: boolean }) {
  const { isMobile } = usePanelViewport()
  const label = LOG_LABELS[log.action] ?? log.action
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr auto" : "150px 1fr 1fr auto",
        alignItems: "center",
        gap: 12,
        padding: isMobile ? "12px 16px" : "12px 22px",
        borderTop: isFirst ? "none" : `1px solid ${T.borderSoft}`,
      }}
    >
      {!isMobile && (
        <span style={{ fontFamily: T.ui, fontSize: 12.5, color: T.fg3 }}>{relativeTime(log.timestamp)}</span>
      )}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 13.5,
            fontWeight: 500,
            color: T.fg,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 12,
            color: T.fg3,
            marginTop: 2,
          }}
        >
          {log.actorName} · {log.actorRole}
        </div>
      </div>
      {!isMobile && (
        <span style={{ fontFamily: T.ui, fontSize: 12.5, color: T.fg3 }}>
          {log.targetName ? `→ ${log.targetName}` : "—"}
        </span>
      )}
      {isMobile && (
        <span style={{ fontFamily: T.ui, fontSize: 11, color: T.fg4 }}>{relativeTime(log.timestamp)}</span>
      )}
    </div>
  )
}

/* ─── Empty block atom ───────────────────────────────────────────────────── */

function EmptyBlock({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ padding: "40px 24px", textAlign: "center" }}>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          background: T.muteSoft,
          color: T.fg4,
          display: "grid",
          placeItems: "center",
          margin: "0 auto 12px",
        }}
      >
        {icon}
      </div>
      <div style={{ fontFamily: T.ui, fontSize: 13.5, color: T.fg2 }}>{text}</div>
    </div>
  )
}
