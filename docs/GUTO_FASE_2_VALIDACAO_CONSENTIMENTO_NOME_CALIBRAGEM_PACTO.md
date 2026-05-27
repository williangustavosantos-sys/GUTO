# GUTO — Fase 2: Validação Consentimento, Nome, Calibragem e Pacto

## Fonte da raiz
- GUTO-RAIZ/PARTE_2_CONSENTIMENTO_NOME_CALIBRAGEM_PACTO.md
- GUTO-RAIZ/GUTO_CALIBRAGEM_E_MEMORIA_DETALHADA.md

## Regra
Auditoria de diagnóstico.
Não corrigir código nesta etapa.
Nenhum arquivo de implementação pode ser alterado.
Escopo restrito à Fase 2 (consentimento, nome, calibragem, pacto, GutoMemory e mobile dessas telas).
Não tocar: morte/lockdown, XP além do inicial, dieta, treino, GUTO Online, painel, proatividade, arena, percurso, evolução, item 19 da Fase 1.

> Repos: **CORPOGUTO** = `guto-app-v0/` · **CEREBROGUTO** = `guto-backend/`. Caminhos relativos à raiz do workspace.
> Estado dos repos no início da auditoria: ambos limpos (só `.codex/` untracked no front, ignorado). Nenhuma alteração de implementação pendente — auditoria não contaminada.

## Status da correção autorizada (Fase 2A — Item 6) — 2026-05-25

- ✅ **Item 6 CORRIGIDO** — o aceite de consentimento agora é persistido no **backend** (GutoMemory é a fonte de verdade; localStorage vira apenas cache/UX).
- Branches: frontend `guto/fase-2a-consent` (a partir de `fix/hard-stabilization-p0`); backend `guto/fase-2a-consent` (empilhada em `guto/fase-1-access-blocking`).
- Arquivos alterados:
  - **CEREBROGUTO:** `server.ts` (campos de consent no tipo `GutoMemory` + incluídos em `getMemory` para sobreviverem à normalização e aparecerem no `GET /guto/memory`; novo endpoint `POST /guto/consent/accept` espelhando o `/revoke`); `src/log-store.ts` (ação `consent_accepted`); `tests/guto-consent.test.ts` (novo, 6 casos).
  - **CORPOGUTO:** `lib/api/guto.ts` (campos de consent no tipo + `acceptGutoConsent()`); `components/guto/guto-app.tsx` (`handleConsentAccepted` async com **falha honesta** — não avança se o backend falhar; `resolveAuthenticatedStage` lê consent do backend, igual à calibragem; helper `hasMemoryConsent`); `components/guto/screens/consent-screen.tsx` (prop `errorMessage` + exibição); `e2e/guto.spec.ts` (consent no `mockMemory`).
- Comportamento garantido: backend salva o aceite; `GET /guto/memory` devolve o consentimento; **reload não volta para a tela de consent** (stage router lê o backend); **revogação continua funcionando**; se o backend falhar, o app **não finge** que salvou (mostra erro e fica na tela).
- **Não** implementado `GUTO_DECEASED`/morte (fora de escopo). Nada de calibragem/dieta/treino/XP/painel tocado.
- Validação executada:
  - Backend `tsc --noEmit` → **exit 0**; `node scripts/run-guto-tests.mjs` → **26 suítes / ~318 testes / 0 falhas** (inclui `guto-consent` 6/6).
  - Frontend `tsc --noEmit` → **exit 0**.
  - Playwright `e2e/guto.spec.ts` + `e2e/login-keyboard.spec.ts` (após `npx playwright install chromium`): **12 passam, 10 falham**. As 10 falhas são os testes de "sistema autenticado" (09–20) e foram **comprovadamente pré-existentes** nesta branch — o app trava no **intro** em headless chromium, antes do consentimento; o teste 09 **também falha no código limpo (sem esta correção)**. Os testes de idioma/login/consent-relevantes (01–08 + login-keyboard) **passam**.

### Achado estrutural que muda a leitura desta fase
Existem **componentes standalone que NÃO são usados**: `components/guto/screens/name-screen.tsx` e `components/guto/screens/agreement-screen.tsx` **não são importados em lugar nenhum**. As telas reais de **Nome** e **Pacto** são renderizadas **inline** dentro de `components/guto/guto-app.tsx` (stages `naming` e `pact`). Auditar os arquivos standalone levaria a conclusões erradas. Esta auditoria valida as versões **inline reais**. (Consentimento e Calibragem, ao contrário, usam componentes reais: `consent-screen.tsx` e `calibration-screen.tsx`.)

---

## Checklist da fase

