// Single chokepoint between the panel UI and the data backend.
//
// Fase 2a: shape AGREGADO. O frontend nunca recebe listas brutas pra calcular
// métrica. Cada accessor simula o que o backend (Fase 2e) vai devolver.
//
//   1. Componentes importam SÓ desta camada (não importam de `./mocks`).
//   2. `IS_MOCK_DATA` indica modo mock; UI mostra o badge "DADOS MOCK · FASE VISUAL".
//   3. `mockGuard()` joga erro em runtime se mocks forem chamados com a flag desligada.
//   4. Todo cálculo de agregação acontece NESTA camada — nunca no componente.
//
// Quando o backend chegar (Fase 2e), cada função `simulate*` é trocada por um
// fetch. Os componentes ficam intocados.

import {
  MOCK_COACHES,
  MOCK_EMPRESAS,
  MOCK_EX_PENDING,
  MOCK_FOOD_PENDING,
  MOCK_LOGS,
  MOCK_STUDENTS,
  SYS_TELEMETRY,
} from "./mocks"
import { calcRisk, coachesForEmpresa, coachName, studentsForEmpresa } from "./helpers"
import type {
  AdminOverview,
  ArenaEntry,
  CapacityWarning,
  CoachSummaryRow,
  CompaniesPage,
  CompaniesQuery,
  CompanyArenaRanking,
  CompanyCoachesPage,
  CompanyDetail,
  CompanyLogsRecent,
  CompanyPendingResume,
  CompanyRow,
  CompanyStudentsPage,
  CompanyStudentsQuery,
  EmpresaStatus,
  PanelRiskClass,
  Student,
  StudentSummaryRow,
  SysTelemetry,
} from "./types"

// ─── Mode flag ────────────────────────────────────────────────────────────────

const FLAG = process.env.NEXT_PUBLIC_USE_MOCKS
export const IS_MOCK_DATA: boolean = FLAG !== "false"

function mockGuard(): void {
  if (!IS_MOCK_DATA) {
    throw new Error(
      "panel/data-source: mock accessor called but NEXT_PUBLIC_USE_MOCKS is false. " +
        "Fase Pós-Visual: wire this accessor to the real backend before shipping.",
    )
  }
}

// ─── Public accessors (used by screens) ──────────────────────────────────────

/** KPIs e contadores agregados da home do Super Admin. */
export function getAdminOverview(): AdminOverview {
  mockGuard()
  return simulateAdminOverview()
}

/** Tabela principal da home (Empresas/Teams) — paginada. */
export function getCompaniesTablePage(query: CompaniesQuery = {}): CompaniesPage {
  mockGuard()
  return simulateCompaniesTablePage(query)
}

/** Pendências globais para a pill do header. */
export function getSysTelemetry(): SysTelemetry {
  mockGuard()
  return SYS_TELEMETRY
}

/** Decide se a home renderiza o Setup Wizard em vez da Visão Geral. */
export function isPanelEmpty(overview: AdminOverview): boolean {
  return (
    overview.teams.total === 0 ||
    (overview.coaches.total === 0 && overview.students.total === 0)
  )
}

// ─── Synthetic flags (provisional — see Fase 2d backend) ─────────────────────
//
// O backend ainda não persiste `firstLoginAt` nem flag explícita de
// "convite pendente". Até a Fase 2d/2e adicionar esses sinais reais, os
// conjuntos abaixo simulam esses estados para a UI conseguir exercitar os
// KPIs de risco. Cada classificação cai pra `calcRisk` quando o aluno não
// está em nenhum dos sets sintéticos.
//
// IMPORTANTE: quando o backend ganhar `firstLoginAt`, esse Set sai e a
// classificação passa a usar o campo real (createdAt > 48h + firstLoginAt
// == null + lastActiveAt == null), conforme decisão K1.

