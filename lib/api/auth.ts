import { apiRequest } from "./client"

export interface AuthUser {
  userId: string
  name?: string
  email?: string
  role: "admin" | "coach" | "student" | "super_admin"
  coachId?: string
  active?: boolean
  subscriptionStatus?: string
  subscriptionEndsAt?: string | null
}

export interface LoginResponse {
  token: string
  role: AuthUser["role"]
  userId: string
  coachId?: string
  name?: string
  email?: string
  subscriptionStatus?: string
  subscriptionEndsAt?: string | null
}

export async function loginAdmin(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function loginCoach(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/coach/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function loginUser(emailOrId: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/user/login", {
    method: "POST",
    body: JSON.stringify({ emailOrId, password }),
  })
}

export async function getMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me")
}

export async function getInvite(token: string): Promise<{ name: string; userId: string; coachId: string }> {
  return apiRequest<{ name: string; userId: string; coachId: string }>(`/auth/invite/${token}`)
}

export async function claimInvite(token: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(`/auth/invite/${token}/claim`, {
    method: "POST",
    body: JSON.stringify({ password }),
  })
}

export async function logout(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST" })
}
