"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { adminErrorMessage } from "../utils"
import { LogList } from "../ui"
import { useCockpit } from "../cockpit-context"

export function LogsScreen() {
  const { globalLogs, fetchGlobalLogs } = useCockpit()

  useEffect(() => {
    void fetchGlobalLogs().catch((err) => toast.error(adminErrorMessage(err)))
  }, [fetchGlobalLogs])

  return (
    <div className="p-5">
      <LogList logs={globalLogs} empty="Sem logs globais." />
    </div>
  )
}
