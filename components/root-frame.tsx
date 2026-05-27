"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

// Rotas full-width (painel). /admin/login mantém o fundo dark do design de login;
// /admin (Sala de Controle), /empresa (Empresa Portal) e /coach (Coach Portal) usam
// o tema light do handoff (`#F0F2F5` no content area, sidebar dark interna).
const LIGHT_PANEL_PREFIXES = ["/admin", "/empresa", "/coach"]
const DARK_PANEL_PREFIXES: string[] = ["/admin/login"]

export function RootFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? ""
  const isDarkPanel = DARK_PANEL_PREFIXES.some((p) => pathname.startsWith(p))
  const isLightPanel = !isDarkPanel && LIGHT_PANEL_PREFIXES.some((p) => pathname.startsWith(p))

  if (isDarkPanel) {
    return (
      <main className="h-dvh min-h-dvh w-full overflow-hidden bg-[#04060f]">
        {children}
      </main>
    )
  }

  if (isLightPanel) {
    return (
      <main className="h-dvh min-h-dvh w-full overflow-hidden bg-[#F0F2F5]">
        {children}
      </main>
    )
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white">
      {children}
    </main>
  )
}
