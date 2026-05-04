import { apiRequest } from "./client"
import { AuthUser } from "./auth"

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
  createdAt?: string
  updatedAt?: string
}

export interface AdminUserListResponse {
  users: AdminUser[]
}

export async function getAdminUsers(): Promise<AdminUserListResponse> {
  return apiRequest<AdminUserListResponse>("/admin/users")
}

export async function createAdminUser(data: Partial<AdminUser>): Promise<{ user: AdminUser; inviteLink: string }> {
  return apiRequest<{ user: AdminUser; inviteLink: string }>("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getAdminUserDetail(userId: string): Promise<{ user: AdminUser; memory: any }> {
  return apiRequest<{ user: AdminUser; memory: any }>(`/admin/users/${userId}`)
}

export async function updateAdminUser(userId: string, data: Partial<AdminUser>): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteAdminUser(userId: string): Promise<void> {
  return apiRequest<void>(`/admin/users/${userId}`, {
    method: "DELETE",
  })
}

// Workout Overrides
export async function getAdminUserWorkout(userId: string): Promise<{ workout: any }> {
  return apiRequest<{ workout: any }>(`/admin/users/${userId}/workout`)
}

export async function updateAdminUserWorkout(userId: string, workout: any, reason?: string): Promise<{ workout: any }> {
  return apiRequest<{ workout: any }>(`/admin/users/${userId}/workout`, {
    method: "PUT",
    body: JSON.stringify({ workout, reason }),
  })
}

export async function resetAdminUserWorkout(userId: string): Promise<void> {
  return apiRequest<void>(`/admin/users/${userId}/workout/reset`, {
    method: "POST",
  })
}

// Diet Overrides
export async function getAdminUserDiet(userId: string): Promise<{ diet: any }> {
  return apiRequest<{ diet: any }>(`/admin/users/${userId}/diet`)
}

export async function updateAdminUserDiet(userId: string, diet: any, reason?: string): Promise<{ diet: any }> {
  return apiRequest<{ diet: any }>(`/admin/users/${userId}/diet`, {
    method: "PUT",
    body: JSON.stringify({ diet, reason }),
  })
}

// Logs
export async function getAdminLogs(targetUserId?: string): Promise<{ logs: any[] }> {
  const query = targetUserId ? `?targetUserId=${targetUserId}` : ""
  return apiRequest<{ logs: any[] }>(`/admin/logs${query}`)
}
