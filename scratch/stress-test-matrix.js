const BACKEND_URL = 'http://localhost:3001';

const testMatrix = [
  {
    name: "Luca",
    lang: "it-IT",
    age: 40,
    goal: "muscle_gain",
    location: "gym",
    queries: {
      bora: "andiamo",
      yesterday: "ho fatto questo allenamento ieri",
      dayBefore: "ho fatto questo allenamento l'altro ieri"
    }
  },
  {
    name: "Maria",
    lang: "es-ES",
    age: 25,
    goal: "weight_loss",
    location: "casa",
    queries: {
      bora: "vamos",
      yesterday: "hice este entrenamiento ayer",
      dayBefore: "hice este entrenamiento anteayer"
    }
  },
  {
    name: "Bob",
    lang: "en-US",
    age: 68,
    goal: "mobility",
    location: "park",
    queries: {
      bora: "let's go",
      yesterday: "I did this workout yesterday",
      dayBefore: "I did this workout the day before yesterday"
    }
  }
];

async function runTest(profile) {
  console.log(`\n\x1b[35m=== TESTANDO PERFIL: ${profile.name} (${profile.lang} / ${profile.age} anos / ${profile.location} / ${profile.goal}) ===\x1b[0m`);
  
  const userId = `test-${profile.name}-${Date.now()}`;

  // 1. Calibragem
  await fetch(`${BACKEND_URL}/guto/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      name: profile.name,
      language: profile.lang,
      userAge: profile.age,
      trainingGoal: profile.goal,
      preferredTrainingLocation: profile.location,
      trainingLocation: profile.location
    })
  });

  // 2. Proativo (Início)
  const proactiveRes = await fetch(`${BACKEND_URL}/guto/proactive?userId=${userId}&language=${profile.lang}&force=1`);
  const proactiveData = await proactiveRes.json();
  console.log(`DEBUG PROACTIVE: ${JSON.stringify(proactiveData)}`);
  const initialFocus = proactiveData.workoutPlan?.focusKey;
  
  console.log(`\nINPUT: force proactive`);
  console.log(`FOCUS INICIAL: ${initialFocus}`);
  
  // 3. "Treinei isso ontem"
  console.log(`\nINPUT: ${profile.queries.yesterday}`);
  const yesterdayRes = await fetch(`${BACKEND_URL}/guto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      input: profile.queries.yesterday,
      language: profile.lang
    })
  });
  const yesterdayData = await yesterdayRes.json();
  
  // Validar se resolveu referência
  const memRes = await fetch(`${BACKEND_URL}/guto/memory?userId=${userId}`);
  const memData = await memRes.json();
  const lastHistory = memData.recentTrainingHistory?.[0];
  
  console.log(`FALA: ${yesterdayData.fala}`);
  console.log(`AÇÃO: ${yesterdayData.acao}`);
  console.log(`HISTÓRICO RECENTE: ${JSON.stringify(lastHistory)}`);
  console.log(`FOCUS NOVO: ${yesterdayData.workoutPlan?.focusKey || memData.nextWorkoutFocus}`);
  
  // Validação Coerência de Exercícios
  const exercises = yesterdayData.workoutPlan?.exercises || [];
  const exerciseNames = exercises.map(e => e.id);
  const hasIncompatible = profile.location === 'casa' || profile.location === 'park' 
    ? exercises.some(e => e.id.includes('maquina') || e.id.includes('cabo') || e.id.includes('legpress'))
    : false;

  console.log(`EXERCÍCIOS (${exercises.length}): ${exerciseNames.slice(0, 3).join(', ')}...`);

  // RESULTADO
  let status = "PASSOU";
  let reason = "";

  if (lastHistory?.muscleGroup !== initialFocus) {
    status = "FALHOU";
    reason += `Referência "isso" não resolveu para ${initialFocus}. `;
  }
  if (yesterdayData.workoutPlan?.focusKey === initialFocus) {
    status = "FALHOU";
    reason += `Repetiu o foco ${initialFocus} mesmo após dizer que treinou ontem. `;
  }
  if (hasIncompatible) {
    status = "FALHOU";
    reason += `Gerou exercícios incompatíveis com ${profile.location}. `;
  }

  console.log(`\n\x1b[${status === 'PASSOU' ? '32' : '31'}mRESULTADO: ${status}\x1b[0m`);
  if (reason) console.log(`MOTIVO: ${reason}`);
}

async function main() {
  for (const profile of testMatrix) {
    await runTest(profile);
    await new Promise(r => setTimeout(r, 1000));
  }
}

main().catch(console.error);
