"use client"

import { useState } from "react"
import { T } from "@/lib/panel/tokens"
import { usePanelI18n, type PanelLang } from "@/lib/panel/i18n"
import { usePanelViewport } from "@/hooks/use-panel-viewport"
import { IS_MOCK_DATA } from "@/lib/panel/data-source"
import { Btn, Pill } from "./atoms"
import { IBell, IMenu, IPlus, IX } from "./icons"
import { usePanel } from "./panel-context"

// Maps each known screen id to its title/subtitle translation keys.
const SCREEN_KEYS: Record<string, { tk: string; sk: string }> = {
  hoje: { tk: "screen.hoje.t", sk: "screen.hoje.s" },
  empresas: { tk: "screen.empresas.t", sk: "screen.empresas.s" },
  alunos: { tk: "screen.alunos.t", sk: "screen.alunos.s" },
  coaches: { tk: "screen.coaches.t", sk: "screen.coaches.s" },
  treinos: { tk: "screen.treinos.t", sk: "screen.treinos.s" },
  dietas: { tk: "screen.dietas.t", sk: "screen.dietas.s" },
  aprovacoes: { tk: "screen.aprovacoes.t", sk: "screen.aprovacoes.s" },
  arena: { tk: "screen.arena.t", sk: "screen.arena.s" },
  logs: { tk: "screen.logs.t", sk: "screen.logs.s" },
  visao_geral: { tk: "screen.visao_geral.t", sk: "screen.visao_geral.s" },
  inicio: { tk: "screen.hoje.t", sk: "screen.hoje.s" },
  meus_alunos: { tk: "screen.meus_alunos.t", sk: "screen.meus_alunos.s" },
}

interface HeaderProps {
  pendingTotal: number
}

const LANG_OPTIONS: PanelLang[] = ["pt", "en", "it"]

export function Header({ pendingTotal }: HeaderProps) {
  const { activeScreen, setShowCreate, setMobileOpen } = usePanel()
  const { t } = usePanelI18n()
  const { isOverlaySidebar, isMobile } = usePanelViewport()
  const keys = SCREEN_KEYS[activeScreen] ?? { tk: activeScreen, sk: "" }
  const cta = headerCta(activeScreen, setShowCreate, isMobile)
  const [actionsOpen, setActionsOpen] = useState(false)

  // Horizontal padding shrinks with the viewport.
  const padX = isMobile ? 14 : isOverlaySidebar ? 20 : 28

  return (
    <header
      style={{
        height: 62,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${padX}px`,
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        boxShadow: "0 1px 0 rgba(15,23,42,0.04)",
        position: "sticky",
        top: 0,
        zIndex: 20,
        gap: isMobile ? 8 : 16,
      }}
    >
      {/* Left: hamburger (mobile/tablet) + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
        {isOverlaySidebar && (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              cursor: "pointer",
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.fg2,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <IMenu size={18} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              flexWrap: "nowrap",
            }}
          >
            <div
              style={{
                fontFamily: T.ui,
                fontSize: isMobile ? 16 : 18,
                fontWeight: 600,
                color: T.fg,
                letterSpacing: "-0.015em",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {t(keys.tk)}
            </div>
            {IS_MOCK_DATA && <MockBadge compact={isMobile} />}
            {!isMobile && (
              <div
                style={{
                  fontFamily: T.ui,
                  fontSize: 13,
                  color: T.fg4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t(keys.sk)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: actions */}
      {isMobile ? (
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
          {cta}
          <button
            type="button"
            onClick={() => setActionsOpen((v) => !v)}
            aria-label="Abrir ações"
            aria-expanded={actionsOpen}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              cursor: "pointer",
              background: actionsOpen ? T.brandSoft : T.surface,
              border: `1px solid ${actionsOpen ? T.brandLine : T.border}`,
              color: actionsOpen ? T.brand : T.fg2,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {actionsOpen ? <IX size={18} /> : <IBell size={18} />}
          </button>
          {actionsOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 240,
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                boxShadow: T.shadow3,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                zIndex: 30,
              }}
            >
              <div
                style={{
                  fontFamily: T.ui,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: T.fg4,
                }}
              >
                Idioma
              </div>
              <LangSwitcher />
              <div style={{ height: 1, background: T.border, margin: "2px 0" }} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Pill tone="ok" dot style={{ fontSize: 11 }}>
                  {t("misc.sys_online")}
                </Pill>
                {pendingTotal > 0 && (
                  <Pill tone="warn" dot style={{ fontSize: 11 }}>
                    {pendingTotal} {t("misc.pendentes")}
                  </Pill>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <LangSwitcher />
          <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px" }} />
          <div style={{ display: "flex", gap: 6 }}>
            <Pill tone="ok" dot style={{ fontSize: 12 }}>
              {t("misc.sys_online")}
            </Pill>
            {pendingTotal > 0 && (
              <Pill tone="warn" dot style={{ fontSize: 12 }}>
                {pendingTotal} {t("misc.pendentes")}
              </Pill>
            )}
          </div>
          <button
            type="button"
            aria-label="Notificações"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              cursor: "pointer",
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.fg2,
              display: "grid",
              placeItems: "center",
            }}
          >
            <IBell size={16} />
          </button>
          {cta}
        </div>
      )}
    </header>
  )
}

function LangSwitcher() {
  const { lang, setLang } = usePanelI18n()
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {LANG_OPTIONS.map((l) => {
        const active = lang === l
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            style={{
              height: 26,
              padding: "0 8px",
              borderRadius: 6,
              cursor: "pointer",
              background: active ? T.brandSoft : "transparent",
              border: `1px solid ${active ? T.brandLine : T.border}`,
              color: active ? T.brand : T.fg4,
              fontFamily: T.ui,
              fontSize: 11,
              fontWeight: active ? 600 : 400,
              textTransform: "uppercase",
            }}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}

function MockBadge({ compact }: { compact: boolean }) {
  return (
    <span
      title="Dados mockados — fase visual. Substituídos pelo backend real na Fase Pós-Visual."
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 20,
        padding: "0 8px",
        borderRadius: 999,
        background: T.warnSoft,
        color: T.warn,
        border: `1px solid ${T.warnLine}`,
        fontFamily: T.mono,
        fontSize: compact ? 9 : 10,
        fontWeight: 700,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 999, background: T.warn }} />
      {compact ? "MOCK" : "DADOS MOCK · FASE VISUAL"}
    </span>
  )
}

function headerCta(
  activeScreen: string,
  setShowCreate: (k: "empresa" | "coach" | "aluno" | null) => void,
  isMobile: boolean,
) {
  if (activeScreen === "empresas")
    return (
      <Btn variant="primary" sm onClick={() => setShowCreate("empresa")}>
        <IPlus size={14} />
        {isMobile ? "Empresa" : "Nova empresa"}
      </Btn>
    )
  if (activeScreen === "coaches")
    return (
      <Btn variant="primary" sm onClick={() => setShowCreate("coach")}>
        <IPlus size={14} />
        {isMobile ? "Coach" : "Novo coach"}
      </Btn>
    )
  if (activeScreen === "alunos" || activeScreen === "meus_alunos")
    return (
      <Btn variant="primary" sm onClick={() => setShowCreate("aluno")}>
        <IPlus size={14} />
        {isMobile ? "Aluno" : "Novo aluno"}
      </Btn>
    )
  return null
}
