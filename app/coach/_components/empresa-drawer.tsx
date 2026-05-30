"use client"

import { useMemo } from "react"
import { Building2, Users, Shield, CreditCard, ScrollText, Plus, X } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useCockpit } from "./cockpit-context"
import { T, planLabel, teamStatusLabel, teamStatusTone } from "./control-tokens"
import { Plate, Pill, Btn, Kicker, CtrlDataRow, UsageBar, SectionTitle } from "./controls"
import type { EmpresaTab } from "./utils"
import { coachLabel, relativeTime, studentRisk } from "./utils"
import type { AdminCoach, AdminStudent, AdminTeam } from "@/lib/api/admin"
import { usePanelI18n } from "@/lib/panel-i18n"

const EMPRESA_TABS: { id: EmpresaTab; label: string; icon: React.ReactNode }[] = [
  { id: "resumo", label: "Resumo", icon: <Building2 className="h-3.5 w-3.5" /> },
  { id: "coaches", label: "Coaches", icon: <Shield className="h-3.5 w-3.5" /> },
  { id: "alunos", label: "Alunos", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "plano", label: "Plano", icon: <CreditCard className="h-3.5 w-3.5" /> },
  { id: "logs", label: "Logs", icon: <ScrollText className="h-3.5 w-3.5" /> },
]

// ─── Helpers para filtrar dados por empresa ──────────────────────────────────

function coachesOfEmpresa(team: AdminTeam, allCoaches: AdminCoach[]): AdminCoach[] {
  return allCoaches.filter((c) => c.teamId === team.id)
}

function studentsOfEmpresa(team: AdminTeam, allStudents: AdminStudent[]): AdminStudent[] {
  return allStudents.filter((s) => s.teamId === team.id)
}

// ─── Drawer principal ─────────────────────────────────────────────────────────

