# GUTO — Fase 1: Validação Abertura, Idioma, Login e Convite

## Fonte da raiz
- `GUTO-RAIZ/PARTE_1_ABERTURA_IDIOMA_LOGIN.md`

## Regra
Auditoria de validação + **correção autorizada e aplicada SOMENTE do Item 15** (2026-05-25).
Escopo restrito à Fase 1 — nada de morte/lockdown, XP, dieta, treino, GUTO Online, painel, proatividade, arena, percurso ou evolução.

## Status da correção autorizada (Item 15)

- ✅ **Item 15 CORRIGIDO** — backend agora distingue `ACCESS_PAUSED` de `SUBSCRIPTION_EXPIRED`.
- Arquivos alterados (CEREBROGUTO):
  - `guto-backend/src/auth-middleware.ts` — novo helper exportado `resolveBlockedAccessCode()` + uso em `requireActiveUser`.
  - `guto-backend/src/auth-router.ts` — uso de `resolveBlockedAccessCode()` no handler `POST /auth/user/login`.
  - `guto-backend/tests/guto-access-blocking.test.ts` — **novo** teste de regressão (10 casos).
- Regra aplicada: `subscriptionStatus ∈ {expired, cancelled}` **ou** `subscriptionEndsAt` no passado → `SUBSCRIPTION_EXPIRED`; inativo/pausado/arquivado/pendente → `ACCESS_PAUSED`.
- **Não** implementado `GUTO_DECEASED` (morte/lockdown segue fora de escopo). Frontend não foi tocado (já trata os dois códigos).
- Validação executada nesta correção:
  - `tsc --noEmit` (backend) → **exit 0**.
  - `node scripts/run-guto-tests.mjs` → **25 suítes / ~312 testes / 0 falhas** (runner exit 0), incluindo a nova suíte `guto-access-blocking` (10/10).

> Repos: **CORPOGUTO** = `guto-app-v0/` · **CEREBROGUTO** = `guto-backend/`.
> Caminhos de código são relativos à raiz do workspace.

## Checklist da fase

