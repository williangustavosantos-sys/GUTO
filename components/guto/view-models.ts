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
  canonicalNamePt: string
  muscleGroup: string
  sets: number
  reps: number | string
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
  { stage: "baby", label: "Baby", requiredXp: 0, unlocked: true, silhouette: "soft" },
  { stage: "teen", label: "Teen", requiredXp: 1500, unlocked: false, silhouette: "blocked" },
  { stage: "adult", label: "Adult", requiredXp: 5000, unlocked: false, silhouette: "blocked" },
  { stage: "elite", label: "Elite", requiredXp: 12000, unlocked: false, silhouette: "blocked" },
]

const FIXTURE_BASE = { canonicalNamePt: "", muscleGroup: "peito", videoUrl: "", videoProvider: "local" as const, sourceFileName: "" }

export const missionExercisesFixture: MissionExercise[] = [
  {
    ...FIXTURE_BASE,
    id: "supino_reto",
    canonicalNamePt: "Supino reto",
    name: "Supino reto",
    videoUrl: "/exercise/visuals/peito/supino_reto.mp4",
    sourceFileName: "supino_reto.mp4",
    sets: 4,
    reps: 8,
    rest: "1:30min",
    cue: "Barra desce controlada até a linha do peito. Pé firme, escápula travada.",
    note: "Não deixa o ombro assumir. Peito trabalha, ego fica fora.",
  },
  {
    ...FIXTURE_BASE,
    id: "supino_inclinado_halter",
    canonicalNamePt: "Supino inclinado com halteres",
    name: "Supino inclinado com halteres",
    videoUrl: "/exercise/visuals/peito/supino_inclinado_halter.mp4",
    sourceFileName: "supino_inclinado_halter.mp4",
    sets: 4,
    reps: 10,
    rest: "1:30min",
    cue: "Banco inclinado, halteres descem alinhados ao peito alto.",
    note: "Amplitude limpa. Se perder controle, reduz carga.",
  },
  {
    ...FIXTURE_BASE,
    id: "crucifixo_maquina",
    canonicalNamePt: "Crucifixo na máquina",
    name: "Crucifixo no cabo",
    videoUrl: "/exercise/visuals/peito/crucifixo_maquina.mp4",
    sourceFileName: "crucifixo_maquina.mp4",
    sets: 3,
    reps: 12,
    rest: "1:15min",
    cue: "Braços semi-flexionados. Fecha o cabo sem bater as mãos.",
    note: "Sente o peitoral encurtar. Movimento bonito não vale se não contrair.",
  },
  {
    ...FIXTURE_BASE,
    id: "supino_reto_maquina",
    canonicalNamePt: "Supino reto na máquina",
    name: "Chest press máquina",
    videoUrl: "/exercise/visuals/peito/supino_reto_maquina.mp4",
    sourceFileName: "supino_reto_maquina.mp4",
    sets: 3,
    reps: 12,
    rest: "1:30min",
    cue: "Costas coladas, punho neutro, empurra sem tirar o ombro do lugar.",
    note: "Aqui é volume controlado. Sem roubar no fim.",
  },
  {
    ...FIXTURE_BASE,
    id: "paralelas_gravitron",
    canonicalNamePt: "Paralelas no Gravitron",
    muscleGroup: "triceps",
    name: "Paralela assistida",
    videoUrl: "/exercise/visuals/triceps/paralelas_gravitron.mp4",
    sourceFileName: "paralelas_gravitron.mp4",
    sets: 3,
    reps: 10,
    rest: "1:30min",
    cue: "Desce até sentir peitoral e tríceps, sobe sem travar agressivo.",
    note: "Se o ombro reclamar, reduz amplitude. Execução manda.",
  },
  {
    ...FIXTURE_BASE,
    id: "triceps_barra_v_cabo",
    canonicalNamePt: "Tríceps barra V no cabo",
    muscleGroup: "triceps",
    name: "Tríceps corda",
    videoUrl: "/exercise/visuals/triceps/triceps_barra_v_cabo.mp4",
    sourceFileName: "triceps_barra_v_cabo.mp4",
    sets: 4,
    reps: 12,
    rest: "1:00min",
    cue: "Cotovelos presos. Abre a corda no final e segura meio segundo.",
    note: "Não transforma em balanço. Tríceps fecha a missão.",
  },
  {
    ...FIXTURE_BASE,
    id: "triceps_frances_cabo",
    canonicalNamePt: "Tríceps francês no cabo",
    muscleGroup: "triceps",
    name: "Tríceps francês no cabo",
    videoUrl: "/exercise/visuals/triceps/triceps_frances_cabo.mp4",
    sourceFileName: "triceps_frances_cabo.mp4",
    sets: 3,
    reps: 12,
    rest: "1:15min",
    cue: "Cotovelo aponta para frente. Alongamento controlado atrás da cabeça.",
    note: "O alongamento importa. Não corta o movimento.",
  },
  {
    ...FIXTURE_BASE,
    id: "flexao",
    canonicalNamePt: "Flexão de braço",
    muscleGroup: "peito",
    name: "Flexão fechada",
    videoUrl: "/exercise/visuals/peito/flexao.mp4",
    sourceFileName: "flexao.mp4",
    sets: 3,
    reps: 15,
    rest: "1:00min",
    cue: "Mãos abaixo do peito, corpo rígido, cotovelos próximos.",
    note: "Finaliza sem teatro. Se falhar, pausa curta e completa.",
  },
]