| # | Item | Exigência da raiz | Código encontrado | Status | Evidência | Risco | Teste existente | Correção necessária |
|---|---|---|---|---|---|---|---|
| 1 | Página de consentimento existe | Tela de consentimento legal/saúde | `ConsentScreen` real, usada no stage `consent` | ✅ OK | `components/guto/screens/consent-screen.tsx`; `guto-app.tsx:2352` | Baixo | Não (e2e pula) | Nenhuma |
| 2 | Consentimento depois de login/convite | Ordem: login→consent→… | `resolveAuthenticatedStage` retorna `consent` antes de naming | ✅ OK | `guto-app.tsx:631-633` | Baixo | Não | Nenhuma |
| 3 | Checkboxes obrigatórios | 2 checkboxes ativos liberam CTA | `checkHealth`+`checkTerms`; `canContinue = ambos` | ✅ OK | `consent-screen.tsx:125-127, 232-233` | Baixo | Não | Nenhuma |
| 4 | Cobre dados sensíveis/saúde | Autorização de dados de saúde | Checkbox `checkHealth` específico | ✅ OK | `consent-screen.tsx:41, 194` | Baixo | Não | Nenhuma |
| 5 | Não avança sem consentir | Bloqueio sem aceite | CTA `disabled` até ambos; stage volta a `consent` | ✅ OK | `consent-screen.tsx:233`; `guto-app.tsx:631` | Baixo | Não | Nenhuma |
| 6 | Consentimento salvo no backend | Aceite deve constar no banco | **CORRIGIDO:** `POST /guto/consent/accept` persiste no backend; `getMemory`/`GET /guto/memory` expõem; stage router lê o backend; falha honesta no front | ✅ OK FUNCIONANDO (corrigido 2026-05-25) | backend `server.ts` (`/guto/consent/accept`, getMemory, tipo); `lib/api/guto.ts acceptGutoConsent`; `guto-app.tsx handleConsentAccepted` + `resolveAuthenticatedStage`; `consent-screen.tsx` errorMessage | Baixo (resolvido) | `tests/guto-consent.test.ts` (6/6): aceite persiste, GET reflete (reload), revoke continua, sem-consent ≠ consentido, sem vazamento entre usuários | Nenhuma |
| 7 | Revogação/limpeza existe | Revogar limpa dados sensíveis de verdade | `POST /guto/consent/revoke` zera campos sensíveis + flag off; UI em settings | ✅ OK | `server.ts:6616-6639`; `guto-app.tsx` settings `privacyRevoke` | Baixo | Backend (manual) | Nenhuma |
| 8 | Página de nome existe | Tela de naming | **Inline** no stage `naming` (não o standalone) | ✅ OK | `guto-app.tsx:2360-2448` | Baixo | Não | Nenhuma (limpar dead code `name-screen.tsx` é P3) |
| 9 | Nome soberano "GUTO & [Nome]" | Identidade da dupla | Lockup GUTO + `&` + `draftName` ao vivo | ✅ OK | `guto-app.tsx:2376-2391` (`guto-name-lockup`) | Baixo | Não | Nenhuma |
| 10 | Nome do convite é só sugestão | `presetName` não oficializa | Convite só guarda token; nome confirmado pelo aluno | ✅ OK | `app/convite/[token]/page.tsx`; `commitOnboardingName` | Baixo | Não | Nenhuma |
| 11 | Convite não sobrescreve confirmado | `namingConfirmed` local manda | `resolveAuthenticatedStage` exige nome confirmado neste device | ✅ OK | `guto-app.tsx:635-639` | Baixo | Backend team-isolation (indireto) | Nenhuma |
| 12 | Nome confirmado salvo | Persistir nome soberano | `commitOnboardingName` → `persistMemory({name, confirmedName})` + `persistProfile({namingConfirmed})` | ✅ OK | `guto-app.tsx:1330-1349` | Baixo | Não (e2e) | Nenhuma |
| 13 | Nome não é campo da calibragem | Naming separado | `calibration-screen` não tem campo nome | ✅ OK | `calibration-screen.tsx` (sem nome) | Baixo | Não | Nenhuma |
| 14 | Página de calibragem existe | Tela de calibragem | `CalibrationScreen` real, stage `calibration` | ✅ OK | `calibration-screen.tsx`; `guto-app.tsx:2450-2463` | Baixo | Backend memória (indireto) | Nenhuma |
| 15 | Idade / userAge | Campo idade 14–99 | `SearchSelect` `ageOptions` 14–90 → `userAge` | ✅ OK | `calibration-screen.tsx:137-142, 309-318` | Baixo | `guto-*` backend | Nenhuma |
| 16 | Sexo biológico | male/female (sem "prefiro não") | Chips `female`/`male` → `biologicalSex` | ✅ OK | `calibration-screen.tsx:305-306` | Baixo | `guto-biological-sex.test.ts` (6) | Nenhuma |
| 17 | Nível de treino / trainingLevel | beginner/returning/consistent/advanced | Chips de status/nível | ✅ OK | `calibration-screen.tsx` (`trainingStatus`→trainingLevel) | Baixo | `guto-workout.test.ts` | Nenhuma |
| 18 | Objetivo / trainingGoal | 5 objetivos | Chips `objectiveEntries` | ✅ OK | `calibration-screen.tsx:211, 366+` | Baixo | `guto-diet/workout` | Nenhuma |
| 19 | Local preferido / preferredTrainingLocation | gym/home/park/mixed | Chips `locationOptions` | ✅ OK | `calibration-screen.tsx:410-415` | Baixo | `guto-workout.test.ts` | Nenhuma |
| 20 | Altura / heightCm | 100–250 | `SearchSelect` `heightOptions` 100–250 | ✅ OK | `calibration-screen.tsx:150-155, 353-362` | Baixo | `guto-diet-generation` | Nenhuma |
| 21 | Peso / weightKg | 30–300 | `SearchSelect` `weightOptions` 40.0–190.0 (0,1) | 🟡 PARCIAL | `calibration-screen.tsx:143-149` | Baixo (range 40–190 < doc 30–300) | `guto-diet-generation` | Opcional: alinhar range ao doc (30–300) |
| 22 | País / country | string + contexto | `SearchSelect` país (`country-state-city`) | ✅ OK | `calibration-screen.tsx:114, 259-272` | Baixo | `guto-weekly-diet` | Nenhuma |
| 23 | Cidade / city | string | `SearchSelect` cidade dependente do país | ✅ OK | `calibration-screen.tsx:115-136, 273-283` | Baixo | — | Nenhuma |
| 24 | Dor/limitação / trainingPathology | texto semântico | `pathology` + chip "SEM DOR"; mapeado p/ trainingPathology+trainingLimitations | ✅ OK | `calibration-screen.tsx:58, 104`; `guto-app.tsx:1356-1364` | Baixo | `guto-workout` | Nenhuma |
| 25 | Campo único "NÃO COMO" / foodRestrictions | 1 campo só | `CompactTextInput` + chip "COMO DE TUDO" | ✅ OK | `calibration-screen.tsx:285-299` | Baixo | `guto-weekly-diet` | Nenhuma |
| 26 | Idioma não é campo da calibragem | proibido | Ausente da tela | ✅ OK | `calibration-screen.tsx` | Baixo | — | Nenhuma |
| 27 | Telefone não entra em GutoMemory | proibido | Backend deleta `phone` na sanitização | ✅ OK | `server.ts:846-847, 1119` | Baixo | `guto-memory-phone.test.ts` (2) | Nenhuma |
| 28 | foodIntolerances separado não entra | campo único | Não existe campo separado | ✅ OK | `calibration-screen.tsx` / `server.ts` | Baixo | — | Nenhuma |
| 29 | biologicalSex não aceita valor proibido | só male/female | `normalizeBiologicalSex` + chips só female/male | ✅ OK | `server.ts:707`; `calibration-screen.tsx:305-306` | Baixo | `guto-biological-sex.test.ts` | Nenhuma |
| 30 | Dados enviados ao backend | persistência real | `handleCalibrationComplete` → `persistMemory(..., {optimistic:false})`; falha honesta | ✅ OK | `guto-app.tsx:1351-1372` | Baixo | Backend integração | Nenhuma |
| 31 | Persistem após reload | backend é a verdade | `resolveAuthenticatedStage` lê `hasMemoryCalibration(memory)` do backend | ✅ OK | `guto-app.tsx:642-651` | Baixo | Não (e2e) | Nenhuma |
| 32 | Aparecem em GutoMemory | campos na memória | Sim, via `/guto/memory` | ✅ OK | `server.ts` memory-store | Baixo | Sim (backend) | Nenhuma |
| 33 | GutoMemory separado por usuário | por userId | Sim | ✅ OK | `server.ts:998 getMemory(userId)` | Baixo | `guto-team-isolation` | Nenhuma |
| 34 | Chat/memoryPatch não sobrescreve calibragem sem regra | confirmação/ambiguidade | `dirty-data-resolver` + audit `chat_patch`; ambíguo pergunta | ✅ OK (conservador) | `src/dirty-data-resolver.ts`; `guto.integration.test.ts:380` | Médio | `guto-contract-rules`, `proactivity-resolver` | Nenhuma (ver nuance Fase 1 item 47) |
| 35 | Página do pacto existe | tela do pacto | **Inline** no stage `pact` (não o standalone) | ✅ OK | `guto-app.tsx:2466-2620` | Baixo | Não | Nenhuma (dead code `agreement-screen.tsx` é P3) |
| 36 | Pacto exige confirmação real | hold/confirmação | Hold-to-confirm (`onPointerDown/Up`, `pactProgress`→100) | ✅ OK | `guto-app.tsx:2555-2573` | Baixo | Não | Nenhuma |
| 37 | Pacto salva conclusão no backend | concluir libera sistema | `startSystem` → `persistMemory({xpEvent:"grant_initial_xp"})` (backend grava `initialXpGranted`) + stage→system | 🟡 PARCIAL | `guto-app.tsx:1139-1166` | Baixo | Não | Opcional: registrar conclusão do pacto explicitamente (hoje proxy via `initialXpGranted`; stage é local) |
| 38 | XP inicial concedido | +100 buffer | `grant_initial_xp` (+100) | ✅ OK | `server.ts:1444-1447` | Baixo | `guto-evolution.test.ts` | Nenhuma |
| 39 | XP inicial não conta como treino | sem completedWorkout | Não toca `completedWorkoutDates` | ✅ OK | `server.ts:1444-1465` | Baixo | `guto-evolution` | Nenhuma |
| 40 | XP inicial não gera streak | streak separado | `grant_initial_xp` não mexe em `streak` | ✅ OK | `server.ts:1480` (streak só em completeWorkout) | Baixo | `guto-evolution` | Nenhuma |
| 41 | Stage router avança correto | consent→nome→calibragem→pacto→sistema | Máquina completa + handlers | ✅ OK | `guto-app.tsx:623-657` e handlers | Baixo | Não (e2e) | Nenhuma |
| 42 | Testes existentes Fase 2 | unit/integração/e2e | Backend cobre dados (memória/sexo/phone/calibragem indireta); **e2e pula as telas via seed** | 🟡 PARCIAL | `e2e/guto.spec.ts:228-237` (seed pula onboarding) | Médio | Backend sim / UI não | **Sim (P2):** e2e das telas da Fase 2 |
| 43 | Bugs visuais/funcionais | — | (1) dead code `name-screen`/`agreement-screen`; (2) consent só local (item 6); (3) range peso 40–190 (item 21); (4) CTA calibragem dependente de scroll (item 60) | 🟡 PARCIAL | ver itens citados | Médio | — | ver itens 6/21/42/60 |

