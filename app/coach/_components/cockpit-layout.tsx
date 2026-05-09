"use client"

import { useState, type ReactNode } from "react"
import {
  Activity,
  Building2,
  ChevronLeft,
  ChevronRight,
  Database,
  Dumbbell,
  Gavel,
  Globe,
  Menu,
  Settings,
  Shield,
  Signal,
  Users,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react"
import { useCockpit } from "./cockpit-context"
import { T } from "./control-tokens"
import { Btn, Pill, TelemetryStamp } from "./controls"
import type { Screen } from "./utils"

// ─── Sidebar config ───────────────────────────────────────────────────────────

interface NavItem {
  id: Screen
  label: string
  icon: ReactNode
  adminOnly?: boolean
  superAdminOnly?: boolean
  showsBadge?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: "hoje", label: "HOJE", icon: <Zap className="h-3.5 w-3.5" /> },
  { id: "empresas", label: "EMPRESAS", icon: <Building2 className="h-3.5 w-3.5" />, superAdminOnly: true },
  { id: "students", label: "ALUNOS", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "coaches", label: "COACHES", icon: <Shield className="h-3.5 w-3.5" />, adminOnly: true },
  { id: "treinos", label: "TREINOS", icon: <Dumbbell className="h-3.5 w-3.5" /> },
  { id: "dietas", label: "DIETAS", icon: <UtensilsCrossed className="h-3.5 w-3.5" /> },
  { id: "aprovacoes", label: "APROVAÇÕES", icon: <Gavel className="h-3.5 w-3.5" />, adminOnly: true, showsBadge: true },
  { id: "banco", label: "BANCO GUTO", icon: <Database className="h-3.5 w-3.5" />, adminOnly: true },
  { id: "arena", label: "ARENA", icon: <Activity className="h-3.5 w-3.5" /> },
  { id: "logs", label: "LOGS", icon: <Settings className="h-3.5 w-3.5" />, adminOnly: true },
]

