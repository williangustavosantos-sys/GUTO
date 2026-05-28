"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useCockpit } from "../cockpit-context"
import { T } from "../control-tokens"
import { Plate, Kicker } from "../controls"
import { adminErrorMessage, avatarStageLabel, type RankingItem } from "../utils"
import { usePanelI18n } from "@/lib/panel-i18n"

export function ArenaScreen() {
  const { rankings, fetchRankings } = useCockpit()
  const { t } = usePanelI18n()

  useEffect(() => {
    void fetchRankings().catch((err) => toast.error(adminErrorMessage(err)))
  }, [fetchRankings])

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <RankingPanel title={t.arenaScreen.rankingWeekly} items={rankings?.weekly.items ?? []} />
        <RankingPanel title={t.arenaScreen.rankingMonthly} items={rankings?.monthly.items ?? []} />
        <RankingPanel title={t.arenaScreen.rankingOverall} items={rankings?.individual.items ?? []} showStreak />
      </div>
    </div>
  )
}

function RankingPanel({
  title,
  items,
  showStreak,
}: {
  title: string
  items: RankingItem[]
  showStreak?: boolean
}) {
  const { t } = usePanelI18n()
  return (
    <Plate style={{ padding: 16 }}>
      <Kicker cyan style={{ display: "block", marginBottom: 14 }}>
        {title}
      </Kicker>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item) => (
          <div
            key={item.userId}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(0,0,0,0.30)",
              border: `1px solid ${T.border}`,
            }}
          >
            <div>
              <p style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 900, color: T.fg, marginBottom: 2 }}>
                {item.position}{t.arenaScreen.positionSuffix} · {item.pairName}
              </p>
              <p style={{ fontFamily: T.mono, fontSize: 9, color: T.fg3, letterSpacing: "0.10em" }}>
                {avatarStageLabel(item.avatarStage)}
                {showStreak && item.currentStreak ? ` · ${item.currentStreak}${t.arenaScreen.streakSuffix}` : ""}
              </p>
            </div>
            <p style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 900, color: T.cyan }}>
              {item.xp} {t.arenaScreen.xpUnit}
            </p>
          </div>
        ))}
        {!items.length && (
          <p style={{ fontFamily: T.mono, fontSize: 11, color: T.fg3, textAlign: "center", padding: 24 }}>
            {t.arenaScreen.empty}
          </p>
        )}
      </div>
    </Plate>
  )
}
