# GUTO — Módulo 1: Protocolo de Morte / Lockdown — Plano Técnico

> **Plano de engenharia. NÃO é implementação.** Nenhum código foi alterado.
> Data: 2026-05-25.
> Fontes: `docs/GUTO_INVENTARIO_COMPLETO_ESTADO_ATUAL.md` (itens 145-152, 229) e raiz `GUTO_EVOLUCAO_XP_E_MORTE_DETALHADA.md`.
> Repositórios: **CEREBROGUTO** = `guto-backend/` · **CORPOGUTO** = `guto-app-v0/`.

---

## 0. Diagnóstico que motiva o módulo

| O que a raiz exige | O que existe hoje |
|---|---|
| `gutoLifeStatus:"dead"`, `accessLocked`, `deadAt`, `deathReason` | **Não existem** no backend. |
| Guard 403 negando todas as rotas quando morto | **Nenhum guard de morte.** `requireActiveUser` só cobre assinatura (`ACCESS_PAUSED`). |
| Blackout real no app + Percurso somente-leitura | Só opacidade `0.25` do avatar (`lib/guto-vital-state.ts`). Cosmético. |
| Emissão de `GUTO_DECEASED` | Backend nunca emite; **frontend já sabe receber** (`lib/api/client.ts:186-201`). |

**Conclusão:** o frontend está ~50% pronto (interceptor + copy `deceased` em `/acesso-pausado`). O trabalho pesado é no **backend** (estado terminal + guard) e a decisão de UX é **redirect total vs. blackout in-app com Percurso legível**.

### Decisão de arquitetura (recomendada)

1. **Morte mora no `GutoMemory`** (junto de `totalXp`/`initialXpGranted`), **não** no `UserAccess`. Morte = depleção de XP (mérito); assinatura pausada/expirada = comercial. São eixos distintos e já têm códigos distintos (`GUTO_DECEASED` vs `ACCESS_PAUSED`/`SUBSCRIPTION_EXPIRED`).
2. **`accessLocked` é flag espelho** derivada de `gutoLifeStatus==="dead"`. Persistida para o painel e como backstop, mas a verdade é `gutoLifeStatus`.
3. **Dois níveis de entrega** (ver §10):
   - **Fase A (segurança, obrigatória):** detectar morte + guard 403 `GUTO_DECEASED` nas rotas de mutação. O frontend já redireciona para `/acesso-pausado`. Resolve 100% do risco de bypass.
   - **Fase B (fidelidade à doc):** blackout *dentro do app* com **Percurso somente-leitura** ("visualização nostálgica"), avatar morto em Evoluir e CTA "falar com admin". Exige manter `GET /guto/memory` aberto e o app renderizar o estado morto a partir da memória.

---

## 1. Arquivos a alterar no CEREBROGUTO (`guto-backend/`)

| Arquivo | Mudança | Por quê |
|---|---|---|
| `server.ts` (tipo `GutoMemory`, ~linhas 320-340) | Adicionar campos `gutoLifeStatus`, `accessLocked`, `deadAt`, `deathReason` ao tipo e ao `getMemory()` (defaults, ~l.1019-1024 e l.1083-1089). | Contrato de dados (ver §3). |
| `server.ts` (`appendXpEvent`, l.1425-1442) | Após `memory.totalXp = clampXp(...)`, chamar novo helper `evaluateGutoDeath(memory)`. | **Ponto único** por onde todo XP passa — captura morte por validação tardia, penalidade etc. |
| `server.ts` (novo helper `evaluateGutoDeath`, perto de `clampXp`/`grantInitialXp`) | Se `totalXp<=0 && gutoLifeStatus!=="dead"` → setar `gutoLifeStatus="dead"`, `accessLocked=true`, `deadAt=now`, `deathReason="xp_depletion"`; `appendMemoryAudit(...,"guto_death")`. Idempotente. | Centraliza a transição terminal. |
| `server.ts` (`applyDailyMissPenalty` l.1505 / `applyPendingMissPenalties` l.1518) | Nada novo se a morte for avaliada dentro de `appendXpEvent`; apenas garantir que a memória resultante seja **persistida** (`saveMemory`) quando uma penalidade matar o GUTO. | Penalidade retroativa é o caminho mais provável de morte. |
| `src/auth-middleware.ts` | Novo middleware `requireAliveGuto` (lê memória do `userId`; se `gutoLifeStatus==="dead"` → `403 {code:"GUTO_DECEASED", action:"lock_screen", status:"dead", speech:<copy idioma>}`). **Não** alterar a assinatura de `requireActiveUser`. | Guard reutilizável; separação de responsabilidades (assinatura vs. morte). |
| `server.ts` (registro de rotas) | Inserir `requireAliveGuto` **depois** de `requireActiveUser` nas rotas de mutação (lista em §5). | Aplica o guard sem tocar o middleware de assinatura. |
| `src/admin-router.ts` | (Fase B) endpoint admin para **liberar novo acesso** (reviver = decisão comercial): `POST /admin/students/:id/revive` que zera morte e credita XP inicial. Coach **não** edita XP, mas admin pode liberar novo ciclo. | A raiz diz "novo acesso é decisão administrativa fora do app". |
| `src/log-store.ts` / auditoria | Garantir tipo de evento `guto_death` e `guto_revive` na trilha. | Auditoria (raiz exige ator/horário/resumo). |
| `tests/` | Novos arquivos de teste (ver §8). | Cobertura obrigatória. |

