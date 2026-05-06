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
    countryLabel: string;
    countryPlaceholder: string;
    heightLabel: string;
    weightLabel: string;
    restrictionsLabel: string;
    restrictionsPlaceholder: string;
    physicalDataSection: string;
  };
  diet: {
    tab: string;
    title: string;
    subtitle: string;
    generateButton: string;
    regenerateButton: string;
    generatingLabel: string;
    dailyGoalTitle: string;
    kcalLabel: string;
    proteinLabel: string;
    carbsLabel: string;
    fatLabel: string;
    objectiveLabel: string;
    mealDoubtButton: string;
    emptyTitle: string;
    emptyBody: string;
    lastUpdated: string;
    goalNames: {
      fat_loss: string;
      muscle_gain: string;
      conditioning: string;
      mobility_health: string;
      consistency: string;
    };
  };
  arena: {
    tab: string;
    subtitle: string;
    week: string;
    month: string;
    individual: string;
    weeklyHeadline: string;
    monthlyHeadline: string;
    individualHeadline: string;
    workoutsValidated: string;
    xp: string;
    restartsMonday: string;
    restartsNextMonth: string;
    nextEvolution: string;
    xpMissing: string;
    emptyState: string;
    xpEarned: string;
    leveledUp: string;
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
      elite: "Elite"
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
      title: "Calibragem inicial",
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
      countryLabel: "ONDE MORA",
      countryPlaceholder: "Ex: Brasil, Itália, EUA...",
      heightLabel: "ALTURA (cm)",
      weightLabel: "PESO (kg)",
      restrictionsLabel: "RESTRIÇÕES ALIMENTARES",
      restrictionsPlaceholder: "Ex: sem glúten, vegetariano, lactose...",
      physicalDataSection: "DADOS FÍSICOS",
    },
    diet: {
      tab: "DIETA",
      title: "DIETA DA SEMANA",
      subtitle: "Plano base. Adapta pelo chat.",
      generateButton: "GERAR MINHA DIETA",
      regenerateButton: "REGENERAR DIETA",
      generatingLabel: "GUTO calculando...",
      dailyGoalTitle: "META DIÁRIA",
      kcalLabel: "kcal",
      proteinLabel: "Proteína",
      carbsLabel: "Carbo",
      fatLabel: "Gordura",
      objectiveLabel: "Objetivo",
      mealDoubtButton: "DÚVIDA SOBRE ESTA REFEIÇÃO",
      emptyTitle: "Dieta ainda não gerada",
      emptyBody: "Complete seu perfil com altura, peso e país para o GUTO montar seu plano.",
      lastUpdated: "Atualizado em",
      goalNames: {
        fat_loss: "Emagrecer",
        muscle_gain: "Hipertrofia",
        conditioning: "Condicionamento",
        mobility_health: "Saúde",
        consistency: "Consistência",
      },
    },
    arena: {
      tab: "ARENA",
      subtitle: "Aqui o GUTO não evolui escondido.",
      week: "SEMANA",
      month: "MÊS",
      individual: "INDIVIDUAL",
      weeklyHeadline: "Todo mundo tem chance de virar o jogo.",
      monthlyHeadline: "Consistência vence empolgação.",
      individualHeadline: "Essa é a evolução real do seu GUTO.",
      workoutsValidated: "treinos validados",
      xp: "XP",
      restartsMonday: "Reinicia segunda-feira",
      restartsNextMonth: "Reinicia no próximo mês",
      nextEvolution: "Próxima evolução",
      xpMissing: "XP restantes",
      emptyState: "Nenhum treino validado ainda neste período.",
      xpEarned: "+100 XP na Arena",
      leveledUp: "Seu GUTO evoluiu!",
    },
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
      elite: "Elite"
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
      title: "Calibrazione iniziale",
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
      countryLabel: "DOVE ABITI",
      countryPlaceholder: "Es: Italia, Brasile, USA...",
      heightLabel: "ALTEZZA (cm)",
      weightLabel: "PESO (kg)",
      restrictionsLabel: "RESTRIZIONI ALIMENTARI",
      restrictionsPlaceholder: "Es: senza glutine, vegetariano, lattosio...",
      physicalDataSection: "DATI FISICI",
    },
    diet: {
      tab: "DIETA",
      title: "DIETA DELLA SETTIMANA",
      subtitle: "Piano base. Adatta via chat.",
      generateButton: "CREA LA MIA DIETA",
      regenerateButton: "RIGENERA DIETA",
      generatingLabel: "GUTO sta calcolando...",
      dailyGoalTitle: "OBIETTIVO GIORNALIERO",
      kcalLabel: "kcal",
      proteinLabel: "Proteine",
      carbsLabel: "Carboidrati",
      fatLabel: "Grassi",
      objectiveLabel: "Obiettivo",
      mealDoubtButton: "DUBBIO SU QUESTO PASTO",
      emptyTitle: "Dieta non ancora creata",
      emptyBody: "Completa il profilo con altezza, peso e paese per far creare la dieta a GUTO.",
      lastUpdated: "Aggiornato il",
      goalNames: {
        fat_loss: "Dimagrire",
        muscle_gain: "Ipertrofia",
        conditioning: "Condizionamento",
        mobility_health: "Salute",
        consistency: "Costanza",
      },
    },
    arena: {
      tab: "ARENA",
      subtitle: "Il tuo GUTO non evolve di nascosto.",
      week: "SETTIMANA",
      month: "MESE",
      individual: "INDIVIDUALE",
      weeklyHeadline: "Ogni settimana puoi ribaltare il gioco.",
      monthlyHeadline: "La costanza batte la motivazione.",
      individualHeadline: "Questa è la vera evoluzione del tuo GUTO.",
      workoutsValidated: "allenamenti convalidati",
      xp: "XP",
      restartsMonday: "Riparte lunedì",
      restartsNextMonth: "Riparte il prossimo mese",
      nextEvolution: "Prossima evoluzione",
      xpMissing: "XP rimanenti",
      emptyState: "Nessun allenamento convalidato in questo periodo.",
      xpEarned: "+100 XP nell'Arena",
      leveledUp: "Il tuo GUTO si è evoluto!",
    },
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
      elite: "Élite"
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
      title: "Calibración inicial",
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
      countryLabel: "DÓNDE VIVES",
      countryPlaceholder: "Ej: España, Brasil, México...",
      heightLabel: "ALTURA (cm)",
      weightLabel: "PESO (kg)",
      restrictionsLabel: "RESTRICCIONES ALIMENTARIAS",
      restrictionsPlaceholder: "Ej: sin gluten, vegetariano, lactosa...",
      physicalDataSection: "DATOS FÍSICOS",
    },
    diet: {
      tab: "DIETA",
      title: "DIETA DE LA SEMANA",
      subtitle: "Plan base. Adapta por el chat.",
      generateButton: "GENERAR MI DIETA",
      regenerateButton: "REGENERAR DIETA",
      generatingLabel: "GUTO calculando...",
      dailyGoalTitle: "META DIARIA",
      kcalLabel: "kcal",
      proteinLabel: "Proteína",
      carbsLabel: "Carbos",
      fatLabel: "Grasa",
      objectiveLabel: "Objetivo",
      mealDoubtButton: "DUDA SOBRE ESTA COMIDA",
      emptyTitle: "Dieta aún no generada",
      emptyBody: "Completa tu perfil con altura, peso y país para que GUTO cree tu plan.",
      lastUpdated: "Actualizado el",
      goalNames: {
        fat_loss: "Adelgazar",
        muscle_gain: "Hipertrofia",
        conditioning: "Acondicionamiento",
        mobility_health: "Salud",
        consistency: "Consistencia",
      },
    },
    arena: {
      tab: "ARENA",
      subtitle: "Tu GUTO no evoluciona en silencio.",
      week: "SEMANA",
      month: "MES",
      individual: "INDIVIDUAL",
      weeklyHeadline: "Cada semana puedes cambiar el juego.",
      monthlyHeadline: "La constancia vence a la motivación.",
      individualHeadline: "Esta es la evolución real de tu GUTO.",
      workoutsValidated: "entrenamientos validados",
      xp: "XP",
      restartsMonday: "Reinicia el lunes",
      restartsNextMonth: "Reinicia el próximo mes",
      nextEvolution: "Próxima evolución",
      xpMissing: "XP restantes",
      emptyState: "Ningún entrenamiento validado aún en este período.",
      xpEarned: "+100 XP en la Arena",
      leveledUp: "¡Tu GUTO ha evolucionado!",
    },
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
      elite: "Elite"
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
      title: "Initial calibration",
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
      countryLabel: "WHERE YOU LIVE",
      countryPlaceholder: "E.g.: USA, Brazil, Italy...",
      heightLabel: "HEIGHT (cm)",
      weightLabel: "WEIGHT (kg)",
      restrictionsLabel: "FOOD RESTRICTIONS",
      restrictionsPlaceholder: "E.g.: gluten-free, vegetarian, dairy-free...",
      physicalDataSection: "PHYSICAL DATA",
    },
    diet: {
      tab: "DIET",
      title: "WEEKLY DIET",
      subtitle: "Base plan. Adapt through chat.",
      generateButton: "GENERATE MY DIET",
      regenerateButton: "REGENERATE DIET",
      generatingLabel: "GUTO calculating...",
      dailyGoalTitle: "DAILY GOAL",
      kcalLabel: "kcal",
      proteinLabel: "Protein",
      carbsLabel: "Carbs",
      fatLabel: "Fat",
      objectiveLabel: "Goal",
      mealDoubtButton: "QUESTION ABOUT THIS MEAL",
      emptyTitle: "Diet not generated yet",
      emptyBody: "Complete your profile with height, weight and country so GUTO can build your plan.",
      lastUpdated: "Last updated",
      goalNames: {
        fat_loss: "Fat Loss",
        muscle_gain: "Hypertrophy",
        conditioning: "Conditioning",
        mobility_health: "Health",
        consistency: "Consistency",
      },
    },
    arena: {
      tab: "ARENA",
      subtitle: "Your GUTO does not evolve in silence.",
      week: "WEEK",
      month: "MONTH",
      individual: "INDIVIDUAL",
      weeklyHeadline: "Everyone gets a fresh chance.",
      monthlyHeadline: "Consistency beats motivation.",
      individualHeadline: "This is your GUTO's real evolution.",
      workoutsValidated: "validated workouts",
      xp: "XP",
      restartsMonday: "Restarts Monday",
      restartsNextMonth: "Restarts next month",
      nextEvolution: "Next evolution",
      xpMissing: "XP remaining",
      emptyState: "No validated workouts yet this period.",
      xpEarned: "+100 XP in Arena",
      leveledUp: "Your GUTO evolved!",
    },
  }
};
