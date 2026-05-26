# GUTO — Fase 2C: Auditoria Sistêmica da Calibragem e Fluxo Vivo

## Objetivo

Verificar se a calibragem realmente alimenta o sistema do GUTO e se os dados seguem corretamente até memória, chat, dieta, treino e proatividade. Pergunta central: **a calibragem vira memória viva ou é só um formulário bonito?**

## Regra

Auditoria de diagnóstico. Nenhum código de implementação foi alterado. Escopo restrito à calibragem e seu impacto sistêmico.

> **Estado do repo na auditoria:** ambos os submódulos em `guto/fase-2a-consent`.
> - `guto-app-v0`: modificados `components/guto/guto-app.tsx`, `components/guto/screens/consent-screen.tsx`, `e2e/guto.spec.ts`, `lib/api/guto.ts` (Fase 2A — consentimento, **NÃO tocada nesta auditoria**) + doc untracked.
> - `guto-backend`: modificados `server.ts`, `src/log-store.ts` + `tests/guto-consent.test.ts` (Fase 2A).
> As mudanças da Fase 2A são de **consentimento** e não afetam a calibragem. Esta auditoria foi feita sobre esse código (base `fix/hard-stabilization-p0`, que contém os 16 commits de calibragem auditados nas Fases 1–2). Nenhuma branch criada, nenhum commit, nenhum push.
> **Veredito rápido:** a calibragem é **memória viva real**, não formulário cosmético — chega ao backend, persiste em `GutoMemory`, e é consumida por dieta, treino, chat e proatividade. Há ressalvas pontuais (abaixo), nenhuma P0.

---

# 1. Mapa geral da calibragem

| # | Campo | Existe na UI? | Nome no frontend | Enviado ao backend? | Nome no backend | Salvo em GutoMemory? | Persistente após reload? | Usado por quê? | Status | Evidência | Risco |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | idade | ✅ | `userAge` (SearchSelect 14–90) | ✅ | `userAge` | ✅ | ✅ (backend) | Dieta (BMR), treino (curador) | ✅ OK | `calibration-screen.tsx:137-142,309-318`; `server.ts getMemory normalizeUserAge` | Baixo |
| 2 | sexo biológico | ✅ | `biologicalSex` (chips female/male) | ✅ | `biologicalSex` | ✅ | ✅ | Dieta (macro/BMR) | ✅ OK | `calibration-screen.tsx:305-306`; `server.ts:707 normalizeBiologicalSex` | Baixo |
| 3 | nível de treino | ✅ | `trainingLevel` (→`trainingStatus`) | ✅ | `trainingLevel`+`trainingStatus` | ✅ | ✅ | Treino (volume), dieta (TDEE) | ✅ OK | `calibration-screen.tsx:57`; `guto-app.tsx:1360 trainingStatus=trainingLevel` | Baixo |
| 4 | objetivo | ✅ | `trainingGoal` (chips) | ✅ | `trainingGoal` | ✅ | ✅ | Dieta (déficit/superávit), treino | ✅ OK | `calibration-screen.tsx:211`; curador `goal`, nutrition `trainingGoal` | Baixo |
| 5 | local de treino | ✅ | `preferredTrainingLocation` (chips) | ✅ | `preferredTrainingLocation` | ✅ | ✅ | Treino (filtro duro de equipamento) | ✅ OK | `calibration-screen.tsx:410-415`; `workout-curator.ts:41-61 isCompatibleWithLocation` | Baixo |
| 6 | altura | ✅ | `heightCm` (SearchSelect 100–250) | ✅ | `heightCm` | ✅ | ✅ | Dieta (BMR) | ✅ OK | `calibration-screen.tsx:150-155`; `normalizeHeightCm` | Baixo |
| 7 | peso | ✅ | `weightKg` (SearchSelect 40–190) | ✅ | `weightKg` | ✅ | ✅ | Dieta (BMR) | 🟡 PARCIAL | range UI 40–190 vs doc 30–300 (`calibration-screen.tsx:143-149`) | Médio (peso <40 ou >190 não selecionável) |
| 8 | país | ✅ | `country`/`countryCode` | ✅ | `country`/`countryCode` | ✅ | ✅ | Dieta (alimentos do país), proatividade | ✅ OK | `calibration-screen.tsx:259-272`; `food-availability.ts getBaseFoodsForCountry` | Baixo |
| 9 | cidade | ✅ | `city` | ✅ | `city` | ✅ | ✅ | Proatividade (clima/feriados) — **não** a dieta | ✅ OK | `calibration-screen.tsx:273-283`; `proactivity/memory-enricher.ts` (wttr.in) | Baixo |
| 10 | dor/patologia | ✅ | `trainingPathology` (+chip "SEM DOR") | ✅ | `trainingPathology`+`trainingLimitations` | ✅ | ✅ | Treino (contexto do curador + flag conservadora) | 🟡 PARCIAL | `guto-app.tsx:1359-1361`; curador `pathology` (contexto, não filtro duro) | **Médio (segurança)** — ver §5 |
| 11 | trainingLimitations | ✅ (derivado de patologia) | `trainingLimitations` | ✅ | `trainingLimitations` | ✅ | ✅ | Treino, chat (summary) | ✅ OK | `guto-app.tsx:1361`; prompt `atenção=${trainingLimitations}` (`server.ts:1646`) | Baixo |
| 12 | NÃO COMO | ✅ | `foodRestrictions` (texto + chip "COMO DE TUDO") | ✅ | `foodRestrictions` | ✅ | ✅ | Dieta (avoidIf), chat (patch) | ✅ OK | `calibration-screen.tsx:285-299`; `food-catalog.ts avoidIf`; `server.ts:3351` | Baixo |
| 13 | language NÃO é campo da calibragem | ✅ ausente | — | — | `language` (vem do idioma) | ✅ (separado) | ✅ | UI/voz, não comida | ✅ OK | `calibration-screen.tsx` sem campo idioma | Baixo |
| 14 | userName NÃO é campo da calibragem | ✅ ausente | — | — | `name` (naming) | ✅ (separado) | ✅ | Identidade | ✅ OK | tela de naming separada | Baixo |
| 15 | phone NÃO entra em GutoMemory | ✅ ausente | — | — | — (deletado) | 🔴 (proibido, ok) | n/a | — | `server.ts:846-847,1119 delete phone`; teste `guto-memory-phone` | Baixo |
| 16 | foodIntolerances separado NÃO existe | ✅ ausente | — | — | — (removido) | 🔴 (proibido, ok) | n/a | — | front type sem `foodIntolerances` (commit `0b16039`) | Baixo |
| 17 | biologicalSex não aceita valor proibido | ✅ | só female/male | ✅ | só `"female"|"male"` | ✅ | ✅ | — | ✅ OK | `server.ts:707`; teste `guto-biological-sex` (6) | Baixo |

