"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PanelProvider } from "@/components/panel/panel-context"
import { PanelShell } from "@/components/panel/shell"
import { SUPER_NAV } from "@/components/panel/sidebar"
import { useAuth } from "@/components/auth-provider"
import { getCompanyDetail, getSysTelemetry } from "@/lib/panel/data-source"
import { T } from "@/lib/panel/tokens"
import { SalaLoading } from "@/app/admin/_components/sala-loading"
import { CompanyDetailScreen } from "./company-detail"

function canSeeCompany(role?: string | null) {
  // super_admin vê qualquer empresa. admin só vê a própria; o backend faria o
  // gate definitivo, mas no painel client-side checamos role pra evitar abrir
  // a rota antes do redirect. Coach cai pra /coach (escopo dele é diferente).
  return role === "super_admin" || role === "admin"
}

export function CompanyApp({ teamId }: { teamId: string }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/admin/login")
      return
    }
    if (!canSeeCompany(user.role)) {
      if (user.role === "coach") router.replace("/coach")
      else router.replace("/login")
    }
  }, [isLoading, router, user])

  if (isLoading || !user) return <SalaLoading />
  if (!canSeeCompany(user.role)) return <SalaLoading />

  const detail = getCompanyDetail(teamId)
  const telemetry = getSysTelemetry()
  const displayName = user.name ?? user.email ?? "Admin"
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <PanelProvider
      portal="sala"
      initialScreen="_detail" /* sentinela: nenhum item da sidebar fica ativo */
      onNavigateToScreen={(id) => {
        // Clicar em qualquer item da sidebar volta pra /admin com aquele screen.
        router.push(id === "hoje" ? "/admin" : `/admin?screen=${id}`)
      }}
    >
      <PanelShell
        navGroups={SUPER_NAV}
        pendingTotal={telemetry.pendingTotal}
        brandSubtitleKey="app.sala"
        footerUser={{
          initials: initials || "AD",
          name: displayName,
          email: user.email ?? "",
          roleBadge: "Super",
        }}
      >
        {detail ? (
          <CompanyDetailScreen detail={detail} />
        ) : (
          <CompanyNotFound teamId={teamId} />
        )}
      </PanelShell>
    </PanelProvider>
  )
}

function CompanyNotFound({ teamId }: { teamId: string }) {
  return (
    <div style={{ padding: "28px 32px" }}>
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: "22px 24px",
          boxShadow: T.shadow1,
          maxWidth: 640,
        }}
      >
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 14,
            fontWeight: 600,
            color: T.fg,
            marginBottom: 6,
          }}
        >
          Empresa não encontrada
        </div>
        <div style={{ fontFamily: T.ui, fontSize: 13, color: T.fg3, lineHeight: 1.55 }}>
          O time <code>{teamId}</code> não existe na fonte de dados atual (mocks Fase
          Visual). Volte para a lista de empresas em <a href="/admin" style={{ color: T.brand }}>/admin</a>.
        </div>
      </div>
    </div>
  )
}
