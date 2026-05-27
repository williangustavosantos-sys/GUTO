"use client"

import { useEffect } from "react"
import { usePanel } from "@/components/panel/panel-context"
import { NovaEmpresaInfoModal } from "./nova-empresa-info-modal"
import { ProximaFaseModal } from "./proxima-fase-modal"

/**
 * Plug que decide qual modal de criação renderizar com base em `showCreate`
 * do PanelContext. Mantém o handler de ESC do PanelProvider funcionando,
 * adiciona lock de scroll do body enquanto modal estiver aberto.
 */
export function CreateModalGate() {
  const { showCreate } = usePanel()
  const isOpen = showCreate !== null

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  if (!isOpen) return null
  if (showCreate === "empresa") return <NovaEmpresaInfoModal />
  if (showCreate === "coach" || showCreate === "aluno") return <ProximaFaseModal />
  return null
}
