import { apiRequest } from "./client"

export type SupportedLanguage = "pt-BR" | "it-IT" | "es-ES" | "en-US"
export type WorkoutLocationMode = "gym" | "home" | "park"

export interface WorkoutValidationRecord {
  id: string
  userId: string
  createdAt: string
  dateLabel: string
  workoutFocus: string
  workoutLabel: string
  locationMode: WorkoutLocationMode
  language: SupportedLanguage
  photoUrl: string
  posterUrl: string
  thumbUrl: string
  xp: number
  status: "validated"
  gutoMessage: string
}
export type GutoAvatarEmotion = "default" | "alert" | "critical" | "reward"
export type GutoTelemetryEvent =
  | "user_created"
  | "pact_completed"
  | "first_message_sent"
  | "mission_completed"
  | "user_returned_next_day"
  | "calibration_completed"

export interface GutoWorkoutExercise {
  id: string
  name: string
  canonicalNamePt: string
  muscleGroup: string
  sets: number
  reps: string
  rest: string
  cue: string
  note: string
  videoUrl: string
  videoProvider: "local"
  sourceFileName: string
  // kept for backward compat with plans saved before the catalog migration
  animationId?: string
  animationUrl?: string
  animationProvider?: "workoutx"
}

export type WorkoutFocus =
  | "chest_triceps"
  | "back_biceps"
  | "legs_core"
  | "shoulders_abs"
  | "full_body"

export interface GutoWorkoutPlan {
  focus: string
  focusKey?: WorkoutFocus
  dateLabel: string
  scheduledFor: string
  summary: string
  exercises: GutoWorkoutExercise[]
}

export interface GutoExpectedResponse {
  type: "text"
  options?: string[]
  instruction?: string
  context?: "training_schedule" | "training_location" | "training_status" | "training_limitations" | "limitation_check"
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
  acao?: "none" | "updateWorkout" | "lock"
  expectedResponse?: GutoExpectedResponse | null
  avatarEmotion?: GutoAvatarEmotion
  workoutPlan?: GutoWorkoutPlan | null
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
  initialXpGranted: boolean
  totalXp: number
  streak: number
  trainedToday: boolean
  adaptedMissionToday: boolean
  lastActiveAt: string
  energyLast?: string
  trainingLocation?: string
  trainingStatus?: string
  trainingLimitations?: string
  trainingAge?: number
  userAge?: number
  biologicalSex?: "female" | "male" | "prefer_not_to_say"
  trainingLevel?: "beginner" | "returning" | "consistent" | "advanced"
  trainingGoal?: "consistency" | "fat_loss" | "muscle_gain" | "conditioning" | "mobility_health"
  preferredTrainingLocation?: "gym" | "home" | "park" | "mixed"
  trainingPathology?: string
  lastWorkoutCompletedAt?: string
  completedWorkoutDates: string[]
  adaptedMissionDates: string[]
  missedMissionDates: string[]
  xpEvents: {
    id: string
    type: "grant_initial_xp" | "complete_daily_mission" | "accept_adapted_mission" | "apply_daily_miss_penalty"
    amount: number
    date: string
    createdAt: string
  }[]
  lastLimitationCheckAt?: string
  lastWorkoutPlan?: GutoWorkoutPlan | null
  proactiveSent: Record<string, string[]>
  initialXpRewardSeen: boolean
  validationHistory?: WorkoutValidationRecord[]
}

export interface GutoProactiveResponse {
  due: boolean
  slot?: string
  fala?: string
  acao?: "none" | "updateWorkout" | "lock"
  expectedResponse?: GutoExpectedResponse | null
  avatarEmotion?: GutoAvatarEmotion
  workoutPlan?: GutoWorkoutPlan | null
}

export async function sendGutoMessage(payload: SendGutoMessageRequest) {
  return apiRequest<SendGutoMessageResponse>("/guto", {
    method: "POST",
    timeoutMs: 35000,
    body: JSON.stringify(payload),
  })
}

export async function trackGutoEvent(payload: {
  event: GutoTelemetryEvent
  userId?: string
  language?: SupportedLanguage
  metadata?: Record<string, unknown>
}) {
  return apiRequest<{ ok: true }>("/guto/events", {
    method: "POST",
    timeoutMs: 5000,
    body: JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
    }),
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
  xpEvent?: "grant_initial_xp" | "complete_daily_mission" | "accept_adapted_mission" | "apply_daily_miss_penalty"
  energyLast?: string
  trainingLocation?: string
  trainingStatus?: string
  trainingLimitations?: string
  userAge?: number
  biologicalSex?: "female" | "male" | "prefer_not_to_say"
  trainingLevel?: "beginner" | "returning" | "consistent" | "advanced"
  trainingGoal?: "consistency" | "fat_loss" | "muscle_gain" | "conditioning" | "mobility_health"
  preferredTrainingLocation?: "gym" | "home" | "park" | "mixed"
  trainingPathology?: string
  confirmedName?: boolean
  initialXpRewardSeen?: boolean
}) {
  return apiRequest<GutoMemory>("/guto/memory", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getGutoMemory(userId = "local-user") {
  return apiRequest<GutoMemory>(`/guto/memory?userId=${encodeURIComponent(userId)}`, {
    method: "GET",
  })
}

export async function validateWorkout(payload: {
  userId: string
  imageBase64: string
  workoutFocus: string
  workoutLabel: string
  locationMode: WorkoutLocationMode
  language: SupportedLanguage
}) {
  return apiRequest<{ success: true; validation: WorkoutValidationRecord; validationHistory: WorkoutValidationRecord[] }>(
    "/guto/validate-workout",
    {
      method: "POST",
      timeoutMs: 30000,
      body: JSON.stringify(payload),
    }
  )
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
