export type Sex = "M" | "F"
export type AvatarStage = "baby" | "teen" | "adult" | "elite"
export type SubscriptionStatus = "active" | "paused" | "overdue" | "cancelled" | "trial"
export type RiskState = "ok" | "atencao" | "critico" | "sem-sinal" | "pausado"
// Espelha exatamente `GutoTeam.status` do backend (team-store.ts:20).
// Trial/overdue são estados de assinatura (SubscriptionStatus), não de team.
export type EmpresaStatus = "active" | "paused" | "archived"
export type PlanId = "start" | "pro" | "custom"
export type Country = "BR" | "IT" | "PT" | "ES" | "US"

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  coachId: string
  sex: Sex
  age: number
  active: boolean
  archived: boolean
  weeklyXp: number
  monthlyXp: number
  totalXp: number
  currentStreak: number
  validationsTotal: number
  lastValidationAt: string | null
  lastActiveAt: string
  subscriptionStatus: SubscriptionStatus
  subscriptionEndsAt: string | null
  avatarStage: AvatarStage
  visibleInArena: boolean
}

export interface Coach {
  userId: string
  name: string
  email: string
  role: "coach"
  active: boolean
  teamId: string
}

export interface Team {
  id: string
  name: string
  plan: PlanId
  status: EmpresaStatus
  customLimits: { maxStudents: number; maxCoaches: number } | null
  usage: { students: number; coaches: number }
}

export interface Empresa {
  id: string
  name: string
  responsible: string
  email: string
  country: Country
  plan: PlanId
  status: EmpresaStatus
  maxStudents: number
  maxCoaches: number
  usage: { students: number; coaches: number }
  lastActivityAt: string
  createdAt: string
}

export interface LogEntry {
  id: string
  action: string
  timestamp: string
  actorRole: "coach" | "admin" | "system" | "super_admin"
  actorUserId: string
  targetUserId: string | null
}

export interface RankingEntry {
  userId: string
  pairName: string
  xp: number
  avatarStage: AvatarStage
  position: number
  currentStreak?: number
}

export interface Rankings {
  weekly: RankingEntry[]
  monthly: RankingEntry[]
  total: RankingEntry[]
}

export interface ExercisePending {
  id: string
  name: string
  muscle: string
  equipment: string
  location: "academia" | "casa" | "ar-livre"
  durationSec: number
  sizeMb: number
  filename: string
  submittedBy: string
  submittedAt: string
  status: "pendente"
}

export interface FoodPending {
  id: string
  pt: string
  it: string
  en: string
  es: string
  country: Country
  category: string
  macros: { kcal: number; p: number; c: number; f: number }
  allergens: string[]
  restrictions: string[]
  submittedBy: string
  status: "pendente"
}

export interface SysTelemetry {
  build: string
  region: string
  uptimePct: number
  pendingTotal: number
}

// ─── Aggregated shapes (Fase 2a) ──────────────────────────────────────────────
// O frontend NUNCA consome listas brutas pra calcular KPI global. Esses shapes
// representam exatamente o que `GET /admin/panel/overview` e `GET /admin/panel/companies`
// vão devolver na Fase 2e (backend real). Hoje, os mocks simulam o mesmo formato.

/** KPIs e contadores agregados da Visão Geral (Super Admin scope). */
export interface AdminOverview {
  scope: "global" | "team"
  teams: {
    total: number
    active: number
    paused: number
    archived: number
  }
  coaches: {
    total: number
    active: number
  }
  students: {
    total: number
    active: number
    atencao: number
    critico: number
    pausados: number
    arquivados: number
  }
  pending: {
    exercises: number
    foods: number
    billing: number
    total: number
  }
  generatedAt: string
}

/** Uma linha da tabela principal de Empresas/Teams. Tudo pré-agregado. */
export interface CompanyRow {
  teamId: string
  name: string
  slug?: string
  status: EmpresaStatus
  plan: PlanId
  usage: { coaches: number; students: number }
  limits: { maxCoaches: number | null; maxStudents: number | null }
  risk: { atencao: number; critico: number }
  pending: { total: number }
  lastActivityAt: string
}

