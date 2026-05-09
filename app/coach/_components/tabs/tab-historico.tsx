"use client"

import { useCockpit } from "../cockpit-context"
import { Panel, LogList } from "../ui"

export function TabHistorico() {
  const { selectedDetail } = useCockpit()
  if (!selectedDetail) return null

  return (
    <div className="grid gap-4">
      <Panel title="Treino">
        <LogList logs={selectedDetail.workoutHistory} empty="Sem alterações de treino." />
      </Panel>
      <Panel title="Dieta">
        <LogList logs={selectedDetail.dietHistory} empty="Sem alterações de dieta." />
      </Panel>
      <Panel title="Geral">
        <LogList logs={selectedDetail.logs} empty="Sem histórico." />
      </Panel>
    </div>
  )
}
