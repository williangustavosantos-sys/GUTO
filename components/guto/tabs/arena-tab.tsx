"use client"

import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Swords, Flame, TrendingUp, Star, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getArenaWeekly,
  getArenaMonthly,
  getArenaIndividual,
  ArenaRankingItem,
  ArenaRankingResponse,
} from "@/lib/api/guto"
import { TranslationDictionary } from "@/components/guto/translations"

type ArenaSubTab = "week" | "month" | "individual"

interface ArenaTabProps {
  userId: string
  language: string
  translations: TranslationDictionary
}

const ARENA_GROUP = "will-personal-alpha"

const avatarStageColor: Record<string, string> = {
  baby: "text-slate-400",
  teen: "text-cyan-400",
  adult: "text-cyan-300",
  elite: "text-yellow-300",
}

const avatarStageLabel: Record<string, Record<string, string>> = {
  baby: { "pt-BR": "BABY", "en-US": "BABY", "it-IT": "BABY", "es-ES": "BEBÉ" },
  teen: { "pt-BR": "GUTIM", "en-US": "GUTIM", "it-IT": "GUTIM", "es-ES": "GUTIM" },
  adult: { "pt-BR": "ADULTO", "en-US": "ADULT", "it-IT": "ADULTO", "es-ES": "ADULTO" },
  elite: { "pt-BR": "ELITE", "en-US": "ELITE", "it-IT": "ELITE", "es-ES": "ELITE" },
}

const positionIcons = [Trophy, Star, TrendingUp]

function RankingCard({
  item,
  language,
  t,
}: {
  item: ArenaRankingItem
  language: string
  t: TranslationDictionary
}) {
  const PositionIcon = positionIcons[item.position - 1] ?? null
  const stageColor = avatarStageColor[item.avatarStage] ?? "text-cyan-400"
  const stageName = avatarStageLabel[item.avatarStage]?.[language] ?? item.avatarStage.toUpperCase()
  const isOnFire = item.status === "EM CHAMAS" || item.status === "ON FIRE"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (item.position - 1) * 0.06 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-4"
    >
      {item.position <= 3 && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              item.position === 1
                ? "radial-gradient(circle at 20% 50%, rgba(82,231,255,0.12), transparent 60%)"
                : "radial-gradient(circle at 20% 50%, rgba(82,231,255,0.06), transparent 60%)",
          }}
        />
      )}

      <div className="relative flex items-center gap-4">
        <div className="flex w-8 shrink-0 flex-col items-center">
          {PositionIcon ? (
            <PositionIcon
              className={cn(
                "h-6 w-6",
                item.position === 1
                  ? "text-yellow-300"
                  : item.position === 2
                  ? "text-slate-300"
                  : "text-amber-600"
              )}
            />
          ) : (
            <span className="text-sm font-bold text-white/40">#{item.position}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-widest text-white">{item.pairName}</p>
          <p className={cn("mt-0.5 text-xs font-semibold tracking-wide", stageColor)}>{stageName}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-base font-black text-[var(--guto-cyan)]">
            {item.xp.toLocaleString()} <span className="text-xs font-bold">{t.arena.xp}</span>
          </p>
          <p className="mt-0.5 text-xs text-white/40">
            {item.validatedWorkouts} {t.arena.workoutsValidated}
          </p>
        </div>
      </div>

      <div className="relative mt-3 flex items-center gap-2">
        {isOnFire ? (
          <Flame className="h-3.5 w-3.5 text-orange-400" />
        ) : (
          <TrendingUp className="h-3.5 w-3.5 text-[var(--guto-cyan)] opacity-50" />
        )}
        <span className="text-xs font-semibold tracking-widest text-white/40">{item.status}</span>
        {item.currentStreak !== undefined && item.currentStreak > 0 && (
          <span className="ml-auto text-xs text-white/25">🔥 {item.currentStreak}d</span>
        )}
      </div>

      {item.xpToNextEvolution !== null && item.xpToNextEvolution !== undefined && (
        <div className="relative mt-3">
          <div className="mb-1 flex justify-between text-xs text-white/25">
            <span>{t.arena.nextEvolution}</span>
            <span>
              {item.xpToNextEvolution.toLocaleString()} {t.arena.xpMissing}
            </span>
          </div>
          <div className="h-1 rounded-full bg-white/10">
            <div
              className="h-1 rounded-full bg-[var(--guto-cyan)] transition-all"
              style={{
                width: item.nextEvolutionXp
                  ? `${Math.min(100, (item.xp / item.nextEvolutionXp) * 100)}%`
                  : "100%",
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Swords className="h-12 w-12 text-[var(--guto-cyan)] opacity-10" />
      <p className="max-w-[200px] text-sm leading-relaxed text-white/30">{message}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
      ))}
    </div>
  )
}

export function ArenaTab({ userId: _userId, language, translations: t }: ArenaTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<ArenaSubTab>("week")
  const [data, setData] = useState<ArenaRankingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRanking = useCallback(async (sub: ArenaSubTab) => {
    setLoading(true)
    setError(null)
    try {
      let result: ArenaRankingResponse
      if (sub === "week") result = await getArenaWeekly(ARENA_GROUP)
      else if (sub === "month") result = await getArenaMonthly(ARENA_GROUP)
      else result = await getArenaIndividual(ARENA_GROUP)
      setData(result)
    } catch {
      setError(t.arena.emptyState)
    } finally {
      setLoading(false)
    }
  }, [t.arena.emptyState])

  useEffect(() => {
    fetchRanking(activeSubTab)
  }, [activeSubTab, fetchRanking])

  const subTabs: { id: ArenaSubTab; label: string }[] = [
    { id: "week", label: t.arena.week },
    { id: "month", label: t.arena.month },
    { id: "individual", label: t.arena.individual },
  ]

  const headline =
    activeSubTab === "week"
      ? t.arena.weeklyHeadline
      : activeSubTab === "month"
      ? t.arena.monthlyHeadline
      : t.arena.individualHeadline

  const resetLabel =
    activeSubTab === "week"
      ? t.arena.restartsMonday
      : activeSubTab === "month"
      ? t.arena.restartsNextMonth
      : null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 px-5 pb-4 pt-6">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-[var(--guto-cyan)]" />
          <h1 className="text-lg font-black tracking-[0.2em] text-white">{t.arena.tab}</h1>
        </div>
        <p className="mt-1 text-xs text-white/40">{t.arena.subtitle}</p>
      </div>

      <div className="shrink-0 px-5 pb-3">
        <div className="flex gap-1 rounded-xl bg-white/5 p-1">
          {subTabs.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setActiveSubTab(sub.id)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-bold tracking-widest transition-colors",
                activeSubTab === sub.id
                  ? "bg-[var(--guto-cyan)] text-[var(--guto-navy)]"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-5 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/30">{headline}</p>
        {resetLabel && <p className="mt-0.5 text-xs text-white/20">{resetLabel}</p>}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingState />
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState message={error} />
            </motion.div>
          ) : !data || data.items.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState message={t.arena.emptyState} />
            </motion.div>
          ) : (
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {data.items.map((item) => (
                <RankingCard key={item.userId} item={item} language={language} t={t} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