---

## Checklist mobile / teclado / app celular

> Observação técnica importante: o Playwright roda em **Desktop Chrome com viewport 390×844** (`playwright.config.ts:47`). Ele **não emula o teclado virtual real do iOS**. Logo, overlap de teclado **não é provável por teste automatizado** — auditei por **revisão de CSS/JS** (viewport sync, safe-area, dvh, z-index, scrollIntoView). Itens dependentes de teclado real ficam ✅-por-código com recomendação de **teste manual em iPhone via Dev Tunnel**, ou 🟡 quando o código deixa dúvida.

Infraestrutura mobile encontrada (vale para toda a fase):
- `app/globals.css`: `.sala-guto` usa **`100dvh`** e `--guto-viewport-height`; `[data-keyboard-open]` troca a altura para a viewport visível; `safe-area-inset-*` em múltiplos pontos.
- `guto-app.tsx:800-854`: **sync de viewport via `visualViewport`** — atualiza `--guto-viewport-height`, `--guto-keyboard-offset` e `data-keyboard-open` **no shell E no `<html>`** (para portals/dropdowns fora de `.sala-guto` também responderem ao teclado iOS).
- `calibration-screen.tsx:214-228`: `focusin` → `scrollIntoView({block:"center"})` no host de scroll.
- `SearchSelect` (dropdown) = **overlay `fixed` `z-[9999]`** bottom-sheet com `max-h` atado a `--guto-viewport-height` e `safe-area-inset`.

