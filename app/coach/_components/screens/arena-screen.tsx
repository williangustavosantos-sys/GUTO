"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { adminErrorMessage } from "../utils"
import { RankingSection } from "../ui"
import { useCockpit } from "../cockpit-context"

export function ArenaScreen() {
  const { rankings, fetchRankings } = useCockpit()

  useEffect(() => {
    void fetchRankings().catch((err) => toast.error(adminErrorMessage(err)))
  }, [fetchRankings])

  return (
    <div className="p-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <RankingSection title="Ranking Semanal" items={rankings?.weekly.items ?? []} />
        <RankingSection title="Ranking Mensal" items={rankings?.monthly.items ?? []} />
        <RankingSection title="Ranking Geral" items={rankings?.individual.items ?? []} showStreak />
      </div>
    </div>
  )
}
