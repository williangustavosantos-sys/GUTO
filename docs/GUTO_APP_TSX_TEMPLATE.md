# `app.tsx` completo (substituição)

Copie e cole o arquivo abaixo no seu `app.tsx` (apagando o conteúdo atual).

```tsx
"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { BottomNavigation, TabType } from "./bottom-navigation"
import { ChatTab } from "./tabs/chat-tab"
import { PathTab } from "./tabs/path-tab"
import { EvolutionsTab } from "./tabs/evolutions-tab"
import { MissionTab } from "./tabs/mission-tab"

interface GutoAppProps {
  userName: string
  language: string
}

const PANEL_ANIMATION = {
  initial: { opacity: 0, y: 12, scale: 0.985, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -12, scale: 0.985, filter: "blur(4px)" },
}

export function GutoApp({ userName, language }: GutoAppProps) {
  const [activeTab, setActiveTab] = useState<TabType>("guto")

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "guto":
        return <ChatTab userName={userName} language={language} />
      case "caminho":
        return <PathTab userName={userName} language={language} />
      case "evolucoes":
        return <EvolutionsTab userName={userName} language={language} />
      case "missao":
        return <MissionTab userName={userName} language={language} />
      default:
        return <ChatTab userName={userName} language={language} />
    }
  }, [activeTab, userName, language])

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#dff4ff_0%,#cfeaff_28%,#b7dbf8_55%,#99c8ef_100%)]">
      {/* Camada de atmosfera */}
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:22px_22px]" />

      {/* Avatar fixo no centro (não desmonta entre abas) */}
      <div className="pointer-events-none absolute inset-x-0 top-20 z-20 mx-auto flex w-[min(92vw,380px)] flex-col items-center">
        <div className="relative w-full rounded-[36px] border border-white/50 bg-white/15 p-3 shadow-[0_0_40px_rgba(74,177,255,0.35)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-8 top-2 h-8 rounded-full bg-cyan-200/70 blur-md" />

          <video
            className="relative z-10 mx-auto aspect-square w-full object-contain drop-shadow-[0_0_30px_rgba(61,173,255,0.65)]"
            src="/assets/guto/GUTO BABY 2.webm"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />

          <div className="mt-2 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-900/70">
            <span className="rounded-full border border-white/60 bg-white/35 px-2 py-1">HUD online</span>
            <span className="rounded-full border border-white/60 bg-white/35 px-2 py-1">60fps target</span>
          </div>
        </div>
      </div>

      {/* Conteúdo das abas em painel holográfico, abaixo da cápsula */}
      <main className="relative z-10 h-full px-3 pb-20 pt-[380px]">
        <div className="h-full rounded-[30px] border border-white/45 bg-white/18 p-3 shadow-[inset_0_0_24px_rgba(255,255,255,0.25)] backdrop-blur-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={PANEL_ANIMATION.initial}
              animate={PANEL_ANIMATION.animate}
              exit={PANEL_ANIMATION.exit}
              transition={{ duration: 0.26, ease: "easeOut" }}
              className="h-full"
            >
              {tabContent}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} language={language} />
    </div>
  )
}
```

## Observações rápidas

- O `video` está apontando para `"/assets/guto/GUTO BABY 2.webm"`.
- Se quiser trocar conforme a aba, me manda o tipo `TabType` e eu te devolvo versão já mapeada para `BABY/TEEN/ADULT/ELIT`.
- Esse arquivo assume que os componentes citados (`BottomNavigation`, `ChatTab`, etc.) já existem.

## Diagnóstico dos erros da sua imagem (rápido)

1. `tsconfig.json` → `baseUrl` deprecado: **aviso de migração** (não bloqueia agora).
2. `server.ts` → `multer` sem tipos: **erro real de TypeScript** no backend (`@types/multer` faltando).
3. `suggestCanonicalClasses` (Tailwind): **apenas sugestão de lint** (não quebra build).

## Quais arquivos você pode me mandar agora

Para eu fechar isso rápido, me envia nesta ordem:

1. `tsconfig.json` (raiz do front e do backend, se existirem dois).
2. `package.json` (front) e `package.json` (backend, se separado).
3. `server.ts` (ou arquivo onde você importa `multer`).
4. O arquivo real da tela principal que você está usando hoje (`app.tsx`, `App.tsx` ou `components/guto/guto-app.tsx`).
5. `tailwind.config.*` (se existir) + `postcss.config.*`.
6. (Opcional) o erro completo do terminal rodando:
   - `npm run typecheck`
   - `npm run build`

Com esses arquivos eu te devolvo:
- patch exato para corrigir TS,
- versão final do `app.tsx` sem warnings chatos,
- checklist para manter 60 FPS com os WebM alpha.
