import { useState, useCallback } from "react"
import { toast } from "sonner"
import {
  createAdminStudent,
  createAdminCoach,
  createAdminTeam,
  type AdminCoach,
  type AdminTeam,
} from "@/lib/api/admin"
import {
  adminErrorMessage,
  type StudentDetail,
  type StudentDraft,
  type CoachDraft,
  type TeamDraft,
} from "../_components/utils"

interface ActDeps {
  selectedDetail: StudentDetail | null
  fetchStudents: () => Promise<void>
  fetchTeamSummary: () => Promise<void>
  refreshSelected: (id: string) => Promise<void>
}

export function useStudentActions({
  selectedDetail,
  fetchStudents,
  fetchTeamSummary,
  refreshSelected,
}: ActDeps) {
  const [acting, setActing] = useState(false)
  const [lastSecret, setLastSecret] = useState<string | null>(null)
  const [showCreateStudent, setShowCreateStudent] = useState(false)
  const [showCreateCoach, setShowCreateCoach] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const [studentDraft, setStudentDraft] = useState<StudentDraft>({
    name: "", email: "", phone: "", password: "", active: false,
    coachId: "", teamId: "", sex: "", age: "",
  })
  const [coachDraft, setCoachDraft] = useState<CoachDraft>({
    name: "", email: "", password: "", teamId: "",
  })
  const [teamDraft, setTeamDraft] = useState<TeamDraft>({
    name: "", plan: "pro", maxStudents: "", maxCoaches: "",
  })

  const act = useCallback(
    async (fn: () => Promise<void>, successMsg: string) => {
      setActing(true)
      try {
        await fn()
        toast.success(successMsg)
        await Promise.all([fetchStudents(), fetchTeamSummary()])
        if (selectedDetail) await refreshSelected(selectedDetail.student.userId)
      } catch (error) {
        toast.error(adminErrorMessage(error))
      } finally {
        setActing(false)
      }
    },
    [fetchStudents, fetchTeamSummary, refreshSelected, selectedDetail]
  )

  const doCreateStudent = useCallback(
    (onSuccess: (coaches: AdminCoach[], updater: (s: AdminCoach[]) => AdminCoach[]) => void) =>
      act(async () => {
        const result = await createAdminStudent({
          name: studentDraft.name,
          email: studentDraft.email || undefined,
          phone: studentDraft.phone || undefined,
          password: studentDraft.password || undefined,
          active: studentDraft.active,
          coachId: studentDraft.coachId || undefined,
          teamId: studentDraft.teamId || undefined,
          biologicalSex: studentDraft.sex || undefined,
          age: studentDraft.age ? parseInt(studentDraft.age) || undefined : undefined,
        })
        if (result.temporaryPassword) setLastSecret(result.temporaryPassword)
        else if (result.inviteLink) setLastSecret(result.inviteLink)
        setStudentDraft({ name: "", email: "", phone: "", password: "", active: false, coachId: "", teamId: selectedTeamId || "", sex: "", age: "" })
        setShowCreateStudent(false)
        void onSuccess
      }, "Aluno criado."),
    [act, studentDraft, selectedTeamId]
  )

  const doCreateCoach = useCallback(
    (setCoaches: (fn: (prev: AdminCoach[]) => AdminCoach[]) => void) =>
      act(async () => {
        const result = await createAdminCoach({
          name: coachDraft.name,
          email: coachDraft.email,
          password: coachDraft.password || undefined,
          teamId: coachDraft.teamId || undefined,
        })
        setCoaches((prev) => [result.coach, ...prev])
        if (result.temporaryPassword) setLastSecret(result.temporaryPassword)
        setCoachDraft({ name: "", email: "", password: "", teamId: selectedTeamId || "" })
        setShowCreateCoach(false)
      }, "Coach criado."),
    [act, coachDraft, selectedTeamId]
  )

  const doCreateTeam = useCallback(
    (setTeams: (fn: (prev: AdminTeam[]) => AdminTeam[]) => void) =>
      act(async () => {
        const customLimits =
          teamDraft.plan === "custom"
            ? {
                maxStudents: teamDraft.maxStudents ? Number(teamDraft.maxStudents) || null : null,
                maxCoaches: teamDraft.maxCoaches ? Number(teamDraft.maxCoaches) || null : null,
              }
            : undefined
        const result = await createAdminTeam({ name: teamDraft.name, plan: teamDraft.plan, customLimits })
        setTeams((prev) => [...prev, result.team])
        setSelectedTeamId(result.team.id)
        setStudentDraft((d) => ({ ...d, teamId: result.team.id }))
        setCoachDraft((d) => ({ ...d, teamId: result.team.id }))
        setTeamDraft({ name: "", plan: "pro", maxStudents: "", maxCoaches: "" })
        setShowCreateTeam(false)
      }, "Time criado."),
    [act, teamDraft]
  )

  return {
    acting,
    act,
    lastSecret, setLastSecret,
    showCreateStudent, setShowCreateStudent,
    showCreateCoach, setShowCreateCoach,
    showCreateTeam, setShowCreateTeam,
    selectedTeamId, setSelectedTeamId,
    studentDraft, setStudentDraft,
    coachDraft, setCoachDraft,
    teamDraft, setTeamDraft,
    doCreateStudent,
    doCreateCoach,
    doCreateTeam,
  }
}

export type StudentActions = ReturnType<typeof useStudentActions>
