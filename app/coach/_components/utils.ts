import type {
  AdminStudent,
  AdminCoach,
  AdminCatalogExercise,
  AdminWeeklyDietDay,
  WeekDayKey,
} from "@/lib/api/admin"
import type { GutoMemory, GutoWorkoutPlan, GutoWorkoutExercise, DietPlan } from "@/lib/api/guto"
import { ApiError } from "@/lib/api/client"

// ─── Screen & Tab Types ────────────────────────────────────────────────────────

export type Screen =
  | "hoje"
  | "empresas"
  | "students"
  | "aprovacoes"
  | "banco"
  | "arena"
  | "logs"
export type FilterTab = "ativos" | "pausados" | "arquivados" | "todos"
export type DetailTab = "resumo" | "calibragem" | "treino" | "dieta" | "validacoes" | "historico" | "acesso"
export type EmpresaTab = "resumo" | "coaches" | "alunos" | "plano" | "logs"
export type CoachDetailTab = "resumo" | "alunos" | "treinos" | "dietas" | "logs"
export type AvatarStage = "baby" | "teen" | "adult" | "elite"
export type ResetScope = "weekly" | "monthly" | "individual" | "validationHistory" | "all"

// ─── Draft Types ──────────────────────────────────────────────────────────────

export type StudentDraft = {
  name: string; email: string; phone: string; password: string
  active: boolean; coachId: string; teamId: string; sex: string; age: string
}

export type CoachDraft = {
  name: string; email: string; password: string; teamId: string
}

export type TeamDraft = {
  name: string; plan: "start" | "pro" | "elite" | "custom"
  maxStudents: string; maxCoaches: string
  email: string; phone: string; addressLine: string; city: string; country: string
  status: "active" | "paused" | "archived"
}

export type CalibrationDraft = {
  userAge: string; biologicalSex: string; trainingLevel: string; trainingGoal: string
  preferredTrainingLocation: string; trainingPathology: string; country: string; city: string
  heightCm: string; weightKg: string; foodRestrictions: string
}

export type CustomExerciseDraft = {
  id: string; canonicalNamePt: string; muscleGroup: string; equipment: string
  sourceFileName: string; videoUrl: string; fileSizeBytes: string
  durationSeconds: string; width: string; height: string; fps: string; hasAudio: boolean
}

// ─── Data Types ───────────────────────────────────────────────────────────────

import type { AdminLog } from "@/lib/api/admin"

export interface StudentDetail {
  student: AdminStudent
  memory: GutoMemory | null
  workout: GutoWorkoutPlan | null
  diet: DietPlan | null
  logs: AdminLog[]
  workoutHistory: AdminLog[]
  dietHistory: AdminLog[]
}

export interface RankingItem {
  position: number
  userId: string
  pairName: string
  avatarStage: AvatarStage
  xp: number
  validatedWorkouts: number
  status?: string
  currentStreak?: number
}

