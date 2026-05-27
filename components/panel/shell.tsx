"use client"

import type { ReactNode } from "react"
import { T } from "@/lib/panel/tokens"
import { Header } from "./header"
import { Sidebar, type NavGroup } from "./sidebar"

interface PanelShellProps {
  navGroups: NavGroup[]
  pendingTotal: number
  brandSubtitleKey: string
  footerUser: {
    initials: string
    name: ReactNode
    email: ReactNode
    roleBadge?: ReactNode
  }
  children: ReactNode
}

export function PanelShell({
  navGroups,
  pendingTotal,
  brandSubtitleKey,
  footerUser,
  children,
}: PanelShellProps) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: T.bg,
        color: T.fg,
        fontFamily: T.ui,
      }}
    >
      <Sidebar
        navGroups={navGroups}
        pendingTotal={pendingTotal}
        brandSubtitleKey={brandSubtitleKey}
        footerUser={footerUser}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <Header pendingTotal={pendingTotal} />
        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  )
}