| # | Item mobile | Exigência | Código encontrado | Status | Evidência | Risco | Teste existente | Correção necessária |
|---|---|---|---|---|---|---|---|
| 44 | Viewport iPhone | funciona em iPhone | Viewport global 390×844 + CSS dvh | ✅ OK | `playwright.config.ts:47`; `globals.css:119,144` | Baixo | Sim (viewport) | Nenhuma |
| 45 | Android/mobile genérico | funciona em Android | Mesmo CSS responsivo; sem projeto Android | 🟡 PARCIAL | `playwright.config.ts` (só 1 viewport) | Baixo | Não | Recomendado projeto/teste mobile genérico |
| 46 | Consentimento scroll | scroll correto | `overflow-y-auto` + `min-h-full justify-center` | ✅ OK | `consent-screen.tsx:131, 141` | Baixo | Não | Nenhuma |
| 47 | CTA consent não atrás da safe area | safe area inferior | Section `py-[max(env(safe-area-inset-top),18px)]` (usa inset-**top** p/ topo e base) | 🟡 PARCIAL | `consent-screen.tsx:131` | Baixo | Não | Trocar padding inferior para `safe-area-inset-bottom` (cosmético) |
| 48 | Checkboxes clicáveis em mobile | alvo tocável | `min-h-11` (44px), `role=checkbox` | ✅ OK | `consent-screen.tsx:99` | Baixo | Não | Nenhuma |
| 49 | Nome com teclado aberto | layout não quebra | CSS `[data-keyboard-open] .guto-name-stage/.guto-name-lockup` encolhe | ✅ OK (código) | `globals.css:795-810`; sync `guto-app.tsx:800` | Médio | Não (sem teclado real) | Teste manual iPhone |
| 50 | Campo nome não escondido | input visível | Input em `guto-name-input-block mt-auto` com `pb-[safe-area-inset-bottom]`; lockup encolhe | ✅ OK (código) | `guto-app.tsx:2393-2408`; `globals.css:799-810` | Médio | Não | Teste manual iPhone |
| 51 | Botão confirmar nome acessível | CTA visível c/ teclado | Botão Send inline ao input (mesma linha) | ✅ OK | `guto-app.tsx:2409-2418` | Baixo | Não | Nenhuma |
| 52 | Foco no nome rola p/ campo | scrollIntoView | **Sem scrollIntoView**; mantém visível por shrink do lockup + input no rodapé | 🟡 PARCIAL | `globals.css:799-810` (sem JS de scroll p/ naming) | Médio | Não | Teste manual; opcional scrollIntoView |
| 53 | Calibragem em celular | funciona | Host com scroll + safe-area | ✅ OK | `calibration-screen.tsx:230-252` | Baixo | Não | Nenhuma |
| 54 | Campos numéricos teclado adequado | teclado numérico | Usa **pickers `SearchSelect`** (não input numérico); busca é texto, sem `inputMode` | 🟡 PARCIAL | `calibration-screen.tsx:309-362, 614-619` | Baixo | Não | Opcional `inputMode="numeric"` na busca |
| 55 | Idade não quebra c/ teclado | overlay sobre teclado | Dropdown overlay `z-9999` `max-h` por `--guto-viewport-height` | ✅ OK (código) | `calibration-screen.tsx:588-598` | Médio | Não | Teste manual iPhone |
| 56 | Altura não quebra | idem | idem SearchSelect | ✅ OK (código) | `calibration-screen.tsx:353-362, 588` | Médio | Não | Teste manual |
| 57 | Peso não quebra | idem | idem SearchSelect | ✅ OK (código) | `calibration-screen.tsx:342-351, 588` | Médio | Não | Teste manual |
| 58 | Cidade não quebra | busca + overlay | SearchSelect cidade overlay | ✅ OK (código) | `calibration-screen.tsx:273-283, 588` | Médio | Não | Teste manual |
| 59 | "NÃO COMO" não escondido | input visível | `CompactTextInput` + `focusin` scrollIntoView center | ✅ OK (código) | `calibration-screen.tsx:285-292, 214-228` | Médio | Não | Teste manual |
| 60 | CTA avançar calibragem acessível c/ teclado | botão alcançável | CTA **dentro do scroll** (`mt-auto shrink-0`), não sticky → alcançável por rolagem | 🟡 PARCIAL | `calibration-screen.tsx:419-441` | Médio | Não | Considerar CTA sticky/safe-area; ou validar manual |
| 61 | Opções não abrem atrás do teclado | overlay respeita teclado | Overlay `max-h` = `--guto-viewport-height` (ajustado pelo teclado) | ✅ OK (código) | `calibration-screen.tsx:598`; sync `guto-app.tsx:813-824` | Médio | Não | Teste manual confirmatório |
| 62 | Selects sexo/nível/objetivo/local usáveis | usáveis em mobile | **Chips** (MiniChip), sem dropdown | ✅ OK | `calibration-screen.tsx:305-306, 412-414` | Baixo | Não | Nenhuma |
| 63 | Opções não cortadas no fim da tela | bottom-sheet com scroll | Overlay `justify-end` + lista com scroll interno | ✅ OK | `calibration-screen.tsx:588-643` | Baixo | Não | Nenhuma |
| 64 | z-index/position corretos | acima de overlays | `z-[9999]` `fixed`; vars espelhadas no `<html>` | ✅ OK | `calibration-screen.tsx:588`; `guto-app.tsx:818-824` | Baixo | Não | Nenhuma |
| 65 | Safe area inferior respeitada | inset-bottom | `pb-[max(env(safe-area-inset-bottom),…)]` em calibragem/naming/overlay | ✅ OK | `calibration-screen.tsx:231, 588`; `guto-app.tsx:2393` | Baixo | Não | Nenhuma |
| 66 | Safe area superior respeitada | inset-top | `pt-[max(env(safe-area-inset-top),…)]` | ✅ OK | `calibration-screen.tsx:231`; `consent-screen.tsx:131` | Baixo | Não | Nenhuma |
| 67 | 100vh vs 100dvh/svh | usar dvh | Usa **`100dvh`** + `--guto-viewport-height` | ✅ OK | `globals.css:119,144,151-153` | Baixo | Não | Nenhuma |
| 68 | Altura fixa não impede scroll c/ teclado | container encolhe | `[data-keyboard-open]` height = `--guto-viewport-height`; body `overflow-y-auto` | ✅ OK | `globals.css:168-174`; `calibration-screen.tsx:252` | Médio | Não | Teste manual |
| 69 | Bottom CTA fixo não cobre campos | sem cobrir | CTAs **não são fixos** (consent/calibragem no fluxo de scroll) | ✅ OK (N/A) | `consent-screen.tsx:229`; `calibration-screen.tsx:419` | Baixo | Não | Nenhuma |
| 70 | Teclado não empurra sem scroll | scroll possível | viewport sync + `overflow-y-auto` | ✅ OK (código) | `guto-app.tsx:800-854`; `globals.css:183` | Médio | Não | Teste manual |
| 71 | Pacto em celular | funciona | Centralizado, botão `touch-none`, sem input | ✅ OK | `guto-app.tsx:2466-2573` | Baixo | Não | Nenhuma |
| 72 | Botão pacto não atrás da safe area | acessível | `justify-center` (botão no centro, não no rodapé) | ✅ OK | `guto-app.tsx:2469, 2555` | Baixo | Não | Nenhuma |
| 73 | Fluxo completo em mobile sem quebrar | ponta a ponta | Por código OK; sem prova de teclado real | 🟡 PARCIAL | (CSS/infra acima) | Médio | Não | Teste manual iPhone do fluxo |
| 74 | Teste Playwright/mobile da Fase 2 | viewport/teclado | Viewport iPhone existe, mas **telas Fase 2 são puladas** por seed; sem teste de teclado | 🟡 PARCIAL | `e2e/guto.spec.ts:228-237` | Médio | Parcial | **Sim (P2):** e2e das telas + viewport |
| 75 | Screenshots/evidência mobile da Fase 2 | prints | Screenshots existem mas **só até "language"**; sem consent/naming/calibragem/pacto | 🟡 PARCIAL | `e2e-screenshots/` (01–20, nenhum da Fase 2) | Baixo | Parcial | **Sim (P2):** screenshots das 4 telas |
| 76 | Bugs visuais mobile | — | (a) padding inferior do consent usa inset-top (item 47); (b) CTA calibragem scroll-dependente (item 60); (c) naming sem scrollIntoView (item 52); (d) `overflow-hidden` no naming/pacto pode cortar topo em telas muito pequenas | 🟡 PARCIAL | itens 47/52/60 | Médio | Não | Validar em iPhone real |