export interface RankingsData {
  weekly: { items: RankingItem[] }
  monthly: { items: RankingItem[] }
  individual: { items: RankingItem[] }
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DETAIL_TABS: Array<{ id: DetailTab; label: string }> = [
  { id: "resumo", label: "Resumo" },
  { id: "calibragem", label: "Calibragem" },
  { id: "treino", label: "Treino" },
  { id: "dieta", label: "Dieta" },
  { id: "validacoes", label: "Validações" },
  { id: "historico", label: "Histórico" },
  { id: "acesso", label: "Acesso" },
]

export const WEEK_DAYS: { key: WeekDayKey; label: string; short: string }[] = [
  { key: "monday", label: "Segunda-feira", short: "Seg" },
  { key: "tuesday", label: "Terça-feira", short: "Ter" },
  { key: "wednesday", label: "Quarta-feira", short: "Qua" },
  { key: "thursday", label: "Quinta-feira", short: "Qui" },
  { key: "friday", label: "Sexta-feira", short: "Sex" },
  { key: "saturday", label: "Sábado", short: "Sáb" },
  { key: "sunday", label: "Domingo", short: "Dom" },
]

export const EXERCISE_VIDEO_LIMIT_COPY =
  "Vídeo obrigatório: MP4, até 30s, até 12MB, máximo 720p, sem áudio, caminho interno /exercise/visuals/custom/."

const EXERCISE_VIDEO_ERROR_COPY =
  "Esse vídeo está pesado demais para o app. Use MP4 até 30 segundos, máximo 12MB e 720p."

const SOURCE_LABEL: Record<string, string> = {
  guto_generated: "Gerado pelo GUTO",
  coach_manual: "Manual do Coach",
  mixed: "Editado pelo Coach",
}

// ─── Risk helpers ─────────────────────────────────────────────────────────────

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export type RiskLevel = "ok" | "atencao" | "critico" | "sem-sinal"

export function studentRisk(s: AdminStudent): RiskLevel {
  if (!s.active || s.archived) return "ok"
  const days = daysSince(s.lastValidationAt) ?? daysSince(s.lastActiveAt)
  if (days === null) return "sem-sinal"
  if (days >= 7) return "critico"
  if (days >= 3) return "atencao"
  return "ok"
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "-"
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days <= 0) return "hoje"
  if (days === 1) return "há 1 dia"
  return `há ${days} dias`
}

export function getStatusInfo(
  s: AdminStudent
): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (s.archived) return { text: "ARQUIVADO", variant: "destructive" }
  if (!s.active) return { text: "PAUSADO", variant: "secondary" }
  if (!s.visibleInArena) return { text: "OCULTO ARENA", variant: "outline" }
  return { text: "ATIVO", variant: "default" }
}

export function adminErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const code =
      error.details && typeof error.details === "object" && "code" in error.details
        ? String(error.details.code)
        : ""
    if (code === "GUTO_TEAM_PLAN_LIMIT_REACHED") return "Limite do plano GUTO Time atingido."
    if (error.status === 403) return "Você não tem acesso a este aluno."
    const suffix = error.status ? ` (${error.status})` : ""
    return `${error.message || "Backend recusou a ação"}${suffix}`
  }
  if (error instanceof Error) return error.message
  return "Backend recusou a ação."
}

export function sourceLabel(source?: string): string {
  return source ? SOURCE_LABEL[source] || source : "Sem origem"
}

export function formatDate(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "-"
}

export function coachLabel(student: AdminStudent, coaches: AdminCoach[]): string {
  if (student.coachName) return student.coachName
  const coach = coaches.find((item) => item.userId === student.coachId)
  return coach?.name || coach?.email || student.coachId || "-"
}

export function avatarStageLabel(stage: AvatarStage): string {
  return ({ baby: "Baby", teen: "Teen", adult: "Adult", elite: "Elite" } as Record<AvatarStage, string>)[stage] ?? stage
}

export function formatHuman(val: string | null | undefined): string {
  if (!val) return "-"
  const m: Record<string, string> = {
    active: "Ativo", paused: "Pausado", archived: "Arquivado",
    paid: "Pago", unpaid: "Pendente", pending_payment: "Pagamento pendente",
    trial: "Teste", expired: "Expirado", cancelled: "Cancelado",
    muscle_gain: "Ganho de massa", fat_loss: "Perda de gordura",
    conditioning: "Condicionamento", mobility_health: "Saúde e mobilidade",
    consistency: "Consistência", maintenance: "Manutenção",
    gym: "Academia", home: "Casa", park: "Parque", mixed: "Misto",
    start: "GUTO Time Start", pro: "GUTO Time Pro", elite: "GUTO Time Elite", custom: "Custom",
  }
  return m[val] ?? val.replace(/_/g, " ")
}

// ─── Catalog / Exercise ───────────────────────────────────────────────────────

export function normalizeCatalogSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR")
}

export function catalogSearchText(exercise: AdminCatalogExercise): string {
  return normalizeCatalogSearch(
    [
      exercise.id,
      exercise.canonicalNamePt,
      ...Object.values(exercise.namesByLanguage || {}),
      ...Object.values(exercise.aliasesByLanguage || {}).flat(),
      exercise.muscleGroup,
      exercise.equipment || "",
    ].join(" ")
  )
}

