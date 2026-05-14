# GUTO — Auditoria do Sistema de Proatividade

---

## Correção do resolvedor determinístico — 13/05/2026

### O que foi implementado

Criado `guto-backend/src/proactivity/memory-action-resolver.ts` — função `resolveProactiveMemoryActionFromUserReply()` que decide a ação proativa a partir do texto do usuário e do estado das memórias, **sem depender do modelo**.

Integração no fluxo `/guto`:
- O resolvedor é chamado em paralelo com `buildProactivityContextBlock` antes de `askGutoModel`.
- Se `resolved.engaged = true`, o `proactiveMemoryAction` retornado ao frontend vem sempre do resolvedor, nunca do modelo.
- Se o resolvedor detecta ambiguidade ou correção (`action = null` + `fallbackMessage`), o modelo ainda gera a `fala`; mas se o modelo cair em fallback genérico ("Perdi conexão"), a `fala` é substituída pela mensagem contextual do resolvedor.
- O `catch` do `/guto` route e o `catch` do `askGutoModel` também usam o `fallbackMessage` contextual quando disponível.

### Por que o fluxo não depende mais 100% do modelo

| Cenário | Antes | Depois |
|---|---|---|
| A — "sim" com pending_confirmation | Modelo decide → falha em rate-limit | Resolvedor decide → `confirm` garantido |
| B — "não vou mais" | Modelo decide → falha em fallback genérico | Resolvedor decide → `discard` garantido |
| C — "rolou"/"adiei"/"cancelei" com pending_validation | Modelo decide → falha em rate-limit | Resolvedor decide → `validate` garantido |
| D — "talvez" | Modelo decide → retorna fallback "Perdi conexão" | Resolvedor retorna `fallbackMessage` contextual |
| E — "não, é sexta" | Modelo decide → retorna fallback "Perdi conexão" | Resolvedor retorna `fallbackMessage` de correção, memória permanece pending |

### Resultado dos testes A-F

Testes criados em `guto-backend/tests/proactivity-resolver.test.ts` — 23 casos, sem chamada ao Gemini:

| Cenário | Status | Observação |
|---|---|---|
| A — confirmação | PASS | "sim", "yes", "sì", "exato" → `confirm` |
| B — descarte | PASS | "não vou mais", "cancelei", "not going anymore" → `discard` |
| C — validação happened | PASS | "sim", "rolou", "fui" → `validate happened` |
| C — validação postponed | PASS | "adiei" → `validate postponed` |
| C — validação discarded | PASS | "cancelei", "não fui" → `validate discarded` |
| D — ambiguidade confirm | PASS | "talvez", "maybe", "não sei" → `null` + `fallbackMessage` |
| D — ambiguidade validate | PASS | "talvez" com pending_validation → `null` + `fallbackMessage` |
| E — correção | PASS | "não, é sexta", "no, it's Friday" → `null` + reason `correction_no_endpoint` |
| F — timezone | PASS | `getDateKey`/`getWeekKey` confirmados com timezone parametrizado |

### Status final

**PASS — Implementado tecnicamente / pronto para entrar no contrato QA principal.**

O ciclo proativo agora tem uma camada determinística que não depende de quota, rate-limit ou comportamento do modelo para decidir a ação. O modelo continua responsável apenas pela `fala` (resposta natural). A ação proativa é sempre determinada por código.

### Arquivos alterados nesta rodada

- `guto-backend/src/proactivity/memory-action-resolver.ts` — **NOVO** — resolvedor determinístico
- `guto-backend/src/proactivity/index.ts` — export do resolver
- `guto-backend/server.ts` — integração no `/guto` route e em `askGutoModel`
- `guto-backend/tests/proactivity-resolver.test.ts` — **NOVO** — 23 testes diretos sem Gemini
- `GUTO_PROACTIVITY_AUDIT.md` — esta atualização

### Erros técnicos restantes (pré-existentes, fora do escopo)

- `npm run build` do frontend falha por `EvolutionStage "elite"` em `guto-app.tsx:1988` — fora do escopo.
- `npm test` do backend: 84 falhas pré-existentes (admin/coach 401, história muscular, language). Os 23 testes do resolver passam 100%.
- Correção estruturada de memória ainda não existe (endpoint `update/correction` — documentado como pendente).

---

**Data:** 13/05/2026  
**Auditor:** Cline  
**Escopo:** Validação ponta-a-ponta do ciclo de proatividade do GUTO

---

## Atualização — 13/05/2026 — Fechamento Codex

**Status final após QA manual dirigido:** **Parcial alto / QA reprovado para marcar Implementado**.