> Observação: `GET /guto/memory` (l.6544) já chama `applyPendingMissPenalties`. Isso significa que **abrir o app pode matar o GUTO** (penalidade acumulada zera XP). Esse caminho precisa persistir o estado morto e o handler de memory **continuar respondendo 200** (ver §5/§7) com `gutoLifeStatus="dead"`.

---

## 2. Arquivos a alterar no CORPOGUTO (`guto-app-v0/`)

| Arquivo | Mudança | Fase |
|---|---|---|
| `lib/api/guto.ts` | Adicionar `gutoLifeStatus`, `accessLocked`, `deadAt`, `deathReason` ao tipo `GutoMemory` do cliente. | A |
| `lib/api/client.ts` (l.186-201) | Já trata `GUTO_DECEASED`. Para **Fase B**, **suprimir o auto-redirect** quando `code==="GUTO_DECEASED"` e o destino for telas legíveis (Percurso), deixando o app renderizar o blackout in-app. | A: nenhuma / B: ajuste fino |
| `lib/guto-vital-state.ts` | `getGutoVitalState` deve priorizar `memory.gutoLifeStatus==="dead"` sobre o cálculo por `totalXp` (hoje l.57 infere "dead" só por `totalXp<=0`). Fonte de verdade = backend. | A/B |
| `components/guto/guto-app.tsx` (render de abas, l.2095-2200) | (Fase B) Se `vitalState.state==="dead"` (ou `memory.gutoLifeStatus==="dead"`): renderizar **overlay de blackout**; Chat/Missão/Dieta/Online/Validação desabilitados; Evoluir mostra avatar morto + CTA admin; **Percurso permanece montado em modo leitura**. | B |
| `components/guto/tabs/chat-tab.tsx` | Bloquear input e exibir copy final "O GUTO apagou…" quando morto. | B |
| `components/guto/tabs/mission-tab.tsx`, `diet-tab.tsx` | Ocultar card de treino/refeições; mostrar status de morte. | B |
| `components/guto/tabs/path-tab.tsx` | Forçar `readOnly`: desabilitar qualquer ação que dispare validação/mutação; manter histórico visível. | B |
| `components/guto/tabs/arena-tab.tsx` | Exibir marcador `[DEAD]` ao lado da dupla. (depende do backend marcar; ver §5 arena). | B |
| `app/acesso-pausado/page.tsx` | Já tem copy `deceased` em 3 idiomas — **nenhuma mudança** necessária para Fase A. | — |
| `e2e/` | Novo spec de morte/lockdown (ver §8). | A/B |

---

## 3. Contrato de dados necessário

### 3.1 No `GutoMemory` (backend `server.ts` + cliente `lib/api/guto.ts`)

```ts
// Campos NOVOS (todos opcionais para retrocompatibilidade com memórias antigas)
gutoLifeStatus?: "alive" | "dead";   // default efetivo "alive" quando ausente
accessLocked?: boolean;              // espelho de (gutoLifeStatus === "dead"); default false
deadAt?: string | null;              // ISO 8601, setado na transição; null enquanto vivo
deathReason?: "xp_depletion" | null; // motivo; hoje só xp_depletion
```

Defaults em `getMemory()`:
- memória existente sem os campos → tratada como `alive` / `accessLocked:false` (não retro-mata ninguém).
- nunca derivar `dead` só de `totalXp` no backend **sem** persistir os campos — a transição é explícita e idempotente em `evaluateGutoDeath`.

### 3.2 Snapshot do estado morto (igual à raiz)

