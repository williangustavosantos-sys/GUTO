"use client"

import { use } from "react"
import { CompanyApp } from "./_components/company-app"

// Rota dedicada do Detalhe da Empresa.
// Auth + role gating rodam dentro do <CompanyApp>.
export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = use(params)
  return <CompanyApp teamId={teamId} />
}
