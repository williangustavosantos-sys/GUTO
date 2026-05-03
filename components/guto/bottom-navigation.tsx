"use client"

import { motion } from "framer-motion"
import { Dumbbell, MapPin, MessageCircle, Swords, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"

export type TabType = "guto" | "caminho" | "evolucoes" | "missao" | "arena"

interface BottomNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  language: string
}

const tabLabels: Record<"pt-BR" | "it-IT" | "es-ES" | "en-US", Record<TabType, string>> = {
  "pt-BR": { guto: "GUTO", caminho: "PERC.", evolucoes: "EVO.", missao: "TREINO", arena: "ARENA" },
  "it-IT": { guto: "GUTO", caminho: "PERC.", evolucoes: "EVO.", missao: "TRAIN", arena: "ARENA" },
  "es-ES": { guto: "GUTO", caminho: "REC.", evolucoes: "EVO.", missao: "ENTR.", arena: "ARENA" },
  "en-US": { guto: "GUTO", caminho: "JOURNEY", evolucoes: "EVOLVE", missao: "WORKOUT", arena: "ARENA" },
}

const tabs = [
  { id: "guto" as const, labelKey: "guto" as const, icon: MessageCircle },
  { id: "missao" as const, labelKey: "missao" as const, icon: Dumbbell },
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
        aria-label="Navegação principal"
        className="mx-auto grid w-[91.54%] max-w-[368px] grid-cols-5 gap-[clamp(4px,2vw,8px)]"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={tabLabels[safeLanguage][tab.labelKey]}
              className={cn(
                "guto-action-tile relative grid h-[var(--guto-nav-tile-size)] min-w-0 place-items-center overflow-hidden rounded-[18px] text-[rgba(13,35,65,0.56)]",
                isActive && "text-[var(--guto-navy)]"
              )}
              whileTap={{ scale: 0.96 }}
            >
              {isActive && (
                <motion.div
                  layoutId="guto-active-tab"
                  className="absolute inset-0 rounded-[18px] bg-[radial-gradient(circle,rgba(82,231,255,0.2)_0%,rgba(255,255,255,0)_62%)]"
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                />
              )}

              <Icon
                className={cn(
                  "relative z-10 h-7 w-7 stroke-[2.4]",
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