**Conclusão §1:** 15/17 ✅, 2 🟡 (range de peso; patologia como contexto e não filtro duro). Campos proibidos (telefone, intolerância separada, sexo proibido) corretamente bloqueados.

---

# 2. Fluxo real: UI → Backend → GutoMemory

| Etapa | Código encontrado | Status | Evidência | Risco | Correção necessária |
|---|---|---|---|---|---|
| Tela real renderizada | `CalibrationScreen` no stage `calibration` | ✅ OK | `guto-app.tsx:2522-2534` | Baixo | — |
| Código morto / tela não usada | `name-screen.tsx` e `agreement-screen.tsx` não usados (inline no guto-app). **CalibrationScreen é a real.** | 🟡 PARCIAL | imports só de Calibration/Consent | Baixo | P3: remover dead code (fora de escopo) |
| Função que coleta | `handleCalibrationComplete` recebe payload da tela | ✅ OK | `guto-app.tsx:1352-1372` | Baixo | — |
| Payload enviado | `persistMemory({...calibration, trainingStatus, trainingLimitations}, {optimistic:false})` | ✅ OK | `guto-app.tsx:1355-1362` | Baixo | — |
| Endpoint que recebe | `POST /guto/memory` (`saveGutoMemory`) | ✅ OK | `lib/api/guto.ts saveGutoMemory`; `server.ts app.post("/guto/memory")` | Baixo | — |
| Validação no backend | `normalizeUserAge/BiologicalSex/HeightCm/WeightKg`, sanitize, delete phone | ✅ OK | `server.ts:707,1120-1122,846` | Baixo | — |
| Como salva | `saveMemory` merge + normalização + persist (Redis→file) | ✅ OK | `server.ts:1108-1122`; `memory-store.ts writeMemoryStoreAsync` | Baixo | — |
| Onde persiste | Redis Upstash + `data/guto-memory.json` | ✅ OK | `memory-store.ts` | Baixo | — |
| Fallback localStorage | `guto-white-lab-profile-<userId>` (perfil/flags) | ✅ OK (cache) | `guto-app.tsx persistProfile` | Baixo | — |
| localStorage é autoridade falsa? | **Não** para calibragem: stage router usa memória do backend | ✅ OK | `guto-app.tsx:648 calibrationMissing = memory ? !hasMemoryCalibration(memory) : ...` | Baixo | — |
| Reload vem do backend? | Sim: `getGutoMemory()` no boot → `resolveAuthenticatedStage(memory)` | ✅ OK | `guto-app.tsx:999,1074` | Baixo | — |
| Falha honesta | `persistMemory(optimistic:false)` → se falha, mostra erro e **não avança** | ✅ OK | `guto-app.tsx:1363-1366` | Baixo | — |
| Separada por userId | `getMemory(userId)`, storage por userId | ✅ OK | `server.ts:998`; teste `guto-team-isolation` | Baixo | — |

