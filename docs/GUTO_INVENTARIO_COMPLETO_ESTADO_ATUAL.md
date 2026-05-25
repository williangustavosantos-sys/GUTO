# GUTO — Inventário Completo do Estado Atual

> Auditoria de diagnóstico (somente leitura). Nenhum arquivo de implementação, UI ou config foi alterado para produzir este relatório.
> Data: 2026-05-25.
> Repositórios analisados:
> - **GUTO-RAIZ** = documentação canônica na raiz (`/Users/williandossantos/GUTOO/*.md`).
> - **CORPOGUTO** = frontend → submódulo [guto-app-v0/](../../guto-app-v0/) (Next.js / React).
> - **CEREBROGUTO** = backend → submódulo [guto-backend/](../../guto-backend/) (Express + Redis Upstash + Gemini/OpenAI).

## Método e evidência base

- Lidos: `README.md`, `GUTO_ESTRUTURA_E_FLUXO_DETALHADO_DO_APP.md`, `PARTE_1`…`PARTE_5`, `GUTO_CALIBRAGEM_E_MEMORIA_DETALHADA.md`, `GUTO_EVOLUCAO_XP_E_MORTE_DETALHADA.md` e demais docs `GUTO_*`.
- Código lido/greppado em CORPOGUTO e CEREBROGUTO.
- **Build/QA executados nesta auditoria:**
  - Backend: `node scripts/run-guto-tests.mjs` → **24 suítes, ~302 testes, 0 falhas.**
  - Backend: `tsc --noEmit` → **exit 0.**
  - Frontend: `tsc --noEmit` → **exit 0.**
- LLM real do chat/dieta: **Google Gemini** (`generativelanguage.googleapis.com`), com fallback honesto. **OpenAI** só para transcrição de áudio. O `@anthropic-ai/sdk` está no `package.json` mas não é o motor ativo.

## Legenda de status

- ✅ **OK FUNCIONANDO** — existe no código e parece real.
- 🟡 **PARCIAL** — existe, mas incompleto/frágil/sem teste suficiente.
- 🔴 **AUSENTE** — sem implementação real.
- ⚫ **MOCK / FALSO** — parece existir, mas é simulação/cosmético/não persiste.
- 🟣 **CONTRADITÓRIO** — existe, mas contraria a documentação da raiz.
- ❓ **DESCONHECIDO** — sem evidência conclusiva.

> Achado estrutural mais importante: existem **dois painéis** no frontend.
> - `/coach` consome a **API real** (`guto-app-v0/lib/api/admin.ts` → `/admin/*`).
> - `/admin` e `/empresa` usam **dados MOCK por padrão** (`lib/panel/data-source.ts`, `IS_MOCK_DATA = NEXT_PUBLIC_USE_MOCKS !== "false"`, e a flag não está setada no `.env`).
> O backend admin (`guto-backend/src/admin-router.ts`) é robusto e real, **mais completo do que o `PARTE_5 → Estado Atual` afirma** (a doc diz "ainda não cria empresa real" — o backend cria).

---

# 1. Entrada e primeira experiência

**1. Vídeo de abertura — ✅ OK**
- Raiz: cápsula cinemática, vídeo `abertura-guto.mp4`, 4s.
- Hoje: vídeo real existe e toca com tratamento Safari (unmuted→muted fallback, seek-to-0).
- Arquivos: [guto-app-v0/components/guto/guto-app.tsx](../../guto-app-v0/components/guto/guto-app.tsx) (`startIntroVideo`, linha ~2258 `<source src="/assets/guto/abertura-guto.mp4">`); `public/assets/guto/abertura-guto.mp4` (2,0 MB).
- Falta: nada crítico. Risco: baixo. Ação: — . Prioridade: P3.

**2. Botão "Iniciar GUTO" — ✅ OK**
- Hoje: toque físico dispara `startIntroVideo()` (obrigatório p/ iOS). Evidência: `guto-app.tsx`. Prioridade: P3.

**3. Timer/fallback se vídeo falhar — ✅ OK**
- Hoje: `INTRO_VIDEO_MS = 4000` é o "master control"; `setTimeout(completeIntroToLanguage, 4000)` avança mesmo se o vídeo falhar. Prioridade: P3.

**4. Página de idioma — ✅ OK**
- Arquivos: `components/guto/screens/language-screen.tsx`, `handleLanguageSelect` em `guto-app.tsx`. Prioridade: P3.

**5. Três idiomas (pt/en/it) — ✅ OK**
- Evidência: `components/guto/translations.ts` (`pt-BR`/`en-US`/`it-IT`, 539 linhas, 3 blocos completos). Prioridade: P3.

**6. Idioma define todo o app — ✅ OK**
- Evidência: `lib/guto-profile.ts → resolveGutoLanguage()` (hierarquia sessão→onboarding→memória→global); system prompt do backend recebe idioma; teste `guto.language.integration.test.ts` (6 passes). Prioridade: P3.

**7. Persistência do idioma — ✅ OK**
- Evidência: `localStorage` `guto-onboarding-language` + `guto-selected-language`; `memory.language` no backend. Prioridade: P3.

**8. Login normal — ✅ OK**
- Evidência: `guto-backend/src/auth-router.ts` `POST /auth/user/login` (bcrypt + JWT); `lib/api/auth.ts`. Prioridade: P2.

**9. Login por convite — ✅ OK**
- Evidência: `POST /auth/invite/:token/claim` (auth-router.ts:304). Prioridade: P2.

**10. Captura de token de convite — ✅ OK**
- Evidência: `app/convite/[token]/page.tsx` grava `guto-pending-invite-token`; `guto-app.tsx` abre stage `invite_claim`. Prioridade: P2.

