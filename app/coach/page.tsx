"use client"

import { Suspense, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Toaster } from "sonner"

import { useAuth } from "@/components/auth-provider"
import { CockpitProvider, useCockpit } from "./_components/cockpit-context"
import { CockpitLayout } from "./_components/cockpit-layout"
import { StudentDrawer } from "./_components/student-drawer"
import {
  CreateStudentDialog,
  CreateCoachDialog,
  CreateTeamDialog,
} from "./_components/create-dialogs"
import { HojeScreen } from "./_components/screens/hoje-screen"
import { EmpresasScreen } from "./_components/screens/empresas-screen"
import { StudentsScreen } from "./_components/screens/students-screen"
import { CoachesScreen } from "./_components/screens/coaches-screen"
import { TreinosScreen } from "./_components/screens/treinos-screen"
import { DietasScreen } from "./_components/screens/dietas-screen"
import { AprovacoesScreen } from "./_components/screens/aprovacoes-screen"
import { BancoScreen } from "./_components/screens/banco-screen"
import { ArenaScreen } from "./_components/screens/arena-screen"
import { LogsScreen } from "./_components/screens/logs-screen"
import { EmpresaDrawer } from "./_components/empresa-drawer"
import { CoachDrawer } from "./_components/coach-drawer"

function ActiveScreen() {
  const { activeScreen } = useCockpit()
  switch (activeScreen) {
    case "hoje":
      return <HojeScreen />
    case "empresas":
      return <EmpresasScreen />
    case "students":
      return <StudentsScreen />
    case "coaches":
      return <CoachesScreen />
    case "treinos":
      return <TreinosScreen />
    case "dietas":
      return <DietasScreen />
    case "aprovacoes":
      return <AprovacoesScreen />
    case "banco":
      return <BancoScreen />
    case "arena":
      return <ArenaScreen />
    case "logs":
      return <LogsScreen />
    default:
      return null
  }
}

function CockpitContent() {
  return (
    <>
      <CockpitLayout>
        <ActiveScreen />
      </CockpitLayout>
      <StudentDrawer />
      <EmpresaDrawer />
      <CoachDrawer />
      <CreateStudentDialog />
      <CreateCoachDialog />
      <CreateTeamDialog />
      <Toaster theme="dark" position="top-right" />
    </>
  )
}

function CoachInner() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.role !== "coach" && user.role !== "admin" && user.role !== "super_admin") {
      router.replace("/")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0f1e] text-white/50">
        <p className="text-xs font-black uppercase tracking-widest">Carregando…</p>
      </div>
    )
  }

  if (user.role !== "coach" && user.role !== "admin" && user.role !== "super_admin") {
    return null
  }

  return (
    <CockpitProvider user={user}>
      <CockpitContent />
    </CockpitProvider>
  )
}

export default function CoachPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#0a0f1e] text-white/50">
          <p className="text-xs font-black uppercase tracking-widest">Carregando…</p>
        </div>
      }
    >
      <CoachInner />
    </Suspense>
  )
}
