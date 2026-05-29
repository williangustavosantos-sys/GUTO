import type { ProactiveMemory, SupportedLanguage } from "@/lib/api/guto"

export type ProactiveMemoryUiCopy = {
  pendingConfirm: (label: string) => string
  pendingValidate: (label: string) => string
  hintConfirm: string
  hintValidate: string
  btnYes: string
  btnNo: string
  btnFix: string
}

const copyByLang: Record<SupportedLanguage, ProactiveMemoryUiCopy> = {
  "pt-BR": {
    pendingConfirm: (label) => `Confirmar: ${label}`,
    pendingValidate: (label) => `Validar: ${label}`,
    hintConfirm: "Confirma aqui ou corrige no chat antes do GUTO seguir.",
    hintValidate: "O GUTO quer saber o que aconteceu com este compromisso da semana passada.",
    btnYes: "Sim",
    btnNo: "Não",
    btnFix: "Corrigir",
  },
  "en-US": {
    pendingConfirm: (label) => `Confirm: ${label}`,
    pendingValidate: (label) => `Validate: ${label}`,
    hintConfirm: "Confirm here or correct in chat before GUTO moves on.",
    hintValidate: "GUTO needs to know what happened with this commitment from last week.",
    btnYes: "Yes",
    btnNo: "No",
    btnFix: "Fix",
  },
  "it-IT": {
    pendingConfirm: (label) => `Conferma: ${label}`,
    pendingValidate: (label) => `Valida: ${label}`,
    hintConfirm: "Conferma qui o correggi in chat prima che GUTO vada avanti.",
    hintValidate: "GUTO vuole sapere cosa è successo con questo impegno della settimana scorsa.",
    btnYes: "Sì",
    btnNo: "No",
    btnFix: "Correggi",
  },
}

export function getProactiveMemoryUiCopy(language: string): ProactiveMemoryUiCopy {
  if (language === "en-US" || language === "it-IT") return copyByLang[language]
  return copyByLang["pt-BR"]
}

export function formatProactiveMemoryLabel(memory: ProactiveMemory): string {
  const base = memory.understood?.trim() || memory.rawText?.trim() || memory.type
  if (memory.dateText?.trim()) return `${base} (${memory.dateText.trim()})`
  return base
}

export function getActionableProactiveMemories(memories: ProactiveMemory[]) {
  const pendingConfirmation = memories.filter((item) => item.status === "pending_confirmation")
  const pendingValidation = memories.filter((item) => item.status === "pending_validation")
  const awaitingDiscard = memories.filter(
    (item) =>
      item.discardRequestedAt &&
      ["confirmed", "enriched", "surfaced"].includes(item.status)
  )
  return { pendingConfirmation, pendingValidation, awaitingDiscard }
}

export function hasActionableProactiveMemories(memories: ProactiveMemory[]): boolean {
  const { pendingConfirmation, pendingValidation, awaitingDiscard } =
    getActionableProactiveMemories(memories)
  return (
    pendingConfirmation.length > 0 ||
    pendingValidation.length > 0 ||
    awaitingDiscard.length > 0
  )
}