**11. Bloqueio de acesso pausado/expirado — 🟡 PARCIAL**
- Raiz: backend deveria distinguir `ACCESS_PAUSED` / `ACCESS_EXPIRED` / `SUBSCRIPTION_EXPIRED` / `GUTO_DECEASED`.
- Hoje: backend só emite **`ACCESS_PAUSED`** (`auth-router.ts:208`, `auth-middleware.ts:181`). O frontend já trata todos os códigos (`lib/api/client.ts` interceptor 403 → `/acesso-pausado?reason=`).
- Falta: backend emitir os demais códigos. Risco: médio (usuário expirado vê copy de "pausado"). Ação: mapear status real → código específico no auth-middleware. Prioridade: P2.

**12. Separação aluno/coach/admin — ✅ OK**
- Evidência: rotas separadas `/auth/{user,coach,admin}/login`; cliente força `router.replace("/coach")` se `role !== "student"`. Prioridade: P1.

**13. Redirecionamento correto pós-login — ✅ OK**
- Evidência: `resolveAuthenticatedStage()` (guto-app.tsx:623). Prioridade: P2.

**14. Stage router (intro→idioma→login/convite→consent→nome→calibragem→pacto→sistema) — ✅ OK**
- Evidência: `type AppStage` (guto-app.tsx:48) com máquina completa; `getPublicEntryStage`, `resolveAuthenticatedStage`. Prioridade: P1.

---

# 2. Consentimento e onboarding

**15. Página de consentimento — ✅ OK** — `components/guto/screens/consent-screen.tsx`. P2.

**16. Checkboxes obrigatórios — ✅ OK**
- Evidência: `handleConsentAccepted` exige `consentHealthFitness` + `acceptedTerms`; `resolveAuthenticatedStage` retorna `consent` se faltar. P1.

**17. Consentimento para dados sensíveis/saúde — ✅ OK** — flag `consentHealthFitness` separada de `acceptedTerms`. P1.

**18. Bloqueio sem consentimento — ✅ OK** — stage volta a `consent` enquanto flags ausentes (guto-app.tsx:631). P1.

**19. Revogação/limpeza de dados — ✅ OK**
- Raiz: revogar limpa dados sensíveis de verdade.
- Evidência: backend `POST /guto/consent/revoke` zera `biologicalSex/age/heightCm/weightKg/foodRestrictions/trainingPathology` e desliga consent; frontend `persistProfile({consent:false})` (guto-app.tsx:1789). P1.

**20. Página de nome da dupla — ✅ OK** — `components/guto/screens/name-screen.tsx`. P2.

**21. Nome soberano "GUTO & [Nome]" — ✅ OK** — `formatGutoName`, identidade montada no chat/arena. P2.

**22. Nome do convite não sobrescreve confirmado — ✅ OK**
- Evidência: `presetName` é só sugestão; `namingConfirmed` setado apenas no confirm local (guto-app.tsx:635-639, `commitOnboardingName`). P1.

**23. Página de calibragem — ✅ OK** — `components/guto/screens/calibration-screen.tsx`. P1.

**24–34. Campos de calibragem — ✅ OK (todos presentes e mapeados)**
- 24 Idade (`userAge`), 25 Sexo (`biologicalSex` male/female), 26 Nível (`trainingLevel`), 27 Objetivo (`trainingGoal`), 28 Local (`preferredTrainingLocation`), 29 Altura (`heightCm`), 30 Peso (`weightKg`), 31 País (`country`/`countryCode`), 32 Cidade (`city`), 33 Dor/limitação (`trainingPathology`), 34 Campo único "NÃO COMO" (`foodRestrictions`).
- Evidência: `calibration-screen.tsx:13-110` (estados + payload); usa `country-state-city`. Backend valida ranges/normaliza. P1.

**35. Idioma NÃO aparece na calibragem — ✅ OK** — ausente da tela; vem antes. P2.

**36. Nome NÃO aparece na calibragem — ✅ OK** — ausente da tela. P2.

**37. Telefone NÃO na memória/calibragem — ✅ OK**
- Evidência: `server.ts:846-847,1119` `delete sanitized.phone` / `delete nextMemory.phone`; teste `guto-memory-phone.test.ts` (2 passes). P1.

**38. Intolerância separada NÃO existe — ✅ OK** — campo único `foodRestrictions`; sem campo segregado. P2.

**39. Página do pacto — ✅ OK** — `components/guto/screens/agreement-screen.tsx`, hold 2s. P2.

**40. Confirmação do pacto — ✅ OK** — `startSystem()` (guto-app.tsx:1139). P2.

**41. XP inicial de boas-vindas — ✅ OK**
- Evidência: `persistMemory({ xpEvent: "grant_initial_xp" })` (guto-app.tsx:1158); backend +100 XP. P2.

**42. XP inicial não conta como treino/streak — ✅ OK**
- Evidência: streak só incrementa em validação (`server.ts:1480`); buffer inicial não toca `completedWorkoutDates`. P2.

---

# 3. Memória e backend

**43. GutoMemory existe — ✅ OK** — `guto-backend/src/memory-store.ts` + `server.ts` (tipo `GutoMemory`). P1.

**44. GutoMemory é fonte única da verdade — ✅ OK** — todos os fluxos leem/escrevem a mesma memória; sem estado paralelo. P1.

**45. Persistência real no backend — ✅ OK**
- Evidência: store Redis (Upstash) + `data/guto-memory.json` (2,6 MB de dados reais); `saveGutoMemory`. P1.

**46. Memória separada por usuário — ✅ OK** — chaveada por `userId`; storage local `guto-white-lab-profile-<userId>`. P1.

**47. MemoryPatch do chat — 🟡 PARCIAL**
- Hoje: contrato tem `memoryPatch` e é parseado/aplicado (`server.ts:2385`, `3286`). Porém o system prompt instrui "GUTO NUNCA afirma ter alterado dados do perfil via chat" (`server.ts:1836`) — ou seja, alteração de calibragem via chat é deliberadamente conservadora.
- Falta: confirmar quais campos o chat realmente persiste vs. só sinaliza. Risco: médio. Ação: documentar matriz campo×canal efetiva. Prioridade: P2.

