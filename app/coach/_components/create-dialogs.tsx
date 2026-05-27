"use client"

import { Building2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useCockpit } from "./cockpit-context"
import { T } from "./control-tokens"
import { Btn, CtrlField, Pill, TextInput, SelectInput } from "./controls"
import { BIOLOGICAL_SEX_LABELS } from "@/lib/format-codes"
import { formatHuman, type TeamDraft } from "./utils"
import { blockCreateStudent, coachesForTeam, studentRequiresCoach } from "@/lib/panel-rules"

const dialogClass =
  "p-0 max-w-md gap-0 overflow-hidden border bg-transparent text-slate-900"

const dialogStyle: React.CSSProperties = {
  background: T.surface,
  borderColor: T.border,
  fontFamily: T.ui,
  borderRadius: 16,
  boxShadow: T.shadowFloat,
}

const headerStyle: React.CSSProperties = {
  padding: "20px 24px 16px",
  borderBottom: `1px solid ${T.borderSoft}`,
  background: T.surfaceAlt,
}

const bodyStyle: React.CSSProperties = {
  padding: "20px 24px",
  display: "grid",
  gap: 14,
}

const footerStyle: React.CSSProperties = {
  padding: "12px 24px 20px",
  borderTop: `1px solid ${T.border}`,
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
  background: "rgba(0,0,0,0.2)",
}

// ─── CreateStudentDialog ──────────────────────────────────────────────────────

