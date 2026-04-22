# Troubleshooting imediato (Next + Backend) — GUTO

## 1) Erro real de TypeScript no backend: multer sem tipos

Sintoma: `Could not find a declaration file for module 'multer'`.

No backend (`cerebro`):

```bash
npm i -D @types/multer
```

> Depois rode: `npm run dev` (backend) novamente.

---

## 2) Aviso `baseUrl` deprecado no TS

Não quebra agora, mas para evitar ruído:

- mantenha `paths` se você usa alias `@/`
- e esteja pronto para migrar no TS 7 conforme a nota da equipe TS.

Como correção prática hoje (sem quebra):

- pode manter como está no `corpo`.
- se quiser remover aviso no futuro, migrar o alias para resolução padrão do framework/build tool.

---

## 3) 404 do vídeo WebM

Seu log mostra:

```txt
GET /avatar/GUTO-BABY_alpha.webm 404
```

Isso significa que o arquivo **não está no caminho público esperado**.

### Opção A (mais simples)
Coloque o arquivo em:

```txt
<projeto-next>/public/avatar/GUTO-BABY_alpha.webm
```

E mantenha no código:

```tsx
src="/avatar/GUTO-BABY_alpha.webm"
```

### Opção B (padrão que sugerimos antes)
Coloque em:

```txt
<projeto-next>/public/assets/guto/GUTO BABY 2.webm
```

E use:

```tsx
src="/assets/guto/GUTO BABY 2.webm"
```

> Importante: nome precisa bater 100% (incluindo espaço/maiúscula).

---

## 4) Fundo preto no vídeo

Se aparece fundo preto, normalmente é um destes:

1. O arquivo não tem alpha real.
2. O navegador/codec não está lendo o alpha daquele encode.
3. Você está testando um arquivo diferente do export com alpha.

Checklist rápido:

- testar outro WebM alpha confirmado.
- validar no Chrome e Safari.
- confirmar export com canal alpha no encoder.

---

## 5) Warning de workspace root no Next

Você tem dois `package-lock.json` em níveis diferentes.

Opções:

1. remover lockfile duplicado (se não for necessário), ou
2. fixar root do Turbopack no `next.config.ts`.

Exemplo:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
```

---

## 6) Comandos de validação (ordem)

No frontend (`corpo`):

```bash
npm run dev
npm run build
```

No backend (`cerebro`):

```bash
npm i -D @types/multer
npm run dev
```

Se quiser, no próximo passo eu te passo o `app.tsx` já com **fallback automático**:
- tenta `/assets/guto/GUTO BABY 2.webm`
- se falhar, cai para `/avatar/GUTO-BABY_alpha.webm`
- e mostra badge de erro amigável na UI.
