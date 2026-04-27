export type ValidLanguage = "pt-BR" | "it-IT" | "es-ES" | "en-US";

export function getLanguage(lang: string): ValidLanguage {
  const valid: ValidLanguage[] = ["pt-BR", "it-IT", "es-ES", "en-US"];
  return valid.includes(lang as ValidLanguage) ? (lang as ValidLanguage) : "pt-BR";
}

export interface TranslationDictionary {
  complete: string;
  initialMessage: string;
  placeholder: string;
  evoTitle: string;
  evoSubtitle: string;
  unlocked: string;
  locked: string;
  level: string;
  totalXp: string;
  nextEvolution: string;
  evoAuto1: string;
  evoAuto2: string;
  evoQuote: string;
  evoStages: {
    baby: string;
    teen: string;
    adult: string;
    elite: string;
  };
  missionTitle: string;
  objectivesTitle: string;
  restLabel: string;
  setsLabel: string;
  repsLabel: string;
  workoutDate: string;
  workoutFocus: string;
  exercises: { name: string; rest: string }[];
  workoutObjectives: string[];
  pathTitle: string;
  pathSubtitle: string;
  pathMonth: string;
  pathDayLabel: string;
  pathWorkoutDone: string;
  pathWorkoutName: string;
  pathXpYesterday: string;
  pathStreak: string;
  pathObservation: string;
  pathXpReward: string;
  pathQuote: string;
}

