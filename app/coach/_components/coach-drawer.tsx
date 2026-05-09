"use client"

import { useMemo } from "react"
import { Shield, Users, Dumbbell, UtensilsCrossed, ScrollText, X } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useCockpit } from "./cockpit-context"
import { T } from "./control-tokens"
import { Plate, Pill, Btn, CtrlDataRow, SectionTitle } from "./controls"
import type { CoachDetailTab } from "./utils"
import { coachLabel, relativeTime, studentRisk } from "./utils"
import type { AdminCoach, AdminStudent } from "@/lib/api/admin"

const COACH_TABS: { id: CoachDetailTab; label: string; icon: React.ReactNode }[] = [
  { id: "resumo", label: "RESUMO", icon: <Shield className="h-3 w-3" /> },
  { id: "alunos", label: "ALUNOS", icon: <Users className="h-3 w-3" /> },
  { id: "treinos", label: "TREINOS", icon: <Dumbbell className="h-3 w-3" /> },
  { id: "dietas", label: "DIETAS", icon: <UtensilsCrossed className="h-3 w-3" /> },
  { id: "logs", label: "LOGS", icon: <ScrollText className="h-3 w-3" /> },
]

// ─── Drawer principal ─────────────────────────────────────────────────────────

export function CoachDrawer() {
  const { selectedCoach, closeCoach, coachDetailTab, setCoachDetailTab } = useCockpit()

  return (
    <Sheet open={!!selectedCoach} onOpenChange={(open) => { if (!open) closeCoach() }}>
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
        {selectedCoach && (
          <div className="flex min-h-full flex-col">
            <DrawerHeader coach={selectedCoach} onClose={closeCoach} />
            <DrawerTabBar activeTab={coachDetailTab} onChange={setCoachDetailTab} />
            <div style={{ padding: 24 }}>
              {coachDetailTab === "resumo" && <TabResumo coach={selectedCoach} />}
              {coachDetailTab === "alunos" && <TabAlunos coach={selectedCoach} />}
              {coachDetailTab === "treinos" && <TabFila coach={selectedCoach} mode="treino" />}
              {coachDetailTab === "dietas" && <TabFila coach={selectedCoach} mode="dieta" />}
              {coachDetailTab === "logs" && <TabLogs coach={selectedCoach} />}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─── Header / Tab bar ────────────────────────────────────────────────────────

function DrawerHeader({ coach, onClose }: { coach: AdminCoach; onClose: () => void }) {
  const { teams } = useCockpit()
  const team = teams.find((t) => t.id === coach.teamId)

  return (
    <header
      style={{
        padding: "20px 24px",
        borderBottom: `1px solid ${T.border}`,
        background: "linear-gradient(180deg, rgba(8,14,28,0.96) 0%, rgba(4,7,16,0.84) 100%)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Pill tone="cyan">COACH</Pill>
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
        {coach.name || coach.email || coach.userId}
      </SheetTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <Pill tone={coach.active ? "ok" : "mute"}>{coach.active ? "ATIVO" : "PAUSADO"}</Pill>
        {team && <Pill tone="neutral">{team.name}</Pill>}
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.fg4, letterSpacing: "0.10em" }}>
          {coach.email || "—"}
        </span>
      </div>
    </header>
  )
}

function DrawerTabBar({
  activeTab,
  onChange,
}: {
  activeTab: CoachDetailTab
  onChange: (t: CoachDetailTab) => void
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
      {COACH_TABS.map((tab) => {
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

// ─── helpers ─────────────────────────────────────────────────────────────────

function studentsOfCoach(coach: AdminCoach, all: AdminStudent[]): AdminStudent[] {
  return all.filter((s) => s.coachId === coach.userId)
}

// ─── Tab Resumo ──────────────────────────────────────────────────────────────

function TabResumo({ coach }: { coach: AdminCoach }) {
  const { students } = useCockpit()
  const myStudents = useMemo(() => studentsOfCoach(coach, students), [coach, students])
  const ativos = myStudents.filter((s) => s.active && !s.archived).length
  const criticos = myStudents.filter((s) => studentRisk(s) === "critico").length
  const atencao = myStudents.filter((s) => studentRisk(s) === "atencao").length
  const semSinal = myStudents.filter((s) => studentRisk(s) === "sem-sinal").length

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Plate style={{ padding: 20 }}>
        <SectionTitle>DESEMPENHO</SectionTitle>
        <CtrlDataRow label="Alunos ativos" value={String(ativos)} />
        <CtrlDataRow label="Críticos" value={String(criticos)} />
        <CtrlDataRow label="Atenção" value={String(atencao)} />
        <CtrlDataRow label="Sem sinal" value={String(semSinal)} />
        <CtrlDataRow label="Total atribuídos" value={String(myStudents.length)} />
      </Plate>

      <Plate style={{ padding: 20 }}>
        <SectionTitle>DADOS</SectionTitle>
        <CtrlDataRow label="E-mail" value={coach.email || "—"} />
        <CtrlDataRow label="Telefone" value={coach.phone || "—"} />
        <CtrlDataRow label="Status" value={coach.active ? "ATIVO" : "PAUSADO"} />
        <CtrlDataRow
          label="Criado em"
          value={coach.createdAt ? new Date(coach.createdAt).toLocaleDateString("pt-BR") : "—"}
        />
      </Plate>
    </div>
  )
}

// ─── Tab Alunos ──────────────────────────────────────────────────────────────

function TabAlunos({ coach }: { coach: AdminCoach }) {
  const { students, coaches, openStudent } = useCockpit()
  const myStudents = useMemo(() => studentsOfCoach(coach, students), [coach, students])

  if (!myStudents.length) {
    return (
      <Plate style={{ padding: 32, textAlign: "center" }}>
        <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg3 }}>
          Este coach não tem alunos atribuídos.
        </p>
      </Plate>
    )
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {myStudents.map((s) => {
        const risk = studentRisk(s)
        const tone = risk === "critico" ? "bad" : risk === "atencao" ? "warn" : risk === "sem-sinal" ? "mute" : "ok"
        const label = risk === "critico" ? "CRÍTICO" : risk === "atencao" ? "ATENÇÃO" : risk === "sem-sinal" ? "SEM SINAL" : "EM DIA"
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
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginBottom: 2,
                }}
              >
                {s.name}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3 }}>
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

// ─── Tab Treinos / Dietas (fila do coach) ────────────────────────────────────

function TabFila({ coach, mode }: { coach: AdminCoach; mode: "treino" | "dieta" }) {
  const { students, openStudent } = useCockpit()
  const myStudents = useMemo(() => studentsOfCoach(coach, students), [coach, students])

  const sorted = useMemo(() => {
    const order: Record<string, number> = { critico: 0, atencao: 1, "sem-sinal": 2, ok: 3 }
    return [...myStudents].sort((a, b) => (order[studentRisk(a)] ?? 9) - (order[studentRisk(b)] ?? 9))
  }, [myStudents])

  if (!sorted.length) {
    return (
      <Plate style={{ padding: 32, textAlign: "center" }}>
        <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg3 }}>
          Sem alunos para este coach.
        </p>
      </Plate>
    )
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {sorted.map((s) => {
        const risk = studentRisk(s)
        const tone = risk === "critico" ? "bad" : risk === "atencao" ? "warn" : risk === "sem-sinal" ? "mute" : "ok"
        const label = risk === "critico" ? "CRÍTICO" : risk === "atencao" ? "ATENÇÃO" : risk === "sem-sinal" ? "SEM SINAL" : "EM DIA"
        return (
          <button
            key={s.userId}
            onClick={() => openStudent(s, mode)}
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.fg }}>{s.name}</span>
                <Pill tone={tone}>{label}</Pill>
              </div>
              <span style={{ fontFamily: T.mono, fontSize: 9, color: T.fg3 }}>
                última validação {relativeTime(s.lastValidationAt)}
              </span>
            </div>
            <Btn ghost sm onClick={() => openStudent(s, mode)}>
              {mode === "treino" ? "Editar treino ›" : "Editar dieta ›"}
            </Btn>
          </button>
        )
      })}
    </div>
  )
}

// ─── Tab Logs ────────────────────────────────────────────────────────────────

function TabLogs({ coach }: { coach: AdminCoach }) {
  const { globalLogs } = useCockpit()
  const myLogs = useMemo(
    () => globalLogs.filter((log) => log.actorUserId === coach.userId),
    [globalLogs, coach]
  )

  if (!myLogs.length) {
    return (
      <Plate style={{ padding: 32, textAlign: "center" }}>
        <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg3 }}>
          Sem ações registradas.
        </p>
      </Plate>
    )
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {myLogs.slice(0, 80).map((log, idx) => (
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
          {log.targetUserId && (
            <p style={{ fontFamily: T.mono, fontSize: 9, color: T.fg3, marginTop: 4 }}>
              alvo · {log.targetUserId}
            </p>
          )}
        </Plate>
      ))}
    </div>
  )
}
