"use client"

import { motion } from "framer-motion"
import { Dumbbell, MapPin, MessageCircle, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"

export type TabType = "guto" | "caminho" | "evolucoes" | "missao"

interface BottomNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  language: string
}

const tabLabels: Record<"pt-BR" | "it-IT" | "es-ES" | "en-US", Record<TabType, string>> = {
  "pt-BR": { guto: "GUTO", caminho: "CAM.", evolucoes: "EVO.", missao: "TREINO" },
  "it-IT": { guto: "GUTO", caminho: "PERC.", evolucoes: "EVO.", missao: "TRAIN" },
  "es-ES": { guto: "GUTO", caminho: "CAM.", evolucoes: "EVO.", missao: "ENTR." },
  "en-US": { guto: "GUTO", caminho: "PATH", evolucoes: "EVOLVE", missao: "WORKOUT" },
}

const tabs = [
  { id: "guto" as const, labelKey: "guto" as const, icon: MessageCircle },
  { id: "missao" as const, labelKey: "missao" as const, icon: Dumbbell },
  { id: "evolucoes" as const, labelKey: "evolucoes" as const, icon: TrendingUp },
  { id: "caminho" as const, labelKey: "caminho" as const, icon: MapPin },
]

function getSafeLanguage(language: string): keyof typeof tabLabels {
  return language in tabLabels ? (language as keyof typeof tabLabels) : "pt-BR"
}

export function BottomNavigation({ activeTab, onTabChange, language }: BottomNavigationProps) {
  const safeLanguage = getSafeLanguage(language)

  return (
    <div className="px-0 pb-[calc(env(safe-area-inset-bottom)+42px)] pt-3">
      <nav
        aria-label="Navegação principal"
        className="mx-auto grid w-[91.54%] max-w-[368px] grid-cols-4 gap-[13px]"
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
                "guto-action-tile relative grid h-[73px] min-w-0 place-items-center overflow-hidden rounded-[18px] text-[rgba(13,35,65,0.56)]",
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
                  "relative z-10 h-8 w-8 stroke-[2.4]",
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
