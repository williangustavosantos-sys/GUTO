import type { AuthUser } from "@/lib/api/auth"
import type { GutoMemory } from "@/lib/api/guto"

export type StoredGutoProfile = {
  language?: string
  userName?: string
  onboardingComplete?: boolean
  calibrationComplete?: boolean
  pactAccepted?: boolean
}

export type ResolvedGutoProfile = {
  userId: string
  displayName: string
  hasName: boolean
  hasCalibration: boolean
  missingCalibrationFields: string[]
}

const GENERIC_NAMES = new Set(["", "operador", "operator", "usuário", "usuario", "user", "guto"])

export function formatGutoDisplayName(value?: string | null) {
  return (value || "").replace(/\s+/g, " ").trimStart().toLocaleUpperCase()
}

export function isGenericGutoName(value?: string | null) {
  const normalized = (value || "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR")
  if (GENERIC_NAMES.has(normalized)) return true
  return /^operador\s*#?\d*$/i.test(normalized) || /^operator\s*#?\d*$/i.test(normalized)
}

export function firstRealGutoName(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (!isGenericGutoName(value)) return formatGutoDisplayName(value)
  }
  return ""
}

export function getMissingCalibrationFields(memory?: GutoMemory | null) {
  const missing: string[] = []
  if (!memory?.userAge) missing.push("idade")
  if (!memory?.biologicalSex) missing.push("sexo")
  if (!memory?.trainingGoal) missing.push("objetivo")
  if (!(memory?.trainingLevel || memory?.trainingStatus)) missing.push("nível")
  if (!memory?.preferredTrainingLocation) missing.push("local")
  if (!memory?.heightCm) missing.push("altura")
  if (!memory?.weightKg) missing.push("peso")
  return missing
}

export function hasCompleteGutoCalibration(memory?: GutoMemory | null) {
  return getMissingCalibrationFields(memory).length === 0
}

export function resolveGutoProfile({
  user,
  stored,
  memory,
  inviteName,
  fallbackName,
}: {
  user?: (AuthUser & { name?: string; email?: string }) | null
  stored?: StoredGutoProfile | null
  memory?: GutoMemory | null
  inviteName?: string | null
  fallbackName?: string | null
}): ResolvedGutoProfile {
  const displayName = firstRealGutoName(
    inviteName,
    user?.name,
    stored?.userName,
    memory?.name,
    fallbackName
  )
  const missingCalibrationFields = getMissingCalibrationFields(memory)

  return {
    userId: user?.userId || memory?.userId || "guest",
    displayName,
    hasName: Boolean(displayName),
    hasCalibration: missingCalibrationFields.length === 0,
    missingCalibrationFields,
  }
}
