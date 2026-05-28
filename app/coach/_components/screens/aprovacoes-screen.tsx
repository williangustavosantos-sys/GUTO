"use client"

import { useEffect, useState } from "react"
import { Check, FileVideo, Gavel, X } from "lucide-react"
import { useCockpit } from "../cockpit-context"
import { T } from "../control-tokens"
import { Plate, Pill, Btn, Kicker, FilterPill } from "../controls"
import type { AdminCustomExerciseRequest } from "@/lib/api/admin"
import { usePanelI18n } from "@/lib/panel-i18n"

type ApprTab = "ex" | "fd"

export function AprovacoesScreen() {
  const {
    pendingExercises,
    fetchPendingExercises,
    approveExercise,
    rejectExercise,
    acting,
  } = useCockpit()
  const { t } = usePanelI18n()
  const [tab, setTab] = useState<ApprTab>("ex")

  // fetch lazy só quando a tela entra em foco
  useEffect(() => {
    void fetchPendingExercises()
  }, [fetchPendingExercises])

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Banner explicativo */}
      <Plate
        dp
        style={{
          padding: "14px 18px",
          marginBottom: 12,
          background:
            "linear-gradient(90deg, rgba(82,231,255,0.08) 0%, rgba(82,231,255,0.02) 60%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: T.cyan }}>
            <Gavel className="h-4 w-4" />
          </span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 11,
                fontWeight: 900,
                color: T.fg,
                marginBottom: 3,
              }}
            >
              {t.aprovacoesScreen.bannerTitle}
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3 }}>
              {t.aprovacoesScreen.bannerCopy}
            </div>
          </div>
        </div>
      </Plate>

      {/* Regras de vídeo (só na aba Exercícios) */}
      {tab === "ex" && (
        <Plate
          style={{
            padding: "12px 16px",
            marginBottom: 18,
            borderColor: "rgba(82,231,255,0.20)",
          }}
        >
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 9,
              fontWeight: 900,
              color: T.cyan,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {t.aprovacoesScreen.rulesTitle}
          </div>
          <ul
            style={{
              listStyle: "none",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 6,
              fontFamily: T.mono,
              fontSize: 10,
              color: T.fg2,
              padding: 0,
              margin: 0,
            }}
          >
            <li>{t.aprovacoesScreen.rule1}</li>
            <li>{t.aprovacoesScreen.rule2}</li>
            <li>{t.aprovacoesScreen.rule3}</li>
            <li>{t.aprovacoesScreen.rule4}</li>
          </ul>
          <p
            style={{
              marginTop: 10,
              fontFamily: T.mono,
              fontSize: 9,
              color: T.warn,
              letterSpacing: "0.10em",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ letterSpacing: "0.20em" }}>{t.aprovacoesScreen.riskTitle}</strong> · {t.aprovacoesScreen.riskCopy}
          </p>
        </Plate>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <FilterPill active={tab === "ex"} onClick={() => setTab("ex")} count={pendingExercises.length}>
          {t.aprovacoesScreen.tabExercises}
        </FilterPill>
        <FilterPill active={tab === "fd"} onClick={() => setTab("fd")} count={0}>
          {t.aprovacoesScreen.tabFoods}
        </FilterPill>
      </div>

      {tab === "ex" && (
        <div style={{ display: "grid", gap: 10 }}>
          {pendingExercises.length === 0 ? (
            <Plate style={{ padding: 32, textAlign: "center" }}>
              <Check className="mx-auto mb-3 h-6 w-6" style={{ color: T.ok }} />
              <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg2 }}>
                {t.aprovacoesScreen.emptyExercises}
              </p>
            </Plate>
          ) : (
            pendingExercises.map((item) => (
              <ExerciseCard
                key={item.id}
                item={item}
                acting={acting}
                onApprove={() => void approveExercise(item.id)}
                onReject={() => {
                  const reason = window.prompt(t.aprovacoesScreen.rejectPrompt) ?? undefined
                  void rejectExercise(item.id, reason)
                }}
              />
            ))
          )}
        </div>
      )}

      {tab === "fd" && <PlaceholderAlimentos />}
    </div>
  )
}

// ─── ExerciseCard ────────────────────────────────────────────────────────────

