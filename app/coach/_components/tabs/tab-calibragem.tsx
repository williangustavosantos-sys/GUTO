"use client"

import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateAdminStudent } from "@/lib/api/admin"
import { useCockpit } from "../cockpit-context"
import { Panel, Field } from "../ui"
import { usePanelI18n } from "@/lib/panel-i18n"

export function TabCalibragem() {
  const { selectedDetail, calibrationDraft, setCalibrationDraft, acting, act } = useCockpit()
  const { t } = usePanelI18n()

  if (!selectedDetail) return null
  const { student } = selectedDetail

  const patch = (val: Partial<typeof calibrationDraft>) =>
    setCalibrationDraft((d) => ({ ...d, ...val }))

  return (
    <Panel title={t.tabCalibragem.panelTitle}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
            {t.tabCalibragem.fieldBiologicalSex}
          </span>
          <select
            value={calibrationDraft.biologicalSex}
            onChange={(e) => patch({ biologicalSex: e.target.value })}
            className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
          >
            <option value="" className="bg-white">{t.tabCalibragem.selectPlaceholder}</option>
            {Object.entries(t.tabCalibragem.biologicalSex).map(([code, label]) => (
              <option key={code} value={code} className="bg-white">{label}</option>
            ))}
          </select>
        </label>

        <Field
          label={t.tabCalibragem.fieldAge}
          value={calibrationDraft.userAge}
          onChange={(userAge) => patch({ userAge })}
          type="number"
          placeholder={t.tabCalibragem.placeholderAge}
        />

        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
            {t.tabCalibragem.fieldTrainingLevel}
          </span>
          <select
            value={calibrationDraft.trainingLevel}
            onChange={(e) => patch({ trainingLevel: e.target.value })}
            className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
          >
            <option value="" className="bg-white">{t.tabCalibragem.selectPlaceholder}</option>
            {Object.entries(t.tabCalibragem.trainingLevel).map(([code, label]) => (
              <option key={code} value={code} className="bg-white">{label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
            {t.tabCalibragem.fieldGoal}
          </span>
          <select
            value={calibrationDraft.trainingGoal}
            onChange={(e) => patch({ trainingGoal: e.target.value })}
            className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
          >
            <option value="" className="bg-white">{t.tabCalibragem.selectPlaceholder}</option>
            {Object.entries(t.tabCalibragem.trainingGoal).map(([code, label]) => (
              <option key={code} value={code} className="bg-white">{label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
            {t.tabCalibragem.fieldPreferredLocation}
          </span>
          <select
            value={calibrationDraft.preferredTrainingLocation}
            onChange={(e) => patch({ preferredTrainingLocation: e.target.value })}
            className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
          >
            <option value="" className="bg-white">{t.tabCalibragem.selectPlaceholder}</option>
            {Object.entries(t.tabCalibragem.trainingLocation).map(([code, label]) => (
              <option key={code} value={code} className="bg-white">{label}</option>
            ))}
          </select>
        </label>

        <Field
          label={t.tabCalibragem.fieldCountry}
          value={calibrationDraft.country}
          onChange={(country) => patch({ country })}
          placeholder={t.tabCalibragem.placeholderCountry}
        />

        <Field
          label={t.tabCalibragem.fieldCity}
          value={calibrationDraft.city}
          onChange={(city) => patch({ city })}
          placeholder={t.tabCalibragem.placeholderCity}
        />

        <Field
          label={t.tabCalibragem.fieldHeightCm}
          value={calibrationDraft.heightCm}
          onChange={(heightCm) => patch({ heightCm })}
          type="number"
          placeholder={t.tabCalibragem.placeholderHeight}
        />

        <Field
          label={t.tabCalibragem.fieldWeightKg}
          value={calibrationDraft.weightKg}
          onChange={(weightKg) => patch({ weightKg })}
          type="number"
          placeholder={t.tabCalibragem.placeholderWeight}
        />

        <Field
          label={t.tabCalibragem.fieldPathology}
          value={calibrationDraft.trainingPathology}
          onChange={(trainingPathology) => patch({ trainingPathology })}
          className="md:col-span-2"
          placeholder={t.tabCalibragem.placeholderPathology}
        />

        <Field
          label={t.tabCalibragem.fieldFoodRestrictions}
          value={calibrationDraft.foodRestrictions}
          onChange={(foodRestrictions) => patch({ foodRestrictions })}
          className="md:col-span-2"
          placeholder={t.tabCalibragem.placeholderFoodRestrictions}
        />
      </div>

      <Button
        className="mt-5 bg-[#0891B2] text-slate-900 hover:bg-[#0E7490]"
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
          }, t.tabCalibragem.toastSaved)
        }
      >
        <Save className="mr-2 h-4 w-4" />
        {t.tabCalibragem.saveBtn}
      </Button>
    </Panel>
  )
}