O ciclo técnico de confirmação, descarte e validação foi verificado no código e corrigido onde estava incompleto. Ainda não deve ser marcado como **Implementado** pela régua do `GUTO_QA_MASTER.md`, porque o QA dirigido de 13/05/2026 não aprovou todos os cenários A-F.

### O que foi corrigido

- Frontend agora consome `proactiveMemoryAction` retornado pelo `/guto`.
- Frontend chama:
  - `POST /guto/proactivity/confirm`
  - `POST /guto/proactivity/discard`
  - `POST /guto/proactivity/validate`
- A ação fica amarrada ao `memoryId` que veio no `proactivityContext`; o frontend não confirma por palavra solta tipo "sim".
- Há deduplicação persistente por `guto-proactivity-action:{userId}:{type}:{memoryId}:{outcome || "none"}`, evitando chamada dupla para a mesma memória mesmo após remount.
- A ação de proatividade roda em background após a resposta do `/guto`; não bloqueia fala, voz ou render do chat.
- Backend valida o shape de `proactiveMemoryAction` antes de devolver ao frontend.
- Backend agora repassa `proactiveMemoryAction` no JSON final do `/guto`; antes o campo era parseado, mas se perdia antes da resposta.
- Backend filtra `proactiveMemoryAction` contra o status real da memória antes de devolver ao frontend:
  - `confirm`/`discard` só passam se a memória ainda está `pending_confirmation`.
  - `validate` só passa se a memória está `pending_validation`.
- Backend agora preserva `proactiveMemories` e `weeklyConversation` ao passar pelo fluxo `/guto`; antes o `saveMemory()` podia sobrescrever o registro do usuário com a memória operacional sanitizada e apagar o estado proativo.
- Extração agora faz dedupe técnico por assinatura estruturada (`type`, data, local e `understood`) contra memórias já existentes, incluindo `discarded`, para não recriar a mesma hipótese como `pending_confirmation`.
- Backend protege transições:
  - `/confirm` só altera `pending_confirmation`.
  - `/discard` só descarta `pending_confirmation`.
  - `/validate` só altera `pending_validation`.
  - ações repetidas em memória já movida retornam `ok` sem reverter status.
- Prompt de confirmação agora diferencia negação/cancelamento de correção:
  - "não, não vou mais" → discard.
  - "não, é sexta" → não chama endpoint; pede clareza, porque correção estruturada ainda não existe.
- Prompt de validação agora instrui retorno explícito:
  - `happened`
  - `postponed`
  - `discarded`
- O bloco de proatividade foi movido para prioridade alta no prompt final do `/guto`, depois da mensagem atual do usuário, para reduzir respostas de treino/dieta quando há confirmação ou validação pendente.
- Memórias ativas com `dateParsed` passado são movidas para `pending_validation` antes da injeção no prompt.
- `/confirm` registra `confirmedAt`.
- `/discard` registra `validatedAt` e `discardedAt`.
- `/validate` registra `validatedAt` e, quando o outcome é `discarded`, também `discardedAt`.
- Timezone deixou de depender de UTC puro nos pontos de semana/data da proatividade:
  - Backend `getWeekKey()` e `getDateKey()` usam `config.timeZone`.
  - `/extract` usa `todayKey()` com `GUTO_TIME_ZONE`.
  - Enriquecimento de feriados calcula semana por data ISO, sem `toISOString().slice(0, 10)`.
  - Frontend usa `NEXT_PUBLIC_GUTO_TIME_ZONE || "Europe/Rome"` para week key e segunda-feira.

### Arquivos alterados

- `guto-backend/server.ts`
- `guto-backend/src/proactivity/types.ts`
- `guto-backend/src/proactivity/proactive-store.ts`
- `guto-backend/src/proactivity/memory-extractor.ts`
- `guto-backend/src/proactivity/memory-enricher.ts`
- `guto-backend/src/proactivity/proactivity-injector.ts`
- `guto-backend/src/proactivity/weekly-conversation.ts`
- `guto-backend/src/proactivity/index.ts`
- `guto-app-v0/lib/api/guto.ts`
- `guto-app-v0/components/guto/tabs/chat-tab.tsx`
- `GUTO_PROACTIVITY_AUDIT.md`

### Endpoints agora integrados no frontend

| Endpoint | Status após correção | Como é acionado |
|---|---|---|
| `/guto/proactivity/extract` | Integrado | Background após 6+ mensagens, 1x por semana |
| `/guto/proactivity/open-weekly` | Integrado | Segunda-feira no timezone operacional |
| `/guto/proactivity/confirm` | Integrado | `proactiveMemoryAction.type === "confirm"` |
| `/guto/proactivity/discard` | Integrado | `proactiveMemoryAction.type === "discard"` |
| `/guto/proactivity/validate` | Integrado | `proactiveMemoryAction.type === "validate"` |

