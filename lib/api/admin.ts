import { apiRequest } from "./client"
import { AuthUser } from "./auth"
import type { DietPlan, GutoMemory, GutoWorkoutPlan } from "./guto"

export type AdminPlanSource = "guto_generated" | "coach_manual" | "mixed"
export type CatalogLanguage = "pt-BR" | "it-IT" | "en-US" | "es-ES"

export interface AdminCatalogExercise {
  id: string
  canonicalNamePt: string
  namesByLanguage: Record<CatalogLanguage, string>
  aliasesByLanguage: Record<CatalogLanguage, string[]>
  muscleGroup: string
  videoUrl: string
  videoProvider: "local"
  sourceFileName: string
  equipment?: string
  movementPattern?: string
  tags?: string[]
}

export interface AdminExerciseVideoMetadata {
  sourceFileName: string
  videoUrl: string
  fileSizeBytes: number
  durationSeconds: number
  width: number
  height: number
  fps: number
  mimeType?: string
  hasAudio?: boolean
}

export interface AdminCustomExerciseRequest extends AdminCatalogExercise {
  status: "pending" | "approved" | "rejected"
  requestedBy: string
  requestedByRole: string
  requestedAt: string
  videoValidated: boolean
  videoMetadata: Omit<AdminExerciseVideoMetadata, "sourceFileName" | "videoUrl">
  custom: true
  suggestedFileName?: string
  rejectionReason?: string
}

export interface AdminUser extends AuthUser {
  name?: string
  email?: string
  phone?: string
  whatsapp?: string
  instagram?: string
  country?: string
  language?: string
  plan?: string
  paymentStatus?: string
  internalNotes?: string
  active?: boolean
  archived?: boolean
  visibleInArena?: boolean
  subscriptionStatus?: string
  subscriptionEndsAt?: string | null
  accessDurationDays?: number
  createdAt?: string
  updatedAt?: string
  teamId?: string
  teamName?: string | null
}

export interface AdminStudent extends AdminUser {
  role: "student"
  name: string
  subscriptionStatus: string
  createdAt: string
  weeklyXp: number
  monthlyXp: number
  totalXp: number
  avatarStage: "baby" | "teen" | "adult" | "elite"
  currentStreak: number
  validationsTotal: number
  lastValidationAt: string | null
  lastActiveAt: string | null
  coachName?: string | null
  teamName?: string | null
  age?: number | null
  gender?: string | null
  biologicalSex?: string | null
}

export type AdminCoach = AdminUser & { role: "coach" }

export interface AdminStudentFilters {
  search?: string
  coachId?: string
  gender?: string
  minAge?: string
  maxAge?: string
  status?: "active" | "paused" | "inactive" | "archived" | ""
  subscriptionStatus?: string
}

export interface AdminTeam {
  id: string
  name: string
  plan: "start" | "pro" | "elite" | "custom"
  status: "active" | "paused" | "archived"
  createdAt: string
  updatedAt: string
  customLimits?: {
    maxStudents?: number | null
    maxCoaches?: number | null
  }
}

export interface AdminTeamSummary {
  team: {
    id: string
    name: string
    plan: "start" | "pro" | "elite" | "custom"
    planLabel: string
    status: string
  }
  limits: {
    maxStudents: number | null
    maxCoaches: number | null
  }
  usage: {
    students: number
    coaches: number
  }
}

export type AdminLog = {
  id?: string
  action?: string
  actorUserId?: string
  actorRole?: string
  targetUserId?: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

export interface AdminUserListResponse {
  users: AdminUser[]
  students: AdminStudent[]
}

export function getAdminUsers(): Promise<AdminUserListResponse> {
  return apiRequest<AdminUserListResponse>("/admin/users")
}

function toQuery(params: { [key: string]: string | undefined }): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value?.trim()) query.set(key, value.trim())
  })
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ""
}

export function getAdminTeamSummary(teamId?: string): Promise<AdminTeamSummary> {
  return apiRequest<AdminTeamSummary>(`/admin/team/summary${toQuery({ teamId })}`)
}