export function EmpresaDrawer() {
  const {
    selectedEmpresa,
    closeEmpresa,
    empresaTab,
    setEmpresaTab,
  } = useCockpit()

  return (
    <Sheet open={!!selectedEmpresa} onOpenChange={(open) => { if (!open) closeEmpresa() }}>
      <SheetContent
        side="right"
        showClose={false}
        className="w-full gap-0 border-l border-slate-200 p-0 text-slate-900 sm:max-w-3xl"
        style={{ fontFamily: T.ui, background: T.bg }}
      >
        {selectedEmpresa && (
          // Layout em coluna: header e tabs fixos (shrink-0), só o corpo rola.
          // Garante que as abas/ações fiquem SEMPRE visíveis (desktop/Safari/iPad).
          <div className="flex h-full min-h-0 flex-col">
            <DrawerHeader empresa={selectedEmpresa} onClose={closeEmpresa} />
            <DrawerTabBar activeTab={empresaTab} onChange={setEmpresaTab} />
            <div className="min-h-0 flex-1 overflow-y-auto" style={{ padding: 24 }}>
              {empresaTab === "resumo" && <TabResumo empresa={selectedEmpresa} />}
              {empresaTab === "coaches" && <TabCoaches empresa={selectedEmpresa} />}
              {empresaTab === "alunos" && <TabAlunos empresa={selectedEmpresa} />}
              {empresaTab === "plano" && <TabPlano empresa={selectedEmpresa} />}
              {empresaTab === "logs" && <TabLogs empresa={selectedEmpresa} />}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─── Header / Tab bar (light, handoff design) ────────────────────────────────

function DrawerHeader({ empresa, onClose }: { empresa: AdminTeam; onClose: () => void }) {
  const { t } = usePanelI18n()
  return (
    <header
      style={{
        flexShrink: 0,
        padding: "16px 24px",
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: T.brandSoft,
            color: T.brand,
            border: `1px solid ${T.brandLine}`,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Building2 className="h-[18px] w-[18px]" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: T.ui, fontSize: 11.5, fontWeight: 500, color: T.fg4, letterSpacing: "0.02em" }}>
            Empresa · <span style={{ fontFamily: T.mono, fontSize: 11 }}>{empresa.id}</span>
          </div>
          <SheetTitle
            style={{
              fontFamily: T.ui,
              fontSize: 20,
              fontWeight: 600,
              color: T.fg,
              letterSpacing: "-0.015em",
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {empresa.name}
          </SheetTitle>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <Pill tone={teamStatusTone(empresa.status)}>{teamStatusLabel(empresa.status)}</Pill>
        <Pill tone="neutral">{planLabel(empresa.plan)}</Pill>
        <button
          onClick={onClose}
          aria-label={t.empresaDrawer.close}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.fg3,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}

function DrawerTabBar({
  activeTab,
  onChange,
}: {
  activeTab: EmpresaTab
  onChange: (t: EmpresaTab) => void
}) {
  const { t } = usePanelI18n()
  const tabLabel: Record<EmpresaTab, string> = {
    resumo: t.empresaDrawer.tabResumo,
    coaches: t.empresaDrawer.tabCoaches,
    alunos: t.empresaDrawer.tabAlunos,
    plano: t.empresaDrawer.tabPlano,
    logs: t.empresaDrawer.tabLogs,
  }
  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        gap: 2,
        overflowX: "auto",
        padding: "0 16px",
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      {EMPRESA_TABS.map((tab) => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "12px 14px",
              color: active ? T.brandDeep : T.fg3,
              fontFamily: T.ui,
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              borderBottom: active ? `2px solid ${T.brandStrong}` : "2px solid transparent",
              marginBottom: -1,
              display: "flex",
              alignItems: "center",
              gap: 7,
              whiteSpace: "nowrap",
            }}
          >
            {tab.icon}
            {tabLabel[tab.id]}
          </button>
        )
      })}
    </div>
  )
}

// ─── Tab Resumo ──────────────────────────────────────────────────────────────

function TabResumo({ empresa }: { empresa: AdminTeam }) {
  const { coaches, students, empresaSummary, empresaSummaryError } = useCockpit()
  const { t, lang } = usePanelI18n()
  const empresaCoaches = useMemo(() => coachesOfEmpresa(empresa, coaches), [empresa, coaches])
  const empresaStudents = useMemo(() => studentsOfEmpresa(empresa, students), [empresa, students])
  const criticos = useMemo(
    () => empresaStudents.filter((s) => studentRisk(s) === "critico").length,
    [empresaStudents]
  )

  const usage = empresaSummary?.usage ?? {
    students: empresaStudents.length,
    coaches: empresaCoaches.length,
  }
  const limits = empresaSummary?.limits ?? {
    maxStudents: empresa.customLimits?.maxStudents ?? null,
    maxCoaches: empresa.customLimits?.maxCoaches ?? null,
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Plate style={{ padding: 20 }}>
        <SectionTitle>{t.empresaDrawer.sectionUsage}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <UsageBar value={usage.students} max={limits.maxStudents} />
          <UsageBar value={usage.coaches} max={limits.maxCoaches} />
        </div>
        {empresaSummaryError && (
          <p
            style={{
              marginTop: 12,
              fontFamily: T.mono,
              fontSize: 10,
              color: T.bad,
              letterSpacing: "0.10em",
            }}
          >
            ⚠ {empresaSummaryError}
          </p>
        )}
      </Plate>

      <Plate style={{ padding: 20 }}>
        <SectionTitle>{t.empresaDrawer.sectionStatus}</SectionTitle>
        <CtrlDataRow label={t.empresaDrawer.rowPlan} value={planLabel(empresa.plan)} />
        <CtrlDataRow label={t.empresaDrawer.rowStatus} value={teamStatusLabel(empresa.status)} />
        <CtrlDataRow label={t.empresaDrawer.rowCoaches} value={String(empresaCoaches.length)} />
        <CtrlDataRow label={t.empresaDrawer.rowActiveStudents} value={String(empresaStudents.filter((s) => s.active && !s.archived).length)} />
        <CtrlDataRow label={t.empresaDrawer.rowCriticalStudents} value={String(criticos)} />
        <CtrlDataRow label={t.empresaDrawer.rowCreatedAt} value={empresa.createdAt ? new Date(empresa.createdAt).toLocaleDateString(lang) : "—"} />
      </Plate>

      <Plate style={{ padding: 20 }}>
        <SectionTitle>{t.empresaDrawer.sectionContact}</SectionTitle>
        <CtrlDataRow label={t.empresaDrawer.rowEmail} value={empresa.email || "—"} />
        <CtrlDataRow label={t.empresaDrawer.rowPhone} value={empresa.phone || "—"} />
        <CtrlDataRow label={t.empresaDrawer.rowAddress} value={empresa.addressLine || "—"} />
        <CtrlDataRow label={t.empresaDrawer.rowCityCountry} value={[empresa.city, empresa.country].filter(Boolean).join(" · ") || "—"} />
      </Plate>
    </div>
  )
}

// ─── Tab Coaches ─────────────────────────────────────────────────────────────

function TabCoaches({ empresa }: { empresa: AdminTeam }) {
  const { coaches, students, openCoach, coachLimitReached, setCoachDraft, setSelectedTeamId, setShowCreateCoach } =
    useCockpit()
  const { t } = usePanelI18n()
  const empresaCoaches = useMemo(() => coachesOfEmpresa(empresa, coaches), [empresa, coaches])

  // Cria coach JÁ vinculado a esta empresa (contexto do drawer).
  const openCreateCoach = () => {
    setSelectedTeamId(empresa.id)
    setCoachDraft({ name: "", email: "", password: "", teamId: empresa.id })
    setShowCreateCoach(true)
  }

  const addButton = (
    <Btn cyan sm disabled={coachLimitReached} onClick={openCreateCoach}>
      <Plus className="h-3 w-3" />
      {t.empresaDrawer.tabCoaches}
    </Btn>
  )

  if (!empresaCoaches.length) {
    return (
      <Plate style={{ padding: 32, textAlign: "center", display: "grid", gap: 14, justifyItems: "center" }}>
        <p style={{ fontFamily: T.ui, fontSize: 13, color: T.fg3 }}>
          Sem coaches nesta empresa ainda.
        </p>
        {addButton}
      </Plate>
    )
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>{addButton}</div>
      {empresaCoaches.map((coach) => {
        const stCount = students.filter((s) => s.coachId === coach.userId).length
        return (
          <button
            key={coach.userId}
            onClick={() => openCoach(coach)}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              background: T.panel,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.fg, marginBottom: 2 }}>
                {coach.name || coach.email || coach.userId}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3 }}>
                {coach.email}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: T.mono, fontSize: 8, color: T.fg4, letterSpacing: "0.20em" }}>
                ALUNOS
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 900, color: T.cyan }}>
                {stCount}
              </div>
            </div>
            <Pill tone={coach.active ? "ok" : "mute"}>{coach.active ? "ATIVO" : "PAUSADO"}</Pill>
          </button>
        )
      })}
    </div>
  )
}

