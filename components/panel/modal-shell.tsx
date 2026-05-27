"use client"

import type { ReactNode } from "react"
import { Card } from "./atoms"
import { usePanelViewport } from "@/hooks/use-panel-viewport"
import { T } from "@/lib/panel/tokens"

interface ModalShellProps {
  children: ReactNode
  onClose: () => void
  ariaLabel: string
  /** maxWidth do card. Default 680. */
  maxWidth?: number
}

/**
 * Backdrop + container central padrão dos modais do painel.
 * Clique no backdrop fecha. ESC já é tratado no PanelProvider.
 * Em mobile, o card ocupa a tela inteira.
 */
export function ModalShell({ children, onClose, ariaLabel, maxWidth = 680 }: ModalShellProps) {
  const { isMobile } = usePanelViewport()
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "grid",
        placeItems: isMobile ? "stretch" : "center",
        padding: isMobile ? 0 : 24,
        animation: "panel-fade-in 140ms ease forwards",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth,
          maxHeight: isMobile ? "100vh" : "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: isMobile ? 0 : 14,
          background: T.surface,
        }}
      >
        {children}
      </Card>
    </div>
  )
}
