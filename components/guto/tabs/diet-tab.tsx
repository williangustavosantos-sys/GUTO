"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame, Zap, Wheat, Droplets, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"

import { getDietPlan, generateDietPlan, type DietPlan, type DietMeal, type DietFood } from "@/lib/api/guto"
import { getLanguage } from "../translations"
import type { ValidLanguage } from "../translations"

// ─── Copy ────────────────────────────────────────────────────────────────────

const dietCopy = {
  "pt-BR": {
    title: "DIETA DA SEMANA",
    regenerateButton: "REGENERAR DIETA",
    generatingLabel: "GUTO calculando...",
    generatingSubtitle: "Montando sua dieta personalizada...",
    dailyTarget: "META DO DIA",
    perDay: "por dia",
    proteinLabel: "Proteína",
    carbsLabel: "Carbo",
    fatLabel: "Gordura",
    objectiveLabel: "Objetivo",
    emptyTitle: "Dieta ainda não gerada",
    emptyBody: "Complete seu perfil com altura, peso e país para o GUTO montar seu plano.",
    goalNames: {
      fat_loss: "Emagrecer",
      muscle_gain: "Hipertrofia",
      conditioning: "Condicionamento",
      mobility_health: "Saúde",
      consistency: "Consistência",
    } as Record<string, string>,
  },
  "en-US": {
    title: "WEEKLY DIET",
    regenerateButton: "REGENERATE DIET",
    generatingLabel: "GUTO calculating...",
    generatingSubtitle: "Building your personalized plan...",
    dailyTarget: "DAILY TARGET",
    perDay: "per day",
    proteinLabel: "Protein",
    carbsLabel: "Carbs",
    fatLabel: "Fat",
    objectiveLabel: "Goal",
    emptyTitle: "Diet not generated yet",
    emptyBody: "Complete your profile with height, weight and country so GUTO can build your plan.",
    goalNames: {
      fat_loss: "Fat Loss",
      muscle_gain: "Hypertrophy",
      conditioning: "Conditioning",
      mobility_health: "Health",
      consistency: "Consistency",
    } as Record<string, string>,
  },
  "es-ES": {
    title: "DIETA DE LA SEMANA",
    regenerateButton: "REGENERAR DIETA",
    generatingLabel: "GUTO calculando...",
    generatingSubtitle: "Creando tu plan personalizado...",
    dailyTarget: "META DEL DÍA",
    perDay: "por día",
    proteinLabel: "Proteína",
    carbsLabel: "Carbos",
    fatLabel: "Grasa",
    objectiveLabel: "Objetivo",
    emptyTitle: "Dieta aún no generada",
    emptyBody: "Completa tu perfil con altura, peso y país para que GUTO cree tu plan.",
    goalNames: {
      fat_loss: "Adelgazar",
      muscle_gain: "Hipertrofia",
      conditioning: "Acondicionamiento",
      mobility_health: "Salud",
      consistency: "Consistencia",
    } as Record<string, string>,
  },
  "it-IT": {
    title: "DIETA DELLA SETTIMANA",
    regenerateButton: "RIGENERA DIETA",
    generatingLabel: "GUTO sta calcolando...",
    generatingSubtitle: "Creando il tuo piano personale...",
    dailyTarget: "OBIETTIVO GIORNALIERO",
    perDay: "al giorno",
    proteinLabel: "Proteine",
    carbsLabel: "Carboidrati",
    fatLabel: "Grassi",
    objectiveLabel: "Obiettivo",
    emptyTitle: "Dieta non ancora creata",
    emptyBody: "Completa il profilo con altezza, peso e paese per far creare la dieta a GUTO.",
    goalNames: {
      fat_loss: "Dimagrire",
      muscle_gain: "Ipertrofia",
      conditioning: "Condizionamento",
      mobility_health: "Salute",
      consistency: "Costanza",
    } as Record<string, string>,
  },
} as const

