"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL, ApiError } from "@/lib/api/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────

type AvatarStage = "baby" | "teen" | "adult" | "elite";

interface Student {
  userId: string;
  name: string;
  role: "student" | "coach" | "admin";
  coachId: string;
  active: boolean;
  visibleInArena: boolean;
  archived: boolean;
  weeklyXp: number;
  monthlyXp: number;
  totalXp: number;
  avatarStage: AvatarStage;
  currentStreak: number;
  validationsTotal: number;
  lastValidationAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

type FilterTab = "ativos" | "pausados" | "arquivados" | "todos";
type ResetScope = "weekly" | "monthly" | "individual" | "validationHistory" | "all";

// ─── Helpers ──────────────────────────────────────────────────────────────

function getStatusInfo(s: Student): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (s.archived) return { text: "ARQUIVADO", variant: "destructive" };
  if (!s.active) return { text: "PAUSADO", variant: "secondary" };
  if (!s.visibleInArena) return { text: "OCULTO ARENA", variant: "outline" };
  return { text: "ATIVO", variant: "default" };
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "há 1 dia";
  return `há ${days} dias`;
}

function avatarStageLabel(stage: AvatarStage): string {
  const map: Record<AvatarStage, string> = { baby: "Baby", teen: "Teen", adult: "Adult", elite: "Elite" };
  return map[stage] ?? stage;
}

// ─── API helper ───────────────────────────────────────────────────────────