---

## Pontos críticos investigados

### Consentimento
- Tela real ✅, 2 checkboxes obrigatórios ✅, bloqueio sem aceite ✅, revogação real no backend ✅.
- **Aceite NÃO é persistido no backend** (só `localStorage` `StoredProfile`). O backend só toca os campos `consentHealthFitness/acceptedTerms` no `revoke`. Isso quebra a regra da raiz "consentimento ... no banco de dados" e impede o backend de **bloquear/auditar** por falta de consentimento. → **item 6, P1**.
- Mobile: scroll OK; checkboxes 44px tocáveis; padding inferior usa `safe-area-inset-top` (deveria ser `-bottom`) — cosmético.

### Nome soberano
- Identidade "GUTO & [Nome]" ✅ (inline); convite é só sugestão ✅; confirmado não é sobrescrito ✅; nome não está na calibragem ✅.
- **A tela usada é inline no `guto-app.tsx`**, não `name-screen.tsx` (este é dead code).
- Mobile: input `autoFocus`, botão de envio inline, CSS encolhe o lockup com teclado. Sem `scrollIntoView` dedicado (mantém visível por layout). `overflow-hidden` pode cortar o título em telas muito pequenas — validar em iPhone.

### Calibragem
- Todos os campos obrigatórios existem, são enviados ao backend (`optimistic:false`, falha honesta), persistem e aparecem em `GutoMemory` ✅. Sem campos paralelos. Telefone bloqueado, sexo restrito, `foodRestrictions` único ✅.
- Ressalvas: range de **peso 40–190** (doc pede 30–300) — item 21; campos numéricos via **picker** (não teclado numérico) — item 54.
- Mobile (forte): host com `overflow-y-auto` + `scrollIntoView` no focus; dropdowns são **overlay `fixed z-9999`** com `max-h` atado a `--guto-viewport-height` → **não abrem atrás do teclado**; safe-area top/bottom. Ponto fraco: **CTA dentro do scroll** (não sticky) — alcançável só rolando (item 60).