// Emoji per meal ID
const MEAL_EMOJI: Record<string, string> = {
  cafe: "☕",
  lanche1: "🍎",
  almoco: "🍽️",
  lanche2: "🥜",
  jantar: "🌙",
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DietTabProps {
  userId: string
  language: string
  onFoodDoubt: (food: DietFood, meal: DietMeal) => void
  memory: import("@/lib/api/guto").GutoMemory | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekRange(generatedAt: string): string {
  const start = new Date(generatedAt)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  return `${fmt(start)} – ${fmt(end)}`
}

// ─── Meal Card ────────────────────────────────────────────────────────────────

function MealCard({
  meal,
  onFoodDoubt,
  index,
}: {
  meal: DietMeal
  onFoodDoubt: (food: DietFood, meal: DietMeal) => void
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const emoji = MEAL_EMOJI[meal.id] ?? "🥗"

  return (
    <motion.div
      className="rounded-[1.1rem] border border-white/60 bg-white/30 overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.22 }}
    >
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3.5 py-3"
        aria-expanded={expanded}
      >
        {/* Emoji */}
        <span className="text-[16px] shrink-0">{emoji}</span>

        {/* Time */}
        <span className="font-mono text-[9px] font-black tracking-[0.06em] text-[var(--guto-cyan)] shrink-0">
          {meal.time}
        </span>

        {/* Name */}
        <h2 className="flex-1 text-left text-[12px] font-black uppercase leading-tight tracking-[0.05em] text-[var(--guto-navy)]">
          {meal.name}
        </h2>

        {/* Total kcal + chevron */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-[11px] font-black text-[var(--guto-navy)]/55">
            {meal.totalKcal}
            <span className="text-[8px] font-normal ml-0.5 text-[var(--guto-navy)]/35">kcal</span>
          </span>
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5 text-[var(--guto-cyan)]" />
            : <ChevronDown className="h-3.5 w-3.5 text-[rgba(13,35,65,0.28)]" />
          }
        </div>
      </button>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="mx-3.5 h-px bg-[rgba(82,231,255,0.18)]" />

            <div className="px-3.5 pt-2.5 pb-3 flex flex-col gap-0">
              {/* Food rows */}
              {meal.foods.map((food, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-2 border-b border-[rgba(13,35,65,0.06)] last:border-0"
                >
                  {/* Food name */}
                  <span className="flex-1 text-[12px] leading-snug text-[var(--guto-navy)]/85">
                    {food.name}
                  </span>

                  {/* Quantity badge */}
                  <span className="font-mono text-[9px] font-black text-[var(--guto-navy)]/50 bg-[rgba(82,231,255,0.12)] px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                    {food.quantity}
                  </span>

                  {/* ? button — per food item */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onFoodDoubt(food, meal)
                    }}
                    aria-label={`Dúvida sobre ${food.name}`}
                    className="h-6 w-6 rounded-full border border-[rgba(82,231,255,0.45)] bg-[rgba(82,231,255,0.10)] text-[var(--guto-cyan)] font-black text-[11px] flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                  >
                    ?
                  </button>
                </div>
              ))}

              {/* Guto note */}
              {meal.gutoNote && (
                <p className="text-[10px] leading-snug text-[rgba(13,35,65,0.50)] italic pt-2">
                  <span className="not-italic font-black text-[var(--guto-cyan)] mr-1">GUTO</span>
                  {meal.gutoNote}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DietTab({ userId, language, onFoodDoubt, memory }: DietTabProps) {
  const validLang = getLanguage(language)
  const copy = dietCopy[validLang]

  const [plan, setPlan] = useState<DietPlan | null>(null)
  const [status, setStatus] = useState<"loading" | "generating" | "error" | "ready">("loading")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  function isPlanStale(generatedAt: string): boolean {
    const planDate = new Date(generatedAt)
    const now = new Date()
    const lastSunday = new Date(now)
    lastSunday.setDate(now.getDate() - now.getDay())
    lastSunday.setHours(0, 0, 0, 0)
    return planDate < lastSunday
  }

  function isProfileComplete(): boolean {
    if (!memory) return false
    return Boolean(
      memory.heightCm && memory.heightCm > 0 &&
      memory.weightKg && memory.weightKg > 0 &&
      memory.trainingGoal &&
      memory.biologicalSex &&
      memory.userAge &&
      (memory.trainingLevel || memory.trainingStatus)
    )
  }

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const hardTimeout = setTimeout(() => {
      if (!cancelled) {
        cancelled = true
        setStatus("error")
        setErrorMsg("Timeout: geração demorou demais. Tente novamente.")
      }
    }, 50_000)

    const run = async () => {
      setStatus("loading")
      setErrorMsg(null)
      try {
        let fetched = await getDietPlan(userId)
        if (cancelled) return

        if (fetched && isPlanStale(fetched.generatedAt)) fetched = null

        if (!fetched) {
          setStatus("generating")
          fetched = await generateDietPlan(userId, validLang)
          if (cancelled) return
        }

        setPlan(fetched)
        setStatus("ready")
      } catch (err: any) {
        if (cancelled) return
        setPlan(null)
        setStatus("error")
        if (err.details?.error !== "missing_profile_fields") {
          setErrorMsg(err.message || "Erro ao gerar dieta.")
        }
      } finally {
        clearTimeout(hardTimeout)
      }
    }

    void run()
    return () => {
      cancelled = true
      clearTimeout(hardTimeout)
    }
  }, [userId, validLang])

  const handleRetry = async () => {
    if (retrying) return
    setRetrying(true)
    setErrorMsg(null)
    try {
      const newPlan = await generateDietPlan(userId, validLang)
      setPlan(newPlan)
      setStatus("ready")
    } catch (err: any) {
      setStatus("error")
      setErrorMsg(err.message || "Erro ao gerar dieta.")
    } finally {
      setRetrying(false)
    }
  }

  const retryLabel: Record<ValidLanguage, string> = {
    "pt-BR": "Falha ao gerar. Tente novamente.",
    "en-US": "Failed to generate. Try again.",
    "it-IT": "Errore nella creazione. Riprova.",
    "es-ES": "Error al generar. Inténtalo de nuevo.",
  }

  // ── Loading / Generating ──────────────────────────────────────────────────
  if (status === "loading" || status === "generating") {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--guto-cyan)]"
        >
          {copy.generatingLabel}
        </motion.div>
        {status === "generating" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="font-mono text-[8px] uppercase tracking-[0.14em] text-[rgba(13,35,65,0.35)] text-center max-w-[200px]"
          >
            {copy.generatingSubtitle}
          </motion.p>
        )}
      </div>
    )
  }

  // ── Empty / Error ─────────────────────────────────────────────────────────
  if (!plan) {
    const profileComplete = isProfileComplete()
    const bodyText = !profileComplete ? copy.emptyBody : errorMsg || retryLabel[validLang]

    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 pb-3 pt-1 text-center">
          <h1 className="text-[1.15rem] font-black uppercase leading-tight tracking-[0.08em] text-[var(--guto-navy)]">
            {copy.title}
          </h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-5 pb-4">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[rgba(82,231,255,0.10)] blur-xl" />
            <motion.div
              animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative text-4xl"
            >
              🥗
            </motion.div>
          </div>
          <div className="text-center max-w-[240px]">
            <h2 className="text-[0.95rem] font-black uppercase leading-tight tracking-[0.06em] text-[var(--guto-navy)] mb-2">
              {copy.emptyTitle}
            </h2>
            <p className="text-[12px] leading-relaxed text-[rgba(13,35,65,0.60)]">{bodyText}</p>
          </div>
          {profileComplete && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handleRetry}
              disabled={retrying}
              className="h-10 px-6 rounded-full border border-[rgba(82,231,255,0.5)] bg-[rgba(82,231,255,0.08)] text-[var(--guto-cyan)] font-mono text-[9px] font-black uppercase tracking-[0.18em] flex items-center gap-2 disabled:opacity-40"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {copy.regenerateButton}
            </motion.button>
          )}
        </div>
      </div>
    )
  }

  // ── Plan view ─────────────────────────────────────────────────────────────
  const { macros, meals, generatedAt } = plan
  const goalName = copy.goalNames[macros.goal] || macros.goal
  const weekRange = getWeekRange(generatedAt)

  return (
    <div className="flex h-full min-h-0 flex-col">

      {/* ── Header ── */}
      <div className="shrink-0 pb-2.5 pt-0.5 text-center">
        <h1 className="text-[1.1rem] font-black uppercase leading-tight tracking-[0.08em] text-[var(--guto-navy)]">
          {copy.title}
        </h1>
        <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[rgba(13,35,65,0.40)] mt-0.5">
          {weekRange}
        </p>
      </div>

      {/* ── Summary card ── */}
      <motion.div
        className="shrink-0 mb-3 rounded-[1.1rem] border border-white/60 bg-white/30"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        {/* Kcal row */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-end gap-1.5">
            <Flame className="h-4 w-4 text-[var(--guto-cyan)] mb-px shrink-0" />
            <span className="text-[24px] font-black leading-none text-[var(--guto-navy)]">
              {macros.targetKcal}
            </span>
            <div className="flex flex-col mb-0.5">
              <span className="font-mono text-[8px] leading-none text-[var(--guto-navy)]/40">kcal</span>
              <span className="font-mono text-[7px] leading-none text-[var(--guto-navy)]/30">{copy.perDay}</span>
            </div>
          </div>
          <span className="font-mono text-[8px] font-black uppercase tracking-[0.1em] text-[var(--guto-navy)] bg-[rgba(82,231,255,0.15)] px-2.5 py-1 rounded-full">
            {goalName}
          </span>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-[rgba(82,231,255,0.15)]" />

        {/* Macros row */}
        <div className="flex items-center px-4 py-2.5">
          <MacroPill icon={<Zap className="h-3 w-3" />} label={copy.proteinLabel} value={`${macros.proteinG}g`} color="cyan" />
          <div className="w-px h-6 bg-[rgba(13,35,65,0.07)]" />
          <MacroPill icon={<Wheat className="h-3 w-3" />} label={copy.carbsLabel} value={`${macros.carbsG}g`} color="amber" />
          <div className="w-px h-6 bg-[rgba(13,35,65,0.07)]" />
          <MacroPill icon={<Droplets className="h-3 w-3" />} label={copy.fatLabel} value={`${macros.fatG}g`} color="sky" />
        </div>
      </motion.div>

      {/* ── Scrollable meals ── */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto flex flex-col gap-2 pb-2">
        {meals.map((meal, i) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onFoodDoubt={onFoodDoubt}
            index={i}
          />
        ))}

        {/* Regenerate — subtle, at bottom */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleRetry}
          disabled={retrying}
          className="mt-1 flex items-center justify-center gap-2 w-full h-9 rounded-[0.85rem] border border-[rgba(82,231,255,0.25)] bg-transparent text-[var(--guto-cyan)]/60 font-mono text-[8px] font-black uppercase tracking-[0.14em] disabled:opacity-40"
        >
          <RefreshCw className="h-3 w-3" />
          {copy.regenerateButton}
        </motion.button>
      </div>
    </div>
  )
}

// ─── MacroPill ─────────────────────────────────────────────────────────────────

function MacroPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: "cyan" | "amber" | "sky"
}) {
  const colorMap = { cyan: "text-[var(--guto-cyan)]", amber: "text-amber-500", sky: "text-sky-400" }
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1">
      <div className={colorMap[color]}>{icon}</div>
      <span className="text-[14px] font-black leading-none text-[var(--guto-navy)]">{value}</span>
      <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[rgba(13,35,65,0.38)] mt-0.5">{label}</span>
    </div>
  )
}
