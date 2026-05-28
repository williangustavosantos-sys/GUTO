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
import { usePanelI18n } from "@/lib/panel-i18n"

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
  const { t } = usePanelI18n()

  if (!selectedDetail) return null
  const { student } = selectedDetail

  const status = getStatusInfo(student)
  // Status badge text (renomeado para vir do dict; getStatusInfo retorna em PT).
  const statusText =
    status.text === "ARQUIVADO" ? t.tabResumo.statusArchived
    : status.text === "PAUSADO" ? t.tabResumo.statusPaused
    : status.text === "OCULTO ARENA" ? t.tabResumo.statusHiddenArena
    : t.tabResumo.statusActive
  const onb = deriveOnboarding(selectedDetail.memory)
  const calibBadge =
    onb.calibration === "complete"
      ? { variant: "default" as const, text: t.tabResumo.calibComplete }
      : onb.calibration === "partial"
        ? { variant: "outline" as const, text: t.tabResumo.calibPartial }
        : { variant: "secondary" as const, text: t.tabResumo.calibMissing }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title={t.tabResumo.panelOnboarding} className="md:col-span-2">
        <DataRow
          label={t.tabResumo.rowConsent}
          value={<Badge variant={onb.consent ? "default" : "secondary"}>{onb.consent ? t.tabResumo.badgeAccepted : t.tabResumo.badgePending}</Badge>}
        />
        <DataRow label={t.tabResumo.rowSovereignName} value={selectedDetail.memory?.name || "-"} />
        <DataRow label={t.tabResumo.rowCalibration} value={<Badge variant={calibBadge.variant}>{calibBadge.text}</Badge>} />
        <DataRow
          label={t.tabResumo.rowPact}
          value={<Badge variant={onb.pact ? "default" : "secondary"}>{onb.pact ? t.tabResumo.badgeAccepted : t.tabResumo.badgePending}</Badge>}
        />
        <DataRow
          label={t.tabResumo.rowSystemActive}
          value={
            <Badge variant={onb.active ? "default" : "outline"}>
              {onb.active ? t.tabResumo.badgeYes : t.tabResumo.badgeWaitingOnboarding}
            </Badge>
          }
        />
      </Panel>

      <Panel title={t.tabResumo.panelProfile}>
        <DataRow label={t.tabResumo.rowStatus} value={<Badge variant={status.variant}>{statusText}</Badge>} />
        <DataRow label={t.tabResumo.rowEmail} value={student.email || "-"} />
        <DataRow label={t.tabResumo.rowPhone} value={student.phone || "-"} />
        <DataRow label={t.tabResumo.rowSubscription} value={student.subscriptionStatus || "-"} />
        <DataRow label={t.tabResumo.rowExpiresAt} value={formatDate(student.subscriptionEndsAt)} />
        <DataRow label={t.tabResumo.rowCoach} value={coachLabel(student, coaches)} />
        {isSuperAdmin && (
          <DataRow
            label={t.tabResumo.rowTeam}
            value={teams.find((tm) => tm.id === student.teamId)?.name || student.teamId || "-"}
          />
        )}
        <DataRow label={t.tabResumo.rowArena} value={student.visibleInArena ? t.tabResumo.arenaVisible : t.tabResumo.arenaHidden} />
      </Panel>

      <Panel title={t.tabResumo.panelEvolution}>
        <DataRow label={t.tabResumo.rowWeeklyXp} value={`${student.weeklyXp} XP`} />
        <DataRow label={t.tabResumo.rowMonthlyXp} value={`${student.monthlyXp} XP`} />
        <DataRow label={t.tabResumo.rowTotalXp} value={`${student.totalXp} XP`} />
        <DataRow label={t.tabResumo.rowStreak} value={t.tabResumo.streakDays(student.currentStreak)} />
        <DataRow label={t.tabResumo.rowValidations} value={student.validationsTotal} />
        <DataRow
          label={t.tabResumo.rowAvatar}
          value={avatarStageLabel(student.avatarStage)}
        />
      </Panel>

      <Panel title={t.tabResumo.panelCurrentPlan} className="md:col-span-2">
        <DataRow
          label={t.tabResumo.rowWorkout}
          value={`${sourceLabel(selectedDetail.workout?.source)}${
            selectedDetail.workout?.lockedByCoach ? ` · ${t.tabResumo.workoutLocked}` : ""
          }`}
        />
        <DataRow
          label={t.tabResumo.rowDiet}
          value={`${sourceLabel(selectedDetail.diet?.source)}${
            selectedDetail.diet?.lockedByCoach ? ` · ${t.tabResumo.dietLocked}` : ""
          }`}
        />
      </Panel>

    </div>
  )
}