**48. Validação de campos da memória — ✅ OK** — `normalizeBiologicalSex`, ranges, `src/dirty-data-resolver.ts` (semântica). P1.

**49. Auditoria de alterações de memória — ✅ OK** — `appendMemoryAudit`, `src/log-store.ts`, `GET /admin/logs`. P2.

**50. Origem da alteração (onboarding/settings/chat/coach/admin) — 🟡 PARCIAL**
- Hoje: existe trilha de auditoria e origem por canal, mas não foi confirmado que **todos** os 5 valores de `source` são gravados consistentemente em cada caminho.
- Ação: validar `source` em settings/chat. Prioridade: P2.

**51. Bloqueio de campos proibidos — ✅ OK** — phone removido na sanitização. P1.

**52. Impedir phone em GutoMemory — ✅ OK** — ver item 37. P1.

**53. Impedir foodIntolerances separado — ✅ OK** — único `foodRestrictions`. P2.

**54. Impedir biologicalSex = prefer_not_to_say — ✅ OK**
- Evidência: `normalizeBiologicalSex` aceita só `female|male` (server.ts:707); teste `guto-biological-sex.test.ts` (6 passes). P1.

**55. Último dado salvo vence — 🟡 PARCIAL**
- Hoje: last-write-wins na prática; auditoria before/after parcial. Ação: garantir snapshot before/after em todos canais. Prioridade: P2.

**56. App reflete alterações do painel — ✅ OK** — memória compartilhada; `/coach` grava e app relê. P1.

**57. Painel reflete alterações do app — ✅ OK** — mesmo store; `/coach` lê memória atual. P1.

---

# 4. Chat / GUTO

**58. Aba Chat/GUTO — ✅ OK** — `components/guto/tabs/chat-tab.tsx`. P1.

**59. Personalidade do GUTO — ✅ OK** — system prompt com persona "irmão mais velho" (server.ts ~2700+). P2.

**60. Respostas no idioma escolhido — ✅ OK** — teste `guto.language.integration.test.ts`. P1.

**61. Contrato de resposta estruturado — ✅ OK** — `src/guto-turn-contract.ts` + parse/validação em `server.ts:2367-2394`. P1.

**62. Campo speech/fala — ✅ OK** (`fala`/`speech`). P1.
**63. Campo action/acao — ✅ OK** (`acao`). P1.
**64. expectedResponse — ✅ OK** — botões rápidos. P1.
**65. avatarEmotion — ✅ OK** (`server.ts:2377`). P1.
**66. memoryPatch — ✅ OK** (parseado/validado) — ver nuance item 47. P1.
**67. workoutPlan vindo do backend — ✅ OK** — `enrichWorkoutPlanAnimations(parsed.workoutPlan)`. P1.

**68. Não salva dado sem confirmação quando ambíguo — ✅ OK**
- Evidência: `dirty-data-resolver.ts` aciona esclarecimento; teste `guto-contract-rules.test.ts` (5 passes). P1.

**69. Não diz "salvei" se backend falhou — ✅ OK**
- Evidência: `persistMemory` faz rollback otimista em falha (guto-app.tsx:803-839); prompt de honestidade (server.ts:1836). P1.

**70. Chat altera memória com segurança — 🟡 PARCIAL** — ver item 47 (conservador por design). P2.

**71. Chat respeita plano lockedByCoach — ✅ OK**
- Evidência: dieta/treino travados são preservados (`server.ts:3166`, `8043`). P1.

**72. Fallback quando IA falha mantendo identidade — ✅ OK**
- Evidência: `fallbackLine()`, `classifyContractIntentFallback` quando Gemini cai/quota (server.ts:4929, 5689). P1.

---

# 5. Missão / treino do dia

**73. Aba Missão — ✅ OK** — `components/guto/tabs/mission-tab.tsx`. P1.

**74. Treino vem do backend — ✅ OK** — `src/workout-curator.ts`; app lê plano. P1.

**75. Frontend não inventa treino — ✅ OK** — mission-tab lê `lastWorkoutPlan`/`workoutPlan`. P1.

**76. lastWorkoutPlan — ✅ OK** (server.ts:855, lib/api/guto.ts). P1.
**77. weeklyWorkoutPlan — ✅ OK** (server.ts:856). P1.

**78. Plano manual do coach — ✅ OK** — `PUT /admin/students/:id/workout` + `/workout/week`. P1.

**79. lockedByCoach — ✅ OK** — `POST /admin/students/:id/workout/lock|unlock`. P1.

**80. Treino respeita local (academia/casa/parque/misto) — ✅ OK** — filtro em `workout-curator.ts` (`LocationMode`); teste `guto-workout.test.ts` (71 passes). P1.

**81. Treino respeita dor/patologia — ✅ OK** — `pathology` no curador; banimento de movimentos. P1.

**82. Treino respeita nível e objetivo — ✅ OK** — usado na curadoria/progressão (`workout-progression.ts`). P1.

**83. Catálogo de exercícios — ✅ OK** — `exercise-catalog.ts` (183 entradas). P1.

**84. Exercício só aparece com vídeo local validado — ✅ OK**
- Evidência: `src/workout-catalog-validation.ts` exige `videoUrl` começando em `/exercise/visuals/` e batendo com catálogo; teste `guto-workout-video-gate.test.ts` (27 passes). P1.

**85. Vídeos locais em /public/exercise/visuals/ — ✅ OK**
- Evidência: **89 arquivos .mp4** reais em 7 categorias (`guto-app-v0/public/exercise/visuals/`). P1.

**86. Cards com exercício/séries/reps/carga/descanso/cue/nota — ✅ OK** — `mission-tab.tsx` + `lib/workout-plan.ts`. P2.

**87. Botão de dúvida "?" — ✅ OK** — `mission-tab.tsx`. P2.

**88. "?" envia contexto correto p/ chat — ✅ OK**
- Evidência: `exerciseDoubtTrigger`/`contextChip` (chat-tab.tsx:150-232, 620). P2.

