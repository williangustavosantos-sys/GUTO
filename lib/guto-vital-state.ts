import type { GutoMemory } from "@/lib/api/guto"
import type { GutoAvatarEmotion } from "@/components/guto/guto-official-avatar"

export type GutoVitalState = "healthy" | "alert" | "critical" | "dying"

export interface GutoVitalStateResult {
  state: GutoVitalState
  daysAbsent: number
  emotion: GutoAvatarEmotion
  opacity: number
  isCritical: boolean
}

const DAY = 86_400_000
const HEALTHY_DAYS = 2
const ALERT_DAYS = 5
const CRITICAL_DAYS = 10
const NEW_USER_GRACE_DAYS = 7

const HEALTHY: GutoVitalStateResult = {
  state: "healthy",
  daysAbsent: 0,
  emotion: "default",
  opacity: 1,
  isCritical: false,
}

export function getGutoVitalState(memory: Partial<GutoMemory> | null | undefined): GutoVitalStateResult {
  if (!memory) return HEALTHY

  const now = Date.now()
  const lastWorkout = memory.lastWorkoutCompletedAt ? new Date(memory.lastWorkoutCompletedAt).getTime() : null
  const lastActive = memory.lastActiveAt ? new Date(memory.lastActiveAt).getTime() : null

  if (!lastWorkout) {
    if (lastActive && now - lastActive < NEW_USER_GRACE_DAYS * DAY) return HEALTHY
    const daysAbsent = lastActive ? Math.floor((now - lastActive) / DAY) : 0
    if (daysAbsent >= CRITICAL_DAYS + 1) return { state: "dying", daysAbsent, emotion: "critical", opacity: 0.5, isCritical: true }
    if (daysAbsent >= ALERT_DAYS + 1) return { state: "critical", daysAbsent, emotion: "critical", opacity: 0.75, isCritical: true }
    return { state: "alert", daysAbsent, emotion: "alert", opacity: 0.9, isCritical: false }
  }

  const daysAbsent = Math.floor((now - lastWorkout) / DAY)

  if (memory.trainedToday || daysAbsent <= HEALTHY_DAYS) {
    return { ...HEALTHY, daysAbsent }
  }
  if (daysAbsent <= ALERT_DAYS) {
    return { state: "alert", daysAbsent, emotion: "alert", opacity: 0.9, isCritical: false }
  }
  if (daysAbsent <= CRITICAL_DAYS) {
    return { state: "critical", daysAbsent, emotion: "critical", opacity: 0.75, isCritical: true }
  }
  return { state: "dying", daysAbsent, emotion: "critical", opacity: 0.5, isCritical: true }
}