function ExerciseCard({
  item,
  acting,
  onApprove,
  onReject,
}: {
  item: AdminCustomExerciseRequest
  acting: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const { t, lang } = usePanelI18n()
  const v = item.videoMetadata
  const durationOk = v.durationSeconds <= 15
  const sizeMb = v.fileSizeBytes ? v.fileSizeBytes / 1024 / 1024 : 0
  const sizeOk = sizeMb > 0 && sizeMb <= 20
  const resolutionOk = v.height >= 720 || v.width >= 720
  const canApprove = item.videoValidated && durationOk
  const blockReason = !item.videoValidated
    ? t.aprovacoesScreen.blockReasonNotValidated
    : !durationOk
      ? t.aprovacoesScreen.blockReasonTooLong
      : undefined

  return (
    <Plate style={{ padding: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 900, color: T.fg }}>
              {item.canonicalNamePt}
            </span>
            <Pill tone="warn">{t.aprovacoesScreen.pillPending}</Pill>
            {item.videoValidated ? (
              <Pill tone="ok">{t.aprovacoesScreen.pillVideoOk}</Pill>
            ) : (
              <Pill tone="bad">{t.aprovacoesScreen.pillVideoInvalid}</Pill>
            )}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3, letterSpacing: "0.10em" }}>
            {item.muscleGroup}
            {item.equipment && ` · ${item.equipment}`}
            {item.movementPattern && ` · ${item.movementPattern}`}
          </div>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
            <Mini label={t.aprovacoesScreen.miniDuration} value={`${v.durationSeconds.toFixed(1)}s`} ok={durationOk} />
            <Mini label={t.aprovacoesScreen.miniSize} value={`${sizeMb.toFixed(1)} MB`} ok={sizeOk} />
            <Mini label={t.aprovacoesScreen.miniResolution} value={`${v.width}×${v.height}`} ok={resolutionOk} />
            <Mini label={t.aprovacoesScreen.miniFps} value={String(v.fps)} ok={v.fps >= 24} />
          </div>
          <div style={{ marginTop: 10, fontFamily: T.mono, fontSize: 9, color: T.fg4, letterSpacing: "0.10em" }}>
            {t.aprovacoesScreen.sentBy(item.requestedBy, item.requestedByRole, new Date(item.requestedAt).toLocaleString(lang))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          {item.videoUrl && (
            <a
              href={item.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 999,
                border: `1px solid ${T.border}`,
                background: "rgba(232,244,255,0.07)",
                color: T.fg,
                fontFamily: T.mono,
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                textDecoration: "none",
              }}
            >
              <FileVideo className="h-3 w-3" />
              {t.aprovacoesScreen.btnSeeVideo}
            </a>
          )}
          <Btn
            cyan
            sm
            onClick={onApprove}
            disabled={acting || !canApprove}
            title={blockReason}
          >
            <Check className="h-3 w-3" />
            {t.aprovacoesScreen.btnApprove}
          </Btn>
          <Btn danger sm onClick={onReject} disabled={acting}>
            <X className="h-3 w-3" />
            {t.aprovacoesScreen.btnReject}
          </Btn>
        </div>
      </div>
    </Plate>
  )
}

function Mini({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        background: ok ? T.okS : T.warnS,
        border: `1px solid ${ok ? "rgba(74,222,128,0.30)" : "rgba(251,191,36,0.30)"}`,
      }}
    >
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 8,
          fontWeight: 900,
          color: T.fg4,
          letterSpacing: "0.20em",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 11,
          fontWeight: 900,
          color: ok ? T.ok : T.warn,
        }}
      >
        {value}
      </div>
    </div>
  )
}

// ─── Placeholder alimentos ───────────────────────────────────────────────────

function PlaceholderAlimentos() {
  const { t } = usePanelI18n()
  return (
    <Plate dp style={{ padding: "32px 24px", textAlign: "center" }}>
      <Gavel className="mx-auto mb-4 h-8 w-8" style={{ color: T.warn }} />
      <Kicker cyan style={{ display: "block", marginBottom: 12 }}>
        {t.aprovacoesScreen.foodsKicker}
      </Kicker>
      <p
        style={{
          fontFamily: T.mono,
          fontSize: 13,
          fontWeight: 700,
          color: T.fg,
          marginBottom: 8,
        }}
      >
        {t.aprovacoesScreen.foodsTitle}
      </p>
      <p
        style={{
          fontFamily: T.mono,
          fontSize: 10,
          color: T.fg3,
          maxWidth: 480,
          margin: "0 auto",
          lineHeight: 1.6,
        }}
      >
        {t.aprovacoesScreen.foodsCopy}
      </p>
    </Plate>
  )
}
