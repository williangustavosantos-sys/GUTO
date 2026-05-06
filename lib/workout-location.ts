import type { GutoMemory, GutoWorkoutPlan, WorkoutLocationMode } from "@/lib/api/guto"

export function normalizeWorkoutLocationMode(value: unknown): WorkoutLocationMode | null {
  if (typeof value !== "string") return null
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()

  if (!normalized || normalized === "mixed") return null
  const hasAny = (terms: string[]) => terms.some((term) => normalized === term || normalized.includes(term))

  if (hasAny(["gym", "academia", "palestra", "gimnasio", "fitness", "box"])) return "gym"
  if (hasAny(["home", "casa", "a casa", "en casa", "at home"])) return "home"
  if (hasAny(["park", "parque", "parco", "outdoor", "rua", "calle", "street", "pista", "quadra"])) return "park"

  return null
}

export function resolveWorkoutValidationLocationMode({
  workoutPlan,
  memory,
  selectedLocation,
}: {
  workoutPlan?: Pick<GutoWorkoutPlan, "locationMode" | "location"> | null
  memory?: Pick<GutoMemory, "preferredTrainingLocation" | "trainingLocation"> | null
  selectedLocation?: string | null
}): WorkoutLocationMode | null {
  return (
    normalizeWorkoutLocationMode(workoutPlan?.locationMode) ||
    normalizeWorkoutLocationMode(workoutPlan?.location) ||
    normalizeWorkoutLocationMode(memory?.preferredTrainingLocation) ||
    normalizeWorkoutLocationMode(selectedLocation) ||
    normalizeWorkoutLocationMode(memory?.trainingLocation)
  )
}
