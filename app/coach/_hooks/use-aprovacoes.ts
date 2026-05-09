import { useState, useCallback } from "react"
import { toast } from "sonner"
import {
  getAdminCustomExercises,
  approveAdminCustomExercise,
  rejectAdminCustomExercise,
  type AdminCustomExerciseRequest,
} from "@/lib/api/admin"
import { adminErrorMessage } from "../_components/utils"

/**
 * Aprovações de itens enviados por coaches.
 * Hoje: exercícios. Alimentos serão adicionados no PR #4 (depende de backend).
 */
export function useAprovacoes() {
  const [pendingExercises, setPendingExercises] = useState<AdminCustomExerciseRequest[]>([])
  const [loaded, setLoaded] = useState(false)
  const [acting, setActing] = useState(false)

  const fetchPendingExercises = useCallback(async () => {
    try {
      const { exercises } = await getAdminCustomExercises()
      // backend devolve approved/rejected também — filtramos no client por enquanto
      setPendingExercises(exercises.filter((e) => e.status === "pending"))
      setLoaded(true)
    } catch (error) {
      toast.error(adminErrorMessage(error))
    }
  }, [])

  const approveExercise = useCallback(
    async (exerciseId: string) => {
      setActing(true)
      try {
        await approveAdminCustomExercise(exerciseId)
        setPendingExercises((prev) => prev.filter((e) => e.id !== exerciseId))
        toast.success("Exercício aprovado e adicionado ao Banco do GUTO.")
      } catch (error) {
        toast.error(adminErrorMessage(error))
      } finally {
        setActing(false)
      }
    },
    []
  )

  const rejectExercise = useCallback(
    async (exerciseId: string, reason?: string) => {
      setActing(true)
      try {
        await rejectAdminCustomExercise(exerciseId, reason)
        setPendingExercises((prev) => prev.filter((e) => e.id !== exerciseId))
        toast.success("Exercício rejeitado.")
      } catch (error) {
        toast.error(adminErrorMessage(error))
      } finally {
        setActing(false)
      }
    },
    []
  )

  return {
    pendingExercises,
    loaded,
    acting,
    fetchPendingExercises,
    approveExercise,
    rejectExercise,
  }
}

export type AprovacoesHook = ReturnType<typeof useAprovacoes>
