"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateAdminCoach, deleteAdminCoach } from "@/lib/api/admin"
import { useCockpit } from "../cockpit-context"

export function CoachesScreen() {
  const { coaches, setCoaches, acting, act } = useCockpit()

  return (
    <div className="p-5">
      <div className="grid gap-3">
        {coaches.map((coach) => (
          <div
            key={coach.userId}
            className="rounded-xl border border-white/7 bg-white/[0.035] p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-white">{coach.name || coach.userId}</p>
                <p className="font-mono text-[10px] text-white/35">
                  {coach.email || coach.userId}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                    coach.active
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {coach.active ? "Ativo" : "Pausado"}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  disabled={acting}
                  onClick={() =>
                    void act(async () => {
                      const next = await updateAdminCoach(coach.userId, { active: !coach.active })
                      setCoaches((prev) =>
                        prev.map((c) => (c.userId === coach.userId ? next.coach : c))
                      )
                    }, coach.active ? "Coach pausado." : "Coach ativado.")
                  }
                >
                  {coach.active ? "Pausar" : "Ativar"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500 hover:text-white"
                  disabled={acting}
                  onClick={() => {
                    if (!window.confirm("Excluir coach? Reatribua alunos antes.")) return
                    void act(async () => {
                      await deleteAdminCoach(coach.userId)
                      setCoaches((prev) => prev.filter((c) => c.userId !== coach.userId))
                    }, "Coach excluído.")
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {!coaches.length && (
          <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-sm text-white/35">
            Nenhum coach cadastrado.
          </div>
        )}
      </div>
    </div>
  )
}