```json
{
  "totalXp": 0,
  "gutoLifeStatus": "dead",
  "accessLocked": true,
  "deadAt": "2026-05-21T18:00:00Z",
  "deathReason": "xp_depletion"
}
```

### 3.3 Contrato de negação do guard (`GUTO_DECEASED`)

HTTP **403** com corpo:

```json
{
  "code": "GUTO_DECEASED",
  "status": "dead",
  "action": "lock_screen",
  "speech": "O GUTO apagou. Este acesso terminou. Fale com o admin.",
  "message": "GUTO deceased."
}
```

- `code` = chave que o frontend já conhece (`client.ts` blockedCodes).
- `speech` localizada por idioma do usuário (pt/en/it) — reusar `pickPushCopy`/copy de morte já existente (`server.ts:6789-6811`).
- Manter **um único** código (`GUTO_DECEASED`); `GUTO_DEAD` permanece como alias aceito no frontend mas o backend emite só `GUTO_DECEASED`.

### 3.4 Login / `/auth/me`

`auth-router.ts` (`/user/login`, `/me`) deve **propagar** `gutoLifeStatus`/`accessLocked` na resposta para o app decidir o stage inicial sem precisar de uma chamada que tome 403.

---

## 4. Onde aplicar o guard de backend

- **Ponto de detecção (escrita):** dentro de `appendXpEvent` (server.ts:1425) → `evaluateGutoDeath(memory)`. É o **único funil** de XP (validação, missão adaptada, penalidade). Cobre todos os caminhos.
- **Ponto de bloqueio (leitura/ação):** novo middleware **`requireAliveGuto`** em `src/auth-middleware.ts`, encadeado **após** `requireActiveUser` nas rotas de mutação:

  ```
  app.post("/guto", requireActiveUser, requireAliveGuto, handler)
  ```

- **Por que não dentro de `requireActiveUser`?** Porque algumas rotas precisam continuar **abertas** mesmo morto (memory GET, account delete, consent revoke, arena read). Um middleware separado dá controle por rota e mantém o teste de isolamento de assinatura intacto.

---

## 5. Rotas que devem bloquear quando o GUTO está morto

### 5.1 BLOQUEAR (403 `GUTO_DECEASED`) — rotas de ação/mutação

| Rota | Arquivo:linha |
|---|---|
| `POST /guto` (chat) | server.ts:7144 |
| `POST /guto/validate-workout` | server.ts:7432 |
| `POST /guto/diet/generate` | server.ts:8032 |
| `POST /guto/online/exception` | server.ts:8441 |
| `POST /guto/events` | server.ts:661 |
| `POST /voz`, `POST /guto-audio` | server.ts:7258 / 7346 |
| `POST /guto/memory` (escrita de calibragem) | server.ts:6839 |
| `POST /guto/proactivity/*` (extract/confirm/discard/update/validate/open-weekly/request-discard/cancel) | server.ts:7672-7961 |
| `POST /guto/validate-name` | server.ts:6520 |

### 5.2 MANTER ABERTAS (leitura / saída) — necessárias para a UX de morte e LGPD

| Rota | Por quê |
|---|---|
| `GET /guto/memory` (server.ts:6544) | App precisa **carregar** `gutoLifeStatus="dead"` para renderizar o blackout e o Percurso. Retorna 200. |
| `GET /guto/arena/*` (weekly/monthly/individual/me) | Mostrar ranking com marcador `[DEAD]`; leitura não pontua. |
| `DELETE /guto/account` (server.ts:6573) | Direito de exclusão (LGPD) não pode ser bloqueado por morte. |
| `POST /guto/consent/revoke` (server.ts:6616) | Idem — revogação de consentimento sempre disponível. |
| `GET /guto/proactive` (server.ts:7009) | Leitura; opcionalmente retornar vazio quando morto. |
| `GET/POST/DELETE /guto/push/*` | Permitir cancelar push de um morto. |

### 5.3 Arena com morto

- `arena-store`/`arena.ts`: usuário morto deve aparecer com flag `[DEAD]` e **não pontuar** mais na semana/mês. Reusar `visibleInArena`/`isVisibleInRanking` + um campo derivado `isDead` no payload do ranking. (Backend marca; frontend só exibe.)

---

## 6. Como o frontend deve reconhecer `GUTO_DECEASED`

Dois caminhos, ambos já viáveis:

