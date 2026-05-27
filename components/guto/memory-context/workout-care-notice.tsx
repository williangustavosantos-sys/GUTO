"use client"

import { motion } from "framer-motion"
import { ShieldCheck, HelpCircle } from "lucide-react"

import type { GutoMemory } from "@/lib/api/guto"
import { buildWorkoutCare } from "@/lib/memory-context"
import type { ValidLanguage } from "../translations"

// "Cuidados do treino" — bloco discreto que mostra que o GUTO lembrou da
// dor/limitação física e ajustou o treino. NÃO é erro, NÃO bloqueia a tela:
// quando não há nada relevante, simplesmente não renderiza.
export function WorkoutCareNotice({
  memory,
  language,
}: {
  memory: GutoMemory | null | undefined
  language: ValidLanguage
}) {
  const care = buildWorkoutCare(memory, language)
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
      className="guto-premium-card mb-3 flex shrink-0 items-start gap-2.5 px-3.5 py-2.5"
    >
      <div className="guto-slot grid h-7 w-7 shrink-0 place-items-center rounded-full text-(--guto-cyan)">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="guto-readable-label text-(--guto-cyan)">{care.title}</p>
        <p className="guto-readable-body mt-0.5 text-[12px] leading-snug">{care.body}</p>
      </div>
    </motion.div>
  )
}