export function CreateStudentDialog() {
  const {
    user,
    showCreateStudent,
    setShowCreateStudent,
    studentDraft,
    setStudentDraft,
    coaches,
    teams,
    isAdmin,
    isSuperAdmin,
    acting,
    studentLimitReached,
    doCreateStudent,
  } = useCockpit()

  const isTeamLocked =
    isSuperAdmin && !!studentDraft.teamId && teams.some((t) => t.id === studentDraft.teamId)
  const lockedTeam = teams.find((t) => t.id === studentDraft.teamId)

  // Coaches SEMPRE filtrados pela empresa (super_admin escolhe a empresa; admin
  // já recebe a lista escopada ao próprio time pelo backend) — não vaza coach
  // de outra empresa. Coach é OBRIGATÓRIO para super_admin em empresa cliente
  // (espelha o backend GUTO_COACH_REQUIRED); para admin é recomendado.
  const availableCoaches = isSuperAdmin
    ? coachesForTeam(coaches, studentDraft.teamId)
    : coaches
  const effectiveTeamId = isSuperAdmin ? studentDraft.teamId : user.teamId
  const requiresCoach = isAdmin && studentRequiresCoach(effectiveTeamId)
  const noCoachInTeam = requiresCoach && availableCoaches.length === 0
  const shouldShowCoachSelector = user.role === "admin" || (isSuperAdmin && !!studentDraft.teamId)
  const createBlock = blockCreateStudent({
    name: studentDraft.name,
    email: studentDraft.email,
    needsTeam: isSuperAdmin,
    teamId: effectiveTeamId,
    coachId: studentDraft.coachId,
    teamCoachCount: availableCoaches.length,
    requiresCoach,
  })

  return (
    <AlertDialog open={showCreateStudent} onOpenChange={setShowCreateStudent}>
      <AlertDialogContent className={dialogClass} style={dialogStyle}>
        <AlertDialogHeader style={headerStyle}>
          <Pill tone="cyan">CRIAR ALUNO</Pill>
          <AlertDialogTitle
            style={{
              fontFamily: T.mono,
              fontSize: 18,
              fontWeight: 900,
              color: T.fg,
              marginTop: 8,
            }}
          >
            Novo aluno
          </AlertDialogTitle>
          <AlertDialogDescription
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.fg3,
              letterSpacing: "0.10em",
              lineHeight: 1.6,
              marginTop: 4,
            }}
          >
            Cria acesso real no backend. Sem senha, o backend gera convite.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div style={bodyStyle}>
          <CtrlField label="Nome">
            <TextInput value={studentDraft.name} onChange={(name) => setStudentDraft({ ...studentDraft, name })} />
          </CtrlField>
          <CtrlField label="E-mail *">
            <TextInput
              value={studentDraft.email}
              onChange={(email) => setStudentDraft({ ...studentDraft, email })}
            />
          </CtrlField>
          <CtrlField label="Telefone (opcional)">
            <TextInput
              value={studentDraft.phone}
              onChange={(phone) => setStudentDraft({ ...studentDraft, phone })}
            />
          </CtrlField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CtrlField label="Sexo biológico">
              <SelectInput value={studentDraft.sex} onChange={(v) => setStudentDraft({ ...studentDraft, sex: v })}>
                <option value="" style={{ background: T.ink }}>—</option>
                {Object.entries(BIOLOGICAL_SEX_LABELS).map(([code, label]) => (
                  <option key={code} value={code} style={{ background: T.ink }}>
                    {label}
                  </option>
                ))}
              </SelectInput>
            </CtrlField>
            <CtrlField label="Idade">
              <TextInput
                type="number"
                value={studentDraft.age}
                onChange={(age) => setStudentDraft({ ...studentDraft, age })}
              />
            </CtrlField>
          </div>
          <CtrlField label="Senha inicial (opcional)">
            <TextInput
              type="password"
              value={studentDraft.password}
              onChange={(password) => setStudentDraft({ ...studentDraft, password })}
            />
          </CtrlField>

          {isSuperAdmin && (
            <CtrlField label="Empresa *">
              {isTeamLocked && lockedTeam ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: T.cyanSoft,
                    border: `1px solid ${T.cyanLine}`,
                  }}
                >
                  <Building2 className="h-3 w-3" style={{ color: T.cyan }} />
                  <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.cyan }}>
                    {lockedTeam.name}
                  </span>
                </div>
              ) : (
                <SelectInput
                  value={studentDraft.teamId}
                  onChange={(v) => setStudentDraft({ ...studentDraft, teamId: v, coachId: "" })}
                >
                  <option value="" style={{ background: T.ink }}>
                    Selecione…
                  </option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} style={{ background: T.ink }}>
                      {t.name}
                    </option>
                  ))}
                </SelectInput>
              )}
            </CtrlField>
          )}

          {shouldShowCoachSelector && (
            <CtrlField label={requiresCoach ? "Coach responsável *" : "Coach responsável"}>
              {noCoachInTeam ? (
                <p
                  style={{
                    fontFamily: T.mono,
                    fontSize: 10,
                    color: T.warn,
                    fontWeight: 900,
                    letterSpacing: "0.06em",
                    lineHeight: 1.6,
                  }}
                >
                  ⚠ Nenhum coach nesta empresa. Crie um coach antes de adicionar alunos.
                </p>
              ) : (
                <SelectInput
                  value={studentDraft.coachId}
                  onChange={(v) => setStudentDraft({ ...studentDraft, coachId: v })}
                >
                  <option value="" style={{ background: T.ink }}>
                    {requiresCoach ? "Selecione…" : "—"}
                  </option>
                  {availableCoaches.map((c) => (
                    <option key={c.userId} value={c.userId} style={{ background: T.ink }}>
                      {c.name || c.email || c.userId}
                    </option>
                  ))}
                </SelectInput>
              )}
            </CtrlField>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: T.mono, fontSize: 11, color: T.fg2 }}>
            <input
              type="checkbox"
              checked={studentDraft.active}
              onChange={(e) => setStudentDraft({ ...studentDraft, active: e.target.checked })}
              style={{ accentColor: T.cyan }}
            />
            Ativar acesso agora
          </label>

          {studentLimitReached && (
            <p style={{ fontFamily: T.mono, fontSize: 10, color: T.warn, fontWeight: 900, letterSpacing: "0.10em" }}>
              LIMITE DO PLANO ATINGIDO.
            </p>
          )}
        </div>

        <AlertDialogFooter style={footerStyle}>
          <AlertDialogCancel
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 999,
              background: "rgba(232,244,255,0.07)",
              color: T.fg,
              border: `1px solid ${T.border}`,
              fontFamily: T.mono,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Cancelar
          </AlertDialogCancel>
          <Btn
            cyan
            sm
            disabled={acting || studentLimitReached || createBlock !== null}
            onClick={() => void doCreateStudent(() => {})}
          >
            Criar aluno
          </Btn>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── CreateCoachDialog ────────────────────────────────────────────────────────

