"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { ParticlesBackground } from "../particles-background"

interface LanguageScreenProps {
  onSelect?: (lang: string) => void
  selectedLanguage?: string
}

const languages = [
  { code: "pt-BR", name: "Português", sub: "Brasil", asset: "/assets/guto/idioma-portugues.svg" },
  { code: "en-US", name: "English", sub: "United States", asset: "/assets/guto/idioma-english.svg" },
  { code: "it-IT", name: "Italiano", sub: "Italia", asset: "/assets/guto/idioma-italiano.svg" },
] as const

export function LanguageScreen({ onSelect, selectedLanguage }: LanguageScreenProps) {
  return (
    <motion.section
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden px-6 pt-[max(env(safe-area-inset-top),44px)]"
      style={{
        background:
          'url("/assets/guto/FUNDO_APP.JPG") center / cover no-repeat',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-label="GUTO language selection"
    >
      <ParticlesBackground />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,.55) 0%, rgba(255,255,255,.18) 22%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.45) 78%, rgba(220,232,244,.85) 100%), radial-gradient(120% 60% at 50% 8%, rgba(82,231,255,.16), transparent 60%)",
        }}
      />

      <div
        className="pointer-events-none absolute left-[18px] top-[70px] bottom-[120px] w-[1.5px] rounded-full"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(82,231,255,0.65), transparent)",
          boxShadow: "0 0 10px rgba(82,231,255,0.7)",
        }}
      />
      <div
        className="pointer-events-none absolute right-[18px] top-[70px] bottom-[120px] w-[1.5px] rounded-full"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(82,231,255,0.65), transparent)",
          boxShadow: "0 0 10px rgba(82,231,255,0.7)",
        }}
      />

      {[
        "left-4 top-[70px] border-l border-t",
        "right-4 top-[70px] border-r border-t",
        "bottom-7 left-4 border-b border-l",
        "bottom-7 right-4 border-b border-r",
      ].map((className) => (
        <div
          key={className}
          className={`pointer-events-none absolute h-4 w-4 border-[rgba(82,231,255,0.7)] ${className}`}
        />
      ))}

      <motion.div
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-7"
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.45 }}
      >
        <div className="relative grid place-items-center">
          <div
            className="absolute h-40 w-40 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(82,231,255,0.30), transparent 65%)",
              filter: "blur(10px)",
            }}
          />
          <div
            className="relative rounded-full px-8 py-5 text-center"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(245,250,255,0.58))",
              border: "1px solid rgba(255,255,255,0.94)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.96), 0 0 22px rgba(82,231,255,0.30), 0 12px 28px rgba(90,124,168,0.10)",
              backdropFilter: "blur(18px) saturate(1.2)",
              WebkitBackdropFilter: "blur(18px) saturate(1.2)",
            }}
          >
            <Image
              src="/assets/guto/logo_guto.png"
              alt="GUTO"
              width={154}
              height={50}
              priority
              style={{
                width: 154,
                height: "auto",
                filter: "drop-shadow(0 0 16px rgba(82,231,255,0.72)) drop-shadow(0 4px 8px rgba(13,35,65,0.10))",
              }}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-3.5">
          {languages.map((lang, index) => {
            const isSelected = selectedLanguage === lang.code

            return (
              <motion.button
              key={lang.code}
              type="button"
              onClick={() => onSelect?.(lang.code)}
              aria-pressed={isSelected}
              aria-label={lang.name}
              className="relative flex w-full items-center gap-4 rounded-[20px] px-3.5 py-3.5 text-left transition-all"
              style={{
                border: isSelected ? "1.5px solid rgba(82,231,255,0.75)" : "1px solid rgba(193,212,232,0.65)",
                background: isSelected
                  ? "linear-gradient(135deg, rgba(82,231,255,0.14), rgba(255,255,255,0.75))"
                  : "rgba(255,255,255,0.55)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow: isSelected
                  ? "0 0 18px rgba(82,231,255,0.22), inset 0 1px 0 rgba(255,255,255,0.92), 0 8px 20px rgba(90,124,168,0.12)"
                  : "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 12px rgba(90,124,168,0.08)",
              }}
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.08 }}
              whileHover={{
                scale: 1.01,
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative h-[62px] w-[62px] shrink-0">
                {isSelected && (
                  <div
                    className="absolute -inset-1 rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(82,231,255,0.45), transparent 70%)",
                      filter: "blur(6px)",
                    }}
                  />
                )}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 120 120" aria-hidden="true">
                  {Array.from({ length: 36 }).map((_, tickIndex) => {
                    const angle = (tickIndex / 36) * Math.PI * 2 - Math.PI / 2
                    const outerRadius = 58
                    const innerRadius = tickIndex % 3 === 0 ? 52 : 55

                    return (
                      <line
                        key={tickIndex}
                        x1={60 + Math.cos(angle) * outerRadius}
                        y1={60 + Math.sin(angle) * outerRadius}
                        x2={60 + Math.cos(angle) * innerRadius}
                        y2={60 + Math.sin(angle) * innerRadius}
                        stroke={isSelected ? "rgba(82,231,255,0.85)" : "rgba(90,124,168,0.28)"}
                        strokeWidth={tickIndex % 3 === 0 ? 1.2 : 0.6}
                      />
                    )
                  })}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={isSelected ? "#52e7ff" : "rgba(193,212,232,0.6)"}
                    strokeWidth={isSelected ? 1.6 : 1}
                  />
                </svg>
                <div
                  className="absolute inset-[14%] grid place-items-center overflow-hidden rounded-full p-[3px]"
                  style={{
                    background: "linear-gradient(180deg,rgba(255,255,255,0.95),rgba(214,228,244,0.7))",
                    boxShadow: isSelected
                      ? "0 0 18px rgba(82,231,255,0.4), inset 0 2px 4px rgba(255,255,255,0.95)"
                      : "inset 0 2px 4px rgba(255,255,255,0.95), 0 6px 16px rgba(90,124,168,0.15)",
                  }}
                >
                  <Image src={lang.asset} alt="" aria-hidden="true" width={48} height={48} className="h-full w-full rounded-full object-cover" />
                  <div className="pointer-events-none absolute left-[14%] top-[10%] h-[28%] w-[52%] rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,0.55),transparent_70%)]" />
                </div>
              </div>

              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-extrabold leading-tight tracking-[-0.01em] text-(--guto-charcoal)">
                  {lang.name}
                </span>
                <span
                  className="mt-1 block font-mono text-[11px] font-bold uppercase leading-none tracking-[0.12em]"
                  style={{ color: isSelected ? "rgba(82,231,255,0.95)" : "rgba(90,124,168,0.8)" }}
                >
                  {lang.sub}
                </span>
              </span>

              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                style={{
                  border: isSelected ? "1px solid rgba(82,231,255,0.8)" : "1px solid rgba(193,212,232,0.65)",
                  background: isSelected ? "rgba(82,231,255,0.18)" : "rgba(255,255,255,0.58)",
                  boxShadow: isSelected ? "0 0 10px rgba(82,231,255,0.28)" : "none",
                }}
              >
                {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-(--guto-cyan) shadow-[0_0_8px_rgba(82,231,255,0.9)]" />}
              </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </motion.section>
  )
}