export function workoutExerciseFromCatalog(
  catalog: AdminCatalogExercise,
  current: GutoWorkoutExercise,
  index: number
): GutoWorkoutExercise {
  return {
    ...current,
    id: catalog.id,
    name: catalog.canonicalNamePt,
    canonicalNamePt: catalog.canonicalNamePt,
    muscleGroup: catalog.muscleGroup,
    order: current.order ?? index + 1,
    videoUrl: catalog.videoUrl,
    videoProvider: "local",
    sourceFileName: catalog.sourceFileName,
  }
}

export function hasInvalidWorkoutExerciseContract(workout: GutoWorkoutPlan): boolean {
  return (
    !workout.exercises.length ||
    workout.exercises.some(
      (e) =>
        !e.id ||
        e.id.startsWith("manual-") ||
        e.videoProvider !== "local" ||
        !e.videoUrl?.startsWith("/exercise/visuals/")
    )
  )
}

export function isSafeExerciseVideoFileName(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*\.mp4$/.test(value)
}

export function validateCustomExerciseDraft(draft: CustomExerciseDraft): string | null {
  const fileSizeBytes = Number(draft.fileSizeBytes)
  const durationSeconds = Number(draft.durationSeconds)
  const width = Number(draft.width)
  const height = Number(draft.height)
  const fps = Number(draft.fps)
  const sourceFileName = draft.sourceFileName.trim()
  const videoUrl = draft.videoUrl.trim()
  const longSide = Math.max(width, height)
  const shortSide = Math.min(width, height)
  if (!draft.canonicalNamePt.trim()) return "Informe o nome do exercício."
  if (!sourceFileName || !videoUrl) return "Vídeo obrigatório: informe sourceFileName e videoUrl."
  if (
    !videoUrl.startsWith("/exercise/visuals/custom/") ||
    videoUrl.includes("..") ||
    /\s/.test(videoUrl)
  )
    return "Use caminho interno /exercise/visuals/custom/."
  if (!isSafeExerciseVideoFileName(sourceFileName) || !videoUrl.endsWith(`/${sourceFileName}`))
    return "Use nome seguro: lowercase, sem acento, sem espaço e com hífen."
  if (
    !Number.isFinite(fileSizeBytes) ||
    !Number.isFinite(durationSeconds) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(fps)
  )
    return "Preencha todos os metadados técnicos do vídeo."
  if (fileSizeBytes <= 0 || durationSeconds <= 0 || width <= 0 || height <= 0 || fps <= 0)
    return "Metadados técnicos precisam ser positivos."
  if (
    fileSizeBytes > 12 * 1024 * 1024 ||
    durationSeconds > 30 ||
    longSide > 1280 ||
    shortSide > 720 ||
    fps > 30 ||
    draft.hasAudio
  )
    return EXERCISE_VIDEO_ERROR_COPY
  if (durationSeconds < 3) return "Use vídeo com pelo menos 3 segundos."
  return null
}

export function blankCustomExerciseDraft(): CustomExerciseDraft {
  return {
    id: "", canonicalNamePt: "", muscleGroup: "peito", equipment: "",
    sourceFileName: "", videoUrl: "/exercise/visuals/custom/",
    fileSizeBytes: "", durationSeconds: "", width: "", height: "", fps: "30", hasAudio: false,
  }
}

// ─── Blank / normalize workout ────────────────────────────────────────────────

export function blankExercise(index = 0): GutoWorkoutExercise {
  return {
    id: `manual-${Date.now()}-${index}`, name: "", canonicalNamePt: "",
    muscleGroup: "manual", sets: 3, reps: "10-12", load: "", rest: "60s",
    restSeconds: 60, cue: "", note: "", alternatives: [], order: index + 1,
    videoUrl: "", videoProvider: "local", sourceFileName: "",
  }
}