const _MOCK_CONVITE_PENDENTE_USERIDS: ReadonlySet<string> = new Set(["u007"])
const _MOCK_SEM_PRIMEIRO_ACESSO_USERIDS: ReadonlySet<string> = new Set(["u010"])

function classifyPanelRisk(s: Student): PanelRiskClass {
  if (!s.active) return "pausado"
  if (s.archived) return "pausado"
  if (_MOCK_CONVITE_PENDENTE_USERIDS.has(s.id)) return "convite-pendente"
  if (_MOCK_SEM_PRIMEIRO_ACESSO_USERIDS.has(s.id)) return "sem-primeiro-acesso"
  return calcRisk(s)
}

/** Exporta a função pra a UI mostrar a pill correta em listas de alunos. */
export function classifyStudentForPanel(s: Student): PanelRiskClass {
  return classifyPanelRisk(s)
}

// ─── Empresa: detalhe + sub-accessors ─────────────────────────────────────────

export function getCompanyDetail(teamId: string): CompanyDetail | null {
  mockGuard()
  const team = MOCK_EMPRESAS.find((e) => e.id === teamId)
  if (!team) return null

  const coaches = coachesForEmpresa(teamId)
  const students = studentsForEmpresa(teamId)
  const risks = students.map((s) => classifyPanelRisk(s))

  const usage = { coaches: coaches.length, students: students.length }
  const limits = {
    maxCoaches: team.maxCoaches > 0 ? team.maxCoaches : null,
    maxStudents: team.maxStudents > 0 ? team.maxStudents : null,
  }
  const vacancies = {
    coaches: limits.maxCoaches !== null ? Math.max(0, limits.maxCoaches - usage.coaches) : null,
    students:
      limits.maxStudents !== null ? Math.max(0, limits.maxStudents - usage.students) : null,
  }
  const capacity = {
    coaches: computeCapacity(usage.coaches, limits.maxCoaches),
    students: computeCapacity(usage.students, limits.maxStudents),
  }

  const exer = MOCK_EX_PENDING.filter((p) => isFromTeam(p.submittedBy, teamId)).length
  const food = MOCK_FOOD_PENDING.filter((p) => isFromTeam(p.submittedBy, teamId)).length

  return {
    team: {
      teamId: team.id,
      name: team.name,
      status: team.status,
      plan: team.plan,
      createdAt: team.createdAt,
      // Placeholder técnico — o nome comercial da "Team interna GUTO" será
      // definido depois. Por ora não há flag persistida; deixamos undefined.
      isInternalGutoTeam: undefined,
    },
    usage,
    limits,
    vacancies,
    capacity,
    risk: {
      atencao: risks.filter((r) => r === "atencao").length,
      critico: risks.filter((r) => r === "critico").length,
      semPrimeiroAcesso: risks.filter((r) => r === "sem-primeiro-acesso").length,
      convitePendente: risks.filter((r) => r === "convite-pendente").length,
    },
    pending: {
      exercises: exer,
      foods: food,
      billing: 0,
      total: exer + food,
    },
    lastActivityAt: team.lastActivityAt,
  }
}

export function getCompanyCoaches(
  teamId: string,
  query: { cursor?: string | null; pageSize?: number } = {},
): CompanyCoachesPage {
  mockGuard()
  const pageSize = Math.min(query.pageSize ?? 50, 100)
  const all = coachesForEmpresa(teamId)
  const items: CoachSummaryRow[] = all.map((c) => {
    const coachStudents = studentsForEmpresa(teamId).filter((s) => s.coachId === c.userId)
    const risks = coachStudents.map((s) => classifyPanelRisk(s))
    return {
      coachId: c.userId,
      name: c.name,
      email: c.email,
      active: c.active,
      studentsTotal: coachStudents.length,
      risk: {
        atencao: risks.filter((r) => r === "atencao").length,
        critico: risks.filter((r) => r === "critico").length,
      },
      // Provisional — log-store ainda não tem teamId persistido, então pega o
      // log mais recente do `actorUserId` direto.
      lastActionAt:
        MOCK_LOGS.find((l) => l.actorUserId === c.userId)?.timestamp ?? null,
    }
  })
  const start = decodeCursor(query.cursor ?? null)
  const slice = items.slice(start, start + pageSize)
  const nextStart = start + slice.length
  const hasMore = nextStart < items.length
  return {
    items: slice,
    nextCursor: hasMore ? encodeCursor(nextStart) : null,
    total: items.length,
  }
}