/** Resultado paginado da tabela de empresas. */
export interface CompaniesPage {
  items: CompanyRow[]
  nextCursor: string | null
  totals: {
    total: number
    active: number
    paused: number
    archived: number
  }
}

/** Parâmetros suportados pelo accessor de tabela de empresas. */
export interface CompaniesQuery {
  cursor?: string | null
  pageSize?: number
  status?: EmpresaStatus[]
  search?: string
  sortBy?: "lastActivityAt" | "name" | "critico" | "studentsUsage"
  sortDir?: "asc" | "desc"
}

// ─── Fase 2c: Detalhe da Empresa ──────────────────────────────────────────────

/** Classificação ampliada usada no painel. Inclui dois estados que NÃO existem
 *  no `RiskState` operacional puro (sem-primeiro-acesso, convite-pendente).
 *  Eles são simulados em mock até o backend persistir os sinais. */
export type PanelRiskClass = RiskState | "convite-pendente" | "sem-primeiro-acesso"

export type CapacityWarning = "ok" | "approaching" | "reached"

/** Cabeçalho + agregados da Empresa. Sem coaches[]/students[] aqui — esses
 *  vêm paginados em accessors separados. */
export interface CompanyDetail {
  team: {
    teamId: string
    name: string
    status: EmpresaStatus
    plan: PlanId
    createdAt: string
    isInternalGutoTeam?: boolean
  }
  usage: { coaches: number; students: number }
  limits: { maxCoaches: number | null; maxStudents: number | null }
  vacancies: { coaches: number | null; students: number | null }
  capacity: { coaches: CapacityWarning; students: CapacityWarning }
  risk: {
    atencao: number
    critico: number
    semPrimeiroAcesso: number
    convitePendente: number
  }
  pending: {
    exercises: number
    foods: number
    billing: number
    total: number
  }
  lastActivityAt: string
}

export interface CoachSummaryRow {
  coachId: string
  name: string
  email: string
  active: boolean
  studentsTotal: number
  risk: { atencao: number; critico: number }
  lastActionAt: string | null
}

export interface CompanyCoachesPage {
  items: CoachSummaryRow[]
  nextCursor: string | null
  total: number
}

export interface StudentSummaryRow {
  userId: string
  name: string
  email?: string
  coachId: string
  coachName: string
  active: boolean
  archived: boolean
  subscriptionStatus: SubscriptionStatus
  risk: PanelRiskClass
  lastValidationAt: string | null
  lastActiveAt: string | null
  weeklyXp: number
}

export type StudentRiskFilter =
  | "todos"
  | "atencao"
  | "critico"
  | "sem-primeiro-acesso"
  | "convite-pendente"
  | "pausados"
  | "arquivados"

export interface CompanyStudentsQuery {
  cursor?: string | null
  pageSize?: number
  coachId?: string
  riskFilter?: StudentRiskFilter
  search?: string
}

export interface CompanyStudentsPage {
  items: StudentSummaryRow[]
  nextCursor: string | null
  total: number
}

export interface ArenaEntry {
  position: number
  userId: string
  displayName: string
  avatarStage: AvatarStage
  xp: number
  streak: number
  validatedWorkouts: number
  lastValidationAt: string | null
  visibleInArena: boolean
}

export interface CompanyArenaRanking {
  teamId: string
  teamName: string
  period: "weekly" | "monthly"
  items: ArenaEntry[]
  /** Total de alunos do time visíveis na Arena. Útil para "Top 10 de N". */
  totalVisible: number
}

export interface CompanyPendingItem {
  id: string
  kind: "exercise" | "food" | "billing"
  title: string
  submittedByName: string
  submittedAt: string
}

export interface CompanyPendingResume {
  items: CompanyPendingItem[]
  totals: { exercises: number; foods: number; billing: number; total: number }
}

export interface CompanyLogRow {
  id: string
  action: string
  actorRole: string
  actorName: string
  targetName: string | null
  timestamp: string
}

export interface CompanyLogsRecent {
  items: CompanyLogRow[]
}
