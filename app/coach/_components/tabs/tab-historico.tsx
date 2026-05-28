"use client"

import { useCockpit } from "../cockpit-context"
import { Panel, LogList } from "../ui"
import { usePanelI18n } from "@/lib/panel-i18n"

export function TabHistorico() {
  const { selectedDetail } = useCockpit()
  const { t } = usePanelI18n()
  if (!selectedDetail) return null

  return (
    <div className="grid gap-4">
      <Panel title={t.tabHistorico.panelWorkout}>
        <LogList logs={selectedDetail.workoutHistory} empty={t.tabHistorico.emptyWorkout} />
      </Panel>
      <Panel title={t.tabHistorico.panelDiet}>
        <LogList logs={selectedDetail.dietHistory} empty={t.tabHistorico.emptyDiet} />
      </Panel>
      <Panel title={t.tabHistorico.panelGeneral}>
        <LogList logs={selectedDetail.logs} empty={t.tabHistorico.emptyGeneral} />
      </Panel>
    </div>
  )
}
