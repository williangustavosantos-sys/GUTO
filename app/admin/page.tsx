"use client"

import { SalaApp } from "./_components/sala-app"

// Sala de Controle (super-admin). Auth + role gating runs inside <SalaApp>.
export default function AdminPage() {
  return <SalaApp />
}
