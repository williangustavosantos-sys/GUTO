"use client"

import { Check, Circle } from "lucide-react"

import type { GutoChecklistItem } from "@/lib/guto-online/guto-online-types"

interface GutoOnlineChecklistProps {
  items: GutoChecklistItem[]
  language?: string
  /**
   * Quando true, mostra a lista expandida. Quando false, mostra um resumo
   * compacto (X de Y feitos).
   */
  expanded?: boolean
}

const COPY: Record<string, { progress: (done: number, total: number) => string }> = {
  "pt-BR": { progress: (d, t) => `${d} de ${t} feitos` },
  "en-US": { progress: (d, t) => `${d} of ${t} done` },
  "it-IT": { progress: (d, t) => `${d} di ${t} fatti` },
}

function pickCopy(language?: string) {
  if (!language) return COPY["pt-BR"]
  if (language in COPY) return COPY[language]
  const prefix = language.split("-")[0]
  const found = Object.keys(COPY).find((key) => key.startsWith(prefix))
  return found ? COPY[found] : COPY["pt-BR"]
}

export function GutoOnlineChecklist({ items, language, expanded = true }: GutoOnlineChecklistProps) {
  const copy = pickCopy(language)
  // Validação só conta no fim — manter no rodapé.
  const trainingItems = items.filter((item) => item.kind !== "validation")
  const doneCount = trainingItems.filter((item) => item.done).length
  const total = trainingItems.length

  if (!expanded) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/45 px-3 py-2">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[rgba(13,35,65,0.6)]">
          Checklist
        </p>
        <p className="font-mono text-[10px] font-black text-(--guto-cyan)">
          {copy.progress(doneCount, total)}
        </p>
      </div>
    )
  }

  return (
    <section className="rounded-[1.1rem] border border-white/75 bg-white/50 p-3">
      <header className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[rgba(13,35,65,0.55)]">
          Checklist
        </p>
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-(--guto-cyan)">
          {copy.progress(doneCount, total)}
        </p>
      </header>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li
            key={item.id}
            className={[
              "flex items-center gap-2 rounded-[0.75rem] px-2 py-1.5 transition-colors",
              item.done
                ? "bg-[rgba(82,231,255,0.1)] text-[rgba(13,35,65,0.7)] line-through"
                : "text-[rgba(13,35,65,0.86)]",
            ].join(" ")}
          >
            {item.done ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-(--guto-cyan)" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 text-[rgba(13,35,65,0.35)]" />
            )}
            <span className="text-[12px] font-semibold leading-tight">{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
