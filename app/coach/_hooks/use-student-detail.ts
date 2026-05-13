import { useState, useCallback } from "react"
import { toast } from "sonner"
import {
  getAdminStudentDetail,
  getAdminStudentWorkout,
  getAdminStudentWeeklyWorkout,
  getAdminStudentDiet,
  getAdminLogs,
  getAdminStudentWorkoutHistory,
  getAdminStudentDietHistory,
  type AdminStudent,
  type AdminWeeklyWorkoutPlan,
  type AdminWeeklyDietPlan,
} from "@/lib/api/admin"
import { getStudentWeeklyDiet } from "@/lib/api/admin"
import type { GutoWorkoutPlan, DietPlan } from "@/lib/api/guto"
import {
  adminErrorMessage,
  calibrationFromMemory,
  normalizeWorkoutForEditor,
  normalizeDietForEditor,
  blankWorkout,
  blankDiet,
  type DetailTab,
  type StudentDetail,
  type CalibrationDraft,
} from "../_components/utils"

export function useStudentDetail() {
  const [selectedDetail, setSelectedDetail] = useState<StudentDetail | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>("resumo")
  const [workoutEditor, setWorkoutEditor] = useState<GutoWorkoutPlan | null>(null)
  const [weeklyWorkoutPlan, setWeeklyWorkoutPlan] = useState<AdminWeeklyWorkoutPlan | null>(null)
  const [treinoSubTab, setTreinoSubTab] = useState<"oficial" | "semana">("oficial")
  const [dietEditor, setDietEditor] = useState<DietPlan | null>(null)
  const [weeklyDietPlan, setWeeklyDietPlan] = useState<AdminWeeklyDietPlan | null>(null)
  const [dietaSubTab, setDietaSubTab] = useState<"oficial" | "semanal">("oficial")
  const [calibrationDraft, setCalibrationDraft] = useState<CalibrationDraft>(
    calibrationFromMemory(null)
  )

  const refreshSelected = useCallback(async (studentId: string) => {
    const [detail, workout, weeklyWorkout, diet, weeklyDiet, logs, workoutHistory, dietHistory] =
      await Promise.all([
        getAdminStudentDetail(studentId),
        getAdminStudentWorkout(studentId),
        getAdminStudentWeeklyWorkout(studentId),
        getAdminStudentDiet(studentId),
        getStudentWeeklyDiet(studentId),
        getAdminLogs(studentId),
        getAdminStudentWorkoutHistory(studentId),
        getAdminStudentDietHistory(studentId),
      ])

    const nextDetail: StudentDetail = {
      student: detail.student,
      memory: detail.memory,
      workout: workout.workout,
      diet: diet.diet,
      logs: logs.logs,
      workoutHistory: workoutHistory.history,
      dietHistory: dietHistory.history,
    }
    setSelectedDetail(nextDetail)
    setWorkoutEditor(normalizeWorkoutForEditor(workout.workout, detail.student))
    setWeeklyWorkoutPlan(weeklyWorkout.weeklyWorkout)
    setWeeklyDietPlan(weeklyDiet.weeklyDiet)
    setDietEditor(normalizeDietForEditor(diet.diet, detail.student))
    setCalibrationDraft(calibrationFromMemory(detail.memory))
  }, [])

  const openStudent = useCallback(
    async (student: AdminStudent, tab: DetailTab = "resumo") => {
      setDetailTab(tab)
      setSelectedDetail({
        student, memory: null, workout: null, diet: null,
        logs: [], workoutHistory: [], dietHistory: [],
      })
      setWorkoutEditor(blankWorkout(student))
      setDietEditor(blankDiet(student))
      try {
        await refreshSelected(student.userId)
      } catch (error) {
        toast.error(adminErrorMessage(error))
      }
    },
    [refreshSelected]
  )

  const closeStudent = useCallback(() => {
    setSelectedDetail(null)
  }, [])

  return {
    selectedDetail, setSelectedDetail,
    detailTab, setDetailTab,
    workoutEditor, setWorkoutEditor,
    weeklyWorkoutPlan, setWeeklyWorkoutPlan,
    treinoSubTab, setTreinoSubTab,
    dietEditor, setDietEditor,
    weeklyDietPlan, setWeeklyDietPlan,
    dietaSubTab, setDietaSubTab,
    calibrationDraft, setCalibrationDraft,
    openStudent, closeStudent, refreshSelected,
  }
}

export type StudentDetailHook = ReturnType<typeof useStudentDetail>
