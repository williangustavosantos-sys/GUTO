"use client"

import { useState } from "react"
import { Building2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { updateAdminTeam } from "@/lib/api/admin"
import { useCockpit } from "../cockpit-context"
import { Field } from "../ui"
import { formatHuman, type TeamDraft } from "../utils"

export function TeamsScreen() {
  const {
    teams, setTeams,
    acting, act,
    selectedTeamId, setSelectedTeamId,
    setStudentDraft, setCoachDraft,
    setShowCreateTeam,
  } = useCockpit()

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<TeamDraft>({
    name: "", plan: "pro", maxStudents: "", maxCoaches: "",
  })

  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] text-white/35">
          Selecione um Time para criar coaches e alunos nele.
        </p>
        <Button
          size="sm"
          onClick={() => setShowCreateTeam(true)}
          className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white"
        >
          <Building2 className="mr-2 h-3.5 w-3.5" />
          Criar Time
        </Button>
      </div>

      {!selectedTeamId && (
        <div className="mb-4 rounded-xl border border-[#00e5ff]/20 bg-[#00e5ff]/5 p-3 text-center text-[10px] font-bold text-[#00e5ff]/70">
          Selecione um Time abaixo.
        </div>
      )}

      <div className="grid gap-3">
        {teams.map((team) => {
          const isSelected = selectedTeamId === team.id
          const isEditing = editingTeamId === team.id

          return (
            <div
              key={team.id}
              className={`rounded-xl border p-4 transition ${
                isSelected
                  ? "border-[#00e5ff]/50 bg-[#00e5ff]/[0.06]"
                  : "border-white/7 bg-white/[0.035]"
              }`}
            >
              {isEditing ? (
                <div className="grid gap-3">
                  <Field
                    label="Nome"
                    value={editDraft.name}
                    onChange={(name) => setEditDraft((d) => ({ ...d, name }))}
                  />
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">
                      Plano
                    </span>
                    <select
                      value={editDraft.plan}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, plan: e.target.value as TeamDraft["plan"] }))
                      }
                      className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                    >
                      {(["start", "pro", "elite", "custom"] as const).map((p) => (
                        <option key={p} value={p} className="bg-[#0d1426]">
                          {formatHuman(p)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {editDraft.plan === "custom" && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field
                        label="Máx. alunos (vazio = ilimitado)"
                        value={editDraft.maxStudents}
                        onChange={(v) => setEditDraft((d) => ({ ...d, maxStudents: v }))}
                      />
                      <Field
                        label="Máx. coaches (vazio = ilimitado)"
                        value={editDraft.maxCoaches}
                        onChange={(v) => setEditDraft((d) => ({ ...d, maxCoaches: v }))}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={acting}
                      onClick={() =>
                        void act(async () => {
                          const customLimits =
                            editDraft.plan === "custom"
                              ? {
                                  maxStudents: editDraft.maxStudents
                                    ? Number(editDraft.maxStudents) || null
                                    : null,
                                  maxCoaches: editDraft.maxCoaches
                                    ? Number(editDraft.maxCoaches) || null
                                    : null,
                                }
                              : undefined
                          const result = await updateAdminTeam(team.id, {
                            name: editDraft.name,
                            plan: editDraft.plan,
                            customLimits,
                          })
                          setTeams((prev) =>
                            prev.map((t) => (t.id === team.id ? result.team : t))
                          )
                          setEditingTeamId(null)
                        }, "Time atualizado.")
                      }
                      className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white"
                    >
                      <Save className="mr-1 h-3 w-3" />
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white"
                      onClick={() => setEditingTeamId(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white/50 hover:text-white"
                      disabled={acting}
                      onClick={() =>
                        void act(async () => {
                          const next = team.status === "archived" ? "active" : "archived"
                          const result = await updateAdminTeam(team.id, { status: next })
                          setTeams((prev) =>
                            prev.map((t) => (t.id === team.id ? result.team : t))
                          )
                          setEditingTeamId(null)
                        }, team.status === "archived" ? "Time reativado." : "Time arquivado.")
                      }
                    >
                      {team.status === "archived" ? "Reativar" : "Arquivar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <p className={`font-black ${isSelected ? "text-[#00e5ff]" : "text-white"}`}>
                        {team.name}
                      </p>
                      {isSelected && (
                        <Badge className="bg-[#00e5ff] text-[#0a0f1e] text-[9px] font-black">
                          SELECIONADO
                        </Badge>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-white/35">
                      {team.id} · {formatHuman(team.plan)}
                    </p>
                    {team.customLimits && (
                      <p className="mt-1 font-mono text-[10px] text-white/25">
                        Alunos: {team.customLimits.maxStudents ?? "Ilimitado"} · Coaches:{" "}
                        {team.customLimits.maxCoaches ?? "Ilimitado"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={team.status === "active" ? "default" : "secondary"}
                      className="text-[10px] font-black uppercase"
                    >
                      {formatHuman(team.status)}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white"
                      onClick={() => {
                        setEditingTeamId(team.id)
                        setEditDraft({
                          name: team.name,
                          plan: team.plan,
                          maxStudents: String(team.customLimits?.maxStudents ?? ""),
                          maxCoaches: String(team.customLimits?.maxCoaches ?? ""),
                        })
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      className={
                        isSelected
                          ? "bg-white/10 text-white"
                          : "bg-[#00e5ff] text-[#0a0f1e] hover:bg-white"
                      }
                      onClick={() => {
                        const next = isSelected ? null : team.id
                        setSelectedTeamId(next)
                        if (next) {
                          setStudentDraft((d) => ({ ...d, teamId: next }))
                          setCoachDraft((d) => ({ ...d, teamId: next }))
                        }
                      }}
                    >
                      {isSelected ? "Desselecionar" : "Selecionar"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {!teams.length && (
          <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-sm text-white/35">
            Nenhum Time cadastrado.
          </div>
        )}
      </div>
    </div>
  )
}
