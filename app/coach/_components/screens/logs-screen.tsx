"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { adminErrorMessage, formatLogAction } from "../utils"
import { useCockpit } from "../cockpit-context"
import { T } from "../control-tokens"
import { Plate, SearchBox, FilterPill } from "../controls"
import { usePanelI18n } from "@/lib/panel-i18n"

export function LogsScreen() {
  const { globalLogs, fetchGlobalLogs, isAdmin } = useCockpit()
  const { t, lang } = usePanelI18n()
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("")

  useEffect(() => {
    if (!isAdmin) return
    void fetchGlobalLogs().catch((err) => toast.error(adminErrorMessage(err)))
  }, [fetchGlobalLogs, isAdmin])

  // Lista de ações distintas para o filtro
  const distinctActions = useMemo(() => {
    const set = new Set<string>()
    globalLogs.forEach((l) => l.action && set.add(l.action))
    return Array.from(set).sort()
  }, [globalLogs])

  const filtered = useMemo(() => {
    let l = globalLogs
    if (actionFilter) l = l.filter((log) => log.action === actionFilter)
    if (search) {
      const q = search.toLowerCase()
      l = l.filter(
        (log) =>
          (log.action ?? "").toLowerCase().includes(q) ||
          (log.actorUserId ?? "").toLowerCase().includes(q) ||
          (log.targetUserId ?? "").toLowerCase().includes(q) ||
          (log.actorRole ?? "").toLowerCase().includes(q)
      )
    }
    return l
  }, [globalLogs, search, actionFilter])

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <SearchBox value={search} onChange={setSearch} placeholder={t.logsScreen.placeholderSearch} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <FilterPill active={actionFilter === ""} onClick={() => setActionFilter("")}>
            {t.logsScreen.filterAll}
          </FilterPill>
          {distinctActions.slice(0, 8).map((a) => (
            <FilterPill key={a} active={actionFilter === a} onClick={() => setActionFilter(a)}>
              {formatLogAction(a, lang)}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Banner pendente */}
      <Plate dp style={{ padding: "12px 16px", marginBottom: 14 }}>
        <p
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            color: T.fg3,
            letterSpacing: "0.10em",
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: T.warn, fontWeight: 900, letterSpacing: "0.20em" }}>
            {t.logsScreen.bannerLocalFilter}
          </span>{" "}
          · {t.logsScreen.bannerLocalFilterCopy}
        </p>
      </Plate>

      {/* Lista */}
      {filtered.length === 0 ? (
        <Plate style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg3 }}>{t.logsScreen.emptyRecords}</p>
        </Plate>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.slice(0, 200).map((log, idx) => (
            <Plate key={log.id || idx} style={{ padding: "12px 16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: 10,
                    fontWeight: 900,
                    color: T.cyan,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  {formatLogAction(log.action, lang) || t.logsScreen.actionFallback}
                </span>
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.fg4 }}>
                  {log.timestamp ? new Date(log.timestamp).toLocaleString(lang) : "—"}
                </span>
              </div>
              <p
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  color: T.fg3,
                  marginTop: 4,
                  letterSpacing: "0.06em",
                }}
              >
                {log.actorRole || "—"} · {log.actorUserId || "—"}
                {log.targetUserId ? ` → ${log.targetUserId}` : ""}
              </p>
            </Plate>
          ))}
          {filtered.length > 200 && (
            <p
              style={{
                fontFamily: T.mono,
                fontSize: 9,
                color: T.fg4,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              {t.logsScreen.paginationCopy(200, filtered.length)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
