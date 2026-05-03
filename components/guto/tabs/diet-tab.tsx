"use client"

import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame, Zap, Wheat, Droplets, RefreshCw, ChevronDown, ChevronUp, MessageCircle } from "lucide-react"

import { getDietPlan, generateDietPlan, type DietPlan, type DietMeal } from "@/lib/api/guto"
import { getLanguage } from "../translations"
import type { ValidLanguage } from "../translations"

// ─── Local copy ───────────────────────────────────────────────────────────────

const dietCopy = {
  "pt-BR": {
    title: "DIETA DA SEMANA",
    subtitle: "Plano base. Adapta pelo chat.",
    generateButton: "GERAR MINHA DIETA",
    regenerateButton: "REGENERAR DIETA",
    generatingLabel: "GUTO calculando...",
    dailyGoalTitle: "META DIÁRIA",
    kcalLabel: "kcal",
    proteinLabel: "Proteína",
    carbsLabel: "Carbo",
    fatLabel: "Gordura",
    objectiveLabel: "Objetivo",
    mealDoubtButton: "DÚVIDA SOBRE ESTA REFEIÇÃO",
    emptyTitle: "Dieta ainda não gerada",
    emptyBody: "Complete seu perfil com altura, peso e país para o GUTO montar seu plano.",
    lastUpdated: "Atualizado em",
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
    subtitle: "Base plan. Adapt through chat.",
    generateButton: "GENERATE MY DIET",
    regenerateButton: "REGENERATE DIET",
    generatingLabel: "GUTO calculating...",
    dailyGoalTitle: "DAILY GOAL",
    kcalLabel: "kcal",
    proteinLabel: "Protein",
    carbsLabel: "Carbs",
    fatLabel: "Fat",
    objectiveLabel: "Goal",
    mealDoubtButton: "QUESTION ABOUT THIS MEAL",
    emptyTitle: "Diet not generated yet",
    emptyBody: "Complete your profile with height, weight and country so GUTO can build your plan.",
    lastUpdated: "Last updated",
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
    subtitle: "Plan base. Adapta por el chat.",
    generateButton: "GENERAR MI DIETA",
    regenerateButton: "REGENERAR DIETA",
    generatingLabel: "GUTO calculando...",
    dailyGoalTitle: "META DIARIA",
    kcalLabel: "kcal",
    proteinLabel: "Proteína",
    carbsLabel: "Carbos",
    fatLabel: "Grasa",
    objectiveLabel: "Objetivo",
    mealDoubtButton: "DUDA SOBRE ESTA COMIDA",
    emptyTitle: "Dieta aún no generada",
    emptyBody: "Completa tu perfil con altura, peso y país para que GUTO cree tu plan.",
    lastUpdated: "Actualizado el",
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
    subtitle: "Piano base. Adatta via chat.",
    generateButton: "CREA LA MIA DIETA",
    regenerateButton: "RIGENERA DIETA",
    generatingLabel: "GUTO sta calcolando...",
    dailyGoalTitle: "OBIETTIVO GIORNALIERO",
    kcalLabel: "kcal",
    proteinLabel: "Proteine",
    carbsLabel: "Carboidrati",
    fatLabel: "Grassi",
    objectiveLabel: "Obiettivo",
    mealDoubtButton: "DUBBIO SU QUESTO PASTO",
    emptyTitle: "Dieta non ancora creata",
    emptyBody: "Completa il profilo con altezza, peso e paese per far creare la dieta a GUTO.",
    lastUpdated: "Aggiornato il",
    goalNames: {
      fat_loss: "Dimagrire",
      muscle_gain: "Ipertrofia",
      conditioning: "Condizionamento",
      mobility_health: "Salute",
      consistency: "Costanza",
    } as Record<string, string>,
  },
} as const

// ─── Props ────────────────────────────────────────────────────────────────────

interface DietTabProps {
  userId: string
  language: string
  onMealDoubt: (meal: DietMeal) => void
}

// ─── Meal Card ────────────────────────────────────────────────────────────────

