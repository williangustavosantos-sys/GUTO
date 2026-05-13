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
  refreshKey?: number
  currentUserName?: string
}

// ARENA_GROUP removido: as funções getArenaWeekly/Monthly/Individual
// já não enviam arenaGroupId — o backend resolve via userId autenticado.

const avatarStageColor: Record<string, string> = {
  baby: "text-[rgba(13,35,65,0.38)]",
  teen: "text-[var(--guto-cyan)]",
  adult: "text-[var(--guto-cyan)]",
  elite: "text-yellow-500",
}

const avatarStageLabel: Record<string, Record<string, string>> = {
  baby: { "pt-BR": "BABY", "en-US": "BABY", "it-IT": "BABY" },
  teen: { "pt-BR": "GUTIM", "en-US": "GUTIM", "it-IT": "GUTIM" },
  adult: { "pt-BR": "ADULTO", "en-US": "ADULT", "it-IT": "ADULTO" },
  elite: { "pt-BR": "Elite", "en-US": "Elite", "it-IT": "Elite" },
}

const positionIcons = [Trophy, Star, TrendingUp]

function RankingCard({
  item,
  language,
  t,
  currentUserName,
  currentUserId,
}: {
  item: ArenaRankingItem
  language: string
  t: TranslationDictionary
  currentUserName?: string
  currentUserId: string
}) {
  const PositionIcon = positionIcons[item.position - 1] ?? null
  const stageColor = avatarStageColor[item.avatarStage] ?? "text-[var(--guto-cyan)]"
  const stageName = avatarStageLabel[item.avatarStage]?.[language] ?? item.avatarStage.toUpperCase()
  const isOnFire = item.status === "EM CHAMAS" || item.status === "ON FIRE"
  const rawName = item.pairName.toUpperCase().startsWith("GUTO & ")
    ? item.pairName.slice(7).trim()
    : item.pairName
  const isGenericName = /^operador\s*#?\d*$/i.test(rawName || "") || /^operator\s*#?\d*$/i.test(rawName || "")
  const displayName = item.userId === currentUserId && currentUserName && isGenericName
    ? currentUserName
    : rawName || "USUÁRIO"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (item.position - 1) * 0.06 }}
      className="guto-deboss relative overflow-hidden rounded-[1.6rem] px-5 py-4"
    >
      {/* top-3 glow accent */}
      {item.position <= 3 && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[1.6rem]"
          style={{
            background:
              item.position === 1
                ? "radial-gradient(circle at 10% 50%, rgba(82,231,255,0.14), transparent 55%)"
                : "radial-gradient(circle at 10% 50%, rgba(82,231,255,0.07), transparent 55%)",
          }}
        />
      )}

      <div className="relative flex items-center gap-4">
        {/* Position icon */}
        <div className="flex w-8 shrink-0 flex-col items-center">
          {PositionIcon ? (
            <PositionIcon
              className={cn(
                "h-6 w-6",
                item.position === 1
                  ? "text-yellow-500"
                  : item.position === 2
                  ? "text-[rgba(13,35,65,0.4)]"
                  : "text-amber-600"
              )}
            />
          ) : (
            <span className="text-sm font-black text-[rgba(13,35,65,0.32)]">#{item.position}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            {/* Name */}
            <div className="min-w-0 flex-1 flex flex-col">
              <p className="truncate text-[15px] font-black tracking-widest text-[var(--guto-navy)]">
                {displayName}
              </p>
              <p className="text-[8px] font-black uppercase tracking-widest text-[rgba(13,35,65,0.42)]">
                DUPLA COM GUTO
              </p>
            </div>
            {/* XP */}
            <div className="shrink-0 text-right">
              <p className="text-[15px] font-black leading-none text-[var(--guto-cyan)]">
                {item.xp.toLocaleString()}{" "}
                <span className="text-[10px] font-black tracking-widest">{t.arena.xp}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-2">
            {/* Stage */}
            <p className={cn("text-[10px] font-black tracking-widest", stageColor)}>
              {stageName}
            </p>
            {/* Workouts */}
            <p className="text-[10px] text-[rgba(13,35,65,0.42)] font-black uppercase tracking-widest">
              {item.validatedWorkouts} {t.arena.workoutsValidated}
            </p>
          </div>
        </div>
      </div>

      {/* Status row */}
      <div className="relative mt-3 flex items-center gap-1.5">
        {isOnFire ? (
          <Flame className="h-3 w-3 text-orange-500" />
        ) : (
          <TrendingUp className="h-3 w-3 text-[rgba(82,231,255,0.6)]" />
        )}
        <span className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[rgba(13,35,65,0.42)]">
          {item.status}
        </span>
        {item.currentStreak !== undefined && item.currentStreak > 0 && (
          <span className="ml-auto font-mono text-[9px] text-[rgba(13,35,65,0.32)]">
            🔥 {item.currentStreak}d
          </span>
        )}
      </div>

      {/* XP to next evolution (individual tab) */}
      {item.xpToNextEvolution !== null && item.xpToNextEvolution !== undefined && (
        <div className="relative mt-3">
          <div className="mb-1.5 flex justify-between font-mono text-[8px] uppercase tracking-[0.12em] text-[rgba(13,35,65,0.38)]">
            <span>{t.arena.nextEvolution}</span>
            <span>
              {item.xpToNextEvolution.toLocaleString()} {t.arena.xpMissing}
            </span>
          </div>
          <div className="h-1 rounded-full bg-[rgba(13,35,65,0.08)]">
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
      <Swords className="h-10 w-10 text-[rgba(82,231,255,0.35)]" />
      <p className="max-w-[200px] text-[12px] leading-relaxed text-[rgba(13,35,65,0.42)]">{message}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-[1.6rem] bg-[rgba(13,35,65,0.05)]"
        />
      ))}
    </div>
  )
}

