"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Empresa, Student } from "@/lib/panel/types"
import { PanelI18nContext, usePanelI18nState } from "@/lib/panel/i18n"

export type PortalKind = "sala" | "empresa" | "coach"

interface PanelContextValue {
  portal: PortalKind
  activeScreen: string
  setActiveScreen: (id: string) => void
  /** Sidebar nav click handler. Default = setActiveScreen. Detail pages
   *  (ex.: /admin/teams/:teamId) injetam um handler que navega de volta
   *  pra /admin?screen=ID em vez de só mudar o state local. */
  navigateToScreen: (id: string) => void
  /** Desktop-only: sidebar in icon-only (64px) mode. */
  collapsed: boolean
  setCollapsed: (next: boolean | ((prev: boolean) => boolean)) => void
  /** Mobile/tablet-only: sidebar overlay drawer is open. */
  mobileOpen: boolean
  setMobileOpen: (next: boolean | ((prev: boolean) => boolean)) => void

  selectedStudent: Student | null
  openStudent: (s: Student) => void
  closeStudent: () => void

  empresa: Empresa | null
  openEmpresa: (e: Empresa) => void
  closeEmpresa: () => void

  showCreate: "empresa" | "coach" | "aluno" | null
  setShowCreate: (k: "empresa" | "coach" | "aluno" | null) => void
}

const PanelContext = createContext<PanelContextValue | null>(null)

export function usePanel(): PanelContextValue {
  const ctx = useContext(PanelContext)
  if (!ctx) throw new Error("usePanel must be used inside <PanelProvider>")
  return ctx
}

interface PanelProviderProps {
  portal: PortalKind
  initialScreen: string
  /** Override pro click da sidebar. Se omitido, vira o `setActiveScreen` padrão. */
  onNavigateToScreen?: (screenId: string) => void
  children: ReactNode
}

export function PanelProvider({
  portal,
  initialScreen,
  onNavigateToScreen,
  children,
}: PanelProviderProps) {
  const [activeScreen, setActiveScreenRaw] = useState(initialScreen)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [showCreate, setShowCreate] = useState<"empresa" | "coach" | "aluno" | null>(null)

  const setActiveScreen = useCallback((id: string) => {
    setActiveScreenRaw(id)
    // Picking a screen on mobile should auto-close the drawer.
    setMobileOpen(false)
  }, [])
  const navigateToScreen = useCallback(
    (id: string) => {
      setMobileOpen(false)
      if (onNavigateToScreen) onNavigateToScreen(id)
      else setActiveScreenRaw(id)
    },
    [onNavigateToScreen],
  )
  const openStudent = useCallback((s: Student) => setSelectedStudent(s), [])
  const closeStudent = useCallback(() => setSelectedStudent(null), [])
  const openEmpresa = useCallback((e: Empresa) => setEmpresa(e), [])
  const closeEmpresa = useCallback(() => setEmpresa(null), [])

  // Esc closes overlays in priority order (create → student → empresa → mobile drawer).
  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key !== "Escape") return
      if (showCreate) setShowCreate(null)
      else if (selectedStudent) closeStudent()
      else if (empresa) closeEmpresa()
      else if (mobileOpen) setMobileOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [showCreate, selectedStudent, empresa, mobileOpen, closeStudent, closeEmpresa])

  const i18n = usePanelI18nState()

  const value = useMemo<PanelContextValue>(
    () => ({
      portal,
      activeScreen,
      setActiveScreen,
      navigateToScreen,
      collapsed,
      setCollapsed,
      mobileOpen,
      setMobileOpen,
      selectedStudent,
      openStudent,
      closeStudent,
      empresa,
      openEmpresa,
      closeEmpresa,
      showCreate,
      setShowCreate,
    }),
    [
      portal,
      activeScreen,
      setActiveScreen,
      navigateToScreen,
      collapsed,
      mobileOpen,
      selectedStudent,
      openStudent,
      closeStudent,
      empresa,
      openEmpresa,
      closeEmpresa,
      showCreate,
    ],
  )

  return (
    <PanelI18nContext.Provider value={i18n}>
      <PanelContext.Provider value={value}>{children}</PanelContext.Provider>
    </PanelI18nContext.Provider>
  )
}