**Conclusão §2:** o fluxo UI→backend→GutoMemory é real, validado, persistente e honesto. localStorage é cache, não autoridade. Único ponto: existem componentes mortos (`name-screen`/`agreement-screen`) — não da calibragem, mas confundem auditoria.

---

# 3. GutoMemory como fonte única da verdade

| Item | Achado | Status |
|---|---|---|
| Tipo GutoMemory frontend | `lib/api/guto.ts:155` — campos da calibragem presentes; `biologicalSex: "female"|"male"`; **sem** `foodIntolerances` | ✅ OK |
| Tipo GutoMemory backend | `server.ts:325` interface — idem + consent (Fase 2A) | ✅ OK |
| Defaults de memória | `getMemory` branch default (`server.ts:1078+`) | ✅ OK |
| getMemory | reconstrução normalizada com lista explícita de campos (`server.ts:998-1075`) | ✅ OK |
| saveMemory | merge `{...existing, ...memory}` + normaliza + delete phone (`server.ts:1108`) | ✅ OK |
| memoryPatch | aplica campos permitidos com auditoria `source`/`fields` (`server.ts:3138-3360`) | ✅ OK |
| validação campos proibidos | phone deletado; biologicalSex restrito | ✅ OK |
| separação por userId | sim | ✅ OK |
| memória inicial | default sem calibragem → stage `calibration` | ✅ OK |
| memória após calibragem | `POST /guto/memory` grava todos os campos | ✅ OK |
| memória após chat | memoryPatch + `invalidateDietIfNeeded` (`server.ts:3163-3175`) | ✅ OK |
| memória após coach/admin | `admin-router` edita por campos validados (fora de escopo) | ✅ OK (não auditado a fundo aqui) |

**Respostas:**
- **GutoMemory é a fonte única?** Sim. Stage router, chat, dieta, treino e proatividade leem a mesma memória persistida no backend.
- **Duplicação perigosa de campos?** Pequena e benigna: `trainingLevel` **e** `trainingStatus` coexistem (a calibragem seta os dois iguais; curador usa `trainingStatus || trainingLevel`). Não é perigoso, mas é redundância a observar.
- **Campo antigo ainda usado?** `trainingLocation` (legado) coexiste com `preferredTrainingLocation`; o código usa `preferredTrainingLocation || trainingLocation`. Funciona, mas é dívida técnica.
- **Dado da calibragem só no frontend?** Não — todos vão ao backend. (Consentimento ERA só local; corrigido na Fase 2A.)
- **Dado que o backend ignora?** Não identificado entre os 12 campos.
- **Dado esperado por dieta/treino com nome diferente?** Não — dieta/treino leem os nomes canônicos (`biologicalSex`, `weightKg`, `trainingGoal`, `preferredTrainingLocation`, `trainingPathology`/`trainingLimitations`, `foodRestrictions`).

---

# 4. Calibragem → Dieta (somente leitura)

| Dado da calibragem | Dieta usa? | Onde usa | Status | Evidência | Risco |
|---|---|---|---|---|---|
| idade | ✅ | BMR (Mifflin-St Jeor) | ✅ OK | `nutrition.ts calculateBMR(age)` | Baixo |
| sexo biológico | ✅ | BMR + piso calórico | ✅ OK | `nutrition.ts` (`biologicalSex`, floor 1200/1400) | Baixo |
| peso | ✅ | BMR | ✅ OK | `nutrition.ts` | Baixo |
| altura | ✅ | BMR | ✅ OK | `nutrition.ts` | Baixo |
| objetivo | ✅ | déficit/superávit/macros | ✅ OK | `nutrition.ts calculateMacros(trainingGoal)` | Baixo |
| nível de treino | ✅ | TDEE (fator de atividade) | ✅ OK | `nutrition.ts calculateTDEE(level)` | Baixo |
| país | ✅ | alimentos disponíveis | ✅ OK | `food-availability.ts getBaseFoodsForCountry(country)` | Baixo |
| cidade | 🔴 (por design) | **não** usa para comida (usa país) | ✅ OK (conforme raiz) | raiz: cidade→clima/proatividade | Baixo |
| foodRestrictions | ✅ | exclusão de alimentos | ✅ OK | `food-catalog.ts avoidIf` (lactose/glúten/vegan/shellfish) | Baixo |
| idioma separado de país/cidade | ✅ | idioma = texto; país = comida | ✅ OK | teste `guto-weekly-diet` (14) | Baixo |

