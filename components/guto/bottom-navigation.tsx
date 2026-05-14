"use client"

import { motion } from "framer-motion"
import { Dumbbell, MapPin, MessageCircle, Swords, TrendingUp, UtensilsCrossed } from "lucide-react"

import { cn } from "@/lib/utils"
import { gutoAudio } from "@/lib/audio-haptics"

export type TabType = "guto" | "caminho" | "evolucoes" | "missao" | "arena" | "dieta"

interface BottomNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  language: string
}

const tabLabels: Record<"pt-BR" | "it-IT" | "en-US", Record<TabType, string>> = {
  "pt-BR": { guto: "GUTO", caminho: "PERCURSO", evolucoes: "EVOLUIR", missao: "MISSÃO", arena: "ARENA", dieta: "DIETA" },
  "it-IT": { guto: "GUTO", caminho: "PERCORSO", evolucoes: "EVOLUZIONE", missao: "MISSIONE", arena: "ARENA", dieta: "DIETA" },
  "en-US": { guto: "GUTO", caminho: "JOURNEY", evolucoes: "EVOLVE", missao: "MISSION", arena: "ARENA", dieta: "DIET" },
}

const tabs = [
  { id: "guto" as const, labelKey: "guto" as const, icon: MessageCircle },
  { id: "missao" as const, labelKey: "missao" as const, icon: Dumbbell },
  { id: "dieta" as const, labelKey: "dieta" as const, icon: UtensilsCrossed },
  { id: "arena" as const, labelKey: "arena" as const, icon: Swords },
  { id: "evolucoes" as const, labelKey: "evolucoes" as const, icon: TrendingUp },
  { id: "caminho" as const, labelKey: "caminho" as const, icon: MapPin },
]

function getSafeLanguage(language: string): keyof typeof tabLabels {
  return language in tabLabels ? (language as keyof typeof tabLabels) : "pt-BR"
}

export function BottomNavigation({ activeTab, onTabChange, language }: BottomNavigationProps) {
  const safeLanguage = getSafeLanguage(language)

  return (
    <div className="guto-bottom-navigation px-0 pt-3">
      <nav
        aria-label={safeLanguage === "it-IT" ? "Navigazione principale" : safeLanguage === "en-US" ? "Main navigation" : "Navegação principal"}
        className="mx-auto grid w-[91.54%] max-w-[400px] grid-cols-6 gap-[clamp(2px,1.5vw,6px)]"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => {
                if (isActive) return
                gutoAudio.playGutoFeedback('select')
                onTabChange(tab.id)
              }}
              aria-current={isActive ? "page" : undefined}
              aria-label={tabLabels[safeLanguage][tab.labelKey]}
              className={cn(
                "guto-action-tile relative grid h-[var(--guto-nav-tile-size)] min-w-0 place-items-center overflow-hidden rounded-[16px] text-[rgba(13,35,65,0.56)]",
                isActive && "text-[var(--guto-navy)]"
              )}
              whileTap={{ scale: 0.96 }}
            >
              {isActive && (
                <motion.div
                  layoutId="guto-active-tab"
                  className="absolute inset-0 rounded-[16px] bg-[radial-gradient(circle,rgba(82,231,255,0.2)_0%,rgba(255,255,255,0)_62%)]"
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                />
              )}

              <Icon
                className={cn(
                  "relative z-10 h-[22px] w-[22px] stroke-[2.4]",
                  isActive ? "text-[var(--guto-cyan)]" : "text-[rgba(82,231,255,0.86)]"
                )}
              />
            </motion.button>
          )
        })}
      </nav>
    </div>
  )
}
