import type { EvolutionStage } from "@/types/contract"

export type PathDayStatus = "completed" | "adapted" | "current" | "missed" | "locked"

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
  reps: number | string
  rest: string
  cue: string
  note: string
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
  { stage: "TEEN", label: "TEEN", requiredXp: 1500, unlocked: false, silhouette: "blocked" },
  { stage: "ADULT", label: "ADULT", requiredXp: 3000, unlocked: false, silhouette: "blocked" },
  { stage: "ELIT", label: "ELIT", requiredXp: 5000, unlocked: false, silhouette: "blocked" },
]

export const missionExercisesFixture: MissionExercise[] = [
  {
    id: "bench-press",
    name: "Supino reto",
    sets: 4,
    reps: 8,
    rest: "1:30min",
    cue: "Barra desce controlada até a linha do peito. Pé firme, escápula travada.",
    note: "Não deixa o ombro assumir. Peito trabalha, ego fica fora.",
  },
  {
    id: "incline-dumbbell-press",
    name: "Supino inclinado com halteres",
    sets: 4,
    reps: 10,
    rest: "1:30min",
    cue: "Banco inclinado, halteres descem alinhados ao peito alto.",
    note: "Amplitude limpa. Se perder controle, reduz carga.",
  },
  {
    id: "cable-fly",
    name: "Crucifixo no cabo",
    sets: 3,
    reps: 12,
    rest: "1:15min",
    cue: "Braços semi-flexionados. Fecha o cabo sem bater as mãos.",
    note: "Sente o peitoral encurtar. Movimento bonito não vale se não contrair.",
  },
  {
    id: "machine-chest-press",
    name: "Chest press máquina",
    sets: 3,
    reps: 12,
    rest: "1:30min",
    cue: "Costas coladas, punho neutro, empurra sem tirar o ombro do lugar.",
    note: "Aqui é volume controlado. Sem roubar no fim.",
  },
  {
    id: "dips",
    name: "Paralela assistida",
    sets: 3,
    reps: 10,
    rest: "1:30min",
    cue: "Desce até sentir peitoral e tríceps, sobe sem travar agressivo.",
    note: "Se o ombro reclamar, reduz amplitude. Execução manda.",
  },
  {
    id: "rope-triceps",
    name: "Tríceps corda",
    sets: 4,
    reps: 12,
    rest: "1:00min",
    cue: "Cotovelos presos. Abre a corda no final e segura meio segundo.",
    note: "Não transforma em balanço. Tríceps fecha a missão.",
  },
  {
    id: "overhead-triceps",
    name: "Tríceps francês no cabo",
    sets: 3,
    reps: 12,
    rest: "1:15min",
    cue: "Cotovelo aponta para frente. Alongamento controlado atrás da cabeça.",
    note: "O alongamento importa. Não corta o movimento.",
  },
  {
    id: "close-grip-pushup",
    name: "Flexão fechada",
    sets: 3,
    reps: 15,
    rest: "1:00min",
    cue: "Mãos abaixo do peito, corpo rígido, cotovelos próximos.",
    note: "Finaliza sem teatro. Se falhar, pausa curta e completa.",
  },
]