function MealCard({
  meal,
  copy,
  onDoubt,
  index,
}: {
  meal: DietMeal
  copy: (typeof dietCopy)[ValidLanguage]
  onDoubt: (meal: DietMeal) => void
  index: number
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <motion.div
      className="guto-frost-panel rounded-[1.25rem] overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono text-[9px] text-[var(--guto-cyan)] font-black tracking-[0.1em] shrink-0">
            {meal.time}
          </span>
          <h2 className="text-[13px] font-black uppercase tracking-[0.06em] text-[var(--guto-navy)] truncate">
            {meal.name}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-black text-[var(--guto-navy)]/60">
            {meal.totalKcal} <span className="text-[9px] font-mono">kcal</span>
          </span>
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5 text-[var(--guto-cyan)]" />
            : <ChevronDown className="h-3.5 w-3.5 text-[rgba(13,35,65,0.35)]" />
          }
        </div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 flex flex-col gap-2">
              {/* Food list */}
              <div className="flex flex-col gap-1">
                {meal.foods.map((food, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--guto-navy)]/80 leading-snug flex-1 pr-2">
                      {food.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[10px] font-black text-[var(--guto-navy)]/55 bg-[rgba(82,231,255,0.10)] px-2 py-0.5 rounded-full">
                        {food.quantity}
                      </span>
                      <span className="font-mono text-[9px] text-[var(--guto-navy)]/35">
                        {food.kcal}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-[rgba(82,231,255,0.2)]" />

              {/* Guto note */}
              {meal.gutoNote && (
                <p className="text-[10px] leading-snug text-[rgba(13,35,65,0.60)] italic">
                  <span className="not-italic font-black text-[var(--guto-cyan)] mr-1">GUTO:</span>
                  {meal.gutoNote}
                </p>
              )}

              {/* Doubt button */}
              <button
                type="button"
                onClick={() => onDoubt(meal)}
                className="flex items-center justify-center gap-1.5 w-full h-9 rounded-full border border-[rgba(82,231,255,0.4)] bg-[rgba(82,231,255,0.06)] text-[var(--guto-cyan)] font-mono text-[9px] font-black uppercase tracking-[0.12em] transition-all active:scale-[0.97]"
                aria-label={`${copy.mealDoubtButton}: ${meal.name}`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {copy.mealDoubtButton}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DietTab({ userId, language, onMealDoubt }: DietTabProps) {
  const validLang = getLanguage(language)
  const copy = dietCopy[validLang]

  const [plan, setPlan] = useState<DietPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPlan = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const fetched = await getDietPlan(userId)
      setPlan(fetched)
    } catch {
      setPlan(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadPlan()
  }, [loadPlan])

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const newPlan = await generateDietPlan(userId, validLang)
      setPlan(newPlan)
    } catch (err: any) {
      if (err.details && err.details.error === "missing_profile_data" && err.details.missingFields) {
        const missingMap: Record<string, string> = {
          heightCm: "Falta altura",
          weightKg: "Falta peso",
          country: "Falta país",
          trainingGoal: "Falta objetivo",
          biologicalSex: "Falta sexo biológico",
          userAge: "Falta idade"
        }
        const fields = err.details.missingFields.map((f: string) => missingMap[f] || f).join(", ")
        setError(`${fields}`)
      } else {
        setError("Erro ao gerar dieta. Verifique seu perfil e tente novamente.")
      }
    } finally {
      setGenerating(false)
    }
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(validLang, { day: "2-digit", month: "2-digit", year: "numeric" })
    } catch {
      return iso
    }
  }

  // ── Loading state
  if (loading) {
    return (
      <div className="relative flex h-full min-h-0 items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--guto-cyan)]"
        >
          {copy.generatingLabel}
        </motion.div>
      </div>
    )
  }

  // ── Empty state
  if (!plan) {
    return (
      <div className="relative flex h-full min-h-0 flex-col">
        {/* Header */}
        <div className="px-1 pb-4 pt-2 text-center shrink-0">
          <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[var(--guto-cyan)] mb-1">
            {copy.subtitle}
          </p>
          <h1 className="mx-auto max-w-[18rem] text-balance text-[1.25rem] font-black uppercase leading-tight tracking-[0.08em] text-[var(--guto-navy)]">
            {copy.title}
          </h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-4">
          {/* Empty illustration */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[rgba(82,231,255,0.10)] blur-xl" />
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative text-5xl"
            >
              🥗
            </motion.div>
          </div>

          <div className="text-center max-w-[240px]">
            <h2 className="text-[1.1rem] font-black uppercase leading-tight tracking-[0.06em] text-[var(--guto-navy)] mb-2">
              {copy.emptyTitle}
            </h2>
            <p className="text-[12px] leading-relaxed text-[rgba(13,35,65,0.60)]">
              {copy.emptyBody}
            </p>
          </div>

          {error && (
            <p className="text-[11px] text-red-500/70 text-center max-w-[220px] leading-snug">
              {error}
            </p>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={generating}
            onClick={handleGenerate}
            className="h-12 px-8 rounded-full bg-[var(--guto-cyan)] text-[var(--guto-navy)] font-black uppercase tracking-[0.18em] text-[12px] shadow-[0_6px_20px_rgba(82,231,255,0.35)] disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-4 w-4" />
                </motion.div>
                {copy.generatingLabel}
              </>
            ) : (
              copy.generateButton
            )}
          </motion.button>
        </div>
      </div>
    )
  }

  // ── Plan view
  const { macros, meals, generatedAt } = plan
  const goalName = copy.goalNames[macros.goal] || macros.goal

  return (
    <div className="relative flex h-full min-h-0 flex-col pb-2">
      {/* Header */}
      <div className="px-1 pb-4 pt-2 text-center shrink-0">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[var(--guto-cyan)] mb-1">
          {copy.subtitle} • {copy.lastUpdated} {formatDate(generatedAt)}
        </p>
        <h1 className="mx-auto max-w-[18rem] text-balance text-[1.25rem] font-black uppercase leading-tight tracking-[0.08em] text-[var(--guto-navy)]">
          {copy.title}
        </h1>
      </div>

      {/* Macros card */}
      <motion.div
        className="shrink-0 rounded-[1.1rem] border border-white/70 bg-white/36 mb-3 overflow-hidden"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(82,231,255,0.15)]">
          <span className="font-mono text-[8px] font-black uppercase tracking-[0.2em] text-[var(--guto-navy)]/50">
            {copy.dailyGoalTitle}
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--guto-cyan)] bg-[rgba(82,231,255,0.12)] px-2 py-0.5 rounded-full">
            {copy.objectiveLabel}: {goalName}
          </span>
        </div>

        {/* Kcal + macros */}
        <div className="flex items-center px-3 py-2.5 gap-3">
          {/* Big kcal */}
          <div className="flex items-end gap-1">
            <Flame className="h-4 w-4 text-[var(--guto-cyan)] mb-0.5 shrink-0" />
            <span className="text-[24px] font-black leading-none text-[var(--guto-navy)]">
              {macros.targetKcal}
            </span>
            <span className="font-mono text-[9px] text-[var(--guto-navy)]/50 mb-0.5">
              {copy.kcalLabel}
            </span>
          </div>

          <div className="h-8 w-px bg-[rgba(13,35,65,0.08)]" />

          {/* Macros */}
          <div className="flex-1 grid grid-cols-3 gap-1">
            <MacroChip
              icon={<Zap className="h-3 w-3" />}
              label={copy.proteinLabel}
              value={`${macros.proteinG}g`}
              color="cyan"
            />
            <MacroChip
              icon={<Wheat className="h-3 w-3" />}
              label={copy.carbsLabel}
              value={`${macros.carbsG}g`}
              color="amber"
            />
            <MacroChip
              icon={<Droplets className="h-3 w-3" />}
              label={copy.fatLabel}
              value={`${macros.fatG}g`}
              color="sky"
            />
          </div>
        </div>
      </motion.div>

      {/* Meal list */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto flex flex-col gap-2 pb-3 pt-0.5">
        {meals.map((meal, i) => (
          <MealCard
            key={meal.id}
            meal={meal}
            copy={copy}
            onDoubt={onMealDoubt}
            index={i}
          />
        ))}

        {/* Regenerate button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          disabled={generating}
          onClick={handleGenerate}
          className="mt-1 flex items-center justify-center gap-2 w-full h-10 rounded-[1rem] border border-[rgba(82,231,255,0.4)] bg-transparent font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[var(--guto-cyan)] disabled:opacity-40"
          aria-label={copy.regenerateButton}
        >
          {generating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </motion.div>
              {copy.generatingLabel}
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              {copy.regenerateButton}
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}

// ─── MacroChip ─────────────────────────────────────────────────────────────────

function MacroChip({
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
  const colorMap = {
    cyan: "text-[var(--guto-cyan)]",
    amber: "text-amber-500",
    sky: "text-sky-500",
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`${colorMap[color]}`}>{icon}</div>
      <span className="text-[13px] font-black leading-none text-[var(--guto-navy)]">{value}</span>
      <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[rgba(13,35,65,0.42)]">{label}</span>
    </div>
  )
}
