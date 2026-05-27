"use client"

import { motion } from "framer-motion"
import { BadgeCheck } from "lucide-react"

import type { GutoMemory } from "@/lib/api/guto"
import { buildDietProfile } from "@/lib/memory-context"
import type { ValidLanguage } from "../translations"

// "Perfil usado na dieta" — bloco discreto que mostra o contexto alimentar que o
// GUTO usou (objetivo, país/base local, preferência e restrições do NÃO COMO).
// Patologia/dor NUNCA aparece aqui como restrição/erro nutricional; no máximo
// uma nota física NEUTRA e separada (vinda do contexto, não da validação).
export function DietProfileNotice({
  memory,
  language,
}: {
  memory: GutoMemory | null | undefined
  language: ValidLanguage
}) {
  const profile = buildDietProfile(memory, language)
  if (!profile) return null

  const chips: string[] = []
  if (profile.preferenceLabel) chips.push(profile.preferenceLabel)
  if (profile.countryLabel) chips.push(profile.countryLabel)
  if (profile.goalLabel) chips.push(profile.goalLabel)
  for (const r of profile.restrictionLabels) chips.push(r)

  return (
    <motion.div
      role="note"
      aria-label={profile.title}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="guto-premium-card mb-3 shrink-0 px-3.5 py-2.5"
    >
      <div className="flex items-center gap-1.5">
        <BadgeCheck className="h-3.5 w-3.5 text-(--guto-cyan)" />
        <p className="guto-readable-label text-(--guto-cyan)">{profile.title}</p>
      </div>

      {chips.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span key={chip} className="guto-status-pill text-(--guto-navy)">
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Nota física NEUTRA e separada — nunca erro/validação nutricional. */}
      {profile.physicalCareNote && (
        <p className="guto-readable-label mt-2 text-[8px] text-[rgba(13,35,65,0.42)]">
          {profile.physicalCareNote}
        </p>
      )}
    </motion.div>
  )
}
