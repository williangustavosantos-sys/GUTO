"use client"

import type { ReactNode } from "react"
import { Btn, Card, Kicker } from "@/components/panel/atoms"
import {
  IBuilding,
  ICheck,
  IShield,
  IUser,
  IUsers,
} from "@/components/panel/icons"
import { usePanel } from "@/components/panel/panel-context"
import { usePanelViewport } from "@/hooks/use-panel-viewport"
import { T } from "@/lib/panel/tokens"
import type { AdminOverview } from "@/lib/panel/types"

interface SetupWizardScreenProps {
  overview: AdminOverview
}

/**
 * Renderizado pela SalaApp quando `isPanelEmpty(overview)` retorna true.
 * Substitui a Visão Geral por um guia de 6 passos. Não mostra KPI zerado nem
 * tabela vazia parecendo dado real.
 *
 * Em Fase 2a (mocks):
 *   - clicar nos passos 1-3 abre os Create placeholders já existentes (`setShowCreate`)
 *   - passos 4-6 ainda não têm ação dedicada (entram nas próximas fases)
 *
 * Em Fase 2e (backend real):
 *   - passos auto-completam quando os contadores reais chegam
 *   - quando `overview.students.active >= 1`, a Sala troca pra Visão Geral normal
 */
export function SetupWizardScreen({ overview }: SetupWizardScreenProps) {
  const { setShowCreate } = usePanel()
  const { isMobile, isTablet } = usePanelViewport()
  const screenPad = isMobile ? "20px 14px" : isTablet ? "24px 22px" : "28px 32px"

  const steps: SetupStep[] = [
    {
      n: 1,
      icon: <IBuilding size={18} />,
      title: "Criar primeira empresa",
      sub: "Cadastre o time/academia que vai operar dentro do GUTO. Define plano e limites.",
      done: overview.teams.total >= 1,
      ctaLabel: "Criar empresa",
      onCta: () => setShowCreate("empresa"),
    },
    {
      n: 2,
      icon: <IShield size={18} />,
      title: "Criar coach",
      sub: "Adicione um treinador vinculado à empresa. Coaches gerenciam treinos, dietas e acompanham alunos.",
      done: overview.coaches.total >= 1,
      blocked: overview.teams.total < 1,
      blockedMsg: "Primeiro crie uma empresa.",
      ctaLabel: "Adicionar coach",
      onCta: () => setShowCreate("coach"),
    },
    {
      n: 3,
      icon: <IUsers size={18} />,
      title: "Criar aluno",
      sub: "Cadastre o primeiro aluno. Será associado a um coach. Ainda não vai aparecer no app — precisa do convite.",
      done: overview.students.total >= 1,
      blocked: overview.coaches.total < 1,
      blockedMsg: "Primeiro crie ao menos um coach.",
      ctaLabel: "Adicionar aluno",
      onCta: () => setShowCreate("aluno"),
    },
    {
      n: 4,
      icon: <IUser size={18} />,
      title: "Enviar convite",
      sub: "Gere o link de onboarding e mande pro aluno. Sem isso, ele não consegue entrar no app.",
      done: false, // backend ainda não expõe contador de convites
      blocked: overview.students.total < 1,
      blockedMsg: "Primeiro crie um aluno.",
      ctaLabel: "Gerar convite",
      passive: true,
      passiveMsg: "Disponível em Detalhe do Aluno (próxima fase).",
    },
    {
      n: 5,
      icon: <ICheck size={18} />,
      title: "Aguardar calibragem do aluno",
      sub: "Quando o aluno abre o link, faz o onboarding (idioma → senha → termos → nome → calibragem → pacto) e ativa a conta.",
      done: overview.students.active >= 1,
      blocked: overview.students.total < 1,
      blockedMsg: "Aguardando o primeiro aluno ser criado.",
      passive: true,
      passiveMsg: "Sem ação direta — o aluno conduz esse passo.",
    },
    {
      n: 6,
      icon: <IUsers size={18} />,
      title: "Métricas reais aparecem",
      sub: "Assim que houver pelo menos 1 aluno ativo com calibragem feita, a Visão Geral troca esse guia pelos KPIs e a tabela de Empresas.",
      done: overview.students.active >= 1,
      passive: true,
      passiveMsg: "Automático — não precisa fazer nada.",
    },
  ]

  return (
    <div style={{ padding: screenPad, display: "flex", flexDirection: "column", gap: 20 }}>
      <Card padded>
        <Kicker brand>SETUP</Kicker>
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 22,
            fontWeight: 700,
            color: T.fg,
            marginTop: 6,
            letterSpacing: "-0.01em",
          }}
        >
          Vamos colocar sua operação no ar
        </div>
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 14,
            color: T.fg3,
            marginTop: 6,
            lineHeight: 1.55,
            maxWidth: 640,
          }}
        >
          Ainda não tem dados reais aqui. Esse guia te leva por 6 passos até o painel começar a mostrar
          métricas de verdade. Nada de número fictício enquanto isso.
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {steps.map((step, i) => (
            <StepRow key={step.n} step={step} isFirst={i === 0} />
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */

interface SetupStep {
  n: number
  icon: ReactNode
  title: string
  sub: string
  done: boolean
  blocked?: boolean
  blockedMsg?: string
  passive?: boolean
  passiveMsg?: string
  ctaLabel?: string
  onCta?: () => void
}

function StepRow({ step, isFirst }: { step: SetupStep; isFirst: boolean }) {
  const { isMobile } = usePanelViewport()
  const interactive = !step.done && !step.blocked && !step.passive && step.onCta

  const numberBadge = (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        background: step.done ? T.okSoft : step.blocked ? T.muteSoft : T.brandSoft,
        border: `1px solid ${step.done ? T.okLine : step.blocked ? T.muteLine : T.brandLine}`,
        color: step.done ? T.ok : step.blocked ? T.fg4 : T.brand,
        display: "grid",
        placeItems: "center",
        fontFamily: T.ui,
        fontSize: 14,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {step.done ? <ICheck size={16} sw={2.4} /> : step.n}
    </div>
  )

  const iconChip = (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: T.surfaceAlt,
        border: `1px solid ${T.borderSoft}`,
        color: step.done ? T.ok : step.blocked ? T.fg4 : T.brand,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      {step.icon}
    </div>
  )

  return (
    <div
      style={{
        display: "flex",
        gap: isMobile ? 12 : 16,
        padding: isMobile ? "16px" : "18px 22px",
        borderTop: isFirst ? "none" : `1px solid ${T.borderSoft}`,
        background: T.surface,
        opacity: step.blocked ? 0.6 : 1,
      }}
    >
      {numberBadge}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div
            style={{
              fontFamily: T.ui,
              fontSize: isMobile ? 14 : 15,
              fontWeight: 600,
              color: T.fg,
              letterSpacing: "-0.005em",
            }}
          >
            {step.title}
          </div>
          {step.done && (
            <span
              style={{
                fontFamily: T.ui,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: T.ok,
                padding: "2px 8px",
                background: T.okSoft,
                borderRadius: 999,
                border: `1px solid ${T.okLine}`,
              }}
            >
              Feito
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 13,
            color: T.fg3,
            lineHeight: 1.55,
            marginBottom: 10,
          }}
        >
          {step.sub}
        </div>

        {/* Estado + ação */}
        {step.done ? null : step.blocked ? (
          <div style={{ fontFamily: T.ui, fontSize: 12.5, color: T.fg4, fontStyle: "italic" }}>
            {step.blockedMsg}
          </div>
        ) : step.passive ? (
          <div style={{ fontFamily: T.ui, fontSize: 12.5, color: T.fg3 }}>{step.passiveMsg}</div>
        ) : interactive ? (
          <Btn variant="primary" sm onClick={step.onCta}>
            {step.ctaLabel}
          </Btn>
        ) : null}
      </div>
      {!isMobile && iconChip}
    </div>
  )
}
