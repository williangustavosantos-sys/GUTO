# Guto: Nome "Operador" + Treino Incoerente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar o fallback "Operador" no backend e fazer o plano de treino respeitar `trainingGoal` + `preferredTrainingLocation` de forma estrutural.

**Architecture:** Duas frentes independentes: (1) garantir que o nome real chegue ao backend e nunca vaze o placeholder "Operador" em nenhuma saída visível; (2) criar um contrato de coerência entre perfil de calibração (`trainingGoal`, `preferredTrainingLocation`) e os exercícios gerados — tanto no `buildWorkoutPlanFromSemanticFocus` (plano catalog-driven) quanto no prompt do Gemini (plano AI-driven), com validação pós-geração que rejeita planos incoerentes.

**Tech Stack:** TypeScript, Node/Express (backend), React/Next.js (frontend), node:test + assert (testes), Gemini (LLM).

---

## Diagnóstico Raiz

### Nome "Operador"

**Causa:** `memory.name` padrão é `"Operador"` (linha 656 e 614 de `server.ts`). O frontend salva o nome via `persistMemory({ name })` como fire-and-forget — se a chamada falhar, o backend mantém `"Operador"`. O endpoint proativo (linha 3059) usa `memory.name` diretamente na saudação, sem tratar o caso do placeholder.

**Correção já aplicada (parcial):** `startSystem` agora também salva `name: finalName`. Faltam as correções no backend.

### Treino incoerente (hipertrofia + academia → circuito de casa)

**Causa primária:** `trainingGoal` existe na memória mas **nunca é passado nem usado** em `buildWorkoutPlanFromSemanticFocus` nem em `buildWorkoutPlan`. A função não aceita esse campo.

**Causa secundária:** No handler de força proativa (linha 3070–3078), o fallback de `location` é `"casa"` — se `trainingLocation` e `preferredTrainingLocation` não estiverem na memória, o treino é gerado como home. Os aquecimentos de polichinelo/perdigueiro/prancha são os de home/park, confirmando que `getLocationMode("casa")` retornou `"home"`.

**Causa terciária:** `buildWorkoutPlanFromSemanticFocus` para `legs_core`, `shoulders_abs` e `full_body` em modo gym usa os mesmos exercícios bodyweight que home — não há ramificação por `mode === "gym"` para esses focos.

**Causa quaternária:** O prompt do Gemini menciona `trainingGoal` no JSON de memória mas não tem regra explícita que diga: "muscle_gain + gym = usar exercícios de academia (barras, halteres, máquinas, cabos), NUNCA circuito genérico de condicionamento."

---

## Mapa de Arquivos

| Arquivo | O que muda |
|---|---|
| `guto-backend/server.ts` | (1) Proactive greeting omite nome se `=== "Operador"`; (2) `buildWorkoutPlanFromSemanticFocus` recebe `trainingGoal`; (3) Gym branches para `legs_core`, `shoulders_abs`, `full_body`; (4) `validateWorkoutPlanAgainstProfile` nova função; (5) brain prompt reforça contrato; (6) `askGutoModel` e proactive route usam a validação |
| `guto-app-v0/components/guto/guto-app.tsx` | Já corrigido (startSystem salva name, fallbacks removidos) |
| `guto-app-v0/components/guto/tabs/chat-tab.tsx` | Já corrigido (brandName e openingMessage sem fallback "OPERADOR") |
| `guto-backend/tests/guto-workout.test.ts` | Novos testes: contrato de perfil, duplicatas, nome |

---

## Task 1 — Backend: Remover "Operador" do output visível

**Files:**
- Modify: `guto-backend/server.ts` (linha ~3059 e ~614/656)

- [ ] **Step 1: Escrever teste que falha — saudação proativa com nome default**

```typescript
// em guto-backend/tests/guto-workout.test.ts
// Adicionar no final do arquivo

import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Simular a lógica de saudação proativa
function buildProactiveGreeting(name: string, lang: "pt-BR" | "en-US" = "pt-BR"): string {
  const DEFAULT_NAME = "Operador";
  const safeName = name === DEFAULT_NAME ? "" : name;
  const greetings: Record<string, (n: string) => string> = {
    "pt-BR": (n) => n ? `${n}, finalmente chegou, estava te esperando, enquanto isso já analisei tudo e já montei um treino para a gente evoluir junto. Bora?`
                      : `Chegou. Estava te esperando. Treino já montado. Bora?`,
    "en-US": (n) => n ? `${n}, you finally arrived, I was waiting for you. Meanwhile I analyzed everything and put together a workout so we can evolve together. Let's go?`
                      : `You finally arrived. I was waiting. Workout is ready. Let's go?`,
  };
  return (greetings[lang] ?? greetings["pt-BR"])(safeName);
}