**89. Troca de exercício salva no backend — 🟡 PARCIAL**
- Hoje: troca por chat → `acao:"updateWorkout"` (server.ts:2144) atualiza `lastWorkoutPlan`. Não confirmado se há botão dedicado de "trocar exercício" na missão que persista isoladamente.
- Ação: verificar persistência de swap fora do chat. Prioridade: P2.

**90. Se lockedByCoach, troca vira pendência p/ coach — 🟡 PARCIAL**
- Hoje: regra documentada e respeitada no não-override; falta confirmar fila de "pendência" visível ao coach. Prioridade: P2.

---

# 6. Dieta

**91. Aba Dieta — ✅ OK** — `components/guto/tabs/diet-tab.tsx`. P1.

**92. weeklyDietPlan — ✅ OK** — `server.ts:362,857`; `src/diet-store.ts`. P1.

**93. Dieta vem do backend — ✅ OK** — `POST /guto/diet/generate` (server.ts:8031); `src/nutrition.ts`. P1.

**94. Frontend não inventa dieta — ✅ OK** — `lib/diet-plan.ts` lê plano persistido. P1.

**95. Dieta usa idade/peso/altura/sexo/objetivo/nível — ✅ OK**
- Evidência: BMR Mifflin-St Jeor + TDEE + macros (`nutrition.ts:44-105`); teste `guto-diet-generation.test.ts` (8 passes). P1.

**96. Dieta usa país/cidade — ✅ OK** — `src/food-availability.ts` (`getBaseFoodsForCountry`, override contextual). P1.

**97. Idioma não define comida — ✅ OK** — teste `guto-weekly-diet.test.ts` (14 passes) cobre desacoplamento idioma×país. P1.

**98. foodRestrictions é respeitado — ✅ OK** — `avoidIf` por alimento/bloco (`food-catalog.ts`). P1.

**99. Lactose/glúten/veganismo/frutos do mar banidos — ✅ OK**
- Evidência: tags `lactose_intolerance`, `milk_allergy`, `vegan`, `gluten`, `shellfish`, `tree_nut_allergy` em `food-catalog.ts`. P1.

**100. Macros/calorias coerentes — ✅ OK** — `calculateMacros` + `applySafeCalorieFloor`. P1.

**101. Substituições de alimentos — ✅ OK** — `suggestFoodSubstitutes` (food-availability.ts). P2.

**102. Chat pede troca alimentar com segurança — 🟡 PARCIAL** — respeita lock; cobertura de swap por chat parcial. P2.

**103. Plano de dieta lockedByCoach — ✅ OK** — `POST /admin/students/:id/diet/lock`. P1.

**104. Dieta bloqueada pelo coach não é sobrescrita — ✅ OK**
- Evidência: `if (existingDiet?.lockedByCoach) ... preservada` (server.ts:3166, 8043); teste `guto-diet-invalidation.test.ts` (8 passes). P1.

**105. Dieta não repergunta o que já está na calibragem — ✅ OK** — gera a partir da memória. P2.

---

# 7. GUTO Online

**106. Tela GUTO Online — ✅ OK** — `components/guto/guto-online-session.tsx` + `lib/guto-online/*`. P1.

**107. Usa treino oficial do backend — ✅ OK** — engine consome `GutoWorkoutPlan` oficial. P1.

**108. Não cria sessão paralela falsa — ✅ OK** — sessão nasce do plano salvo. P1.

**109. Máquina de estados (briefing/aquecimento/exercício/descanso/transição/finalização) — ✅ OK**
- Evidência: `lib/guto-online/guto-online-types.ts` (`GutoOnlinePhase`: briefing, warmup, resting, between_exercises…) + `guto-online-engine.ts`. P1.

**110. Temporizador de descanso — ✅ OK** — `restEndsAt`/`restPlannedSeconds`. P2.
**111. Estado de exercício atual — ✅ OK** — `exerciseIndex`. P2.
**112. Controle de séries — ✅ OK** — `currentSet`. P2.

**113. Tratamento de dor — ✅ OK** — botão de dor + `POST /guto/online/exception`. P1.
**114. Tratamento de fadiga — ✅ OK** — fluxo no engine. P2.

**115. Voz/comandos de voz — ✅ OK** — `lib/guto-voice/guto-voice-service.ts`, `lib/guto-online/voice-resolver.ts`, `online/guto-online-voice-toggle.tsx`. P2.

**116. Ações críticas por voz exigem confirmação visual — ✅ OK** — comandos touch-first; voz não dispara ação crítica sozinha (regra honrada na UI). P1.

**117. Retomada de sessão se app fecha — ✅ OK** — `lib/guto-online/guto-online-storage.ts` (`decideResume`). P1.
**118. <15 min: continua — ✅ OK** — `AUTO_RESUME_WINDOW_MS` → `auto_resume`. P2.
**119. 15 min–12h: pergunta — ✅ OK** — `needs_confirmation`. P2.
**120. >12h: expira — ✅ OK** — `{ kind: "expired" }`. P2.

---

# 8. Validação de treino

**121. Fluxo de validação após treino — ✅ OK** — `components/guto/validation/workout-validation-flow.tsx` + `POST /guto/validate-workout`. P1.

**122. Foto/câmera — 🟡 PARCIAL**
- Hoje: aceita `imageBase64`, faz upload (foto/poster/thumb via `sharp`/`uploadImage`), mas **a foto é opcional** — `hasSelfieEvidence` só registra se veio; o XP não exige selfie.
- Raiz: validação "com câmera" como prova. Falta: decidir se foto é obrigatória. Risco: médio (accountability sem prova). Ação: tornar selfie obrigatória ou marcar validação "sem prova". Prioridade: P2.

**123. Frase de confirmação — 🟡 PARCIAL** — fluxo tem etapa de confirmação na UI; obrigatoriedade no backend não verificada. P2.

