import { MOCK_COACHES, MOCK_STUDENTS } from "./mocks"
import type {
  AvatarStage,
  Coach,
  EmpresaStatus,
  PlanId,
  RiskState,
  Student,
  SubscriptionStatus,
} from "./types"

// Regra oficial de risco operacional (Fase 2a — aprovada por Will 2026-05-22):
//   ok       : última atividade ≤ 2 dias
//   atencao  : 3 a 5 dias sem sinal (validação OU atividade)
//   critico  : 6+ dias sem sinal
//   sem-sinal: aluno ativo sem nenhum sinal (sem lastValidationAt e sem lastActiveAt)
//   pausado  : !active OR archived
// Estados de bloqueio (convite-pendente, GUTO morto) NÃO entram aqui — vivem
// em status de acesso separado.
export function calcRisk(s: Student): RiskState {
  if (!s.active || s.archived) return "pausado"
  const last = s.lastValidationAt ?? s.lastActiveAt
  if (!last) return "sem-sinal"
  const days = Math.floor((Date.now() - new Date(last).getTime()) / 86_400_000)
  if (days >= 6) return "critico"
  if (days >= 3) return "atencao"
  return "ok"
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 2) return "agora"
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function coachName(coachId: string): string {
  return MOCK_COACHES.find((c) => c.userId === coachId)?.name ?? "—"
}

export function subLabel(status: SubscriptionStatus | null | undefined): string {
  if (!status) return "—"
  const map: Record<SubscriptionStatus, string> = {
    active: "Ativo",
    paused: "Pausado",
    overdue: "Inadimplente",
    cancelled: "Cancelado",
    trial: "Trial",
  }
  return map[status] ?? status
}

export function avatarLabel(stage: AvatarStage | null | undefined): string {
  if (!stage) return "—"
  const map: Record<AvatarStage, string> = {
    baby: "BABY",
    teen: "TEEN",
    adult: "ADULT",
    elite: "ELITE",
  }
  return map[stage] ?? "—"
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR")
}

export function empresaStatusTone(s: EmpresaStatus): "ok" | "warn" | "mute" {
  const map: Record<EmpresaStatus, "ok" | "warn" | "mute"> = {
    active: "ok",
    paused: "warn",
    archived: "mute",
  }
  return map[s]
}

export function empresaStatusLabel(s: EmpresaStatus): string {
  const map: Record<EmpresaStatus, string> = {
    active: "Ativa",
    paused: "Pausada",
    archived: "Arquivada",
  }
  return map[s]
}

export function planLabel(p: PlanId): string {
  const map: Record<PlanId, string> = { start: "Start", pro: "Pro", custom: "Custom" }
  return map[p] ?? p
}

// Hierarchy used by the handoff demo: coach → empresa.
const COACH_EMPRESA_MAP: Record<string, string> = {
  c001: "emp001",
  c002: "emp003",
  c003: "emp002",
}

export function coachesForEmpresa(empId: string): Coach[] {
  return MOCK_COACHES.filter((c) => COACH_EMPRESA_MAP[c.userId] === empId)
}

export function studentsForEmpresa(empId: string): Student[] {
  const coachIds = new Set(coachesForEmpresa(empId).map((c) => c.userId))
  return MOCK_STUDENTS.filter((s) => coachIds.has(s.coachId))
}
