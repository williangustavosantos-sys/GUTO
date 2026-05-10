"use client"

import { useMemo, useState } from "react"
import { Database, FileVideo, UtensilsCrossed } from "lucide-react"
import { useCockpit } from "../cockpit-context"
import { T } from "../control-tokens"
import { Plate, Pill, SearchBox, FilterPill, Kicker } from "../controls"

/**
 * Banco do GUTO — catálogo aprovado que o GUTO pode usar em treinos/dietas.
 *
 * - Exercícios: lê de `getAdminExerciseCatalog` (já carregado em useCoachData).
 *   Apenas leitura por enquanto. CRUD vem em PR posterior.
 * - Alimentos: backend não tem catálogo ainda → placeholder claro (PR #4).
 */

type BancoTab = "ex" | "fd"

export function BancoScreen() {
  const [tab, setTab] = useState<BancoTab>("ex")

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Banner */}
      <Plate
        dp
        style={{
          padding: "14px 18px",
          marginBottom: 18,
          background:
            "linear-gradient(90deg, rgba(82,231,255,0.08) 0%, rgba(82,231,255,0.02) 60%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: T.cyan }}>
            <Database className="h-4 w-4" />
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
              Catálogo aprovado · usado pelo GUTO em treinos e dietas.
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.fg3 }}>
              Aprovações pendentes ficam na tela <strong style={{ color: T.cyan }}>Aprovações</strong>.
              Aqui é só leitura por enquanto — edição/desativação vem em PR posterior.
            </div>
          </div>
        </div>
      </Plate>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <FilterPill active={tab === "ex"} onClick={() => setTab("ex")}>
          Exercícios
        </FilterPill>
        <FilterPill active={tab === "fd"} onClick={() => setTab("fd")}>
          Alimentos
        </FilterPill>
      </div>

      {tab === "ex" && <ExercisesTab />}
      {tab === "fd" && <FoodsPlaceholder />}
    </div>
  )
}

// ─── Exercícios ──────────────────────────────────────────────────────────────

function ExercisesTab() {
  const { exerciseCatalog } = useCockpit()
  const [search, setSearch] = useState("")
  const [muscle, setMuscle] = useState("")

  const muscles = useMemo(() => {
    const set = new Set<string>()
    exerciseCatalog.forEach((e) => e.muscleGroup && set.add(e.muscleGroup))
    return Array.from(set).sort()
  }, [exerciseCatalog])

  const list = useMemo(() => {
    let l = exerciseCatalog
    if (muscle) l = l.filter((e) => e.muscleGroup === muscle)
    if (search) {
      const q = search.toLowerCase()
      l = l.filter(
        (e) =>
          e.canonicalNamePt.toLowerCase().includes(q) ||
          (e.equipment ?? "").toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q)
      )
    }
    return l
  }, [exerciseCatalog, search, muscle])

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar exercício…" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <FilterPill active={muscle === ""} onClick={() => setMuscle("")}>
            Todos
          </FilterPill>
          {muscles.slice(0, 8).map((m) => (
            <FilterPill key={m} active={muscle === m} onClick={() => setMuscle(m)}>
              {m}
            </FilterPill>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Plate style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.fg3 }}>
            {exerciseCatalog.length === 0
              ? "Catálogo vazio. Aguardando exercícios aprovados."
              : "Nenhum exercício encontrado com esses filtros."}
          </p>
        </Plate>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 8,
          }}
        >
          {list.map((ex) => (
            <Plate key={ex.id} style={{ padding: "14px 16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: 12,
                      fontWeight: 700,
                      color: T.fg,
                      marginBottom: 3,
                    }}
                  >
                    {ex.canonicalNamePt}
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 9, color: T.fg3, letterSpacing: "0.10em" }}>
                    {ex.muscleGroup}
                    {ex.equipment && ` · ${ex.equipment}`}
                  </div>
                </div>
                {ex.videoUrl && (
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: T.cyan, display: "flex" }}
                    title="Ver vídeo"
                  >
                    <FileVideo className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              {ex.tags && ex.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {ex.tags.slice(0, 3).map((tag) => (
                    <Pill key={tag} tone="mute">
                      {tag}
                    </Pill>
                  ))}
                </div>
              )}
            </Plate>
          ))}
        </div>
      )}

      <p
        style={{
          marginTop: 14,
          fontFamily: T.mono,
          fontSize: 9,
          color: T.fg4,
          textAlign: "center",
          letterSpacing: "0.10em",
        }}
      >
        {list.length} de {exerciseCatalog.length} exercícios aprovados
      </p>
    </>
  )
}

// ─── Alimentos placeholder ───────────────────────────────────────────────────

function FoodsPlaceholder() {
  return (
    <Plate dp style={{ padding: "32px 24px", textAlign: "center" }}>
      <UtensilsCrossed className="mx-auto mb-4 h-8 w-8" style={{ color: T.warn }} />
      <Kicker cyan style={{ display: "block", marginBottom: 12 }}>
        ENDPOINT PENDENTE
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
        Catálogo de alimentos pendente de backend.
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
        Modelo de alimento (idiomas PT/IT/EN/ES, país, macros, alérgenos, restrições) + CRUD do
        catálogo entram no PR <strong style={{ color: T.cyan }}>#4</strong>.
      </p>
    </Plate>
  )
}