**Testes conceituais:**
- BR falando italiano → comida BR (país manda) ✅ (food-availability por país; idioma só texto).
- IT falando português → comida IT ✅.
- lactose → laticínios banidos ✅ (`avoidIf: lactose_intolerance, milk_allergy`).
- vegano → proteína animal fora ✅ (`avoidIf: vegan`).
- fat_loss → déficit ✅; muscle_gain → superávit ✅ (`calculateMacros`).

**Respostas:**
- **Dieta gerada pelo backend?** Sim (`POST /guto/diet/generate` + `nutrition.ts`); frontend só lê (`lib/diet-plan.ts`).
- **Respeita foodRestrictions?** Sim (avoidIf por alimento e por bloco).
- **Idioma muda comida indevidamente?** Não (desacoplado; testado).
- **País/cidade como contexto?** País = comida; cidade = proatividade (clima). Correto.
- **Risco de ignorar restrições?** Baixo — há `avoidIf` + `DIET_INVALIDATION_FIELDS` (muda foodRestrictions → dieta invalidada). Testes `guto-diet-generation` (8) e `guto-diet-invalidation` (8) verdes.

---

# 5. Calibragem → Treino / Missão (somente leitura)

| Dado da calibragem | Treino usa? | Onde usa | Status | Evidência | Risco |
|---|---|---|---|---|---|
| trainingLevel | ✅ | volume/complexidade | ✅ OK | curador `level: trainingStatus||trainingLevel` | Baixo |
| trainingGoal | ✅ | estrutura | ✅ OK | curador `goal` | Baixo |
| preferredTrainingLocation | ✅ | **filtro duro** de equipamento | ✅ OK | `workout-curator.ts:41-61,73-76 isCompatibleWithLocation`; `getCandidatePool(focus,location)` | Baixo |
| trainingPathology | 🟡 | **contexto** do curador + flag conservadora (não filtro duro) | 🟡 PARCIAL | `server.ts:6306-6309 pathology`; `workout-curator.ts:169 "Patologia/limitação"` | **Médio (segurança)** |
| trainingLimitations | 🟡 | idem patologia | 🟡 PARCIAL | idem | Médio |
| histórico do usuário | ✅ | `lastWeekFeedback`/`workoutFeedbackHistory` | ✅ OK | `server.ts:6313 summarizeWorkoutFeedback` | Baixo |
| lockedByCoach | ✅ | não sobrescreve plano travado | ✅ OK | `server.ts:6049,6057`; `guto-app.tsx mission-tab` | Baixo |
| lastWorkoutPlan | ✅ | plano oficial do dia | ✅ OK | `server.ts:855`; `mission-tab` | Baixo |
| weeklyWorkoutPlan | ✅ | plano semanal | ✅ OK | `server.ts:856` | Baixo |
| catálogo de exercícios | ✅ | `ValidatedExerciseCatalog` (183) | ✅ OK | `workout-curator.ts:73`; `exercise-catalog.ts` | Baixo |
| vídeos locais obrigatórios | ✅ | gate `videoUrl` em `/exercise/visuals/` | ✅ OK | `workout-catalog-validation.ts`; teste `guto-workout-video-gate` (27) | Baixo |

**Testes conceituais:**
- home não gera máquina ✅ (filtro duro `isCompatibleWithLocation`).
- gym gera máquinas ✅.
- iniciante x volume avançado ✅ (curador usa level).
- fat_loss/muscle_gain mudam estrutura ✅.
- exercício sem vídeo local não aparece ✅ (gate).
- **dor no joelho não gera treino agressivo** → 🟡 **PARCIAL**: a patologia é passada como **contexto textual** ao curador (LLM) + flag "conservative low-impact" quando ambígua, **não** como filtro determinístico que remove exercícios de alto estresse patelar do pool. A raiz exige banimento (remoção do catálogo). Hoje depende do curador honrar o contexto.

