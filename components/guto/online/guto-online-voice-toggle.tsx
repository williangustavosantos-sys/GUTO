"use client"

import { Volume2, VolumeX } from "lucide-react"

import type { GutoVoiceMode } from "@/lib/guto-online/guto-online-types"

interface GutoOnlineVoiceToggleProps {
  mode: GutoVoiceMode
  onToggle: () => void
  disabled?: boolean
  language?: string
}

const COPY: Record<string, { on: string; off: string }> = {
  "pt-BR": { on: "GUTO fala", off: "GUTO em texto" },
  "en-US": { on: "GUTO speaks", off: "Text only" },
  "it-IT": { on: "GUTO parla", off: "Solo testo" },
}

function pickCopy(language?: string) {
  if (!language) return COPY["pt-BR"]
  if (language in COPY) return COPY[language]
  const prefix = language.split("-")[0]
  const found = Object.keys(COPY).find((key) => key.startsWith(prefix))
  return found ? COPY[found] : COPY["pt-BR"]
}

/**
 * Botão único e simples. Liga/desliga voz no meio do treino sem reiniciar
 * nada. Quando ligado, o GUTO fala e escreve. Quando desligado, ele só
 * escreve, notifica e vibra.
 */
export function GutoOnlineVoiceToggle({ mode, onToggle, disabled, language }: GutoOnlineVoiceToggleProps) {
  const copy = pickCopy(language)
  const isEnabled = mode === "enabled"

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={isEnabled}
      aria-label={isEnabled ? copy.on : copy.off}
      className={[
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 transition-colors",
        "font-mono text-[9px] font-black uppercase tracking-[0.14em]",
        isEnabled
          ? "border-[rgba(82,231,255,0.55)] bg-[rgba(82,231,255,0.16)] text-(--guto-navy)"
          : "border-white/70 bg-white/55 text-[rgba(13,35,65,0.65)]",
        disabled ? "opacity-50" : "active:scale-[0.98]",
      ].join(" ")}
    >
      {isEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
      <span className="whitespace-nowrap">{isEnabled ? copy.on : copy.off}</span>
    </button>
  )
}
