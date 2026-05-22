"use client"

import type { ComponentType, ReactNode, SVGProps } from "react"
import { T } from "@/lib/panel/tokens"
import { usePanelI18n } from "@/lib/panel/i18n"
import { usePanelViewport } from "@/hooks/use-panel-viewport"
import { usePanel } from "./panel-context"
import {
  IBuilding,
  IChevL,
  IChevR,
  IDumbbell,
  IFork,
  IGavel,
  ILog,
  IShield,
  ITrend,
  IUsers,
  IX,
  IZap,
} from "./icons"

type IconCmp = ComponentType<{ size?: number; sw?: number } & SVGProps<SVGSVGElement>>

interface NavItem {
  id: string
  lk: string
  Icon: IconCmp
  badgeKey?: "pending"
}

export interface NavGroup {
  lk: string
  items: NavItem[]
}

// Direct port of SUPER_NAV / EMPRESA_NAV / COACH_NAV from light-shell.jsx.
export const SUPER_NAV: NavGroup[] = [
  {
    lk: "nav.ops",
    items: [
      { id: "hoje", lk: "nav.hoje", Icon: IZap },
      { id: "aprovacoes", lk: "nav.aprovacoes", Icon: IGavel, badgeKey: "pending" },
    ],
  },
  {
    lk: "nav.cadastros",
    items: [
      { id: "empresas", lk: "nav.empresas", Icon: IBuilding },
      { id: "coaches", lk: "nav.coaches", Icon: IShield },
      { id: "alunos", lk: "nav.alunos", Icon: IUsers },
    ],
  },
  {
    lk: "nav.conteudo",
    items: [
      { id: "treinos", lk: "nav.treinos", Icon: IDumbbell },
      { id: "dietas", lk: "nav.dietas", Icon: IFork },
    ],
  },
  {
    lk: "nav.analise",
    items: [
      { id: "arena", lk: "nav.arena", Icon: ITrend },
      { id: "logs", lk: "nav.logs", Icon: ILog },
    ],
  },
]

export const EMPRESA_NAV: NavGroup[] = [
  {
    lk: "nav.minha_empresa",
    items: [
      { id: "visao_geral", lk: "nav.visao_geral", Icon: IZap },
      { id: "coaches", lk: "nav.coaches", Icon: IShield },
      { id: "alunos", lk: "nav.alunos", Icon: IUsers },
    ],
  },
  {
    lk: "nav.conteudo",
    items: [
      { id: "treinos", lk: "nav.treinos", Icon: IDumbbell },
      { id: "dietas", lk: "nav.dietas", Icon: IFork },
    ],
  },
  { lk: "nav.analise", items: [{ id: "arena", lk: "nav.arena", Icon: ITrend }] },
]

export const COACH_NAV: NavGroup[] = [
  {
    lk: "nav.ops",
    items: [
      { id: "inicio", lk: "nav.inicio", Icon: IZap },
      { id: "meus_alunos", lk: "nav.meus_alunos", Icon: IUsers },
    ],
  },
  {
    lk: "nav.conteudo",
    items: [
      { id: "treinos", lk: "nav.treinos", Icon: IDumbbell },
      { id: "dietas", lk: "nav.dietas", Icon: IFork },
    ],
  },
  { lk: "nav.analise", items: [{ id: "arena", lk: "nav.arena", Icon: ITrend }] },
]

interface SidebarFooterUser {
  initials: string
  name: ReactNode
  email: ReactNode
  roleBadge?: ReactNode
}

interface SidebarProps {
  navGroups: NavGroup[]
  pendingTotal: number
  brandSubtitleKey: string
  footerUser: SidebarFooterUser
}