**Respostas:**
- **Treino vem do backend?** Sim (`curateWorkout`); frontend não inventa (`workout-plan.ts:246` retorna null se calibragem incompleta).
- **Frontend inventa treino?** Não — lê `lastWorkoutPlan`/`weeklyWorkoutPlan`.
- **Dor/patologia muda o treino?** Parcialmente — via contexto do curador, não via filtro duro (risco de segurança a registrar).
- **Local muda exercícios?** Sim, filtro duro real.
- **Gate de vídeo ativo?** Sim (27 testes).
- **Risco de treino incompatível com o corpo?** Local: baixo. **Patologia: médio** — não há remoção determinística por região lesionada; é a maior ressalva desta fase.

---

# 6. Calibragem → Chat / memoryPatch

| Cenário | Detecta? | Pede confirmação? | Salva em memoryPatch? | Impacta sistema? | Status | Evidência | Risco |
|---|---|---|---|---|---|---|---|
| "Não como lactose" | ✅ | se ambíguo (intolerância vs preferência) | ✅ `foodRestrictions` | ✅ invalida dieta | ✅ OK | `server.ts:2829,3351`; `dirty-data-resolver.ts` | Baixo |
| "Dor no joelho" | ✅ | se ambíguo (dor/lesão/cansaço) | ✅ `trainingPathology`/`Limitations` | ✅ treino (contexto) | 🟡 PARCIAL | `dirty-data-resolver.ts`; rotina de esclarecimento | Médio (ver §5) |
| "Agora treino em casa" | ✅ | com confirmação | ✅ `preferredTrainingLocation` | ✅ treino (filtro) | ✅ OK | memoryPatch fields `server.ts:3163` | Baixo |
| "Mude objetivo para emagrecer" | ✅ | com confirmação | ✅ `trainingGoal` | ✅ dieta+treino | ✅ OK | `DIET_INVALIDATION_FIELDS` inclui trainingGoal | Baixo |
| "Estou viajando essa semana" | ✅ | ✅ (proatividade) | memória temporária (não calibragem) | ✅ contexto semanal | ✅ OK | `proactivity/memory-extractor.ts` | Baixo |
| "Não tenho equipamentos" | 🟡 | depende | parcial (vira contexto/local) | parcial | 🟡 PARCIAL | não há campo dedicado de equipamento | Baixo |

**Respostas:**
- **Chat recebe GutoMemory?** Sim — contexto de perfil com `userAge/biologicalSex/trainingLevel/trainingGoal/preferredTrainingLocation/trainingPathology` (`server.ts:3000-3012`).
- **Prompt contém dados da calibragem?** Sim — resumo treino/local/nível/objetivo/limitações (`server.ts:1646`) + instruções de campos patcháveis incl. `foodRestrictions` (`server.ts:2829`). **Nuance:** o resumo legível não lista sexo/peso/altura/país/cidade, mas eles existem no objeto de perfil/contexto e nos campos patcháveis.
- **Chat altera memoryPatch?** Sim, com auditoria (`source=chat`/`chat_patch`, `fields`).
- **Pede confirmação quando ambíguo?** Sim — `dirty-data-resolver` + `acknowledgeClarification` (`server.ts:2846`).
- **Sobrescreve campo crítico sem regra?** Não casualmente — biologicalSex tem regra de não alterar casualmente; ambíguos pedem confirmação.
- **Diz "salvei" se o backend falhar?** Não — regra no prompt ("GUTO NUNCA afirma ter alterado dados") + persistência real; `persistMemory` faz rollback.
- **Respeita lockedByCoach?** Sim (não sobrescreve plano travado).
- **Alterações impactam dieta/treino depois?** Sim — `invalidateDietIfNeeded` + próximo treino relê memória.

---

# 7. Calibragem → Proatividade (somente leitura)

| Item | Usa/Respeita? | Evidência | Status |
|---|---|---|---|
| cidade | ✅ (clima/feriados) | `proactivity/memory-enricher.ts` (wttr.in + date.nager.at) | ✅ OK |
| país | ✅ | enricher/extractor | ✅ OK |
| local de treino | 🟡 (contexto) | usado em adaptação de treino, não direto na proatividade | 🟡 PARCIAL |
| objetivo / nível | 🟡 | contexto geral | 🟡 PARCIAL |
| dores/limitações | 🟡 | contexto | 🟡 PARCIAL |
| foodRestrictions | 🟡 | não central à proatividade | 🟡 PARCIAL |
| eventos temporários / viagem / semana atípica | ✅ | `memory-extractor.ts` | ✅ OK |
| memória temporária | ✅ | `proactive-store.ts` (status de ciclo) | ✅ OK |
| confirmação antes de salvar | ✅ | status `pending_confirmation`; teste `proactivity-resolver` (23) | ✅ OK |