1. **Por resposta de memória (preferido, Fase B):** `GET /guto/memory` retorna `gutoLifeStatus:"dead"`. `GutoApp` lê isso (via `vitalState`) e entra no modo blackout **sem sair do app** — preservando o Percurso legível. `getGutoVitalState` passa a priorizar o flag do backend.
2. **Por interceptor 403 (já existe, Fase A):** qualquer mutação retorna 403 `GUTO_DECEASED`; `lib/api/client.ts:196-199` redireciona para `/acesso-pausado?reason=GUTO_DECEASED` (copy `deceased` pronta).

**Conciliação:** para a Fase B funcionar (Percurso nostálgico), o auto-redirect do interceptor deve ser **suprimido** quando o app já está renderizando o estado morto in-app (flag de contexto, ex.: `window.__gutoDeadInApp`), evitando que a primeira chamada bloqueada chute o usuário para `/acesso-pausado`. Na Fase A pura (redirect total) nada muda no interceptor.

`/auth/me` propagando `gutoLifeStatus` permite decidir o stage no boot sem depender de uma chamada que tome 403.

---

## 7. Como manter o Percurso em somente-leitura

- **Backend:** dados do Percurso vêm de `GET /guto/memory` (`validationHistory`, `completedWorkoutDates`) — rota **aberta** quando morto (§5.2). Nenhuma rota de **escrita** do Percurso deve aceitar requisição de morto (não há escrita direta de Percurso hoje; ele é alimentado por `validate-workout`, que estará **bloqueado**). Logo, Percurso fica naturalmente imutável.
- **Frontend (`path-tab.tsx`):** quando `gutoLifeStatus==="dead"`:
  - Renderizar o histórico normalmente (cards, datas, fotos).
  - Desabilitar/ocultar qualquer CTA que inicie treino/validação.
  - `vitalState.opacity` já reduz visualmente; adicionar selo "Percurso — somente leitura".
- **Garantia anti-bypass:** mesmo que o usuário force um POST `validate-workout`, o guard `requireAliveGuto` nega (403). Frontend read-only é UX; backend é a autoridade.

---

## 8. Testes obrigatórios

### Backend (`guto-backend/tests/`) — novo `guto-death-lockdown.test.ts`
1. XP chega a 0 via penalidade → `gutoLifeStatus="dead"`, `accessLocked=true`, `deadAt` setado, `deathReason="xp_depletion"`.
2. `clampXp` nunca negativo **e** morte dispara exatamente em `0` (não em valores positivos).
3. Idempotência: segunda penalidade não reescreve `deadAt` nem duplica evento de auditoria.
4. Guard: cada rota de §5.1 retorna **403 `GUTO_DECEASED`** com `action:"lock_screen"`.
5. Rotas de §5.2 (`GET /guto/memory`, `DELETE /guto/account`, `consent/revoke`, arena read) retornam **200/sucesso** mesmo morto.
6. `speech` de negação vem no idioma do usuário (pt/en/it).
7. Morto não pontua na Arena (validação bloqueada → XP não muda; ranking marca `[DEAD]`).
8. `/auth/login` e `/auth/me` propagam `gutoLifeStatus`.
9. (Fase B) `POST /admin/students/:id/revive` (admin) restaura `alive` + XP inicial; coach **não** pode (403).
10. **Regressão:** assinatura pausada continua emitindo `ACCESS_PAUSED` (não confundir com `GUTO_DECEASED`).

> Rodar com `node scripts/run-guto-tests.mjs` (hoje: 24 suítes / ~302 testes / 0 falhas — manter verde).

### Frontend (`guto-app-v0/`)
11. Unit (`lib/guto-vital-state`): `gutoLifeStatus="dead"` força estado `dead` independente de `totalXp`.
12. e2e (`e2e/morte-lockdown.spec.ts`): app com memória morta → blackout; chat input desabilitado; Percurso visível e somente-leitura; Evoluir mostra avatar morto + CTA admin; 3 idiomas.
13. e2e: mutação retorna 403 → redirect `/acesso-pausado?reason=GUTO_DECEASED` (Fase A) **ou** blackout in-app (Fase B), conforme estratégia escolhida.

---

## 9. Risco de quebrar outras partes (blast radius)

