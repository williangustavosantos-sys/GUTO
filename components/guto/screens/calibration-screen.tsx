"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { translations, type ValidLanguage } from "../translations"

interface CalibrationProfile {
  userAge?: number
  biologicalSex?: "female" | "male" | "prefer_not_to_say"
  trainingLevel?: "beginner" | "returning" | "consistent" | "advanced"
  trainingGoal?: "consistency" | "fat_loss" | "muscle_gain" | "conditioning" | "mobility_health"
  preferredTrainingLocation?: "gym" | "home" | "park" | "mixed"
  trainingPathology?: string
}

type TrainingStatus = "beginner" | "returning" | "consistent"
type GoalKey = "consistency" | "fat_loss" | "muscle_gain" | "conditioning" | "mobility_health"
type LocationKey = "gym" | "home" | "park" | "mixed"

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

  const ageNum = parseInt(ageInput, 10)
  const isAgeValid = !isNaN(ageNum) && ageNum >= 14 && ageNum <= 99

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
    })
  }

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden font-tech">
      <div className="relative w-full max-w-[430px] mx-auto h-full flex flex-col px-5 pt-[max(env(safe-area-inset-top),14px)] pb-[max(env(safe-area-inset-bottom),12px)]">

        {/* ── TÍTULO ── */}
        <motion.div
          className="text-center mb-2 shrink-0"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-[15px] font-black uppercase tracking-[0.28em] text-[var(--guto-navy)]">
            {t.title}
          </h1>
        </motion.div>

        {/* ── PAINEL SUPERIOR: SEXO + IDADE ── */}
        <motion.div
          className="shrink-0 rounded-[20px] bg-[rgba(220,244,255,0.60)] backdrop-blur-md border border-[rgba(82,231,255,0.40)] shadow-[0_4px_18px_rgba(82,231,255,0.10)] px-4 py-3 mb-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          {/* Sexo biológico */}
          <div className="flex gap-2 justify-center mb-2.5">
            <ChipButton
              label={t.sexOptions.male}
              active={biologicalSex === "male"}
              onClick={() => setBiologicalSex("male")}
            />
            <ChipButton
              label={t.sexOptions.female}
              active={biologicalSex === "female"}
              onClick={() => setBiologicalSex("female")}
            />
          </div>

          {/* Idade */}
          <div className="flex gap-2 justify-center items-center">
            <span className="px-3 py-1 rounded-full border border-[rgba(82,231,255,0.25)] bg-transparent text-[10px] font-black uppercase tracking-[0.15em] text-[var(--guto-navy)]/55">
              {t.ageLabel}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={14}
              max={99}
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              placeholder="--"
              className="w-[52px] h-[28px] rounded-full border border-[rgba(82,231,255,0.55)] bg-[rgba(255,255,255,0.75)] text-center text-[13px] font-black text-[var(--guto-navy)] outline-none px-2 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </motion.div>

        {/* ── BONECO HOLOGRÁFICO ── */}
        <motion.div
          className="relative flex-1 min-h-[180px] flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Glow fundo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[220px] h-[220px] rounded-full bg-[var(--guto-cyan)] opacity-[0.13] blur-[70px]" />
          </div>

          {/* Órbita base */}
          <motion.div
            className="absolute bottom-4 w-[140px] h-[32px] rounded-[100%] border border-[rgba(82,231,255,0.4)]"
            style={{ transform: "rotateX(76deg)" }}
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.94, 1.06, 0.94] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Scan line */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-[150px] h-[2px] bg-white mix-blend-overlay opacity-45 shadow-[0_0_10px_var(--guto-cyan)]"
              animate={{ top: ["10%", "90%"] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Figura */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 h-full flex items-center justify-center"
          >
            <Image
              src="/assets/guto/guto-usuario.png"
              alt="GUTO Body Scan"
              width={190}
              height={460}
              className="object-contain drop-shadow-[0_0_22px_rgba(82,231,255,0.50)] max-h-full w-auto"
              priority
            />
          </motion.div>
        </motion.div>

        {/* ── PAINEL INFERIOR: STATUS + LIMITAÇÃO + OBJETIVO + LOCAL ── */}
        <motion.div
          className="shrink-0 rounded-[22px] bg-[rgba(220,244,255,0.60)] backdrop-blur-md border border-[rgba(82,231,255,0.40)] shadow-[0_-4px_24px_rgba(82,231,255,0.10)] px-4 pt-3 pb-3 -mt-8 relative z-10 flex flex-col gap-2.5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {/* Estado atual */}
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[var(--guto-navy)]/55 mb-1.5">
              {t.statusLabel}:
            </p>
            <div className="flex gap-1.5 flex-wrap">
              <ChipButton
                label={t.statusChips.paused}
                active={trainingStatus === "beginner"}
                onClick={() => setTrainingStatus("beginner")}
              />
              <ChipButton
                label={t.statusChips.returning}
                active={trainingStatus === "returning"}
                onClick={() => setTrainingStatus("returning")}
              />
              <ChipButton
                label={t.statusChips.active}
                active={trainingStatus === "consistent"}
                onClick={() => setTrainingStatus("consistent")}
              />
            </div>
          </div>

          {/* Limitação patologia */}
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[var(--guto-navy)]/55 mb-1.5">
              {t.pathologySection}
            </p>
            <input
              type="text"
              value={pathology}
              onChange={(e) => setPathology(e.target.value)}
              placeholder={t.pathologyPlaceholder}
              className="w-full px-3 py-1.5 rounded-full border border-[rgba(82,231,255,0.45)] bg-[rgba(255,255,255,0.70)] text-[10px] font-bold text-[var(--guto-navy)] placeholder-[rgba(13,35,65,0.30)] outline-none"
            />
          </div>

          {/* Objetivo */}
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[var(--guto-navy)]/55 mb-1.5">
              {t.objectiveSection}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.entries(t.objectiveChips) as [GoalKey, string][]).map(([key, label]) => (
                <ChipButton
                  key={key}
                  label={label}
                  active={goal === key}
                  onClick={() => setGoal(key)}
                />
              ))}
            </div>
          </div>

          {/* Local de treino */}
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[var(--guto-navy)]/55 mb-1.5">
              {t.locationLabel}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.entries(t.locationOptions) as [LocationKey, string][]).map(([key, label]) => (
                <ChipButton
                  key={key}
                  label={label}
                  active={location === key}
                  onClick={() => setLocation(key)}
                />
              ))}
            </div>
          </div>

          {/* Botão de submit */}
          <motion.button
            type="button"
            whileTap={isComplete ? { scale: 0.97 } : {}}
            disabled={!isComplete}
            onClick={handleSubmit}
            className={`w-full h-[48px] rounded-full font-black uppercase tracking-[0.2em] text-[12px] transition-all duration-300 mt-0.5 ${
              isComplete
                ? "bg-[var(--guto-cyan)] text-[var(--guto-navy)] shadow-[0_6px_20px_rgba(82,231,255,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]"
                : "bg-[rgba(255,255,255,0.45)] text-[var(--guto-navy)]/30 border border-[rgba(13,35,65,0.08)]"
            }`}
          >
            {t.submit}
          </motion.button>
        </motion.div>

      </div>
    </div>
  )
}

function ChipButton({
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
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-200 ${
        active
          ? "bg-[rgba(82,231,255,0.22)] border-[rgba(82,231,255,0.75)] text-[var(--guto-cyan)] shadow-[0_0_10px_rgba(82,231,255,0.25),inset_0_0_6px_rgba(82,231,255,0.10)]"
          : "bg-[rgba(255,255,255,0.55)] border-[rgba(82,231,255,0.32)] text-[rgba(13,35,65,0.70)]"
      }`}
    >
      {label}
    </motion.button>
  )
}
