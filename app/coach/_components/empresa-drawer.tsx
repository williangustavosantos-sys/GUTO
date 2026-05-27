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

const EMPRESA_TABS: { id: EmpresaTab; label: string; icon: React.ReactNode }[] = [
  { id: "resumo", label: "RESUMO", icon: <Building2 className="h-3 w-3" /> },
  { id: "coaches", label: "COACHES", icon: <Shield className="h-3 w-3" /> },
  { id: "alunos", label: "ALUNOS", icon: <Users className="h-3 w-3" /> },
  { id: "plano", label: "PLANO", icon: <CreditCard className="h-3 w-3" /> },
  { id: "logs", label: "LOGS", icon: <ScrollText className="h-3 w-3" /> },
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
        className="w-full overflow-y-auto p-0 sm:max-w-3xl"
        style={{
          background: T.ink,
          borderLeft: `1px solid ${T.border}`,
          color: T.fg,
          fontFamily: T.mono,
        }}
      >
        {selectedEmpresa && (
          <div className="flex min-h-full flex-col">
            <DrawerHeader empresa={selectedEmpresa} onClose={closeEmpresa} />
            <DrawerTabBar activeTab={empresaTab} onChange={setEmpresaTab} />
            <div style={{ padding: 24 }}>
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

// ─── Header / Tab bar ────────────────────────────────────────────────────────

function DrawerHeader({ empresa, onClose }: { empresa: AdminTeam; onClose: () => void }) {
  return (
    <header
      style={{
        padding: "20px 24px",
        borderBottom: `1px solid ${T.border}`,
        background: "linear-gradient(180deg, rgba(8,14,28,0.96) 0%, rgba(4,7,16,0.84) 100%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Pill tone="cyan">EMPRESA</Pill>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: T.fg3, cursor: "pointer", padding: 4 }}
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <SheetTitle
        style={{
          fontFamily: T.mono,
          fontSize: 22,
          fontWeight: 900,
          color: T.fg,
          letterSpacing: "-0.01em",
        }}
      >
        {empresa.name}
      </SheetTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <Pill tone={teamStatusTone(empresa.status)}>{teamStatusLabel(empresa.status)}</Pill>
        <Pill tone="neutral">{planLabel(empresa.plan)}</Pill>
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            color: T.fg4,
            letterSpacing: "0.10em",
          }}
        >
          ID · {empresa.id}
        </span>
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
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        display: "flex",
        gap: 4,
        overflowX: "auto",
        padding: "12px 16px",
        background: "rgba(4,7,16,0.92)",
        borderBottom: `1px solid ${T.border}`,
        backdropFilter: "blur(10px)",
      }}
    >
      {EMPRESA_TABS.map((tab) => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              height: 32,
              padding: "0 14px",
              borderRadius: 999,
              cursor: "pointer",
              border: active ? `1px solid ${T.cyan}` : `1px solid ${T.border}`,
              background: active ? T.cyanSoft : "transparent",
              color: active ? T.cyan : T.fg3,
              fontFamily: T.mono,
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Tab Resumo ──────────────────────────────────────────────────────────────

function TabResumo({ empresa }: { empresa: AdminTeam }) {
  const { coaches, students, empresaSummary, empresaSummaryError } = useCockpit()
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
        <SectionTitle>USO ATUAL</SectionTitle>
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
        <SectionTitle>STATUS</SectionTitle>
        <CtrlDataRow label="Plano" value={planLabel(empresa.plan)} />
        <CtrlDataRow label="Status" value={teamStatusLabel(empresa.status)} />
        <CtrlDataRow label="Coaches" value={String(empresaCoaches.length)} />
        <CtrlDataRow label="Alunos ativos" value={String(empresaStudents.filter((s) => s.active && !s.archived).length)} />
        <CtrlDataRow label="Alunos críticos" value={String(criticos)} />
        <CtrlDataRow label="Criada em" value={empresa.createdAt ? new Date(empresa.createdAt).toLocaleDateString("pt-BR") : "—"} />
      </Plate>

      <Plate style={{ padding: 20 }}>
        <SectionTitle>CONTATO</SectionTitle>
        <CtrlDataRow label="E-mail" value={empresa.email || "—"} />
        <CtrlDataRow label="Telefone" value={empresa.phone || "—"} />
        <CtrlDataRow label="Endereço" value={empresa.addressLine || "—"} />
        <CtrlDataRow label="Cidade / País" value={[empresa.city, empresa.country].filter(Boolean).join(" · ") || "—"} />
      </Plate>
    </div>
  )
}

// ─── Tab Coaches ─────────────────────────────────────────────────────────────

function TabCoaches({ empresa }: { empresa: AdminTeam }) {
  const { coaches, students, openCoach, coachLimitReached, setCoachDraft, setSelectedTeamId, setShowCreateCoach } =
    useCockpit()
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
      Coach
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
  const empresaStudents = useMemo(() => studentsOfEmpresa(empresa, students), [empresa, students])

  // Cria aluno JÁ vinculado a esta empresa (contexto do drawer). O coach é
  // exigido dentro do diálogo (filtrado por esta empresa) quando ela é cliente.
  const openCreateStudent = () => {
    setSelectedTeamId(empresa.id)
    setStudentDraft({
      name: "", email: "", phone: "", password: "", active: false,
      coachId: "", teamId: empresa.id, sex: "", age: "",
    })
    setShowCreateStudent(true)
  }

  const addButton = (
    <Btn cyan sm disabled={studentLimitReached} onClick={openCreateStudent}>
      <Plus className="h-3 w-3" />
      Aluno
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
  const limits = empresa.customLimits ?? {}

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Plate style={{ padding: 20 }}>
        <SectionTitle>DETALHES DO PLANO</SectionTitle>
        <CtrlDataRow label="Plano" value={planLabel(empresa.plan)} />
        <CtrlDataRow label="Status" value={teamStatusLabel(empresa.status)} />
        <CtrlDataRow label="Limite alunos" value={limits.maxStudents ?? "ilimitado"} />
        <CtrlDataRow label="Limite coaches" value={limits.maxCoaches ?? "ilimitado"} />
        <CtrlDataRow label="Atualizada em" value={empresa.updatedAt ? new Date(empresa.updatedAt).toLocaleString("pt-BR") : "—"} />
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
