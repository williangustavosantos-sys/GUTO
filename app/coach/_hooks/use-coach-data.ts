import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { apiRequest } from "@/lib/api/client"
import {
  getAdminStudents,
  getAdminCoaches,
  getAdminTeams,
  getAdminTeamSummary,
  getAdminExerciseCatalog,
  getAdminLogs,
  type AdminStudent,
  type AdminCoach,
  type AdminTeam,
  type AdminTeamSummary,
  type AdminCatalogExercise,
} from "@/lib/api/admin"
import type { AuthUser } from "@/lib/api/auth"
import { adminErrorMessage, type RankingsData } from "../_components/utils"
import type { CoachFilters } from "./use-coach-filters"

export function useCoachData(
  user: AuthUser | null,
  isAdmin: boolean,
  isSuperAdmin: boolean,
  filters: CoachFilters
) {
  const [students, setStudents] = useState<AdminStudent[]>([])
  const [coaches, setCoaches] = useState<AdminCoach[]>([])
  const [teams, setTeams] = useState<AdminTeam[]>([])
  const [teamSummary, setTeamSummary] = useState<AdminTeamSummary | null>(null)
  const [teamSummaryError, setTeamSummaryError] = useState<string | null>(null)
  const [exerciseCatalog, setExerciseCatalog] = useState<AdminCatalogExercise[]>([])
  const [rankings, setRankings] = useState<RankingsData | null>(null)
  const [globalLogs, setGlobalLogs] = useState<ReturnType<typeof getAdminLogs> extends Promise<{ logs: infer L }> ? L : never>([])
  const [loading, setLoading] = useState(true)

  const fetchStudents = useCallback(async () => {
    const { filter, search, coachFilter, genderFilter, minAgeFilter, maxAgeFilter, subscriptionStatusFilter } = filters
    const data = await getAdminStudents({
      search,
      coachId: isAdmin ? coachFilter : "",
      gender: genderFilter,
      minAge: minAgeFilter,
      maxAge: maxAgeFilter,
      status:
        filter === "ativos" ? "active" :
        filter === "pausados" ? "paused" :
        filter === "arquivados" ? "archived" :
        "",
      subscriptionStatus: subscriptionStatusFilter,
    })
    setStudents(data.students)
  }, [filters, isAdmin])

  const fetchTeamSummary = useCallback(async () => {
    try {
      const data = await getAdminTeamSummary()
      setTeamSummary(data)
      setTeamSummaryError(null)
    } catch (error) {
      setTeamSummaryError(adminErrorMessage(error))
    }
  }, [])

  const fetchCoaches = useCallback(async () => {
    if (!isAdmin) return
    const data = await getAdminCoaches()
    setCoaches(data.coaches)
  }, [isAdmin])

  const fetchTeams = useCallback(async () => {
    if (!isSuperAdmin) return
    const data = await getAdminTeams()
    setTeams(data.teams)
  }, [isSuperAdmin])

  const fetchExerciseCatalog = useCallback(async () => {
    const data = await getAdminExerciseCatalog()
    setExerciseCatalog(data.exercises)
  }, [])

  const fetchRankings = useCallback(async () => {
    const data = await apiRequest<RankingsData>("/guto/coach/rankings")
    setRankings(data)
  }, [])

  const fetchGlobalLogs = useCallback(async () => {
    if (!isAdmin) return
    const data = await getAdminLogs()
    setGlobalLogs(data.logs)
  }, [isAdmin])

  const loadBase = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      await Promise.all([fetchCoaches(), fetchExerciseCatalog(), fetchTeamSummary(), fetchTeams()])
    } catch (error) {
      toast.error(adminErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [fetchCoaches, fetchExerciseCatalog, fetchTeamSummary, fetchTeams, user])

  useEffect(() => {
    void loadBase()
  }, [loadBase])

  useEffect(() => {
    if (!user) return
    void fetchStudents().catch((error) => toast.error(adminErrorMessage(error)))
  }, [fetchStudents, user])

  return {
    students, setStudents,
    coaches, setCoaches,
    teams, setTeams,
    teamSummary,
    teamSummaryError,
    exerciseCatalog,
    rankings,
    globalLogs,
    loading,
    fetchStudents,
    fetchTeamSummary,
    fetchRankings,
    fetchGlobalLogs,
  }
}

export type CoachData = ReturnType<typeof useCoachData>