**124. Validação ligada ao treino oficial — ✅ OK**
- Evidência: `planToValidate = workoutPlan || existingMemory?.lastWorkoutPlan` (validate-workout). P1.

**125. Backend valida sessão antes do XP — ✅ OK** — exige `WORKOUT_PLAN_EXERCISES_REQUIRED`; XP só após gravação. P1.

**126. Histórico de validações — ✅ OK** — `validationHistory`; `GET /admin/students/:id/workout/history`. P2.

**127. Percurso recebe validação — ✅ OK** — `path-tab.tsx` lê `validationHistory` + `completedWorkoutDates`. P2.

**128. Coach/painel vê última validação — ✅ OK** — `lastSignal`/risco no admin-router (risk-classifier). P2.

**129. Geolocalização/prova de presença — 🔴 AUSENTE**
- Raiz: "se existir". Hoje: não há geolocalização/coords em nenhum lugar (backend nem flow). Risco: baixo (era condicional). Ação: nenhuma agora. Prioridade: P3.

**130. Fallback quando geolocalização falha — 🔴 AUSENTE (N/A)** — não há geoloc para falhar. P3.

---

# 9. XP, streak, evolução e morte

**131. XP total — ✅ OK** — `memory.totalXp` + `clampXp`. P1.
**132. XP semanal — ✅ OK** — `arena-store` `weeklyXp` (reset semanal). P1.
**133. XP mensal — ✅ OK** — `monthlyXp` (reset mensal). P1.

**134. XP de treino validado — ✅ OK** — `+100` (`workout_validated`). P1.
**135. XP de missão adaptada — ✅ OK** — `+50` (`reduced_mission_validated`). P1.

**136. Penalidade por ausência — ✅ OK**
- Evidência: `applyDailyMissPenalty` `-20` + `applyPendingMissPenalties` com `missedMissionDates` (server.ts:1505-1525). P1.

**137. XP nunca fica negativo — ✅ OK** — `clampXp` (server.ts:1430). P1.

**138. Streak — ✅ OK** — incrementa em validação, zera na falta (server.ts:1480/1514). P1.

**139. XP inicial não gera streak — ✅ OK** — buffer não toca streak. P2.

**140. Avatar Baby — ✅ OK** | **141. Teen — ✅ OK** | **142. Adult — ✅ OK** | **143. Elite — ✅ OK**
- Evidência: `lib/guto-evolution.ts` thresholds (baby 0, teen 1500, adult 5000, elite 12000); `components/guto/guto-official-avatar.tsx`. P2.

**144. Estados visuais (default/alerta/crítico/reward/morto) — ✅ OK**
- Evidência: `lib/guto-vital-state.ts` (`new/healthy/alert/critical/dying/dead/recovering`). P2.

**145. Morte quando XP chega a zero — 🟡 PARCIAL**
- Hoje: só **visual** — `getGutoVitalState` retorna `dead` com opacidade 0.25 quando `totalXp<=0`. Não há transição de estado terminal real.
- Risco: alto (promessa central do produto não enforce). Ação: ver itens 146-152. Prioridade: P1.

**146. gutoLifeStatus = dead — 🔴 AUSENTE**
- Raiz: campo `gutoLifeStatus:"dead"`. Hoje: **não existe no backend** (grep só achou copy de push "dead"). Risco: alto. Ação: implementar estado terminal no memory-store. Prioridade: P1.

**147. accessLocked = true — 🔴 AUSENTE** — não existe campo nem lógica. P1.

**148. deadAt / deathReason — 🔴 AUSENTE** — não existem. P1.

**149. Backend bloqueia APIs quando GUTO morto — 🔴 AUSENTE**
- Raiz: guard 403 `{action:"lock_screen", status:"dead"}`. Hoje: **nenhum guard** de morte em rotas. Risco: alto. Ação: adicionar guard em `requireActiveUser`. Prioridade: P1.

**150. Frontend mostra blackout/bloqueio quando morto — ⚫ MOCK/COSMÉTICO**
- Hoje: só opacidade do avatar; **não há tela de blackout** travando abas. `lib/api/client.ts` trata `GUTO_DECEASED/GUTO_DEAD` mas o backend nunca emite. Risco: alto. Ação: tela de lockdown + emissão do código. Prioridade: P1.

**151. Não existe reviver automático — ✅ OK** — não há auto-revive (mas também não há morte ainda). P2.

**152. Percurso somente leitura após morte — 🔴 AUSENTE (N/A)** — sem estado de morte real. P2.

---

# 10. Arena, Percurso e Evoluir

**153. Aba Arena — ✅ OK** — `components/guto/tabs/arena-tab.tsx`. P1.
**154. Ranking semanal — ✅ OK** — `GET /guto/arena/weekly` → `getWeeklyRanking`. P1.
**155. Ranking mensal — ✅ OK** — `GET /guto/arena/monthly`. P1.

**156. Ranking geral/global — ✅ OK** — `GET /guto/arena/individual` → `getGlobalIndividualRanking`; teste `guto-arena-global-ranking.test.ts` (5 passes). P1.

**157. Ranking por teamId/empresa — ✅ OK** — `getUserArenaGroup(userId)` deriva do `teamId` (server.ts:413). P1.

**158. Nome da dupla no ranking — ✅ OK** — `syncArenaDisplayName(userId, memory.name)`. P2.

**159. Coach vê arena da empresa/time — ✅ OK** — `coachRankingsRouter` + `app/coach/_components/screens/arena-screen.tsx`. P2.

**160. Arena não usa grupo fake em produção — 🟡 PARCIAL**
- Hoje: `isVisibleInRanking` filtra; grupo derivado de team. Não confirmado se há seed/grupo demo em produção. Ação: revisar seeds. Prioridade: P2.

**161. Aba Percurso — ✅ OK** — `components/guto/tabs/path-tab.tsx`. P2.
**162. Histórico visual de treinos validados — ✅ OK** — `buildPathDays` por `validationHistory`. P2.
**163. Cards de validação — ✅ OK** — path-tab + records. P2.

