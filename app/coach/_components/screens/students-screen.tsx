"use client"

import { Copy } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getAdminStudentInvite, regenerateAdminStudentInvite } from "@/lib/api/admin"
import { BIOLOGICAL_SEX_LABELS, SUBSCRIPTION_STATUS_LABELS } from "@/lib/format-codes"
import { useCockpit } from "../cockpit-context"
import { Metric } from "../ui"
import { getStatusInfo, coachLabel, relativeTime, formatHuman } from "../utils"

export function StudentsScreen() {
  const {
    students, coaches,
    search, setSearch,
    filter, setFilter,
    coachFilter, setCoachFilter,
    genderFilter, setGenderFilter,
    minAgeFilter, setMinAgeFilter,
    maxAgeFilter, setMaxAgeFilter,
    subscriptionStatusFilter, setSubscriptionStatusFilter,
    isAdmin,
    openStudent,
  } = useCockpit()

  const FILTERS = ["ativos", "pausados", "arquivados", "todos"] as const

  return (
    <div className="p-5">
      {/* Search + status filter */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por nome, email ou telefone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/25 md:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                filter === tab
                  ? "border-[#00e5ff] bg-[#00e5ff] text-[#0a0f1e]"
                  : "border-white/10 bg-white/5 text-white/45 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced filters */}
      <div
        className={`mb-4 grid gap-2 sm:grid-cols-2 ${
          isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4"
        }`}
      >
        {isAdmin && (
          <select
            value={coachFilter}
            onChange={(e) => setCoachFilter(e.target.value)}
            className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
          >
            <option value="" className="bg-[#0d1426]">Todos os coaches</option>
            {coaches.map((c) => (
              <option key={c.userId} value={c.userId} className="bg-[#0d1426]">
                {c.name || c.email || c.userId}
              </option>
            ))}
          </select>
        )}

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
        >
          <option value="" className="bg-[#0d1426]">Sexo: todos</option>
          {Object.entries(BIOLOGICAL_SEX_LABELS).map(([code, label]) => (
            <option key={code} value={code} className="bg-[#0d1426]">{label}</option>
          ))}
        </select>

        <select
          value={subscriptionStatusFilter}
          onChange={(e) => setSubscriptionStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
        >
          <option value="" className="bg-[#0d1426]">Pagamento: todos</option>
          {Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([code, label]) => (
            <option key={code} value={code} className="bg-[#0d1426]">{label}</option>
          ))}
        </select>

        <Input
          type="number"
          placeholder="Idade mín."
          value={minAgeFilter}
          onChange={(e) => setMinAgeFilter(e.target.value)}
          className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/25"
        />
        <Input
          type="number"
          placeholder="Idade máx."
          value={maxAgeFilter}
          onChange={(e) => setMaxAgeFilter(e.target.value)}
          className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/25"
        />
      </div>

      {/* Student list */}
      <div className="grid gap-2">
        {students.map((student) => {
          const status = getStatusInfo(student)
          return (
            <div
              key={student.userId}
              className="flex flex-col gap-3 rounded-xl border border-white/7 bg-white/[0.035] p-4 transition hover:border-[#00e5ff]/30 hover:bg-white/[0.05] xl:grid xl:grid-cols-[minmax(200px,2fr)_repeat(5,minmax(80px,1fr))_auto_auto] xl:items-center"
            >
              {/* Name + status */}
              <button
                type="button"
                onClick={() => void openStudent(student)}
                className="flex min-w-0 items-center justify-between text-left lg:block"
              >
                <div className="min-w-0">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="truncate text-sm font-black text-white">{student.name}</span>
                    <Badge variant={status.variant} className="shrink-0 text-[9px] font-black uppercase">
                      {status.text}
                    </Badge>
                  </div>
                  <p className="truncate font-mono text-[10px] text-white/30">
                    {student.email || student.userId}
                  </p>
                </div>
                <span className="text-xl text-white/20 lg:hidden">›</span>
              </button>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 xl:contents">
                <Metric label="Coach" value={coachLabel(student, coaches)} />
                <Metric label="XP semana" value={`${student.weeklyXp}`} cyan />
                <Metric label="Visto" value={relativeTime(student.lastActiveAt)} />
                <Metric label="Validação" value={relativeTime(student.lastValidationAt)} />
                <Metric label="Plano" value={formatHuman(student.subscriptionStatus)} />
              </div>

              {/* Copy invite */}
              <button
                type="button"
                title="Copiar convite"
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    const result = await getAdminStudentInvite(student.userId)
                    const link =
                      result.inviteLink ??
                      (await regenerateAdminStudentInvite(student.userId)).inviteLink
                    await navigator.clipboard.writeText(link)
                    toast.success("Link copiado")
                  } catch {
                    toast.error("Não foi possível copiar o convite.")
                  }
                }}
                className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-black uppercase text-white/40 transition hover:border-[#00e5ff]/40 hover:text-[#00e5ff]"
              >
                <Copy className="h-3 w-3" />
                <span className="hidden lg:inline">Convite</span>
              </button>

              {/* Open arrow */}
              <button
                type="button"
                onClick={() => void openStudent(student)}
                className="hidden text-right text-xl text-white/20 hover:text-white lg:block"
              >
                ›
              </button>
            </div>
          )
        })}

        {!students.length && (
          <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-sm text-white/35">
            Nenhum aluno encontrado.
          </div>
        )}
      </div>
    </div>
  )
}
