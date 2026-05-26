# QA manual — iPhone/Safari — Fase 3 (BUG 1 dieta · BUG 2 chat · BUG 3 troca)

Validação manual obrigatória no **iPhone real (Safari)**, porque Playwright/headless
**não** simula o teclado do iOS. Fazer com conta de teste já calibrada.

Pré-requisitos: app de produção (Vercel) apontando para o backend atual; conta com
calibragem válida (idade, sexo, altura, peso, país/cidade, nível, objetivo, local).

## BUG 1 — Dieta gera plano válido
- [ ] Abrir aba **Dieta** com calibragem válida → aparece um plano de refeições (NÃO "A dieta falhou na checagem final / plano duvidoso").
- [ ] Calibragem com **"não como lactose"** → gerar dieta → nenhum laticínio (leite, queijo, iogurte) no cardápio.
- [ ] A aba Dieta **não** mostra texto de patologia/limitação física (ex.: "vi que você colocou ... como limitação").
- [ ] Trocar peso/objetivo na calibragem → regenerar → novo plano coerente, sem falha de checagem.

## BUG 2 — Chat no iPhone (teclado)
Teclado **fechado**:
- [ ] Mensagens (balões) legíveis e completas.
- [ ] Campo de input no rodapé, acima da bottom-nav, sem cobrir mensagens.
- [ ] Botão enviar visível e clicável.

Teclado **aberto** (tocar no input):
- [ ] O input **sobe** junto com o teclado e fica logo acima dele.
- [ ] As últimas mensagens continuam visíveis (não ficam atrás do teclado).
- [ ] Nenhum balão fica **atrás** do input.
- [ ] A bottom-nav **some** (não compete com o chat).
- [ ] O avatar encolhe/some e não rouba a área de leitura.
- [ ] Rolar a lista funciona; ao enviar, rola para a última mensagem.

Notch / home indicator:
- [ ] Nada fica colado na borda inferior (home indicator) nem sob o notch.

## BUG 3 — "Troca" no contexto de exercício
No treino do dia, tocar no **"?"** de um exercício (ex.: "Cadeira abdutora"):
- [ ] Digitar **"Troca"** → o GUTO **pergunta o motivo** ("Trocar por quê: dor, equipamento ocupado ou dificuldade de execução?") — **não** dá dica de execução.
- [ ] Responder **"equipamento ocupado"** → o GUTO oferece substituição equivalente.
- [ ] Responder **"dor"** → o GUTO entra em segurança (pausa, pergunta onde dói), não insiste no exercício.
- [ ] Digitar **"como faço esse?"** → o GUTO dá orientação de execução (cue), normalmente.
- [ ] No chat **sem** contexto de exercício, digitar "troca" → o GUTO pergunta **qual** exercício trocar.
- [ ] Em nenhum momento o GUTO afirma que entendeu sem validar.

## Observação de cobertura automatizada
- Backend (determinístico): coberto por `tests/guto-exercise-swap.test.ts` (BUG 3) e
  `tests/guto-diet-generation.test.ts` (contrato de dieta que o app passa a confiar).
- Frontend: `lib/diet-plan.ts` coberto por `tests/diet-plan.test.ts`; meta viewport por
  `e2e/viewport-fit.spec.ts`. O **teclado iOS real** não é coberto por Playwright — daí
  este checklist manual.
