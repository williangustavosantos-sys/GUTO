export type GutoEvolutionStage = "baby" | "teen" | "adult" | "elite"

export const GUTO_EVOLUTION_THRESHOLDS: Array<{ stage: GutoEvolutionStage; minXp: number }> = [
  { stage: "baby", minXp: 0 },
  { stage: "teen", minXp: 1500 },
  { stage: "adult", minXp: 5000 },
  { stage: "elite", minXp: 12000 },
]

export function resolveGutoEvolutionStage(totalXp = 0): GutoEvolutionStage {
  const xp = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0
  let current: GutoEvolutionStage = "baby"

  for (const { stage, minXp } of GUTO_EVOLUTION_THRESHOLDS) {
    if (xp >= minXp) current = stage
  }

  return current
}

export function getNextGutoEvolutionXp(totalXp = 0): number | null {
  const xp = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0
  return GUTO_EVOLUTION_THRESHOLDS.find(({ minXp }) => minXp > xp)?.minXp ?? null
}
