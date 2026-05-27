"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Toaster } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { CockpitProvider, useCockpit } from "./_components/cockpit-context"
import { CockpitLayout } from "./_components/cockpit-layout"
import { HojeScreen } from "./_components/screens/hoje-screen"
import { EmpresasScreen } from "./_components/screens/empresas-screen"
import { StudentsScreen } from "./_components/screens/students-screen"
import { AprovacoesScreen } from "./_components/screens/aprovacoes-screen"
import { BancoScreen } from "./_components/screens/banco-screen"
import { ArenaScreen } from "./_components/screens/arena-screen"
import { LogsScreen } from "./_components/screens/logs-screen"
import { StudentDrawer } from "./_components/student-drawer"
import { EmpresaDrawer } from "./_components/empresa-drawer"
import { CoachDrawer } from "./_components/coach-drawer"
import { CreateCoachDialog, CreateStudentDialog, CreateTeamDialog } from "./_components/create-dialogs"
import { QaDemoBanner } from "./_components/qa-demo-banner"
import { T } from "./_components/control-tokens"

function isPanelUser(role?: string | null) {
  return role === "super_admin" || role === "admin" || role === "coach"
}

export default function CoachPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/admin/login")
      return
    }
    if (!isPanelUser(user.role)) {
      router.replace("/login")
    }
  }, [isLoading, router, user])

  if (isLoading || (user && !isPanelUser(user.role))) {
    return <ControlRoomLoading />
  }

  if (!user) {
    return <ControlRoomLoading />
  }

  return (
    <CockpitProvider user={user}>
      <Toaster theme="dark" position="bottom-center" />
      <CockpitLayout>
        {process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true" &&
          process.env.NEXT_PUBLIC_VERCEL_ENV !== "production" && (
            <QaDemoBanner role={user.role} />
          )}
        <ActiveScreen />
      </CockpitLayout>
      <StudentDrawer />
      <EmpresaDrawer />
      <CoachDrawer />
      <CreateStudentDialog />
      <CreateCoachDialog />
      <CreateTeamDialog />
    </CockpitProvider>
  )
}

function ActiveScreen() {
  const { activeScreen, loading } = useCockpit()

  if (loading) {
    return <ControlRoomLoading inline />
  }

  switch (activeScreen) {
    case "hoje":
      return <HojeScreen />
    case "empresas":
      return <EmpresasScreen />
    case "students":
      return <StudentsScreen />
    case "aprovacoes":
      return <AprovacoesScreen />
    case "banco":
      return <BancoScreen />
    case "arena":
      return <ArenaScreen />
    case "logs":
      return <LogsScreen />
    default:
      return <HojeScreen />
  }
}

function ControlRoomLoading({ inline = false }: { inline?: boolean }) {
  return (
    <div
      style={{
        minHeight: inline ? "calc(100vh - 64px)" : "100dvh",
        display: "grid",
        placeItems: "center",
        background: inline ? "transparent" : T.ink,
        color: T.cyan,
        fontFamily: T.mono,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
        }}
      >
        Sincronizando painel
      </p>
    </div>
  )
}
