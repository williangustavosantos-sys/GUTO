"use client"

import type { AuthUser } from "@/lib/api/auth"
import { T } from "./control-tokens"

/**
 * Banner fixo para sinalizar que a Sala de Controle está rodando em
 * MODO QA / demo (sem login real).
 *
 * - Renderizado SOMENTE quando `app/coach/page.tsx` detecta os dois
 *   guards (`NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true"` e
 *   `NEXT_PUBLIC_VERCEL_ENV !== "production"`).
 * - Não tem dependência de contexto: recebe `role` por prop para evitar
 *   acoplamento.
 * - Fica fixo no rodapé para não competir com o header sticky do cockpit.
 */
export function QaDemoBanner({ role }: { role: AuthUser["role"] }) {
  return (
    <>
      <style>{`
        @keyframes guto-qa-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.45; }
        }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        aria-label="Modo QA ativo — sessão demo, não é produção"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          columnGap: 14,
          rowGap: 4,
          padding: "8px 24px",
          background: "rgba(251,191,36,0.12)",
          borderTop: "1.5px solid rgba(251,191,36,0.50)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          pointerEvents: "none",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: T.warn,
            boxShadow: `0 0 8px ${T.warn}`,
            flexShrink: 0,
            animation: "guto-qa-pulse 1.6s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            fontWeight: 900,
            color: T.warn,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          MODO QA · sessão demo · não é produção
        </span>
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            fontWeight: 700,
            color: "rgba(251,191,36,0.75)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          role: {role}
        </span>
      </div>
    </>
  )
}