### O que ainda ficou pendente

- Correção estruturada de memória ainda não existe. Exemplo: "não, é sexta" não atualiza a memória antiga nem cria automaticamente uma nova. O GUTO deve pedir clareza e manter pendente até existir endpoint de correção/update.
- O dedupe de extração é estrutural, não semântico profundo. Se o modelo reescrever a mesma memória com resumo muito diferente, ainda pode exigir dedupe semântico futuro.
- Não existe UI de listagem de memórias; o fluxo continua 100% via chat/prompt.
- QA dirigido executado em integração local não aprovou todos os cenários A-F; ver seção "Resultado do QA manual".
- O cenário A ainda falhou em uma rodada com memória pendente criada: o `/guto` respondeu com foco de treino e não retornou `proactiveMemoryAction`. Depois do ajuste de prioridade, a nova rodada foi bloqueada por quota/rate limit do Gemini durante a extração.
- Os cenários C, D e E ficaram bloqueados/reprovados por fallback do modelo durante quota/rate limit: a memória não foi alterada indevidamente, mas o GUTO não fez a pergunta natural exigida.
- `guto-backend/src/proactivity/` aparece como diretório não rastreado no repositório do backend. Não foi commitado por instrução explícita de não fazer commit.
- `npm run build` do frontend ainda falha por erro fora da proatividade: `EvolutionStage` com `"elite"` não é aceito por um componente que espera `"legend" | "master"` em `components/guto/guto-app.tsx:1988`.
- `npm test` do backend ainda falha por problemas pré-existentes de autenticação em rotas admin/coach e alguns testes de histórico de treino; o `typecheck` passou.
- A busca por `new Date().toISOString()` ainda encontra timestamps (`createdAt`, `updatedAt`, `happenedAt`, `validatedAt`) e usos fora da proatividade (XP/push). Não há mais `toISOString().slice(0, 10)` em `src/proactivity/`.

### Resultado dos comandos técnicos

| Comando | Resultado | Observação |
|---|---|---|
| Backend `npm run typecheck` | Passou | Sem erro TypeScript |
| Backend `npm run build --if-present` | Passou/no-op | Não há script `build` definido |
| Backend `npm test` | Falhou | Falhas fora da proatividade: 401 em rotas admin/coach, weekly diet/workout e histórico de treino |
| Frontend `npm run lint` | Passou com warnings | 0 errors, 19 warnings preexistentes |
| Frontend `npm run build` | Falhou | Erro fora da proatividade em `components/guto/guto-app.tsx:1988`: `EvolutionStage` `"elite"` incompatível com `"legend" | "master"` |

### Como testar manualmente agora

#### Cenário A — confirmação
1. Usuário fala: "Quinta vou para Roma."
2. Após extração, verificar memória `pending_confirmation`.
3. GUTO pergunta: "Roma quinta, certo?"
4. Usuário responde: "sim".

Esperado:
- `/confirm` chamado uma vez.
- Memória sai de `pending_confirmation`.
- Memória vira `confirmed` e depois `enriched` se enriquecimento conseguir rodar.
- GUTO não pergunta a mesma coisa de novo.

#### Cenário B — descarte
1. Com memória pendente, GUTO pergunta: "Roma quinta, certo?"
2. Usuário responde: "não, não vou mais".

Esperado:
- `/discard` chamado uma vez.
- Memória vira `discarded`.
- GUTO não repete a confirmação depois.

#### Cenário C — validação posterior
1. Ter memória confirmada/enriched com `dateParsed` anterior ao dia atual no `GUTO_TIME_ZONE`.
2. Abrir chat.
3. GUTO pergunta naturalmente: "E Roma, rolou?"
4. Usuário responde: "sim".

Esperado:
- Memória passa para `pending_validation` antes da injeção.
- `/validate` chamado com `outcome: "happened"`.
- Memória vira `validated_happened`.

#### Cenário D — ambiguidade
1. GUTO pergunta confirmação.
2. Usuário responde: "talvez".

Esperado:
- Nenhum endpoint chamado.
- GUTO pede esclarecimento.
- Memória continua `pending_confirmation`.

#### Cenário E — correção
1. GUTO pergunta: "Roma quinta, certo?"
2. Usuário responde: "não, é sexta".