export function getCompanyStudents(
  teamId: string,
  query: CompanyStudentsQuery = {},
): CompanyStudentsPage {
  mockGuard()
  const pageSize = Math.min(query.pageSize ?? 50, 100)
  const all = studentsForEmpresa(teamId)
  let filtered = all
  if (query.coachId) filtered = filtered.filter((s) => s.coachId === query.coachId)
  if (query.search) {
    const q = query.search.toLowerCase()
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q),
    )
  }
  if (query.riskFilter && query.riskFilter !== "todos") {
    filtered = filtered.filter((s) => matchesRiskFilter(s, query.riskFilter!))
  }

  const items: StudentSummaryRow[] = filtered.map((s) => ({
    userId: s.id,
    name: s.name,
    email: s.email,
    coachId: s.coachId,
    coachName: coachName(s.coachId),
    active: s.active,
    archived: s.archived,
    subscriptionStatus: s.subscriptionStatus,
    risk: classifyPanelRisk(s),
    lastValidationAt: s.lastValidationAt,
    lastActiveAt: s.lastActiveAt,
    weeklyXp: s.weeklyXp,
  }))

  const start = decodeCursor(query.cursor ?? null)
  const slice = items.slice(start, start + pageSize)
  const nextStart = start + slice.length
  const hasMore = nextStart < items.length
  return {
    items: slice,
    nextCursor: hasMore ? encodeCursor(nextStart) : null,
    total: items.length,
  }
}

export function getCompanyArena(
  teamId: string,
  period: "weekly" | "monthly",
): CompanyArenaRanking {
  mockGuard()
  const team = MOCK_EMPRESAS.find((e) => e.id === teamId)
  const allStudents = studentsForEmpresa(teamId)
  const visible = allStudents.filter((s) => s.visibleInArena && s.active && !s.archived)
  const sorted = [...visible].sort((a, b) => {
    const ax = period === "weekly" ? a.weeklyXp : a.monthlyXp
    const bx = period === "weekly" ? b.weeklyXp : b.monthlyXp
    return bx - ax
  })

  const top = sorted.slice(0, 10).map<ArenaEntry>((s, i) => ({
    position: i + 1,
    userId: s.id,
    displayName: `GUTO & ${s.name.split(" ")[0]}`,
    avatarStage: s.avatarStage,
    xp: period === "weekly" ? s.weeklyXp : s.monthlyXp,
    streak: s.currentStreak,
    validatedWorkouts: 0, // mock minimal — sem agregação por período aqui
    lastValidationAt: s.lastValidationAt,
    visibleInArena: s.visibleInArena,
  }))

  return {
    teamId,
    teamName: team?.name ?? teamId,
    period,
    items: top,
    totalVisible: visible.length,
  }
}

export function getCompanyPending(teamId: string): CompanyPendingResume {
  mockGuard()
  const exer = MOCK_EX_PENDING.filter((p) => isFromTeam(p.submittedBy, teamId))
  const food = MOCK_FOOD_PENDING.filter((p) => isFromTeam(p.submittedBy, teamId))
  const items: CompanyPendingResume["items"] = []
  for (const p of exer.slice(0, 5)) {
    items.push({
      id: p.id,
      kind: "exercise",
      title: p.name,
      submittedByName: coachName(p.submittedBy),
      submittedAt: p.submittedAt,
    })
  }
  for (const p of food.slice(0, 5)) {
    items.push({
      id: p.id,
      kind: "food",
      title: p.pt,
      submittedByName: coachName(p.submittedBy),
      submittedAt: "—",
    })
  }
  return {
    items,
    totals: {
      exercises: exer.length,
      foods: food.length,
      billing: 0,
      total: exer.length + food.length,
    },
  }
}