| # | Item | Exigência da raiz | Código encontrado | Status | Evidência | Risco | Teste existente | Correção necessária |
|---|---|---|---|---|---|---|---|
| 1 | Vídeo de abertura | Cápsula cinemática, vídeo `abertura-guto.mp4`, ~4s, só para visitante sem sessão | Vídeo real toca; tratamento Safari (seek-to-0, unmuted→muted) | ✅ OK FUNCIONANDO | `guto-app-v0/components/guto/guto-app.tsx` (`startIntroVideo`, l.2258 `<source src="/assets/guto/abertura-guto.mp4">`); arquivo `public/assets/guto/abertura-guto.mp4` (2,0 MB) | Baixo | Parcial (e2e abre app sem tela branca) | Nenhuma |
| 2 | Botão "Iniciar GUTO" | Toque físico obrigatório (iOS) inicia o vídeo | `startIntroVideo()` no tap; trava duplo-clique (`introStartedRef`) | ✅ OK FUNCIONANDO | `guto-app.tsx:1216-1278` | Baixo | Não direto | Nenhuma |
| 3 | Fallback se vídeo falhar | Timer fixo de 4000ms avança mesmo se o vídeo falhar | `INTRO_VIDEO_MS=4000` é "master control": `setTimeout(completeIntroToLanguage, 4000)` | ✅ OK FUNCIONANDO | `guto-app.tsx:90`, `:1241`, `completeIntroToLanguage` (`:1195`) | Baixo | Indireto (loader resolve ≤10s) | Nenhuma |
| 4 | Página de idioma | 3 cápsulas; toque rota para login/convite/stage | `language-screen` + `handleLanguageSelect` | ✅ OK FUNCIONANDO | `components/guto/screens/language-screen.tsx`; `guto-app.tsx:1281-1328` | Baixo | e2e "tela de idioma aparece" | Nenhuma |
| 5 | Português pt-BR | Idioma suportado | Bloco completo `pt-BR` | ✅ OK FUNCIONANDO | `components/guto/translations.ts:131`; e2e seleciona PT-BR | Baixo | Sim (`guto.spec.ts` 03/04) | Nenhuma |
| 6 | Inglês en-US | Idioma suportado | Bloco completo `en-US` | ✅ OK FUNCIONANDO | `translations.ts:406`; e2e `/login?lang=en-US` | Baixo | Sim (`login-keyboard.spec.ts:95`) | Nenhuma |
| 7 | Italiano it-IT | Idioma suportado | Bloco completo `it-IT` | ✅ OK FUNCIONANDO | `translations.ts:273`; e2e `/login?lang=it-IT` | Baixo | Sim (`login-keyboard.spec.ts:100`) | Nenhuma |
| 8 | Idioma define o app inteiro | UI, chat, erros, voz seguem o idioma; toda rota consulta o resolver | `resolveGutoLanguage()` (hierarquia sessão→onboarding→memória→global→fallback); `/login`, `/acesso-pausado` consultam | ✅ OK FUNCIONANDO | `lib/guto-profile.ts → resolveGutoLanguage`; `app/login/page.tsx:82`; backend recebe idioma no prompt | Baixo | Backend `guto.language.integration.test.ts` (6) | Nenhuma |
| 9 | Idioma persiste após login/reload | `guto-onboarding-language` + `guto-selected-language` + `memory.language` | Persistência nas 3 camadas; resolver relê no boot | ✅ OK FUNCIONANDO | `guto-app.tsx` `writeOnboardingLanguageStorage`; `login/page.tsx:90-93`; `memory.language` no backend | Baixo | e2e 04 "persiste em localStorage" | Nenhuma |
| 10 | Login normal | `POST /auth/user/login {emailOrId,password}` bcrypt+JWT; token em `guto-auth-token` | Handler real bcrypt+JWT; cliente salva token; `router.push("/")` | ✅ OK FUNCIONANDO | `guto-backend/src/auth-router.ts:178`; `lib/api/auth.ts:53 loginUser`; `app/login/page.tsx:107-112` | Médio | Backend integração; **e2e não loga com backend real** | Nenhuma (cobertura de teste é item 19) |
| 11 | Login por convite | `/convite/[token]` → claim com criação de senha → `POST /auth/invite/:token/claim` | Página captura token; stage `invite_claim` chama claim | ✅ OK FUNCIONANDO | `app/convite/[token]/page.tsx`; `guto-app.tsx` stage `invite_claim` (l.1975-2032); backend `auth-router.ts:304` | Médio | Não há e2e de claim | Nenhuma |
| 12 | Captura de token de convite | Token salvo em `guto-pending-invite-token`; entry-mode `invite`; redireciona p/ `/` | Exatamente isso | ✅ OK FUNCIONANDO | `app/convite/[token]/page.tsx:7-22` | Baixo | Não | Nenhuma |
| 13 | Convite não sobrescreve nome soberano futuro | `presetName` é só sugestão; nome vira oficial só no confirm do stage `naming` | `namingConfirmed` só setado no confirm local; `presetName` não oficializa | ✅ OK FUNCIONANDO | `guto-app.tsx:635-639` (`resolveAuthenticatedStage`), `commitOnboardingName` (l.1330-1349) | Médio | Não | Nenhuma |
| 14 | Bloqueio de acesso pausado | 403 `ACCESS_PAUSED` → interceptor → `/acesso-pausado?reason=` no idioma | Backend emite `ACCESS_PAUSED`; interceptor redireciona; página tem copy `paused` 3 idiomas | ✅ OK FUNCIONANDO | `guto-backend/src/auth-middleware.ts:179-182`, `auth-router.ts:208`; `lib/api/client.ts:186-201`; `app/acesso-pausado/page.tsx` | Baixo | e2e `acesso-pausado.spec.ts` (paused 3 idiomas) | Nenhuma |
| 15 | Bloqueio de acesso expirado | Distinguir `ACCESS_EXPIRED` / `SUBSCRIPTION_EXPIRED` de `ACCESS_PAUSED` | **CORRIGIDO:** backend distingue via `resolveBlockedAccessCode()` em `requireActiveUser` e no login | ✅ OK FUNCIONANDO (corrigido 2026-05-25) | `auth-middleware.ts` (`resolveBlockedAccessCode` + `requireActiveUser`), `auth-router.ts` (`POST /auth/user/login`); teste `tests/guto-access-blocking.test.ts` (10/10) | Baixo (resolvido) | **Sim:** `guto-access-blocking.test.ts` cobre pausado/arquivado→`ACCESS_PAUSED` e expirado/cancelado/endsAt-passado→`SUBSCRIPTION_EXPIRED`, no middleware e no login | Nenhuma (`GUTO_DECEASED` fica para o Módulo de Morte, fora de escopo) |
| 16 | Separação aluno/coach/admin | Rotas de login separadas; aluno não entra no painel; coach/admin não entram pelo app | `/auth/{user,coach,admin}/login` separados; app força `role !== "student" → /coach` | ✅ OK FUNCIONANDO | `auth-router.ts:72/134/178`; `guto-app.tsx:1100-1101` e guard `:2210` | Médio | Não direto (e2e) | Nenhuma |
| 17 | Redirecionamento pós-login | `resolveAuthenticatedStage` decide consent/naming/calibration/pact/system; 401 expulsa p/ login | Stage resolver real; `client.ts` 401 → remove token + `/login` | ✅ OK FUNCIONANDO | `guto-app.tsx:623-657`, `:1074/1124/1191`; `lib/api/client.ts:171-184` | Médio | Não direto | Nenhuma |
| 18 | Stage router: intro → idioma → login/convite → consentimento | Máquina de stages sem pular etapas | `AppStage` completo: intro→language→invite_claim→consent→naming→calibration→pact→system | ✅ OK FUNCIONANDO | `guto-app.tsx:48` (tipo), `getPublicEntryStage` (`:558`), `resolveAuthenticatedStage` (`:623`) | Baixo | e2e cobre intro→idioma | Nenhuma |
| 19 | Testes Playwright existentes para a fase | Cobrir viewport mobile, idiomas e motivos de bloqueio | Specs: `login-keyboard`, `acesso-pausado`, `guto` | 🟡 PARCIAL | `e2e/login-keyboard.spec.ts` (viewport/teclado iOS + render en/it), `e2e/acesso-pausado.spec.ts` (reasons 3 idiomas), `e2e/guto.spec.ts` (intro/idioma/persist). **Faltam:** e2e de login com backend real, redirect role→/coach, claim de convite, e2e de `ACCESS_PAUSED` real ponta-a-ponta | Médio | (é o próprio item) | **Sim (P2):** adicionar e2e de login real, role-redirect e claim |
| 20 | Bugs visuais ou funcionais encontrados na fase | — | Ver "achados" abaixo | 🟡 PARCIAL | (1) `acesso-pausado` renderiza `expired`/`deceased`, mas o backend nunca dispara esses códigos → **copy órfã** (relacionado ao item 15). (2) "Esqueci minha senha": **ausente por design** (PARTE_1 diz "não existe e não finge") — **não é bug**. (3) Nenhuma tela branca / loader trava observados nos testes existentes | Médio (item 15) / Baixo (resto) | e2e existentes não pegam o gap do backend (testam só o front) | Corrigir junto do item 15 |

