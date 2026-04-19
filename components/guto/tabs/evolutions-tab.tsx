"use client"

import { motion } from "framer-motion"
import { Lock } from "lucide-react"
import { GutoOfficialAvatar } from "../guto-official-avatar"
import { cn } from "@/lib/utils"
import { getLanguage, translations } from "../translations"

interface EvolutionsTabProps {
  userName: string
  language: string
}

type EvolutionStage = "baby" | "teen" | "adult" | "elite"

interface Evolution {
  stage: EvolutionStage
  label: string
  level: number
  unlocked: boolean
  requiredXp: number
}

const evolutions: Evolution[] = [
  { stage: "baby", label: "BABY", level: 1, unlocked: true, requiredXp: 0 },
  { stage: "teen", label: "TEEN", level: 2, unlocked: false, requiredXp: 3000 },
  { stage: "adult", label: "ADULT", level: 3, unlocked: false, requiredXp: 10000 },
  { stage: "elite", label: "ELITE", level: 4, unlocked: false, requiredXp: 25000 },
]

const currentXp = 1250
const targetXp = 3000
const progress = (currentXp / targetXp) * 100

export function EvolutionsTab({ userName, language }: EvolutionsTabProps) {
  const validLang = getLanguage(language)
  const locale = translations[validLang]

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar pb-24">
      {/* Header */}
      <div className="text-center pt-6 pb-4 px-4">
        <motion.h1 
          className="text-3xl font-black tracking-tight text-foreground/90"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {locale.evoTitle}
        </motion.h1>
        <p className="text-muted-foreground/60 mt-1 text-sm">
          {locale.evoSubtitle}
        </p>
      </div>

      {/* Evolution stages */}
      <div className="flex-1 px-4">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4">
          {evolutions.map((evo, index) => (
            <motion.div
              key={evo.stage}
              className={cn(
                "flex-none w-40 rounded-2xl p-4 flex flex-col items-center relative",
                evo.unlocked 
                  ? "glass-strong border-2 border-primary/30" 
                  : "bg-muted/30 border border-muted-foreground/10"
              )}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{
                boxShadow: evo.unlocked 
                  ? "0 8px 30px oklch(0.70 0.18 200 / 0.15)" 
                  : undefined
              }}
            >
              {/* Stage label */}
              <span 
                className={cn(
                  "text-sm font-bold tracking-wider mb-3",
                  evo.unlocked ? "text-primary" : "text-muted-foreground/40"
                )}
              >
                {locale.evoStages[evo.stage]}
              </span>

              {/* Avatar or silhouette */}
              <div className={cn("relative", !evo.unlocked && "opacity-40")}>
                {evo.unlocked ? (
                  <GutoOfficialAvatar 
                    size="md" 
                    showPlatform={true} 
                    className="w-28 h-28"
                  />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center">
                    {/* Silhouette placeholder */}
                    <div 
                      className="w-20 h-20 rounded-full"
                      style={{
                        background: "linear-gradient(180deg, rgba(148,163,184,0.8) 0%, rgba(30,41,59,0.8) 100%)",
                        clipPath: index === 1 
                          ? "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)"
                          : index === 2
                          ? "polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)"
                          : "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)"
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Level badge or lock */}
              <div className="mt-3">
                {evo.unlocked ? (
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-xs font-bold text-primary uppercase">
                    {locale.level} {evo.level}
                  </span>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Status label */}
              <span 
                className={cn(
                  "mt-2 text-xs font-semibold tracking-wide",
                  evo.unlocked ? "text-green-600" : "text-muted-foreground/40"
                )}
              >
                {evo.unlocked ? locale.unlocked : locale.locked}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* XP Progress card */}
      <div className="px-4 pb-4">
        <motion.div
          className="glass-strong rounded-2xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex gap-4 items-center">
            {/* Circular progress */}
            <div className="relative w-24 h-24 flex-none">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="oklch(0.90 0.02 240)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="oklch(0.70 0.18 200)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={264}
                  initial={{ strokeDashoffset: 264 }}
                  animate={{ strokeDashoffset: 264 * (1 - progress / 100) }}
                  transition={{ delay: 0.6, duration: 1 }}
                  style={{
                    filter: "drop-shadow(0 0 6px oklch(0.70 0.18 200 / 0.5))"
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  {locale.totalXp}
                </span>
                <span className="text-2xl font-black text-primary">
                  {currentXp.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground/50">
                  / {targetXp.toLocaleString()} XP
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm text-foreground/70">
                  {locale.evoAuto1}
                </p>
                <p className="text-sm font-bold text-foreground/90">
                  {locale.evoAuto2}
                </p>
              </div>

              {/* Linear progress */}
              <div className="space-y-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full xp-bar rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground/60">
                    {locale.nextEvolution}: <span className="text-primary font-semibold">{locale.evoStages.teen}</span>
                  </span>
                  <span className="text-primary font-bold">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Motivational quote */}
        <motion.div
          className="mt-4 text-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-sm text-foreground/60 italic">
            {"\""}{locale.evoQuote}{"\""}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