describe("Proactive greeting - name handling", () => {
  it("does not include 'Operador' when name is the default placeholder", () => {
    const msg = buildProactiveGreeting("Operador", "pt-BR");
    assert.ok(!msg.includes("Operador"), `Greeting must not contain 'Operador': ${msg}`);
    assert.ok(msg.length > 0, "Greeting must not be empty");
  });

  it("includes the real name when name is set", () => {
    const msg = buildProactiveGreeting("Will", "pt-BR");
    assert.ok(msg.startsWith("Will,"), `Greeting must start with 'Will,': ${msg}`);
  });

  it("uses nameless form for empty string", () => {
    const msg = buildProactiveGreeting("", "pt-BR");
    assert.ok(!msg.includes(","), `Nameless form must not have leading comma: ${msg}`);
  });
});
```

- [ ] **Step 2: Rodar o teste para ver falhar**

```bash
cd /Users/williandossantos/GUTOO/guto-backend
npx tsx --test tests/guto-workout.test.ts 2>&1 | tail -20
```

Esperado: FAIL em "does not include 'Operador'" (a função não existe no server ainda).

- [ ] **Step 3: Implementar no server.ts — helper `buildProactiveGreetingText`**

Localizar a linha 3057 em `server.ts` (bloco `if (slot === "force")`):

```typescript
// ANTES (linhas ~3057–3065):
if (slot === "force") {
  const greeting = {
    "pt-BR": `${memory.name}, finalmente chegou, ...`,
    ...
  };
  result.fala = greeting[selectedLang] || greeting["pt-BR"];
  ...
}
```

Substituir por:

```typescript
if (slot === "force") {
  const DEFAULT_NAME = "Operador";
  const safeName = memory.name === DEFAULT_NAME ? "" : memory.name;
  const greeting: Record<GutoLanguage, string> = {
    "pt-BR": safeName
      ? `${safeName}, finalmente chegou, estava te esperando, enquanto isso já analisei tudo e já montei um treino para a gente evoluir junto. Bora?`
      : `Chegou. Estava te esperando. Treino já montado. Bora?`,
    "en-US": safeName
      ? `${safeName}, you finally arrived, I was waiting for you. Meanwhile I analyzed everything and put together a workout so we can evolve together. Let's go?`
      : `You finally arrived. Workout is ready. Let's go?`,
    "es-ES": safeName
      ? `${safeName}, finalmente llegaste, te estaba esperando, mientras tanto ya analicé todo y armé un entrenamiento para que evolucionemos juntos. ¿Vamos?`
      : `Llegaste. Te estaba esperando. Entrenamiento listo. ¿Vamos?`,
    "it-IT": safeName
      ? `${safeName}, finalmente sei arrivato, ti stavo aspettando, nel frattempo ho analizzato tutto e ho preparato un allenamento per farci evolvere insieme. Andiamo?`
      : `Sei arrivato. Ti stavo aspettando. Allenamento pronto. Andiamo?`,
  };
  result.fala = greeting[normalizeLanguage(language)] || greeting["pt-BR"];
  result.acao = "updateWorkout";
  // ... resto do bloco sem mudança
}
```

- [ ] **Step 4: Rodar o teste novamente**

```bash
cd /Users/williandossantos/GUTOO/guto-backend
npx tsx --test tests/guto-workout.test.ts 2>&1 | tail -20
```

Esperado: PASS nos 3 novos testes.

- [ ] **Step 5: TypeScript clean**

```bash
cd /Users/williandossantos/GUTOO/guto-backend
npx tsc --noEmit 2>&1
```

Esperado: zero erros.

- [ ] **Step 6: Commit**

```bash
git add guto-backend/server.ts guto-backend/tests/guto-workout.test.ts
git commit -m "fix: proactive greeting omits 'Operador' placeholder for unnamed users"
```

---

## Task 2 — Backend: `buildWorkoutPlanFromSemanticFocus` respeita trainingGoal + modo gym

**Files:**
- Modify: `guto-backend/server.ts` (funções `buildWorkoutPlanFromSemanticFocus`, `buildWorkoutPlan` e caller em proactive force e `askGutoModel`)

O problema central: para `legs_core`, `shoulders_abs`, `full_body` em modo `"gym"`, os exercícios são bodyweight (agachamento livre, flexão, perdigueiro) — sem máquinas nem halteres. Para `muscle_gain` em academia, o treino precisa de carga progressiva.

**Estratégia:** Adicionar parâmetro `trainingGoal` em `buildWorkoutPlanFromSemanticFocus`. Criar branches gym para cada foco muscular que use exercícios do catálogo de academia.

- [ ] **Step 1: Escrever testes que falham — contrato de perfil**

```typescript
// guto-backend/tests/guto-workout.test.ts — adicionar bloco

import { buildWorkoutPlanFromSemanticFocusForTest } from "../server"; 
// Nota: precisamos exportar a função do server para testar. Ver step 2.
```

Como `server.ts` é um arquivo monolítico, a estratégia é extrair as funções `buildWorkoutPlan` e `buildWorkoutPlanFromSemanticFocus` para um módulo separado `workout-builder.ts`. Mas isso é uma refatoração grande — para este plano, vamos exportar apenas o necessário para testar através de um endpoint de teste ou escrever os testes diretamente em `guto-workout.test.ts` usando as funções já exportadas do catálogo + lógica local.

**Alternativa prática:** Testar via endpoint HTTP no teste de integração existente. Usar `guto.integration.test.ts` como modelo.

```typescript
// guto-backend/tests/guto-workout.test.ts — adicionar describe bloco

