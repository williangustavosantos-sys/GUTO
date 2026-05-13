"use client"

import { Copy, KeyRound, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  pauseAdminStudent, reactivateAdminStudent,
  renewAdminStudent, updateAdminStudent, assignStudentToCoach,
  getAdminStudentInvite, regenerateAdminStudentInvite,
  resetAdminStudentPassword, deleteAdminStudent,
} from "@/lib/api/admin"
import { useCockpit } from "../cockpit-context"
import { Panel, ActionButton } from "../ui"

export function TabAcesso() {
  const {
    selectedDetail, setSelectedDetail,
    coaches, isSuperAdmin, isAdmin,
    acting, act, setLastSecret, lastSecret,
    setStudents,
  } = useCockpit()

  if (!selectedDetail) return null
  const { student } = selectedDetail

  return (
    <div className="grid gap-4">
      {/* Pause / reactivate */}
      <Panel title="Controle de acesso">
        <div className="grid gap-2 sm:grid-cols-2">
          <ActionButton
            disabled={acting}
            onClick={() =>
              void act(async () => {
                const result = student.active
                  ? await pauseAdminStudent(student.userId)
                  : await reactivateAdminStudent(student.userId)
                setSelectedDetail((c) => c ? { ...c, student: result.student } : c)
              }, student.active ? "Acesso pausado." : "Acesso reativado.")
            }
          >
            {student.active ? "Pausar acesso" : "Reativar acesso"}
          </ActionButton>

          <ActionButton
            disabled={acting}
            onClick={() =>
              void act(async () => {
                const result = await renewAdminStudent(student.userId, 30)
                setSelectedDetail((c) => c ? { ...c, student: result.student } : c)
              }, "Acesso renovado por 30 dias.")
            }
          >
            Renovar 30 dias
          </ActionButton>

          <ActionButton
            disabled={acting}
            onClick={() =>
              void act(async () => {
                const result = await updateAdminStudent(student.userId, {
                  visibleInArena: !student.visibleInArena,
                })
                setSelectedDetail((c) => c ? { ...c, student: result.student } : c)
              }, student.visibleInArena ? "Aluno ocultado da Arena." : "Aluno visível na Arena.")
            }
          >
            {student.visibleInArena ? "Ocultar na Arena" : "Mostrar na Arena"}
          </ActionButton>

          {isAdmin && (
            <select
              value={student.coachId || ""}
              onChange={(e) => {
                const coachId = e.target.value
                if (!coachId) return
                void act(async () => {
                  const result = await assignStudentToCoach(coachId, student.userId)
                  setSelectedDetail((c) => c ? { ...c, student: result.student } : c)
                }, "Aluno atribuído ao coach.")
              }}
              className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
            >
              <option value="" className="bg-[#0d1426]">Atribuir coach…</option>
              {coaches.map((c) => (
                <option key={c.userId} value={c.userId} className="bg-[#0d1426]">
                  {c.name || c.email || c.userId}
                </option>
              ))}
            </select>
          )}
        </div>
      </Panel>

      {/* Invite */}
      <Panel title="Convite de acesso">
        <div className="grid gap-2 sm:grid-cols-2">
          <ActionButton
            disabled={acting}
            onClick={() =>
              void act(async () => {
                const result = await getAdminStudentInvite(student.userId)
                if (result.inviteLink) {
                  setLastSecret(result.inviteLink)
                } else {
                  toast.info(result.message || "Link não disponível. Use regenerar para criar um novo.")
                }
              }, "Convite carregado.")
            }
          >
            Ver convite atual
          </ActionButton>

          <ActionButton
            disabled={acting}
            onClick={() => {
              if (!window.confirm("Regenerar convite? O link anterior deixa de funcionar.")) return
              void act(async () => {
                const result = await regenerateAdminStudentInvite(student.userId)
                setLastSecret(result.inviteLink)
              }, "Novo convite gerado.")
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerar convite
          </ActionButton>
        </div>

        {lastSecret?.startsWith("http") && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#00e5ff]/30 bg-[#00e5ff]/10 p-3">
            <p className="min-w-0 flex-1 break-all font-mono text-xs text-white">{lastSecret}</p>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-white/10 bg-white/5 text-white"
              onClick={() => {
                void navigator.clipboard.writeText(lastSecret)
                toast.success("Link copiado!")
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </Panel>

      {/* Password + danger */}
      <Panel title="Segurança">
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionButton
            disabled={acting}
            onClick={() =>
              void act(async () => {
                const result = await resetAdminStudentPassword(student.userId)
                setLastSecret(result.temporaryPassword || null)
              }, "Senha temporária gerada.")
            }
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Gerar senha temporária
          </ActionButton>

          {isSuperAdmin && (
            <ActionButton
              danger
              disabled={acting}
              onClick={() => {
                if (!window.confirm("Excluir permanentemente este aluno e todos os dados vinculados?")) return
                void act(async () => {
                  await deleteAdminStudent(student.userId)
                  setSelectedDetail(null)
                  setStudents((prev) => prev.filter((s) => s.userId !== student.userId))
                }, "Aluno excluído permanentemente.")
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir permanentemente
            </ActionButton>
          )}
        </div>

        {lastSecret && !lastSecret.startsWith("http") && (
          <div className="mt-4 rounded-lg border border-[#00e5ff]/30 bg-[#00e5ff]/10 p-4">
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#00e5ff]">
              Senha temporária
            </p>
            <p className="font-mono text-lg font-black text-white">{lastSecret}</p>
          </div>
        )}
      </Panel>
    </div>
  )
}
