import { apiRequest } from "./client"

export type SupportedLanguage = "pt-BR" | "it-IT" | "es-ES" | "en-US"

export interface GutoExpectedResponse {
  type: "text"
  options?: string[]
  instruction?: string
  context?: "training_location" | "training_status" | "training_limitations" | "limitation_check"
}

export interface SendGutoMessageRequest {
  profile: {
    name: string
    userId?: string
    streak?: number
    trainedToday?: boolean
    energyLast?: string
  }
  input: string
  language: SupportedLanguage
  history: {
    role: "user" | "model"
    parts: { text: string }[]
  }[]
  expectedResponse?: GutoExpectedResponse | null
}

export interface SendGutoMessageResponse {
  fala?: string
  expectedResponse?: GutoExpectedResponse | null
}

export interface GutoNameValidation {
  status: "invalid" | "confirm" | "valid"
  normalized: string
  message: string
}

export interface GutoMemory {
  userId: string
  name: string
  language: SupportedLanguage
  streak: number
  trainedToday: boolean
  lastActiveAt: string
  energyLast?: string
  trainingLocation?: string
  trainingStatus?: string
  trainingLimitations?: string
  lastWorkoutCompletedAt?: string
  lastLimitationCheckAt?: string
  proactiveSent: Record<string, string[]>
}

export interface GutoProactiveResponse {
  due: boolean
  slot?: string
  fala?: string
  acao?: "none" | "updateWorkout" | "lock"
  expectedResponse?: GutoExpectedResponse | null
}

export async function sendGutoMessage(payload: SendGutoMessageRequest) {
  return apiRequest<SendGutoMessageResponse>("/guto", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function validateGutoName(name: string) {
  return apiRequest<GutoNameValidation>("/guto/validate-name", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export async function saveGutoMemory(payload: {
  userId?: string
  name?: string
  language?: SupportedLanguage
  trainedToday?: boolean
  energyLast?: string
  trainingLocation?: string
  trainingStatus?: string
  trainingLimitations?: string
  confirmedName?: boolean
}) {
  return apiRequest<GutoMemory>("/guto/memory", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getGutoProactive({
  userId = "local-user",
  language,
  force = false,
}: {
  userId?: string
  language: SupportedLanguage
  force?: boolean
}) {
  const params = new URLSearchParams({ userId, language })
  if (force) params.set("force", "1")

  return apiRequest<GutoProactiveResponse>(`/guto/proactive?${params.toString()}`, {
    method: "GET",
    timeoutMs: 30000,
  })
}
