"use client"

import { motion } from "framer-motion"
import { AlertCircle, Check, Flame, Lock } from "lucide-react"

import { getLanguage, translations } from "../translations"
import { pathDaysFixture } from "../view-models"

interface PathTabProps {
  userName: string
  language: string
}

const nodeOffsets = [0, 34, 8, 42, 18, 48, 22]

const pathCopy = {
  "pt-BR": { active: "Trilha ativa", visibleFailure: "Falha visível", debt: "Dia perdido fica cravado no material. O vazio cobra." },
  "en-US": { active: "Active path", visibleFailure: "Visible failure", debt: "A missed day stays carved into the material. The void charges for it." },
  "es-ES": { active: "Camino activo", visibleFailure: "Falla visible", debt: "El día perdido queda grabado en el material. El vacío cobra." },
  "it-IT": { active: "Percorso attivo", visibleFailure: "Errore visibile", debt: "Il giorno perso resta inciso nel materiale. Il vuoto presenta il conto." },
} as const

export function PathTab({ language }: PathTabProps) {
  const validLang = getLanguage(language)
  const locale = translations[validLang]
  const copy = pathCopy[validLang]

  return (
    <div className="flex h-full flex-col pb-4">
      <div className="px-1 pb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[rgba(13,35,65,0.42)]">
          {copy.active}
        </p>
        <h1 className="mt-2 text-[1.9rem] font-black tracking-[0.12em] text-[var(--guto-navy)]">
          {locale.pathTitle}
        </h1>
        <p className="mt-1 max-w-[16rem] text-sm text-[rgba(13,35,65,0.58)]">{locale.pathSubtitle}</p>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-[1.9rem] px-1 pb-5">
        <svg
          className="pointer-events-none absolute inset-x-0 top-4 h-[15rem] w-full"
          viewBox="0 0 360 240"
          preserveAspectRatio="none"
        >
          <path
            d="M 36 32 C 74 32, 98 68, 136 68 S 194 40, 226 104 S 292 168, 328 182"
            fill="none"
            stroke="rgba(25, 60, 106, 0.12)"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M 36 32 C 74 32, 98 68, 136 68 S 194 40, 226 104 S 292 168, 328 182"
            fill="none"
            stroke="rgba(82, 231, 255, 0.68)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="6 10"
          />
        </svg>

        <div className="relative flex flex-col gap-3 px-1 pt-2">
          {pathDaysFixture.map((day, index) => {
            const statusIcon =
              day.status === "completed" ? (
                <Check className="h-3.5 w-3.5 text-[var(--guto-cyan)]" />
              ) : day.status === "missed" ? (
                <AlertCircle className="h-3.5 w-3.5 text-[rgba(13,35,65,0.36)]" />
              ) : day.status === "locked" ? (
                <Lock className="h-3.5 w-3.5 text-[rgba(13,35,65,0.32)]" />
              ) : (
                <Flame className="h-3.5 w-3.5 text-[var(--guto-navy)]" />
              )

            return (
              <motion.div
                key={`${day.label}-${day.day}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="relative"
                style={{ marginLeft: `${nodeOffsets[index] ?? 0}px` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={
                      day.status === "completed"
                        ? "guto-deboss-deep flex h-14 w-14 items-center justify-center rounded-full border-[rgba(82,231,255,0.46)]"
                        : day.status === "current"
                          ? "guto-deboss flex h-14 w-14 items-center justify-center rounded-full border-[rgba(13,35,65,0.28)]"
                          : day.status === "missed"
                            ? "flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(154,163,173,0.3)] bg-[rgba(174,181,188,0.22)] shadow-[inset_4px_4px_14px_rgba(123,131,144,0.16),inset_-4px_-4px_10px_rgba(255,255,255,0.54)]"
                            : "flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(13,35,65,0.08)] bg-[rgba(255,255,255,0.4)] shadow-[inset_2px_2px_8px_rgba(152,163,179,0.12),inset_-3px_-3px_8px_rgba(255,255,255,0.72)]"
                    }
                  >
                    <span
                      className={
                        day.status === "completed"
                          ? "font-mono text-sm tracking-[0.18em] text-[var(--guto-cyan)]"
                          : day.status === "current"
                            ? "font-mono text-sm tracking-[0.18em] text-[var(--guto-navy)]"
                            : "font-mono text-sm tracking-[0.18em] text-[rgba(13,35,65,0.34)]"
                      }
                    >
                      {day.day}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[rgba(13,35,65,0.42)]">
                        {day.label}
                      </span>
                      {statusIcon}
                    </div>
                    {day.commitment && (
                      <p className="mt-1 text-sm text-[rgba(13,35,65,0.66)]">{day.commitment}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="guto-deboss mt-1 rounded-[1.8rem] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[rgba(13,35,65,0.38)]">
              {copy.visibleFailure}
            </p>
            <p className="mt-1 text-sm text-[rgba(13,35,65,0.68)]">
              {copy.debt}
            </p>
          </div>
          <div className="guto-deboss-deep flex h-12 w-12 items-center justify-center rounded-full">
            <Flame className="h-4 w-4 text-[var(--guto-cyan)]" />
          </div>
        </div>
      </div>
    </div>
  )
}
