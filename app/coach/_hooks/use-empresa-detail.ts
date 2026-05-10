import { useState, useCallback } from "react"
import { toast } from "sonner"
import { getAdminTeamSummary, type AdminTeam, type AdminTeamSummary } from "@/lib/api/admin"
import { adminErrorMessage, type EmpresaTab } from "../_components/utils"

/**
 * Detalhe da empresa (drawer 5 abas: Resumo, Coaches, Alunos, Plano, Logs).
 *
 * Dados específicos da empresa que precisam de fetch adicional:
 *  - summary (limites/uso) via getAdminTeamSummary(teamId)
 *
 * Coaches/alunos/logs por empresa são filtrados localmente a partir das listas
 * globais já carregadas em useCoachData (evita N+1 e mantém UX instantânea).
 * Quando o backend embutir usage no GET /admin/teams (PR #3), removemos o
 * summary específico daqui.
 */
export function useEmpresaDetail() {
  const [selectedEmpresa, setSelectedEmpresa] = useState<AdminTeam | null>(null)
  const [empresaTab, setEmpresaTab] = useState<EmpresaTab>("resumo")
  const [empresaSummary, setEmpresaSummary] = useState<AdminTeamSummary | null>(null)
  const [empresaSummaryError, setEmpresaSummaryError] = useState<string | null>(null)

  const openEmpresa = useCallback(async (team: AdminTeam, tab: EmpresaTab = "resumo") => {
    setSelectedEmpresa(team)
    setEmpresaTab(tab)
    setEmpresaSummary(null)
    setEmpresaSummaryError(null)
    try {
      const summary = await getAdminTeamSummary(team.id)
      setEmpresaSummary(summary)
    } catch (error) {
      const message = adminErrorMessage(error)
      setEmpresaSummaryError(message)
      // não toast — o erro fica visível no painel da aba Resumo
    }
  }, [])

  const closeEmpresa = useCallback(() => {
    setSelectedEmpresa(null)
    setEmpresaSummary(null)
    setEmpresaSummaryError(null)
  }, [])

  const refreshEmpresa = useCallback(async () => {
    if (!selectedEmpresa) return
    try {
      const summary = await getAdminTeamSummary(selectedEmpresa.id)
      setEmpresaSummary(summary)
      setEmpresaSummaryError(null)
    } catch (error) {
      setEmpresaSummaryError(adminErrorMessage(error))
      toast.error(adminErrorMessage(error))
    }
  }, [selectedEmpresa])

  return {
    selectedEmpresa,
    setSelectedEmpresa,
    empresaTab,
    setEmpresaTab,
    empresaSummary,
    empresaSummaryError,
    openEmpresa,
    closeEmpresa,
    refreshEmpresa,
  }
}

export type EmpresaDetailHook = ReturnType<typeof useEmpresaDetail>