// ─── Tab Alunos ──────────────────────────────────────────────────────────────

function TabAlunos({ empresa }: { empresa: AdminTeam }) {
  const {
    students,
    coaches,
    openStudent,
    setSelectedTeamId,
    setStudentDraft,
    setShowCreateStudent,
    studentLimitReached,
  } = useCockpit()
  const { t } = usePanelI18n()
  const empresaStudents = useMemo(() => studentsOfEmpresa(empresa, students), [empresa, students])

  // Cria aluno JÁ vinculado a esta empresa (contexto do drawer). O coach é
  // exigido dentro do diálogo (filtrado por esta empresa) quando ela é cliente.
  const openCreateStudent = () => {
    setSelectedTeamId(empresa.id)
    setStudentDraft({
      name: "", email: "", phone: "", password: "", active: true,
      coachId: "", teamId: empresa.id, sex: "", age: "",
    })
    setShowCreateStudent(true)
  }

  const addButton = (
    <Btn cyan sm disabled={studentLimitReached} onClick={openCreateStudent}>
      <Plus className="h-3 w-3" />
      {t.empresaDrawer.tabAlunos}
    </Btn>
  )

  if (!empresaStudents.length) {
    return (
      <Plate style={{ padding: 32, textAlign: "center", display: "grid", gap: 14, justifyItems: "center" }}>
        <p style={{ fontFamily: T.ui, fontSize: 13, color: T.fg3 }}>
          Sem alunos nesta empresa ainda.
        </p>
        {addButton}
      </Plate>
    )
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>{addButton}</div>
      {empresaStudents.map((s) => {
        const risk = studentRisk(s)
        const tone =
          risk === "critico"
            ? "bad"
            : risk === "atencao"
              ? "warn"
              : risk === "sem-sinal"
                ? "mute"
                : "ok"
        const label =
          risk === "critico"
            ? "CRÍTICO"
            : risk === "atencao"
              ? "ATENÇÃO"
              : risk === "sem-sinal"
                ? "SEM SINAL"
                : "EM DIA"
        return (
          <button
            key={s.userId}
            onClick={() => openStudent(s)}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 100px",
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
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.fg,
                  marginBottom: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {s.name}
              </div>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  color: T.fg3,
                }}
              >
                {coachLabel(s, coaches)}
              </div>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3 }}>
              {relativeTime(s.lastValidationAt)}
            </div>
            <Pill tone={tone}>{label}</Pill>
          </button>
        )
      })}
    </div>
  )
}

