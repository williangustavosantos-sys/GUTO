"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { translations, type ValidLanguage } from "../translations"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalibrationProfile {
  userAge?: number
  biologicalSex?: "female" | "male" | "prefer_not_to_say"
  trainingLevel?: "beginner" | "returning" | "consistent" | "advanced"
  trainingGoal?: "consistency" | "fat_loss" | "muscle_gain" | "conditioning" | "mobility_health"
  preferredTrainingLocation?: "gym" | "home" | "park" | "mixed"
  trainingPathology?: string
  country?: string
  heightCm?: number
  weightKg?: number
  foodRestrictions?: string
}

type TrainingStatus = "beginner" | "returning" | "consistent"
type GoalKey = "consistency" | "fat_loss" | "muscle_gain" | "conditioning" | "mobility_health"
type LocationKey = "gym" | "home" | "park" | "mixed"

// ─── Main Component ───────────────────────────────────────────────────────────

export function CalibrationScreen({
  language,
  onComplete,
}: {
  language: ValidLanguage
  onComplete: (profile: CalibrationProfile) => void
}) {
  const t = translations[language].calibration

  const [biologicalSex, setBiologicalSex] = useState<"male" | "female" | null>(null)
  const [ageInput, setAgeInput] = useState("")
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null)
  const [pathology, setPathology] = useState("")
  const [goal, setGoal] = useState<GoalKey | null>(null)
  const [location, setLocation] = useState<LocationKey | null>(null)
  const [country, setCountry] = useState("")
  const [heightInput, setHeightInput] = useState("")
  const [weightInput, setWeightInput] = useState("")
  const [foodRestrictions, setFoodRestrictions] = useState("")

  const ageNum = parseInt(ageInput, 10)
  const isAgeValid = !isNaN(ageNum) && ageNum >= 14 && ageNum <= 99
  const heightNum = parseInt(heightInput, 10)
  const isHeightValid = !isNaN(heightNum) && heightNum >= 100 && heightNum <= 250
  const weightNum = parseFloat(weightInput)
  const isWeightValid = !isNaN(weightNum) && weightNum >= 30 && weightNum <= 300
  const isComplete = Boolean(biologicalSex && isAgeValid && trainingStatus && goal && location)

  const handleSubmit = () => {
    if (!isComplete) return
    onComplete({
      biologicalSex: biologicalSex ?? undefined,
      userAge: ageNum,
      trainingLevel: trainingStatus ?? undefined,
      trainingGoal: goal ?? undefined,
      preferredTrainingLocation: location ?? undefined,
      trainingPathology: pathology.trim() || "sem dor",
      country: country.trim() || undefined,
      heightCm: isHeightValid ? heightNum : undefined,
      weightKg: isWeightValid ? weightNum : undefined,
      foodRestrictions: foodRestrictions.trim() || undefined,
    })
  }

  return (
    /**
     * MOBILE KEYBOARD SAFETY:
     * - The outer shell is full-screen, no fixed height, overflow hidden only on x
     * - The scroll container uses overscroll-none + -webkit-overflow-scrolling: touch
     * - NO position:fixed elements inside the form
     * - Inputs use inputMode to control the correct keyboard type
     * - paddingBottom with safe-area ensures content is never hidden behind bottom bar
     */
    <div
      className="relative w-full h-full overflow-x-hidden font-tech"
      style={{ background: "transparent" }}
    >
      {/* Scrollable container — handles keyboard safely */}
      <div
        className="relative w-full max-w-[430px] mx-auto overflow-y-auto overscroll-none"
        style={{
          WebkitOverflowScrolling: "touch",
          minHeight: "100%",
          paddingTop: "max(env(safe-area-inset-top), 10px)",
          paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
        }}
      >
        {/* ═══════════════════════════════════════
            TITLE
        ═══════════════════════════════════════ */}
        <h1 className="text-center text-[13px] font-black uppercase tracking-[0.28em] text-[var(--guto-navy)] mb-3 px-4">
          {t.title}
        </h1>

        {/* ═══════════════════════════════════════
            TOP ROW: ONDE MORA + RESTRIÇÕES
        ═══════════════════════════════════════ */}
        <div className="px-4 flex flex-col gap-1.5 mb-0">
          {/* Onde mora */}
          <div>
            <CyanLabel text={t.countryLabel} />
            <GlassPillInput
              value={country}
              onChange={setCountry}
              placeholder={t.countryPlaceholder}
              inputMode="text"
              autoComplete="country-name"
            />
          </div>

          {/* Restrições alimentares */}
          <div>
            <CyanLabel text={t.restrictionsLabel} />
            <GlassPillInput
              value={foodRestrictions}
              onChange={setFoodRestrictions}
              placeholder={t.restrictionsPlaceholder}
              inputMode="text"
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════
            SCANNER ZONE: FIGURA + INPUTS LATERAIS
        ═══════════════════════════════════════ */}
        <div className="relative mx-4 mt-1 mb-0" style={{ height: 260 }}>

          {/* ── Glow de fundo ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 55% 60% at 50% 55%, rgba(82,231,255,0.13) 0%, transparent 72%)",
            }}
          />

          {/* ── Scan line animada ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-[90px] h-[1.5px] rounded-full"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(82,231,255,0.75), transparent)",
                boxShadow: "0 0 8px rgba(82,231,255,0.5)",
              }}
              animate={{ top: ["8%", "92%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* ── COLUNA ESQUERDA: Sexo + Idade ── */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-center items-start gap-2 z-10" style={{ width: 96 }}>
            <ScanChip
              label={t.sexOptions.female}
              active={biologicalSex === "female"}
              onClick={() => setBiologicalSex("female")}
            />
            <ScanChip
              label={t.sexOptions.male}
              active={biologicalSex === "male"}
              onClick={() => setBiologicalSex("male")}
            />
            <div className="mt-1">
              <CyanLabel text={t.ageLabel} size="xs" />
              <input
                type="number"
                inputMode="numeric"
                min={14}
                max={99}
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                placeholder="--"
                autoComplete="off"
                className="w-[60px] h-[32px] rounded-xl border border-[rgba(82,231,255,0.6)] bg-white/80 backdrop-blur-sm text-center text-[15px] font-black text-[var(--guto-navy)] outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* ── FIGURA CENTRAL ── */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full flex items-end justify-center z-0" style={{ width: 120 }}>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-full flex items-end"
            >
              <Image
                src="/assets/guto/guto-usuario.png"
                alt="GUTO Body Scan"
                width={110}
                height={260}
                className="object-contain drop-shadow-[0_0_22px_rgba(82,231,255,0.55)] h-full w-auto"
                priority
              />
            </motion.div>
          </div>

          {/* ── COLUNA DIREITA: Peso + Altura ── */}
          <div className="absolute right-0 top-0 h-full flex flex-col justify-center items-end gap-3 z-10" style={{ width: 96 }}>
            <div className="flex flex-col items-end gap-1">
              <CyanLabel text={t.weightLabel} size="xs" align="right" />
              <input
                type="number"
                inputMode="decimal"
                min={30}
                max={300}
                step={0.1}
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="70"
                autoComplete="off"
                className="w-[68px] h-[32px] rounded-xl border border-[rgba(82,231,255,0.6)] bg-white/80 backdrop-blur-sm text-center text-[15px] font-black text-[var(--guto-navy)] outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex flex-col items-end gap-1">
              <CyanLabel text={t.heightLabel} size="xs" align="right" />
              <input
                type="number"
                inputMode="numeric"
                min={100}
                max={250}
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                placeholder="170"
                autoComplete="off"
                className="w-[68px] h-[32px] rounded-xl border border-[rgba(82,231,255,0.6)] bg-white/80 backdrop-blur-sm text-center text-[15px] font-black text-[var(--guto-navy)] outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            BOTTOM GLASS PANEL
        ═══════════════════════════════════════ */}
        <motion.div
          className="mx-3 rounded-[22px] px-4 pt-4 pb-4 flex flex-col gap-3 relative z-10"
          style={{
            background: "rgba(220, 244, 255, 0.88)",
            border: "1px solid rgba(82,231,255,0.35)",
            boxShadow: "0 -6px 32px rgba(82,231,255,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {/* Estado atual */}
          <div>
            <CyanLabel text={`${t.statusLabel}:`} />
            <div className="flex gap-2 flex-wrap mt-1.5">
              <ScanChip label={t.statusChips.paused} active={trainingStatus === "beginner"} onClick={() => setTrainingStatus("beginner")} />
              <ScanChip label={t.statusChips.returning} active={trainingStatus === "returning"} onClick={() => setTrainingStatus("returning")} />
              <ScanChip label={t.statusChips.active} active={trainingStatus === "consistent"} onClick={() => setTrainingStatus("consistent")} />
            </div>
          </div>

          {/* Limitação patologia */}
          <div>
            <CyanLabel text={t.pathologySection} />
            <GlassPillInput
              value={pathology}
              onChange={setPathology}
              placeholder={t.pathologyPlaceholder}
              inputMode="text"
              className="mt-1.5"
            />
          </div>

          {/* Objetivo */}
          <div>
            <CyanLabel text={t.objectiveSection} />
            <div className="flex gap-2 flex-wrap mt-1.5">
              {(Object.entries(t.objectiveChips) as [GoalKey, string][]).map(([key, label]) => (
                <ScanChip key={key} label={label} active={goal === key} onClick={() => setGoal(key)} />
              ))}
            </div>
          </div>

          {/* Local de treino */}
          <div>
            <CyanLabel text={t.locationLabel} />
            <div className="flex gap-2 flex-wrap mt-1.5">
              {(Object.entries(t.locationOptions) as [LocationKey, string][]).map(([key, label]) => (
                <ScanChip key={key} label={label} active={location === key} onClick={() => setLocation(key)} />
              ))}
            </div>
          </div>

          {/* Botão CALIBRAR */}
          <motion.button
            type="button"
            whileTap={isComplete ? { scale: 0.97 } : {}}
            disabled={!isComplete}
            onClick={handleSubmit}
            className="w-full h-[50px] rounded-full font-black uppercase tracking-[0.22em] text-[12px] transition-all duration-300 mt-1"
            style={
              isComplete
                ? {
                    background: "var(--guto-cyan)",
                    color: "var(--guto-navy)",
                    boxShadow: "0 6px 24px rgba(82,231,255,0.40), inset 0 1px 0 rgba(255,255,255,0.55)",
                  }
                : {
                    background: "rgba(255,255,255,0.45)",
                    color: "rgba(13,35,65,0.28)",
                    border: "1px solid rgba(13,35,65,0.08)",
                  }
            }
          >
            {t.submit}
          </motion.button>
        </motion.div>

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Cyan section label — exact match to Figma typography */
function CyanLabel({
  text,
  size = "sm",
  align = "left",
}: {
  text: string
  size?: "xs" | "sm"
  align?: "left" | "right"
}) {
  return (
    <p
      className={`font-black uppercase leading-none ${align === "right" ? "text-right" : "text-left"}`}
      style={{
        fontSize: size === "xs" ? 9 : 10,
        letterSpacing: "0.18em",
        color: "var(--guto-cyan)",
        textShadow: "0 0 8px rgba(82,231,255,0.30)",
      }}
    >
      {text}
    </p>
  )
}

/** Rounded pill input with glass style */
function GlassPillInput({
  value,
  onChange,
  placeholder,
  inputMode = "text",
  autoComplete,
  className = "",
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  autoComplete?: string
  className?: string
}) {
  return (
    <input
      type="text"
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete || "off"}
      autoCorrect="off"
      spellCheck={false}
      className={`w-full h-[34px] px-4 rounded-full font-black text-[11px] tracking-[0.06em] text-[var(--guto-navy)] outline-none ${className}`}
      style={{
        background: "rgba(255,255,255,0.72)",
        border: "1.5px solid rgba(82,231,255,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(82,231,255,0.08)",
        // Prevent iOS from adding white bg when focused
        WebkitAppearance: "none",
      }}
    />
  )
}

/** Chip selector — matches Figma style: rounded corners, not pill */
function ScanChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="px-3 py-[5px] rounded-[10px] font-black uppercase text-[10px] leading-none transition-all duration-200"
      style={
        active
          ? {
              background: "rgba(82,231,255,0.18)",
              border: "1.5px solid rgba(82,231,255,0.80)",
              color: "var(--guto-cyan)",
              boxShadow: "0 0 10px rgba(82,231,255,0.22), inset 0 0 6px rgba(82,231,255,0.10)",
              letterSpacing: "0.10em",
            }
          : {
              background: "rgba(255,255,255,0.60)",
              border: "1.5px solid rgba(82,231,255,0.30)",
              color: "rgba(13,35,65,0.72)",
              letterSpacing: "0.10em",
            }
      }
    >
      {label}
    </motion.button>
  )
}