Esperado atual:
- Nenhum endpoint chamado.
- GUTO pede clareza/confirmação da correção.
- Memória continua `pending_confirmation`.
- Pendente documentado: falta endpoint update/correction.

#### Cenário F — timezone
1. Testar perto da virada de dia com `GUTO_TIME_ZONE=Europe/Rome`.
2. Usuário fala "quinta" tarde da noite.

Esperado:
- Extração recebe a data atual do timezone operacional, não UTC puro.
- `weekKey` e segunda-feira do frontend não divergem por UTC.

---

## 1. Resumo Executivo

O sistema de proatividade estava **parcialmente implementado** na auditoria original. Após a atualização Codex de 13/05/2026, o frontend passou a cobrir confirmação, descarte e validação via `proactiveMemoryAction`. O status continua **Parcial alto** até os cenários manuais A-F serem validados no app real.

---

## 2. O que está REALMENTE funcionando

### ✅ Backend — Ciclo de status
O lifecycle de status está completo e correto:

```
pending_confirmation → confirmed → enriched → surfaced → pending_validation → validated_happened / validated_postponed / discarded
```

- **Arquivo:** `guto-backend/src/proactivity/types.ts`
- Status cobre todos os estados necessários
- `pending_confirmation` NÃO é tratado como verdade ativa (confirmado)

### ✅ Backend — Extração (Gemini)
- **Arquivo:** `memory-extractor.ts`
- Usa Gemini 2.5 Flash Lite para extrair eventos
- Prompt explicitamente instrui a **NÃO** extrair vagueza ("maybe", "someday")
- Memórias sempre começam como `pending_confirmation` ✅
- Validação sanitiza campos (tamanho máximo, regex ISO date)
- Timeout de 8s, fallback silencioso

### ✅ Backend — Confirmação dispara enriquecimento
- **Arquivo:** `server.ts` — endpoint `POST /guto/proactivity/confirm`
- POST `/confirm` muda status para `confirmed`
- Dispara `enrichPendingMemories()` em background (fire-and-forget)
- Enriquecimento busca clima (wttr.in) e feriados (date.nager.at) APENAS após confirmação ✅
- Falhas de API não quebram o sistema (try/catch com fallback null)

### ✅ Backend — Descarte
- POST `/discard` muda status para `discarded` ✅

### ✅ Backend — Validação
- POST `/validate` aceita `happened | postponed | discarded`
- Mapeia para `validated_happened | validated_postponed | discarded` ✅
- Registra `validatedAt` ✅

### ✅ Backend — Injeção de prompt
- `buildProactivityContextBlock()` é chamado no POST `/guto`
- Injeta bloco de proatividade no prompt do GUTO
- Falha silenciosamente (`.catch(() => null)`) ✅
- Pending confirmation injeta instrução de confirmar com usuário ✅
- Memórias confirmed/enriched são apresentadas como contexto natural ✅
- Memórias pending_validation pedem validação ✅

### ✅ Backend — Weekly conversation
- `openWeeklyConversation()` marca semana como aberta ✅
- `getWeeklyCheckResult()` retorna se deve abrir semanal e/ou validar ✅

### ✅ Backend — APIs externas
- wttr.in: sem API key, timeout 5s, fallback null ✅
- date.nager.at: sem API key, timeout 5s, fallback [] ✅
- Ambas falham graciosamente sem quebrar nada ✅

### ✅ Frontend — Extração
- `extractProactivityEvents()` chamado após 6+ mensagens (`chat-tab.tsx`) ✅
- Proteção contra chamadas repetidas: `hasExtractedThisWeek()` (localStorage) ✅
- Roda em background (void...catch) sem bloquear chat ✅

### ✅ Frontend — Abertura semanal
- `openWeeklyConversation()` chamado na segunda-feira (`chat-tab.tsx`) ✅
- Proteção contra chamadas repetidas: `hasOpenedWeeklyThisWeek()` ✅

### ✅ Frontend — API definitions
- `ProactiveMemory` type definido ✅
- `extractProactivityEvents()` ✅
- `openWeeklyConversation()` ✅
- `getProactiveMemories()` ✅

---

## 3. O que estava só no BACKEND e agora foi integrado

### ✅ `/guto/proactivity/confirm`
- Endpoint existe e funciona no backend
- Agora é chamado pelo `chat-tab.tsx` quando o `/guto` retorna `proactiveMemoryAction: { type: "confirm", memoryId }`
- Guarda de status: só altera memórias `pending_confirmation`

### ✅ `/guto/proactivity/discard`
- Endpoint existe e funciona no backend
- Agora é chamado pelo `chat-tab.tsx` quando o `/guto` retorna `proactiveMemoryAction: { type: "discard", memoryId }`
- Guarda de status: só descarta memórias `pending_confirmation`