// ─── Tab Plano ───────────────────────────────────────────────────────────────

function TabPlano({ empresa }: { empresa: AdminTeam }) {
  const { isSuperAdmin, refreshEmpresa } = useCockpit()
  const { t, lang } = usePanelI18n()
  const limits = empresa.customLimits ?? {}

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Plate style={{ padding: 20 }}>
        <SectionTitle>{t.empresaDrawer.sectionPlanDetails}</SectionTitle>
        <CtrlDataRow label={t.empresaDrawer.rowPlan} value={planLabel(empresa.plan)} />
        <CtrlDataRow label={t.empresaDrawer.rowStatus} value={teamStatusLabel(empresa.status)} />
        <CtrlDataRow label={t.empresaDrawer.rowStudentLimit} value={limits.maxStudents ?? t.empresaDrawer.unlimited} />
        <CtrlDataRow label={t.empresaDrawer.rowCoachLimit} value={limits.maxCoaches ?? t.empresaDrawer.unlimited} />
        <CtrlDataRow label={t.empresaDrawer.rowUpdatedAt} value={empresa.updatedAt ? new Date(empresa.updatedAt).toLocaleString(lang) : "—"} />
      </Plate>

      {isSuperAdmin && (
        <Plate hi style={{ padding: 20 }}>
          <Kicker cyan>AÇÕES RÁPIDAS</Kicker>
          <p
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.fg3,
              marginTop: 8,
              marginBottom: 12,
              lineHeight: 1.6,
            }}
          >
            Edição completa de plano (alterar plano, custom limits, pausar/arquivar) usa o modal global de edição.
            Por enquanto, status alterado direto no card da empresa em /empresas.
          </p>
          <Btn ghost sm onClick={() => void refreshEmpresa()}>
            Atualizar uso
          </Btn>
        </Plate>
      )}

      <Plate dp style={{ padding: 16 }}>
        <p style={{ fontFamily: T.ui, fontSize: 12.5, color: T.fg3, lineHeight: 1.6 }}>
          Billing (status de pagamento, MRR, próxima cobrança) ainda não está disponível neste painel.
        </p>
      </Plate>
    </div>
  )
}

// ─── Tab Logs ────────────────────────────────────────────────────────────────

function TabLogs({ empresa }: { empresa: AdminTeam }) {
  const { globalLogs, students, coaches } = useCockpit()

  // Filtra logs cujos targetUserId/actorUserId pertençam a alunos ou coaches da empresa.
  const relevantUserIds = useMemo(() => {
    const ids = new Set<string>()
    students.filter((s) => s.teamId === empresa.id).forEach((s) => ids.add(s.userId))
    coaches.filter((c) => c.teamId === empresa.id).forEach((c) => ids.add(c.userId))
    return ids
  }, [empresa.id, students, coaches])

  const empresaLogs = useMemo(
    () =>
      globalLogs.filter(
        (log) =>
          (log.targetUserId && relevantUserIds.has(log.targetUserId)) ||
          (log.actorUserId && relevantUserIds.has(log.actorUserId))
      ),
    [globalLogs, relevantUserIds]
  )

  if (!empresaLogs.length) {
    return (
      <Plate style={{ padding: 32, textAlign: "center" }}>
        <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg3 }}>
          Sem registros para esta empresa.
        </p>
      </Plate>
    )
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {empresaLogs.slice(0, 80).map((log, idx) => (
        <Plate key={log.id || idx} style={{ padding: "10px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                fontWeight: 900,
                color: T.cyan,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {log.action || "ação"}
            </span>
            <span style={{ fontFamily: T.mono, fontSize: 9, color: T.fg4 }}>
              {log.timestamp ? new Date(log.timestamp).toLocaleString("pt-BR") : "—"}
            </span>
          </div>
          <p style={{ fontFamily: T.mono, fontSize: 9, color: T.fg3, marginTop: 4 }}>
            {log.actorRole || "—"} · {log.actorUserId || "—"}
            {log.targetUserId ? ` → ${log.targetUserId}` : ""}
          </p>
        </Plate>
      ))}
      {empresaLogs.length > 80 && (
        <p style={{ fontFamily: T.mono, fontSize: 9, color: T.fg4, textAlign: "center", marginTop: 8 }}>
          mostrando primeiros 80 registros
        </p>
      )}
    </div>
  )
}