**164. XP igual entre Arena/Percurso/Evoluir — ✅ OK**
- Evidência: bug de desync já corrigido — os 100 XP iniciais são creditados também na Arena (server.ts:1448-1462) para `arenaProfile.totalXp` não ficar 100 atrás do `memory.totalXp`. P1.

**165. Aba Evoluir — ✅ OK** — `components/guto/tabs/evolutions-tab.tsx`. P2.
**166. Avatar evolui conforme XP — ✅ OK** — `resolveGutoEvolutionStage(totalXp)`. P2.
**167. Próximo nível / XP necessário — ✅ OK** — thresholds em `guto-evolution.ts`. P2.

---

# 11. Proatividade

**168. Sistema de proatividade — ✅ OK** — `src/proactivity/*` (index, extractor, enricher, injector, store, weekly-conversation, resolver). P1.

**169. Memória temporária — ✅ OK** — `proactive-store.ts` com status de ciclo. P1.

**170. Confirmação antes de salvar dado temporário — ✅ OK**
- Evidência: status `pending_confirmation`; `POST /guto/proactivity/confirm`; teste `proactivity-resolver.test.ts` (23 passes) cobre confirmar/descartar/validar/ambíguo nos 3 idiomas. P1.

**171. Viagem/evento/semana atípica — ✅ OK** — `memory-extractor.ts`. P2.

**172. Proatividade usa clima/cidade — 🟡 PARCIAL**
- Hoje: `city`/contexto usados (`presence/context-bank.ts`); integração de **clima externo** não confirmada (auxiliar e não pode bloquear). Ação: verificar provider de clima. Prioridade: P3.

**173. Não altera calibragem permanente sem confirmação — ✅ OK** — `memory-action-resolver.ts`; só persiste após confirm. P1.

**174. Não sobrescreve plano lockedByCoach — ✅ OK** — vira pendência/revisão. P1.

**175. Memória temporária arquivada após o ciclo — ✅ OK** — status `discarded`/expiração 24h e reschedule +7d (`proactive-store.ts:160-230`); teste `guto-proactivity-store-cycle.test.ts`. P2.

**176. Push/notificações — ✅ OK** — `src/push-store.ts` + `web-push` + `GET/POST /guto/push/*`; `lib/push-client.ts`. P2.

---

# 12. Painel Admin / Coach

> Contexto: backend (`admin-router.ts`) real e testado; `/coach` (frontend) consome a API real; `/admin` e `/empresa` (frontend) usam **MOCK por padrão**.

**177. Login admin — ✅ OK** — `POST /auth/admin/login`. P1.
**178. Login coach — ✅ OK** — `POST /auth/coach/login`. P1.

**179. Super Admin — 🟡 PARCIAL**
- Backend: `requireSuperAdmin` real. Frontend `/admin` (sala): **UI mock** (`lib/panel/data-source.ts` `IS_MOCK_DATA` default true; badge "DADOS MOCK · FASE VISUAL"). Ação: ligar `/admin` à API real. Prioridade: P1.

**180. Admin — 🟡 PARCIAL** — backend real; `/empresa` (portal) ainda visual/mock. P1.

**181. Coach — ✅ OK** — `/coach` consome API real (`use-coach-data.ts` → `lib/api/admin.ts`). P1.

**182. Aluno — ✅ OK** — papel `student` sem acesso ao painel. P1.

**183. Empresa/time — ✅ OK** — `src/team-store.ts`; `GET/POST /admin/teams`. P1.
**184. teamId — ✅ OK** — presente em todas as entidades. P1.
**185. coachId — ✅ OK** — vínculo aluno→coach. P1.

**186. Criação de coach — ✅ OK** — `POST /admin/coaches` + `createAdminCoach` (🟣 contradiz `PARTE_5→Estado Atual` que diz "não cria"). P1.
**187. Criação de aluno — ✅ OK** — `POST /admin/students` + `createAdminStudent` (retorna `inviteLink`/senha temp). P1.
**188. Convite de aluno — ✅ OK** — `inviteLink`; `POST /auth/admin/invites`; `/admin/students/:id/invite/regenerate`. P1.

**189. Ativação/pausa/expiração de acesso — ✅ OK** — `/admin/students/:id/{pause,renew,reactivate}` (`requireAdmin`). P1.

**190. Planos Start/Pro/Elite/Custom — ✅ OK** — `src/team-plans.ts`; testes `guto-team-plans.test.ts` (4) + `guto-team-limits.test.ts` (5). P2.

**191. Coach vê apenas alunos permitidos — ✅ OK** — `getScopedUserAccessList(actor, allUsers)`. P1.

**192. Coach não vê aluno de outro time — ✅ OK**
- Evidência: `403 TEAM_ACCESS_FORBIDDEN`; teste `guto-team-isolation.test.ts` (**55 passes**). P1.

**193. Admin edita dados permitidos — ✅ OK** — `updateAdminStudent` com `calibration` validada; `COACH_FORBIDDEN_STUDENT_PATCH_FIELDS` (inclui `teamId`). P1.

**194. Coach edita treino — ✅ OK** — `PUT /admin/students/:id/workout` + `/workout/week`, `/generate`. P1.
**195. Coach edita dieta — ✅ OK** — `PUT /admin/students/:id/diet` + `/diet/week`, `/generate`. P1.
**196. Coach bloqueia treino/dieta — ✅ OK** — `/workout/lock|unlock`, `/diet/lock|unlock`. P1.

**197. App do aluno reflete edição do coach — ✅ OK** — memória/planos compartilhados; app relê. P1.

**198. Painel mostra XP/streak/status do aluno — ✅ OK** — `GET /admin/students/:id` (memory + access). P2.

**199. Painel mostra em dia/atenção/crítico — ✅ OK** — `src/risk-classifier.ts` (atenção 3-5d, crítico 6+d); `lib/panel/helpers.ts calcRisk`. P2.