### ✅ `/guto/proactivity/validate`
- Endpoint existe e funciona no backend
- Agora é chamado pelo `chat-tab.tsx` quando o `/guto` retorna `proactiveMemoryAction: { type: "validate", memoryId, outcome }`
- Guarda de status: só valida memórias `pending_validation`

### ⚠️ `/guto/proactivity/memories` (GET)
- Endpoint existe no backend
- `getProactiveMemories()` existe no frontend (lib/api/guto.ts)
- **Mas NÃO é chamado por nenhum componente** — não há UI para listar memórias

---

## 4. O que está INTEGRADO no frontend

| Funcionalidade | Status | Arquivo |
|---|---|---|
| Extração de eventos | ✅ Funcional | `chat-tab.tsx` |
| Abertura semanal (Monday) | ✅ Funcional | `chat-tab.tsx` |
| Confirmação de memória | ✅ Integrado | chat-tab.tsx + lib/api/guto.ts |
| Descarte de memória | ✅ Integrado | chat-tab.tsx + lib/api/guto.ts |
| Validação pós-evento | ✅ Integrado | chat-tab.tsx + lib/api/guto.ts |
| Listagem de memórias | ❌ Ausente | — |

---

## 5. Análise detalhada por ponto de auditoria

### 5.1 Backend — Status de memórias

| Ponto | Status | Detalhe |
|---|---|---|
| Status lifecycle completo | ✅ | pending_confirmation → confirmed → enriched → surfaced → pending_validation → validated_happened/validated_postponed/discarded |
| Extração começa como pending | ✅ | `buildPendingMemoryData()` sempre seta `status: 'pending_confirmation'` |
| Pending não é tratado como verdade | ✅ | `proactivity-injector.ts` separa `pendingConfirmation` de `activeMemories` no prompt |
| Confirm muda status corretamente | ✅ | `updateProactiveMemory(userId, memoryId, { status: 'confirmed' })` |
| Discard descarta corretamente | ✅ | `discardProactiveMemory()` seta `status: 'discarded'` e `validatedAt` |
| Validate registra corretamente | ✅ | Aceita happened/postponed/discarded com `validatedAt` |
| Enrichment só após confirmação | ✅ | `enrichPendingMemories()` filtra por `status: ['confirmed']` |
| Falhas de wttr.in não quebram chat | ✅ | try/catch com fallback null |
| Falhas de date.nager.at não quebram chat | ✅ | try/catch com fallback [] |

### 5.2 Backend — Datas relativas e timezone

| Ponto | Status | Detalhe |
|---|---|---|
| `todayISO` passado ao extractor | ✅ | Usa `todayKey()` com `GUTO_TIME_ZONE`, não UTC puro |
| Gemini resolve datas relativas | ✅ | Recebe a data atual no timezone operacional do GUTO. Ainda não existe timezone por usuário |
| `buildProactivityContextBlock` usa timezone correto | ✅ | Usa `opCtx.weekday` que vem de `getOperationalContext()` com `GUTO_TIME_ZONE` |
| `getWeekKey()` no backend | ✅ | Usa `config.timeZone` via `getDateKey()` |
| `isTodayMonday()` no frontend | ✅ | Usa `NEXT_PUBLIC_GUTO_TIME_ZONE || "Europe/Rome"` |

### 5.3 Frontend — Integração

| Ponto | Status | Detalhe |
|---|---|---|
| `/extract` chamado no momento certo | ✅ | Após 6+ mensagens, uma vez por semana |
| Evita chamar toda hora | ✅ | `hasExtractedThisWeek()` com localStorage |
| `/confirm` integrado | ✅ | `proactiveMemoryAction.type === "confirm"` |
| `/discard` integrado | ✅ | `proactiveMemoryAction.type === "discard"` |
| `/validate` integrado | ✅ | `proactiveMemoryAction.type === "validate"` |
| `/open-weekly` integrado | ✅ | Chamado na segunda-feira |
| `/memories` integrado | ❌ | Função existe, nenhum componente chama |

### 5.4 Prompt do GUTO — Injeção de contexto

| Ponto | Status | Detalhe |
|---|---|---|
| `buildProactivityContextBlock` injeta contexto | ✅ | Chamado no POST `/guto` e injetado no prompt |
| Pending força confirmação | ✅ | Seção `[PROATIVIDADE — CONFIRMAÇÃO PENDENTE]` instrui confirmar |
| Confirmed/enriched usados naturalmente | ✅ | Seção `[PROATIVIDADE — CONTEXTO DA SEMANA]` |
| Memória passada pede validação | ✅ | Seção `[PROATIVIDADE — VALIDAÇÃO DA SEMANA PASSADA]` |
| GUTO não fala como robô | ✅ | Texto natural, sem template fixo, instrui "naturalmente" |
| Falha não quebra chat | ✅ | `.catch(() => null)` no call e `try/catch` no injector |

