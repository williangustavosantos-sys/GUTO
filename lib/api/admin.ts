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
}

export type AdminCoach = AdminUser & { role: "coach" }

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

export function getAdminStudents(): Promise<{ students: AdminStudent[]; users: AdminUser[] }> {
  return apiRequest<{ students: AdminStudent[]; users: AdminUser[] }>("/admin/students")
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
