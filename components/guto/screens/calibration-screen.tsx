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
  const isComplete = Boolean(biologicalSex && isAgeValid && trainingStatus && goal && location && isHeightValid && isWeightValid)

  const noInjuryFallback: Record<ValidLanguage, string> = {
    "pt-BR": "sem dor",
    "en-US": "no pain or injury",
    "it-IT": "nessun dolore",
  }

  const handleSubmit = () => {
    if (!isComplete) return
    onComplete({
      biologicalSex: biologicalSex ?? undefined,
      userAge: ageNum,
      trainingLevel: trainingStatus ?? undefined,
      trainingGoal: goal ?? undefined,
      preferredTrainingLocation: location ?? undefined,
      trainingPathology: pathology.trim() || noInjuryFallback[language],
      country: country.trim() || undefined,
      heightCm: isHeightValid ? heightNum : undefined,
      weightKg: isWeightValid ? weightNum : undefined,
      foodRestrictions: foodRestrictions.trim() || undefined,
    })
  }

  return (
    <div
      className="relative w-full min-h-[100dvh] font-tech"
      style={{ background: "transparent", overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}
    >
      <div className="flex flex-col min-h-[100dvh] pb-[max(env(safe-area-inset-bottom),16px)]">
      {/* ── Título ── */}
      {/* ── Título ── */}
      <div className="px-1 pb-2 pt-2 text-center shrink-0">
        <h1 className="mx-auto max-w-[18rem] text-balance text-[1.25rem] font-black uppercase leading-tight tracking-[0.08em] text-[var(--guto-navy)]">
          {t.title}
        </h1>
      </div>

      {/* ══════════════════════════════════════════════════════
          ZONA SCANNER — ocupa todo o espaço acima do painel
          overflow: visible para o avatar vazar para cima/baixo
      ══════════════════════════════════════════════════════ */}
      <div className="relative flex-1 mx-2 my-2" style={{ minHeight: 460, overflow: "visible" }}>

        {/* ── Glow radial de fundo — centrado na zona ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 90% at 50% 50%, rgba(82,231,255,0.15) 0%, transparent 70%)",
            zIndex: 0,
          }}
        />

        {/* ── Scan line animada ── */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              width: 120,
              height: 1.5,
              background:
                "linear-gradient(90deg, transparent, rgba(82,231,255,0.85), transparent)",
              boxShadow: "0 0 10px rgba(82,231,255,0.60)",
            }}
            animate={{ top: ["5%", "95%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div
          className="absolute left-1/2 -translate-x-1/2 flex justify-center pointer-events-none"
          style={{
            zIndex: 2,
            top: 100,
            bottom: 0,
            width: "100%",
          }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ height: "100%", display: "flex", alignItems: "flex-end" }}
          >
            <Image
              src="/assets/guto/guto-usuario.png"
              alt="GUTO Body Scan"
              width={155}
              height={420}
              className="object-contain drop-shadow-[0_0_26px_rgba(82,231,255,0.60)]"
              style={{ height: "100%", width: "auto" }}
              priority
            />
          </motion.div>
        </div>

        {/* ════════════════════════════════════════
            TOPO CENTRAL — País + Restrições empilhados
        ════════════════════════════════════════ */}
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2"
          style={{ zIndex: 10, width: "calc(100% - 16px)" }}
        >
          <GlassBox side="left" className="flex flex-col gap-2">
            {/* Onde mora */}
            <div className="flex flex-col gap-0.5">
              <CyanLabel text={t.countryLabel} align="left" size="xs" />
              <TopPillInput
                value={country}
                onChange={setCountry}
                placeholder={t.countryPlaceholder}
                inputMode="text"
                autoComplete="country-name"
                fullWidth
              />
            </div>
            {/* Restrições alimentares */}
            <div className="flex flex-col gap-0.5">
              <CyanLabel text={t.restrictionsLabel} align="left" size="xs" />
              <TopPillInput
                value={foodRestrictions}
                onChange={setFoodRestrictions}
                placeholder={t.restrictionsPlaceholder}
                inputMode="text"
                fullWidth
              />
            </div>
          </GlassBox>
        </div>

        {/* ════════════════════════════════════════
            PAINEL GLASS ESQUERDO
            Caixa com vidro: Feminino + Masculino + Idade
        ════════════════════════════════════════ */}
        <GlassBox
          side="left"
          className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-stretch gap-2"
          style={{ width: 108, zIndex: 10 }}
        >
          {/* Sexo */}
          <PillChip
            label={t.sexOptions.female}
            active={biologicalSex === "female"}
            onClick={() => setBiologicalSex("female")}
          />
          <PillChip
            label={t.sexOptions.male}
            active={biologicalSex === "male"}
            onClick={() => setBiologicalSex("male")}
          />

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "rgba(82,231,255,0.22)",
              margin: "2px 0",
            }}
          />

          {/* Idade */}
          <div className="flex flex-col items-center gap-0.5">
            <CyanLabel text={t.ageLabel} align="center" size="xs" />
            <input
              type="number"
              inputMode="numeric"
              min={14}
              max={99}
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              placeholder="--"
              autoComplete="off"
              className="h-[28px] rounded-full border text-center text-[14px] font-black text-[var(--guto-navy)] outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{
                width: 60,
                background: "rgba(255,255,255,0.85)",
                borderColor: "rgba(82,231,255,0.60)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            />
          </div>
        </GlassBox>

        {/* ════════════════════════════════════════
            PAINEL GLASS DIREITO
            Caixa com vidro: Peso + Altura
        ════════════════════════════════════════ */}
        <GlassBox
          side="right"
          className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-stretch gap-3"
          style={{ width: 108, zIndex: 10 }}
        >
          {/* Peso */}
          <div className="flex flex-col items-center gap-0.5">
            <CyanLabel text={t.weightLabel} align="center" size="xs" />
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
              className="h-[32px] rounded-full border text-center text-[16px] font-black text-[var(--guto-navy)] outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{
                width: 68,
                background: "rgba(255,255,255,0.85)",
                borderColor: "rgba(82,231,255,0.60)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            />
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "rgba(82,231,255,0.22)",
              margin: "0",
            }}
          />

          {/* Altura */}
          <div className="flex flex-col items-center gap-0.5">
            <CyanLabel text={t.heightLabel} align="center" size="xs" />
            <input
              type="number"
              inputMode="numeric"
              min={100}
              max={250}
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              placeholder="170"
              autoComplete="off"
              className="h-[32px] rounded-full border text-center text-[16px] font-black text-[var(--guto-navy)] outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{
                width: 68,
                background: "rgba(255,255,255,0.85)",
                borderColor: "rgba(82,231,255,0.60)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            />
          </div>
        </GlassBox>

      </div>

      {/* ══════════════════════════════════════════════════
          PAINEL INFERIOR GLASS — Estado + Limitação + Objetivo + Local + CTA
      ══════════════════════════════════════════════════ */}
      <motion.div
        className="shrink-0 mx-2 rounded-[20px] px-3 pt-2.5 pb-2 flex flex-col gap-2"
        style={{
          background: "rgba(220, 244, 255, 0.90)",
          border: "1px solid rgba(82,231,255,0.35)",
          boxShadow:
            "0 -6px 32px rgba(82,231,255,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
          marginBottom: "max(env(safe-area-inset-bottom), 8px)",
          zIndex: 20,
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {/* Estado atual */}
        <div>
          <CyanLabel text={`${t.statusLabel}:`} />
          <div className="flex gap-1.5 mt-1">
            <PillChip label={t.statusChips.paused} active={trainingStatus === "beginner"} onClick={() => setTrainingStatus("beginner")} flex />
            <PillChip label={t.statusChips.returning} active={trainingStatus === "returning"} onClick={() => setTrainingStatus("returning")} flex />
            <PillChip label={t.statusChips.active} active={trainingStatus === "consistent"} onClick={() => setTrainingStatus("consistent")} flex />
          </div>
        </div>

        {/* Limitação */}
        <div>
          <CyanLabel text={t.pathologySection} />
          <BottomPillInput
            value={pathology}
            onChange={setPathology}
            placeholder={t.pathologyPlaceholder}
            inputMode="text"
            className="mt-1"
          />
        </div>

        {/* Objetivo */}
        <div>
          <CyanLabel text={t.objectiveSection} />
          <div className="flex gap-1.5 flex-wrap mt-1">
            {(Object.entries(t.objectiveChips) as [GoalKey, string][]).map(([key, label]) => (
              <PillChip key={key} label={label} active={goal === key} onClick={() => setGoal(key)} flex />
            ))}
          </div>
        </div>

        {/* Local de treino */}
        <div>
          <CyanLabel text={t.locationLabel} />
          <div className="flex gap-1.5 flex-wrap mt-1">
            {(Object.entries(t.locationOptions) as [LocationKey, string][]).map(([key, label]) => (
              <PillChip key={key} label={label} active={location === key} onClick={() => setLocation(key)} flex />
            ))}
          </div>
        </div>

        {/* Botão CALIBRAR */}
        <motion.button
          type="button"
          whileTap={isComplete ? { scale: 0.97 } : {}}
          disabled={!isComplete}
          onClick={handleSubmit}
          className="w-full h-[44px] rounded-full font-black uppercase tracking-[0.22em] text-[11px] transition-all duration-300"
          style={
            isComplete
              ? {
                  background: "var(--guto-cyan)",
                  color: "var(--guto-navy)",
                  boxShadow:
                    "0 6px 24px rgba(82,231,255,0.40), inset 0 1px 0 rgba(255,255,255,0.55)",
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

/** Caixa glass lateral — contém os painéis de sexo/idade e peso/altura */
function GlassBox({
  children,
  side,
  className = "",
  style,
}: {
  children: React.ReactNode
  side: "left" | "right"
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`p-2.5 rounded-[16px] ${className}`}
      style={{
        background: "rgba(255,255,255,0.55)",
        border: "1.5px solid rgba(82,231,255,0.40)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow:
          side === "left"
            ? "4px 0 20px rgba(82,231,255,0.08), inset 0 1px 0 rgba(255,255,255,0.95)"
            : "-4px 0 20px rgba(82,231,255,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Cyan section label */
function CyanLabel({
  text,
  size = "sm",
  align = "left",
}: {
  text: string
  size?: "xs" | "sm"
  align?: "left" | "right" | "center"
}) {
  return (
    <p
      className="font-black uppercase leading-none"
      style={{
        fontSize: size === "xs" ? 8 : 9,
        letterSpacing: "0.18em",
        color: "var(--guto-cyan)",
        textShadow: "0 0 8px rgba(82,231,255,0.30)",
        textAlign: align,
      }}
    >
      {text}
    </p>
  )
}

/** Mini pill input para o topo (País / Restrições) */
function TopPillInput({
  value,
  onChange,
  placeholder,
  inputMode = "text",
  autoComplete,
  fullWidth = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  autoComplete?: string
  fullWidth?: boolean
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
      className="h-[28px] px-3 rounded-full font-bold text-[9px] tracking-[0.04em] text-[var(--guto-navy)] outline-none"
      style={{
        width: fullWidth ? "100%" : 100,
        background: "rgba(255,255,255,0.80)",
        border: "1.5px solid rgba(82,231,255,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(82,231,255,0.08)",
        WebkitAppearance: "none",
      }}
    />
  )
}

/** Pill input para o painel inferior */
function BottomPillInput({
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
      className={`w-full h-[30px] px-4 rounded-full font-bold text-[10px] tracking-[0.04em] text-[var(--guto-navy)] outline-none ${className}`}
      style={{
        background: "rgba(255,255,255,0.72)",
        border: "1.5px solid rgba(82,231,255,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(82,231,255,0.08)",
        WebkitAppearance: "none",
      }}
    />
  )
}

/**
 * Chip pill-shape (bordas completamente arredondadas, estilo Figma).
 * flex=true → divide espaço igualmente na row (largura uniforme).
 * flex=false → largura 100% do container (dentro da GlassBox lateral).
 */
function PillChip({
  label,
  active,
  onClick,
  flex = false,
}: {
  label: string
  active: boolean
  onClick: () => void
  flex?: boolean
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="py-[6px] px-2.5 rounded-full font-black uppercase text-[9px] leading-none transition-all duration-200 text-center whitespace-nowrap"
      style={{
        ...(flex ? { flex: "1 1 auto" } : { width: "100%" }),
        ...(active
          ? {
              background: "rgba(82,231,255,0.18)",
              border: "1.5px solid rgba(82,231,255,0.85)",
              color: "var(--guto-cyan)",
              boxShadow:
                "0 0 10px rgba(82,231,255,0.25), inset 0 0 6px rgba(82,231,255,0.10)",
              letterSpacing: "0.10em",
            }
          : {
              background: "rgba(255,255,255,0.65)",
              border: "1.5px solid rgba(82,231,255,0.32)",
              color: "rgba(13,35,65,0.72)",
              letterSpacing: "0.10em",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }),
      }}
    >
      {label}
    </motion.button>
  )
}
