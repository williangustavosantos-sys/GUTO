"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, HelpCircle, ChevronDown } from "lucide-react"

import type { GutoMemory } from "@/lib/api/guto"
import { buildWorkoutCare } from "@/lib/memory-context"
import type { ValidLanguage } from "../translations"

// "Cuidados do treino" — bloco discreto que mostra que o GUTO lembrou da
// dor/limitação física e ajustou o treino. NÃO é erro, NÃO bloqueia a tela:
// quando não há nada relevante, simplesmente não renderiza.
// Colapsado por padrão (só o título): ocupa uma linha. O usuário clica para
// abrir o detalhe — antes ocupava quase a tela inteira.
export function WorkoutCareNotice({
  memory,
  language,
}: {
  memory: GutoMemory | null | undefined
  language: ValidLanguage
}) {
  const care = buildWorkoutCare(memory, language)
  const [open, setOpen] = useState(false)
  if (!care) return null

  const pending = care.status === "pending"
  const Icon = pending ? HelpCircle : ShieldCheck

  return (
    <motion.div
      role="note"
      aria-label={care.title}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="guto-premium-card mb-3 shrink-0 px-3.5 py-2"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 text-left"
      >
        <div className="guto-slot grid h-7 w-7 shrink-0 place-items-center rounded-full text-(--guto-cyan)">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="guto-readable-label min-w-0 flex-1 truncate text-(--guto-cyan)">{care.title}</p>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-(--guto-cyan) transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="guto-readable-body mt-1.5 overflow-hidden pl-[2.4rem] text-[12px] leading-snug"
          >
            {care.body}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
