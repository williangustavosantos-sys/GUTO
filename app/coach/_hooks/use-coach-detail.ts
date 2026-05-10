import { useCallback, useState } from "react"
import type { AdminCoach } from "@/lib/api/admin"
import type { CoachDetailTab } from "../_components/utils"

/**
 * Detalhe do Coach (drawer 5 abas: Resumo, Alunos, Treinos, Dietas, Logs).
 *
 * Sem fetch adicional — todas as informações já vivem nas listas globais
 * (students, coaches, globalLogs). O hook só guarda seleção + aba ativa.
 */
export function useCoachDetail() {
  const [selectedCoach, setSelectedCoach] = useState<AdminCoach | null>(null)
  const [coachDetailTab, setCoachDetailTab] = useState<CoachDetailTab>("resumo")

  const openCoach = useCallback((coach: AdminCoach, tab: CoachDetailTab = "resumo") => {
    setSelectedCoach(coach)
    setCoachDetailTab(tab)
  }, [])

  const closeCoach = useCallback(() => {
    setSelectedCoach(null)
  }, [])

  return {
    selectedCoach,
    setSelectedCoach,
    coachDetailTab,
    setCoachDetailTab,
    openCoach,
    closeCoach,
  }
}

export type CoachDetailHook = ReturnType<typeof useCoachDetail>
