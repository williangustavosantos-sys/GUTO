# GUTO

GUTO e um sistema de acao e accountability. A interface roda em Next.js e o
backend Express concentra as chamadas de IA, voz e transcricao.

## Estrutura

- `guto-app-v0`: app Next.js.
- `guto-backend`: API Express em `https://81x7l2cj-3001.euw.devtunnels.ms/`.

## Rodar Localmente

1. Instale dependencias do app:
   `cd guto-app-v0 && npm install`
2. Instale dependencias do backend:
   `cd ../guto-backend && npm install`
3. Configure `guto-backend/.env`:
   `GEMINI_API_KEY=...`
   `VOICE_API_KEY=...`
   `OPENAI_API_KEY=...`
4. Opcionalmente configure `guto-app-v0/.env.local`:
   `NEXT_PUBLIC_API_URL=https://81x7l2cj-3001.euw.devtunnels.ms/`
5. Rode o backend:
   `cd guto-backend && npm run dev`
6. Rode o app:
   `cd guto-app-v0 && npm run dev`

## Notas Tecnicas

- O app usa `app/page.tsx`, `app/layout.tsx` e alias `@/*` via Next.js.
- O frontend nao deve chamar Gemini diretamente; ele chama o backend.
- O avatar oficial centraliza a escolha de video Apple `.mov` com fallback
  `.webm` para reduzir quebra visual entre Safari, Chrome e Android.