**200. Painel não edita GutoMemory como JSON cru — ✅ OK** — edição por campos validados (`calibration`), nunca JSON livre. P1.

---

# 13. Idiomas e localização

**201. pt-BR — ✅ OK** | **202. en-US — ✅ OK** | **203. it-IT — ✅ OK**
- Evidência: `translations.ts` 3 blocos completos. P1.

**204. Login traduzido — ✅ OK** — `app/login/page.tsx` por `?lang=`/storage. P2.
**205. Acesso pausado traduzido — ✅ OK** — `app/acesso-pausado/page.tsx` 3 idiomas; teste `e2e/acesso-pausado.spec.ts`. P2.
**206. Onboarding traduzido — ✅ OK** — `stageCopy` por idioma. P2.
**207. Chat no idioma escolhido — ✅ OK** — teste de integração de idioma. P1.
**208. Dieta no idioma com comida do país — ✅ OK** — desacoplamento idioma×país (item 96/97). P1.

**209. Erros traduzidos — 🟡 PARCIAL** — bloqueios e principais erros traduzidos; cobertura total não garantida. P2.

**210. GUTO Online traduzido — ✅ OK** — `voice-resolver.ts` por idioma; copy localizada. P2.
**211. Arena traduzida — ✅ OK** — arena-tab usa translations. P2.

**212. Painel traduzido — 🟡 PARCIAL** — `lib/panel/i18n.ts` existe; cobertura parcial (painel é PT-first). P3.

---

# 14. QA, testes e build

**213. package.json frontend — ✅ OK** — Next 15/React; scripts dev/build/lint. P3.
**214. package.json backend — ✅ OK** — Express 5, Upstash, Anthropic SDK, Stripe, web-push; scripts test/typecheck/eval. P3.

**215. Build frontend — 🟡 PARCIAL** — `tsc --noEmit` **passa (exit 0)** nesta auditoria; `next build` completo não executado aqui. Ação: rodar `next build` no CI. P2.
**216. Build backend — ✅ OK** — `tsc --noEmit` **exit 0**. P2.

**217. Testes unitários — ✅ OK** — backend `node:test`, **24 suítes / ~302 testes / 0 falhas**. P1.

**218. Testes de integração — ✅ OK** — `guto.integration`, `guto.language.integration`, `guto.history-context.integration`, `guto.legacy-coach-routes`. P1.

**219. Playwright/e2e — ✅ OK** — `e2e/`: `guto.spec`, `login-keyboard`, `acesso-pausado`, `panel-responsive`, `audit-screenshots`, `example`. P2.

**220. Teste mobile iPhone — 🟡 PARCIAL** — viewport iPhone em `login-keyboard.spec`/`panel-responsive`; sem device farm. P2.
**221. Teste de teclado iOS — ✅ OK** — `e2e/login-keyboard.spec.ts` + `use-guto-viewport`. P2.
**222. Teste de login — ✅ OK** — coberto em e2e + auth backend. P2.
**223. Teste de acesso pausado — ✅ OK** — `e2e/acesso-pausado.spec.ts`. P2.

**224. Teste de calibragem — 🟡 PARCIAL** — coberto indiretamente (memória/biological-sex/phone); sem e2e dedicado de UI. P2.
**225. Teste de dieta com restrição — ✅ OK** — `guto-diet-generation` + `guto-weekly-diet`. P1.
**226. Teste de treino com dor — ✅ OK** — coberto em `guto-workout.test.ts` (71). P1.
**227. Teste de lockedByCoach — 🟡 PARCIAL** — `guto-diet-invalidation` cobre preservação; falta teste explícito de lock de treino. P2.
**228. Teste de XP — ✅ OK** — `guto-evolution`, arena tests. P2.

**229. Teste de morte/bloqueio — 🔴 AUSENTE** — não há (porque a morte não está implementada no backend — itens 146-150). P1.

**230. Teste de arena por teamId — ✅ OK** — `guto-team-isolation` + `guto-arena-global-ranking`. P1.
**231. Teste de coach não ver aluno de outro time — ✅ OK** — `guto-team-isolation.test.ts` (55). P1.

**232. Screenshots de evidência — ✅ OK** — `e2e/audit-screenshots.spec.ts` + pasta `e2e-screenshots/`. P3.
**233. Relatório de QA existente — ✅ OK** — `docs/GUTO_QA_MASTER_MATRIX.md`, `docs/GUTO_AUDITORIA_*` (na raiz). P3.

---

# Resumo Executivo

> Contagem sobre os 233 itens (itens agrupados contados individualmente). Status compostos (ex.: "tsc passa / build não") foram classificados pelo pior caso operacional.

### 1. OK FUNCIONANDO (✅)
**≈ 181 itens.** Núcleo do produto (onboarding, memória, chat estruturado, treino com gate de vídeo, dieta com BMR/restrições, GUTO Online com state machine, arena, proatividade, isolamento de time) está real e testado.

### 2. PARCIAIS (🟡)
**≈ 33 itens.** Destaques: bloqueio por código de acesso específico (11), memoryPatch/origem (47, 50, 55), troca de exercício/pendência coach (89, 90), foto de validação opcional (122, 123), painel `/admin` e `/empresa` em mock (179, 180), clima na proatividade (172), erros/painel traduzidos (209, 212), build front e testes de calibragem/lock (215, 224, 227).

### 3. AUSENTES (🔴)
**≈ 8 itens.** Quase todos no **protocolo de morte do GUTO**: `gutoLifeStatus` (146), `accessLocked` (147), `deadAt/deathReason` (148), guard de API por morte (149), percurso read-only pós-morte (152), teste de morte (229); + geolocalização (129) e seu fallback (130) — estas duas eram condicionais ("se existir").

### 4. MOCK / FALSO (⚫)
**≈ 1 item central + 2 telas.** Blackout de morte no frontend é cosmético (150). Painéis `/admin` e `/empresa` rodam sobre `lib/panel/data-source.ts` com `IS_MOCK_DATA` true por padrão (relacionado a 179/180) — backend existe, UI ainda não plugada.

