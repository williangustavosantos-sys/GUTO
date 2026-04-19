"use client"

import { motion } from "framer-motion"
import { MessageCircle, Route, Sparkles, Target } from "lucide-react"
import { cn } from "@/lib/utils"

export type TabType = "guto" | "caminho" | "evolucoes" | "missao"

interface BottomNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  language: string
}

const tabLabels: Record<string, Record<string, string>> = {
  "pt-BR": {
    guto: "GUTO",
    caminho: "CAMINHO",
    evolucoes: "EVOLUÇÕES",
    missao: "MISSÃO",
  },
  "it-IT": {
    guto: "GUTO",
    caminho: "PERCORSO",
    evolucoes: "EVOLUZIONI",
    missao: "MISSIONE",
  },
  "es-ES": {
    guto: "GUTO",
    caminho: "CAMINO",
    evolucoes: "EVOLUCIONES",
    missao: "MISIÓN",
  },
  "en-US": {
    guto: "GUTO",
    caminho: "PATH",
    evolucoes: "EVOLUTIONS",
    missao: "MISSION",
  },
}

const tabs = [
  { id: "guto" as const, labelKey: "guto", icon: MessageCircle },
  { id: "caminho" as const, labelKey: "caminho", icon: Route },
  { id: "evolucoes" as const, labelKey: "evolucoes", icon: Sparkles },
  { id: "missao" as const, labelKey: "missao", icon: Target },
]

export function BottomNavigation({ activeTab, onTabChange, language }: BottomNavigationProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-50">
      {/* Top border glow */}
      <div 
        className="h-px w-full"
        style={{
          background: "linear-gradient(90deg, transparent 0%, oklch(0.70 0.18 200 / 0.3) 50%, transparent 100%)"
        }}
      />
      
      <nav 
        className="glass-strong px-2 pb-6 pt-2"
        style={{
          borderTop: "1px solid oklch(0.85 0.05 240 / 0.5)"
        }}
      >
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground/60"
                )}
                whileTap={{ scale: 0.95 }}
              >
                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    style={{
                      boxShadow: "0 0 20px oklch(0.70 0.18 200 / 0.2)"
                    }}
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                
                {/* Icon */}
                <motion.div
                  className="relative z-10"
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                >
                  <Icon className="w-6 h-6" />
                  {isActive && (
                    <motion.div
                      className="absolute -inset-1 rounded-full"
                      style={{
                        background: "radial-gradient(circle, oklch(0.70 0.18 200 / 0.3) 0%, transparent 70%)"
                      }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                    />
                  )}
                </motion.div>
                
                {/* Label */}
                <span 
                  className={cn(
                    "relative z-10 text-[10px] font-bold tracking-wider",
                    isActive && "text-primary"
                  )}
                >
                  {tabLabels[language]?.[tab.labelKey] ?? tab.labelKey.toUpperCase()}
                </span>
              </motion.button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
