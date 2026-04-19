"use client"

import { motion } from "framer-motion"
import { Check, ChevronRight, Flame, Lock, Zap, MessageCircle } from "lucide-react"
import { GutoOfficialAvatar } from "../guto-official-avatar"
import { getLanguage, translations } from "../translations"

interface PathTabProps {
  userName: string
  language: string
}

interface DayNode {
  day: number
  status: "completed" | "current" | "locked"
  xp?: number
}

const pathData: DayNode[] = [
  { day: 21, status: "completed" },
  { day: 22, status: "completed" },
  { day: 23, status: "current", xp: 150 },
  { day: 24, status: "locked", xp: 3000 },
  { day: 25, status: "locked" },
]

const streakDays = 3

export function PathTab({ userName, language }: PathTabProps) {
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
          {locale.pathTitle}
        </motion.h1>
        <p className="text-muted-foreground/60 mt-1 text-sm">
          {locale.pathSubtitle}
        </p>
        
        {/* Month selector */}
        <motion.button
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong text-sm font-semibold text-foreground/70"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {locale.pathMonth}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Path visualization */}
      <div className="relative flex-1 px-6 py-8">
        {/* Connection lines - SVG path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <path
            d="M 80 50 Q 120 80 160 60 Q 200 40 240 70 Q 280 100 320 80 Q 360 60 400 90"
            fill="none"
            stroke="oklch(0.70 0.18 200 / 0.3)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Day nodes */}
        <div className="relative flex flex-wrap justify-center gap-4 max-w-xs mx-auto">
          {pathData.map((node, index) => (
            <motion.div
              key={node.day}
              className="relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              style={{
                marginTop: index % 2 === 0 ? 0 : 20,
              }}
            >
              {/* Node */}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg relative ${
                  node.status === "completed"
                    ? "bg-green-100 text-green-600 border-2 border-green-300"
                    : node.status === "current"
                    ? "glass-strong text-primary border-2 border-primary/30"
                    : "bg-muted/50 text-muted-foreground/40 border border-muted-foreground/20"
                }`}
                style={{
                  boxShadow: node.status === "current" 
                    ? "0 0 20px oklch(0.70 0.18 200 / 0.3)" 
                    : undefined
                }}
              >
                {node.day}
                
                {/* Status indicator */}
                {node.status === "completed" && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                {node.status === "locked" && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="w-3 h-3 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* XP label */}
              {node.xp && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-muted-foreground/60 whitespace-nowrap">
                  +{node.xp.toLocaleString()} XP
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Guto Avatar in center */}
        <div className="flex justify-center mt-8">
          <div className="relative">
            <GutoOfficialAvatar size="lg" showPlatform={true} className="w-40 h-40" />
            
            {/* Streak badge */}
            <motion.div
              className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 border border-orange-200"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-xs font-bold text-orange-600">{streakDays}</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Daily summary card */}
      <div className="px-4 pb-4">
        <motion.div
          className="glass-strong rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              23
            </div>
            <div>
              <span className="font-semibold text-foreground/80">{locale.pathDayLabel}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-foreground/70">{locale.pathWorkoutDone} </span>
              <span className="font-semibold text-foreground/90">{locale.pathWorkoutName}</span>
              <Check className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <Zap className="w-4 h-4 text-primary" />
              <span>{locale.pathXpYesterday}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{locale.pathStreak}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span>{locale.pathObservation}</span>
              <span className="ml-auto text-primary font-semibold">{locale.pathXpReward}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full xp-bar rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              transition={{ delay: 0.8, duration: 0.8 }}
            />
          </div>

          {/* Quote */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-foreground/70 italic">
              {"\""}{locale.pathQuote}{"\""}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
