"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Toaster } from "sonner"

import { useAuth } from "@/components/auth-provider"
import type { AuthUser } from "@/lib/api/auth"
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
import { QaDemoBanner } from "./_components/qa-demo-banner"

// ─── QA / demo mode ──────────────────────────────────────────────────────────
//
// REGRAS (devem TODAS ser verdadeiras para o modo demo ativar):
//  1. `NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true"`  (opt-in explícito)
//  2. `NEXT_PUBLIC_VERCEL_ENV !== "production"`   (bloqueio em produção)
//  3. URL contém `?demo=super_admin` ou `?demo=coach`
//
// Se qualquer regra falhar → fluxo de login real intacto, parâmetro ignorado.
// Não substituímos NENHUMA chamada de API: se o backend exigir JWT real e
// retornar 401/403/CORS, o erro aparece no toast como aconteceria normalmente.
// Esse modo é puramente UI — serve para auditar role-gating, sidebar e
// drawers sem precisar de credenciais válidas.
//
// Como remover depois do merge:
//   - apagar este bloco e o `if (demoUser)` em CoachInner
//   - apagar `app/coach/_components/qa-demo-banner.tsx`
//   - remover env vars na Vercel
// (Nenhum outro arquivo precisa mudar.)

const DEMO_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV
const IS_DEMO_ENV = DEMO_ENV === "preview" || DEMO_ENV === "development"
const IS_PRODUCTION_ENV = DEMO_ENV === "production" || process.env.VERCEL_ENV === "production"

const DEMO_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true" &&
  IS_DEMO_ENV &&
  !IS_PRODUCTION_ENV

function buildDemoUser(param: string | null): AuthUser | null {
  if (!DEMO_ENABLED || !param) return null
  if (param === "super_admin") {
    return {
      userId: "qa-super-admin",
      name: "QA Super Admin",
      email: "qa-super@demo.local",
      role: "super_admin",
      active: true,
    }
  }
  if (param === "coach") {
    return {
      userId: "qa-coach",
      name: "QA Coach",
      email: "qa-coach@demo.local",
      role: "coach",
      active: true,
    }
  }
  return null
}

// ─── Active screen switch ────────────────────────────────────────────────────

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

// ─── Coach inner: orquestra auth real + bypass de QA ─────────────────────────

function CoachInner() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const searchParams = useSearchParams()

  // Hooks SEMPRE chamados antes de qualquer return (regra do React).
  const demoUser = buildDemoUser(searchParams.get("demo"))

  // Redirect só roda no fluxo real. Em modo demo, viramos no-op.
  useEffect(() => {
    if (demoUser) return
    if (isLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.role !== "coach" && user.role !== "admin" && user.role !== "super_admin") {
      router.replace("/")
    }
  }, [demoUser, user, isLoading, router])

  // ─── Caminho QA: bypass total do auth-provider ─────────────────────────────
  if (demoUser) {
    return (
      <CockpitProvider user={demoUser}>
        <CockpitContent />
        <QaDemoBanner role={demoUser.role} />
      </CockpitProvider>
    )
  }

  // ─── Caminho real (intocado) ───────────────────────────────────────────────
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
