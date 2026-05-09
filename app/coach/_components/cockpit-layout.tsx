"use client"

import { useState, type ReactNode } from "react"
import {
  Activity,
  Building2,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Menu,
  Settings,
  Shield,
  Utensils,
  Users,
  X,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCockpit } from "./cockpit-context"
import type { Screen } from "./utils"
import { formatHuman } from "./utils"

// ─── Nav config ───────────────────────────────────────────────────────────────

interface NavItem {
  id: Screen
  label: string
  icon: ReactNode
  adminOnly?: boolean
  superAdminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: "hoje", label: "Hoje", icon: <Zap className="h-4 w-4" /> },
  { id: "students", label: "Alunos", icon: <Users className="h-4 w-4" /> },
  { id: "treinos", label: "Treinos", icon: <Dumbbell className="h-4 w-4" /> },
  { id: "dietas", label: "Dietas", icon: <Utensils className="h-4 w-4" /> },
  { id: "arena", label: "Arena", icon: <Activity className="h-4 w-4" /> },
  { id: "coaches", label: "Coaches", icon: <Shield className="h-4 w-4" />, adminOnly: true },
  { id: "teams", label: "Times", icon: <Building2 className="h-4 w-4" />, superAdminOnly: true },
  { id: "logs", label: "Logs", icon: <Settings className="h-4 w-4" />, adminOnly: true },
]

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user, isAdmin, isSuperAdmin, activeScreen, setActiveScreen, teamSummary } = useCockpit()

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin
    if (item.adminOnly) return isAdmin
    return true
  })

  return (
    <aside
      className={`flex h-full flex-col border-r border-white/8 bg-[#080d1a] transition-all duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Brand */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-5">
        {!collapsed && (
          <span className="text-sm font-black tracking-[0.24em] text-[#00e5ff]">GUTO</span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto rounded-md p-1 text-white/30 hover:bg-white/5 hover:text-white"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {visibleItems.map((item) => {
          const active = activeScreen === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              title={collapsed ? item.label : undefined}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest transition ${
                active
                  ? "border-r-2 border-[#00e5ff] bg-[#00e5ff]/10 text-[#00e5ff]"
                  : "text-white/35 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Team / User info */}
      {!collapsed && (
        <div className="border-t border-white/8 px-4 py-4">
          {teamSummary && (
            <p className="mb-1 truncate text-[10px] font-black text-white/50">
              {teamSummary.team.name}
            </p>
          )}
          <p className="truncate text-[10px] text-white/25">
            {user.name || user.email || user.userId}
          </p>
          <Badge
            variant="outline"
            className="mt-1 border-white/15 text-[9px] font-mono text-white/40"
          >
            {user.role.toUpperCase()}
          </Badge>
        </div>
      )}
    </aside>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

const SCREEN_TITLES: Record<Screen, string> = {
  hoje: "Hoje",
  students: "Alunos",
  treinos: "Fila de Treinos",
  dietas: "Fila de Dietas",
  arena: "Arena",
  coaches: "Coaches",
  teams: "Times",
  logs: "Logs",
}

function Header({ onMobileMenu }: { onMobileMenu: () => void }) {
  const {
    user,
    isAdmin,
    isSuperAdmin,
    activeScreen,
    teamSummary,
    studentLimitReached,
    coachLimitReached,
    superAdminNeedsTeam,
    showCreateStudent,
    setShowCreateStudent,
    setStudentDraft,
    showCreateCoach,
    setShowCreateCoach,
    setCoachDraft,
    setShowCreateTeam,
    selectedTeamId,
    teams,
    setSelectedTeamId,
  } = useCockpit()

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/8 bg-[#0a0f1e]/90 px-5 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenu}
          className="rounded-md p-1 text-white/30 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-sm font-black text-white">{SCREEN_TITLES[activeScreen]}</h1>
          {teamSummary && (
            <p className="font-mono text-[10px] text-white/30">
              {teamSummary.usage.students} alunos · {formatHuman(teamSummary.team.planLabel)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isSuperAdmin && selectedTeam && (
          <div className="hidden items-center gap-1.5 rounded-md border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-3 py-1.5 sm:flex">
            <Building2 className="h-3 w-3 text-[#00e5ff]" />
            <span className="text-[10px] font-black text-[#00e5ff]">{selectedTeam.name}</span>
            <button
              onClick={() => setSelectedTeamId(null)}
              className="ml-1 text-[10px] text-[#00e5ff]/60 hover:text-[#00e5ff]"
            >
              ✕
            </button>
          </div>
        )}

        {isSuperAdmin && !selectedTeam && (
          <span className="hidden text-[10px] font-bold text-white/35 sm:inline">
            Selecione um Time
          </span>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateTeam(true)}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white"
          >
            <Building2 className="h-3.5 w-3.5" />
          </button>
        )}

        {isAdmin && (
          <button
            disabled={coachLimitReached || superAdminNeedsTeam}
            onClick={() => {
              setCoachDraft({ name: "", email: "", password: "", teamId: selectedTeamId || "" })
              setShowCreateCoach(true)
            }}
            className="hidden rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 sm:block"
          >
            + Coach
          </button>
        )}

        <button
          disabled={studentLimitReached || superAdminNeedsTeam}
          onClick={() => {
            setStudentDraft({
              name: "", email: "", phone: "", password: "", active: false,
              coachId: "", teamId: selectedTeamId || "", sex: "", age: "",
            })
            setShowCreateStudent(true)
          }}
          className="rounded-md bg-[#00e5ff] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#0a0f1e] hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          + Aluno
        </button>
      </div>
    </header>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export function CockpitLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0f1e] text-white">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:flex-shrink-0">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-56 flex-shrink-0">
            <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
          </div>
          <div
            className="flex-1 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <button
            className="absolute right-4 top-4 text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