export const translations: Record<ValidLanguage, TranslationDictionary> = {
  "pt-BR": {
    // Name Screen
    complete: "Completo.",
    
    // Chat Tab
    initialMessage: "Estamos prontos. Sem distrações.",
    placeholder: "Falar com Guto..",
    
    // Evolutions Tab
    evoTitle: "EVOLUÇÕES DO GUTO",
    evoSubtitle: "Cada evolução reflete o seu esforço.",
    unlocked: "DESBLOQUEADO",
    locked: "BLOQUEADO",
    level: "NÍVEL",
    totalXp: "XP TOTAL",
    nextEvolution: "PRÓXIMA EVOLUÇÃO",
    evoAuto1: "A evolução não é automática.",
    evoAuto2: "É construída todos os dias.",
    evoQuote: "Você já é mais forte do que ontem. E o melhor ainda está por vir.",
    evoStages: {
      baby: "BABY",
      teen: "TEEN",
      adult: "ADULTO",
      elite: "ELITE"
    },
    
    // Mission Tab
    missionTitle: "MISSÃO",
    objectivesTitle: "Objetivos",
    restLabel: "Descanso",
    setsLabel: "Séries",
    repsLabel: "Reps",
    workoutDate: "24 de Abril, Quarta-feira",
    workoutFocus: "Peito e tríceps",
    exercises: [
      { name: "Supino reto", rest: "1:30min" },
      { name: "Supino inclinado com halteres", rest: "1:30min" },
      { name: "Crucifixo no cabo", rest: "1:15min" },
      { name: "Chest press máquina", rest: "1:30min" },
      { name: "Paralela assistida", rest: "1:30min" },
      { name: "Tríceps corda", rest: "1:00min" },
      { name: "Tríceps francês no cabo", rest: "1:15min" },
      { name: "Flexão fechada", rest: "1:00min" },
    ],
    workoutObjectives: [
      "Execução controlada. Nada de pressa.",
      "Tempo certo = músculo certo."
    ],

    // Path Tab
    pathTitle: "CAMINHO DO GUTO",
    pathSubtitle: "O percurso mostra execução, ausência e consequência.",
    pathMonth: "ABRIL 2024",
    pathDayLabel: "Quarta, Peito e tríceps",
    pathWorkoutDone: "Treino realizado:",
    pathWorkoutName: "Peito e tríceps",
    pathXpYesterday: "0 XP hoje",
    pathStreak: "+3 dias na sequência",
    pathObservation: "+1 observação do Guto",
    pathXpReward: "+100 XP",
    pathQuote: "Você já é mais forte do que ontem. O melhor ainda está por vir."
  },
  "it-IT": {
    complete: "Completato.",
    initialMessage: "Siamo pronti. Niente distrazioni.",
    placeholder: "Parla con Guto..",
    evoTitle: "EVOLUZIONI DI GUTO",
    evoSubtitle: "Ogni evoluzione riflette il tuo impegno.",
    unlocked: "SBLOCCATO",
    locked: "BLOCCATO",
    level: "LIVELLO",
    totalXp: "XP TOTALE",
    nextEvolution: "PROSSIMA EVOLUZIONE",
    evoAuto1: "L'evoluzione non è automatica.",
    evoAuto2: "Si costruisce ogni giorno.",
    evoQuote: "Sei già più forte di ieri. Il meglio deve ancora venire.",
    evoStages: {
      baby: "BABY",
      teen: "TEEN",
      adult: "ADULTO",
      elite: "ELITE"
    },
    missionTitle: "MISSIONE",
    objectivesTitle: "Obiettivi",
    restLabel: "recupero",
    setsLabel: "serie",
    repsLabel: "ripetizioni",
    workoutDate: "24 Aprile, Mercoledì",
    workoutFocus: "Petto e tricipiti",
    exercises: [
      { name: "Panca piana", rest: "1:30min" },
      { name: "Panca inclinata con manubri", rest: "1:30min" },
      { name: "Croci ai cavi", rest: "1:15min" },
      { name: "Chest press macchina", rest: "1:30min" },
      { name: "Dip assistite", rest: "1:30min" },
      { name: "Pushdown con corda", rest: "1:00min" },
      { name: "French press al cavo", rest: "1:15min" },
      { name: "Push-up presa stretta", rest: "1:00min" },
    ],
    workoutObjectives: [
      "Esecuzione controllata. Nessuna fretta.",
      "Tempo giusto = muscolo giusto."
    ],
    pathTitle: "PERCORSO DI GUTO",
    pathSubtitle: "Il percorso mostra esecuzione, assenza e conseguenza.",
    pathMonth: "APRILE 2024",
    pathDayLabel: "Mercoledì, Petto e tricipiti",
    pathWorkoutDone: "Allenamento completato:",
    pathWorkoutName: "Petto e tricipiti",
    pathXpYesterday: "0 XP oggi",
    pathStreak: "+3 giorni di fila",
    pathObservation: "+1 nota da Guto",
    pathXpReward: "+100 XP",
    pathQuote: "Sei già più forte di ieri. Il meglio deve ancora venire."
  },
  "es-ES": {
    complete: "Completado.",
    initialMessage: "Estamos listos. Sin distracciones.",
    placeholder: "Hablar con Guto..",
    evoTitle: "EVOLUCIONES DE GUTO",
    evoSubtitle: "Cada evolución refleja tu esfuerzo.",
    unlocked: "DESBLOQUEADO",
    locked: "BLOQUEADO",
    level: "NIVEL",
    totalXp: "XP TOTAL",
    nextEvolution: "PRÓXIMA EVOLUCIÓN",
    evoAuto1: "La evolución no es automática.",
    evoAuto2: "Se construye todos los días.",
    evoQuote: "Ya eres más fuerte que ayer. Lo mejor está por venir.",
    evoStages: {
      baby: "BABY",
      teen: "TEEN",
      adult: "ADULTO",
      elite: "ÉLITE"
    },
    missionTitle: "MISIÓN",
    objectivesTitle: "Objetivos",
    restLabel: "Descanso",
    setsLabel: "Series",
    repsLabel: "Reps",
    workoutDate: "24 de Abril, Miércoles",
    workoutFocus: "Pecho y tríceps",
    exercises: [
      { name: "Press de banca", rest: "1:30min" },
      { name: "Press inclinado con mancuernas", rest: "1:30min" },
      { name: "Aperturas en cable", rest: "1:15min" },
      { name: "Chest press máquina", rest: "1:30min" },
      { name: "Fondos asistidos", rest: "1:30min" },
      { name: "Tríceps con cuerda", rest: "1:00min" },
      { name: "Tríceps francés en cable", rest: "1:15min" },
      { name: "Flexión cerrada", rest: "1:00min" },
    ],
    workoutObjectives: [
      "Ejecución controlada. Sin prisa.",
      "Tiempo correcto = músculo correcto."
    ],
    pathTitle: "CAMINO DE GUTO",
    pathSubtitle: "El camino muestra ejecución, ausencia y consecuencia.",
    pathMonth: "ABRIL 2024",
    pathDayLabel: "Miércoles, Pecho y tríceps",
    pathWorkoutDone: "Entrenamiento realizado:",
    pathWorkoutName: "Pecho y tríceps",
    pathXpYesterday: "0 XP hoy",
    pathStreak: "+3 días seguidos",
    pathObservation: "+1 nota de Guto",
    pathXpReward: "+100 XP",
    pathQuote: "Ya eres más fuerte que ayer. Lo mejor está por venir."
  },
  "en-US": {
    complete: "Completed.",
    initialMessage: "We are ready. No distractions.",
    placeholder: "Talk to Guto..",
    evoTitle: "GUTO EVOLUTIONS",
    evoSubtitle: "Every evolution reflects your effort.",
    unlocked: "UNLOCKED",
    locked: "LOCKED",
    level: "LEVEL",
    totalXp: "TOTAL XP",
    nextEvolution: "NEXT EVOLUTION",
    evoAuto1: "Evolution is not automatic.",
    evoAuto2: "It is built every day.",
    evoQuote: "You are already stronger than yesterday. The best is yet to come.",
    evoStages: {
      baby: "BABY",
      teen: "TEEN",
      adult: "ADULT",
      elite: "ELITE"
    },
    missionTitle: "MISSION",
    objectivesTitle: "Objectives",
    restLabel: "Rest",
    setsLabel: "Sets",
    repsLabel: "Reps",
    workoutDate: "April 24, Wednesday",
    workoutFocus: "Chest and triceps",
    exercises: [
      { name: "Bench Press", rest: "1:30min" },
      { name: "Incline Dumbbell Press", rest: "1:30min" },
      { name: "Cable Fly", rest: "1:15min" },
      { name: "Machine Chest Press", rest: "1:30min" },
      { name: "Assisted Dips", rest: "1:30min" },
      { name: "Triceps Rope Pushdown", rest: "1:00min" },
      { name: "Overhead Cable Triceps", rest: "1:15min" },
      { name: "Close-Grip Push-Up", rest: "1:00min" },
    ],
    workoutObjectives: [
      "Controlled execution. No rushing.",
      "Right timing = right muscle."
    ],
    pathTitle: "GUTO’S PATH",
    pathSubtitle: "The path shows execution, absence, and consequence.",
    pathMonth: "APRIL 2024",
    pathDayLabel: "Wednesday, Chest and triceps",
    pathWorkoutDone: "Workout completed:",
    pathWorkoutName: "Chest and triceps",
    pathXpYesterday: "0 XP today",
    pathStreak: "+3 days in a row",
    pathObservation: "+1 note from Guto",
    pathXpReward: "+100 XP",
    pathQuote: "You are already stronger than yesterday. The best is yet to come."
  }
};
