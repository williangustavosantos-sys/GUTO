"use client"

import { Btn, Pill } from "@/components/panel/atoms"
import { IX } from "@/components/panel/icons"
import { ModalShell } from "@/components/panel/modal-shell"
import { usePanel } from "@/components/panel/panel-context"
import { usePanelViewport } from "@/hooks/use-panel-viewport"
import { T } from "@/lib/panel/tokens"

/**
 * Modal genérico exibido quando `showCreate` é "coach" ou "aluno".
 * Esses fluxos ainda não foram especificados em detalhe (só "empresa" foi).
 * Pra não deixar o botão silenciosamente quebrado, abrimos esta janela
 * resumida explicando que entra na próxima fase + qual é a ordem da cadeia.
 */
export function ProximaFaseModal() {
  const { showCreate, setShowCreate } = usePanel()
  const { isMobile } = usePanelViewport()

  if (showCreate !== "coach" && showCreate !== "aluno") return null
  const kind = showCreate
  const close = () => setShowCreate(null)
  const label = kind === "coach" ? "Novo coach" : "Novo aluno"
  const sequence =
    kind === "coach"
      ? "Empresa → Coach → Aluno. Coach só pode ser criado dentro de uma empresa existente."
      : "Empresa → Coach → Aluno. Aluno só pode ser criado dentro de uma empresa e atribuído a um coach existente."

  return (
    <ModalShell onClose={close} ariaLabel={label} maxWidth={480}>
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
            CADEIA OPERACIONAL
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
            {label}
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

      <div
        style={{
          padding: isMobile ? "18px" : "22px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <Pill tone="warn" dot>
          Disponível na próxima fase
        </Pill>
        <div style={{ fontFamily: T.ui, fontSize: 13.5, color: T.fg2, lineHeight: 1.6 }}>
          A criação de {kind === "coach" ? "coach" : "aluno"} ainda não está ativa neste
          painel. Primeiro precisamos aprovar o cadastro de Empresa, depois liberamos esta
          etapa.
        </div>
        <div
          style={{
            padding: "12px 14px",
            background: T.surfaceAlt,
            border: `1px solid ${T.borderSoft}`,
            borderRadius: 8,
            fontFamily: T.ui,
            fontSize: 12.5,
            color: T.fg2,
            lineHeight: 1.55,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: T.fg4,
              marginBottom: 4,
            }}
          >
            Cadeia
          </div>
          {sequence}
        </div>
      </div>

      <div
        style={{
          padding: isMobile ? "14px 18px" : "16px 24px",
          borderTop: `1px solid ${T.borderSoft}`,
          background: T.surfaceAlt,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <Btn variant="default" sm onClick={close}>
          Fechar
        </Btn>
      </div>
    </ModalShell>
  )
}