| Risco | Probabilidade | Mitigação |
|---|---|---|
| `GET /guto/memory` matar o GUTO ao abrir (penalidade retroativa) e o handler não persistir o estado | Média | `evaluateGutoDeath` dentro de `appendXpEvent` + `saveMemory` no fim do handler; teste #1/#5. |
| Encadear guard em `requireActiveUser` quebrar isolamento/assinatura | Alta se feito errado | **Não** mexer em `requireActiveUser`; usar middleware separado `requireAliveGuto` por rota. |
| Auto-redirect do interceptor impedir Percurso nostálgico (Fase B) | Alta | Suprimir redirect para `GUTO_DECEASED` quando em modo in-app (§6). |
| Bloquear rota de leitura/LGPD por engano (account delete, consent) | Média | Lista explícita §5.2 + teste #5. |
| Memórias antigas com `totalXp<=0` "ressuscitarem mortas" no deploy | Média | Default `alive` quando campos ausentes; morte só por transição explícita; **não** retro-matar no migrate. |
| Desync Arena vs avatar ao marcar `[DEAD]` | Baixa | Reusar fonte única de XP; marcação é derivada, não recalcula XP. |
| Tela de morte sem caminho de saída comercial | Baixa | CTA "falar com admin" + endpoint admin `revive` (Fase B). |
| `tsc` quebrar por campos novos no tipo do cliente | Baixa | Adicionar campos opcionais nos dois tipos `GutoMemory` (back e front) no mesmo PR; rodar `tsc --noEmit` nos dois repos. |

**Áreas que NÃO devem ser tocadas:** isolamento de time (`admin-router`/`auth-middleware` lógica de team — 55 testes), gate de vídeo, geração de dieta/treino, persistência otimista do chat. O guard de morte é aditivo.

---

## 10. Ordem de implementação mais segura

> Cada passo: ler README + este doc, alterar o menor bloco, `tsc --noEmit` + testes, só então avançar. Backend antes do frontend (backend é a autoridade).

**Fase A — Segurança (obrigatória, baixo risco):**
1. **Contrato de dados** no `GutoMemory` (backend) + defaults em `getMemory` + propagar em `/auth/me` e login. (sem comportamento ainda)
2. **`evaluateGutoDeath`** chamado em `appendXpEvent`; persistir em quem credita/debita XP. Teste #1-#3.
3. **`requireAliveGuto`** + encadear nas rotas de §5.1. Teste #4, #6, #10.
4. **Garantir §5.2 abertas** (memory GET, account delete, consent, arena read). Teste #5.
5. **Cliente:** adicionar campos ao tipo `GutoMemory` (front) + confirmar interceptor (`GUTO_DECEASED`→`/acesso-pausado`, copy `deceased` pronta). `tsc` front. Teste #13 (redirect).
   → **Neste ponto o risco crítico (bypass) está fechado.**

**Fase B — Fidelidade à doc (Percurso nostálgico, médio risco):**
6. **`getGutoVitalState`** prioriza `gutoLifeStatus` do backend. Teste #11.
7. **Blackout in-app** em `guto-app.tsx` + supressão de redirect para `GUTO_DECEASED`. Chat/Missão/Dieta/Online desabilitados.
8. **Percurso somente-leitura** (`path-tab.tsx`) + **Evoluir** avatar morto + CTA admin + **Arena `[DEAD]`**. Teste #12.
9. **Caminho comercial:** `POST /admin/students/:id/revive` (admin-only) + auditoria `guto_revive`. Teste #9.
10. e2e completo 3 idiomas + screenshots de evidência; rodar suíte backend completa e `next build`.

**Critério de pronto:** suíte backend verde (≥302 + novos), `tsc --noEmit` 0 nos dois repos, e2e de morte passando, e nenhuma rota de §5.1 acessível por conta morta (verificado por teste, não por inspeção visual).

---

### Apêndice — âncoras de código (para quem for implementar)

- Funil de XP / clamp: `guto-backend/server.ts:1421-1442` (`clampXp`, `appendXpEvent`).
- Penalidade/retroativo: `server.ts:1505-1530` (`applyDailyMissPenalty`, `applyPendingMissPenalties`).
- `getMemory`/`saveMemory` + defaults: `server.ts:998-1129`.
- Tipo `GutoMemory` (campos `totalXp`/`initialXpGranted`/`streak`): `server.ts:~320-340`.
- Middleware chokepoint: `src/auth-middleware.ts:171-186` (`requireActiveUser`) e store de assinatura `src/user-access-store.ts:191-199` (`requireActiveUserAccess`).
- Copy de morte por idioma: `server.ts:6789-6811` (`pickPushCopy`).
- Interceptor + códigos: `guto-app-v0/lib/api/client.ts:186-201`.
- Página de bloqueio (copy `deceased` 3 idiomas): `guto-app-v0/app/acesso-pausado/page.tsx:12-100`.
- Cálculo visual atual (a ajustar): `guto-app-v0/lib/guto-vital-state.ts:41-75`.
- Pontos de render de abas (injeção do blackout): `guto-app-v0/components/guto/guto-app.tsx:2088-2200`.