---

## 6. Cenários de teste manual

### Cenário A: "Quinta vou para Roma"
**Fluxo esperado:**
1. ✅ Usuário diz "Quinta vou para Roma" no chat
2. ✅ Após 6+ mensagens, `extractProactivityEvents()` envia conversa ao backend
3. ✅ Gemini extrai: `{ type: "trip", rawText: "Quinta vou para Roma", understood: "Viagem para Roma na quinta", dateText: "quinta", dateParsed: "2026-05-15", location: "Roma" }`
4. ✅ Memória salva como `pending_confirmation`
5. ✅ Na próxima conversa, `buildProactivityContextBlock()` injeta `[PROATIVIDADE — CONFIRMAÇÃO PENDENTE]`
6. ✅ GUTO pergunta naturalmente: "Roma quinta, certo?"
7. ✅ Usuário confirma → `/guto` retorna `proactiveMemoryAction` com `memoryId`
8. ✅ Frontend chama `/confirm`; enrichment é disparado em background pelo backend

### Cenário B: "Talvez eu viaje"
**Fluxo esperado:**
1. ✅ Gemini instruído a NÃO extrair vagueza
2. ✅ Se extrair por erro, fica `pending_confirmation`
3. ✅ GUTO pede confirmação antes de tratar como certeza
4. ✅ Se o usuário negar/cancelar claramente, frontend chama `/discard`

### Cenário C: "Vou viajar" (sem cidade)
**Fluxo esperado:**
1. ✅ Gemini pode extrair evento incompleto sem `location`
2. ✅ GUTO pergunta cidade/data antes de enriquecer
3. ✅ `enrichMemory()` só chama wttr.in se `memory.location && memory.dateParsed`
4. ✅ Não chama clima sem cidade

### Cenário D: "Não vou mais"
**Fluxo esperado:**
1. ⚠️ GUTO precisa entender contexto da conversa (memória pending)
2. ⚠️ GUTO deve perguntar "está falando da viagem?"
3. ✅ GUTO sinaliza descarte via `proactiveMemoryAction`
4. ✅ Frontend chama `/discard`

### Cenário E: correção ("não, é sexta")
**Fluxo esperado:**
1. ✅ GUTO pergunta confirmação de uma memória específica
2. ✅ Usuário responde: "não, é sexta"
3. ✅ Nenhum endpoint de confirmação/descarte/validação é chamado
4. ✅ GUTO pede clareza/confirmação da correção
5. ⚠️ Memória continua `pending_confirmation` até existir endpoint update/correction

### Cenário F: timezone
**Fluxo esperado:**
1. ✅ Usuário menciona "quinta" perto da virada de dia
2. ✅ `/extract` recebe data atual no `GUTO_TIME_ZONE`
3. ✅ `weekKey` e segunda-feira local usam `NEXT_PUBLIC_GUTO_TIME_ZONE || "Europe/Rome"` no frontend
4. ✅ Backend não usa `toISOString().slice(0, 10)` em `src/proactivity/`

---

## 7. Riscos

### P0 — Bloqueante (sistema não funciona end-to-end)

1. **Resolvido — Frontend chama `/confirm`**: resposta clara gera `proactiveMemoryAction` amarrado a `memoryId` e o frontend confirma.

2. **Resolvido — Frontend chama `/discard`**: negação/cancelamento claro descarta a hipótese.

3. **Resolvido — signal existe**: `proactiveMemoryAction` é o contrato entre modelo e frontend.

4. **Resolvido — Frontend chama `/validate`**: validação pós-evento usa `outcome: happened | postponed | discarded`.

### P1 — Importante (funciona mas com falhas)

5. **Resolvido no escopo atual — Timezone operacional**: backend usa `GUTO_TIME_ZONE`/`config.timeZone` para data e week key; frontend usa `NEXT_PUBLIC_GUTO_TIME_ZONE || "Europe/Rome"` para semana/segunda-feira. Ainda não há timezone por usuário.

6. **Sem expiração de pending_confirmation**: Se o usuário nunca confirma, a memória permanece pendente para sempre, pedindo confirmação toda semana.

7. **Timezone por usuário ainda não existe**: O extractor usa o timezone operacional do GUTO, não um fuso individual por usuário.

