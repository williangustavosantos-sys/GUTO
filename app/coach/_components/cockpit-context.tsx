"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { AuthUser } from "@/lib/api/auth"
import { useAdminPermissions } from "../_hooks/use-admin-permissions"
import { useCoachFilters, type CoachFilters } from "../_hooks/use-coach-filters"
import { useCoachData, type CoachData } from "../_hooks/use-coach-data"
import { useStudentDetail, type StudentDetailHook } from "../_hooks/use-student-detail"
import { useStudentActions, type StudentActions } from "../_hooks/use-student-actions"
import { useEmpresaDetail, type EmpresaDetailHook } from "../_hooks/use-empresa-detail"
import { useCoachDetail, type CoachDetailHook } from "../_hooks/use-coach-detail"
import { useAprovacoes, type AprovacoesHook } from "../_hooks/use-aprovacoes"
import type { Screen } from "./utils"

// ─── Context shape ────────────────────────────────────────────────────────────

interface CockpitContextValue
  extends CoachFilters,
    Omit<CoachData, "setStudents" | "setCoaches" | "setTeams">,
    StudentDetailHook,
    StudentActions,
    EmpresaDetailHook,
    CoachDetailHook,
    AprovacoesHook {
  user: AuthUser
  isAdmin: boolean
  isSuperAdmin: boolean
  activeScreen: Screen
  setActiveScreen: (screen: Screen) => void
  studentLimitReached: boolean
  coachLimitReached: boolean
  superAdminNeedsTeam: boolean
  // expose setters needed by screens
  setStudents: CoachData["setStudents"]
  setCoaches: CoachData["setCoaches"]
  setTeams: CoachData["setTeams"]
}

const CockpitContext = createContext<CockpitContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CockpitProvider({
  user,
  children,
}: {
  user: AuthUser
  children: ReactNode
}) {
  const [activeScreen, setActiveScreen] = useState<Screen>("hoje")
  const { isAdmin, isSuperAdmin } = useAdminPermissions(user)

  const filters = useCoachFilters()
  const data = useCoachData(user, isAdmin, isSuperAdmin, filters)
  const detail = useStudentDetail()
  const actions = useStudentActions({
    selectedDetail: detail.selectedDetail,
    fetchStudents: data.fetchStudents,
    fetchTeamSummary: data.fetchTeamSummary,
    refreshSelected: detail.refreshSelected,
  })
  const empresaDetail = useEmpresaDetail()
  const coachDetail = useCoachDetail()
  const aprovacoes = useAprovacoes()

  const studentLimitReached = Boolean(
    data.teamSummary &&
      data.teamSummary.limits.maxStudents !== null &&
      data.teamSummary.usage.students >= data.teamSummary.limits.maxStudents
  )
  const coachLimitReached = Boolean(
    data.teamSummary &&
      data.teamSummary.limits.maxCoaches !== null &&
      data.teamSummary.usage.coaches >= data.teamSummary.limits.maxCoaches
  )
  const superAdminNeedsTeam = isSuperAdmin && !actions.selectedTeamId

  const value: CockpitContextValue = {
    user,
    isAdmin,
    isSuperAdmin,
    activeScreen,
    setActiveScreen,
    studentLimitReached,
    coachLimitReached,
    superAdminNeedsTeam,
    ...filters,
    ...data,
    ...detail,
    ...actions,
    ...empresaDetail,
    ...coachDetail,
    ...aprovacoes,
  }

  return <CockpitContext.Provider value={value}>{children}</CockpitContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCockpit(): CockpitContextValue {
  const ctx = useContext(CockpitContext)
  if (!ctx) throw new Error("useCockpit must be used inside CockpitProvider")
  return ctx
}