export function blankWorkout(student: AdminStudent): GutoWorkoutPlan {
  return {
    studentId: student.userId, title: "Treino manual", focus: "Treino manual",
    weekDay: "today", goal: student.plan || "", location: "gym", dateLabel: "Hoje",
    scheduledFor: new Date().toISOString(), summary: "", source: "coach_manual",
    lockedByCoach: true, manualOverride: true, estimatedDurationMinutes: 60,
    difficulty: "", coachNotes: "", exercises: [blankExercise()],
    blocks: [{ name: "Principal", exercises: [blankExercise()] }],
  }
}

export function normalizeWorkoutForEditor(plan: GutoWorkoutPlan | null, student: AdminStudent): GutoWorkoutPlan {
  if (!plan) return blankWorkout(student)
  const exercises = (plan.exercises?.length ? plan.exercises : []).map((e, i) => ({
    ...blankExercise(i), ...e,
    order: e.order ?? i + 1, load: e.load ?? "", alternatives: e.alternatives ?? [],
  }))
  return {
    ...blankWorkout(student), ...plan, studentId: student.userId,
    source: plan.source || (plan.manualOverride ? "coach_manual" : "guto_generated"),
    exercises: exercises.length ? exercises : [blankExercise()],
  }
}

// ─── Blank / normalize diet ───────────────────────────────────────────────────

export function blankDiet(student: AdminStudent): DietPlan {
  return {
    userId: student.userId, title: "Dieta manual", generatedAt: new Date().toISOString(),
    country: "", goal: "fat_loss", source: "coach_manual", lockedByCoach: true, manualOverride: true,
    macros: { bmr: 0, tdee: 0, targetKcal: 1900, proteinG: 150, carbsG: 170, fatG: 55, goal: "fat_loss" },
    meals: [{
      id: "breakfast", name: "Café da manhã", time: "07:30", totalKcal: 400,
      gutoNote: "", foods: [{ name: "Ovos", quantity: "2 unidades", kcal: 160, notes: "" }],
      alternatives: [],
    }],
    foodRestrictions: "", coachNotes: "",
  }
}

export function normalizeDietForEditor(plan: DietPlan | null, student: AdminStudent): DietPlan {
  if (!plan) return blankDiet(student)
  return {
    ...blankDiet(student), ...plan, userId: student.userId,
    source: plan.source || (plan.manualOverride ? "coach_manual" : "guto_generated"),
    macros: { ...blankDiet(student).macros, ...plan.macros },
    meals: plan.meals?.length ? plan.meals : blankDiet(student).meals,
  }
}

// ─── Diet week ────────────────────────────────────────────────────────────────

export function dietDaySummary(day?: AdminWeeklyDietDay): string {
  if (!day) return "Sem dieta programada"
  const meals = [
    day.breakfast && "café",
    day.lunch && "almoço",
    day.dinner && "jantar",
    day.snacks && "lanches",
  ].filter(Boolean)
  const parts: string[] = []
  if (meals.length) parts.push(meals.join(", "))
  if (day.caloriesEstimate) parts.push(`${day.caloriesEstimate} kcal`)
  if (day.notes) parts.push("obs.")
  return parts.length ? parts.join(" · ") : "Preenchido"
}

export function blankDietDay(): AdminWeeklyDietDay {
  return { breakfast: "", lunch: "", dinner: "", snacks: "", hydration: "", notes: "" }
}

// ─── Calibration ──────────────────────────────────────────────────────────────

export function calibrationFromMemory(memory: GutoMemory | null): CalibrationDraft {
  return {
    userAge: memory?.userAge ? String(memory.userAge) : "",
    biologicalSex: memory?.biologicalSex || "",
    trainingLevel: memory?.trainingLevel || "",
    trainingGoal: memory?.trainingGoal || "",
    preferredTrainingLocation: memory?.preferredTrainingLocation || "",
    trainingPathology: memory?.trainingPathology || "",
    country: memory?.country || "",
    city: memory?.city || "",
    heightCm: memory?.heightCm ? String(memory.heightCm) : "",
    weightKg: memory?.weightKg ? String(memory.weightKg) : "",
    foodRestrictions: memory?.foodRestrictions || "",
  }
}
