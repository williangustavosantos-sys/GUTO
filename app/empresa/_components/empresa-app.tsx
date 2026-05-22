"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PanelProvider, usePanel } from "@/components/panel/panel-context"
import { PanelShell } from "@/components/panel/shell"
import { EMPRESA_NAV } from "@/components/panel/sidebar"
import { ScreenPlaceholder } from "@/components/panel/screen-placeholder"
import { useAuth } from "@/components/auth-provider"
import { usePanelI18n } from "@/lib/panel/i18n"
import { EmpresaLoading } from "./empresa-loading"

function isEmpresaUser(role?: string | null) {
  // Empresa Portal hosts the team admin. Super admin pode acessar via /admin, mas também passa.
  return role === "admin" || role === "super_admin"
}

export function EmpresaApp() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/admin/login")
      return
    }
    if (!isEmpresaUser(user.role)) {
      if (user.role === "coach") router.replace("/coach")
      else router.replace("/login")
    }
  }, [isLoading, router, user])

  if (isLoading || !user) return <EmpresaLoading />
  if (!isEmpresaUser(user.role)) return <EmpresaLoading />

  const displayName = user.name ?? user.email ?? "Empresa"
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <PanelProvider portal="empresa" initialScreen="visao_geral">
      <EmpresaShell userName={displayName} userEmail={user.email ?? ""} userInitials={initials || "EM"} />
    </PanelProvider>
  )
}

function EmpresaShell({
  userName,
  userEmail,
  userInitials,
}: {
  userName: string
  userEmail: string
  userInitials: string
}) {
  const { t } = usePanelI18n()
  return (
    <PanelShell
      navGroups={EMPRESA_NAV}
      pendingTotal={0}
      brandSubtitleKey="app.empresa"
      footerUser={{
        initials: userInitials,
        name: userName,
        email: userEmail,
        roleBadge: t("footer.role.admin"),
      }}
    >
      <ActiveEmpresaScreen />
    </PanelShell>
  )
}

function ActiveEmpresaScreen() {
  const { activeScreen } = usePanel()
  switch (activeScreen) {
    case "visao_geral":
      return <ScreenPlaceholder titleKey="screen.visao_geral.t" subtitleKey="screen.visao_geral.s" />
    case "coaches":
      return <ScreenPlaceholder titleKey="screen.coaches.t" subtitleKey="screen.coaches.s" />
    case "alunos":
      return <ScreenPlaceholder titleKey="screen.alunos.t" subtitleKey="screen.alunos.s" />
    case "treinos":
      return <ScreenPlaceholder titleKey="screen.treinos.t" subtitleKey="screen.treinos.s" />
    case "dietas":
      return <ScreenPlaceholder titleKey="screen.dietas.t" subtitleKey="screen.dietas.s" />
    case "arena":
      return <ScreenPlaceholder titleKey="screen.arena.t" subtitleKey="screen.arena.s" />
    default:
      return <ScreenPlaceholder titleKey="screen.visao_geral.t" subtitleKey="screen.visao_geral.s" />
  }
}