8. **`/memories` GET não é usado**: Não há UI para listar memórias ativas.

### P2 — Menor (funciona, melhoria futura)

9. **`enrichPendingMemories()` enriches ALL confirmed**: Quando confirma uma memória, enriches todas as confirmed do usuário, não só a nova. Não é bug, é ineficiência.

10. **Resolvido — Frontend `ProactiveMemory` type completo para enrichment**: `weatherEnrichment` e `holidayEnrichment` foram adicionados.

11. **Resolvido — `isTodayMonday()` com timezone operacional**: Usa `NEXT_PUBLIC_GUTO_TIME_ZONE || "Europe/Rome"`.

---

## 8. Variáveis de ambiente necessárias

| Variável | Necessária? | Uso |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Já existe | Usada pelo extractor (`memory-extractor.ts`) |
| Nenhuma API key de clima | ✅ | wttr.in é gratuito, sem key |
| Nenhuma API key de feriado | ✅ | date.nager.at é gratuito, sem key |

---

## 9. Como testar manualmente

### Teste 1: Extração
1. Abrir o app e ter uma conversa com 6+ mensagens mencionando um evento futuro
2. Verificar no localStorage se `guto-proactivity-extracted:{userId}:{weekKey}` foi setado
3. Verificar no memory-store se uma memória `pending_confirmation` foi criada

### Teste 2: Injeção de prompt
1. Ter uma memória `pending_confirmation` no store
2. Enviar uma mensagem ao GUTO
3. Verificar se a resposta demonstra conhecimento do evento e pede confirmação

### Teste 3: Confirmação
1. Criar ou simular memória `pending_confirmation`
2. Enviar mensagem para o GUTO até ele perguntar confirmação
3. Responder confirmação clara
4. Verificar chamada `/confirm` e mudança de status para `confirmed`/`enriched`

### Teste 4: Enriquecimento
1. **Depende de Teste 3** (precisa de memória `confirmed`)
2. Após confirmar, verificar se `weatherEnrichment` e `holidayEnrichment` foram preenchidos
3. Testar com cidade inválida → deve falhar graciosamente

### Teste 5: Validação
1. Ter memória confirmada/enriched com `dateParsed` anterior ao dia atual
2. Enviar mensagem ao GUTO e verificar pergunta de validação
3. Responder "sim", "adiei" ou "cancelei"
4. Verificar chamada `/validate` com `happened`, `postponed` ou `discarded`

---

## 10. Arquivos analisados

### Backend
- `guto-backend/src/proactivity/types.ts` — Tipos e status lifecycle
- `guto-backend/src/proactivity/proactive-store.ts` — Persistência em memory-store
- `guto-backend/src/proactivity/memory-extractor.ts` — Extração via Gemini
- `guto-backend/src/proactivity/memory-enricher.ts` — Clima (wttr.in) e feriados (date.nager.at)
- `guto-backend/src/proactivity/proactivity-injector.ts` — Injeção no prompt do GUTO
- `guto-backend/src/proactivity/weekly-conversation.ts` — Lógica de segunda-feira
- `guto-backend/src/proactivity/index.ts` — Exports públicos
- `guto-backend/server.ts` — Endpoints e integração com prompt

### Frontend
- `guto-app-v0/lib/api/guto.ts` — API types e funções
- `guto-app-v0/components/guto/tabs/chat-tab.tsx` — Integração de extração e weekly

---

## Resultado do QA manual — 13/05/2026

QA executado em integração local contra endpoints reais do backend, com store temporário e validação do contrato frontend por código. O app não pode ser aprovado como fluxo real completo nesta rodada porque o build frontend segue bloqueado por erro fora da proatividade em `guto-app-v0/components/guto/guto-app.tsx:1988`, e parte dos testes de chat ficou bloqueada por quota/rate limit do Gemini.