---

## Saída final

### 1. O que está OK na Fase 1
Itens **1–18** (✅): vídeo de abertura com fallback de 4s, seleção de idioma persistida e propagada (3 idiomas completos + resolver hierárquico), login normal (bcrypt+JWT) e por convite (captura de token + claim), soberania do nome preservada, **bloqueio `ACCESS_PAUSED` e `SUBSCRIPTION_EXPIRED` distinguidos** (item 15 corrigido), separação de papéis com redirect `role !== "student" → /coach`, e stage router completo sem pular etapas. O núcleo da "primeira porta" está real e honesto.

### 2. O que está parcial
- **Item 19 — testes Playwright (🟡):** cobrem render/idioma/viewport/teclado e a exibição de `/acesso-pausado`, mas **não** testam login real com backend, o redirect por role, nem o claim de convite. (Backend já tem teste de regressão para o item 15.)
- **Item 20 — achados (🟡):** a copy de `expired`/`deceased` em `/acesso-pausado` agora é alcançável de verdade para `expired` (item 15 corrigido); `deceased`/`GUTO_DECEASED` segue como copy ainda não acionada (depende do Módulo de Morte, fora de escopo).

### 3. O que está ausente
- e2e de login com backend real, role-redirect e claim de convite — **ausentes** (item 19).
- Recuperação de senha — **ausente por design** (PARTE_1 declara explicitamente; não conta como bug nem como pendência da Fase 1).

### 4. O que é mock/falso
- Nenhum mock na Fase 1. A copy de `expired` em `/acesso-pausado` deixou de ser órfã (o backend agora emite `SUBSCRIPTION_EXPIRED`). Permanece não-acionada apenas a copy `deceased`/`GUTO_DECEASED`, que pertence ao Módulo de Morte (fora de escopo) — UI presente, caminho de backend ainda não conectado por decisão de escopo.