**Respostas:**
- **Usa calibragem real?** Sim — cidade/país para clima/feriados; eventos temporários separados da calibragem permanente.
- **Altera calibragem permanente sem confirmação?** Não — ciclo coletar→confirmar→usar→validar→arquivar; só persiste após "sim".
- **Respeita lockedByCoach?** Sim (não sobrescreve plano travado durante adaptação proativa).
- **Usa cidade/clima/contexto?** Sim — `memory-enricher` busca clima por cidade (externo/opcional; falha não bloqueia o app).
- **Fluxo real ou só estrutura?** Real e testado (23 testes do resolver + store cycle).

---

# 8. Mobile / teclado / dropdowns da calibragem

> Playwright roda em Desktop Chrome 390×844 e **não** emula o teclado virtual do iOS. Itens dependentes de teclado real ficam ✅-por-código com **validação manual em iPhone obrigatória** antes da aprovação final.

| Item mobile | Status | Evidência | Risco | Teste manual necessário |
|---|---|---|---|---|
| Viewport iPhone | ✅ OK | `playwright.config.ts:47` 390×844 | Baixo | Não |
| Viewport Android | 🟡 PARCIAL | mesmo CSS; sem projeto Android | Baixo | Sim (recomendado) |
| 100dvh/svh/min-height | ✅ OK | `globals.css` `100dvh` + `--guto-viewport-height` | Baixo | Não |
| Risco com 100vh | ✅ OK (não usa 100vh) | usa `100dvh` | Baixo | Não |
| safe-area-inset-bottom | ✅ OK | `calibration-screen.tsx:231 pb-[max(env(safe-area-inset-bottom),…)]` | Baixo | Não |
| Campos numéricos teclado correto | 🟡 PARCIAL | usa **pickers SearchSelect** (não input numérico); busca é texto sem `inputMode` | Baixo | Sim |
| Idade visível com teclado | ✅ OK (código) | overlay z-9999 + `--guto-viewport-height` | Médio | **Sim (iPhone)** |
| Altura visível com teclado | ✅ OK (código) | idem | Médio | **Sim** |
| Peso visível com teclado | ✅ OK (código) | idem | Médio | **Sim** |
| Cidade visível com teclado | ✅ OK (código) | SearchSelect overlay | Médio | **Sim** |
| foodRestrictions visível com teclado | ✅ OK (código) | `CompactTextInput` + `focusin scrollIntoView({block:"center"})` (`:214-228`) | Médio | **Sim** |
| Botão avançar acessível | 🟡 PARCIAL | CTA **dentro do scroll** (`mt-auto shrink-0`), não sticky → alcançável rolando | Médio | **Sim** |
| Scroll suficiente | ✅ OK | `guto-calibration-body overflow-y-auto overscroll-contain` (`:252`) | Baixo | Não |
| Dropdowns acima do teclado | ✅ OK (código) | overlay `max-h` = `--guto-viewport-height` (ajustado pelo teclado) | Médio | **Sim** |
| z-index dos dropdowns | ✅ OK | `z-[9999] fixed` (`:588`) | Baixo | Não |
| Bottom sheet não cortado | ✅ OK | `justify-end` + lista com scroll interno (`:598-643`) | Baixo | Sim |
| Opções atrás do teclado | ✅ OK (código) | vars espelhadas no `<html>` p/ portals (`guto-app.tsx:818-824`) | Médio | **Sim** |
| Fluxo completo no iPhone | 🟡 PARCIAL | por código OK; sem prova real | Médio | **Sim** |
| Screenshots mobile | 🔴 AUSENTE | `e2e-screenshots/` só até "language"; nenhuma da calibragem | Baixo | — |
| Testes Playwright mobile | 🟡 PARCIAL | viewport iPhone existe, mas calibragem é pulada por seed | Médio | — |

**Resumo mobile:** infra forte e correta (dvh, viewport sync, safe-area, dropdown bottom-sheet z-9999 atado ao teclado). **Mas nada é provado por teste de teclado real** → **validação manual em iPhone é obrigatória** antes de aprovar a calibragem em produção.

---

# 9. Testes existentes e faltantes

