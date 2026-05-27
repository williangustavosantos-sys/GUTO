"use client"

import { useState, useEffect } from "react"
import { Lock, Plus, RefreshCw, Save, Trash2, Unlock, Utensils } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  updateAdminStudentDiet,
  generateAdminStudentDiet,
  lockAdminStudentDiet,
  unlockAdminStudentDiet,
  resetAdminStudentDiet,
  saveStudentWeeklyDiet,
  type AdminStudent,
  type AdminWeeklyDietPlan,
  type AdminWeeklyDietDays,
  type AdminWeeklyDietDay,
  type WeekDayKey,
} from "@/lib/api/admin"
import type { DietPlan } from "@/lib/api/guto"
import { useCockpit } from "../cockpit-context"
import { Panel, Field, PlanStatus, LogList } from "../ui"
import { normalizeDietForEditor, blankDiet, dietDaySummary, blankDietDay, WEEK_DAYS } from "../utils"

// ─── DietEditor ───────────────────────────────────────────────────────────────

function DietEditor({
  student, value, history, acting,
  onChange, onSave, onCreateManual, onGenerate, onLock, onReset,
}: {
  student: AdminStudent
  value: DietPlan
  history: import("@/lib/api/admin").AdminLog[]
  acting: boolean
  onChange: (v: DietPlan) => void
  onSave: () => void
  onCreateManual: () => void
  onGenerate: () => void
  onLock: () => void
  onReset: () => void
}) {
  const updateMeal = (i: number, patch: Partial<DietPlan["meals"][number]>) =>
    onChange({ ...value, meals: value.meals.map((m, idx) => idx === i ? { ...m, ...patch } : m) })

  const updateFood = (mealIdx: number, foodIdx: number, patch: Partial<DietPlan["meals"][number]["foods"][number]>) =>
    onChange({
      ...value,
      meals: value.meals.map((m, i) =>
        i === mealIdx
          ? { ...m, foods: m.foods.map((f, j) => j === foodIdx ? { ...f, ...patch } : f) }
          : m
      ),
    })

  return (
    <div className="grid gap-4">
      <Panel title="Dieta oficial">
        <PlanStatus source={value.source} locked={value.lockedByCoach} />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Field label="Título" value={value.title || ""} onChange={(v) => onChange({ ...value, title: v })} className="md:col-span-2" />
          <Field label="País" value={value.country || ""} onChange={(v) => onChange({ ...value, country: v })} />
          <Field label="Calorias (kcal)" value={String(value.macros.targetKcal)} onChange={(v) => onChange({ ...value, macros: { ...value.macros, targetKcal: Number(v) || 0 } })} />
          <Field label="Proteína (g)" value={String(value.macros.proteinG)} onChange={(v) => onChange({ ...value, macros: { ...value.macros, proteinG: Number(v) || 0 } })} />
          <Field label="Carbo (g)" value={String(value.macros.carbsG)} onChange={(v) => onChange({ ...value, macros: { ...value.macros, carbsG: Number(v) || 0 } })} />
          <Field label="Gordura (g)" value={String(value.macros.fatG)} onChange={(v) => onChange({ ...value, macros: { ...value.macros, fatG: Number(v) || 0 } })} />
          <Field label="Restrições" value={value.foodRestrictions || ""} onChange={(v) => onChange({ ...value, foodRestrictions: v })} />
          <Field label="Notas do coach" value={value.coachNotes || ""} onChange={(v) => onChange({ ...value, coachNotes: v })} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="bg-[#0891B2] text-slate-900 hover:bg-[#0E7490]" disabled={acting} onClick={onSave}><Save className="mr-2 h-4 w-4" />Salvar</Button>
          <Button variant="outline" className="border-slate-200 bg-slate-50 text-slate-900" disabled={acting} onClick={onCreateManual}><Utensils className="mr-2 h-4 w-4" />Dieta manual</Button>
          <Button variant="outline" className="border-slate-200 bg-slate-50 text-slate-900" disabled={acting} onClick={onGenerate}><RefreshCw className="mr-2 h-4 w-4" />Gerar com GUTO</Button>
          <Button variant="outline" className="border-slate-200 bg-slate-50 text-slate-900" disabled={acting} onClick={onLock}>
            {value.lockedByCoach ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
            {value.lockedByCoach ? "Permitir GUTO atualizar" : "Bloquear auto-atualização"}
          </Button>
          <Button variant="outline" className="border-red-300 bg-transparent text-red-600" disabled={acting} onClick={onReset}><Trash2 className="mr-2 h-4 w-4" />Resetar dieta</Button>
        </div>
      </Panel>

      <Panel title={`Refeições de ${student.name}`}>
        <div className="grid gap-3">
          {value.meals.map((meal, mealIdx) => (
            <div key={`${meal.id}-${mealIdx}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="grid gap-3 md:grid-cols-4">
                <Field label="Refeição" value={meal.name} onChange={(v) => updateMeal(mealIdx, { name: v })} className="md:col-span-2" />
                <Field label="Horário" value={meal.time} onChange={(v) => updateMeal(mealIdx, { time: v })} />
                <Field label="Kcal total" value={String(meal.totalKcal)} onChange={(v) => updateMeal(mealIdx, { totalKcal: Number(v) || 0 })} />
                <Field label="Substituições" value={(meal.alternatives || []).join(", ")} onChange={(v) => updateMeal(mealIdx, { alternatives: v.split(",").map((s) => s.trim()).filter(Boolean) })} className="md:col-span-4" />
              </div>
              <div className="mt-3 grid gap-2">
                {meal.foods.map((food, foodIdx) => (
                  <div key={`${food.name}-${foodIdx}`} className="grid gap-2 rounded-md bg-white p-2 md:grid-cols-[1fr_1fr_.6fr_auto]">
                    <Input value={food.name} onChange={(e) => updateFood(mealIdx, foodIdx, { name: e.target.value })} placeholder="Alimento" className="border-slate-200 bg-slate-50 text-slate-900" />
                    <Input value={food.quantity} onChange={(e) => updateFood(mealIdx, foodIdx, { quantity: e.target.value })} placeholder="Quantidade" className="border-slate-200 bg-slate-50 text-slate-900" />
                    <Input value={String(food.kcal || "")} onChange={(e) => updateFood(mealIdx, foodIdx, { kcal: Number(e.target.value) || 0 })} placeholder="kcal" className="border-slate-200 bg-slate-50 text-slate-900" />
                    <Button variant="outline" className="border-red-300 bg-transparent text-red-600" onClick={() => updateMeal(mealIdx, { foods: meal.foods.filter((_, i) => i !== foodIdx) })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-3 border-slate-200 bg-slate-50 text-slate-900" onClick={() => updateMeal(mealIdx, { foods: [...meal.foods, { name: "", quantity: "", kcal: 0, notes: "" }] })}>
                <Plus className="mr-2 h-4 w-4" />Adicionar alimento
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-4 border-slate-200 bg-slate-50 text-slate-900" onClick={() => onChange({ ...value, meals: [...value.meals, { id: `meal-${Date.now()}`, name: "Nova refeição", time: "", totalKcal: 0, gutoNote: "", foods: [], alternatives: [] }] })}>
          <Plus className="mr-2 h-4 w-4" />Adicionar refeição
        </Button>
      </Panel>

      <Panel title="Histórico da dieta">
        <LogList logs={history} empty="Sem histórico de dieta." />
      </Panel>
    </div>
  )
}

// ─── WeeklyDietEditor ─────────────────────────────────────────────────────────

function WeeklyDietEditor({
  weeklyPlan, acting, onSave,
}: {
  weeklyPlan: AdminWeeklyDietPlan | null
  acting: boolean
  onSave: (days: AdminWeeklyDietDays) => Promise<void>
}) {
  const [days, setDays] = useState<AdminWeeklyDietDays>(() => weeklyPlan?.days ?? {})
  const [expandedDay, setExpandedDay] = useState<WeekDayKey | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setDays(weeklyPlan?.days ?? {}) }, [weeklyPlan])

  function setField(day: WeekDayKey, field: keyof AdminWeeklyDietDay, value: string | number | undefined) {
    setDays((curr) => {
      const existing = curr[day] ?? blankDietDay()
      return { ...curr, [day]: { ...existing, [field]: value } }
    })
  }

  function clearDay(day: WeekDayKey) {
    setDays((curr) => { const next = { ...curr }; delete next[day]; return next })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(days)
      toast.success("Plano semanal de dieta salvo.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar plano semanal de dieta.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel title="Plano semanal de dieta">
      <p className="mb-4 text-[11px] text-slate-500">Monte a dieta de cada dia. O aluno verá a dieta do dia atual.</p>
      <div className="space-y-2">
        {WEEK_DAYS.map(({ key, label }) => {
          const dayData = days[key]
          const isExpanded = expandedDay === key
          return (
            <div key={key} className="rounded-lg border border-slate-200 bg-slate-50">
              <button className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setExpandedDay(isExpanded ? null : key)}>
                <div>
                  <span className="text-sm font-bold text-slate-900">{label}</span>
                  {dayData && <span className="ml-2 text-[11px] text-[#0E7490]">preenchido</span>}
                </div>
                <span className="text-[11px] text-slate-500">{isExpanded ? "▲" : "▼"}</span>
              </button>
              {!isExpanded && (
                <p className="px-4 pb-2 text-[11px] text-slate-400">{dietDaySummary(dayData)}</p>
              )}
              {isExpanded && (
                <div className="border-t border-slate-200 px-4 pb-4 pt-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    {(["breakfast", "lunch", "dinner", "snacks"] as const).map((field) => {
                      const labels: Record<string, string> = { breakfast: "Café da manhã", lunch: "Almoço", dinner: "Jantar", snacks: "Lanches" }
                      const placeholders: Record<string, string> = { breakfast: "Ex: Aveia com banana, ovo mexido...", lunch: "Ex: Frango grelhado, arroz...", dinner: "Ex: Sopa de legumes...", snacks: "Ex: Iogurte, fruta..." }
                      return (
                        <div key={field}>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">{labels[field]}</label>
                          <textarea
                            value={dayData?.[field] ?? ""}
                            onChange={(e) => setField(key, field, e.target.value)}
                            rows={2}
                            placeholder={placeholders[field]}
                            className="w-full resize-none rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0E7490]/50 focus:outline-none"
                          />
                        </div>
                      )
                    })}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Hidratação</label>
                      <input type="text" value={dayData?.hydration ?? ""} onChange={(e) => setField(key, "hydration", e.target.value)} placeholder="Ex: 2,5 litros de água" className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0E7490]/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Observações</label>
                      <textarea value={dayData?.notes ?? ""} onChange={(e) => setField(key, "notes", e.target.value)} rows={2} placeholder="Ex: Evitar açúcar após 18h..." className="w-full resize-none rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0E7490]/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Estimativa calórica (kcal)</label>
                      <input type="number" value={dayData?.caloriesEstimate ?? ""} onChange={(e) => setField(key, "caloriesEstimate", e.target.value ? Number(e.target.value) : undefined)} placeholder="Ex: 2200" className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0E7490]/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Estimativa proteína (g)</label>
                      <input type="number" value={dayData?.proteinEstimate ?? ""} onChange={(e) => setField(key, "proteinEstimate", e.target.value ? Number(e.target.value) : undefined)} placeholder="Ex: 160" className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0E7490]/50 focus:outline-none" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button variant="outline" className="border-red-300 bg-transparent text-red-600 text-xs" onClick={() => clearDay(key)}>
                      <Trash2 className="mr-1 h-3 w-3" />Limpar dia
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex gap-2 border-t border-slate-200 pt-4">
        <Button className="bg-[#0891B2] text-slate-900 hover:bg-[#0E7490]" disabled={acting || saving} onClick={() => void handleSave()}>
          <Save className="mr-2 h-4 w-4" />{saving ? "Salvando…" : "Salvar plano semanal"}
        </Button>
      </div>
      {weeklyPlan?.updatedAt && (
        <p className="mt-2 text-[10px] text-slate-400">
          Última atualização: {new Date(weeklyPlan.updatedAt).toLocaleString("pt-BR")} por {weeklyPlan.updatedBy}
        </p>
      )}
    </Panel>
  )
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

export function TabDieta() {
  const {
    selectedDetail,
    dietEditor, setDietEditor,
    weeklyDietPlan, setWeeklyDietPlan,
    dietaSubTab, setDietaSubTab,
    acting, act,
  } = useCockpit()

  if (!selectedDetail || !dietEditor) return null
  const { student } = selectedDetail

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {(["oficial", "semanal"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setDietaSubTab(tab)}
            className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              dietaSubTab === tab ? "bg-[#0891B2] text-slate-900" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab === "oficial" ? "Dieta oficial" : "Plano semanal"}
          </button>
        ))}
      </div>

      {dietaSubTab === "oficial" && (
        <DietEditor
          student={student}
          value={dietEditor}
          history={selectedDetail.dietHistory}
          acting={acting}
          onChange={setDietEditor}
          onSave={() =>
            void act(async () => {
              const source =
                selectedDetail.diet?.source === "guto_generated"
                  ? "mixed"
                  : dietEditor.source || "coach_manual"
              const result = await updateAdminStudentDiet(
                student.userId,
                { ...dietEditor, source },
                "Coach/admin manual edit"
              )
              setDietEditor(normalizeDietForEditor(result.diet, student))
            }, "Dieta oficial salva.")
          }
          onCreateManual={() => setDietEditor(blankDiet(student))}
          onGenerate={() =>
            void act(async () => {
              const result = await generateAdminStudentDiet(student.userId)
              setDietEditor(normalizeDietForEditor(result.diet, student))
            }, "Dieta do GUTO carregada.")
          }
          onLock={() =>
            void act(async () => {
              const result = dietEditor.lockedByCoach
                ? await unlockAdminStudentDiet(student.userId)
                : await lockAdminStudentDiet(student.userId)
              setDietEditor(normalizeDietForEditor(result.diet, student))
            }, dietEditor.lockedByCoach ? "GUTO pode atualizar dieta." : "Dieta bloqueada.")
          }
          onReset={() => {
            if (!window.confirm("Resetar dieta oficial deste aluno?")) return
            void act(async () => {
              await resetAdminStudentDiet(student.userId)
              setDietEditor(blankDiet(student))
            }, "Dieta resetada.")
          }}
        />
      )}

      {dietaSubTab === "semanal" && (
        <WeeklyDietEditor
          weeklyPlan={weeklyDietPlan}
          acting={acting}
          onSave={async (days) => {
            const result = await saveStudentWeeklyDiet(student.userId, days)
            setWeeklyDietPlan(result.weeklyDiet)
          }}
        />
      )}
    </div>
  )
}