export function CreateCoachDialog() {
  const {
    showCreateCoach,
    setShowCreateCoach,
    coachDraft,
    setCoachDraft,
    teams,
    isSuperAdmin,
    acting,
    coachLimitReached,
    doCreateCoach,
    setCoaches,
  } = useCockpit()

  const isTeamLocked = isSuperAdmin && !!coachDraft.teamId && teams.some((t) => t.id === coachDraft.teamId)
  const lockedTeam = teams.find((t) => t.id === coachDraft.teamId)

  return (
    <AlertDialog open={showCreateCoach} onOpenChange={setShowCreateCoach}>
      <AlertDialogContent className={dialogClass} style={dialogStyle}>
        <AlertDialogHeader style={headerStyle}>
          <Pill tone="cyan">CRIAR COACH</Pill>
          <AlertDialogTitle
            style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 900, color: T.fg, marginTop: 8 }}
          >
            Novo coach
          </AlertDialogTitle>
          <AlertDialogDescription
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.fg3,
              letterSpacing: "0.10em",
              lineHeight: 1.6,
              marginTop: 4,
            }}
          >
            Coach pode editar treino/dieta dos alunos atribuídos. Não aprova catálogo.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div style={bodyStyle}>
          <CtrlField label="Nome">
            <TextInput value={coachDraft.name} onChange={(name) => setCoachDraft({ ...coachDraft, name })} />
          </CtrlField>
          <CtrlField label="E-mail">
            <TextInput value={coachDraft.email} onChange={(email) => setCoachDraft({ ...coachDraft, email })} />
          </CtrlField>
          <CtrlField label="Senha (opcional)">
            <TextInput
              type="password"
              value={coachDraft.password}
              onChange={(password) => setCoachDraft({ ...coachDraft, password })}
            />
          </CtrlField>

          {isSuperAdmin && (
            <CtrlField label="Empresa *">
              {isTeamLocked && lockedTeam ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: T.cyanSoft,
                    border: `1px solid ${T.cyanLine}`,
                  }}
                >
                  <Building2 className="h-3 w-3" style={{ color: T.cyan }} />
                  <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.cyan }}>
                    {lockedTeam.name}
                  </span>
                </div>
              ) : (
                <SelectInput value={coachDraft.teamId} onChange={(v) => setCoachDraft({ ...coachDraft, teamId: v })}>
                  <option value="" style={{ background: T.ink }}>
                    Selecione…
                  </option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} style={{ background: T.ink }}>
                      {t.name}
                    </option>
                  ))}
                </SelectInput>
              )}
            </CtrlField>
          )}

          {coachLimitReached && (
            <p style={{ fontFamily: T.mono, fontSize: 10, color: T.warn, fontWeight: 900, letterSpacing: "0.10em" }}>
              LIMITE DE COACHES ATINGIDO.
            </p>
          )}
        </div>

        <AlertDialogFooter style={footerStyle}>
          <AlertDialogCancel
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 999,
              background: "rgba(232,244,255,0.07)",
              color: T.fg,
              border: `1px solid ${T.border}`,
              fontFamily: T.mono,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Cancelar
          </AlertDialogCancel>
          <Btn
            cyan
            sm
            disabled={
              acting ||
              coachLimitReached ||
              !coachDraft.name.trim() ||
              !coachDraft.email.trim() ||
              (isSuperAdmin && !coachDraft.teamId)
            }
            onClick={() => void doCreateCoach(setCoaches)}
          >
            Criar coach
          </Btn>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── CreateTeamDialog (Empresa) ──────────────────────────────────────────────