| Teste | Existe? | Arquivo | Cobre o quê? | Status | Prioridade |
|---|---|---|---|---|---|
| memória backend | ✅ | `guto.integration.test.ts` | persistência, memoryAudit | ✅ | — |
| calibragem (campos) | 🟡 | indireto em `guto-diet/workout` | dados, não UI | 🟡 | P2 |
| campos proibidos (phone) | ✅ | `guto-memory-phone.test.ts` (2) | phone deletado | ✅ | — |
| foodRestrictions | ✅ | `guto-weekly-diet`/`guto-diet-generation` | exclusão | ✅ | — |
| biologicalSex | ✅ | `guto-biological-sex.test.ts` (6) | só female/male | ✅ | — |
| persistência após reload | 🟡 | `guto-consent` cobre conceito p/ consent | calibragem não tem e2e | 🟡 | P2 |
| usuário separado | ✅ | `guto-team-isolation.test.ts` (55) | isolamento | ✅ | — |
| dieta usando calibragem | ✅ | `guto-diet-generation` (8), `guto-diet-invalidation` (8) | BMR/restrições/invalidação | ✅ | — |
| treino usando calibragem | ✅ | `guto-workout.test.ts` (71), `guto-workout-video-gate` (27) | local/gate | ✅ (patologia fraca) | P2 |
| chat/memoryPatch | ✅ | `guto-contract-rules`, `guto.integration` | patch + auditoria | ✅ | — |
| proatividade usando calibragem | ✅ | `proactivity-resolver.test.ts` (23) | ciclo/confirmação | ✅ | — |
| mobile/keyboard/dropdown | 🔴 | — | nenhum | 🔴 | **P1 (teste)** |
| Playwright fluxo completo | 🔴 | `guto.spec.ts` pula calibragem por seed; 09–20 falham no intro (pré-existente) | — | 🔴 | **P1 (teste)** |

**Total backend nesta auditoria:** 26 suítes / ~318 testes verdes. **Lacuna real:** e2e/mobile do fluxo de calibragem.

---

# 10. Simulação de usuário real

Usuário: pt-BR, Will, 30, male, muscle_gain, intermediate→`consistent`/`returning`, home, 178cm, 82kg, Italy/Milano, dor no joelho, NÃO COMO lactose.

| Verificação | Status | Evidência | Risco |
|---|---|---|---|
| 1. Payload aceito | ✅ OK | ranges cobrem 30/178/82; `consistent` válido | Baixo |
| 2. Salva em GutoMemory | ✅ OK | `POST /guto/memory` + saveMemory | Baixo |
| 3. Reload mantém | ✅ OK | `getGutoMemory` + stage router backend-authoritative | Baixo |
| 4. Dieta evita lactose | ✅ OK | `food-catalog avoidIf: lactose_intolerance` | Baixo |
| 5. Treino evita agredir joelho | 🟡 PARCIAL | patologia é contexto do curador + conservador, **não** filtro duro | **Médio (segurança)** |
| 6. Treino respeita home | ✅ OK | `isCompatibleWithLocation` (filtro duro) | Baixo |
| 7. Chat sabe esses dados | ✅ OK | contexto de perfil + resumo de memória | Baixo |
| 8. Proatividade usa Milano | ✅ OK | `memory-enricher` clima por cidade | Baixo (externo/opcional) |
| 9. Mobile preenche sem quebrar | 🟡 PARCIAL | por código OK; **falta prova em iPhone real** | Médio |

> Nota: "intermediate" não é um valor do enum (`beginner|returning|consistent|advanced`); a UI força um dos válidos. Mapear "intermediário" → `consistent`/`returning` no teste mental.

---

# 11. Saída final

1. **Calibragem funciona ponta a ponta?** Sim — é memória viva real, não formulário cosmético.
2. **Todos os campos chegam ao backend?** Sim (12/12).
3. **Persistem em GutoMemory?** Sim, normalizados e por usuário.
4. **Campo salvo só no frontend?** Não (consent ERA; corrigido na Fase 2A).
5. **Campo esperado por dieta/treino não salvo?** Não — nomes canônicos batem.
6. **Dieta usa a calibragem?** Sim (BMR + país + foodRestrictions + invalidação).
7. **Treino usa a calibragem?** Sim — local (filtro duro), nível, objetivo, histórico, gate de vídeo; **patologia só como contexto** (ressalva).
8. **Chat usa e atualiza a memória?** Sim, com auditoria, confirmação de ambiguidade e honestidade de persistência.
9. **Proatividade usa a calibragem?** Sim — cidade/clima/feriados + eventos temporários com confirmação.
10. **Mobile parece seguro?** Sim por código (dvh, safe-area, dropdown z-9999 atado ao teclado), **não provado em iPhone real**.
11. **Teclado pode quebrar algo?** Risco baixo; pontos a confirmar: CTA da calibragem (scroll, não sticky) e pickers.
12. **Dropdown pode ficar atrás do teclado?** **Não** — overlay `fixed z-9999` com `max-h` = viewport ajustado pelo teclado; vars espelhadas no `<html>`.
13. **P0/P1 encontrados:**
    - **P1 (segurança):** patologia/lesão é contexto do curador, **não** filtro determinístico — risco de treino agressivo na região lesionada (item 10/§5). Contraria a raiz ("exercícios de alto estresse são removidos do catálogo").
    - **P1 (teste):** ausência de e2e/mobile do fluxo de calibragem (e os 09–20 falham no intro headless).