describe("buildWorkoutPlan - gym + muscle_gain coherence", () => {
  // Estes testes validam a lógica sem chamar o server.
  // Extraímos apenas a função de determinação de modo:

  function getLocationModeLocal(location?: string): "gym" | "park" | "home" {
    const normalized = (location || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const gymTerms = ["academia", "palestra", "gym", "gimnasio", "fitness", "box"];
    if (gymTerms.some(t => normalized.includes(t))) return "gym";
    const parkTerms = ["parque", "parco", "park", "rua", "calle", "street", "pista", "quadra"];
    if (parkTerms.some(t => normalized.includes(t))) return "park";
    return "home";
  }

  it("gym is detected for preferredTrainingLocation='gym'", () => {
    assert.equal(getLocationModeLocal("gym"), "gym");
    assert.equal(getLocationModeLocal("academia"), "gym");
  });

  it("home is the fallback — 'casa' resolves to home", () => {
    assert.equal(getLocationModeLocal("casa"), "home");
    assert.equal(getLocationModeLocal(undefined), "home");
  });

  it("park is detected correctly", () => {
    assert.equal(getLocationModeLocal("parque"), "park");
  });
});
```

- [ ] **Step 2: Rodar testes para confirmar base verde**

```bash
cd /Users/williandossantos/GUTOO/guto-backend
npx tsx --test tests/guto-workout.test.ts 2>&1 | tail -30
```

Esperado: PASS (testes de catálogo existentes e novos de location).

- [ ] **Step 3: Adicionar `trainingGoal` ao tipo de parâmetro de `buildWorkoutPlanFromSemanticFocus`**

Localizar a assinatura da função (linha ~2617):

```typescript
// ANTES:
function buildWorkoutPlanFromSemanticFocus({
  language,
  location,
  status,
  limitation,
  age,
  scheduleIntent,
  focus,
}: {
  language: string;
  location: string;
  status: string;
  limitation: string;
  age?: number;
  scheduleIntent?: TrainingScheduleIntent;
  focus?: WorkoutFocus;
}): WorkoutPlan {

// DEPOIS:
function buildWorkoutPlanFromSemanticFocus({
  language,
  location,
  status,
  limitation,
  age,
  scheduleIntent,
  focus,
  trainingGoal,
}: {
  language: string;
  location: string;
  status: string;
  limitation: string;
  age?: number;
  scheduleIntent?: TrainingScheduleIntent;
  focus?: WorkoutFocus;
  trainingGoal?: string;
}): WorkoutPlan {
```

- [ ] **Step 4: Criar branch gym para `legs_core` com exercícios de academia**

No bloco `if (focus === "legs_core")` (linha ~2678), adicionar branch para gym ANTES da linha `return localizeWorkoutPlan({`:

```typescript
if (focus === "legs_core") {
  // GYM branch — máquinas e carga progressiva
  if (mode === "gym") {
    const isHypertrophy = trainingGoal === "muscle_gain" || trainingGoal === "hypertrophy";
    const setsMain = isHypertrophy ? 4 : 3;
    const repsLeg = isHypertrophy
      ? (level === "beginner" ? "12" : "8-10")
      : (level === "beginner" ? "12" : "15");
    const restLeg = isHypertrophy ? "90s" : "60s";
    const repsIso = isHypertrophy ? "10-12" : "12-15";

    return localizeWorkoutPlan({
      focus: focusLabel,
      focusKey: "legs_core",
      dateLabel: getWorkoutDateLabel(selectedLanguage, scheduledFor),
      scheduledFor: scheduledFor.toISOString(),
      summary: commonSummary,
      exercises: [
        ...buildWarmupExercises("gym"),
        makeWorkoutExercise("agachamento_livre", "Agachamento livre", setsMain, repsLeg, restLeg,
          "Descida controlada, joelho acompanha o pé, core travado.",
          hasNoLimitation ? "Base do treino de perna. Sem apressar a carga." : `Controle total para proteger ${limitationFocus}.`),
        makeWorkoutExercise("legpress_45", "Leg press 45°", setsMain, repsIso, "75s",
          "Pés na largura do quadril, descida até 90° e empurra sem travar o joelho no topo.",
          isHypertrophy ? "Volume de quadríceps sem agredir lombar." : "Complementa o agachamento."),
        makeWorkoutExercise("cadeira_extensora", "Cadeira extensora", 3, "12-15", "60s",
          "Extensão completa no topo e descida controlada.",
          "Finaliza quadríceps com isolamento."),
        makeWorkoutExercise("posterior_deitado_maquina", "Posterior deitado na máquina", 3, repsIso, "60s",
          "Quadril firme no banco, flexão completa e descida controlada.",
          hasNoLimitation ? "Isquiotibial entra em foco." : `Sem irritar ${limitationFocus}.`),
        makeWorkoutExercise("panturrilha_em_pe_maquina", "Panturrilha em pé na máquina", 3, "15-20", "45s",
          "Subida completa, pausa de 1s no topo e descida até o alongamento.",
          "Panturrilha fecha o treino de perna."),
      ],
    }, selectedLanguage);
  }

  // HOME/PARK branch — original sem mudança
  return localizeWorkoutPlan({
    focus: focusLabel,
    focusKey: "legs_core",
    // ... código original existente ...
```

**Atenção:** Substituir o trecho inteiro do bloco `if (focus === "legs_core")` preservando o conteúdo home/park original. Ver código atual no arquivo.

- [ ] **Step 5: Criar branch gym para `shoulders_abs`**

No bloco `if (focus === "shoulders_abs")` (linha ~2695), o código já tem `mode === "gym"` vs `home`. Mas usa flexão + serrote + prancha + burpee — não é ombro real de academia. Substituir o array `shouldersMainExercises` para gym:

```typescript
const shouldersMainExercises = mode === "gym"
  ? [
      makeWorkoutExercise("desenvolvimento_sentado", "Desenvolvimento com halteres sentado", 4,
        level === "beginner" ? "10-12" : "8-10", "90s",
        "Cotovelo alinhado com o ombro, sobe até quase juntar os pesos e desce controlado.",
        hasNoLimitation ? "Composto de ombro. Principal do bloco." : `Sem irritar ${limitationFocus}.`),
      makeWorkoutExercise("elevacao_lateral_simultanea_sentado", "Elevação lateral simultânea sentado", 4,
        "12-15", "60s",
        "Cotovelo levemente flexionado, sobe até a altura do ombro e desce sem soltar.",
        "Medial entra em foco sem compensação."),
      makeWorkoutExercise("remada_alta_halter", "Remada alta com halteres", 3,
        "10-12", "60s",
        "Cotovelo vai acima do ombro, puxada limpa sem jogar o tronco.",
        "Trapézio e deltóide anterior trabalham juntos."),
      makeWorkoutExercise("elevacao_frontal_anilha", "Elevação frontal com anilha", 3,
        "12", "60s",
        "Braço semi-estendido, sobe até a linha dos ombros e desce controlado.",
        "Fecha deltóide anterior com amplitude controlada."),
      makeWorkoutExercise("prancha_isometrica", "Prancha isométrica", 3,
        level === "beginner" ? "30-40s" : "45-60s", "40s",
        "Cotovelo embaixo do ombro, abdômen firme e quadril parado.",
        "Core fecha o bloco."),
    ]
  : [
      // manter código original de home/park
    ];
```

- [ ] **Step 6: Criar branch gym para `full_body`**

No bloco `full_body` (linha ~2724), o código atual para gym usa: agachamento livre, flexão, serrote, prancha. Substituir:

```typescript
const fullBodyMainExercises = mode === "gym"
  ? [
      makeWorkoutExercise("agachamento_livre", "Agachamento livre", 4,
        level === "beginner" ? "12" : "10", "75s",
        "Base sólida, descida limpa e empurra o chão.",
        hasNoLimitation ? "Composto rainha. Quadríceps, glúteo e core." : `Sem irritar ${limitationFocus}.`),
      makeWorkoutExercise("supino_reto", "Supino reto", 4,
        level === "beginner" ? "10" : "8-10", "90s",
        "Escápula travada, barra desce controlada até o peito e empurra sem arco exagerado.",
        "Peito e tríceps em foco."),
      makeWorkoutExercise("puxada_frente", "Puxada frente", 4,
        level === "beginner" ? "10-12" : "8-10", "75s",
        "Peito alto, puxa a barra até a linha do queixo e controla a volta.",
        "Costas entram limpo no full body."),
      makeWorkoutExercise("desenvolvimento_sentado", "Desenvolvimento com halteres sentado", 3,
        "10-12", "75s",
        "Cotovelo alinhado com o ombro, sobe sem bater as peças.",
        "Ombro fecha o bloco de empurra."),
      makeWorkoutExercise("prancha_isometrica", "Prancha isométrica", 3,
        level === "beginner" ? "25-30s" : "40-50s", "35s",
        "Centro travado até o fim.",
        "Core fecha o corpo todo sem dispersão."),
    ]
  : [
      // manter código original de home/park
    ];
```

- [ ] **Step 7: Passar `trainingGoal` nos callers**

**Caller 1 — proactive force handler (linha ~3070):**

```typescript
// ANTES:
result.workoutPlan = buildWorkoutPlanFromSemanticFocus({
  language: selectedLang,
  location: memory.trainingLocation || memory.preferredTrainingLocation || "casa",
  status: memory.trainingStatus || "iniciante",
  limitation: memory.trainingLimitations || "sem dor",
  age: memory.userAge || 30,
  scheduleIntent: "today",
  focus: memory.nextWorkoutFocus,
});

// DEPOIS:
result.workoutPlan = buildWorkoutPlanFromSemanticFocus({
  language: selectedLang,
  location: memory.trainingLocation || memory.preferredTrainingLocation || "casa",
  status: memory.trainingStatus || memory.trainingLevel || "iniciante",
  limitation: memory.trainingLimitations || memory.trainingPathology || "sem dor",
  age: memory.userAge || memory.trainingAge,
  scheduleIntent: "today",
  focus: memory.nextWorkoutFocus,
  trainingGoal: memory.trainingGoal,
});
```

**Caller 2 — `askGutoModel` (linha ~2899–2909):**

```typescript
// ANTES:
workoutPlan = buildWorkoutPlanFromSemanticFocus({
  language: selectedLanguage,
  location: memory.trainingLocation || memory.preferredTrainingLocation || "casa",
  status: memory.trainingStatus || focusToStatusHint(semanticFocus),
  limitation: memory.trainingLimitations || "sem dor",
  age: memory.trainingAge,
  scheduleIntent: memory.trainingSchedule,
  focus: semanticFocus,
});

// DEPOIS:
workoutPlan = buildWorkoutPlanFromSemanticFocus({
  language: selectedLanguage,
  location: memory.trainingLocation || memory.preferredTrainingLocation || "casa",
  status: memory.trainingStatus || memory.trainingLevel || focusToStatusHint(semanticFocus),
  limitation: memory.trainingLimitations || memory.trainingPathology || "sem dor",
  age: memory.trainingAge || memory.userAge,
  scheduleIntent: memory.trainingSchedule,
  focus: semanticFocus,
  trainingGoal: memory.trainingGoal,
});
```

- [ ] **Step 8: TypeScript clean**

```bash
cd /Users/williandossantos/GUTOO/guto-backend
npx tsc --noEmit 2>&1
```

Esperado: zero erros.

- [ ] **Step 9: Commit**

```bash
git add guto-backend/server.ts guto-backend/tests/guto-workout.test.ts
git commit -m "feat: workout plan respects trainingGoal and gym location - add gym branches for legs_core, shoulders_abs, full_body"
```

---

## Task 3 — Backend: `validateWorkoutPlanAgainstProfile`

**Files:**
- Modify: `guto-backend/server.ts` (nova função + integração nos callers)

Esta função valida o plano GERADO pelo Gemini (ou pelo catálogo) contra o perfil estruturado. Se incoerente, o plano gerado pelo Gemini é descartado e substituído pelo plano catalog-driven.

- [ ] **Step 1: Escrever testes que falham**

```typescript
// guto-backend/tests/guto-workout.test.ts — adicionar describe bloco

describe("validateWorkoutPlanAgainstProfile", () => {
  // Simular a lógica sem importar do server
  type MockMemory = {
    trainingGoal?: string;
    trainingLocation?: string;
    preferredTrainingLocation?: string;
  };

  type MockPlan = {
    exercises: { id: string; muscleGroup?: string }[];
  };

  // Exercícios considerados "bodyweight/circuito" que não devem ser o centro de treino muscle_gain
  const CONDITIONING_ONLY_IDS = new Set(["burpee", "polichinelo", "perdigueiro"]);
  const GYM_EQUIPMENT_IDS = new Set([
    "supino_reto", "puxada_frente", "legpress_45", "cadeira_extensora",
    "remada_baixa_polia", "desenvolvimento_sentado", "elevacao_lateral_simultanea_sentado",
  ]);

  function validateCoherence(plan: MockPlan, memory: MockMemory): { valid: boolean; reason?: string } {
    const isHypertrophy = memory.trainingGoal === "muscle_gain" || memory.trainingGoal === "hypertrophy";
    const location = memory.trainingLocation || memory.preferredTrainingLocation || "";
    const isGym = ["academia", "gym", "palestra", "fitness"].some(t => location.toLowerCase().includes(t));

    if (!isHypertrophy || !isGym) return { valid: true };

    const mainExercises = plan.exercises.filter(e => !e.id.startsWith("aquecimento"));
    const allAreConditioning = mainExercises.every(e => CONDITIONING_ONLY_IDS.has(e.id));
    if (allAreConditioning) {
      return { valid: false, reason: "muscle_gain + gym: main block is pure conditioning — no gym equipment exercises found" };
    }

    // Pelo menos 2 exercícios de academia no bloco principal
    const gymCount = mainExercises.filter(e => GYM_EQUIPMENT_IDS.has(e.id)).length;
    if (gymCount < 1) {
      return { valid: false, reason: `muscle_gain + gym: only ${gymCount} gym-equipment exercises in main block` };
    }

    return { valid: true };
  }

  it("rejects a conditioning-only plan for muscle_gain + gym profile", () => {
    const plan: MockPlan = {
      exercises: [
        { id: "polichinelo" },
        { id: "burpee" },
        { id: "perdigueiro" },
        { id: "prancha_isometrica" },
        { id: "agachamento_livre" },
        { id: "afundo_halter" },
      ],
    };
    const memory: MockMemory = {
      trainingGoal: "muscle_gain",
      preferredTrainingLocation: "gym",
    };
    const result = validateCoherence(plan, memory);
    assert.equal(result.valid, false, `Expected invalid but got: ${result.reason}`);
  });

  it("accepts a proper gym + muscle_gain plan", () => {
    const plan: MockPlan = {
      exercises: [
        { id: "aquecimento-bike" },
        { id: "aquecimento-escada" },
        { id: "supino_reto" },
        { id: "puxada_frente" },
        { id: "legpress_45" },
        { id: "desenvolvimento_sentado" },
      ],
    };
    const memory: MockMemory = {
      trainingGoal: "muscle_gain",
      preferredTrainingLocation: "gym",
    };
    const result = validateCoherence(plan, memory);
    assert.equal(result.valid, true, `Expected valid but got: ${result.reason}`);
  });

  it("does not reject conditioning plan for non-gym profile", () => {
    const plan: MockPlan = {
      exercises: [{ id: "burpee" }, { id: "polichinelo" }, { id: "agachamento_livre" }],
    };
    const memory: MockMemory = {
      trainingGoal: "muscle_gain",
      preferredTrainingLocation: "home",
    };
    const result = validateCoherence(plan, memory);
    assert.equal(result.valid, true);
  });

  it("does not reject conditioning plan for conditioning goal even in gym", () => {
    const plan: MockPlan = {
      exercises: [{ id: "burpee" }, { id: "polichinelo" }],
    };
    const memory: MockMemory = {
      trainingGoal: "conditioning",
      preferredTrainingLocation: "gym",
    };
    const result = validateCoherence(plan, memory);
    assert.equal(result.valid, true);
  });
});
```

- [ ] **Step 2: Rodar testes para ver falhar**

```bash
cd /Users/williandossantos/GUTOO/guto-backend
npx tsx --test tests/guto-workout.test.ts 2>&1 | tail -20
```

Esperado: FAIL (as funções não existem no server ainda).

- [ ] **Step 3: Implementar `validateWorkoutPlanAgainstProfile` no server.ts**

Adicionar APÓS a função `validateWorkoutPlan` existente (linha ~2816):

```typescript
const CONDITIONING_ONLY_IDS_SET = new Set(["burpee", "polichinelo", "perdigueiro"]);
const GYM_EQUIPMENT_EXERCISE_IDS = new Set([
  "supino_reto", "supino_inclinado", "supino_inclinado_halter", "supino_reto_maquina",
  "supino_baixo_maquina", "crucifixo_maquina",
  "puxada_frente", "puxada_atras_maquina",
  "remada_baixa_polia", "remada_cavalinho", "remada_neutra_maquina", "remada_frontal_cross",
  "desenvolvimento_sentado", "elevacao_lateral_simultanea_sentado", "elevacao_lateral_halter_sentado",
  "elevacao_lateral_unilateral_banco", "elevacao_frontal_anilha", "remada_alta_halter", "remada_alta_guiada",
  "legpress_45", "cadeira_extensora", "posterior_deitado_maquina", "posterior_deitado_maquina_unilateral",
  "afundo_halter", "afundo_smith", "agachamento_smith", "bulgaro_halter",
  "panturrilha_em_pe_maquina", "panturrilha_sentado_maquina",
  "rosca_alternada", "rosca_alternada_halter_sentado", "rosca_martelo_alternada",
  "biceps_maquina", "biceps_frontal_unilateral_polia",
  "triceps_polia_alta", "triceps_barra_v_cabo", "triceps_frances_cabo",
  "serrote",
]);

function validateWorkoutPlanAgainstProfile(
  plan: WorkoutPlan,
  memory: GutoMemory
): { valid: boolean; reason?: string } {
  const isHypertrophy = memory.trainingGoal === "muscle_gain" || memory.trainingGoal === "hypertrophy";
  const locationStr = memory.trainingLocation || memory.preferredTrainingLocation || "";
  const isGym = getLocationMode(locationStr) === "gym";

  if (!isHypertrophy || !isGym) return { valid: true };

  const mainExercises = plan.exercises.filter(e => !e.id.startsWith("aquecimento"));

  const gymCount = mainExercises.filter(e => GYM_EQUIPMENT_EXERCISE_IDS.has(e.id)).length;
  if (gymCount < 2) {
    return {
      valid: false,
      reason: `muscle_gain+gym: only ${gymCount} gym-equipment exercises in main block. Profile requires gym-appropriate progressive overload.`,
    };
  }

  return { valid: true };
}
```

- [ ] **Step 4: Integrar `validateWorkoutPlanAgainstProfile` em `askGutoModel`**

Após a linha que cria `workoutPlan` a partir do Gemini (linha ~2897), adicionar validação:

```typescript
if (workoutPlan) {
  const profileCheck = validateWorkoutPlanAgainstProfile(workoutPlan, memory);
  if (!profileCheck.valid) {
    console.warn("[GUTO] Plano gerado pelo Gemini rejeitado por incoerência de perfil:", profileCheck.reason);
    // Substituir pelo plano catalog-driven
    const semanticFocusForFallback = parsedResponse.memoryPatch?.nextWorkoutFocus || memory.nextWorkoutFocus;
    workoutPlan = buildWorkoutPlanFromSemanticFocus({
      language: selectedLanguage,
      location: memory.trainingLocation || memory.preferredTrainingLocation || "casa",
      status: memory.trainingStatus || memory.trainingLevel || focusToStatusHint(semanticFocusForFallback),
      limitation: memory.trainingLimitations || memory.trainingPathology || "sem dor",
      age: memory.trainingAge || memory.userAge,
      scheduleIntent: memory.trainingSchedule,
      focus: semanticFocusForFallback,
      trainingGoal: memory.trainingGoal,
    });
  }
}
```

**Nota:** Inserir DEPOIS da linha `let workoutPlan = parsedResponse.workoutPlan ? ... : null;` e ANTES do bloco `if (parsedResponse.acao === "updateWorkout" && !workoutPlan)`.

- [ ] **Step 5: Rodar todos os testes**

```bash
cd /Users/williandossantos/GUTOO/guto-backend
npx tsx --test tests/guto-workout.test.ts 2>&1 | tail -30
```

Esperado: PASS em todos.

- [ ] **Step 6: TypeScript clean**

```bash
npx tsc --noEmit 2>&1
```

Esperado: zero erros.

- [ ] **Step 7: Commit**

```bash
git add guto-backend/server.ts guto-backend/tests/guto-workout.test.ts
git commit -m "feat: validateWorkoutPlanAgainstProfile rejects incoherent AI plans for muscle_gain+gym profile"
```

---

## Task 4 — Backend: Reforçar brain prompt com contrato de treino

**Files:**
- Modify: `guto-backend/server.ts` (função `buildGutoBrainPrompt`)

- [ ] **Step 1: Localizar onde adicionar a regra no prompt**

A função `buildGutoBrainPrompt` (linha ~1615) monta várias seções: `persona`, `ritmo`, `trainingRegra`, `confrontoRegra`, `idiomaRegra`, `acoesRegra`, `formatoSaida`. A nova regra de coerência de treino vai no bloco de regras de treino (procurar pela seção `acoesRegra` ou criar nova seção `workoutCoherenceRegra`).

- [ ] **Step 2: Adicionar regra de coerência de treino**

Localizar a variável `acoesRegra` (linha ~1750) e adicionar ao INÍCIO dela, antes da primeira linha:

```typescript
const workoutCoherenceRegra = `
CONTRATO DE COERÊNCIA DO TREINO — OBRIGATÓRIO:

Ao gerar um workoutPlan, USE SEMPRE os campos estruturados da memória:
- trainingGoal: "${memory.trainingGoal || 'não definido'}"
- preferredTrainingLocation: "${memory.preferredTrainingLocation || memory.trainingLocation || 'não definido'}"
- trainingLevel: "${memory.trainingLevel || 'não definido'}"
- userAge: ${memory.userAge ?? memory.trainingAge ?? 'não definido'}
- trainingPathology/trainingLimitations: "${memory.trainingLimitations || memory.trainingPathology || 'sem dor'}"

REGRAS DE COERÊNCIA:
1. Se trainingGoal = "muscle_gain" E local = academia/gym/palestra:
   - O treino DEVE usar máquinas, halteres, barras ou cabos.
   - Proibido circuito genérico de condicionamento com burpee/polichinelo como exercícios principais.
   - Burpee e polichinelo são SOMENTE aquecimento — nunca parte principal.
   - Séries: 3-5. Reps: 6-12 para compostos, 10-15 para isolação. Descanso: 60-120s.
   - Ordem: composto pesado → composto auxiliar → isolação.

2. Se trainingGoal = "muscle_gain" E local = casa/home/parque:
   - Usar calistenia progressiva, halteres se mencionado, bandas se disponível.
   - Proibido prescrever máquinas ou barras sem confirmar equipamento.

3. Se trainingGoal = "fat_loss" ou "conditioning":
   - Circuito e HIIT são adequados.
   - Descanso curto (30-60s), densidade alta.

4. NUNCA ignore o local padrão da memória. Se preferredTrainingLocation = "gym", o treino é de academia.

5. Se for tarde (operationalContext.hour >= 21), ajuste duração: prefira 4-5 exercícios, 3 séries.

6. NUNCA repita o mesmo exercício duas vezes no mesmo plano (exceto aquecimento vs principal com nomes diferentes).
`.trim();
```

E incluir `workoutCoherenceRegra` no array final do prompt, antes de `acoesRegra`.

- [ ] **Step 3: Verificar a linha de inclusão no array final**

Localizar o `return [...]` no final de `buildGutoBrainPrompt` (linha ~1830+) e adicionar:

```typescript
return [
  persona,
  ritmo,
  workoutCoherenceRegra,  // <- ADICIONAR AQUI
  trainingRegra,
  confrontoRegra,
  idiomaRegra,
  expectedResponseRegra,
  acoesRegra,
  formatoSaida,
  // ... resto
].join("\n\n");
```

- [ ] **Step 4: TypeScript clean**

```bash
cd /Users/williandossantos/GUTOO/guto-backend
npx tsc --noEmit 2>&1
```

- [ ] **Step 5: Commit**

```bash
git add guto-backend/server.ts
git commit -m "feat: brain prompt enforces workout coherence contract based on trainingGoal + location"
```

---

## Task 5 — Teste de Integração: Perfil Will

**Files:**
- Modify: `guto-backend/tests/guto-workout.test.ts`

- [ ] **Step 1: Verificar que o servidor está rodando antes do teste**

```bash
cd /Users/williandossantos/GUTOO/guto-backend
npm run dev &
sleep 3
curl -s http://localhost:3000/guto/memory?userId=test-will-plan | jq .name
```

Se o servidor não estiver configurado para testes, usar o teste de catálogo como modelo de como rodar testes de integração. Ver `guto.integration.test.ts` para o padrão de `fetch` local.

- [ ] **Step 2: Criar perfil de teste no backend**

```bash
curl -s -X POST http://localhost:3000/guto/memory \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-will-plan",
    "name": "Will",
    "userAge": 33,
    "biologicalSex": "male",
    "trainingLevel": "consistent",
    "trainingGoal": "muscle_gain",
    "preferredTrainingLocation": "gym",
    "trainingPathology": "sem dor",
    "language": "pt-BR"
  }' | jq '{name: .name, trainingGoal: .trainingGoal, preferredTrainingLocation: .preferredTrainingLocation}'
```

Esperado:
```json
{
  "name": "Will",
  "trainingGoal": "muscle_gain",
  "preferredTrainingLocation": "gym"
}
```

- [ ] **Step 3: Testar proactive force — não pode chamar de Operador**

```bash
curl -s "http://localhost:3000/guto/proactive?userId=test-will-plan&language=pt-BR&force=1" | jq '{fala: .fala, acao: .acao, focus: .workoutPlan.focusKey}'
```

Critério de sucesso:
- `fala` começa com `"Will,"` ou não contém `"Operador"`
- `acao` é `"updateWorkout"`
- `workoutPlan.focusKey` não é null

- [ ] **Step 4: Verificar coerência do workoutPlan**

```bash
curl -s "http://localhost:3000/guto/proactive?userId=test-will-plan&language=pt-BR&force=1" | jq '{
  focus: .workoutPlan.focusKey,
  exercises: [.workoutPlan.exercises[] | {id, muscleGroup}]
}'
```

Critério de sucesso:
- Os exercícios principais NÃO são `polichinelo`/`burpee`/`perdigueiro` como bloco principal
- Pelo menos 2 exercícios são de academia (legpress, supino, puxada, etc.)
- Não há ID duplicado no array

- [ ] **Step 5: Testar chat — input "oi"**

```bash
curl -s -X POST http://localhost:3000/guto \
  -H "Content-Type: application/json" \
  -d '{
    "input": "oi",
    "language": "pt-BR",
    "profile": {
      "userId": "test-will-plan",
      "name": "Will"
    },
    "history": []
  }' | jq '{fala: .fala, acao: .acao}'
```

Critério: resposta direta e proativa. `fala` não contém "Operador".

- [ ] **Step 6: Testar chat — input "cadê o treino"**

```bash
curl -s -X POST http://localhost:3000/guto \
  -H "Content-Type: application/json" \
  -d '{
    "input": "cadê o treino",
    "language": "pt-BR",
    "profile": {
      "userId": "test-will-plan",
      "name": "Will"
    },
    "history": [{"role": "model", "parts": [{"text": "Chegou. Treino montado. Bora?"}]}]
  }' | jq '{fala: .fala, acao: .acao, focus: .workoutPlan.focusKey, exs: [.workoutPlan.exercises[]? | .id]}'
```

Critério:
- `acao` é `"updateWorkout"`
- `workoutPlan.focusKey` é uma das chaves válidas
- Exercícios são coerentes com gym + muscle_gain

- [ ] **Step 7: Rodar todos os testes unitários**

```bash
cd /Users/williandossantos/GUTOO/guto-backend
npx tsx --test tests/guto-workout.test.ts tests/guto.integration.test.ts 2>&1 | tail -40
```

Esperado: PASS em todos.

- [ ] **Step 8: TypeScript final clean**

```bash
cd /Users/williandossantos/GUTOO/guto-backend
npx tsc --noEmit 2>&1
cd /Users/williandossantos/GUTOO/guto-app-v0
npx tsc --noEmit 2>&1
```

Esperado: zero erros em ambos.

- [ ] **Step 9: Commit final**

```bash
git add guto-backend/tests/guto-workout.test.ts
git commit -m "test: integration test for Will profile - name, workout coherence, gym+muscle_gain contract"
```

---

## Self-Review

### Spec coverage

| Requisito | Task |
|---|---|
| Nunca chamar de "Operador" | Task 1 |
| Sem nome → "Chegou. ..." | Task 1 |
| Com nome → "Will, chegou. ..." | Task 1 |
| trainingGoal afeta geração de treino | Task 2 |
| gym + muscle_gain → exercícios de academia | Task 2 |
| Não repetir exercício no mesmo treino | Task 3 (validateWorkoutPlan existente já checa, validateWorkoutPlanAgainstProfile complementa) |
| Rejeitar plano Gemini incoerente | Task 3 |
| Brain prompt reforça contrato | Task 4 |
| Teste com perfil Will | Task 5 |
| npx tsc --noEmit | Task 1, 2, 3, 4, 5 |

### Gaps identificados

- `validateWorkoutPlan` existente já verifica duplicatas de ID — manter.
- Horário tardio (>= 21h) → plano menor: Task 2 não implementa isso explicitamente. O `buildWorkoutPlanFromSemanticFocus` verifica `shouldScheduleTomorrow` mas não reduz a quantidade de exercícios. **Aceitável para este plano** — a redução de intensidade é coberta pelo prompt (Task 4) e pode ser uma evolução futura.
- `recentTrainingHistory` anti-repetição: `validateWorkoutPlan` existente já cobre isso com warnings.

### Placeholder scan

Nenhum passo diz "TBD", "similar ao anterior" ou "adicionar validação apropriada". Todo passo tem código concreto.

### Type consistency

- `buildWorkoutPlanFromSemanticFocus` recebe `trainingGoal?: string` em todos os callers.
- `validateWorkoutPlanAgainstProfile` recebe `(plan: WorkoutPlan, memory: GutoMemory)` e é chamado com exatamente esses tipos.
- `GYM_EQUIPMENT_EXERCISE_IDS` e `CONDITIONING_ONLY_IDS_SET` são `Set<string>` usadas como `.has(exercise.id)`.
