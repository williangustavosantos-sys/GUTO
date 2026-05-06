# GUTO Beta Smoke Test

Checklist manual para validar o beta privado em produção antes de liberar para 3 a 5 alunos reais.

## 1. Deploy

- [ ] Backend Render está no commit correto.
- [ ] Frontend Vercel está no commit correto.
- [ ] `GET /health` do backend responde com `ok: true`.
- [ ] Frontend abre sem erro no domínio Vercel.
- [ ] Console do navegador não mostra erro crítico de API, CORS ou runtime.

## 2. Auth/Admin

- [ ] Login `super_admin` funciona.
- [ ] Criar ou localizar um Time.
- [ ] Ver summary do Time.
- [ ] Ver limites do plano no painel.
- [ ] Painel não exibe dados antes de autenticar.

## 3. GUTO Time

- [ ] Criar Time teste: `Personal Willian`.
- [ ] Plano: `GUTO Time Start`.
- [ ] Criar 1 admin do Time.
- [ ] Criar 1 coach.
- [ ] Criar 2 alunos.
- [ ] Confirmar que admin vê todos do Time.
- [ ] Confirmar que coach vê só seus alunos.
- [ ] Confirmar que outro Time não aparece.
- [ ] Confirmar que plano cheio bloqueia criação com erro recuperável.

## 4. Aluno

- [ ] Abrir convite.
- [ ] Fazer onboarding.
- [ ] Preencher calibragem.
- [ ] Confirmar `phone`, `email`, `name`, `gender` e `age` quando aplicável.
- [ ] Entrar no chat.
- [ ] Confirmar que o app mantém idioma selecionado.

## 5. Treino

- [ ] Pedir treino.
- [ ] Confirmar exercícios com vídeo local.
- [ ] Confirmar que não existe exercício sem mídia.
- [ ] Trocar exercício se necessário.
- [ ] Validar treino.
- [ ] Confirmar XP, avatar e ranking após validação.

## 6. Dieta

- [ ] Gerar dieta.
- [ ] Confirmar edição por admin ou coach.
- [ ] Confirmar que aluno visualiza dieta.
- [ ] Confirmar que aluno de outro Time não acessa dieta.

## 7. Arena

- [ ] Ver ranking semanal do Time.
- [ ] Ver ranking mensal do Time.
- [ ] Confirmar ranking geral se existir.
- [ ] Confirmar que ranking geral só mostra dados públicos.

## 8. Segurança

- [ ] Coach tenta acessar aluno de outro coach: deve bloquear.
- [ ] Admin tenta acessar outro Time: deve bloquear.
- [ ] Student tenta acessar admin: deve bloquear.
- [ ] Plano cheio bloqueia criação.
- [ ] Exercício manual sem catálogo bloqueia.
- [ ] Exercício custom inválido bloqueia.
- [ ] Token ausente em endpoint admin retorna bloqueio.
- [ ] Token inválido em endpoint admin retorna bloqueio.

## 9. Critério de Aprovação Beta

- [ ] 0 erro crítico.
- [ ] 0 vazamento de dados entre Times.
- [ ] 0 treino sem vídeo.
- [ ] 0 falha de login/convite.
- [ ] 0 crash no fluxo aluno.
- [ ] Pode ir para 3 a 5 alunos reais.

