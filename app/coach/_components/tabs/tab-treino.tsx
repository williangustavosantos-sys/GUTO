"use client"

import { useState, useEffect } from "react"
import {
  Dumbbell, FileVideo, Lock, Plus, RefreshCw, Save, Trash2, Unlock,
} from "lucide-react"
import { toast } from "sonner"
import { ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  updateAdminStudentWorkout,
  generateAdminStudentWorkout,
  lockAdminStudentWorkout,
  unlockAdminStudentWorkout,
  resetAdminStudentWorkout,
  updateAdminStudentWeeklyWorkout,
  createAdminCustomExercise,
  type AdminCatalogExercise,
  type AdminStudent,
  type AdminWeeklyWorkoutPlan,
  type AdminWeeklyWorkoutDays,
  type AdminLog,
  type WeekDayKey,
} from "@/lib/api/admin"
import type { GutoWorkoutPlan, GutoWorkoutExercise } from "@/lib/api/guto"
import { TRAINING_LOCATION_LABELS } from "@/lib/format-codes"
import { useCockpit } from "../cockpit-context"
import { Panel, Field, PlanStatus, LogList } from "../ui"
import {
  blankExercise, blankWorkout, normalizeWorkoutForEditor,
  hasInvalidWorkoutExerciseContract, normalizeCatalogSearch, catalogSearchText,
  workoutExerciseFromCatalog, blankCustomExerciseDraft, validateCustomExerciseDraft,
  WEEK_DAYS, EXERCISE_VIDEO_LIMIT_COPY,
  type CustomExerciseDraft,
} from "../utils"

// ─── WorkoutEditor ────────────────────────────────────────────────────────────