async function coachFetch<T>(path: string, coachId: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-coach-id": coachId,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Erro (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string };
      message = body?.message || message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Inner component (useSearchParams must be inside Suspense) ─────────

function CoachInner() {
  const searchParams = useSearchParams();
  const coachId = searchParams.get("coachId") ?? "";

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("ativos");
  const [selected, setSelected] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [confirm, setConfirm] = useState<{ label: string; onConfirm: () => Promise<void> } | null>(null);
  const [acting, setActing] = useState(false);

  const fetchStudents = useCallback(async () => {
    if (!coachId) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }
    try {
      const data = await coachFetch<{ students: Student[] }>(
        "/guto/coach/students?includeArchived=true",
        coachId
      );
      setStudents(data.students);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAccessDenied(true);
      }
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  const refreshSelected = useCallback((updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.userId === updated.userId ? updated : s)));
    setSelected(updated);
  }, []);

  const act = useCallback(
    async (fn: () => Promise<void>, successMsg: string) => {
      setActing(true);
      try {
        await fn();
        toast.success(successMsg);
        await fetchStudents();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Erro ao executar ação.");
      } finally {
        setActing(false);
      }
    },
    [fetchStudents]
  );

  const doConfirm = (label: string, onConfirm: () => Promise<void>) => {
    setConfirm({ label, onConfirm });
  };

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.userId.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "todos"
        ? true
        : filter === "ativos"
        ? s.active && !s.archived
        : filter === "pausados"
        ? !s.active && !s.archived
        : s.archived;
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <p className="text-[#00e5ff] text-sm tracking-widest uppercase animate-pulse">Carregando…</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-white text-xl font-bold tracking-tight">Acesso negado</p>
        <p className="text-slate-400 text-sm text-center">
          Você não tem permissão para acessar o painel Coach.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <Toaster theme="dark" position="bottom-center" />

      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-[#00e5ff] font-bold tracking-widest text-sm uppercase">GUTO</span>
          <span className="text-white/40 mx-2">·</span>
          <span className="text-white font-semibold text-sm">Coach Dashboard</span>
        </div>
        <span className="text-white/30 text-xs font-mono">{coachId}</span>
      </header>

      {/* Search + filters */}
      <div className="px-4 pt-4 pb-2 flex flex-col gap-3">
        <Input
          placeholder="Buscar aluno…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {(["ativos", "pausados", "arquivados", "todos"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border transition-colors ${
                filter === tab
                  ? "bg-[#00e5ff] text-[#0a0f1e] border-[#00e5ff]"
                  : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <p className="px-4 py-1 text-white/30 text-xs">
        {filtered.length} aluno{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Student list */}
      <div className="px-4 pb-20 flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-white/30 text-sm text-center py-8">Nenhum aluno encontrado.</p>
        )}
        {filtered.map((s) => {
          const status = getStatusInfo(s);
          return (
            <div
              key={s.userId}
              onClick={() => {
                setSelected(s);
                setEditName(s.name);
                setEditingName(false);
              }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-[#00e5ff]/30 transition-colors"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-white truncate">{s.name}</span>
                  <Badge variant={status.variant} className="text-[10px] px-2 py-0 h-5">
                    {status.text}
                  </Badge>
                </div>
                <span className="text-white/30 text-[11px] font-mono">{s.userId}</span>
                <div className="flex gap-3 mt-1">
                  <span className="text-[#00e5ff] text-xs font-mono">{s.weeklyXp}xp sem.</span>
                  <span className="text-white/40 text-xs font-mono">{s.monthlyXp}xp mês</span>
                  <span className="text-white/30 text-xs">{relativeTime(s.lastActiveAt)}</span>
                </div>
              </div>
              <span className="text-white/30 text-lg ml-3">›</span>
            </div>
          );
        })}
      </div>

      {/* Student Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent
          side="right"
          className="bg-[#0d1426] border-l border-white/10 text-white w-full max-w-sm overflow-y-auto"
        >
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-white text-base font-bold">{selected.name}</SheetTitle>
                <p className="text-white/30 text-xs font-mono">{selected.userId}</p>
              </SheetHeader>

              {/* DADOS */}
              <CoachSection title="Dados">
                <DataRow label="Role" value={selected.role} />
                <DataRow label="Coach ID" value={selected.coachId} />
                <DataRow label="Status" value={
                  <Badge variant={getStatusInfo(selected).variant} className="text-[10px]">
                    {getStatusInfo(selected).text}
                  </Badge>
                } />
                <DataRow label="Arena" value={selected.visibleInArena ? "Visível" : "Oculto"} />
              </CoachSection>

              {/* PERFORMANCE */}
              <CoachSection title="Performance">
                <DataRow label="XP semanal" value={`${selected.weeklyXp} xp`} />
                <DataRow label="XP mensal" value={`${selected.monthlyXp} xp`} />
                <DataRow label="XP total" value={`${selected.totalXp} xp`} />
                <DataRow label="Streak" value={`${selected.currentStreak} dias`} />
                <DataRow label="Validações" value={String(selected.validationsTotal)} />
                <DataRow label="Última valid." value={relativeTime(selected.lastValidationAt)} />
                <DataRow label="Avatar" value={avatarStageLabel(selected.avatarStage)} />
              </CoachSection>

              {/* AÇÕES RÁPIDAS */}
              <CoachSection title="Ações rápidas">
                {editingName ? (
                  <div className="flex gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-white/5 border-white/20 text-white text-sm h-8"
                    />
                    <Button
                      size="sm"
                      disabled={acting}
                      onClick={() =>
                        act(async () => {
                          const updated = await coachFetch<Student>(
                            `/guto/coach/student/${selected.userId}`,
                            coachId,
                            { method: "PATCH", body: JSON.stringify({ name: editName }) }
                          );
                          refreshSelected(updated);
                          setEditingName(false);
                        }, "Nome atualizado.")
                      }
                    >
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>✕</Button>
                  </div>
                ) : (
                  <Button
                    variant="outline" size="sm"
                    className="w-full text-white/70 border-white/20 hover:border-white/50"
                    onClick={() => setEditingName(true)}
                  >
                    Editar nome
                  </Button>
                )}

                {selected.active ? (
                  <Button
                    variant="outline" size="sm"
                    className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                    disabled={acting}
                    onClick={() =>
                      act(async () => {
                        const updated = await coachFetch<Student>(
                          `/guto/coach/student/${selected.userId}/access`,
                          coachId,
                          { method: "PATCH", body: JSON.stringify({ active: false }) }
                        );
                        refreshSelected(updated);
                      }, "Aluno bloqueado. Ele não aparecerá na Arena e não poderá continuar usando o GUTO.")
                    }
                  >
                    Bloquear acesso
                  </Button>
                ) : (
                  <Button
                    variant="outline" size="sm"
                    className="w-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                    disabled={acting}
                    onClick={() =>
                      act(async () => {
                        const updated = await coachFetch<Student>(
                          `/guto/coach/student/${selected.userId}/access`,
                          coachId,
                          { method: "PATCH", body: JSON.stringify({ active: true }) }
                        );
                        refreshSelected(updated);
                      }, "Acesso reativado.")
                    }
                  >
                    Reativar acesso
                  </Button>
                )}

                {selected.visibleInArena ? (
                  <Button
                    variant="outline" size="sm"
                    className="w-full border-slate-500/40 text-slate-300 hover:bg-slate-500/10"
                    disabled={acting}
                    onClick={() =>
                      act(async () => {
                        const updated = await coachFetch<Student>(
                          `/guto/coach/student/${selected.userId}`,
                          coachId,
                          { method: "PATCH", body: JSON.stringify({ visibleInArena: false }) }
                        );
                        refreshSelected(updated);
                      }, "Aluno ocultado da Arena.")
                    }
                  >
                    Ocultar da Arena
                  </Button>
                ) : (
                  <Button
                    variant="outline" size="sm"
                    className="w-full border-slate-500/40 text-slate-300 hover:bg-slate-500/10"
                    disabled={acting}
                    onClick={() =>
                      act(async () => {
                        const updated = await coachFetch<Student>(
                          `/guto/coach/student/${selected.userId}`,
                          coachId,
                          { method: "PATCH", body: JSON.stringify({ visibleInArena: true }) }
                        );
                        refreshSelected(updated);
                      }, "Aluno visível na Arena.")
                    }
                  >
                    Mostrar na Arena
                  </Button>
                )}
              </CoachSection>

              {/* RESETS */}
              <CoachSection title="Resets">
                {(
                  [
                    { label: "Resetar ranking semanal", scope: "weekly" as ResetScope },
                    { label: "Resetar ranking mensal", scope: "monthly" as ResetScope },
                    { label: "Limpar histórico de validações", scope: "validationHistory" as ResetScope },
                  ]
                ).map(({ label, scope }) => (
                  <Button
                    key={scope}
                    variant="outline" size="sm"
                    className="w-full text-white/60 border-white/15 hover:border-white/30"
                    disabled={acting}
                    onClick={() =>
                      doConfirm(label, () =>
                        act(async () => {
                          await coachFetch(
                            `/guto/coach/student/${selected.userId}/reset`,
                            coachId,
                            { method: "POST", body: JSON.stringify({ scope }) }
                          );
                          const updated = await coachFetch<Student>(
                            `/guto/coach/student/${selected.userId}`,
                            coachId
                          );
                          refreshSelected(updated);
                        }, "Reset aplicado.")
                      )
                    }
                  >
                    {label}
                  </Button>
                ))}
              </CoachSection>

              {/* ZONA DE RISCO */}
              <CoachSection title="Zona de risco" danger>
                <Button
                  variant="outline" size="sm"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  disabled={acting}
                  onClick={() =>
                    doConfirm("Resetar progresso total", () =>
                      act(async () => {
                        await coachFetch(
                          `/guto/coach/student/${selected.userId}/reset`,
                          coachId,
                          { method: "POST", body: JSON.stringify({ scope: "all" }) }
                        );
                        const updated = await coachFetch<Student>(
                          `/guto/coach/student/${selected.userId}`,
                          coachId
                        );
                        refreshSelected(updated);
                      }, "Reset aplicado.")
                    )
                  }
                >
                  Resetar progresso total
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  disabled={acting}
                  onClick={() =>
                    doConfirm("Arquivar aluno", () =>
                      act(async () => {
                        await coachFetch(
                          `/guto/coach/student/${selected.userId}`,
                          coachId,
                          { method: "DELETE" }
                        );
                        await fetchStudents();
                        setSelected(null);
                      }, "Aluno arquivado.")
                    )
                  }
                >
                  Arquivar aluno
                </Button>
              </CoachSection>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <AlertDialogContent className="bg-[#0d1426] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{confirm?.label}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Essa ação não pode ser desfeita. Confirmar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                const fn = confirm?.onConfirm;
                setConfirm(null);
                if (fn) await fn();
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function CoachSection({
  title,
  children,
  danger,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={`mb-5 ${danger ? "opacity-80" : ""}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${danger ? "text-red-400/70" : "text-white/30"}`}>
        {title}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-white/5">
      <span className="text-white/40 text-xs">{label}</span>
      <span className="text-white text-xs font-medium">{value}</span>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────

export default function CoachPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
          <p className="text-[#00e5ff] text-sm tracking-widest uppercase animate-pulse">Carregando…</p>
        </div>
      }
    >
      <CoachInner />
    </Suspense>
  );
}