export function ArenaTab({ userId, language, translations: t, refreshKey, currentUserName }: ArenaTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<ArenaSubTab>("week")
  const [data, setData] = useState<ArenaRankingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRanking = useCallback(
    async (sub: ArenaSubTab) => {
      setLoading(true)
      setError(null)
      try {
        let result: ArenaRankingResponse
        if (sub === "week") result = await getArenaWeekly()
        else if (sub === "month") result = await getArenaMonthly()
        else result = await getArenaIndividual()
        setData(result)
      } catch {
        setError(t.arena.emptyState)
      } finally {
        setLoading(false)
      }
    },
    [t.arena.emptyState]
  )

  useEffect(() => {
    fetchRanking(activeSubTab)
  }, [activeSubTab, fetchRanking, refreshKey])

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
      {/* Header */}
      <div className="px-1 pb-4 pt-2 text-center shrink-0">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[var(--guto-cyan)] mb-1">
          {t.arena.subtitle}
        </p>
        <h1 className="mx-auto max-w-[18rem] text-balance text-[1.25rem] font-black uppercase leading-tight tracking-[0.08em] text-[var(--guto-navy)]">
          {t.arena.tab}
        </h1>
      </div>

      {/* Sub-tab strip */}
      <div className="shrink-0 px-5 pb-3">
        <div className="flex gap-1 rounded-[1rem] bg-[rgba(13,35,65,0.06)] p-1">
          {subTabs.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setActiveSubTab(sub.id)}
              className={cn(
                "flex-1 rounded-[0.7rem] py-2 font-mono text-[10px] font-black tracking-widest transition-all",
                activeSubTab === sub.id
                  ? "bg-[var(--guto-cyan)] text-[var(--guto-navy)] shadow-sm"
                  : "text-[rgba(13,35,65,0.42)] hover:text-[rgba(13,35,65,0.65)]"
              )}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      {/* Headline */}
      <div className="shrink-0 px-5 pb-3">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[rgba(13,35,65,0.38)]">
          {headline}
        </p>
        {resetLabel && (
          <p className="mt-0.5 font-mono text-[9px] text-[rgba(13,35,65,0.28)]">{resetLabel}</p>
        )}
      </div>

      {/* Ranking list */}
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
                <RankingCard
                  key={item.userId}
                  item={item}
                  language={language}
                  t={t}
                  currentUserId={userId}
                  currentUserName={currentUserName}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