export function getCompanyLogs(teamId: string, limit = 20): CompanyLogsRecent {
  mockGuard()
  // Provisional: log-store ainda não tem teamId persistido. Filtra por
  // actor OU target pertencendo ao time. Vira filtro nativo quando o
  // log-store ganhar `teamId` na Fase 2d.
  const scoped = MOCK_LOGS.filter((l) => {
    if (l.actorUserId && isFromTeam(l.actorUserId, teamId)) return true
    if (l.targetUserId && isFromTeam(l.targetUserId, teamId)) return true
    return false
  })
  const items = scoped.slice(0, limit).map((l) => ({
    id: l.id,
    action: l.action,
    actorRole: l.actorRole,
    actorName: resolveUserName(l.actorUserId),
    targetName: l.targetUserId ? resolveUserName(l.targetUserId) : null,
    timestamp: l.timestamp,
  }))
  return { items }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function computeCapacity(used: number, max: number | null): CapacityWarning {
  if (max === null) return "ok"
  if (used >= max) return "reached"
  if (used / max >= 0.8) return "approaching"
  return "ok"
}

function matchesRiskFilter(s: Student, filter: string): boolean {
  const r = classifyPanelRisk(s)
  switch (filter) {
    case "atencao":
      return r === "atencao"
    case "critico":
      return r === "critico"
    case "sem-primeiro-acesso":
      return r === "sem-primeiro-acesso"
    case "convite-pendente":
      return r === "convite-pendente"
    case "pausados":
      return !s.active && !s.archived
    case "arquivados":
      return s.archived
    default:
      return true
  }
}

function isFromTeam(userId: string, teamId: string): boolean {
  // Tenta coach. Se for coach do time → true.
  const coach = MOCK_COACHES.find((c) => c.userId === userId)
  if (coach) {
    return coachesForEmpresa(teamId).some((c) => c.userId === coach.userId)
  }
  // Tenta aluno. Se for aluno do time → true.
  const student = MOCK_STUDENTS.find((s) => s.id === userId)
  if (student) {
    return studentsForEmpresa(teamId).some((s) => s.id === student.id)
  }
  return false
}

function resolveUserName(userId: string): string {
  const coach = MOCK_COACHES.find((c) => c.userId === userId)
  if (coach) return coach.name
  const student = MOCK_STUDENTS.find((s) => s.id === userId)
  if (student) return student.name
  if (userId === "guto-ai") return "GUTO (sistema)"
  if (userId === "scheduler") return "Scheduler (sistema)"
  return userId
}

// ─── Mock simulators (would be HTTP fetches in Fase 2e) ──────────────────────

function simulateAdminOverview(): AdminOverview {
  const teams = MOCK_EMPRESAS
  const coaches = MOCK_COACHES
  const students = MOCK_STUDENTS

  const teamStatusCount = (s: EmpresaStatus) => teams.filter((t) => t.status === s).length

  const activeStudents = students.filter((s) => s.active && !s.archived)
  const risks = activeStudents.map((s) => calcRisk(s))

  return {
    scope: "global",
    teams: {
      total: teams.length,
      active: teamStatusCount("active"),
      paused: teamStatusCount("paused"),
      archived: teamStatusCount("archived"),
    },
    coaches: {
      total: coaches.length,
      active: coaches.filter((c) => c.active).length,
    },
    students: {
      total: students.length,
      active: activeStudents.length,
      atencao: risks.filter((r) => r === "atencao").length,
      critico: risks.filter((r) => r === "critico").length,
      pausados: students.filter((s) => !s.active).length,
      arquivados: students.filter((s) => s.archived).length,
    },
    pending: {
      exercises: MOCK_EX_PENDING.length,
      foods: MOCK_FOOD_PENDING.length,
      billing: 0,
      total: MOCK_EX_PENDING.length + MOCK_FOOD_PENDING.length,
    },
    generatedAt: new Date().toISOString(),
  }
}

function simulateCompaniesTablePage(query: CompaniesQuery): CompaniesPage {
  const pageSize = Math.min(query.pageSize ?? 50, 100)
  const statusFilter = query.status?.length ? new Set(query.status) : null
  const searchLower = query.search?.trim().toLowerCase() ?? ""

  // 1. Filter
  let filtered = MOCK_EMPRESAS.filter((e) => {
    if (statusFilter && !statusFilter.has(e.status)) return false
    if (searchLower && !e.name.toLowerCase().includes(searchLower)) return false
    return true
  })

  // 2. Sort
  const sortBy = query.sortBy ?? "lastActivityAt"
  const sortDir = query.sortDir ?? "desc"
  filtered = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortBy === "name") cmp = a.name.localeCompare(b.name, "pt-BR")
    else if (sortBy === "lastActivityAt") cmp = a.lastActivityAt.localeCompare(b.lastActivityAt)
    else if (sortBy === "critico") cmp = computeCompanyRiskCritico(a.id) - computeCompanyRiskCritico(b.id)
    else if (sortBy === "studentsUsage") cmp = a.usage.students - b.usage.students
    return sortDir === "asc" ? cmp : -cmp
  })

  // 3. Cursor pagination (mock: simple offset encoded as cursor)
  const startIndex = decodeCursor(query.cursor ?? null)
  const slice = filtered.slice(startIndex, startIndex + pageSize)
  const nextStart = startIndex + slice.length
  const hasMore = nextStart < filtered.length
  const nextCursor = hasMore ? encodeCursor(nextStart) : null

  // 4. Map to CompanyRow (aggregates computed in this layer, never exposed raw)
  const items: CompanyRow[] = slice.map((e) => {
    const empStudents = studentsForEmpresa(e.id)
    const risks = empStudents.map((s) => calcRisk(s))
    return {
      teamId: e.id,
      name: e.name,
      status: e.status,
      plan: e.plan,
      usage: {
        coaches: coachesForEmpresa(e.id).length,
        students: empStudents.length,
      },
      limits: { maxCoaches: e.maxCoaches, maxStudents: e.maxStudents },
      risk: {
        atencao: risks.filter((r) => r === "atencao").length,
        critico: risks.filter((r) => r === "critico").length,
      },
      pending: { total: pendingPerEmpresa(e.id) },
      lastActivityAt: e.lastActivityAt,
    }
  })

  return {
    items,
    nextCursor,
    totals: {
      total: filtered.length,
      active: filtered.filter((e) => e.status === "active").length,
      paused: filtered.filter((e) => e.status === "paused").length,
      archived: filtered.filter((e) => e.status === "archived").length,
    },
  }
}

function computeCompanyRiskCritico(empId: string): number {
  return studentsForEmpresa(empId)
    .map((s) => calcRisk(s))
    .filter((r) => r === "critico").length
}

function pendingPerEmpresa(empId: string): number {
  const empCoachIds = new Set(coachesForEmpresa(empId).map((c) => c.userId))
  const exer = MOCK_EX_PENDING.filter((p) => empCoachIds.has(p.submittedBy)).length
  const food = MOCK_FOOD_PENDING.filter((p) => empCoachIds.has(p.submittedBy)).length
  return exer + food
}

function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ offset })).toString("base64")
}

function decodeCursor(cursor: string | null): number {
  if (!cursor) return 0
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8")) as {
      offset?: number
    }
    return decoded.offset ?? 0
  } catch {
    return 0
  }
}