export function CreateTeamDialog() {
  const { showCreateTeam, setShowCreateTeam, teamDraft, setTeamDraft, acting, doCreateTeam, setTeams } =
    useCockpit()

  return (
    <AlertDialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
      <AlertDialogContent className={dialogClass} style={dialogStyle}>
        <AlertDialogHeader style={headerStyle}>
          <Pill tone="cyan">CRIAR EMPRESA</Pill>
          <AlertDialogTitle
            style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 900, color: T.fg, marginTop: 8 }}
          >
            Nova empresa
          </AlertDialogTitle>
          <AlertDialogDescription
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.fg3,
              letterSpacing: "0.10em",
              lineHeight: 1.6,
              marginTop: 4,
            }}
          >
            Cria um cliente B2B (chamado <code>Team</code> no backend). Apenas super admin.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div style={bodyStyle}>
          <CtrlField label="Nome da empresa">
            <TextInput value={teamDraft.name} onChange={(name) => setTeamDraft({ ...teamDraft, name })} />
          </CtrlField>

          <CtrlField label="E-mail de contato *">
            <TextInput value={teamDraft.email} onChange={(email) => setTeamDraft({ ...teamDraft, email })} />
          </CtrlField>

          <CtrlField label="Telefone (opcional)">
            <TextInput value={teamDraft.phone} onChange={(phone) => setTeamDraft({ ...teamDraft, phone })} />
          </CtrlField>

          <CtrlField label="Endereço (opcional)">
            <TextInput value={teamDraft.addressLine} onChange={(addressLine) => setTeamDraft({ ...teamDraft, addressLine })} />
          </CtrlField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CtrlField label="Cidade">
              <TextInput value={teamDraft.city} onChange={(city) => setTeamDraft({ ...teamDraft, city })} />
            </CtrlField>
            <CtrlField label="País">
              <TextInput value={teamDraft.country} onChange={(country) => setTeamDraft({ ...teamDraft, country })} />
            </CtrlField>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CtrlField label="Plano">
              <SelectInput
                value={teamDraft.plan}
                onChange={(v) => setTeamDraft({ ...teamDraft, plan: v as TeamDraft["plan"] })}
              >
                {(["start", "pro", "elite", "custom"] as const).map((p) => (
                  <option key={p} value={p} style={{ background: T.surface }}>
                    {formatHuman(p)}
                  </option>
                ))}
              </SelectInput>
            </CtrlField>
            <CtrlField label="Status">
              <SelectInput
                value={teamDraft.status}
                onChange={(v) => setTeamDraft({ ...teamDraft, status: v as TeamDraft["status"] })}
              >
                {(["active", "paused", "archived"] as const).map((s) => (
                  <option key={s} value={s} style={{ background: T.surface }}>
                    {formatHuman(s)}
                  </option>
                ))}
              </SelectInput>
            </CtrlField>
          </div>

          {teamDraft.plan === "custom" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <CtrlField label="Máx. alunos" hint="vazio = ilimitado">
                <TextInput
                  type="number"
                  value={teamDraft.maxStudents}
                  onChange={(v) => setTeamDraft({ ...teamDraft, maxStudents: v })}
                />
              </CtrlField>
              <CtrlField label="Máx. coaches" hint="vazio = ilimitado">
                <TextInput
                  type="number"
                  value={teamDraft.maxCoaches}
                  onChange={(v) => setTeamDraft({ ...teamDraft, maxCoaches: v })}
                />
              </CtrlField>
            </div>
          )}
        </div>

        <AlertDialogFooter style={footerStyle}>
          <AlertDialogCancel
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 999,
              background: "rgba(232,244,255,0.07)",
              color: T.fg,
              border: `1px solid ${T.border}`,
              fontFamily: T.mono,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Cancelar
          </AlertDialogCancel>
          <Btn
            cyan
            sm
            disabled={acting || !teamDraft.name.trim() || !teamDraft.email.trim()}
            onClick={() => void doCreateTeam(setTeams)}
          >
            <Building2 className="h-3 w-3" />
            Criar empresa
          </Btn>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