const SCREEN_TITLES: Record<Screen, { t: string; sub: string }> = {
  hoje: { t: "Hoje", sub: "Visão geral operacional · super admin" },
  empresas: { t: "Empresas", sub: "Cadastros / clientes B2B · operadores" },
  students: { t: "Alunos", sub: "Todos os alunos · todas as empresas" },
  coaches: { t: "Coaches", sub: "Operadores limitados · permissões" },
  treinos: { t: "Treinos", sub: "Fila editorial · ordenada por urgência" },
  dietas: { t: "Dietas", sub: "Fila editorial · ordenada por urgência" },
  aprovacoes: { t: "Aprovações", sub: "Itens pendentes para o catálogo GUTO" },
  banco: { t: "Banco do GUTO", sub: "Catálogo aprovado · usado em treinos / dietas" },
  arena: { t: "Arena", sub: "Ranking competitivo · todos os alunos" },
  logs: { t: "Logs", sub: "Auditoria do sistema · super admin" },
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  collapsed,
  onToggle,
  onClose,
}: {
  collapsed: boolean
  onToggle: () => void
  onClose?: () => void
}) {
  const { user, isAdmin, isSuperAdmin, activeScreen, setActiveScreen, pendingExercises } = useCockpit()

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin
    if (item.adminOnly) return isAdmin
    return true
  })

  const pendingTotal = pendingExercises.length

  return (
    <aside
      className="flex h-full flex-col"
      style={{
        width: collapsed ? 64 : 232,
        flexShrink: 0,
        background: "linear-gradient(180deg,rgba(4,7,16,0.98) 0%, rgba(4,7,16,0.94) 100%)",
        borderRight: `1px solid ${T.border}`,
        transition: "width 200ms ease",
        overflow: "hidden",
      }}
    >
      {/* Brand strip */}
      <div
        style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          padding: collapsed ? "0 0 0 18px" : "14px 16px 12px",
          borderBottom: `1px solid ${T.border}`,
          gap: 10,
          flexShrink: 0,
          background:
            "radial-gradient(120% 100% at 50% 0%, rgba(82,231,255,0.08) 0%, rgba(82,231,255,0) 70%)",
        }}
      >
        {!collapsed ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 13,
                  fontWeight: 900,
                  color: T.cyan,
                  letterSpacing: "0.32em",
                  textShadow: "0 0 10px rgba(82,231,255,0.6)",
                }}
              >
                GUTO
              </span>
              <button
                onClick={onToggle}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: T.fg3,
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Recolher"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 9,
                fontWeight: 900,
                color: T.cyan,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                textShadow: "0 0 8px rgba(82,231,255,0.5)",
              }}
            >
              SALA DE CONTROLE
            </div>
          </div>
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: T.cyanSoft,
              border: `1px solid ${T.cyanLine}`,
              display: "grid",
              placeItems: "center",
              color: T.cyan,
              boxShadow: "0 0 14px rgba(82,231,255,0.30)",
            }}
          >
            <Shield className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* Hierarchy stamp */}
      {!collapsed && isSuperAdmin && (
        <div style={{ padding: "10px 16px 6px", borderBottom: `1px solid ${T.border}` }}>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 8,
              fontWeight: 900,
              color: T.fg4,
              letterSpacing: "0.30em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            HIERARQUIA
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              fontFamily: T.mono,
              fontSize: 9,
              color: T.fg3,
              letterSpacing: "0.10em",
            }}
          >
            <span style={{ color: T.cyan, fontWeight: 900 }}>SUPER ADMIN</span>
            <span>↳ Empresas</span>
            <span style={{ paddingLeft: 12 }}>↳ Coaches</span>
            <span style={{ paddingLeft: 24 }}>↳ Alunos</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
        {visibleItems.map((item) => {
          const active = activeScreen === item.id
          const badge = item.showsBadge && pendingTotal > 0 ? pendingTotal : null
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveScreen(item.id)
                onClose?.()
              }}
              title={collapsed ? item.label : undefined}
              style={{
                width: "100%",
                height: 40,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "0 0 0 20px" : "0 16px",
                background: active ? T.cyanSoft : "transparent",
                borderRight: active ? `2px solid ${T.cyan}` : "2px solid transparent",
                border: "none",
                cursor: "pointer",
                color: active ? T.cyan : T.fg3,
                fontFamily: T.mono,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                transition: "all 140ms ease",
                textAlign: "left",
                position: "relative",
              }}
            >
              {item.icon}
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && badge && (
                <span
                  style={{
                    background: T.warnS,
                    color: T.warn,
                    border: "1px solid rgba(251,191,36,0.30)",
                    borderRadius: 999,
                    padding: "1px 7px",
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: "0.04em",
                  }}
                >
                  {badge}
                </span>
              )}
              {collapsed && badge && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 8,
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: T.warn,
                    boxShadow: `0 0 6px ${T.warn}`,
                  }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer / user stamp */}
      {!collapsed ? (
        <div
          style={{
            borderTop: `1px solid ${T.border}`,
            padding: "12px 16px",
            flexShrink: 0,
            background: "rgba(0,0,0,0.30)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: T.ok,
                boxShadow: `0 0 8px ${T.ok}`,
              }}
            />
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                fontWeight: 900,
                color: T.fg2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.email || user.name || user.userId}
            </div>
          </div>
          <Pill tone={isSuperAdmin ? "cyan" : isAdmin ? "warn" : "neutral"}>
            {(user.role || "").toUpperCase().replace("_", " ")}
          </Pill>
        </div>
      ) : (
        <button
          onClick={onToggle}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.fg3,
            padding: "14px 0",
            display: "flex",
            justifyContent: "center",
          }}
          aria-label="Expandir"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </aside>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ onMobileMenu }: { onMobileMenu: () => void }) {
  const {
    isAdmin,
    isSuperAdmin,
    activeScreen,
    teams,
    students,
    pendingExercises,
    studentLimitReached,
    coachLimitReached,
    superAdminNeedsTeam,
    setShowCreateStudent,
    setStudentDraft,
    setShowCreateCoach,
    setCoachDraft,
    setShowCreateTeam,
    selectedTeamId,
  } = useCockpit()

  const meta = SCREEN_TITLES[activeScreen]
  const pendingTotal = pendingExercises.length

  // CTA contextual baseado na screen
  const cta = (() => {
    if (activeScreen === "empresas" && isSuperAdmin) {
      return (
        <Btn cyan sm onClick={() => setShowCreateTeam(true)}>
          + Empresa
        </Btn>
      )
    }
    if (activeScreen === "coaches" && isAdmin) {
      return (
        <Btn
          cyan
          sm
          disabled={coachLimitReached || superAdminNeedsTeam}
          onClick={() => {
            setCoachDraft({ name: "", email: "", password: "", teamId: selectedTeamId || "" })
            setShowCreateCoach(true)
          }}
        >
          + Coach
        </Btn>
      )
    }
    if (activeScreen === "students" || activeScreen === "hoje") {
      return (
        <Btn
          cyan
          sm
          disabled={studentLimitReached || superAdminNeedsTeam}
          onClick={() => {
            setStudentDraft({
              name: "",
              email: "",
              phone: "",
              password: "",
              active: false,
              coachId: "",
              teamId: selectedTeamId || "",
              sex: "",
              age: "",
            })
            setShowCreateStudent(true)
          }}
        >
          + Aluno
        </Btn>
      )
    }
    return null
  })()

  return (
    <header
      style={{
        height: 64,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "linear-gradient(180deg, rgba(8,14,28,0.96) 0%, rgba(8,14,28,0.84) 100%)",
        borderBottom: `1px solid ${T.border}`,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 20,
        gap: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
        {/* Mobile menu */}
        <button
          onClick={onMobileMenu}
          className="lg:hidden"
          style={{
            background: "none",
            border: "none",
            color: T.fg3,
            padding: 6,
            cursor: "pointer",
            display: "flex",
          }}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 8,
              fontWeight: 900,
              color: T.cyan,
              letterSpacing: "0.34em",
              textTransform: "uppercase",
              marginBottom: 3,
              textShadow: "0 0 8px rgba(82,231,255,0.4)",
            }}
          >
            SALA DE CONTROLE / {activeScreen.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 18,
              fontWeight: 900,
              color: T.fg,
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            {meta.t}
          </div>
        </div>
        <div className="hidden md:block" style={{ height: 36, width: 1, background: T.border }} />
        <div
          className="hidden md:block"
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            color: T.fg3,
            letterSpacing: "0.10em",
            maxWidth: 340,
          }}
        >
          {meta.sub}
        </div>
      </div>

      {/* Telemetry strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div className="hidden xl:flex" style={{ alignItems: "center", gap: 10 }}>
          <TelemetryStamp icon={<Signal className="h-2.5 w-2.5" />} label="SYS" value="ONLINE" tone="ok" />
          {isSuperAdmin && (
            <TelemetryStamp
              icon={<Globe className="h-2.5 w-2.5" />}
              label="EMPRESAS"
              value={String(teams.length)}
            />
          )}
          <TelemetryStamp
            icon={<Users className="h-2.5 w-2.5" />}
            label="ALUNOS"
            value={String(students.length)}
          />
          {isAdmin && (
            <TelemetryStamp
              icon={<Gavel className="h-2.5 w-2.5" />}
              label="PEND."
              value={String(pendingTotal)}
              tone={pendingTotal > 0 ? "warn" : "ok"}
            />
          )}
        </div>
        {cta && (
          <>
            <div style={{ width: 1, height: 24, background: T.border, margin: "0 4px" }} />
            {cta}
          </>
        )}
      </div>
    </header>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export function CockpitLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: `
          radial-gradient(80% 60% at 0% 0%, rgba(82,231,255,0.05) 0%, transparent 60%),
          radial-gradient(60% 50% at 100% 100%, rgba(82,231,255,0.04) 0%, transparent 60%),
          ${T.ink}
        `,
        color: T.fg,
        fontFamily: T.mono,
      }}
    >
      {/* Scanlines overlay */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          background:
            "repeating-linear-gradient(0deg, rgba(82,231,255,0.018) 0px, rgba(82,231,255,0.018) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "screen",
        }}
      />

      {/* Desktop sidebar */}
      <div
        className="hidden lg:flex lg:flex-col lg:flex-shrink-0"
        style={{ position: "relative", zIndex: 2 }}
      >
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div style={{ flexShrink: 0 }}>
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileMenuOpen(false)}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
          <div
            style={{ flex: 1, background: "rgba(0,0,0,0.6)" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <button
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              background: "none",
              border: "none",
              color: T.fg,
              cursor: "pointer",
            }}
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Main */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Header onMobileMenu={() => setMobileMenuOpen(true)} />
        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  )
}
