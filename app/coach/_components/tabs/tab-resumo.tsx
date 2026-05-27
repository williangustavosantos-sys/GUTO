"use client"

import { Badge } from "@/components/ui/badge"
import type { GutoMemory } from "@/lib/api/guto"
import { useCockpit } from "../cockpit-context"
import { Panel, DataRow } from "../ui"
import {
  getStatusInfo,
  avatarStageLabel,
  sourceLabel,
  formatDate,
  coachLabel,
} from "../utils"

// Status de onboarding derivado da memória real do aluno (fonte de verdade).
// Não há endpoint dedicado: o painel deriva de consentimento, calibragem e pacto.
function deriveOnboarding(memory: GutoMemory | null): {
  consent: boolean
  calibration: "missing" | "partial" | "complete"
  pact: boolean
  active: boolean
} {
  if (!memory) return { consent: false, calibration: "missing", pact: false, active: false }
  const consent = Boolean(memory.consentAcceptedAt || (memory.consentHealthFitness && memory.acceptedTerms))
  const calibFields = [memory.biologicalSex, memory.trainingLevel, memory.trainingGoal, memory.heightCm, memory.weightKg]
  const filled = calibFields.filter((v) => v !== undefined && v !== null).length
  const calibration = filled === 0 ? "missing" : filled === calibFields.length ? "complete" : "partial"
  const pact = Boolean(memory.initialXpGranted)
  const active = consent && calibration === "complete" && pact
  return { consent, calibration, pact, active }
}

export function TabResumo() {
  const { selectedDetail, coaches, teams, isSuperAdmin } = useCockpit()

  if (!selectedDetail) return null
  const { student } = selectedDetail

  const status = getStatusInfo(student)
  const onb = deriveOnboarding(selectedDetail.memory)
  const calibBadge =
    onb.calibration === "complete"
      ? { variant: "default" as const, text: "Completa" }
      : onb.calibration === "partial"
        ? { variant: "outline" as const, text: "Parcial" }
        : { variant: "secondary" as const, text: "Pendente" }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title="Onboarding" className="md:col-span-2">
        <DataRow
          label="Consentimento"
          value={<Badge variant={onb.consent ? "default" : "secondary"}>{onb.consent ? "Aceito" : "Pendente"}</Badge>}
        />
        <DataRow label="Nome soberano" value={selectedDetail.memory?.name || "-"} />
        <DataRow label="Calibragem" value={<Badge variant={calibBadge.variant}>{calibBadge.text}</Badge>} />
        <DataRow
          label="Pacto"
          value={<Badge variant={onb.pact ? "default" : "secondary"}>{onb.pact ? "Aceito" : "Pendente"}</Badge>}
        />
        <DataRow
          label="Sistema ativo"
          value={
            <Badge variant={onb.active ? "default" : "outline"}>
              {onb.active ? "Sim" : "Aguardando onboarding"}
            </Badge>
          }
        />
      </Panel>

      <Panel title="Perfil">
        <DataRow label="Status" value={<Badge variant={status.variant}>{status.text}</Badge>} />
        <DataRow label="Email" value={student.email || "-"} />
        <DataRow label="Telefone" value={student.phone || "-"} />
        <DataRow label="Assinatura" value={student.subscriptionStatus || "-"} />
        <DataRow label="Expira em" value={formatDate(student.subscriptionEndsAt)} />
        <DataRow label="Coach" value={coachLabel(student, coaches)} />
        {isSuperAdmin && (
          <DataRow
            label="Time"
            value={teams.find((t) => t.id === student.teamId)?.name || student.teamId || "-"}
          />
        )}
        <DataRow label="Arena" value={student.visibleInArena ? "Visível" : "Oculto"} />
      </Panel>

      <Panel title="Evolução">
        <DataRow label="XP semanal" value={`${student.weeklyXp} XP`} />
        <DataRow label="XP mensal" value={`${student.monthlyXp} XP`} />
        <DataRow label="XP total" value={`${student.totalXp} XP`} />
        <DataRow label="Sequência" value={`${student.currentStreak} dias`} />
        <DataRow label="Validações" value={student.validationsTotal} />
        <DataRow
          label="Avatar"
          value={avatarStageLabel(student.avatarStage)}
        />
      </Panel>

      <Panel title="Plano atual" className="md:col-span-2">
        <DataRow
          label="Treino"
          value={`${sourceLabel(selectedDetail.workout?.source)}${
            selectedDetail.workout?.lockedByCoach ? " · bloqueado" : ""
          }`}
        />
        <DataRow
          label="Dieta"
          value={`${sourceLabel(selectedDetail.diet?.source)}${
            selectedDetail.diet?.lockedByCoach ? " · bloqueada" : ""
          }`}
        />
      </Panel>

    </div>
  )
}
