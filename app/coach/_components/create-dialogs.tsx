"use client"

import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useCockpit } from "./cockpit-context"
import { Field } from "./ui"
import { BIOLOGICAL_SEX_LABELS } from "@/lib/format-codes"
import { formatHuman, type TeamDraft } from "./utils"

// ─── CreateStudentDialog ──────────────────────────────────────────────────────

export function CreateStudentDialog() {
  const {
    showCreateStudent, setShowCreateStudent,
    studentDraft, setStudentDraft,
    coaches, teams, isAdmin, isSuperAdmin, acting,
    studentLimitReached, superAdminNeedsTeam,
    doCreateStudent, setStudents, setCoaches,
  } = useCockpit()

  return (
    <AlertDialog open={showCreateStudent} onOpenChange={setShowCreateStudent}>
      <AlertDialogContent className="border-white/10 bg-[#0d1426] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Criar aluno</AlertDialogTitle>
          <AlertDialogDescription className="text-white/45">
            Cria acesso real no backend. Sem senha, o backend gera convite.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-3">
          <Field label="Nome" value={studentDraft.name} onChange={(name) => setStudentDraft({ ...studentDraft, name })} />
          <Field label="Email" value={studentDraft.email} onChange={(email) => setStudentDraft({ ...studentDraft, email })} />
          <Field label="Telefone" value={studentDraft.phone} onChange={(phone) => setStudentDraft({ ...studentDraft, phone })} />
          <div className="grid grid-cols-2 gap-3">
            <select value={studentDraft.sex} onChange={(e) => setStudentDraft({ ...studentDraft, sex: e.target.value })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
              <option value="" className="bg-[#0d1426]">Sexo</option>
              {Object.entries(BIOLOGICAL_SEX_LABELS).map(([code, label]) => (
                <option key={code} value={code} className="bg-[#0d1426]">{label}</option>
              ))}
            </select>
            <Field label="Idade" value={studentDraft.age} onChange={(age) => setStudentDraft({ ...studentDraft, age })} type="number" />
          </div>
          <Field label="Senha inicial (opcional)" value={studentDraft.password} onChange={(password) => setStudentDraft({ ...studentDraft, password })} />
          {isSuperAdmin && (
            studentDraft.teamId && teams.find((t) => t.id === studentDraft.teamId) ? (
              <div className="flex items-center gap-2 rounded-md border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-3 py-2">
                <Building2 className="h-3.5 w-3.5 text-[#00e5ff]" />
                <span className="text-sm font-bold text-[#00e5ff]">{teams.find((t) => t.id === studentDraft.teamId)?.name}</span>
              </div>
            ) : (
              <select value={studentDraft.teamId} onChange={(e) => setStudentDraft({ ...studentDraft, teamId: e.target.value })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="" className="bg-[#0d1426]">Selecione um Time *</option>
                {teams.map((t) => <option key={t.id} value={t.id} className="bg-[#0d1426]">{t.name}</option>)}
              </select>
            )
          )}
          {isAdmin && (
            <select value={studentDraft.coachId} onChange={(e) => setStudentDraft({ ...studentDraft, coachId: e.target.value })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
              <option value="" className="bg-[#0d1426]">Coach responsável</option>
              {coaches.map((c) => <option key={c.userId} value={c.userId} className="bg-[#0d1426]">{c.name || c.userId}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm text-white/60">
            <input type="checkbox" checked={studentDraft.active} onChange={(e) => setStudentDraft({ ...studentDraft, active: e.target.checked })} />
            Ativar acesso agora
          </label>
          {studentLimitReached && (
            <p className="text-xs font-bold text-[#00e5ff]">Limite do plano atingido.</p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white">Cancelar</AlertDialogCancel>
          <Button
            disabled={acting || studentLimitReached || !studentDraft.name.trim() || (isSuperAdmin && !studentDraft.teamId)}
            onClick={() => void doCreateStudent(() => {})}
            className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white"
          >
            Criar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── CreateCoachDialog ────────────────────────────────────────────────────────

export function CreateCoachDialog() {
  const {
    showCreateCoach, setShowCreateCoach,
    coachDraft, setCoachDraft,
    teams, isSuperAdmin, acting,
    coachLimitReached,
    doCreateCoach, setCoaches,
  } = useCockpit()

  return (
    <AlertDialog open={showCreateCoach} onOpenChange={setShowCreateCoach}>
      <AlertDialogContent className="border-white/10 bg-[#0d1426] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Criar coach</AlertDialogTitle>
          <AlertDialogDescription className="text-white/45">
            Somente admin pode criar coach.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-3">
          <Field label="Nome" value={coachDraft.name} onChange={(name) => setCoachDraft({ ...coachDraft, name })} />
          <Field label="Email" value={coachDraft.email} onChange={(email) => setCoachDraft({ ...coachDraft, email })} />
          <Field label="Senha (opcional)" value={coachDraft.password} onChange={(password) => setCoachDraft({ ...coachDraft, password })} />
          {isSuperAdmin && (
            coachDraft.teamId && teams.find((t) => t.id === coachDraft.teamId) ? (
              <div className="flex items-center gap-2 rounded-md border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-3 py-2">
                <Building2 className="h-3.5 w-3.5 text-[#00e5ff]" />
                <span className="text-sm font-bold text-[#00e5ff]">{teams.find((t) => t.id === coachDraft.teamId)?.name}</span>
              </div>
            ) : (
              <select value={coachDraft.teamId} onChange={(e) => setCoachDraft({ ...coachDraft, teamId: e.target.value })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="" className="bg-[#0d1426]">Selecione um Time *</option>
                {teams.map((t) => <option key={t.id} value={t.id} className="bg-[#0d1426]">{t.name}</option>)}
              </select>
            )
          )}
          {coachLimitReached && (
            <p className="text-xs font-bold text-[#00e5ff]">Limite de coaches atingido.</p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white">Cancelar</AlertDialogCancel>
          <Button
            disabled={acting || coachLimitReached || !coachDraft.name.trim() || !coachDraft.email.trim() || (isSuperAdmin && !coachDraft.teamId)}
            onClick={() => void doCreateCoach(setCoaches)}
            className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white"
          >
            Criar coach
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── CreateTeamDialog ─────────────────────────────────────────────────────────

export function CreateTeamDialog() {
  const {
    showCreateTeam, setShowCreateTeam,
    teamDraft, setTeamDraft,
    acting, doCreateTeam, setTeams,
  } = useCockpit()

  return (
    <AlertDialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
      <AlertDialogContent className="border-white/10 bg-[#0d1426] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Criar Time</AlertDialogTitle>
          <AlertDialogDescription className="text-white/45">
            Somente super admin pode criar Times.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-3">
          <Field label="Nome do Time" value={teamDraft.name} onChange={(name) => setTeamDraft({ ...teamDraft, name })} />
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">Plano</span>
            <select value={teamDraft.plan} onChange={(e) => setTeamDraft({ ...teamDraft, plan: e.target.value as TeamDraft["plan"] })} className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
              {(["start", "pro", "elite", "custom"] as const).map((p) => (
                <option key={p} value={p} className="bg-[#0d1426]">{formatHuman(p)}</option>
              ))}
            </select>
          </label>
          {teamDraft.plan === "custom" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Máx. alunos (vazio = ilimitado)" value={teamDraft.maxStudents} onChange={(v) => setTeamDraft({ ...teamDraft, maxStudents: v })} />
              <Field label="Máx. coaches (vazio = ilimitado)" value={teamDraft.maxCoaches} onChange={(v) => setTeamDraft({ ...teamDraft, maxCoaches: v })} />
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white">Cancelar</AlertDialogCancel>
          <Button
            disabled={acting || !teamDraft.name.trim()}
            onClick={() => void doCreateTeam(setTeams)}
            className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white"
          >
            <Building2 className="mr-2 h-4 w-4" />Criar Time
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