### 5. O que contradiz a raiz
- **Resolvido:** a divergência do item 15 (backend colapsava tudo em `ACCESS_PAUSED`) foi corrigida — agora distingue `ACCESS_PAUSED` de `SUBSCRIPTION_EXPIRED`, conforme PARTE_1 §3.3.
- **Remanescente (por escopo):** `GUTO_DECEASED` ainda não é emitido — pertence ao Módulo de Morte e **não** deve ser implementado nesta fase.

### 6. Quais são os P0/P1 da Fase 1
- **P0:** nenhum.
- **P1:** **nenhum remanescente** — o item 15 (único P1) foi corrigido e validado.
- **P2:** **Item 19** — cobertura e2e de login real, role-redirect e claim de convite.

### 7. Qual é a menor correção segura para deixar a Fase 1 pronta (APLICADA)
**Feita exatamente como planejado — mudança cirúrgica no backend (CEREBROGUTO), sem tocar o frontend:**
- `guto-backend/src/auth-middleware.ts`: novo helper exportado `resolveBlockedAccessCode(access)` e uso em `requireActiveUser` (após `requireActiveUserAccess` retornar null, classifica via `getEffectiveUserAccess`).
- `guto-backend/src/auth-router.ts`: `POST /auth/user/login` usa o mesmo helper com o `UserAccess` já em escopo.
- Regra: `subscriptionStatus ∈ {expired, cancelled}` **ou** `subscriptionEndsAt < now` → `SUBSCRIPTION_EXPIRED`; inativo/pausado/arquivado/pendente → `ACCESS_PAUSED`.
- Blast radius confirmado mínimo: frontend **não** tocado (já roteia ambos os códigos em `client.ts:189-195`; copy pronta em `acesso-pausado/page.tsx`). Nenhum campo novo; sem mexer em XP, morte, dieta, treino, painel, proatividade, arena, percurso ou evolução.
- **Não** implementado `GUTO_DECEASED` (Módulo de Morte, fora de escopo).

### 8. Testes executados nesta correção (resultado)
- **Backend (CEREBROGUTO):**
  - `tsc --noEmit` → **exit 0**. ✅
  - `node scripts/run-guto-tests.mjs` → **25 suítes / ~312 testes / 0 falhas** (runner exit 0). ✅
  - Nova suíte `tests/guto-access-blocking.test.ts` (10/10): pausado/arquivado → `ACCESS_PAUSED`; expirado/cancelado/`subscriptionEndsAt` passado → `SUBSCRIPTION_EXPIRED`; ativo e fim-futuro → 200 — validado no middleware (`GET /guto/memory`) e no login (`POST /auth/user/login`). ✅
- **Frontend (CORPOGUTO):** não tocado — sem necessidade de rebuild para esta correção.
- **Recomendado antes de aprovar a fase inteira (item 19, ainda pendente):** e2e Playwright de login real, redirect `role !== student → /coach`, claim de convite e `ACCESS_PAUSED`/`SUBSCRIPTION_EXPIRED` ponta-a-ponta.
- **Status da fase:** itens 1–18 ✅ (item 15 corrigido com regressão verde); resta só o item 19 (P2, cobertura e2e) para aprovação plena.

---

### Apêndice — âncoras de código (Fase 1)
- Intro/idioma/stage router: `guto-app-v0/components/guto/guto-app.tsx` (`AppStage` l.48, `INTRO_VIDEO_MS` l.90, `getPublicEntryStage` l.558, `resolveAuthenticatedStage` l.623, `startIntroVideo` l.1216, role-redirect l.1100/2210).
- Idioma: `guto-app-v0/components/guto/screens/language-screen.tsx`; `lib/guto-profile.ts → resolveGutoLanguage`; `components/guto/translations.ts` (pt l.131 / it l.273 / en l.406).
- Login: `guto-app-v0/app/login/page.tsx`; `lib/api/auth.ts:53`; interceptor `lib/api/client.ts:171-201`.
- Convite: `guto-app-v0/app/convite/[token]/page.tsx`.
- Bloqueio: `guto-app-v0/app/acesso-pausado/page.tsx`; backend `guto-backend/src/auth-middleware.ts:171-186`, `src/auth-router.ts:178/208`.
- Testes: `guto-app-v0/e2e/{login-keyboard,acesso-pausado,guto}.spec.ts`; backend `tests/guto.language.integration.test.ts`.
