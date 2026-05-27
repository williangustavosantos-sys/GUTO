"use client"

import type { ReactNode } from "react"
import { Btn, Pill } from "@/components/panel/atoms"
import { IX } from "@/components/panel/icons"
import { ModalShell } from "@/components/panel/modal-shell"
import { usePanel } from "@/components/panel/panel-context"
import { usePanelViewport } from "@/hooks/use-panel-viewport"
import { T } from "@/lib/panel/tokens"

/**
 * Modal informativo read-only de "Nova Empresa".
 *
 * Não cria empresa de verdade — só mostra ao super_admin os campos, regras
 * de plano, payload e validações que serão pedidas quando o backend
 * `POST /admin/teams` (ou `/admin/panel/companies`) for liberado.
 *
 * Por que existe agora: o botão "+ Nova empresa" precisa fazer algo. Em vez
 * de desabilitar, escolhemos abrir essa preview pra documentar o contrato.
 *
 * Spec gravada aqui veio do briefing do usuário (Will, 2026-05-23) — fonte
 * autoritativa até virar endpoint real na fase backend.
 */
export function NovaEmpresaInfoModal() {
  const { showCreate, setShowCreate } = usePanel()
  const { isMobile } = usePanelViewport()

  if (showCreate !== "empresa") return null
  const close = () => setShowCreate(null)

  return (
    <ModalShell onClose={close} ariaLabel="Nova Empresa (preview)">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: isMobile ? "16px 18px 12px" : "20px 24px 16px",
          borderBottom: `1px solid ${T.borderSoft}`,
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: T.ui,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: T.brand,
              marginBottom: 6,
            }}
          >
            SUPER ADMIN · CADASTRO COMERCIAL
          </div>
          <div
            style={{
              fontFamily: T.ui,
              fontSize: isMobile ? 18 : 20,
              fontWeight: 700,
              color: T.fg,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            Nova Empresa
          </div>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Fechar"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.fg2,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <IX size={16} />
        </button>
      </div>

      {/* Banner: read-only / próxima fase */}
      <div
        style={{
          padding: isMobile ? "14px 18px" : "16px 24px",
          background: T.warnSoft,
          borderBottom: `1px solid ${T.warnLine}`,
          color: T.warn,
          fontFamily: T.ui,
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.5,
        }}
      >
        Criação de empresa entra na próxima fase. Esta tela mostra os campos,
        regras e validações que serão pedidas — só leitura por enquanto.
      </div>

      {/* Body */}
      <div
        style={{
          padding: isMobile ? "18px" : "24px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          maxHeight: "65vh",
          overflowY: "auto",
        }}
      >
        <Section title="Dados da empresa">
          <SpecField label="Nome da empresa" required hint="Ex.: Action Fit" />
          <SpecField label="Plano" required hint="Start / Pro / Elite / Custom" />
          <SpecField
            label="Status inicial"
            required
            hint="Padrão: active. paused/archived só se super_admin escolher."
          />
        </Section>

        <Section title="Responsável da empresa">
          <SpecField label="Nome do responsável" required hint="Ex.: Carlos Mendes" />
          <SpecField label="E-mail do responsável" required hint="Validação: formato de e-mail" />
          <SpecField
            label="Telefone do responsável / empresa"
            required
            hint="Obrigatório no cadastro comercial. Formato internacional (+55 11 99999-9999) ou normalizado."
            warning="Não confundir com aluno. Aluno NÃO tem telefone na calibragem. Esse campo é da empresa ou responsável, nunca do aluno, e nunca é salvo na memória do aluno."
          />
        </Section>

        <Section title="Localização">
          <SpecField label="País" required hint="ISO-3166 alpha-2 (BR, IT, PT...)" />
          <SpecField label="Cidade" required hint="Texto livre" />
        </Section>

        <Section title="Capacidade (derivada do plano)">
          <PlanRule plan="Start" coaches={2} students={20} />
          <PlanRule plan="Pro" coaches={4} students={50} />
          <PlanRule plan="Elite" coaches={6} students={70} />
          <PlanRule plan="Custom" coaches={null} students={null} custom />
          <div
            style={{
              fontFamily: T.ui,
              fontSize: 12.5,
              color: T.fg3,
              marginTop: 8,
              lineHeight: 1.55,
            }}
          >
            Para plano Custom, super_admin define <code>maxCoaches</code> e{" "}
            <code>maxStudents</code> manualmente na criação.
          </div>
        </Section>

        <Section title="Opcional">
          <SpecField label="Notas internas" hint="Texto livre — só visível pra super_admin/admin" />
        </Section>

        <Section title="Validações no submit">
          <BulletList
            items={[
              "Nome obrigatório",
              "Plano obrigatório",
              "E-mail em formato válido",
              "Telefone obrigatório",
              "Telefone em formato internacional ou normalizado",
              "País obrigatório",
              "Cidade obrigatória",
              "Se plano = custom: maxCoaches e maxStudents obrigatórios",
              "Não permitir empresa duplicada por slug/nome normalizado",
            ]}
          />
        </Section>

        <Section title="Payload futuro do POST">
          <CodeBlock
            code={`{
  "name": "Action Fit",
  "plan": "pro",
  "status": "active",
  "customLimits": null,
  "responsibleName": "Carlos Mendes",
  "responsibleEmail": "carlos@actionfit.com",
  "responsiblePhone": "+55 11 99999-9999",
  "country": "BR",
  "city": "São Paulo",
  "internalNotes": "Contrato anual"
}`}
          />
          <div
            style={{
              fontFamily: T.ui,
              fontSize: 12.5,
              color: T.fg3,
              marginTop: 4,
              lineHeight: 1.55,
            }}
          >
            Para plano Custom, <code>customLimits</code> é objeto com{" "}
            <code>maxCoaches</code> e <code>maxStudents</code>.
          </div>
        </Section>

        <Section title="Depois de criar (fase backend)">
          <BulletList
            items={[
              "Backend gera teamId",
              "Empresa aparece na tabela de Empresas em /admin",
              "Uso inicial: coaches 0 / limite · alunos 0 / limite",
              "Setup wizard libera o próximo passo: criar coach",
            ]}
          />
        </Section>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: isMobile ? "14px 18px" : "16px 24px",
          borderTop: `1px solid ${T.borderSoft}`,
          background: T.surfaceAlt,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: T.fg4,
          }}
        >
          Preview · sem ação de criação
        </div>
        <Btn variant="default" sm onClick={close}>
          Fechar
        </Btn>
      </div>
    </ModalShell>
  )
}
/* ─── helpers ─────────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontFamily: T.ui,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: T.fg4,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  )
}

function SpecField({
  label,
  hint,
  warning,
  required,
}: {
  label: string
  hint?: string
  warning?: string
  required?: boolean
}) {
  return (
    <div
      style={{
        padding: "10px 12px",
        background: T.surfaceAlt,
        border: `1px solid ${T.borderSoft}`,
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span
          style={{
            fontFamily: T.ui,
            fontSize: 13.5,
            fontWeight: 600,
            color: T.fg,
          }}
        >
          {label}
        </span>
        {required && (
          <Pill tone="warn" style={{ height: 18, fontSize: 10, padding: "0 6px" }}>
            obrigatório
          </Pill>
        )}
      </div>
      {hint && (
        <div style={{ fontFamily: T.ui, fontSize: 12, color: T.fg3, lineHeight: 1.5 }}>
          {hint}
        </div>
      )}
      {warning && (
        <div
          style={{
            marginTop: 6,
            padding: "8px 10px",
            background: T.badSoft,
            border: `1px solid ${T.badLine}`,
            borderRadius: 6,
            fontFamily: T.ui,
            fontSize: 12,
            color: T.bad,
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          {warning}
        </div>
      )}
    </div>
  )
}

function PlanRule({
  plan,
  coaches,
  students,
  custom,
}: {
  plan: string
  coaches: number | null
  students: number | null
  custom?: boolean
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr 1fr",
        gap: 10,
        alignItems: "center",
        padding: "8px 12px",
        background: T.surface,
        border: `1px solid ${T.borderSoft}`,
        borderRadius: 8,
      }}
    >
      <Pill tone={custom ? "brand" : "mute"}>{plan}</Pill>
      <span style={{ fontFamily: T.mono, fontSize: 12.5, color: T.fg2 }}>
        {coaches === null ? "manual" : `${coaches} coaches`}
      </span>
      <span style={{ fontFamily: T.mono, fontSize: 12.5, color: T.fg2 }}>
        {students === null ? "manual" : `${students} alunos`}
      </span>
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul
      style={{
        margin: 0,
        paddingLeft: 18,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        fontFamily: T.ui,
        fontSize: 13,
        color: T.fg2,
        lineHeight: 1.55,
      }}
    >
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: "12px 14px",
        background: "#0F172A",
        color: "#E5E7EB",
        borderRadius: 8,
        overflowX: "auto",
        fontFamily: T.mono,
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <code>{code}</code>
    </pre>
  )
}
