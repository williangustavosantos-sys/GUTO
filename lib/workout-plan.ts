import type { GutoMemory, GutoWorkoutExercise, GutoWorkoutPlan, WorkoutFocus } from "@/lib/api/guto"
import { getMissingCalibrationFields, hasCompleteGutoCalibration } from "@/lib/guto-profile"

const todayKey = () => new Date().toISOString().slice(0, 10)

const exerciseCatalog: Record<string, GutoWorkoutExercise> = {
  esteira: {
    id: "aquecimento-esteira",
    name: "Caminhada na esteira inclinada",
    canonicalNamePt: "Caminhada na esteira inclinada",
    muscleGroup: "aquecimento",
    sets: 1,
    reps: "6 min",
    rest: "30s",
    cue: "Ritmo firme. Aquece sem gastar a missão.",
    note: "Aumente a inclinação só se estiver sem dor.",
    videoUrl: "/exercise/visuals/aquecimento-aerobico/caminhada_esteira_inclinada.mp4",
    videoProvider: "local",
    sourceFileName: "caminhada_esteira_inclinada.mp4",
  },
  supino: {
    id: "peito-supino-reto",
    name: "Supino reto",
    canonicalNamePt: "Supino reto",
    muscleGroup: "peito",
    sets: 4,
    reps: "8-10",
    rest: "75s",
    cue: "Controle a descida. Empurra sem perder postura.",
    note: "Carga forte, execução limpa.",
    videoUrl: "/exercise/visuals/peito/supino_reto.mp4",
    videoProvider: "local",
    sourceFileName: "supino_reto.mp4",
  },
  remada: {
    id: "costas-remada-baixa",
    name: "Remada baixa na polia",
    canonicalNamePt: "Remada baixa na polia",
    muscleGroup: "costas",
    sets: 4,
    reps: "10-12",
    rest: "75s",
    cue: "Puxa com as costas, não com pressa.",
    note: "Pausa curta no fim do movimento.",
    videoUrl: "/exercise/visuals/costas/remada_baixa_polia.mp4",
    videoProvider: "local",
    sourceFileName: "remada_baixa_polia.mp4",
  },
  legpress: {
    id: "pernas-legpress-45",
    name: "Leg press 45",
    canonicalNamePt: "Leg press 45",
    muscleGroup: "pernas",
    sets: 4,
    reps: "10-12",
    rest: "90s",
    cue: "Amplitude segura. Joelho acompanha a ponta do pé.",
    note: "Se houver dor no joelho, reduza amplitude e carga.",
    videoUrl: "/exercise/visuals/pernas-gluteos-panturrilha/legpress_45.mp4",
    videoProvider: "local",
    sourceFileName: "legpress_45.mp4",
  },
  ombro: {
    id: "ombro-desenvolvimento",
    name: "Desenvolvimento sentado",
    canonicalNamePt: "Desenvolvimento sentado",
    muscleGroup: "ombro",
    sets: 3,
    reps: "8-10",
    rest: "75s",
    cue: "Tronco firme. Sobe sem compensar lombar.",
    note: "Pare antes de transformar técnica em ego.",
    videoUrl: "/exercise/visuals/ombro/desenvolvimento_sentado.mp4",
    videoProvider: "local",
    sourceFileName: "desenvolvimento_sentado.mp4",
  },
  prancha: {
    id: "abdomen-prancha",
    name: "Prancha isométrica",
    canonicalNamePt: "Prancha isométrica",
    muscleGroup: "abdomen",
    sets: 3,
    reps: "35-45s",
    rest: "45s",
    cue: "Quadril firme. Respira e segura.",
    note: "Missão termina com controle, não com desespero.",
    videoUrl: "/exercise/visuals/abdomen-core/prancha_isomentrica.mp4",
    videoProvider: "local",
    sourceFileName: "prancha_isomentrica.mp4",
  },
  flexao: {
    id: "peito-flexao",
    name: "Flexão",
    canonicalNamePt: "Flexão",
    muscleGroup: "peito",
    sets: 4,
    reps: "8-15",
    rest: "60s",
    cue: "Corpo em bloco. Desce com controle.",
    note: "Use apoio no joelho se precisar manter execução.",
    videoUrl: "/exercise/visuals/peito/flexao.mp4",
    videoProvider: "local",
    sourceFileName: "flexao.mp4",
  },
}

export function getWorkoutMissingFields(memory?: GutoMemory | null) {
  return getMissingCalibrationFields(memory)
}

export function createLocalWorkoutPlan(memory: GutoMemory, language: string): GutoWorkoutPlan | null {
  if (!hasCompleteGutoCalibration(memory)) return null

  const isGym = memory.preferredTrainingLocation === "gym"
  const focusKey: WorkoutFocus = memory.trainingGoal === "muscle_gain" && isGym ? "full_body" : "full_body"
  const pathology = `${memory.trainingPathology || ""} ${memory.trainingLimitations || ""}`.toLocaleLowerCase("pt-BR")
  const avoidLegLoad = /joelho|knee|rodilla|ginocchio|quadril|anca/.test(pathology)
  const base = isGym
    ? ["esteira", "supino", "remada", avoidLegLoad ? "prancha" : "legpress", "ombro", "prancha"]
    : ["esteira", "flexao", "remada", "ombro", "prancha"]
  const exercises = base.map((key) => exerciseCatalog[key])

  return {
    focus: language === "en-US" ? "Mission of the day" : language === "it-IT" ? "Missione del giorno" : language === "es-ES" ? "Misión del día" : "Missão do dia",
    focusKey,
    dateLabel: new Date().toLocaleDateString(language, { weekday: "long", day: "2-digit", month: "2-digit" }),
    scheduledFor: todayKey(),
    summary: "Plano local gerado a partir da calibragem salva.",
    exercises,
  }
}