function WorkoutEditor({
  student, value, exerciseCatalog, history, acting,
  onChange, onSave, onCreateManual, onGenerate, onLock, onReset,
}: {
  student: AdminStudent
  value: GutoWorkoutPlan
  exerciseCatalog: AdminCatalogExercise[]
  history: AdminLog[]
  acting: boolean
  onChange: (v: GutoWorkoutPlan) => void
  onSave: () => void
  onCreateManual: () => void
  onGenerate: () => void
  onLock: () => void
  onReset: () => void
}) {
  const [exerciseSearch, setExerciseSearch] = useState<Record<number, string>>({})
  const [customDraft, setCustomDraft] = useState<CustomExerciseDraft>(blankCustomExerciseDraft())
  const [creatingCustom, setCreatingCustom] = useState(false)

  const updateExercise = (i: number, patch: Partial<GutoWorkoutExercise>) =>
    onChange({ ...value, exercises: value.exercises.map((e, idx) => idx === i ? { ...e, ...patch } : e) })

  const selectCatalog = (i: number, cat: AdminCatalogExercise) => {
    onChange({
      ...value,
      exercises: value.exercises.map((e, idx) =>
        idx === i ? workoutExerciseFromCatalog(cat, e, i) : e
      ),
    })
    setExerciseSearch((s) => ({ ...s, [i]: "" }))
  }

  const removeExercise = (i: number) =>
    onChange({ ...value, exercises: value.exercises.filter((_, idx) => idx !== i) })

  const moveExercise = (i: number, dir: -1 | 1) => {
    const next = [...value.exercises]
    const target = i + dir
    if (target < 0 || target >= next.length) return
    ;[next[i], next[target]] = [next[target], next[i]]
    onChange({ ...value, exercises: next.map((e, idx) => ({ ...e, order: idx + 1 })) })
  }

  const submitCustom = async () => {
    const err = validateCustomExerciseDraft(customDraft)
    if (err) { toast.error(err); return }
    setCreatingCustom(true)
    try {
      await createAdminCustomExercise({
        id: customDraft.id.trim() || undefined,
        canonicalNamePt: customDraft.canonicalNamePt.trim(),
        muscleGroup: customDraft.muscleGroup,
        equipment: customDraft.equipment.trim() || undefined,
        sourceFileName: customDraft.sourceFileName.trim(),
        videoUrl: customDraft.videoUrl.trim(),
        fileSizeBytes: Number(customDraft.fileSizeBytes),
        durationSeconds: Number(customDraft.durationSeconds),
        width: Number(customDraft.width),
        height: Number(customDraft.height),
        fps: Number(customDraft.fps),
        mimeType: "video/mp4",
        hasAudio: customDraft.hasAudio,
      })
      toast.success("Exercício enviado para aprovação técnica.")
      setCustomDraft(blankCustomExerciseDraft())
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message || "Erro no vídeo." : String(error))
    } finally {
      setCreatingCustom(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Panel title="Treino oficial">
        <PlanStatus source={value.source} locked={value.lockedByCoach} />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Título" value={value.title || ""} onChange={(title) => onChange({ ...value, title, focus: title || value.focus })} />
          <Field label="Foco / grupo muscular" value={value.focus || ""} onChange={(focus) => onChange({ ...value, focus })} />
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Dia</span>
            <select value={value.weekDay || "today"} onChange={(e) => onChange({ ...value, weekDay: e.target.value })} className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900">
              {["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"].map((d) => (
                <option key={d} value={d} className="bg-white">{d}</option>
              ))}
              <option value="today" className="bg-white">Hoje ({["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][new Date().getDay()]})</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Local</span>
            <select value={value.location || ""} onChange={(e) => onChange({ ...value, location: e.target.value })} className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900">
              <option value="" className="bg-white">Selecionar</option>
              {Object.entries(TRAINING_LOCATION_LABELS).map(([code, label]) => (
                <option key={code} value={code} className="bg-white">{label}</option>
              ))}
            </select>
          </label>
          <Field label="Duração estimada (min)" value={String(value.estimatedDurationMinutes || "")} onChange={(v) => onChange({ ...value, estimatedDurationMinutes: Number(v) || undefined })} />
          <Field label="Dificuldade" value={value.difficulty || ""} onChange={(v) => onChange({ ...value, difficulty: v })} />
          <Field label="Observações do coach" value={value.coachNotes || ""} onChange={(v) => onChange({ ...value, coachNotes: v, summary: v || value.summary })} className="md:col-span-2" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="bg-[#0891B2] text-slate-900 hover:bg-[#0E7490]" disabled={acting} onClick={onSave}><Save className="mr-2 h-4 w-4" />Salvar</Button>
          <Button variant="outline" className="border-slate-200 bg-slate-50 text-slate-900" disabled={acting} onClick={onCreateManual}><Dumbbell className="mr-2 h-4 w-4" />Treino manual</Button>
          <Button variant="outline" className="border-slate-200 bg-slate-50 text-slate-900" disabled={acting} onClick={onGenerate}><RefreshCw className="mr-2 h-4 w-4" />Gerar com GUTO</Button>
          <Button variant="outline" className="border-slate-200 bg-slate-50 text-slate-900" disabled={acting} onClick={() => onChange({ ...value, title: `${value.title || value.focus} cópia`, source: "coach_manual", lockedByCoach: true })}>Duplicar</Button>
          <Button variant="outline" className="border-slate-200 bg-slate-50 text-slate-900" disabled={acting} onClick={onLock}>
            {value.lockedByCoach ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
            {value.lockedByCoach ? "Permitir GUTO atualizar" : "Bloquear auto-atualização"}
          </Button>
          <Button variant="outline" className="border-red-300 bg-transparent text-red-600" disabled={acting} onClick={onReset}><Trash2 className="mr-2 h-4 w-4" />Resetar treino</Button>
        </div>
      </Panel>

      <Panel title={`Exercícios de ${student.name}`}>
        <div className="grid gap-3">
          {value.exercises.map((exercise, index) => {
            const catEx = exerciseCatalog.find((c) => c.id === exercise.id)
            const searchTerm = exerciseSearch[index] ?? ""
            const normalizedSearch = normalizeCatalogSearch(searchTerm)
            const matches = normalizedSearch ? exerciseCatalog.filter((c) => catalogSearchText(c).includes(normalizedSearch)).slice(0, 8) : []

            return (
              <div key={`${exercise.id}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-400">#{index + 1}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-8 border-slate-200 bg-slate-50 text-slate-900" onClick={() => moveExercise(index, -1)}>↑</Button>
                    <Button size="sm" variant="outline" className="h-8 border-slate-200 bg-slate-50 text-slate-900" onClick={() => moveExercise(index, 1)}>↓</Button>
                    <Button size="sm" variant="outline" className="h-8 border-red-300 bg-transparent text-red-600" onClick={() => removeExercise(index)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                <div className="mb-3 grid gap-2 md:grid-cols-[1fr_7rem]">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Exercício oficial</span>
                    <Input
                      value={searchTerm}
                      onChange={(e) => setExerciseSearch((s) => ({ ...s, [index]: e.target.value }))}
                      placeholder={catEx ? catEx.canonicalNamePt : "Pesquisar catálogo"}
                      className="h-10 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                    />
                  </label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Catálogo</span>
                    <span className={catEx ? "text-xs font-black text-[#0E7490]" : "text-xs font-black text-red-600"}>
                      {catEx ? catEx.id : "Não selecionado"}
                    </span>
                  </div>
                </div>

                {matches.length > 0 && (
                  <div className="mb-3 grid gap-1.5">
                    {matches.map((item) => (
                      <button key={item.id} type="button" onClick={() => selectCatalog(index, item)}
                        className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:border-[#0E7490]/45">
                        <span className="block text-xs font-black text-slate-900">{item.canonicalNamePt}</span>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">{item.muscleGroup} · {item.id}</span>
                      </button>
                    ))}
                  </div>
                )}

                {!catEx && !normalizedSearch && (
                  <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    Escolha um exercício do catálogo antes de salvar.
                  </p>
                )}

                {catEx && (
                  <div className="mb-3 grid gap-2 md:grid-cols-[7rem_1fr]">
                    <div className="h-[76px] overflow-hidden rounded-md border border-[#0E7490]/40 bg-slate-100">
                      <video src={catEx.videoUrl} muted loop playsInline preload="metadata" className="h-full w-full object-contain" />
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                      <p className="text-sm font-black text-slate-900">{catEx.canonicalNamePt}</p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-slate-400">{catEx.muscleGroup} · {catEx.equipment || "sem equipamento"}</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-4">
                  <Field label="Séries" value={String(exercise.sets)} onChange={(v) => updateExercise(index, { sets: Number(v) || 0 })} />
                  <Field label="Reps" value={String(exercise.reps)} onChange={(v) => updateExercise(index, { reps: v })} />
                  <Field label="Carga" value={String(exercise.load || "")} onChange={(v) => updateExercise(index, { load: v })} />
                  <Field label="Intervalo" value={exercise.rest} onChange={(v) => updateExercise(index, { rest: v })} />
                  <Field label="Técnica" value={exercise.cue || ""} onChange={(v) => updateExercise(index, { cue: v })} className="md:col-span-2" />
                  <Field label="Observação" value={exercise.note || ""} onChange={(v) => updateExercise(index, { note: v })} className="md:col-span-2" />
                  <Field label="Substituições" value={(exercise.alternatives || []).join(", ")} onChange={(v) => updateExercise(index, { alternatives: v.split(",").map((s) => s.trim()).filter(Boolean) })} className="md:col-span-4" />
                </div>
              </div>
            )
          })}
        </div>
        <Button variant="outline" className="mt-4 border-slate-200 bg-slate-50 text-slate-900" onClick={() => onChange({ ...value, exercises: [...value.exercises, blankExercise(value.exercises.length)] })}>
          <Plus className="mr-2 h-4 w-4" />Adicionar exercício
        </Button>
      </Panel>

      <Panel title="Enviar exercício personalizado">
        <div className="mb-3 rounded-md border border-[#0E7490]/30 bg-cyan-50 px-3 py-2">
          <p className="text-xs font-bold text-[#155E75]">{EXERCISE_VIDEO_LIMIT_COPY}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Nome oficial" value={customDraft.canonicalNamePt} onChange={(v) => setCustomDraft((d) => ({ ...d, canonicalNamePt: v }))} className="md:col-span-2" />
          <Field label="ID opcional" value={customDraft.id} onChange={(v) => setCustomDraft((d) => ({ ...d, id: v }))} />
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Grupo</span>
            <select value={customDraft.muscleGroup} onChange={(e) => setCustomDraft((d) => ({ ...d, muscleGroup: e.target.value }))} className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900">
              {["aquecimento","peito","costas","ombro","bracos","pernas","abdomen"].map((g) => <option key={g} value={g} className="bg-white">{g}</option>)}
            </select>
          </label>
          <Field label="Equipamento" value={customDraft.equipment} onChange={(v) => setCustomDraft((d) => ({ ...d, equipment: v }))} />
          <Field label="Arquivo MP4 seguro" value={customDraft.sourceFileName} onChange={(v) => setCustomDraft((d) => ({ ...d, sourceFileName: v }))} />
          <Field label="Caminho interno" value={customDraft.videoUrl} onChange={(v) => setCustomDraft((d) => ({ ...d, videoUrl: v }))} className="md:col-span-2" />
          <Field label="Bytes" value={customDraft.fileSizeBytes} onChange={(v) => setCustomDraft((d) => ({ ...d, fileSizeBytes: v }))} />
          <Field label="Duração s" value={customDraft.durationSeconds} onChange={(v) => setCustomDraft((d) => ({ ...d, durationSeconds: v }))} />
          <Field label="Width" value={customDraft.width} onChange={(v) => setCustomDraft((d) => ({ ...d, width: v }))} />
          <Field label="Height" value={customDraft.height} onChange={(v) => setCustomDraft((d) => ({ ...d, height: v }))} />
          <Field label="FPS" value={customDraft.fps} onChange={(v) => setCustomDraft((d) => ({ ...d, fps: v }))} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={customDraft.hasAudio} onChange={(e) => setCustomDraft((d) => ({ ...d, hasAudio: e.target.checked }))} />
          Vídeo tem áudio
        </label>
        <Button className="mt-4 bg-[#0891B2] text-slate-900 hover:bg-[#0E7490]" disabled={acting || creatingCustom} onClick={() => void submitCustom()}>
          <FileVideo className="mr-2 h-4 w-4" />Enviar para aprovação
        </Button>
      </Panel>

      <Panel title="Histórico do treino">
        <LogList logs={history} empty="Sem histórico de treino." />
      </Panel>
    </div>
  )
}

// ─── WeeklyWorkoutEditor ──────────────────────────────────────────────────────

function WeeklyWorkoutEditor({
  student, weeklyPlan, exerciseCatalog, acting, onSave,
}: {
  student: AdminStudent
  weeklyPlan: AdminWeeklyWorkoutPlan | null
  exerciseCatalog: AdminCatalogExercise[]
  acting: boolean
  onSave: (days: AdminWeeklyWorkoutDays) => Promise<void>
}) {
  const [days, setDays] = useState<AdminWeeklyWorkoutDays>(() => weeklyPlan?.days ?? {})
  const [expandedDay, setExpandedDay] = useState<WeekDayKey | null>(null)
  const [daySearch, setDaySearch] = useState<Record<WeekDayKey, string>>({} as Record<WeekDayKey, string>)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setDays(weeklyPlan?.days ?? {}) }, [weeklyPlan])

  function blankDayPlan(): GutoWorkoutPlan {
    return {
      studentId: student.userId, title: "Treino do dia", focus: "Treino do dia",
      dateLabel: "Hoje", scheduledFor: new Date().toISOString(), summary: "",
      source: "coach_manual", lockedByCoach: true, manualOverride: true,
      exercises: [], blocks: [],
    }
  }

  function setDayPlan(day: WeekDayKey, plan: GutoWorkoutPlan | undefined) {
    setDays((curr) => {
      const next = { ...curr }
      if (plan === undefined) delete next[day]
      else next[day] = plan
      return next
    })
  }

  function addExFromCatalog(day: WeekDayKey, cat: AdminCatalogExercise) {
    const curr = days[day] ?? blankDayPlan()
    const idx = curr.exercises.length
    const ex = workoutExerciseFromCatalog(cat, blankExercise(idx), idx)
    setDayPlan(day, { ...curr, exercises: [...curr.exercises, ex], blocks: [{ name: "Principal", exercises: [...curr.exercises, ex] }] })
    setDaySearch((s) => ({ ...s, [day]: "" }))
  }

  function removeExFromDay(day: WeekDayKey, i: number) {
    const curr = days[day]
    if (!curr) return
    const exercises = curr.exercises.filter((_, idx) => idx !== i)
    setDayPlan(day, { ...curr, exercises, blocks: [{ name: "Principal", exercises }] })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(days)
      toast.success("Plano semanal salvo.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar plano semanal.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel title="Plano semanal de treino">
      <p className="mb-4 text-[11px] text-slate-500">Monte o treino de cada dia. O aluno vê apenas o treino do dia atual no app.</p>
      <div className="space-y-2">
        {WEEK_DAYS.map(({ key, label, short }) => {
          const plan = days[key]
          const isExpanded = expandedDay === key
          const exerciseCount = plan?.exercises?.length ?? 0
          const query = normalizeCatalogSearch(daySearch[key] ?? "")
          const catalogResults = query.length >= 2 ? exerciseCatalog.filter((e) => catalogSearchText(e).includes(query)).slice(0, 8) : []

          return (
            <div key={key} className="rounded-lg border border-slate-200 bg-slate-50">
              <button className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setExpandedDay(isExpanded ? null : key)}>
                <div className="flex items-center gap-3">
                  <span className="w-8 text-[11px] font-black uppercase tracking-widest text-slate-500">{short}</span>
                  <span className="text-sm font-semibold text-slate-900">{label}</span>
                  {plan && exerciseCount > 0 && (
                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-[#0E7490]">{exerciseCount} ex.</span>
                  )}
                  {!plan && <span className="text-xs text-slate-300">Descanso</span>}
                </div>
                <span className="text-slate-400">{isExpanded ? "▲" : "▼"}</span>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-200 px-4 pb-4 pt-3 space-y-3">
                  {plan && (
                    <>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Foco do dia</span>
                          <Input value={plan.focus || ""} onChange={(e) => setDayPlan(key, { ...plan, focus: e.target.value, title: e.target.value })} placeholder="Ex: Peito + tríceps" className="h-9 border-slate-200 bg-slate-50 text-sm text-slate-900" />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Notas do coach</span>
                          <Input value={plan.coachNotes || ""} onChange={(e) => setDayPlan(key, { ...plan, coachNotes: e.target.value })} placeholder="Observações" className="h-9 border-slate-200 bg-slate-50 text-sm text-slate-900" />
                        </label>
                      </div>
                      {plan.exercises.length > 0 && (
                        <div className="space-y-1">
                          {plan.exercises.map((ex, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                              <span className="min-w-0 flex-1 truncate text-xs text-slate-900">{ex.name || ex.canonicalNamePt || ex.id}</span>
                              <span className="shrink-0 text-[10px] text-slate-400">{ex.sets}×{ex.reps}</span>
                              <button onClick={() => removeExFromDay(key, i)} className="shrink-0 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <div className="relative">
                    <Input value={daySearch[key] ?? ""} onChange={(e) => setDaySearch((s) => ({ ...s, [key]: e.target.value }))} placeholder="Buscar exercício no catálogo…" className="h-9 border-slate-200 bg-slate-50 text-sm text-slate-900" />
                    {catalogResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-10 z-20 rounded-lg border border-slate-200 bg-white shadow-xl">
                        {catalogResults.map((cat) => (
                          <button key={cat.id} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50" onClick={() => addExFromCatalog(key, cat)}>
                            <span className="font-medium text-slate-900">{cat.canonicalNamePt}</span>
                            <span className="text-slate-400">{cat.muscleGroup}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!plan && (
                      <Button size="sm" variant="outline" className="border-[#0E7490]/40 text-[#0E7490] hover:bg-cyan-50" onClick={() => setDayPlan(key, blankDayPlan())}>
                        <Plus className="mr-1 h-3.5 w-3.5" />Adicionar treino
                      </Button>
                    )}
                    {plan && (
                      <Button size="sm" variant="outline" className="border-slate-200 text-slate-500 hover:bg-slate-50" onClick={() => setDayPlan(key, undefined)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" />Remover dia
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-4 border-t border-slate-200 pt-4">
        <Button className="bg-[#0891B2] text-slate-900 hover:bg-[#0E7490]" disabled={acting || saving} onClick={() => void handleSave()}>
          <Save className="mr-2 h-4 w-4" />{saving ? "Salvando…" : "Salvar plano semanal"}
        </Button>
        {weeklyPlan?.updatedAt && (
          <p className="mt-2 text-[10px] text-slate-400">
            Última atualização: {new Date(weeklyPlan.updatedAt).toLocaleString("pt-BR")}
          </p>
        )}
      </div>
    </Panel>
  )
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

export function TabTreino() {
  const {
    selectedDetail, exerciseCatalog,
    workoutEditor, setWorkoutEditor,
    weeklyWorkoutPlan, setWeeklyWorkoutPlan,
    treinoSubTab, setTreinoSubTab,
    acting, act,
  } = useCockpit()

  if (!selectedDetail || !workoutEditor) return null
  const { student } = selectedDetail

  return (
    <div className="space-y-3">
      {/* Sub-tab toggle */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {(["oficial", "semana"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setTreinoSubTab(tab)}
            className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              treinoSubTab === tab ? "bg-[#0891B2] text-slate-900" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab === "oficial" ? "Treino oficial" : "Plano semanal"}
          </button>
        ))}
      </div>

      {treinoSubTab === "oficial" && (
        <WorkoutEditor
          student={student}
          value={workoutEditor}
          exerciseCatalog={exerciseCatalog}
          history={selectedDetail.workoutHistory}
          acting={acting}
          onChange={setWorkoutEditor}
          onSave={() =>
            void act(async () => {
              if (hasInvalidWorkoutExerciseContract(workoutEditor)) {
                toast.error("Escolha um exercício do catálogo oficial antes de salvar.")
                return
              }
              const source =
                selectedDetail.workout?.source === "guto_generated"
                  ? "mixed"
                  : workoutEditor.source || "coach_manual"
              const result = await updateAdminStudentWorkout(
                student.userId,
                { ...workoutEditor, source, blocks: [{ name: "Principal", exercises: workoutEditor.exercises }] },
                "Coach/admin manual edit"
              )
              setWorkoutEditor(normalizeWorkoutForEditor(result.workout, student))
            }, "Treino oficial salvo.")
          }
          onCreateManual={() => setWorkoutEditor(blankWorkout(student))}
          onGenerate={() =>
            void act(async () => {
              const result = await generateAdminStudentWorkout(student.userId)
              setWorkoutEditor(normalizeWorkoutForEditor(result.workout, student))
            }, "Treino gerado pelo GUTO.")
          }
          onLock={() =>
            void act(async () => {
              const result = workoutEditor.lockedByCoach
                ? await unlockAdminStudentWorkout(student.userId)
                : await lockAdminStudentWorkout(student.userId)
              setWorkoutEditor(normalizeWorkoutForEditor(result.workout, student))
            }, workoutEditor.lockedByCoach ? "GUTO pode atualizar treino." : "Treino bloqueado.")
          }
          onReset={() => {
            if (!window.confirm("Resetar treino oficial deste aluno?")) return
            void act(async () => {
              await resetAdminStudentWorkout(student.userId)
              setWorkoutEditor(blankWorkout(student))
            }, "Treino resetado.")
          }}
        />
      )}

      {treinoSubTab === "semana" && (
        <WeeklyWorkoutEditor
          student={student}
          weeklyPlan={weeklyWorkoutPlan}
          exerciseCatalog={exerciseCatalog}
          acting={acting}
          onSave={async (days) => {
            const result = await updateAdminStudentWeeklyWorkout(student.userId, days)
            setWeeklyWorkoutPlan(result.weeklyWorkout)
          }}
        />
      )}
    </div>
  )
}
