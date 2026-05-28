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
import { usePanelI18n } from "@/lib/panel-i18n"

export function TabAcesso() {
  const {
    selectedDetail, setSelectedDetail,
    coaches, isSuperAdmin, isAdmin,
    acting, act, setLastSecret, lastSecret,
    setStudents,
  } = useCockpit()
  const { t } = usePanelI18n()

  if (!selectedDetail) return null
  const { student } = selectedDetail

  return (
    <div className="grid gap-4">
      {/* Pause / reactivate */}
      <Panel title={t.tabAcesso.panelControl}>
        <div className="grid gap-2 sm:grid-cols-2">
          <ActionButton
            disabled={acting}
            onClick={() =>
              void act(async () => {
                const result = student.active
                  ? await pauseAdminStudent(student.userId)
                  : await reactivateAdminStudent(student.userId)
                setSelectedDetail((c) => c ? { ...c, student: result.student } : c)
              }, student.active ? t.tabAcesso.toastPaused : t.tabAcesso.toastReactivated)
            }
          >
            {student.active ? t.tabAcesso.btnPause : t.tabAcesso.btnReactivate}
          </ActionButton>

          <ActionButton
            disabled={acting}
            onClick={() =>
              void act(async () => {
                const result = await renewAdminStudent(student.userId, 30)
                setSelectedDetail((c) => c ? { ...c, student: result.student } : c)
              }, t.tabAcesso.toastRenewed)
            }
          >
            {t.tabAcesso.btnRenew30}
          </ActionButton>

          <ActionButton
            disabled={acting}
            onClick={() =>
              void act(async () => {
                const result = await updateAdminStudent(student.userId, {
                  visibleInArena: !student.visibleInArena,
                })
                setSelectedDetail((c) => c ? { ...c, student: result.student } : c)
              }, student.visibleInArena ? t.tabAcesso.toastArenaHidden : t.tabAcesso.toastArenaShown)
            }
          >
            {student.visibleInArena ? t.tabAcesso.btnArenaHide : t.tabAcesso.btnArenaShow}
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
                }, t.tabAcesso.toastCoachAssigned)
              }}
              className="h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
            >
              <option value="" className="bg-white">{t.tabAcesso.assignCoachPlaceholder}</option>
              {coaches.map((c) => (
                <option key={c.userId} value={c.userId} className="bg-white">
                  {c.name || c.email || c.userId}
                </option>
              ))}
            </select>
          )}
        </div>
      </Panel>

      {/* Invite */}
      <Panel title={t.tabAcesso.panelInvite}>
        <div className="grid gap-2 sm:grid-cols-2">
          <ActionButton
            disabled={acting}
            onClick={() =>
              void act(async () => {
                const result = await getAdminStudentInvite(student.userId)
                if (result.inviteLink) {
                  setLastSecret(result.inviteLink)
                } else {
                  toast.info(result.message || t.tabAcesso.toastInviteUnavailable)
                }
              }, t.tabAcesso.toastInviteLoaded)
            }
          >
            {t.tabAcesso.btnViewInvite}
          </ActionButton>

          <ActionButton
            disabled={acting}
            onClick={() => {
              if (!window.confirm(t.tabAcesso.confirmRegen)) return
              void act(async () => {
                const result = await regenerateAdminStudentInvite(student.userId)
                setLastSecret(result.inviteLink)
              }, t.tabAcesso.toastInviteRegenerated)
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t.tabAcesso.btnRegenInvite}
          </ActionButton>
        </div>

        {lastSecret?.startsWith("http") && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#0E7490]/40 bg-cyan-50 p-3">
            <p className="min-w-0 flex-1 break-all font-mono text-xs text-slate-900">{lastSecret}</p>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-slate-200 bg-slate-50 text-slate-900"
              onClick={() => {
                void navigator.clipboard.writeText(lastSecret)
                toast.success(t.tabAcesso.toastLinkCopied)
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </Panel>

      {/* Password + danger */}
      <Panel title={t.tabAcesso.panelSecurity}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionButton
            disabled={acting}
            onClick={() =>
              void act(async () => {
                const result = await resetAdminStudentPassword(student.userId)
                setLastSecret(result.temporaryPassword || null)
              }, t.tabAcesso.toastPasswordGenerated)
            }
          >
            <KeyRound className="mr-2 h-4 w-4" />
            {t.tabAcesso.btnResetPassword}
          </ActionButton>

          {isSuperAdmin && (
            <ActionButton
              danger
              disabled={acting}
              onClick={() => {
                if (!window.confirm(t.tabAcesso.confirmDelete)) return
                void act(async () => {
                  await deleteAdminStudent(student.userId)
                  setSelectedDetail(null)
                  setStudents((prev) => prev.filter((s) => s.userId !== student.userId))
                }, t.tabAcesso.toastDeleted)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t.tabAcesso.btnDelete}
            </ActionButton>
          )}
        </div>

        {lastSecret && !lastSecret.startsWith("http") && (
          <div className="mt-4 rounded-lg border border-[#0E7490]/40 bg-cyan-50 p-4">
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#0E7490]">
              {t.tabAcesso.tempPasswordLabel}
            </p>
            <p className="font-mono text-lg font-black text-slate-900">{lastSecret}</p>
          </div>
        )}
      </Panel>
    </div>
  )
}
