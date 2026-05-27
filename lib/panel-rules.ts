// Regras operacionais puras do painel /coach (sem React/Next, sem imports de
// runtime). Centraliza a lógica que o painel real precisa para NÃO contar lixo,
// NÃO criar aluno órfão e NÃO expor superfícies mock. Mantido puro e estrutural
// para ser testável via `tsx --test` e reaproveitado por telas + diálogos.

// Empresa interna do sistema. NÃO é cliente B2B: não aparece como empresa nem
// conta nas métricas; é a casa documentada de alunos sem vínculo (super admin).
export const GUTO_CORE_TEAM_ID = "GUTO_CORE"

const ACTIVE_TEAM_STATUSES = new Set(["active", "trial"])

export function isClientTeam(team: { id: string }): boolean {
  return team.id !== GUTO_CORE_TEAM_ID
}

export function isActiveTeamStatus(status: string): boolean {
  return ACTIVE_TEAM_STATUSES.has(status)
}

/** Empresas cliente (exclui a empresa interna GUTO_CORE). */
export function clientTeams<T extends { id: string }>(teams: T[]): T[] {
  return teams.filter((t) => t.id !== GUTO_CORE_TEAM_ID)
}

/** Empresas cliente ATIVAS — exclui GUTO_CORE e exclui pausadas/arquivadas. */
export function activeClientTeams<T extends { id: string; status: string }>(teams: T[]): T[] {
  return clientTeams(teams).filter((t) => isActiveTeamStatus(t.status))
}

/** Coaches vinculados a uma empresa específica. */
export function coachesForTeam<C extends { teamId?: string | null }>(
  coaches: C[],
  teamId: string | null | undefined,
): C[] {
  if (!teamId) return []
  return coaches.filter((c) => (c.teamId ?? "") === teamId)
}

/** Aluno em empresa cliente exige coach. GUTO_CORE é a exceção documentada. */
export function studentRequiresCoach(teamId: string | null | undefined): boolean {
  return Boolean(teamId) && teamId !== GUTO_CORE_TEAM_ID
}

export type CreateStudentBlock = "name" | "email" | "team" | "no-coach-in-team" | "coach" | null

/**
 * Por que a criação de aluno está bloqueada (ou `null` se pode prosseguir).
 * Espelha o contrato do backend (GUTO_TEAM_REQUIRED / GUTO_COACH_REQUIRED) para
 * o botão não permitir aluno solto antes mesmo da chamada.
 */
export function blockCreateStudent(input: {
  name: string
  email: string
  needsTeam: boolean
  teamId: string | null | undefined
  coachId: string | null | undefined
  teamCoachCount: number
  /** Coach obrigatório? (super_admin em empresa cliente — espelha o backend). */
  requiresCoach: boolean
}): CreateStudentBlock {
  if (!input.name.trim()) return "name"
  if (!input.email.trim()) return "email"
  if (input.needsTeam && !input.teamId) return "team"
  if (input.requiresCoach) {
    if (input.teamCoachCount === 0) return "no-coach-in-team"
    if (!input.coachId) return "coach"
  }
  return null
}

export type HeaderCtaKind = "empresa" | "coach" | "aluno" | null

/**
 * CTA contextual do header. O Dashboard ("hoje") NUNCA cria aluno solto — o
 * "+Aluno" só existe na lista de Alunos (com empresa+coach exigidos) e dentro
 * do drawer da empresa.
 */
export function headerCtaForScreen(
  screen: string,
  roles: { isSuperAdmin: boolean; isAdmin: boolean },
): HeaderCtaKind {
  if (screen === "empresas" && roles.isSuperAdmin) return "empresa"
  if (screen === "coaches" && roles.isAdmin) return "coach"
  if (screen === "students") return "aluno"
  return null
}

/**
 * As telas /admin (Sala) e /empresa são protótipos com dados mock. O painel
 * operacional real é /coach. Retorna o destino de redirect, ou `null` quando a
 * rota deve permanecer (ex.: /admin/login é login real).
 */
export function legacyPanelRedirectTarget(pathname: string): string | null {
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) return null
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "/coach"
  if (pathname === "/empresa" || pathname.startsWith("/empresa/")) return "/coach"
  return null
}
