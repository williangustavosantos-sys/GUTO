# GUTO Security & Access Flow

Este documento explica o novo sistema de acesso privado e pago do GUTO.

## Fluxo de Autenticação

1.  **Convite:** O Admin ou Coach gera um convite no painel. Isso cria um `userId` inativo e um token único de 32 bytes.
2.  **Hash do Token:** O token é salvo apenas como um hash SHA-256 no backend. O link enviado ao aluno é `FRONTEND_URL/convite/[token]`.
3.  **Claim do Convite:** O aluno abre o link, define uma senha e ativa a conta. O convite é marcado como usado (`active`).
4.  **Sessão:** O login gera um JWT assinado com `JWT_SECRET`. O token expira em 7 dias (configurável).
5.  **Identificação:** O `userId` é extraído do JWT no backend. Chamadas do frontend não podem mais escolher o `userId` via query/body em rotas protegidas.

## Níveis de Acesso (RBAC)

-   **Admin:** Acesso total. Pode criar convites, gerenciar qualquer usuário e resetar o sistema.
-   **Coach:** Pode gerenciar apenas os alunos vinculados ao seu `coachId`.
-   **Student:** Acesso ao GutoApp (Chat, Treino, Dieta, Arena).

## Gerenciamento de Assinatura

-   O status da assinatura pode ser `pending_payment`, `active`, `expired` ou `cancelled`.
-   Acesso ao app (`GutoApp`) exige `active: true` e `subscriptionStatus: "active"`.
-   O Coach/Admin pode renovar o acesso por 30 dias manualmente através do painel.

## Segurança de Dados

-   **Senhas:** Hasheadas com bcrypt (salt rounds: 10).
-   **JWT:** Requerido para todas as rotas em `/guto/*`.
-   **Persistência:** Suporte a Upstash Redis para ambientes serverless, com fallback para sistema de arquivos local.
-   **CORS:** Restrito às origens configuradas em `GUTO_ALLOWED_ORIGINS`.

## Bypass de Desenvolvimento

-   O modo dev (`GUTO_ALLOW_DEV_ACCESS=true`) permite bypass de login para testes locais, mas deve ser desativado em produção.
