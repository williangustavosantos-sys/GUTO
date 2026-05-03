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
  calibration: {
    title: string;
    subtitle: string;
    ageLabel: string;
    sexLabel: string;
    sexOptions: { female: string; male: string; prefer_not_to_say: string };
    levelLabel: string;
    levelOptions: { beginner: string; returning: string; consistent: string; advanced: string };
    pathologyLabel: string;
    pathologyOptions: { none: string; knee: string; lower_back: string; shoulder: string; other: string };
    pathologyPlaceholder: string;
    confirm: string;
    goalLabel: string;
    goalOptions: { consistency: string; fat_loss: string; muscle_gain: string; conditioning: string; mobility_health: string };
    locationLabel: string;
    locationOptions: { gym: string; home: string; park: string; mixed: string };
    submit: string;
    errorRequired: string;
    statusLabel: string;
    statusChips: { paused: string; returning: string; active: string };
    pathologySection: string;
    objectiveSection: string;
    objectiveChips: { fat_loss: string; muscle_gain: string; conditioning: string; mobility_health: string; consistency: string };
  };
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
    pathTitle: "PERCURSO",
    pathSubtitle: "O percurso mostra execução, ausência e consequência.",
    pathMonth: "ABRIL 2024",
    pathDayLabel: "Quarta, Peito e tríceps",
    pathWorkoutDone: "Treino realizado:",
    pathWorkoutName: "Peito e tríceps",
    pathXpYesterday: "0 XP hoje",
    pathStreak: "+3 dias na sequência",
    pathObservation: "+1 observação do Guto",
    pathXpReward: "+100 XP",
    pathQuote: "Você já é mais forte do que ontem. O melhor ainda está por vir.",
    calibration: {
      title: "Calibragem do sistema",
      subtitle: "Antes de eu te puxar, preciso entender o teu corpo.",
      ageLabel: "Idade",
      sexLabel: "Sexo biológico",
      sexOptions: { female: "Feminino", male: "Masculino", prefer_not_to_say: "Prefiro não informar" },
      levelLabel: "Nível atual de treino",
      levelOptions: { beginner: "Começando", returning: "Voltando", consistent: "Mantendo ritmo", advanced: "Avançado" },
      pathologyLabel: "Dor, limitação ou patologia",
      pathologyOptions: { none: "Sem dor", knee: "Joelho", lower_back: "Lombar", shoulder: "Ombro", other: "Outro" },
      pathologyPlaceholder: "Detalhe sua limitação...",
      confirm: "Confirmar",
      goalLabel: "Objetivo principal",
      goalOptions: { consistency: "Consistência", fat_loss: "Perder gordura", muscle_gain: "Ganhar massa", conditioning: "Condicionamento", mobility_health: "Mobilidade e saúde" },
      locationLabel: "Local padrão de treino",
      locationOptions: { gym: "Academia", home: "Casa", park: "Parque", mixed: "Misturo" },
      submit: "Calibrar GUTO",
      errorRequired: "Falta calibrar isso antes de seguir.",
      statusLabel: "ESTADO ATUAL",
      statusChips: { paused: "Parado", returning: "Voltando", active: "Treinando" },
      pathologySection: "LIMITAÇÃO PATOLOGIA",
      objectiveSection: "OBJETIVO",
      objectiveChips: { fat_loss: "Emagrecer", muscle_gain: "Hipertrofia", conditioning: "Condicionamento", mobility_health: "Saúde", consistency: "Consistência" },
    }
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
    pathTitle: "PERCORSO",
    pathSubtitle: "Il percorso mostra esecuzione, assenza e conseguenza.",
    pathMonth: "APRILE 2024",
    pathDayLabel: "Mercoledì, Petto e tricipiti",
    pathWorkoutDone: "Allenamento completato:",
    pathWorkoutName: "Petto e tricipiti",
    pathXpYesterday: "0 XP oggi",
    pathStreak: "+3 giorni di fila",
    pathObservation: "+1 nota da Guto",
    pathXpReward: "+100 XP",
    pathQuote: "Sei già più forte di ieri. Il meglio deve ancora venire.",
    calibration: {
      title: "Calibrazione del sistema",
      subtitle: "Prima di spingerti, devo capire il tuo corpo.",
      ageLabel: "Età",
      sexLabel: "Sesso biologico",
      sexOptions: { female: "Femminile", male: "Maschile", prefer_not_to_say: "Preferisco non dirlo" },
      levelLabel: "Livello attuale di allenamento",
      levelOptions: { beginner: "Inizio", returning: "Rientro", consistent: "Tengo il ritmo", advanced: "Avanzato" },
      pathologyLabel: "Dolore, limite o patologia",
      pathologyOptions: { none: "Nessun dolore", knee: "Ginocchio", lower_back: "Lombare", shoulder: "Spalla", other: "Altro" },
      pathologyPlaceholder: "Dettagli sulla limitazione...",
      confirm: "Conferma",
      goalLabel: "Obiettivo principale",
      goalOptions: { consistency: "Costanza", fat_loss: "Perdere grasso", muscle_gain: "Aumentare massa", conditioning: "Condizionamento", mobility_health: "Mobilità e salute" },
      locationLabel: "Luogo predefinito di allenamento",
      locationOptions: { gym: "Palestra", home: "Casa", park: "Parco", mixed: "Misto" },
      submit: "Calibra GUTO",
      errorRequired: "Calibra questo prima di continuare.",
      statusLabel: "STATO ATTUALE",
      statusChips: { paused: "Fermo", returning: "Rientro", active: "In allenamento" },
      pathologySection: "DOLORE E LIMITI",
      objectiveSection: "OBIETTIVO",
      objectiveChips: { fat_loss: "Dimagrire", muscle_gain: "Ipertrofia", conditioning: "Condizionamento", mobility_health: "Salute", consistency: "Costanza" },
    }
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
    evoAuto1: "La evolución não es automática.",
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
    pathTitle: "RECORRIDO",
    pathSubtitle: "El camino muestra ejecución, ausencia y consecuencia.",
    pathMonth: "ABRIL 2024",
    pathDayLabel: "Miércoles, Pecho y tríceps",
    pathWorkoutDone: "Entrenamiento realizado:",
    pathWorkoutName: "Pecho y tríceps",
    pathXpYesterday: "0 XP hoy",
    pathStreak: "+3 días seguidos",
    pathObservation: "+1 nota de Guto",
    pathXpReward: "+100 XP",
    pathQuote: "Ya eres más fuerte que ayer. Lo mejor está por venir.",
    calibration: {
      title: "Calibración del sistema",
      subtitle: "Antes de empujarte, necesito entender tu cuerpo.",
      ageLabel: "Edad",
      sexLabel: "Sexo biológico",
      sexOptions: { female: "Femenino", male: "Masculino", prefer_not_to_say: "Prefiero no decirlo" },
      levelLabel: "Nivel actual de entrenamiento",
      levelOptions: { beginner: "Empezando", returning: "Volviendo", consistent: "Manteniendo ritmo", advanced: "Avanzado" },
      pathologyLabel: "Dolor, limitación o patología",
      pathologyOptions: { none: "Sin dolor", knee: "Rodilla", lower_back: "Lumbar", shoulder: "Hombro", other: "Otro" },
      pathologyPlaceholder: "Detalle su limitación...",
      confirm: "Confirmar",
      goalLabel: "Objetivo principal",
      goalOptions: { consistency: "Consistencia", fat_loss: "Perder grasa", muscle_gain: "Ganar masa", conditioning: "Condicionamiento", mobility_health: "Movilidad y salud" },
      locationLabel: "Lugar estándar de entrenamiento",
      locationOptions: { gym: "Gimnasio", home: "Casa", park: "Parque", mixed: "Mixto" },
      submit: "Calibrar GUTO",
      errorRequired: "Calibra esto antes de seguir.",
      statusLabel: "ESTADO ACTUAL",
      statusChips: { paused: "Parado", returning: "Volviendo", active: "Entrenando" },
      pathologySection: "DOLOR Y LIMITACIÓN",
      objectiveSection: "OBJETIVO",
      objectiveChips: { fat_loss: "Adelgazar", muscle_gain: "Hipertrofia", conditioning: "Acondicionamiento", mobility_health: "Salud", consistency: "Consistencia" },
    }
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
    pathTitle: "JOURNEY",
    pathSubtitle: "The path shows execution, absence, and consequence.",
    pathMonth: "APRIL 2024",
    pathDayLabel: "Wednesday, Chest and triceps",
    pathWorkoutDone: "Workout completed:",
    pathWorkoutName: "Chest and triceps",
    pathXpYesterday: "0 XP today",
    pathStreak: "+3 days in a row",
    pathObservation: "+1 note from Guto",
    pathXpReward: "+100 XP",
    pathQuote: "You are already stronger than yesterday. The best is yet to come.",
    calibration: {
      title: "System calibration",
      subtitle: "Before I push you, I need to read your body.",
      ageLabel: "Age",
      sexLabel: "Biological sex",
      sexOptions: { female: "Female", male: "Male", prefer_not_to_say: "Prefer not to say" },
      levelLabel: "Current training level",
      levelOptions: { beginner: "Starting", returning: "Returning", consistent: "Keeping rhythm", advanced: "Advanced" },
      pathologyLabel: "Pain, limitation or condition",
      pathologyOptions: { none: "No pain", knee: "Knee", lower_back: "Lower back", shoulder: "Shoulder", other: "Other" },
      pathologyPlaceholder: "Detail your limitation...",
      confirm: "Confirm",
      goalLabel: "Main goal",
      goalOptions: { consistency: "Consistency", fat_loss: "Fat loss", muscle_gain: "Muscle gain", conditioning: "Conditioning", mobility_health: "Mobility and health" },
      locationLabel: "Standard training location",
      locationOptions: { gym: "Gym", home: "Home", park: "Park", mixed: "Mixed" },
      submit: "Calibrate GUTO",
      errorRequired: "Calibrate this before moving on.",
      statusLabel: "CURRENT STATUS",
      statusChips: { paused: "Inactive", returning: "Returning", active: "Active" },
      pathologySection: "PAIN & LIMITATIONS",
      objectiveSection: "GOAL",
      objectiveChips: { fat_loss: "Lose Fat", muscle_gain: "Hypertrophy", conditioning: "Conditioning", mobility_health: "Health", consistency: "Consistency" },
    }
  }
};
