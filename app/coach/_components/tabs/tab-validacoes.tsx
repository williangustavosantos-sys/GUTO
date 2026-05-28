"use client"

import { useEffect, useState } from "react"
import { Camera, ImageOff, MapPin, Zap } from "lucide-react"
import { toast } from "sonner"
import { getAdminStudentValidations } from "@/lib/api/admin"
import type { WorkoutFeedbackRecord, WorkoutValidationRecord } from "@/lib/api/guto"
import { useCockpit } from "../cockpit-context"
import { Panel } from "../ui"
import { T } from "../control-tokens"
import { formatDate } from "../utils"
import { usePanelI18n } from "@/lib/panel-i18n"

// Cores do feedback por dificuldade (não traduzido — só tone visual).
const DIFFICULTY_TONE: Record<"easy" | "ok" | "hard" | "pain", string> = {
  easy: T.ok, ok: T.fg2, hard: T.warn, pain: T.bad,
}

export function TabValidacoes() {
  const { selectedDetail } = useCockpit()
  const { t } = usePanelI18n()
  const [validations, setValidations] = useState<WorkoutValidationRecord[] | null>(null)
  const [feedback, setFeedback] = useState<WorkoutFeedbackRecord[] | null>(null)
  const [loading, setLoading] = useState(false)

  const userId = selectedDetail?.student.userId

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoading(true)
    getAdminStudentValidations(userId)
      .then((res) => {
        if (cancelled) return
        setValidations(res.validations)
        setFeedback(res.feedback)
      })
      .catch(() => {
        if (cancelled) return
        toast.error(t.tabValidacoes.loadError)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, t])

  if (!selectedDetail) return null

  return (
    <div className="grid gap-4">
      <Panel title={t.tabValidacoes.panelTitle}>
        {loading && (
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg3 }}>{t.tabValidacoes.loading}</p>
        )}
        {!loading && validations && validations.length === 0 && (
          <div
            style={{
              padding: 24,
              borderRadius: 10,
              border: `1px dashed ${T.border}`,
              background: T.bg,
              fontFamily: T.mono,
              fontSize: 12,
              color: T.fg3,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <ImageOff className="h-4 w-4" />
            {t.tabValidacoes.empty}
          </div>
        )}
        {!loading && validations && validations.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {validations.map((v) => {
              const matchedFeedback = feedback?.find(
                (f) => f.workoutFocus === v.workoutFocus && Math.abs(new Date(f.createdAt).getTime() - new Date(v.createdAt).getTime()) < 5 * 60 * 1000,
              )
              const diff = matchedFeedback?.difficulty
                ? { text: t.tabValidacoes.difficultyLabel[matchedFeedback.difficulty], tone: DIFFICULTY_TONE[matchedFeedback.difficulty] }
                : null
              const energy = matchedFeedback?.energy ? t.tabValidacoes.energyLabel[matchedFeedback.energy] : null
              return (
                <div
                  key={v.id}
                  style={{
                    background: T.panel,
                    border: `1px solid ${T.border}`,
                    borderRadius: 12,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {v.posterUrl || v.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.posterUrl || v.photoUrl}
                      alt={`Validação ${v.dateLabel}`}
                      style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", background: T.bg }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        background: T.bg,
                        display: "grid",
                        placeItems: "center",
                        color: T.fg3,
                      }}
                    >
                      <Camera className="h-6 w-6" />
                    </div>
                  )}
                  <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div
                      style={{
                        fontFamily: T.mono,
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: T.fg3,
                      }}
                    >
                      {formatDate(v.createdAt)}
                    </div>
                    <div
                      style={{
                        fontFamily: T.mono,
                        fontSize: 13,
                        fontWeight: 700,
                        color: T.fg,
                      }}
                    >
                      {t.tabValidacoes.focusLabel[v.workoutFocus] || v.workoutLabel}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        fontFamily: T.mono,
                        fontSize: 10,
                        color: T.fg3,
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <MapPin className="h-3 w-3" />
                        {t.tabValidacoes.locationLabel[v.locationMode] || v.locationMode}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: T.cyan, fontWeight: 700 }}>
                        <Zap className="h-3 w-3" />
                        {v.xp} XP
                      </span>
                    </div>
                    {(diff || energy || matchedFeedback?.painArea) && (
                      <div
                        style={{
                          marginTop: 4,
                          paddingTop: 8,
                          borderTop: `1px solid ${T.border}`,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          fontFamily: T.mono,
                          fontSize: 10,
                        }}
                      >
                        {diff && (
                          <span style={{ color: diff.tone, fontWeight: 700 }}>
                            {diff.text}
                          </span>
                        )}
                        {energy && (
                          <span style={{ color: T.fg3 }}>
                            {t.tabValidacoes.energyPrefix} <strong style={{ color: T.fg2 }}>{energy}</strong>
                          </span>
                        )}
                        {matchedFeedback?.painArea && (
                          <span style={{ color: T.bad }}>{t.tabValidacoes.painPrefix} {matchedFeedback.painArea}</span>
                        )}
                      </div>
                    )}
                    {matchedFeedback?.note && (
                      <p
                        style={{
                          marginTop: 2,
                          fontFamily: T.ui,
                          fontSize: 12,
                          color: T.fg2,
                          fontStyle: "italic",
                        }}
                      >
                        “{matchedFeedback.note}”
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}
