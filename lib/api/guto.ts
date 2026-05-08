import { apiRequest, ApiError } from "./client"

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
  load?: string | null
  rest: string
  restSeconds?: number
  cue: string
  note: string
  alternatives?: string[]
  order?: number
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
  studentId?: string
  title?: string
  focus: string
  focusKey?: WorkoutFocus
  weekDay?: string
  goal?: string
  location?: string
  locationMode?: WorkoutLocationMode
  dateLabel: string
  scheduledFor: string
  summary: string
  exercises: GutoWorkoutExercise[]
  blocks?: Array<{
    name: string
    exercises: Array<Partial<GutoWorkoutExercise> & {
      name: string
      load?: string | null
      restSeconds?: number
      notes?: string
      alternatives?: string[]
    }>
  }>
  estimatedDurationMinutes?: number
  difficulty?: string
  coachNotes?: string
  manualOverride?: boolean
  editedBy?: string
  editedAt?: string
  editReason?: string
  planSource?: "ai_generated" | "admin_override" | "coach_override"
  source?: "guto_generated" | "coach_manual" | "mixed"
  lockedByCoach?: boolean
  updatedBy?: string
  updatedAt?: string
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
  acao?: "none" | "updateWorkout" | "lock" | "changeLanguage" | "requestDeleteAccount" | "showProfile"
  expectedResponse?: GutoExpectedResponse | null
  avatarEmotion?: GutoAvatarEmotion
  workoutPlan?: GutoWorkoutPlan | null
  memoryPatch?: Partial<GutoMemory>
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
  country?: string
  heightCm?: number
  weightKg?: number
  foodRestrictions?: string
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
  weeklyWorkoutPlan?: {
    studentId: string
    updatedAt: string
    updatedBy: string
    days: Partial<Record<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday", GutoWorkoutPlan>>
  } | null
  weeklyDietPlan?: {
    studentId: string
    updatedAt: string
    updatedBy: string
    days: Partial<Record<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday", {
      breakfast?: string
      lunch?: string
      dinner?: string
      snacks?: string
      notes?: string
      hydration?: string
      caloriesEstimate?: number
      proteinEstimate?: number
    }>>
  } | null
  proactiveSent: Record<string, string[]>
  initialXpRewardSeen: boolean
  validationHistory?: WorkoutValidationRecord[]
}

export interface GutoProactiveResponse {
  due: boolean
  slot?: string
  fala?: string
  acao?: "none" | "updateWorkout" | "lock" | "changeLanguage" | "requestDeleteAccount" | "showProfile"
  expectedResponse?: GutoExpectedResponse | null
  avatarEmotion?: GutoAvatarEmotion
  workoutPlan?: GutoWorkoutPlan | null
}

// ─── Diet types ───────────────────────────────────────────────────────────────

export interface DietMacros {
  bmr: number
  tdee: number
  targetKcal: number
  proteinG: number
  carbsG: number
  fatG: number
  goal: string
}

export interface DietFood {
  name: string
  quantity: string
  kcal: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  notes?: string
}

export interface DietMeal {
  id: string
  name: string
  time: string
  foods: DietFood[]
  totalKcal: number
  gutoNote: string
  alternatives?: string[]
}

export interface DietPlan {
  userId: string
  title?: string
  generatedAt: string
  country: string
  macros: DietMacros
  meals: DietMeal[]
  goal?: string
  coachNotes?: string
  restrictions?: string
  foodRestrictions?: string
  manualOverride?: boolean
  editedBy?: string
  editedAt?: string
  editReason?: string
  planSource?: "ai_generated" | "admin_override" | "coach_override"
  source?: "guto_generated" | "coach_manual" | "mixed"
  lockedByCoach?: boolean
  updatedBy?: string
  updatedAt?: string
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

export async function validateGutoName(name: string, userId?: string) {
  return apiRequest<GutoNameValidation>("/guto/validate-name", {
    method: "POST",
    body: JSON.stringify({ name, userId }),
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
  country?: string
  heightCm?: number
  weightKg?: number
  foodRestrictions?: string
  confirmedName?: boolean
  initialXpRewardSeen?: boolean
  lastWorkoutPlan?: GutoWorkoutPlan | null
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
  workoutPlan?: GutoWorkoutPlan | null
}) {
  return apiRequest<{ success: true; validation: WorkoutValidationRecord; validationHistory: WorkoutValidationRecord[]; arena?: ArenaAwardResult }>(
    "/guto/validate-workout",
    {
      method: "POST",
      timeoutMs: 30000,
      body: JSON.stringify(payload),
    }
  )
}

// --- Arena types ---

export type ArenaAvatarStage = "baby" | "teen" | "adult" | "elite"

export interface ArenaRankingItem {
  position: number
  userId: string
  pairName: string
  avatarStage: ArenaAvatarStage
  xp: number
  validatedWorkouts: number
  status?: string
  currentStreak?: number
  nextEvolutionXp?: number | null
  xpToNextEvolution?: number | null
}

export interface ArenaRankingResponse {
  rankingType: "weekly" | "monthly" | "individual"
  arenaGroupId: string
  resetLabel?: string
  items: ArenaRankingItem[]
}

export interface ArenaMyProfile {
  userId: string
  pairName: string
  avatarStage: ArenaAvatarStage
  totalXp: number
  weeklyXp: number
  monthlyXp: number
  currentStreak: number
  validatedWorkoutsTotal: number
  nextEvolutionXp: number | null
  xpToNextEvolution: number | null
}

export interface ArenaAwardResult {
  xpAwarded: number
  totalXp: number
  weeklyXp: number
  monthlyXp: number
  avatarStage: ArenaAvatarStage
  leveledUp: boolean
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

export async function getArenaWeekly(arenaGroupId = "will-personal-alpha") {
  return apiRequest<ArenaRankingResponse>(
    `/guto/arena/weekly?arenaGroupId=${encodeURIComponent(arenaGroupId)}`,
    { method: "GET" }
  )
}

export async function getArenaMonthly(arenaGroupId = "will-personal-alpha") {
  return apiRequest<ArenaRankingResponse>(
    `/guto/arena/monthly?arenaGroupId=${encodeURIComponent(arenaGroupId)}`,
    { method: "GET" }
  )
}

/**
 * Individual ranking é GLOBAL no backend — todos os alunos do GUTO,
 * independente de Time. arenaGroupId é ignorado pelo servidor; aceito
 * só para compat com chamadas antigas.
 */
export async function getArenaIndividual(_arenaGroupId?: string) {
  return apiRequest<ArenaRankingResponse>(
    `/guto/arena/individual`,
    { method: "GET" }
  )
}

export async function getArenaMe(userId: string, arenaGroupId = "will-personal-alpha") {
  return apiRequest<ArenaMyProfile>(
    `/guto/arena/me?userId=${encodeURIComponent(userId)}&arenaGroupId=${encodeURIComponent(arenaGroupId)}`,
    { method: "GET" }
  )
}

// ─── Diet API ─────────────────────────────────────────────────────────────────

export async function getDietPlan(userId = "local-user") {
  try {
    return await apiRequest<DietPlan>(`/guto/diet?userId=${encodeURIComponent(userId)}`, {
      method: "GET",
    })
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

export async function generateDietPlan(userId = "local-user", language: SupportedLanguage = "pt-BR") {
  return apiRequest<DietPlan>("/guto/diet/generate", {
    method: "POST",
    timeoutMs: 45000,
    body: JSON.stringify({ userId, language }),
  })
}
