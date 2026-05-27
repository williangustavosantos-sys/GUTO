"use client"

import { useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PanelProvider, usePanel } from "@/components/panel/panel-context"
import { PanelShell } from "@/components/panel/shell"
import { SUPER_NAV } from "@/components/panel/sidebar"
import { useAuth } from "@/components/auth-provider"
import { getAdminOverview, getSysTelemetry, isPanelEmpty } from "@/lib/panel/data-source"
import { usePanelI18n } from "@/lib/panel/i18n"
import { ScreenPlaceholder } from "@/components/panel/screen-placeholder"
import { CreateModalGate } from "./modals/create-modal-gate"
import { VisaoGeralScreen } from "./screens/visao-geral-screen"
import { SetupWizardScreen } from "./screens/setup-wizard-screen"
import { SalaLoading } from "./sala-loading"

function isSalaUser(role?: string | null) {
  // Sala de Controle is the super-admin surface. Plain `admin` belongs to /empresa.
  return role === "super_admin"
}

export function SalaApp() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/admin/login")
      return
    }
    if (!isSalaUser(user.role)) {
      if (user.role === "admin") router.replace("/empresa")
      else if (user.role === "coach") router.replace("/coach")
      else router.replace("/login")
    }
  }, [isLoading, router, user])

  if (isLoading || !user) return <SalaLoading />
  if (!isSalaUser(user.role)) return <SalaLoading />

  const displayName = user.name ?? user.email ?? "Admin"
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <SalaAppInner userName={displayName} userEmail={user.email ?? ""} userInitials={initials || "AD"} />
  )
}

function SalaAppInner({
  userName,
  userEmail,
  userInitials,
}: {
  userName: string
  userEmail: string
  userInitials: string
}) {
  // Permite voltar de uma página de detalhe (`/admin/teams/:teamId`) direto pro
  // item escolhido da sidebar via `?screen=ID`. Cai pra "hoje" como padrão.
  const searchParams = useSearchParams()
  const initialScreen = searchParams?.get("screen") ?? "hoje"
  return (
    <PanelProvider portal="sala" initialScreen={initialScreen}>
      <SalaShell userName={userName} userEmail={userEmail} userInitials={userInitials} />
      <CreateModalGate />
    </PanelProvider>
  )
}

function SalaShell({
  userName,
  userEmail,
  userInitials,
}: {
  userName: string
  userEmail: string
  userInitials: string
}) {
  const { t } = usePanelI18n()
  const telemetry = getSysTelemetry()
  return (
    <PanelShell
      navGroups={SUPER_NAV}
      pendingTotal={telemetry.pendingTotal}
      brandSubtitleKey="app.sala"
      footerUser={{
        initials: userInitials,
        name: userName,
        email: userEmail,
        roleBadge: t("footer.role.super"),
      }}
    >
      <ActiveSalaScreen />
    </PanelShell>
  )
}

function ActiveSalaScreen() {
  const { activeScreen } = usePanel()
  // ?wizard=1 força o Setup Wizard mesmo quando os mocks têm dados (pra você
  // poder validar visualmente o fluxo vazio). Sem o param, o wizard só aparece
  // automaticamente quando `isPanelEmpty(overview)` for true.
  const searchParams = useSearchParams()
  const forceWizard = searchParams?.get("wizard") === "1"
  const overview = useMemo(() => getAdminOverview(), [])
  const showWizard = forceWizard || isPanelEmpty(overview)

  if (activeScreen === "hoje") {
    return showWizard ? <SetupWizardScreen overview={overview} /> : <VisaoGeralScreen />
  }

  switch (activeScreen) {
    case "empresas":
      return <ScreenPlaceholder titleKey="screen.empresas.t" subtitleKey="screen.empresas.s" />
    case "coaches":
      return <ScreenPlaceholder titleKey="screen.coaches.t" subtitleKey="screen.coaches.s" />
    case "alunos":
      return <ScreenPlaceholder titleKey="screen.alunos.t" subtitleKey="screen.alunos.s" />
    case "treinos":
      return <ScreenPlaceholder titleKey="screen.treinos.t" subtitleKey="screen.treinos.s" />
    case "dietas":
      return <ScreenPlaceholder titleKey="screen.dietas.t" subtitleKey="screen.dietas.s" />
    case "aprovacoes":
      return <ScreenPlaceholder titleKey="screen.aprovacoes.t" subtitleKey="screen.aprovacoes.s" />
    case "arena":
      return <ScreenPlaceholder titleKey="screen.arena.t" subtitleKey="screen.arena.s" />
    case "logs":
      return <ScreenPlaceholder titleKey="screen.logs.t" subtitleKey="screen.logs.s" />
    default:
      return showWizard ? <SetupWizardScreen overview={overview} /> : <VisaoGeralScreen />
  }
}
