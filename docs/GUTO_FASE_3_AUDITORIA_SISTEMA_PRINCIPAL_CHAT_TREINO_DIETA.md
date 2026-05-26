# GUTO — Fase 3: Auditoria Sistema Principal, Chat, Missão/Treino e Dieta

## Objetivo

Verificar se o sistema principal do GUTO funciona de forma conectada, usando GutoMemory como base real para chat, treino e dieta. Pergunta central: **depois do onboarding, o GUTO usa GutoMemory para guiar conversa/treino/dieta, ou só mostra abas bonitas e respostas soltas?**

## Regra

Auditoria de diagnóstico. Nenhum código de implementação foi alterado. Escopo restrito à Fase 3.

> **Estado dos repos:** ambos os submódulos em `guto/fase-2a-consent`, **working tree limpo** (nada pendente). O código de chat/treino/dieta auditado é o de `fix/hard-stabilization-p0` (= base desta branch; a Fase 2A só adicionou consentimento). Backend de consentimento já mergeado/deployado (Render: `POST /guto/consent/accept` → 401). Nenhuma branch criada, nenhum commit, nenhum push.
> **Veredito rápido:** o sistema principal é **conectado e real** — o chat é o GUTO (memória + contrato + ações), o treino vem do backend com gate de vídeo, a dieta vem do backend com restrições. **Não é chatbot genérico.** **Sem P0.** A ressalva original P1 (patologia "mole" no treino) foi **corrigida na 3C** (ver bloco abaixo / PR backend #20); a pendência que permanece é **e2e/mobile autenticado** (P1 de QA).

---

> ## ✅ Correção 3C aplicada (2026-05-26) — Filtro determinístico de patologia/lesão
>
> **Contexto importante (auditoria estava parcialmente desatualizada):** esta auditoria foi escrita sobre `fix/hard-stabilization-p0`. O **backend `main` está 32 commits à frente** e já tinha mergeado `fix/workout-safety-rotation`, que introduziu uma camada determinística de segurança (`deriveBodyRegionFromPathology`, `safetyFilterWorkoutPlan`, `applySafeExerciseSubstitutions`, `filterExercisesBySafety`) wirada em **todos os 6 caminhos** de geração de treino (curador + fallback + rede final). Ou seja: o veredito "patologia 100% mole / só prompt" era impreciso para `main` — já existia filtro, mas **estava faminto de dados**.
>
> **O gap real corrigido:** `filterExercisesBySafety` dependia de `avoidIfTags` (presente em só **4 de 90** exercícios) + casamento frágil de `movementPattern`/`tags` contra tokens que **não batiam** com os valores reais do catálogo. Resultado: exercícios que a raiz manda bloquear passavam — **leg extension** (`cadeira_extensora`, `movementPattern: "extensao"`), **overhead press** (`desenvolvimento_sentado`, `"empurrar"`), **upright row** (`remada_alta_*`, `"puxar"`), **búlgaro/step-up** (`"unilateral"`), **leg press** (`"empurrar"`) — e **punho/cotovelo/quadril não tinham filtro nenhum**.
>
> **A correção (menor camada segura, sem reestruturar):** adicionei `getExerciseRiskTags(exercise)` em `exercise-catalog.ts` — derivação **determinística** das regiões de alto estresse a partir de `movementPattern` + `tags` + `equipment` + id/nome canônico, cobrindo as 7 regiões (`knee`, `lower_back`, `shoulder`, `wrist`, `elbow`, `ankle`, `hip`). `filterExercisesBySafety` foi reescrito para usar essa derivação + normalização de região PT/IT/EN/`_sensitive` (`toSafetyRegion`). **Sem mudança em `server.ts`** (a wiring já existia). O LLM curador continua orientado a evitar, mas **não é mais a única proteção**.
>
> **Garantias preservadas:** gate de vídeo local (substitutos vêm do `ValidatedExerciseCatalog`), `lockedByCoach` (a checagem em `server.ts:6412` faz o plano travado vencer — não é sobrescrito), substituição para alternativa segura do mesmo grupo, e **comportamento normal intacto** quando não há dor (early-return).
>
> **Limites honestos (não-determinísticos por natureza):** (a) **limitação genérica sem região detectável** (`bodyRegion: "general"`) não é region-filtrável — segue como contexto do curador + deload conservador via `applyWorkoutProgression`; (b) **sintoma torácico/cardíaco** (`chest`) é tratado pela escalada aguda (`risk-classifier.ts` → emergência), não por troca de exercício — por isso o antigo `dangerByRegion.chest` foi removido (era impreciso e nukava aquecimentos leves).
>
> **Arquivos:** `guto-backend/exercise-catalog.ts` (`getExerciseRiskTags`, `toSafetyRegion`, `SafetyRegion`, reescrita de `filterExercisesBySafety`); `guto-backend/tests/guto-workout-safety-filter.test.ts` (**novo, 19 testes**).
> **Testes:** `tsc --noEmit` ✅ · `node scripts/run-guto-tests.mjs` → **27 suítes / 332 testes verdes** (era ~313; +19). Sem regressão.

---

> ## 📑 Como ler este relatório (convenção pós-3C)
>
> Os achados originais da auditoria foram **preservados** (histórico). Onde a 3C mudou o estado, o texto traz `Achado original` + `Status pós-3C` — não há, em nenhuma seção, afirmação do estado antigo como se fosse o atual.
>
> - **Achado original da auditoria:** patologia/lesão entrava como **contexto do LLM** (curador), sem filtro determinístico confiável → classificada como **P1 de segurança** no treino.
> - **Correção 3C aplicada:** filtro determinístico por região no **backend** (`getExerciseRiskTags` + `filterExercisesBySafety`), rodando em todos os caminhos de geração + substituição segura. Entregue no **PR backend #20** (`guto/fase-3c-pathology-filter`).
> - **Status após correção:** o **P1 de patologia do treino está corrigido** (regiões detectáveis: joelho, lombar, ombro, punho, cotovelo, tornozelo, quadril). O LLM ajuda, mas **não é mais a única proteção**.
> - **Pendências restantes:** **validação manual mobile/teclado/vídeo no iPhone** + **e2e autenticado da Fase 3** (P1 de QA), além de P2/P3 (swap persistido, teste `lockedByCoach` do treino, range de peso, dívida técnica, screenshots). A Fase 3 pode seguir para **teste manual no iPhone após o merge/deploy do backend (PR #20)**.

---

# 1. Mapa geral da Fase 3

| Área | Exigência da raiz | Código encontrado | Status | Evidência | Risco | Correção necessária |
|---|---|---|---|---|---|---|
| 1. Sistema principal após pacto | Hub com abas lendo a memória | `stage="system"` → tabs via `guto-app.tsx` | ✅ OK | `guto-app.tsx` render de tabs; `bottom-navigation` | Baixo | — |
| 2. Aba GUTO/Chat | Central operacional, contrato | `chat-tab.tsx` + `POST /guto` | ✅ OK | `chat-tab.tsx`; `server.ts app.post("/guto")` | Baixo | — |
| 3. Aba Missão/Treino | Treino do dia do backend | `mission-tab.tsx` lê `workoutPlan` | ✅ OK | `mission-tab.tsx:171` | Baixo | — |
| 4. Aba Dieta | Plano semanal do backend | `diet-tab.tsx` lê plano persistido | ✅ OK | `diet-tab.tsx:480`; `lib/diet-plan.ts` | Baixo | — |
| 5. GutoMemory no sistema | Carregada e fonte única | `getGutoMemory()` no boot; backend `getMemory(userId)` | ✅ OK | `guto-app.tsx`; `server.ts:7209` | Baixo | — |
| 6. Chat usando GutoMemory | Memória no prompt | backend carrega memória + perfil + `planLine` | ✅ OK | `server.ts:1646,7209-7215`; `chat-tab.tsx:499 planLine` | Baixo | — |
| 7. Treino usando GutoMemory | local/nível/objetivo/dor | `curateWorkout(...)` + `filterExercisesBySafety`/`getExerciseRiskTags` (determinístico) | ✅ OK (3C corrigido) | `exercise-catalog.ts`; `server.ts safetyFilterWorkoutPlan` (6 paths) | Baixo | — |
| 8. Dieta usando GutoMemory | sexo/idade/peso/altura/obj/país/restrições | `nutrition.ts` BMR + `food-availability` + `avoidIf` | ✅ OK | `nutrition.ts`; `food-catalog.ts` | Baixo | — |
| 9. MemoryPatch | campos validados + auditoria | aplica patch + audit + invalida dieta | ✅ OK | `server.ts:3138-3360`; `DIET_INVALIDATION_FIELDS` | Baixo | — |
| 10. Botão de dúvida/contexto | "?" abre chat com contexto | `onExerciseQuestion`/`onFoodDoubt` → chat | ✅ OK | `mission-tab` "?"; `diet-tab:316 onFoodDoubt`; `chat-tab exerciseDoubtTrigger` | Baixo | — |
| 11. Vídeos locais obrigatórios | só com vídeo local validado | gate backend + front | ✅ OK | `workout-catalog-validation.ts`; `mission-tab.tsx:144-149` | Baixo | — |
| 12. lockedByCoach | não sobrescrever plano travado | dieta/treino preservados; UI mostra origem | ✅ OK | `server.ts:6049,8043`; `mission-tab source label` | Baixo | — |
| 13. lastWorkoutPlan | plano oficial do dia | presente e lido | ✅ OK | `server.ts:855`; `mission-tab` | Baixo | — |
| 14. weeklyWorkoutPlan | plano semanal | presente | ✅ OK | `server.ts:856` | Baixo | — |
| 15. weeklyDietPlan | plano semanal de dieta | presente | ✅ OK | `server.ts:857`; `diet-store.ts` | Baixo | — |
| 16. Idioma do app respeitado | UI/chat no idioma | `resolveGutoLanguage` + prompt por idioma | ✅ OK | teste `guto.language.integration` (6) | Baixo | — |
| 17. Mobile/teclado no chat | input acima do teclado | `--guto-chat-input-bottom` + viewport sync | 🟡 PARCIAL | `chat-tab.tsx:1628`; `globals.css` | Médio | validação iPhone |
| 18. Teste de regressão | cobertura | backend forte; e2e do fluxo falha no intro (pré-existente) | 🟡 PARCIAL | `tests/guto-*`; `e2e/guto.spec.ts` 10–14 | Médio | ver §9 |

---

# 2. Chat principal do GUTO

| Item do Chat | Exigência | Código encontrado | Status | Evidência | Risco |
|---|---|---|---|---|---|
| Onde renderiza | aba GUTO | `components/guto/tabs/chat-tab.tsx` | ✅ OK | — | Baixo |
| Endpoint | `/guto/chat` (ou `/guto`) | `POST /guto` via `sendGutoMessage` | ✅ OK | `lib/api/guto.ts:292`; `server.ts` | Baixo |
| Envia memória? | identidade do usuário | envia `userId`+perfil mínimo; **backend lê GutoMemory autoritativa** | ✅ OK | `lib/api/guto.ts:123`; `server.ts:7209 getMemory(userId)` | Baixo |
| Backend injeta memória no prompt | sim | resumo treino/local/nível/objetivo/limitações + perfil + `planLine` | ✅ OK | `server.ts:1646,3000-3012`; `chat-tab.tsx:499` | Baixo |
| Personalidade do GUTO | persona "irmão mais velho" | system prompt persona | ✅ OK | `server.ts ~2700` | Baixo |
| Idioma escolhido | responde no idioma | normaliza idioma + prompt | ✅ OK | teste de idioma | Baixo |
| Nome da dupla | usa o nome | `memory.name` no prompt/UI | ✅ OK | `server.ts:1646` | Baixo |
| Respeita objetivo/local/dor/restrições/histórico | sim | perfil + summary + workoutFeedbackHistory | ✅ OK | `server.ts:3000-3012` | Baixo |
| Contrato estruturado | speech/action/expectedResponse/avatarEmotion/memoryPatch | parse + validação | ✅ OK | `server.ts:2367-2394`; `chat-tab.tsx:446-485` | Baixo |
| Ações reais | acao: updateWorkout/lock/changeLanguage/showProfile/requestDelete | `SendGutoMessageResponse.acao` | ✅ OK | `lib/api/guto.ts:141`; `server.ts:2144` | Baixo |
| Altera memória com confirmação | ambíguo → pergunta | `dirty-data-resolver` + `acknowledgeClarification` | ✅ OK | `server.ts:2846`; `dirty-data-resolver.ts` | Baixo |
| Não diz "salvei" se backend falha | honestidade | prompt "GUTO NUNCA afirma ter alterado" + rollback | ✅ OK | `server.ts:1836`; `guto-app persistMemory rollback` | Baixo |
| Fallback técnico com persona | sim | `fallbackLine`/`classifyContractIntentFallback` quando Gemini cai | ✅ OK | `server.ts:4929,5689` | Baixo |
| Risco de chatbot genérico | — | **Não** — memória + contrato + ações + planLine | ✅ OK | (acima) | Baixo |

**Cenários (verificação por código/testes):**

| Cenário | Detecta/atende | Evidência |
|---|---|---|
| "Não como lactose" | ✅ memoryPatch `foodRestrictions` (ambíguo→pergunta) + invalida dieta | `dirty-data-resolver`; `DIET_INVALIDATION_FIELDS` |
| "Dor no joelho" | ✅ (pós-3C) patch `trainingPathology` + **filtro determinístico** remove/substitui alto estresse da região. *Achado original:* era só contexto do curador. | §4 / bloco 3C |
| "Hoje só tenho 20 minutos" | ✅ contexto/adaptação (proatividade/treino reduzido) | `server.ts` mensagens de treino reduzido |
| "Estou sem academia" | ✅ patch `preferredTrainingLocation`→home (filtro duro) | `workout-curator` location |
| "Quero emagrecer" | ✅ patch `trainingGoal=fat_loss` + invalida dieta/treino | `DIET_INVALIDATION_FIELDS` |
| "Vou viajar essa semana" | ✅ proatividade (memória temporária, confirmação) | `proactivity/memory-extractor` |
| "Não quero treinar hoje" | ✅ cobrança/persona (puxa ação) | prompt arrivalInstruction |
| "Posso trocar esse exercício?" | 🟡 via chat (updateWorkout); substituição respeita catálogo/vídeo, persistência de swap dedicado não confirmada | §7 |
| "Me explica esse exercício" | ✅ contexto via "?" (exerciseDoubtTrigger) | `chat-tab.tsx:150-232` |
| "Muda minha dieta" | ✅ via memoryPatch/invalidação + regenerar | `invalidateDietIfNeeded` |

**Respostas:**
- **Conectado à memória?** Sim — backend lê `GutoMemory` por `userId` e injeta no prompt; chat conhece o treino do dia (`planLine`).
- **Altera o sistema ou só conversa?** Altera de verdade (`memoryPatch` com auditoria, invalidação de dieta, ações estruturadas).
- **Respeita a raiz?** Sim (contrato, idioma, persona, honestidade, lockedByCoach).
- **GUTO ou chatbot genérico?** **GUTO.** Não é chatbot solto.
- **Risco de resposta sem efeito real?** Baixo — persistência honesta + rollback. *Achado original:* o ponto fraco era a patologia como contexto; **resolvido na 3C** (efeito determinístico no treino).

---

# 3. MemoryPatch

| Campo | Pode alterar via chat? | Precisa confirmação? | Invalida dieta/treino? | Status | Evidência | Risco |
|---|---|---|---|---|---|---|
| foodRestrictions | ✅ | se ambíguo | dieta ✅ | ✅ OK | `server.ts:3351`; `DIET_INVALIDATION_FIELDS` | Baixo |
| trainingPathology | ✅ | se ambíguo | treino ✅ (filtro determinístico, pós-3C) | ✅ OK (3C) | `dirty-data-resolver`; `filterExercisesBySafety` | Baixo |
| trainingLimitations | ✅ | se ambíguo | treino ✅ (filtro determinístico, pós-3C) | ✅ OK (3C) | idem | Baixo |
| preferredTrainingLocation | ✅ | com confirmação | treino ✅ (filtro duro) | ✅ OK | memoryPatch fields | Baixo |
| trainingGoal | ✅ | com confirmação | dieta+treino ✅ | ✅ OK | `DIET_INVALIDATION_FIELDS` | Baixo |
| trainingLevel/trainingStatus | ✅ | com confirmação | dieta+treino ✅ | ✅ OK | `DIET_INVALIDATION_FIELDS` | Baixo |
| country | ✅ | com confirmação | dieta ✅ | ✅ OK | `DIET_INVALIDATION_FIELDS` | Baixo |
| city | ✅ | com confirmação | dieta ✅ (e proatividade) | ✅ OK | `DIET_INVALIDATION_FIELDS` | Baixo |
| weightKg | ✅ | com confirmação | dieta ✅ | ✅ OK | `DIET_INVALIDATION_FIELDS` | Baixo |
| heightCm | ✅ | com confirmação | dieta ✅ | ✅ OK | idem | Baixo |
| biologicalSex | ✅ (não casual) | sim (regra explícita) | dieta ✅ | ✅ OK | `server.ts:3286`; regra "não alterar casualmente" | Baixo |
| userAge | ✅ | com confirmação | dieta ✅ | ✅ OK | `DIET_INVALIDATION_FIELDS` | Baixo |

**Respostas:**
- **Campos alteráveis:** os 12 da calibragem (lista de campos permitidos no patch). **Não pode:** `phone` (deletado), nem campos fora da whitelist.
- **Confirmação em dado sensível?** Sim — ambíguos (`foodRestrictions`/`pathology`) pedem esclarecimento; `biologicalSex` tem regra anti-casual.
- **Rollback se falhar?** Sim (`persistMemory` otimista com rollback).
- **Auditoria?** Sim (`memoryAudit` com `source`/`fields`/`reason`).
- **Não sobrescreve lockedByCoach?** Sim — plano travado vira pendência, não override.
- **Invalida dieta/treino?** Sim — `DIET_INVALIDATION_FIELDS` (11 campos) marca a dieta para regen quando muda (preservando se `lockedByCoach`).
- **Frontend otimista demais?** Não — calibragem/consent usam `optimistic:false`; chat patch reflete o que o backend confirma.
- **Risco de memória falsa/localStorage?** Baixo — backend é a verdade; localStorage é cache.

---

# 4. Missão / Treino do dia

| Item Treino | Exigência | Código encontrado | Status | Evidência | Risco |
|---|---|---|---|---|---|
| Onde renderiza | aba Missão | `mission-tab.tsx` | ✅ OK | — | Baixo |
| Vem do backend | sim | `curateWorkout` (backend) | ✅ OK | `server.ts:6304`; `workout-curator.ts` | Baixo |
| Frontend inventa? | nunca | lê `workoutPlan`; `workout-plan.ts:246` retorna null sem calibragem | ✅ OK | `lib/workout-plan.ts:246` | Baixo |
| trainingGoal | sim | curador `goal` | ✅ OK | `server.ts:6311` | Baixo |
| trainingLevel | sim | curador `level` | ✅ OK | `server.ts:6312` | Baixo |
| preferredTrainingLocation | **filtro duro** | `isCompatibleWithLocation` + `getCandidatePool(focus,location)` | ✅ OK | `workout-curator.ts:41-76,215` | Baixo |
| trainingPathology/Limitations | banir exercícios da região | **filtro determinístico** `getExerciseRiskTags`+`filterExercisesBySafety` remove/substitui por região (joelho/lombar/ombro/punho/cotovelo/tornozelo/quadril) | ✅ OK (3C corrigido) | `exercise-catalog.ts`; teste `guto-workout-safety-filter` (19) | Baixo |
| histórico | sim | `workoutFeedbackHistory`/`lastWeekFeedback` | ✅ OK | `server.ts:6313` | Baixo |
| lockedByCoach | não sobrescreve | preservado | ✅ OK | `server.ts:6049,6057` | Baixo |
| lastWorkoutPlan / weeklyWorkoutPlan | plano oficial | presentes | ✅ OK | `server.ts:855-856` | Baixo |
| fallback | respeita memória | template determinístico por foco + curador | ✅ OK | `buildWorkoutPlanFromSemanticFocus` | Baixo |
| exercício sem vídeo bloqueado | gate | back (`workout-catalog-validation`) + front (`hasInvalidWorkoutVideo`) | ✅ OK | teste `guto-workout-video-gate` (27) | Baixo |
| catálogo | 183 exercícios validados | `ValidatedExerciseCatalog` | ✅ OK | `exercise-catalog.ts` | Baixo |
| botão de dúvida por exercício | "?" → chat com contexto | `onExerciseQuestion` → `exerciseDoubtTrigger` | ✅ OK | `mission-tab` + `chat-tab.tsx:150-232` | Baixo |
| substituição de exercício | troca segura | via chat (updateWorkout); persistência dedicada não confirmada | 🟡 PARCIAL | §7 | Baixo |

**Cenários:**
- home não recebe máquina ✅ (filtro duro); gym recebe ✅.
- iniciante x volume ✅ (curador usa level).
- **dor no joelho x treino agressivo** → ✅ (pós-3C) **filtro determinístico** (`getExerciseRiskTags`+`filterExercisesBySafety`) remove/substitui agachamento, afundo, búlgaro, leg extension, leg press e impacto; alternativas seguras (hip thrust, leg curl, glúteo) permanecem. *Achado original:* dependia só do curador (LLM) + flag conservadora.
- muscle_gain/fat_loss mudam estrutura ✅.
- exercício sem vídeo não aparece ✅ (gate duplo).
- lockedByCoach não sobrescrito ✅.

**Respostas (atualizadas pós-3C):**
- **Pronto para aprovar?** Sim — geração/local/vídeo **e** segurança de patologia (filtro determinístico).
- **Filtro determinístico para dor?** **Sim (3C)** — `getExerciseRiskTags`+`filterExercisesBySafety` removem/substituem alto estresse por região; o LLM ajuda mas **não é a única proteção**.
- **Pode gerar algo perigoso?** Risco baixo nas regiões detectáveis (joelho/lombar/ombro/punho/cotovelo/tornozelo/quadril); local/nível seguros.
- **Respeita a raiz?** Sim — a raiz pede *remoção por região lesionada*, agora feita de forma **determinística**.
- *Achado original (pré-3C):* patologia era contexto do curador, não filtro duro → **corrigido no PR backend #20**. Limites honestos remanescentes: limitação genérica sem região (`"general"`) segue como contexto + deload; sintoma torácico/cardíaco vai para escalada aguda (não troca de exercício).

---

# 5. Vídeos locais dos exercícios

| Item Vídeo | Status | Evidência | Risco | Correção necessária |
|---|---|---|---|---|
| Onde estão | ✅ OK | `public/exercise/visuals/` (7 categorias, 89 .mp4) | Baixo | — |
| Exercício aponta para vídeo | ✅ OK | `videoUrl` (catálogo) `provider:"local"` | Baixo | — |
| Gate obrigatório | ✅ OK | `workout-catalog-validation.ts` (prefixo `/exercise/visuals/`, sem URL externa) | Baixo | — |
| Backend filtra sem vídeo | ✅ OK | `ValidatedExerciseCatalog`; teste `guto-workout-video-gate` (27) | Baixo | — |
| Front esconde/erro se falta | ✅ OK | `hasInvalidWorkoutVideo` (`mission-tab.tsx:144-149`) | Baixo | — |
| Fallback seguro | ✅ OK | exercício sem vídeo não entra no plano | Baixo | — |
| Vídeos locais (não externos) | ✅ OK | prefixo local obrigatório; URL externa rejeitada | Baixo | — |
| Botão de vídeo no app | ✅ OK | `<video src playsInline>` (`mission-tab.tsx:314-320`) | Baixo | — |
| Risco tela cinza/quebrado | 🟡 PARCIAL | depende do arquivo existir; sem prova visual mobile | Baixo | validar no iPhone |
| Safari/iPhone | ✅ OK | `playsInline` setado | Baixo | validar autoplay/muted no iPhone |

---

# 6. Dieta da semana

| Item Dieta | Exigência | Código encontrado | Status | Evidência | Risco |
|---|---|---|---|---|---|
| Onde renderiza | aba Dieta | `diet-tab.tsx` | ✅ OK | — | Baixo |
| Vem do backend | sim | `POST /guto/diet/generate` + `nutrition.ts` | ✅ OK | `server.ts:8032` | Baixo |
| Frontend inventa? | nunca | lê plano persistido; sem fallback local (commit `9a20dbe`) | ✅ OK | `lib/diet-plan.ts` | Baixo |
| BMR/TDEE | sim | Mifflin-St Jeor + fator de atividade | ✅ OK | `nutrition.ts:44-64` | Baixo |
| userAge / biologicalSex / heightCm / weightKg | sim | `NutritionProfile` da memória | ✅ OK | `nutrition.ts:17-29` | Baixo |
| trainingGoal | sim | déficit/superávit | ✅ OK | `calculateMacros` | Baixo |
| country/city | país=comida; cidade=proatividade | `getBaseFoodsForCountry(country)` | ✅ OK | `food-availability.ts` | Baixo |
| foodRestrictions | exclusão | `avoidIf` | ✅ OK | `food-catalog.ts` | Baixo |
| lactose/glúten/vegano/frutos do mar | banidos | tags `avoidIf` | ✅ OK | `food-catalog.ts:188,431` | Baixo |
| idioma ≠ país/cidade | desacoplado | idioma=texto; país=comida | ✅ OK | teste `guto-weekly-diet` (14) | Baixo |
| weeklyDietPlan | presente | `weeklyDietPlan` | ✅ OK | `server.ts:857` | Baixo |
| lockedByCoach | não sobrescreve | dieta preservada | ✅ OK | `server.ts:8043` | Baixo |
| invalidação ao mudar campos | sim | `DIET_INVALIDATION_FIELDS` | ✅ OK | `server.ts:3163-3175`; teste `guto-diet-invalidation` (8) | Baixo |
| chat pede troca de alimento | via `onFoodDoubt`→chat + `meal.alternatives` | 🟡 PARCIAL | `diet-tab.tsx:316`; swap persistido dedicado não confirmado | Baixo |
| orientação perigosa/falsa | piso calórico + restrições | ✅ OK | `applySafeCalorieFloor`; disclaimer | Baixo |

**Cenários:** IT/pt → comida IT ✅; BR/it → comida BR ✅; lactose banida ✅; vegano ✅; fat_loss/muscle_gain ✅; Milano/Italy contexto ✅; dieta lockedByCoach preservada ✅.

**Respostas:**
- **Pronta para aprovar?** Sim (dados/restrições/país testados).
- **Backend-real ou frontend-falsa?** **Backend-real** (sem fallback local).
- **Respeita restrições?** Sim (`avoidIf` + invalidação).
- **País/cidade sem confundir idioma?** Sim (desacoplado, testado).
- **Maior risco:** baixo; ponto a observar é a troca de alimento via chat (caminho parcial), não risco sanitário.

---

# 7. Integração Chat → Treino → Dieta

| Fluxo | Existe? | Backend real? | Persistência? | Status | Evidência | Risco |
|---|---|---|---|---|---|---|
| Chat explica exercício atual | ✅ | ✅ | n/a (leitura) | ✅ OK | `exerciseDoubtTrigger`/`planLine` | Baixo |
| Chat sabe o treino do dia | ✅ | ✅ | n/a | ✅ OK | `chat-tab.tsx:499 planLine` | Baixo |
| Chat adapta treino com segurança | ✅ | ✅ | ✅ | ✅ OK (3C) | filtro determinístico de patologia (§4) | Baixo |
| Chat sugere substituição | 🟡 | ✅ | parcial | 🟡 PARCIAL | updateWorkout; swap dedicado não confirmado | Baixo |
| Substituição respeita vídeo local | ✅ | ✅ | n/a | ✅ OK | gate duplo | Baixo |
| Chat sabe a dieta atual | ✅ | ✅ | n/a | ✅ OK | memória/`weeklyDietPlan` | Baixo |
| Chat explica refeição | ✅ | ✅ | n/a | ✅ OK | `onFoodDoubt`→chat | Baixo |
| Chat sugere troca alimentar | 🟡 | ✅ | parcial | 🟡 PARCIAL | via chat/alternatives | Baixo |
| Troca respeita foodRestrictions | ✅ | ✅ | ✅ | ✅ OK | `avoidIf` | Baixo |
| Alteração relevante invalida plano futuro | ✅ | ✅ | ✅ | ✅ OK | `DIET_INVALIDATION_FIELDS` | Baixo |
| Sem respostas soltas sem persistência | ✅ | ✅ | ✅ | ✅ OK | rollback + audit | Baixo |
| Sem mentira de "salvei" | ✅ | ✅ | ✅ | ✅ OK | prompt + rollback | Baixo |

---

# 8. Mobile / teclado / uso real da Fase 3

> Playwright (Desktop Chrome 390×844) **não** emula o teclado iOS. Itens de teclado ficam ✅-por-código com **validação manual em iPhone obrigatória**.

| Item mobile Fase 3 | Status | Evidência | Risco | Teste manual necessário |
|---|---|---|---|---|
| Chat funciona em iPhone | 🟡 PARCIAL | layout `absolute` + viewport sync | Médio | **Sim** |
| Campo de mensagem não atrás do teclado | ✅ OK (código) | `bottom: inputStackBottom`=`--guto-chat-input-bottom` (keyboard-aware) | Médio | **Sim** |
| Botão enviar acessível | ✅ OK | inline ao input (`chat-tab.tsx:1668`) | Baixo | Sim |
| Scroll do chat com teclado | ✅ OK (código) | lista `bottom-[calc(--guto-chat-input-bottom+72px)] overflow-y-auto` | Médio | **Sim** |
| Aba Missão em iPhone | ✅ OK (código) | cards responsivos | Baixo | Sim |
| Cards de exercício não quebram | ✅ OK | métricas + vídeo lado a lado (`mission-tab.tsx:285`) | Baixo | Sim |
| Vídeo abre/fecha | ✅ OK (código) | `<video playsInline>` | Médio | **Sim** (autoplay/muted iOS) |
| Botão de dúvida tocável | ✅ OK | "?" → chat | Baixo | Sim |
| Aba Dieta em iPhone | ✅ OK (código) | cards de refeição | Baixo | Sim |
| Cards de refeições rolam | ✅ OK | scroll na aba | Baixo | Sim |
| CTAs não atrás da safe area | 🟡 PARCIAL | safe-area em vários pontos; bottom-nav space | Médio | **Sim** |
| Bottom nav não cobre conteúdo | ✅ OK | `--guto-bottom-nav-space` reserva espaço | Baixo | Sim |
| 100dvh/visualViewport/safe-area | ✅ OK | `globals.css` + `guto-app.tsx:800-854` | Baixo | — |
| Testes mobile | 🟡 PARCIAL | viewport iPhone existe; fluxo falha no intro | Médio | — |
| Screenshots mobile | 🔴 AUSENTE | `e2e-screenshots/` não cobre chat/missão/dieta autenticados | Baixo | — |

---

# 9. Testes existentes e faltantes

| Teste | Existe? | Arquivo | Cobre o quê? | Status | Prioridade |
|---|---|---|---|---|---|
| chat backend | ✅ | `guto.integration.test.ts`, `guto-turn-contract.test.ts` (4) | contrato, intents | ✅ | — |
| memoryPatch | ✅ | `guto.integration`, `guto-contract-rules.test.ts` (5) | patch + audit | ✅ | — |
| treino | ✅ | `guto-workout.test.ts` (71), `guto-weekly-workout` (13), `guto-workout-progression` (5) | local/volume | ✅ | — |
| vídeo local | ✅ | `guto-workout-video-gate.test.ts` (27) | gate | ✅ | — |
| dieta | ✅ | `guto-diet-generation` (8), `guto-weekly-diet` (14) | BMR/restrições | ✅ | — |
| lockedByCoach | 🟡 | `guto-diet-invalidation` (8) | dieta preservada; treino lock sem teste explícito | 🟡 | P2 |
| restrições alimentares | ✅ | `guto-diet-generation`/`weekly-diet` | avoidIf | ✅ | — |
| dor/patologia | ✅ | `guto-workout-safety-filter.test.ts` (19) | filtro determinístico por região + substituição segura | ✅ | — (3C feito) |
| local home/gym | ✅ | `guto-workout.test.ts` | filtro | ✅ | — |
| e2e aba chat | 🟡 | `e2e/guto.spec.ts:10-11` | input/resposta (falha no intro) | 🟡 | P1 (teste) |
| e2e aba missão | 🟡 | `e2e/guto.spec.ts:12` | exercícios (falha no intro) | 🟡 | P1 (teste) |
| e2e aba dieta | 🟡 | `e2e/guto.spec.ts:14` | dieta (falha no intro) | 🟡 | P1 (teste) |
| mobile/teclado | 🔴 | — | nenhum p/ Fase 3 | 🔴 | P1 (teste) |
| integração chat→treino | 🟡 | `guto.history-context.integration` (5) | contexto | 🟡 | P2 |
| integração chat→dieta | 🟡 | `guto-diet-invalidation` | invalidação | 🟡 | P2 |

> Backend total (pós-3C): **27 suítes / 332 testes verdes** (+19 da 3C). Lacuna real: **e2e/mobile autenticado da Fase 3** (os 09–20 existem mas estão vermelhos por travar no intro em headless — pré-existente).

---

# 10. Simulação de usuário real

Will, pt-BR, 30, male, muscle_gain, intermediate→`consistent`, home, 178, 82, Italy/Milano, dor joelho, NÃO COMO lactose.

| Verificação | Status | Evidência | Risco |
|---|---|---|---|
| 1. Chat chama como dupla | ✅ OK | `memory.name` no prompt/UI | Baixo |
| 2. Chat sabe objetivo/local/dor/restrição | ✅ OK | perfil + summary | Baixo |
| 3. Treino respeita home | ✅ OK | filtro duro de local | Baixo |
| 4. Treino respeita joelho | ✅ OK (3C) | filtro determinístico por região + substituição segura | Baixo |
| 5. Treino tem vídeo local | ✅ OK | gate duplo | Baixo |
| 6. Dieta evita lactose | ✅ OK | `avoidIf` | Baixo |
| 7. Dieta usa Itália/Milano sem mudar idioma | ✅ OK | país=comida, idioma=texto | Baixo |
| 8. Chat explica exercício | ✅ OK | `exerciseDoubtTrigger` | Baixo |
| 9. Chat sugere troca segura | 🟡 PARCIAL | via chat; swap persistido parcial | Baixo |
| 10. Mobile permite uso real | 🟡 PARCIAL | por código OK; falta prova iPhone | Médio |

---

# 11. P0/P1 da Fase 3

| Prioridade | Problema | Área | Evidência | Impacto | Correção mínima |
|---|---|---|---|---|---|
| ~~P1~~ ✅ **CORRIGIDO (3C, 2026-05-26)** | Patologia/lesão agora tem **filtro determinístico** por região (`getExerciseRiskTags`+`filterExercisesBySafety`), rodando em todos os 6 caminhos de geração + substituição segura. LLM ajuda mas não é a única proteção. | Treino/§4 | `exercise-catalog.ts`; teste `guto-workout-safety-filter` (19) | Resolvido para regiões detectáveis (joelho/lombar/ombro/punho/cotovelo/tornozelo/quadril) | — (feito) |
| **P1** | Sem e2e/mobile do fluxo autenticado da Fase 3 (09–20 vermelhos por travar no intro) | QA/§8-9 | `e2e/guto.spec.ts` | Sem rede de segurança para chat/missão/dieta + teclado | Destravar intro em headless + e2e dedicado |
| P2 | Substituição de exercício/alimento via chat sem persistência dedicada confirmada | Treino/Dieta/§7 | `updateWorkout`/`onFoodDoubt` | Troca pode não persistir como swap explícito | Confirmar/implementar swap persistido (quando abrir Treino/Dieta) |
| P2 | Teste explícito de `lockedByCoach` no treino ausente | Treino/§9 | — | Cobertura | Adicionar teste |
| P2 | Range de peso 40–190 (calibragem) afeta dieta | Dieta | (Fase 2C item 7) | Peso fora da faixa não selecionável | Alinhar range 30–300 |
| P3 | Dívida técnica: `trainingLevel`/`trainingStatus` e `trainingLocation`/`preferredTrainingLocation` duplicados | Memória | (Fase 2C §3) | Confusão futura | Unificar |
| P3 | Sem screenshots mobile da Fase 3 | QA | `e2e-screenshots/` | Evidência visual | Gerar prints |

**Sem P0.** Nada falso/mock; backend real; dados persistem; chat conectado.

---

# 12. Saída final

1. **Fase 3 ponta a ponta?** Sim — sistema principal conectado e real.
2. **Chat é GUTO ou chatbot?** **GUTO** (memória + contrato + ações + planLine).
3. **Chat usa GutoMemory?** Sim, autoritativa do backend.
4. **MemoryPatch é seguro?** Sim — whitelist, confirmação de ambíguos, auditoria, rollback, invalidação, respeita lockedByCoach.
5. **Treino vem do backend?** Sim (`curateWorkout`); frontend não inventa.
6. **Treino usa calibragem?** Sim (local/nível/objetivo/histórico); **patologia determinística (3C)**.
7. **Respeita local/nível/objetivo/dor?** Local/nível/objetivo: sim (duro). **Dor: sim — filtro determinístico (3C).**
8. **Vídeos locais garantidos?** Sim — gate backend + frontend.
9. **Dieta vem do backend?** Sim (sem fallback local).
10. **Dieta usa calibragem?** Sim (BMR + país + restrições).
11. **Respeita foodRestrictions?** Sim (`avoidIf` + invalidação).
12. **Chat/treino/dieta conversam?** Sim (planLine, dúvidas, invalidação).
13. **Mobile seguro?** Por código sim; **falta prova em iPhone real**.
14. **P0/P1:** P0 nenhum. **P1 de patologia: corrigido na 3C** (PR backend #20). P1 restante: **e2e/mobile autenticado** da Fase 3.
15. **P2/P3:** swap persistido; teste lockedByCoach treino; range peso; dívida técnica de campos duplicados; screenshots.
16. **Menor correção segura:** a de maior valor (patologia determinística) **já foi feita na 3C** (PR backend #20). Resta apenas QA: **e2e/mobile autenticado**.
17. **Bloco único ou subfases?** **Subfases** — a Fase 3 está majoritariamente aprovada; as correções são localizadas e independentes.
18. **Subfases recomendadas:**
    - **3A — Chat/contrato:** ✅ aprovado.
    - **3B — MemoryPatch:** ✅ aprovado.
    - **3C — Missão/Treino:** ✅ **aprovado** — patologia determinística **corrigida** em 2026-05-26 (`getExerciseRiskTags`+`filterExercisesBySafety`, 19 testes).
    - **3D — Vídeos locais:** ✅ aprovado (validar visual no iPhone).
    - **3E — Dieta:** ✅ aprovado.
    - **3F — Integração:** ✅ aprovado (swap persistido = P2).
    - **3G — Mobile:** 🟡 pendente de validação manual iPhone + e2e.
19. **O Will precisa testar:** chat (memória/idioma/contexto de exercício), missão (treino home + vídeo), dieta (lactose evitada, contexto Itália) — no iPhone.
20. **NÃO mexer ainda:** XP/morte, GUTO Online, Arena/Percurso/Evoluir, painel admin/coach, Fase 4. (A correção de patologia do treino **já foi implementada na 3C** — PR backend #20.)

---

## Quando o Will deve conferir no app

- **Exige validação manual agora?** Sim, para **mobile/teclado/vídeo** (Playwright não prova teclado iOS). A camada de **dados/conexão** já está provada por testes backend verdes + evidência de código.
- **Via qual canal?** **Vercel Preview da branch `fix/hard-stabilization-p0`** (onde o sistema principal + Fase 2A estão; aponta para o Render de produção). Alternativa: Dev Tunnel local. **Não** usar `corpoguto.vercel.app` (main não tem o Fase 2A).
- ⚠️ **Dependência da 3C:** o **filtro determinístico de patologia** (joelho/ombro/punho etc.) só fica visível no app **após o merge/deploy do PR backend #20** no Render. Antes disso, o backend de produção ainda usa o filtro antigo (faminto de dados).
- **Branch/link:** preview de `fix/hard-stabilization-p0` (pegar nos checks do PR/commit ou no dashboard Vercel).
- **Abas a abrir:** GUTO (chat) → Missão → Dieta.
- **Mensagens no chat:** "me explica esse exercício" (após tocar "?"), "agora treino em casa", "não como lactose", "quero emagrecer" — observar se o GUTO responde com memória, pede confirmação quando ambíguo, e **não** diz "salvei" sem efeito.
- **Treino a verificar:** com local "home" não deve aparecer máquina; cada exercício deve ter vídeo que toca; tocar "?" deve abrir o chat já no contexto do exercício.
- **Dieta a verificar:** plano sem lactose; alimentos coerentes com Itália mesmo com app em português; macros/calorias coerentes.
- **No iPhone observar:** campo do chat acima do teclado, botão enviar acessível, lista do chat rolando; vídeo do exercício abrindo (playsInline, sem tela cinza); CTAs/bottom-nav não cobrindo conteúdo.
- **Sinais de OK:** chat usa nome/objetivo/dor; treino respeita home; vídeo toca; dieta evita lactose; reload mantém tudo (backend).
- **Sinais de quebra:** chat responde genérico sem memória; treino com máquina em "home"; vídeo cinza/quebrado; dieta com lactose; "salvei" sem persistir; teclado cobrindo input/CTA.
- **Pode ser aprovada sem teste no iPhone?** A **camada de dados/conexão: sim** (testes verdes). A **camada mobile (chat/teclado/vídeo): não** — exige validação manual no iPhone antes da aprovação final, pela regra da fase.
