"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useCockpit } from "./cockpit-context"
import { getStatusInfo, DETAIL_TABS } from "./utils"
import { TabResumo } from "./tabs/tab-resumo"
import { TabCalibragem } from "./tabs/tab-calibragem"
import { TabTreino } from "./tabs/tab-treino"
import { TabDieta } from "./tabs/tab-dieta"
import { TabHistorico } from "./tabs/tab-historico"
import { TabAcesso } from "./tabs/tab-acesso"

export function StudentDrawer() {
  const { selectedDetail, closeStudent, detailTab, setDetailTab } = useCockpit()
  const selected = selectedDetail?.student ?? null

  return (
    <Sheet open={!!selectedDetail} onOpenChange={(open) => { if (!open) closeStudent() }}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-white/10 bg-[#0d1426] p-0 text-white sm:max-w-4xl"
      >
        {selected && selectedDetail && (
          <div className="min-h-full">
            {/* Header */}
            <SheetHeader className="border-b border-white/10 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge className="bg-[#00e5ff] text-[#0a0f1e] text-[9px] font-black">
                      STUDENT
                    </Badge>
                    <span className="truncate font-mono text-[10px] text-white/30">
                      {selected.userId}
                    </span>
                  </div>
                  <SheetTitle className="truncate text-2xl font-black text-white">
                    {selected.name}
                  </SheetTitle>
                </div>
                <Badge
                  variant={getStatusInfo(selected).variant}
                  className="shrink-0 text-[10px] font-black uppercase"
                >
                  {getStatusInfo(selected).text}
                </Badge>
              </div>
            </SheetHeader>

            {/* Tab bar */}
            <div className="sticky top-0 z-10 overflow-x-auto border-b border-white/10 bg-[#0d1426]/95 px-4 py-3 backdrop-blur">
              <div className="flex min-w-max gap-1.5">
                {DETAIL_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`rounded-full px-3.5 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                      detailTab === tab.id
                        ? "bg-[#00e5ff] text-[#0a0f1e]"
                        : "bg-white/5 text-white/45 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="p-6">
              {detailTab === "resumo" && <TabResumo />}
              {detailTab === "calibragem" && <TabCalibragem />}
              {detailTab === "treino" && <TabTreino />}
              {detailTab === "dieta" && <TabDieta />}
              {detailTab === "historico" && <TabHistorico />}
              {detailTab === "acesso" && <TabAcesso />}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