export function getAdminStudents(filters: AdminStudentFilters = {}): Promise<{ students: AdminStudent[]; users: AdminUser[] }> {
  return apiRequest<{ students: AdminStudent[]; users: AdminUser[] }>(`/admin/students${toQuery({
    search: filters.search,
    coachId: filters.coachId,
    gender: filters.gender,
    minAge: filters.minAge,
    maxAge: filters.maxAge,
    status: filters.status,
    subscriptionStatus: filters.subscriptionStatus,
  })}`)
}

export function getAdminExerciseCatalog(): Promise<{ exercises: AdminCatalogExercise[] }> {
  return apiRequest<{ exercises: AdminCatalogExercise[] }>("/admin/exercises/catalog")
}

export function createAdminCustomExercise(data: {
  id?: string
  canonicalNamePt: string
  muscleGroup: string
  equipment?: string
  movementPattern?: string
  tags?: string[]
} & AdminExerciseVideoMetadata): Promise<{ exercise: AdminCustomExerciseRequest }> {
  return apiRequest<{ exercise: AdminCustomExerciseRequest }>("/admin/exercises/custom", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ─── Aprovações de exercícios (super_admin / admin) ──────────────────────────

export function getAdminCustomExercises(): Promise<{ exercises: AdminCustomExerciseRequest[] }> {
  return apiRequest<{ exercises: AdminCustomExerciseRequest[] }>("/admin/exercises/custom")
}

export function approveAdminCustomExercise(exerciseId: string): Promise<{ exercise: AdminCustomExerciseRequest }> {
  return apiRequest<{ exercise: AdminCustomExerciseRequest }>(
    `/admin/exercises/custom/${exerciseId}/approve`,
    { method: "POST" }
  )
}

export function rejectAdminCustomExercise(
  exerciseId: string,
  reason?: string
): Promise<{ exercise: AdminCustomExerciseRequest }> {
  return apiRequest<{ exercise: AdminCustomExerciseRequest }>(
    `/admin/exercises/custom/${exerciseId}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason: reason ?? "" }),
    }
  )
}

export function createAdminUser(data: Partial<AdminUser> & { password?: string }): Promise<{ user: AdminUser; student?: AdminStudent; inviteLink: string }> {
  return apiRequest<{ user: AdminUser; student?: AdminStudent; inviteLink: string }>("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function createAdminStudent(data: Partial<AdminStudent> & { password?: string }): Promise<{ user: AdminUser; student: AdminStudent; inviteLink: string }> {
  return apiRequest<{ user: AdminUser; student: AdminStudent; inviteLink: string }>("/admin/students", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function getAdminUserDetail(userId: string): Promise<{ user: AdminUser; student?: AdminStudent; memory: GutoMemory | null }> {
  return apiRequest<{ user: AdminUser; student?: AdminStudent; memory: GutoMemory | null }>(`/admin/users/${userId}`)
}

export function getAdminStudentDetail(userId: string): Promise<{ user: AdminUser; student: AdminStudent; memory: GutoMemory | null }> {
  return apiRequest<{ user: AdminUser; student: AdminStudent; memory: GutoMemory | null }>(`/admin/students/${userId}`)
}

export function updateAdminUser(userId: string, data: Partial<AdminUser> & { calibration?: Record<string, unknown> }): Promise<{ user: AdminUser; student?: AdminStudent }> {
  return apiRequest<{ user: AdminUser; student?: AdminStudent }>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export function updateAdminStudent(userId: string, data: Partial<AdminStudent> & { calibration?: Record<string, unknown> }): Promise<{ user: AdminUser; student: AdminStudent }> {
  return apiRequest<{ user: AdminUser; student: AdminStudent }>(`/admin/students/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export function deleteAdminUser(userId: string): Promise<void> {
  return apiRequest<void>(`/admin/users/${userId}`, { method: "DELETE" })
}

export function deleteAdminStudent(userId: string): Promise<void> {
  return apiRequest<void>(`/admin/students/${userId}`, { method: "DELETE" })
}

export function reactivateAdminStudent(userId: string): Promise<{ user: AdminUser; student: AdminStudent }> {
  return apiRequest<{ user: AdminUser; student: AdminStudent }>(`/admin/students/${userId}/reactivate`, { method: "POST" })
}

export function pauseAdminStudent(userId: string): Promise<{ user: AdminUser; student: AdminStudent }> {
  return apiRequest<{ user: AdminUser; student: AdminStudent }>(`/admin/students/${userId}/pause`, { method: "POST" })
}

export function renewAdminStudent(userId: string, days = 30): Promise<{ user: AdminUser; student: AdminStudent }> {
  return apiRequest<{ user: AdminUser; student: AdminStudent }>(`/admin/students/${userId}/renew`, {
    method: "POST",
    body: JSON.stringify({ days }),
  })
}

export function resetAdminStudentPassword(userId: string, password?: string): Promise<{ user: AdminUser; temporaryPassword?: string }> {
  return apiRequest<{ user: AdminUser; temporaryPassword?: string }>(`/admin/students/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify(password ? { password } : {}),
  })
}

export function resetAdminStudent(userId: string, scope: "weekly" | "monthly" | "individual" | "validationHistory" | "all"): Promise<{ student: AdminStudent; scope: string }> {
  return apiRequest<{ student: AdminStudent; scope: string }>(`/admin/students/${userId}/reset`, {
    method: "POST",
    body: JSON.stringify({ scope }),
  })
}

export function getAdminCoaches(): Promise<{ coaches: AdminCoach[] }> {
  return apiRequest<{ coaches: AdminCoach[] }>("/admin/coaches")
}

export function createAdminCoach(data: Partial<AdminCoach> & { password?: string }): Promise<{ coach: AdminCoach; temporaryPassword?: string }> {
  return apiRequest<{ coach: AdminCoach; temporaryPassword?: string }>("/admin/coaches", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updateAdminCoach(coachId: string, data: Partial<AdminCoach>): Promise<{ coach: AdminCoach }> {
  return apiRequest<{ coach: AdminCoach }>(`/admin/coaches/${coachId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export function deleteAdminCoach(coachId: string): Promise<void> {
  return apiRequest<void>(`/admin/coaches/${coachId}`, { method: "DELETE" })
}

export function assignStudentToCoach(coachId: string, studentId: string): Promise<{ student: AdminStudent }> {
  return apiRequest<{ student: AdminStudent }>(`/admin/coaches/${coachId}/students/${studentId}`, { method: "POST" })
}

export function unassignStudentFromCoach(coachId: string, studentId: string): Promise<{ student: AdminStudent }> {
  return apiRequest<{ student: AdminStudent }>(`/admin/coaches/${coachId}/students/${studentId}`, { method: "DELETE" })
}

export function getAdminUserWorkout(userId: string): Promise<{ workout: GutoWorkoutPlan | null }> {
  return apiRequest<{ workout: GutoWorkoutPlan | null }>(`/admin/users/${userId}/workout`)
}

export function getAdminStudentWorkout(userId: string): Promise<{ workout: GutoWorkoutPlan | null }> {
  return apiRequest<{ workout: GutoWorkoutPlan | null }>(`/admin/students/${userId}/workout`)
}

export function updateAdminUserWorkout(userId: string, workout: GutoWorkoutPlan, reason?: string): Promise<{ workout: GutoWorkoutPlan }> {
  return apiRequest<{ workout: GutoWorkoutPlan }>(`/admin/users/${userId}/workout`, {
    method: "PUT",
    body: JSON.stringify({ workout, reason }),
  })
}

export function updateAdminStudentWorkout(userId: string, workout: GutoWorkoutPlan, reason?: string): Promise<{ workout: GutoWorkoutPlan }> {
  return apiRequest<{ workout: GutoWorkoutPlan }>(`/admin/students/${userId}/workout`, {
    method: "PUT",
    body: JSON.stringify({ workout, reason }),
  })
}

export function generateAdminStudentWorkout(userId: string): Promise<{ workout: GutoWorkoutPlan }> {
  return apiRequest<{ workout: GutoWorkoutPlan }>(`/admin/students/${userId}/workout/generate`, { method: "POST" })
}

export function lockAdminStudentWorkout(userId: string): Promise<{ workout: GutoWorkoutPlan }> {
  return apiRequest<{ workout: GutoWorkoutPlan }>(`/admin/students/${userId}/workout/lock`, { method: "POST" })
}

export function unlockAdminStudentWorkout(userId: string): Promise<{ workout: GutoWorkoutPlan }> {
  return apiRequest<{ workout: GutoWorkoutPlan }>(`/admin/students/${userId}/workout/unlock`, { method: "POST" })
}

export function resetAdminUserWorkout(userId: string): Promise<{ workout: null }> {
  return apiRequest<{ workout: null }>(`/admin/users/${userId}/workout/reset`, { method: "POST" })
}

export function resetAdminStudentWorkout(userId: string): Promise<{ workout: null }> {
  return apiRequest<{ workout: null }>(`/admin/students/${userId}/workout/reset`, { method: "POST" })
}

export function getAdminStudentWorkoutHistory(userId: string): Promise<{ history: AdminLog[] }> {
  return apiRequest<{ history: AdminLog[] }>(`/admin/students/${userId}/workout/history`)
}

export type WeekDayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

export type AdminWeeklyWorkoutDays = Partial<Record<WeekDayKey, GutoWorkoutPlan>>

export interface AdminWeeklyWorkoutPlan {
  studentId: string
  updatedAt: string
  updatedBy: string
  days: AdminWeeklyWorkoutDays
}

export interface AdminWeeklyDietDay {
  breakfast?: string
  lunch?: string
  dinner?: string
  snacks?: string
  notes?: string
  hydration?: string
  caloriesEstimate?: number
  proteinEstimate?: number
  status?: string
}

export type AdminWeeklyDietDays = Partial<Record<WeekDayKey, AdminWeeklyDietDay>>

export interface AdminWeeklyDietPlan {
  studentId: string
  updatedAt: string
  updatedBy: string
  days: AdminWeeklyDietDays
}

export function getAdminStudentWeeklyWorkout(userId: string): Promise<{ weeklyWorkout: AdminWeeklyWorkoutPlan | null }> {
  return apiRequest<{ weeklyWorkout: AdminWeeklyWorkoutPlan | null }>(`/admin/students/${userId}/workout/week`)
}

export function updateAdminStudentWeeklyWorkout(userId: string, days: AdminWeeklyWorkoutDays): Promise<{ weeklyWorkout: AdminWeeklyWorkoutPlan }> {
  return apiRequest<{ weeklyWorkout: AdminWeeklyWorkoutPlan }>(`/admin/students/${userId}/workout/week`, {
    method: "PUT",
    body: JSON.stringify({ days }),
  })
}

export function getAdminStudentTodayWorkout(userId: string): Promise<{ workout: GutoWorkoutPlan | null; dayKey: WeekDayKey; fromWeeklyPlan: boolean }> {
  return apiRequest<{ workout: GutoWorkoutPlan | null; dayKey: WeekDayKey; fromWeeklyPlan: boolean }>(`/admin/students/${userId}/workout/today`)
}

export function getAdminUserDiet(userId: string): Promise<{ diet: DietPlan | null }> {
  return apiRequest<{ diet: DietPlan | null }>(`/admin/users/${userId}/diet`)
}

export function getAdminStudentDiet(userId: string): Promise<{ diet: DietPlan | null }> {
  return apiRequest<{ diet: DietPlan | null }>(`/admin/students/${userId}/diet`)
}

export function updateAdminUserDiet(userId: string, diet: DietPlan, reason?: string): Promise<{ diet: DietPlan }> {
  return apiRequest<{ diet: DietPlan }>(`/admin/users/${userId}/diet`, {
    method: "PUT",
    body: JSON.stringify({ diet, reason }),
  })
}

export function updateAdminStudentDiet(userId: string, diet: DietPlan, reason?: string): Promise<{ diet: DietPlan }> {
  return apiRequest<{ diet: DietPlan }>(`/admin/students/${userId}/diet`, {
    method: "PUT",
    body: JSON.stringify({ diet, reason }),
  })
}

export function generateAdminStudentDiet(userId: string): Promise<{ diet: DietPlan }> {
  return apiRequest<{ diet: DietPlan }>(`/admin/students/${userId}/diet/generate`, { method: "POST" })
}

export function lockAdminStudentDiet(userId: string): Promise<{ diet: DietPlan }> {
  return apiRequest<{ diet: DietPlan }>(`/admin/students/${userId}/diet/lock`, { method: "POST" })
}

export function unlockAdminStudentDiet(userId: string): Promise<{ diet: DietPlan }> {
  return apiRequest<{ diet: DietPlan }>(`/admin/students/${userId}/diet/unlock`, { method: "POST" })
}

export function resetAdminStudentDiet(userId: string): Promise<{ diet: null }> {
  return apiRequest<{ diet: null }>(`/admin/students/${userId}/diet/reset`, { method: "POST" })
}

export function getAdminStudentDietHistory(userId: string): Promise<{ history: AdminLog[] }> {
  return apiRequest<{ history: AdminLog[] }>(`/admin/students/${userId}/diet/history`)
}

export function getAdminLogs(targetUserId?: string): Promise<{ logs: AdminLog[] }> {
  const query = targetUserId ? `?targetUserId=${encodeURIComponent(targetUserId)}` : ""
  return apiRequest<{ logs: AdminLog[] }>(`/admin/logs${query}`)
}

export function getAdminTeams(): Promise<{ teams: AdminTeam[] }> {
  return apiRequest<{ teams: AdminTeam[] }>("/admin/teams")
}

export function createAdminTeam(data: {
  name: string
  plan: "start" | "pro" | "elite" | "custom"
  customLimits?: { maxStudents?: number | null; maxCoaches?: number | null }
}): Promise<{ team: AdminTeam }> {
  return apiRequest<{ team: AdminTeam }>("/admin/teams", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updateAdminTeam(teamId: string, data: {
  name?: string
  plan?: "start" | "pro" | "elite" | "custom"
  status?: "active" | "paused" | "archived"
  customLimits?: { maxStudents?: number | null; maxCoaches?: number | null }
}): Promise<{ team: AdminTeam }> {
  return apiRequest<{ team: AdminTeam }>(`/admin/teams/${teamId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export function getAdminStudentInvite(userId: string): Promise<{ invite: unknown; inviteLink: string | null; message?: string }> {
  return apiRequest<{ invite: unknown; inviteLink: string | null; message?: string }>(`/admin/students/${userId}/invite`)
}

export function regenerateAdminStudentInvite(userId: string): Promise<{ inviteLink: string }> {
  return apiRequest<{ inviteLink: string }>(`/admin/students/${userId}/invite/regenerate`, { method: "POST" })
}

// ─── Weekly Diet Plan ─────────────────────────────────────────────────────────

export function getStudentWeeklyDiet(userId: string): Promise<{ weeklyDiet: AdminWeeklyDietPlan | null }> {
  return apiRequest<{ weeklyDiet: AdminWeeklyDietPlan | null }>(`/admin/students/${userId}/diet/week`)
}

export function saveStudentWeeklyDiet(userId: string, days: AdminWeeklyDietDays): Promise<{ weeklyDiet: AdminWeeklyDietPlan }> {
  return apiRequest<{ weeklyDiet: AdminWeeklyDietPlan }>(`/admin/students/${userId}/diet/week`, {
    method: "PUT",
    body: JSON.stringify({ days }),
  })
}

/**
 * Returns today's diet for the student.
 * Priority: weeklyDietPlan[today] → official DietPlan → null
 * NOTE: This endpoint is ready for future student-side integration.
 */
export function getStudentDietToday(userId: string): Promise<{ diet: unknown; dayKey: WeekDayKey; fromWeeklyPlan: boolean; fallback?: string }> {
  return apiRequest<{ diet: unknown; dayKey: WeekDayKey; fromWeeklyPlan: boolean; fallback?: string }>(`/admin/students/${userId}/diet/today`)
}