### Pacto
- Tela inline real ✅; confirmação real por hold ✅; libera sistema só após pacto ✅; XP inicial +100 ✅; não conta treino nem streak ✅.
- Conclusão registrada no backend de forma **indireta** (`initialXpGranted`); o `stage:"system"` é estado local (item 37, baixo risco).
- Mobile: centralizado, `touch-none`, sem teclado — seguro. `overflow-hidden` em telas minúsculas pode cortar bordas (não crítico).
- **A tela usada é inline**, não `agreement-screen.tsx` (dead code; duração de hold ~1,6s no standalone vs "2s" do doc — irrelevante porque o standalone não roda).

### GutoMemory
- Fonte única ✅, separada por usuário ✅, backend é autoridade (calibragem lida do backend, não do localStorage) ✅, `memoryPatch` com `dirty-data-resolver` + auditoria `chat_patch` e confirmação de ambiguidade ✅. Persistência após reload ✅.
- Único ponto que **não** segue "backend é a verdade": **consentimento** (vive no localStorage) — item 6.

### Testes
- **Backend (forte):** `guto-biological-sex` (6), `guto-memory-phone` (2), `guto-diet-generation` (8), `guto-weekly-diet` (14), `guto-workout` (71), integração — cobrem os **dados** da calibragem.
- **Frontend (fraco para Fase 2):** `e2e/guto.spec.ts` roda em viewport iPhone, mas **semeia `consentHealthFitness/namingConfirmed/calibrationComplete/pactAccepted`** e pula as 4 telas. Não há e2e que exercite consent/naming/calibragem/pacto, nem teste de teclado, nem screenshots dessas telas.

