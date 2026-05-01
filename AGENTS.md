# Constituição Operacional do GUTO para Agentes de Código

## 1. Identidade do projeto
GUTO é um app de evolução humana com treino, presença, accountability e um melhor amigo digital robótico. Ele não é chatbot genérico, não é app fitness comum e não é formulário. O foco é transformar intenção em ação.

## 2. Personalidade do GUTO
GUTO age como melhor amigo/irmão mais velho: direto, leal, proativo, curto, com postura, sem humilhar. Ele conduz, adapta e mantém a missão viva. Respostas finais do GUTO devem ser curtas, 1 a 3 frases, no idioma do usuário.

## 3. Regra central de comportamento
Nunca implementar comportamento do GUTO com listas frágeis de palavras-chave. O GUTO deve interpretar intenção, estado, contexto, memória e calibragem. Palavras específicas podem existir apenas como fallback técnico, nunca como motor principal.

## 4. Memória e calibragem
A calibragem inicial coleta:
- userAge
- biologicalSex
- trainingLevel
- trainingGoal
- preferredTrainingLocation
- trainingPathology
- selectedLanguage
- recentTrainingHistory

O GUTO nunca deve perguntar novamente algo que já está salvo. Deve usar esses dados para decidir treino, adaptar dor/limitação e responder com contexto.

## 5. Arquitetura do projeto
**Frontend:**
- `/Users/williandossantos/GUTOO/guto-app-v0`
- Next.js/React/TypeScript
- comando local: `npm run dev`
- porta esperada: 3000
- typecheck: `npx tsc --noEmit`

**Backend:**
- `/Users/williandossantos/GUTOO/guto-backend`
- Node/TypeScript
- comando local: `npm run dev`
- porta esperada: 3001
- typecheck: `npx tsc --noEmit`

## 6. Deploy
Não alterar sem autorização explícita:
- vercel.json
- railway.json
- render.yaml
- variáveis .env
- configuração de deploy
- scripts de build
- package.json scripts

Vercel continua sendo o deploy do frontend.
Backend pode usar Railway/Render conforme configuração existente.
Trocar editor/agente não muda deploy.

## 7. UI/UX
Não fazer redesign amplo sem pedido explícito.
Preservar estética GUTO:
- fundo branco futurista/cápsula
- glass/ice
- cyan
- navy
- botões grandes touch-first
- visual premium, não formulário genérico

## 8. Fluxos que não podem quebrar
**Onboarding:**
Intro → Idioma → Nome/Logo → Calibragem → Pacto → Sistema

**Chat:**
mensagem do usuário → backend /guto → Gemini com memória → resposta curta do GUTO → atualização de memória quando necessário

**Treino:**
calibragem + histórico + feedback do usuário → treino adaptado → evitar repetição burra → respeitar dor/limitação.

## 9. Regras de trabalho para o agente
Antes de alterar código:
- localizar arquivos relevantes
- explicar hipótese curta
- alterar o mínimo necessário

Depois de alterar:
- mostrar arquivos alterados
- resumir diff
- rodar typecheck do frontend/backend quando aplicável
- informar erros reais
- não inventar que testou se não testou

## 10. Proibições
- Não criar telas novas se a tela já existe.
- Não reescrever app inteiro.
- Não apagar traduções.
- Não hardcodar português.
- Não remover persistência.
- Não quebrar mobile/Safari.
- Não substituir assets sem autorização.
- Não alterar deploy sem autorização.
- Não resolver bug com regra de palavra-chave quando o problema é comportamento semântico.
