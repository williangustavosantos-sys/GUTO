"use client"

import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateAdminStudent } from "@/lib/api/admin"
import { TRAINING_LOCATION_LABELS, BIOLOGICAL_SEX_LABELS, TRAINING_GOAL_LABELS, TRAINING_LEVEL_LABELS } from "@/lib/format-codes"
import { useCockpit } from "../cockpit-context"
import { Panel, Field } from "../ui"

export function TabCalibragem() {
  const { selectedDetail, calibrationDraft, setCalibrationDraft, acting, act } = useCockpit()

  if (!selectedDetail) return null
  const { student } = selectedDetail

  const patch = (val: Partial<typeof calibrationDraft>) =>
    setCalibrationDraft((d) => ({ ...d, ...val }))

  return (
    <Panel title="Calibragem do aluno">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">
            Sexo biológico
          </span>
          <select
            value={calibrationDraft.biologicalSex}
            onChange={(e) => patch({ biologicalSex: e.target.value })}
            className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
          >
            <option value="" className="bg-[#0d1426]">Selecionar</option>
            {Object.entries(BIOLOGICAL_SEX_LABELS).map(([code, label]) => (
              <option key={code} value={code} className="bg-[#0d1426]">{label}</option>
            ))}
          </select>
        </label>

        <Field
          label="Idade"
          value={calibrationDraft.userAge}
          onChange={(userAge) => patch({ userAge })}
          type="number"
          placeholder="Ex: 28"
        />

        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">
            Nível de treino
          </span>
          <select
            value={calibrationDraft.trainingLevel}
            onChange={(e) => patch({ trainingLevel: e.target.value })}
            className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
          >
            <option value="" className="bg-[#0d1426]">Selecionar</option>
            {Object.entries(TRAINING_LEVEL_LABELS).map(([code, label]) => (
              <option key={code} value={code} className="bg-[#0d1426]">{label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">
            Objetivo
          </span>
          <select
            value={calibrationDraft.trainingGoal}
            onChange={(e) => patch({ trainingGoal: e.target.value })}
            className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
          >
            <option value="" className="bg-[#0d1426]">Selecionar</option>
            {Object.entries(TRAINING_GOAL_LABELS).map(([code, label]) => (
              <option key={code} value={code} className="bg-[#0d1426]">{label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">
            Local preferido
          </span>
          <select
            value={calibrationDraft.preferredTrainingLocation}
            onChange={(e) => patch({ preferredTrainingLocation: e.target.value })}
            className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
          >
            <option value="" className="bg-[#0d1426]">Selecionar</option>
            {Object.entries(TRAINING_LOCATION_LABELS).map(([code, label]) => (
              <option key={code} value={code} className="bg-[#0d1426]">{label}</option>
            ))}
          </select>
        </label>

        <Field
          label="País"
          value={calibrationDraft.country}
          onChange={(country) => patch({ country })}
          placeholder="Ex: BR"
        />

        <Field
          label="Altura (cm)"
          value={calibrationDraft.heightCm}
          onChange={(heightCm) => patch({ heightCm })}
          type="number"
          placeholder="Ex: 175"
        />

        <Field
          label="Peso (kg)"
          value={calibrationDraft.weightKg}
          onChange={(weightKg) => patch({ weightKg })}
          type="number"
          placeholder="Ex: 80"
        />

        <Field
          label="Dor ou limitação"
          value={calibrationDraft.trainingPathology}
          onChange={(trainingPathology) => patch({ trainingPathology })}
          className="md:col-span-2"
          placeholder="Ex: dor no joelho"
        />

        <Field
          label="Restrições alimentares"
          value={calibrationDraft.foodRestrictions}
          onChange={(foodRestrictions) => patch({ foodRestrictions })}
          className="md:col-span-2"
          placeholder="Ex: sem lactose"
        />
      </div>

      <Button
        className="mt-5 bg-[#00e5ff] text-[#0a0f1e] hover:bg-white"
        disabled={acting}
        onClick={() =>
          void act(async () => {
            await updateAdminStudent(student.userId, {
              calibration: {
                ...calibrationDraft,
                userAge: calibrationDraft.userAge ? Number(calibrationDraft.userAge) : undefined,
                heightCm: calibrationDraft.heightCm
                  ? Number(calibrationDraft.heightCm)
                  : undefined,
                weightKg: calibrationDraft.weightKg
                  ? Number(calibrationDraft.weightKg)
                  : undefined,
              },
            })
          }, "Calibragem atualizada.")
        }
      >
        <Save className="mr-2 h-4 w-4" />
        Salvar calibragem
      </Button>
    </Panel>
  )
}