---

## Saída final

### 1. O que está OK na Fase 2
Itens **1–5, 7–20, 22–36, 38–41** e a maioria do mobile (44, 46, 48, 51, 53, 55–59, 61–72). Consentimento (tela+checkboxes+bloqueio+revogação), nome soberano, calibragem completa com todos os campos persistidos no backend, bloqueio de telefone/sexo/intolerância, pacto com confirmação real e XP inicial correto. Infra mobile robusta: `100dvh`, sync de `visualViewport`, safe-area, e **dropdowns bottom-sheet `z-9999` que respeitam o teclado**.

### 2. O que está parcial
- ~~**6** Consentimento só em localStorage~~ → **CORRIGIDO (Fase 2A)**: aceite persistido no backend.
- **21** Range de peso 40–190 (doc: 30–300).
- **37** Conclusão do pacto registrada indiretamente.
- **42/74/75** Sem e2e/screenshots das telas da Fase 2 (puladas por seed).
- **45** Sem teste Android.
- **47, 52, 54, 60, 73, 76** Ajustes mobile (padding bottom, scrollIntoView no nome, teclado numérico, CTA scroll-dependente, prova em iPhone real).

### 3. O que está ausente
- e2e reais das 4 telas da Fase 2 e teste de teclado mobile — **ausentes** (P2). Nota: os testes de "sistema autenticado" 09–20 estão pré-existentemente falhando em headless (travam no intro), independentemente da Fase 2A.
- ~~Persistência do aceite de consentimento no backend~~ → **CORRIGIDO (Fase 2A)**.

### 4. O que é mock/falso
- Nenhum mock de dados. Há **código morto** que parece implementação mas não roda: `components/guto/screens/name-screen.tsx` e `agreement-screen.tsx` (não importados). Armadilha de auditoria/manutenção, não mock funcional.

### 5. O que contradiz a raiz
- ~~**Item 6:** aceite no localStorage~~ → **RESOLVIDO (Fase 2A)**: consentimento persistido no backend, conforme a raiz.
- **Item 21:** range de peso menor que o documentado (40–190 vs 30–300). Menor.
- (Sem contradição em telefone, sexo, campo único, nome soberano — todos conformes.)

### 6. P0/P1 da Fase 2
- **P0:** nenhum.
- **P1:** **nenhum remanescente** — o item 6 (único P1) foi corrigido e validado na Fase 2A.
- **P2:** **Itens 42/74/75** (e2e + screenshots das telas; inclui destravar os testes 09–20 que falham no intro em headless), **item 60** (CTA calibragem), prova de teclado em iPhone real.
- **P3:** remover dead code (`name-screen.tsx`, `agreement-screen.tsx`); item 21 (range peso); item 47 (token de padding).

### 7. Menor correção segura para deixar a Fase 2 pronta (APLICADA — Fase 2A)
Feita exatamente como planejado: endpoint dedicado **`POST /guto/consent/accept`** no backend (que já tinha os campos, só os escrevia no `revoke`) + `getMemory` passando a expor o consentimento + front chamando o backend com **falha honesta** e `resolveAuthenticatedStage` lendo o backend (padrão da calibragem). Não tocou XP, dieta, treino, painel, morte. `GUTO_DECEASED` deixado fora de escopo.

### 8. Testes executados na Fase 2A (resultado)
- Backend: `tsc --noEmit` → **exit 0**; `node scripts/run-guto-tests.mjs` → **26 suítes / ~318 testes / 0 falhas** (nova suíte `guto-consent` 6/6: aceite persiste, GET reflete reload, revoke continua, sem-consent ≠ consentido, sem vazamento entre usuários).
- Frontend: `tsc --noEmit` → **exit 0**.
- Playwright (`guto.spec` + `login-keyboard`): **12 passam / 10 falham**. As 10 são os testes 09–20 (sistema autenticado) e foram **comprovadamente pré-existentes** (travam no intro em headless; o teste 09 falha igual no código limpo, sem esta correção). 01–08 + login-keyboard passam.
- Pendente (P2): e2e dedicado das telas da Fase 2 + correção do gargalo de intro em headless + teste manual de teclado em iPhone real.

### 9. O que NÃO deve ser mexido ainda
Morte/lockdown, XP além do inicial, dieta, treino, GUTO Online, painel, proatividade, arena, percurso, evolução, item 19 da Fase 1. E **não redesenhar** as telas — os ajustes são pontuais.