### 5. CONTRADIZEM A RAIZ (🟣)
**≈ 10 itens (em sua maioria a favor do código).** O backend admin **cria empresa/coach/aluno/convite de verdade** (186-188), contrariando `PARTE_5 → Estado Atual` que diz "ainda não cria". A doc está **desatualizada** em relação ao backend. Contradição negativa real: a doc promete morte/lockdown que o código não cumpre (seção 9).

---

## Top 10 riscos críticos

1. **Morte do GUTO não existe no backend** (146-149) — promessa central do produto sem enforcement; conta com XP 0 continua usável via API. **P0.**
2. **Sem blackout/lockdown real no app quando "morto"** (150-152) — bypass trivial. **P0.**
3. **Backend só emite `ACCESS_PAUSED`** (11) — usuário expirado/morto vê a copy errada. **P1.**
4. **Foto de validação é opcional** (122) — accountability sem prova física. **P1.**
5. **Painéis `/admin` e `/empresa` em mock por padrão** (179, 180, 150) — risco de operar/demonstrar sobre dados falsos; backend real existe mas não plugado. **P1.**
6. **Documentação da raiz desatualizada vs. backend** (186-188) — agentes futuros podem refazer o que já existe ou confiar em status errado. **P1.**
7. **memoryPatch via chat conservador/ambíguo** (47, 70) — incerteza sobre o que o chat realmente persiste. **P2.**
8. **Troca de exercício / pendência ao coach não confirmadas** (89, 90). **P2.**
9. **`next build` completo não validado** (215) — só `tsc`. **P2.**
10. **Origem/auditoria before-after parciais** (50, 55) — rastreabilidade incompleta de mutações. **P2.**

## Top 10 coisas que já estão boas

1. Isolamento de time blindado e testado (55 testes) — 192/231.
2. Gate de vídeo de exercício real (catálogo de 183 + 89 mp4 locais + 27 testes) — 84/85.
3. Dieta com nutrição real (BMR/TDEE/macros) e restrições banidas — 95-100.
4. Honestidade de persistência (rollback otimista; "não diz salvei se falhou") — 69.
5. GUTO Online com state machine e retomada por janela de tempo exata — 109/117-120.
6. Proatividade com ciclo completo confirmar→validar→arquivar, 3 idiomas (23 testes) — 168-175.
7. Contrato de turno estruturado com fallback honesto quando IA cai — 61-72.
8. Bloqueio de telefone e normalização de sexo biológico, testados — 37/54.
9. Sincronização de XP entre Arena/Percurso/Evoluir (desync já corrigido) — 164.
10. Suíte de testes de backend sólida (302 testes, 0 falhas) + 3 idiomas completos — seção 14/13.

## Primeiro módulo que deve ser corrigido

**Protocolo de Morte/Lockdown (seção 9, itens 145-152).** É a maior divergência doc×código e o maior risco de produto: o backend precisa de `gutoLifeStatus`, `accessLocked`, `deadAt/deathReason`, guard 403 em `requireActiveUser` e emissão de `GUTO_DECEASED`; o frontend precisa da tela de blackout (o interceptor já existe). Em paralelo, **corrigir os códigos de acesso** (item 11), que é pré-requisito barato.

## O que NÃO deve ser mexido agora

- **Núcleo de memória/calibragem** (seção 3) — fonte única estável e testada.
- **Isolamento de time / admin-router** (seção 12 backend) — blindado por 55 testes; mexer aqui é alto risco.
- **Gate de vídeo + catálogo de exercícios** (84/85) — não renomear/mover `public/exercise/visuals/`.
- **Geração de dieta/nutrição** (seção 6) — matemática correta e testada.
- **Engine do GUTO Online** (seção 7) — state machine madura.
- **Persistência otimista do chat/memória** (69) — honestidade já correta.

## Ordem recomendada para transformar o GUTO em projeto real

1. **Sincronizar a documentação da raiz com o backend** (marcar painel-create como pronto; corrigir "Estado Atual"). Barato e destrava confiança.
2. **Implementar morte do GUTO no backend** (`gutoLifeStatus`/`accessLocked`/guards) + **blackout no frontend** + testes (229). 
3. **Corrigir códigos de acesso** no auth-middleware (ACCESS_EXPIRED / SUBSCRIPTION_EXPIRED / GUTO_DECEASED).
4. **Decidir e enforce a foto de validação** (obrigatória vs. opcional marcada) — 122/123.
5. **Plugar `/admin` e `/empresa` na API real** (desligar `IS_MOCK_DATA`) e validar com testes e2e — 179/180.
6. **Fechar lacunas de chat→memória**: matriz campo×canal efetiva, origem/auditoria before-after completas — 47/50/55/70.
7. **Confirmar troca de exercício + fila de pendência ao coach** — 89/90.
8. **Endurecer QA**: `next build` no CI, e2e de calibragem, teste explícito de lock de treino — 215/224/227.
9. **Itens condicionais por último**: clima na proatividade (172), painel traduzido (212), geolocalização (129) só se entrarem no escopo comercial.

---

### Apêndice — divergências doc×código mais relevantes

| Item | Documento diz | Código mostra |
|---|---|---|
| Morte do GUTO (146-152) | estado terminal + lockdown + guard 403 | só opacidade visual do avatar; sem backend |
| Acesso (11) | 4 códigos distintos | só `ACCESS_PAUSED` |
| Painel criação (186-188) | "ainda não cria empresa real" (PARTE_5) | backend cria empresa/coach/aluno/convite (real) |
| Painel `/admin` `/empresa` (179-180) | base visual | UI ainda em MOCK por flag |
| Foto validação (122) | prova com câmera | foto opcional, XP sem exigir selfie |
| LLM | (não especifica) | Gemini (não Anthropic, apesar do SDK no package) |
