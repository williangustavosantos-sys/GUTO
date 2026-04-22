import type { EvolutionStage } from "@/types/contract"

export type PathDayStatus = "completed" | "current" | "missed" | "locked"

export interface PathDay {
  day: string
  label: string
  status: PathDayStatus
  commitment?: string
}

export interface EvolutionCard {
  stage: EvolutionStage
  label: string
  requiredXp: number
  unlocked: boolean
  silhouette: "soft" | "blocked"
}

export interface MissionExercise {
  id: string
  name: string
  sets: number
  reps: number
  rest: string
  cue: string
  xp?: number
}

export interface MissionAssistMessage {
  id: string
  role: "user" | "guto"
  text: string
}

export interface MissionAssistState {
  exerciseId: string | null
  draft: string
  isSending: boolean
  messages: MissionAssistMessage[]
}

export const pathDaysFixture: PathDay[] = [
  { day: "21", label: "SEG", status: "completed", commitment: "Executado sem atraso." },
  { day: "22", label: "TER", status: "completed", commitment: "Carga mantida." },
  { day: "23", label: "QUA", status: "current", commitment: "Treino de peito e tríceps." },
  { day: "24", label: "QUI", status: "missed", commitment: "Sem registro. Vazio visível." },
  { day: "25", label: "SEX", status: "locked" },
  { day: "26", label: "SAB", status: "locked" },
  { day: "27", label: "DOM", status: "locked" },
]

export const evolutionCardsFixture: EvolutionCard[] = [
  { stage: "BABY", label: "BABY", requiredXp: 0, unlocked: true, silhouette: "soft" },
  { stage: "TEEN", label: "TEEN", requiredXp: 3000, unlocked: false, silhouette: "blocked" },
  { stage: "ADULT", label: "ADULT", requiredXp: 10000, unlocked: false, silhouette: "blocked" },
  { stage: "ELIT", label: "ELIT", requiredXp: 25000, unlocked: false, silhouette: "blocked" },
]

export const missionExercisesFixture: MissionExercise[] = [
  {
    id: "incline-press",
    name: "Supino inclinado com halteres",
    sets: 4,
    reps: 10,
    rest: "1:30min",
    cue: "Controla a descida e trava a escápula.",
    xp: 90,
  },
  {
    id: "bench-press",
    name: "Supino reto",
    sets: 4,
    reps: 8,
    rest: "1:45min",
    cue: "Última repetição com peito, não com ego.",
    xp: 120,
  },
  {
    id: "rope-pushdown",
    name: "Tríceps corda",
    sets: 4,
    reps: 12,
    rest: "1:15min",
    cue: "Cotovelos presos. Fecha no final.",
    xp: 65,
  },
  {
    id: "close-grip",
    name: "Supino fechado",
    sets: 3,
    reps: 10,
    rest: "1:30min",
    cue: "Fecha com precisão. Sem colapsar o punho.",
    xp: 105,
  },
]

export const initialMissionAssistState: MissionAssistState = {
  exerciseId: null,
  draft: "",
  isSending: false,
  messages: [],
}
