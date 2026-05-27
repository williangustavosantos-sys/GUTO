"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { legacyPanelRedirectTarget } from "@/lib/panel-rules"

/**
 * As telas /admin (Sala de Controle) e /empresa eram protótipos com dados mock.
 * O painel operacional REAL é /coach (design handoff + API real). Este
 * componente redireciona qualquer acesso a essas rotas para /coach sem
 * renderizar nenhuma superfície mock.
 */
export function LegacyPanelRedirect() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const target = legacyPanelRedirectTarget(pathname ?? "")
    if (target) router.replace(target)
  }, [pathname, router])

  return null
}