### 10. Bloco único ou subfases?
A Fase 2 está **majoritariamente aprovada**; as pendências são pequenas e **independentes** → recomendado **dividir em subfases**, não um bloco único:
- **2A — Consentimento:** persistir aceite no backend (P1). **Única correção de produto necessária.**
- **2B — Nome soberano:** aprovado (só P3: remover dead code).
- **2C — Calibragem/GutoMemory:** aprovado (P3: range peso; opcional inputMode).
- **2D — Pacto/XP inicial:** aprovado (P3 opcional: registrar conclusão explícita).
- **2E — Mobile/teclado/safe-area/dropdowns:** e2e + screenshots + prova manual iPhone; ajustes 47/52/60 (P2/P3).

### 11. A Fase 2 está segura para celular?
**Sim, por revisão de código** — a infra mobile é sólida (dvh, viewport sync no `<html>`, safe-area, dropdowns bottom-sheet z-9999 atados ao teclado). **Falta prova automatizada/manual** em iPhone real (Playwright desktop não emula o teclado iOS). Classificação honesta: **segura por design, pendente de confirmação manual**.

### 12. O teclado em mobile pode quebrar alguma tela?
Risco **baixo** por código. Pontos a confirmar em iPhone real: (a) CTA da calibragem exige scroll (não some, mas não é sticky) — item 60; (b) naming sem `scrollIntoView` e `overflow-hidden` em telas muito pequenas — itens 52/76. Não há indício de quebra grave.

### 13. Opções/dropdowns podem ficar atrás do teclado?
**Não.** Os dropdowns (`SearchSelect`) são overlay `fixed z-[9999]` com `max-h` = `--guto-viewport-height` (ajustado pelo teclado via `visualViewport`) e as vars são espelhadas no `<html>` para portals. É justamente o padrão correto contra esse bug.

### 14. Evidências mobile encontradas
- Viewport iPhone 390×844 global no Playwright (`playwright.config.ts:47`).
- CSS: `100dvh`, `--guto-viewport-height`, `[data-keyboard-open]`, `safe-area-inset-*` (`globals.css`).
- JS: sync `visualViewport` no shell e `<html>` (`guto-app.tsx:800-854`); `scrollIntoView` no focus da calibragem.
- Dropdown bottom-sheet `z-9999` atado ao teclado (`calibration-screen.tsx:588-598`).
- Screenshots `e2e-screenshots/` — porém **só até a tela de idioma**; nenhuma das 4 telas da Fase 2.

### 15. Testes mobile a criar
- iPhone viewport com **tela de consentimento** (scroll + CTA visível + checkboxes tocáveis).
- iPhone viewport com **campo de nome focado** (input + botão visíveis com "teclado").
- iPhone viewport com **calibragem e campo focado** (scrollIntoView; CTA alcançável).
- iPhone viewport com **dropdown `SearchSelect` aberto** (país/cidade) — confirmar overlay acima do teclado, opções não cortadas.
- iPhone viewport com **`foodRestrictions` focado**.
- **Android/mobile viewport** com o fluxo completo consent→nome→calibragem→pacto.
- Asserção de **CTA principal visível/clicável** em cada tela.
- **Screenshots antes/depois** de focar inputs nas 4 telas.
- Teste manual em **iPhone real via Dev Tunnel** (teclado iOS), já que o Playwright desktop não o emula.

---

### Apêndice — âncoras de código (Fase 2)
- Stages: `guto-app.tsx:47-48` (AppStage), `:623-657` (resolveAuthenticatedStage), `:2352` (consent), `:2360` (naming inline), `:2450` (calibration), `:2466` (pact inline).
- Consent: `components/guto/screens/consent-screen.tsx`; handler `guto-app.tsx:1180-1192`; backend revoke `server.ts:6616-6649`.
- Nome: inline `guto-app.tsx:2360-2448`; `commitOnboardingName` `:1330-1349`. (Dead: `screens/name-screen.tsx`.)
- Calibragem: `components/guto/screens/calibration-screen.tsx` (campos 13-110; scroll/focus 214-252; SearchSelect 514-645; CTA 419-441); handler `guto-app.tsx:1351-1372`.
- Pacto: inline `guto-app.tsx:2466-2620`; `startSystem` `:1139-1166`. (Dead: `screens/agreement-screen.tsx`.)
- Mobile infra: `app/globals.css` (119,144,151-174,177-190,795-810); `guto-app.tsx:800-854`.
- XP/memória backend: `server.ts:1421-1465` (clamp/appendXpEvent/grantInitialXp), `:707` (normalizeBiologicalSex), `:846-847/1119` (phone delete).
- Testes: `e2e/guto.spec.ts` (seed pula Fase 2 em :228-237); backend `tests/guto-biological-sex|guto-memory-phone|guto-diet-generation|guto-weekly-diet|guto-workout`.