14. **P2/P3 encontrados:**
    - P2: range de peso 40–190 vs 30–300 (item 7); CTA calibragem scroll-dependente; pickers sem `inputMode` numérico; testes de calibragem dedicados.
    - P3: dead code `name-screen.tsx`/`agreement-screen.tsx`; duplicidade `trainingLevel`/`trainingStatus` e `trainingLocation`/`preferredTrainingLocation` (dívida técnica benigna); sem screenshots mobile.
15. **Menor correção segura:** transformar patologia em **filtro determinístico** no curador (ex.: tags de lesão → remover do pool exercícios de alto estresse da região), mantendo o contexto do LLM como reforço. É backend, isolado em `workout-curator.ts`. **Não corrigir agora** (fora de escopo desta auditoria e da Fase 2A).
16. **Calibragem pode ser aprovada?** **Sim, com 2 ressalvas:** (a) validação manual em iPhone do fluxo+teclado; (b) reconhecer o risco de patologia como contexto (P1 de segurança) a tratar quando o módulo de Treino for aberto.
17. **A Fase 2 pode avançar depois disso?** Sim — a calibragem como fonte viva está aprovada para seguir; os P1 acima são de **Treino** e de **QA mobile**, não da coleta/persistência da calibragem.
18. **O Will precisa conferir manualmente:** o fluxo calibragem no iPhone (teclado, dropdowns, CTA), e, ao abrir o módulo de Treino, validar que dor no joelho realmente adapta o treino.
19. **Como conferir pelo iPhone:** ver seção final.
20. **O que NÃO mexer ainda:** Fase 2A (consentimento), Treino, Dieta, Proatividade, XP/morte, painel, arena, percurso, GUTO Online, evolução. Esta foi auditoria.

---

## Quando o Will deve conferir no app

- **Exige validação manual agora?** Sim, para a parte **mobile/teclado/dropdown** da calibragem (Playwright não prova o teclado iOS). A parte de dados/persistência já está provada por testes backend (verdes).
- **Via qual canal?** **Dev Tunnel** apontando para o `npm run dev` local (`ngrok http 3000` / `cloudflared` / `vercel dev`), aberto no Safari do iPhone. (Vercel preview também serve, mas o dev local reflete o estado atual da branch `guto/fase-2a-consent`.)
- **Telas a abrir:** idioma → login → consentimento → nome → **calibragem** (foco principal) → pacto.
- **Campos a preencher:** sexo (chips), idade (picker), nível/objetivo/local (chips), altura/peso (pickers), **país + cidade** (SearchSelect com busca — abre teclado), **NÃO COMO** (texto — abre teclado), dor/patologia.
- **Observar no teclado:** ao focar **NÃO COMO** e a **busca de país/cidade**, o campo/lista deve subir acima do teclado; o conteúdo não pode ficar encoberto; o botão "Salvar Calibragem" deve ser alcançável por scroll.
- **Observar nos dropdowns:** o bottom-sheet de país/cidade/idade/peso/altura deve abrir **acima** do teclado, com as opções roláveis e não cortadas no rodapé.
- **Sinais de que está funcionando:** consegue preencher tudo e salvar; após **reload** o app vai direto ao sistema (não volta à calibragem); dieta gerada respeita lactose; treino em "home" não traz máquinas.
- **Sinais de que está quebrado:** lista de país/cidade abre atrás do teclado; CTA inacessível; campo de texto encoberto; após reload volta à calibragem (sinal de que o backend não persistiu).
- **Pode ser aprovada sem teste manual no iPhone?** **Não.** Há input de texto, dropdown/bottom-sheet, CTA dependente de scroll e safe area — pela regra desta fase, exige validação manual em iPhone real antes da aprovação final de mobile. A camada de **dados** (calibragem→memória→dieta/treino/chat/proatividade) **já pode ser considerada aprovada** com base nos testes backend verdes e nas evidências de código deste relatório.