| Cenário | Status | Observação |
|---|---|---|
| A — confirmação | FAIL | Em rodada com memória `pending_confirmation` criada, o `/guto` respondeu com foco de treino e não retornou `proactiveMemoryAction`. Após ajuste de prioridade do prompt, a repetição foi bloqueada porque `/extract` retornou 0 por quota/rate limit do Gemini. |
| B — descarte | PASS | Com memória `pending_confirmation` preparada, resposta "não, não vou mais" retornou ação `discard`, chamou `/discard` uma vez, mudou status para `discarded` e uma nova extração idêntica não recriou a hipótese. |
| C — validação posterior | FAIL | A promoção de memória passada para `pending_validation` funcionou, mas o `/guto` entrou em fallback por quota/rate limit e não retornou `validate/happened`, `validate/postponed` ou `validate/discarded`. |
| D — ambiguidade | FAIL | A memória continuou `pending_confirmation` e nenhum endpoint foi chamado, mas o GUTO respondeu fallback de conexão em vez de pedir esclarecimento. |
| E — correção sem endpoint | FAIL | A memória continuou `pending_confirmation` e nenhum endpoint foi chamado, mas o GUTO respondeu fallback de conexão em vez de pedir clareza sobre a correção "não, é sexta". Pendente: endpoint futuro de update/correction. |
| F — timezone | PASS | Backend usa `GUTO_TIME_ZONE`/`config.timeZone` para `todayKey`/`weekKey`; frontend usa `NEXT_PUBLIC_GUTO_TIME_ZONE || "Europe/Rome"`; não há `toISOString().slice(0, 10)` em `src/proactivity/` para datas relativas. |

**Status final após QA:** **Parcial alto / pendente correção específica**. O ciclo está integrado no código, mas não está aprovado para entrar como **Implementado** no contrato principal até os cenários A, C, D e E passarem no fluxo real.

### Comandos técnicos executados

| Comando | Resultado | Observação |
|---|---|---|
| Backend `npm run typecheck` | PASS | Sem erro TypeScript após o ajuste de preservação das memórias proativas. |
| Backend `npm run build --if-present` | PASS | No-op: não há script `build` definido. |
| Backend `npm test` | FAIL | Falhas fora da proatividade: 401 em rotas admin/coach/weekly diet/workout e testes antigos de histórico de treino. |
| Frontend `npm run lint` | PASS com warnings | 0 errors, 19 warnings existentes; inclui warning em `chat-tab.tsx` para `lastGutoIndex` não usado. |
| Frontend `npm run build` | FAIL | Erro fora da proatividade: `EvolutionStage` `"elite"` incompatível com `"legend" | "master"` em `components/guto/guto-app.tsx:1988`. |

### Limpeza de escopo para commit futuro

Arquivos de proatividade que podem entrar em um commit técnico, se aprovado:

- `guto-backend/server.ts`
- `guto-backend/src/proactivity/types.ts`
- `guto-backend/src/proactivity/proactive-store.ts`
- `guto-backend/src/proactivity/memory-extractor.ts`
- `guto-backend/src/proactivity/memory-enricher.ts`
- `guto-backend/src/proactivity/proactivity-injector.ts`
- `guto-backend/src/proactivity/weekly-conversation.ts`
- `guto-backend/src/proactivity/index.ts`
- `guto-app-v0/lib/api/guto.ts`
- `guto-app-v0/components/guto/tabs/chat-tab.tsx`
- `GUTO_PROACTIVITY_AUDIT.md`

Arquivos fora do escopo que não devem entrar neste commit:

- `.DS_Store`
- `AGENTS.md`, salvo se a alteração for intencional e separada
- Alterações em design, GUTO Online, dieta, arena, percurso, evolução, voz ou traduções que aparecem no worktree do frontend
- Arquivos temporários/locais como `guto-backend/tmp/*` e logs

---

## 11. Conclusão

O **backend está integrado para o ciclo técnico atual**, mas o QA manual dirigido reprovou a aprovação final. O ciclo de status, o prompt injection, o enriquecimento condicional, as APIs externas e os guards de transição estão implementados para confirmação, descarte e validação, e foi corrigido um bug crítico em que o `/guto` podia apagar `proactiveMemories` ao salvar a memória operacional.

O **frontend agora cobre o ciclo de confirmação/validação**. A extração e abertura semanal continuam funcionando, e os endpoints `/confirm`, `/discard` e `/validate` são chamados a partir de `proactiveMemoryAction`.

**Os gargalos restantes são**: prioridade confiável do modelo quando há confirmação/validação pendente, execução dos cenários bloqueados por quota/rate limit no fluxo real, e correção estruturada de memória. Se o usuário responder "não, é sexta", o sistema não deve descartar automaticamente; por enquanto o GUTO deve pedir clareza e a memória continua pendente.

**Próximos passos recomendados:**

1. **P0**: Corrigir/retestar os cenários A, C, D e E até passarem no fluxo real.

2. **P1**: Criar endpoint de correção/update de memória para casos como "não, é sexta".

3. **P1**: Adicionar expiração automática de `pending_confirmation` (ex: 7 dias sem confirmação → auto-discard)

4. **P2**: Avaliar UI de listagem de memórias, sem bloquear o fluxo via chat

5. **P2**: Adicionar teste automatizado específico para `proactiveMemoryAction`