export function Sidebar({ navGroups, pendingTotal, brandSubtitleKey, footerUser }: SidebarProps) {
  const { activeScreen, navigateToScreen, collapsed, setCollapsed, mobileOpen, setMobileOpen } = usePanel()
  const { t } = usePanelI18n()
  const { isOverlaySidebar, isDesktop } = usePanelViewport()
  // In overlay mode (mobile/tablet), the drawer always renders expanded; the
  // desktop-only `collapsed` icon-mode does not apply.
  const isExpanded = isDesktop ? !collapsed : true
  const toggleDesktopCollapse = () => setCollapsed((v) => !v)
  const closeDrawer = () => setMobileOpen(false)

  const sidebarWidth = isOverlaySidebar ? 280 : isExpanded ? 248 : 64

  const visible = isOverlaySidebar ? mobileOpen : true

  return (
    <>
      {/* Backdrop — only in overlay mode, only when open. */}
      {isOverlaySidebar && mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={closeDrawer}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            border: "none",
            cursor: "pointer",
            zIndex: 40,
            animation: "panel-fade-in 140ms ease forwards",
          }}
        />
      )}

      <aside
        aria-hidden={!visible}
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: T.sidebar,
          borderRight: "none",
          transition: "width 200ms ease, transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden",
          boxShadow: visible ? "2px 0 16px rgba(0,0,0,0.18)" : "none",
          position: isOverlaySidebar ? "fixed" : "relative",
          inset: isOverlaySidebar ? "0 auto 0 0" : undefined,
          top: isOverlaySidebar ? 0 : undefined,
          left: isOverlaySidebar ? 0 : undefined,
          zIndex: 50,
          transform: visible ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* Brand */}
        <div
          style={{
            height: 66,
            display: "flex",
            alignItems: "center",
            padding: isExpanded ? "0 16px 0 18px" : "0 0 0 17px",
            borderBottom: `1px solid ${T.sidebarBorder}`,
            gap: 12,
            flexShrink: 0,
          }}
        >
          {isExpanded ? (
            <>
              <BrandMark />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: T.ui,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#FFFFFF",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.15,
                  }}
                >
                  GUTO
                </div>
                <div
                  style={{
                    fontFamily: T.ui,
                    fontSize: 10.5,
                    color: T.sidebarFgMuted,
                    lineHeight: 1.2,
                    marginTop: 1,
                    letterSpacing: "0.04em",
                  }}
                >
                  {t(brandSubtitleKey)}
                </div>
              </div>
              {/* In overlay mode show close X; in desktop expanded show collapse chevron. */}
              {isOverlaySidebar ? (
                <SidebarIconButton ariaLabel="Fechar menu" onClick={closeDrawer}>
                  <IX size={15} />
                </SidebarIconButton>
              ) : (
                <SidebarIconButton ariaLabel="Recolher menu" onClick={toggleDesktopCollapse}>
                  <IChevL size={15} />
                </SidebarIconButton>
              )}
            </>
          ) : (
            <BrandMark />
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          {navGroups.map((group, gi) => (
            <div key={`${group.lk}-${gi}`} style={{ marginBottom: 6 }}>
              {isExpanded && (
                <div
                  style={{
                    padding: "10px 20px 4px",
                    fontFamily: T.ui,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: T.sidebarFgGroup,
                  }}
                >
                  {t(group.lk)}
                </div>
              )}
              {group.items.map(({ id, lk, Icon, badgeKey }) => {
                const active = activeScreen === id
                const badge = badgeKey === "pending" && pendingTotal > 0 ? pendingTotal : null
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigateToScreen(id)}
                    title={!isExpanded ? t(lk) : undefined}
                    style={{
                      width: isExpanded ? "calc(100% - 12px)" : "100%",
                      margin: isExpanded ? "1px 6px" : "0",
                      height: 38,
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: isExpanded ? "0 12px" : "0 0 0 18px",
                      background: active ? T.sidebarActive : "transparent",
                      border: "none",
                      borderLeft: active && isExpanded ? `2px solid ${T.cyan}` : "2px solid transparent",
                      cursor: "pointer",
                      borderRadius: isExpanded ? 8 : 0,
                      color: active ? T.sidebarFgActive : T.sidebarFg,
                      fontFamily: T.ui,
                      fontSize: 13.5,
                      fontWeight: active ? 600 : 400,
                      textAlign: "left",
                      position: "relative",
                      transition: "background 120ms ease, color 120ms ease",
                      letterSpacing: active ? "-0.005em" : "0",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = T.sidebarHover
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = "transparent"
                    }}
                  >
                    <span style={{ opacity: active ? 1 : 0.7 }}>
                      <Icon size={16} sw={active ? 2 : 1.7} />
                    </span>
                    {isExpanded && <span style={{ flex: 1 }}>{t(lk)}</span>}
                    {isExpanded && badge != null && (
                      <span
                        style={{
                          background: "#B45309",
                          color: "#fff",
                          borderRadius: 999,
                          padding: "1px 7px",
                          fontFamily: T.ui,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {badge}
                      </span>
                    )}
                    {!isExpanded && badge != null && (
                      <span
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 10,
                          width: 7,
                          height: 7,
                          borderRadius: 999,
                          background: "#F59E0B",
                          boxShadow: "0 0 6px #F59E0B",
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div
          style={{
            borderTop: `1px solid ${T.sidebarBorder}`,
            padding: isExpanded ? "12px 14px" : "12px 0",
            flexShrink: 0,
          }}
        >
          {isExpanded ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: "rgba(82,231,255,0.15)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: T.ui,
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.cyan,
                  flexShrink: 0,
                }}
              >
                {footerUser.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: T.ui,
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.sidebarFgActive,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {footerUser.name}
                </div>
                <div
                  style={{
                    fontFamily: T.ui,
                    fontSize: 11,
                    color: T.sidebarFgMuted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {footerUser.email}
                </div>
              </div>
              {footerUser.roleBadge && (
                <span
                  style={{
                    fontFamily: T.ui,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    color: T.cyan,
                    opacity: 0.85,
                  }}
                >
                  {footerUser.roleBadge}
                </span>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={toggleDesktopCollapse}
              aria-label="Expandir menu"
              style={{
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.sidebarFgMuted,
                padding: "6px 0",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <IChevR size={15} />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

function BrandMark() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        background: "linear-gradient(135deg, #52e7ff 0%, #0891B2 100%)",
        display: "grid",
        placeItems: "center",
        color: "#04131e",
        boxShadow: "0 0 18px rgba(82,231,255,0.35)",
        flexShrink: 0,
      }}
    >
      <IShield size={16} sw={2.4} />
    </div>
  )
}

function SidebarIconButton({
  children,
  onClick,
  ariaLabel,
}: {
  children: ReactNode
  onClick: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: T.sidebarFgMuted,
        padding: 5,
        display: "flex",
        alignItems: "center",
        borderRadius: 6,
        transition: "color 120ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = T.sidebarFg)}
      onMouseLeave={(e) => (e.currentTarget.style.color = T.sidebarFgMuted)}
    >
      {children}
    </button>
  )
}
