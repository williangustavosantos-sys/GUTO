"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiError } from "@/lib/api/client";
import { useAuth } from "@/components/auth-provider";
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
import { AdminUser } from "@/lib/api/admin";

// ─── Types ────────────────────────────────────────────────────────────────

type AvatarStage = "baby" | "teen" | "adult" | "elite";

interface Student extends AdminUser {
  name: string;
  subscriptionStatus: string;
  createdAt: string;
  weeklyXp: number;
  monthlyXp: number;
  totalXp: number;
  avatarStage: AvatarStage;
  currentStreak: number;
  validationsTotal: number;
  lastValidationAt: string | null;
  lastActiveAt: string | null;
}

interface RankingItem {
  position: number;
  userId: string;
  pairName: string;
  avatarStage: AvatarStage;
  xp: number;
  validatedWorkouts: number;
  status?: string;
  currentStreak?: number;
  xpToNextEvolution?: number | null;
}

interface RankingsData {
  weekly: { items: RankingItem[] };
  monthly: { items: RankingItem[] };
  individual: { items: RankingItem[] };
}

type DashboardTab = "alunos" | "rankings" | "logs";
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

// ─── Inner component (Suspense required for useSearchParams if used) ─────────

function CoachInner() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardTab>("alunos");
  const [students, setStudents] = useState<Student[]>([]);
  const [rankings, setRankings] = useState<RankingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("ativos");
  const [selected, setSelected] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [confirm, setConfirm] = useState<{ label: string; onConfirm: () => Promise<void> } | null>(null);
  const [acting, setActing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [createdStudent, setCreatedStudent] = useState<{ name: string; userId: string; inviteLink: string } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "coach" && user.role !== "admin" && user.role !== "super_admin"))) {
      router.push("/admin/login");
    }
  }, [user, authLoading, router]);

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiRequest<{ students: Student[] }>(
        "/guto/coach/students?includeArchived=true"
      );
      setStudents(data.students);
    } catch (err) {
      console.error("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchRankings = useCallback(async () => {
    setLoadingRankings(true);
    try {
      const data = await apiRequest<RankingsData>("/guto/coach/rankings");
      setRankings(data);
    } catch (err) {
      toast.error("Erro ao carregar rankings.");
    } finally {
      setLoadingRankings(false);
    }
  }, []);

  useEffect(() => {
    if (user) void fetchStudents();
  }, [fetchStudents, user]);

  useEffect(() => {
    if (activeDashboardTab === "rankings" && user) {
      void fetchRankings();
    }
  }, [activeDashboardTab, fetchRankings, user]);

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
        if (activeDashboardTab === "rankings") await fetchRankings();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Erro ao executar ação.");
      } finally {
        setActing(false);
      }
    },
    [fetchStudents, fetchRankings, activeDashboardTab]
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <p className="text-[#00e5ff] text-sm tracking-widest uppercase animate-pulse">Sincronizando…</p>
      </div>
    );
  }

  if (!user || (user.role !== "coach" && user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans selection:bg-[#00e5ff]/30">
      <Toaster theme="dark" position="bottom-center" />

      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0f1e]/80 backdrop-blur-md z-30">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[#00e5ff] font-black tracking-[0.2em] text-sm">GUTO</span>
            <Badge variant="outline" className="text-[10px] h-4 border-white/20 text-white/40 font-mono">
              {user.role.toUpperCase()}
            </Badge>
          </div>
          <span className="text-white/40 text-[10px] font-mono mt-1">{user.userId}</span>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setNewStudentName("");
            setCreatedStudent(null);
            setCreateModalOpen(true);
          }}
          className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white transition-all font-bold h-9 px-5 text-xs tracking-wide shadow-[0_0_20px_rgba(0,229,255,0.2)]"
        >
          + Criar Aluno
        </Button>
      </header>

      {/* Main Tabs Navigation */}
      <div className="px-6 mt-6 flex gap-1 bg-white/5 p-1 rounded-lg mx-6">
        <button
          onClick={() => setActiveDashboardTab("alunos")}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeDashboardTab === "alunos" ? "bg-[#00e5ff] text-[#0a0f1e]" : "text-white/40 hover:text-white/70"
          }`}
        >
          Lista de Alunos
        </button>
        <button
          onClick={() => setActiveDashboardTab("rankings")}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeDashboardTab === "rankings" ? "bg-[#00e5ff] text-[#0a0f1e]" : "text-white/40 hover:text-white/70"
          }`}
        >
          Rankings Arena
        </button>
      </div>

      {activeDashboardTab === "alunos" ? (
        <>
          {/* Search + filters */}
          <div className="px-6 mt-6 flex flex-col gap-4">
            <div className="relative">
              <Input
                placeholder="Buscar aluno por nome ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 text-sm pl-10 focus:border-[#00e5ff]/50 transition-all rounded-xl"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">🔍</span>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {(["ativos", "pausados", "arquivados", "todos"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                    filter === tab
                      ? "bg-[#00e5ff] text-[#0a0f1e] border-[#00e5ff]"
                      : "bg-white/5 text-white/40 border-white/5 hover:border-white/20"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
              {filtered.length} Aluno{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Student list */}
          <div className="px-6 pb-12 flex flex-col gap-3">
            {students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center border border-white/5 border-dashed rounded-3xl bg-white/[0.02]">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-2xl">👤</div>
                <p className="text-white font-bold mb-2">Nenhum aluno ainda</p>
                <p className="text-white/30 text-xs mb-8 max-w-xs leading-relaxed">
                  Crie seu primeiro convite para começar a monitorar a evolução.
                </p>
                <Button
                  onClick={() => {
                    setNewStudentName("");
                    setCreatedStudent(null);
                    setCreateModalOpen(true);
                  }}
                  className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white font-bold"
                >
                  Criar Primeiro Aluno
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-white/20 text-sm text-center py-12 italic">Nenhum resultado para "{search}"</p>
            ) : null}

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
                  className="group bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.06] hover:border-[#00e5ff]/30 transition-all active:scale-[0.98]"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-base text-white tracking-tight truncate">{s.name}</span>
                      <Badge variant={status.variant} className="text-[9px] px-2 py-0 h-4 uppercase font-black tracking-tighter">
                        {status.text}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-white/20 text-[9px] font-bold uppercase tracking-tighter mb-0.5">Semana</span>
                        <span className="text-[#00e5ff] text-xs font-mono font-bold">{s.weeklyXp} XP</span>
                      </div>
                      <div className="w-px h-6 bg-white/5" />
                      <div className="flex flex-col">
                        <span className="text-white/20 text-[9px] font-bold uppercase tracking-tighter mb-0.5">Visto</span>
                        <span className="text-white/40 text-xs font-mono">{relativeTime(s.lastActiveAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#00e5ff] group-hover:bg-[#00e5ff]/10 transition-all">
                    ›
                  </div>
                </div>
              );
            })}
          </div>

          {/* GLOBAL DANGER ZONE */}
          <div className="mx-6 mb-24 mt-12 p-8 rounded-3xl border border-red-500/10 bg-red-500/[0.02]">
            <h3 className="text-red-500 font-black text-xs uppercase tracking-[0.2em] mb-2 text-center">Zona de Perigo Nuclear</h3>
            <p className="text-white/30 text-[11px] text-center mb-6 leading-relaxed">
              Use este comando apenas se quiser resetar o GUTO completamente para todos os usuários e limpar todos os dados do banco de dados.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                const confirmed = window.confirm("!!! AÇÃO IRREVERSÍVEL !!!\n\nIsso apagará TODOS os registros de todos os alunos, rankings e memórias do sistema.\n\nTem certeza absoluta?");
                if (confirmed) {
                  act(async () => {
                    await apiRequest("/guto/coach/nuke-all", { method: "POST" });
                    window.location.reload();
                  }, "SISTEMA ZERADO TOTALMENTE.");
                }
              }}
              className="w-full border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[11px] uppercase py-6 bg-transparent"
            >
              🚀 Executar Reset Nuclear (Nuke All)
            </Button>
          </div>
        </>
      ) : (
        /* RANKINGS VIEW */
        <div className="px-6 py-8 flex flex-col gap-10 pb-24">
          {loadingRankings ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Sincronizando rankings...</p>
            </div>
          ) : rankings ? (
            <>
              <RankingSection title="🏆 Ranking Semanal" items={rankings.weekly.items} />
              <RankingSection title="📅 Ranking Mensal" items={rankings.monthly.items} />
              <RankingSection title="⚡ Ranking Geral" items={rankings.individual.items} showStreak />
            </>
          ) : (
            <p className="text-white/30 text-center py-20">Nenhum dado de ranking disponível.</p>
          )}
        </div>
      )}

      {/* Create Student Modal */}
      <AlertDialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <AlertDialogContent className="bg-[#0d1426] border border-white/10 text-white rounded-3xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-white">
              {createdStudent ? "✨ Aluno Criado" : "Novo Convite"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 text-sm leading-relaxed mt-2">
              {createdStudent 
                ? "O link abaixo contém o identificador único e forçará o reset do dispositivo do aluno para garantir um onboarding limpo."
                : "Defina o nome do aluno para gerar o link personalizado."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!createdStudent ? (
            <div className="py-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#00e5ff]">Nome do Aluno</label>
                <Input
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ex: Willian"
                  className="bg-white/5 border-white/10 text-white text-base h-12 rounded-xl px-4 focus:border-[#00e5ff]/50 transition-all"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2 opacity-40">
                <label className="text-[10px] font-black uppercase tracking-widest">Vinculado ao Coach</label>
                <Input
                  value={user?.userId || "..."}
                  className="bg-white/5 border-white/10 text-white/50 text-xs h-10 rounded-xl px-4"
                  disabled
                />
              </div>
            </div>
          ) : (
            <div className="py-6 flex flex-col gap-5">
              <div className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl">
                <div className="mb-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Identidade Gerada</p>
                  <p className="text-lg font-bold text-white">{createdStudent.name}</p>
                </div>
                
                <div className="mb-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">ID do Sistema</p>
                  <p className="text-xs font-mono text-[#00e5ff] break-all">{createdStudent.userId}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Link de Convite</p>
                  <div className="flex flex-col gap-3">
                    <div className="bg-black/40 border border-white/10 p-3 rounded-lg break-all text-[10px] font-mono text-white/60 leading-relaxed">
                      {createdStudent.inviteLink}
                    </div>
                    <Button 
                      size="lg" 
                      className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white h-12 text-sm font-black w-full shadow-lg"
                      onClick={() => {
                        navigator.clipboard.writeText(createdStudent.inviteLink);
                        toast.success("Link copiado para o WhatsApp!");
                      }}
                    >
                      Copiar Link de Convite
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter className="mt-4">
            {!createdStudent ? (
              <>
                <AlertDialogCancel className="bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white rounded-xl h-12" disabled={acting}>
                  Cancelar
                </AlertDialogCancel>
                <Button
                  className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white font-black rounded-xl h-12 px-8"
                  disabled={!newStudentName.trim() || acting}
                  onClick={async () => {
                    setActing(true);
                    try {
                      const res = await apiRequest<{ userId: string; name: string; inviteLink: string; student: Student }>(
                        "/guto/coach/student/create",
                        { method: "POST", body: JSON.stringify({ name: newStudentName }) }
                      );
                      setCreatedStudent({
                        name: res.name,
                        userId: res.userId,
                        inviteLink: res.inviteLink
                      });
                      setStudents((prev) => [res.student, ...prev]);
                    } catch (err) {
                      toast.error("Erro ao criar aluno.");
                    } finally {
                      setActing(false);
                    }
                  }}
                >
                  {acting ? "..." : "Gerar Acesso"}
                </Button>
              </>
            ) : (
              <Button
                className="bg-white/5 border border-white/10 text-white hover:bg-white/10 w-full h-12 rounded-xl font-bold"
                onClick={() => setCreateModalOpen(false)}
              >
                Concluído
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Student Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent
          side="right"
          className="bg-[#0d1426] border-l border-white/10 text-white w-full max-w-sm overflow-y-auto px-6 py-10"
        >
          {selected && (
            <div className="flex flex-col h-full">
              <SheetHeader className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-[#00e5ff] text-[#0a0f1e] text-[8px] font-black px-1.5 h-3.5">STUDENT</Badge>
                  <span className="text-white/20 text-[9px] font-mono">{selected.userId}</span>
                </div>
                <SheetTitle className="text-white text-2xl font-black tracking-tight">{selected.name}</SheetTitle>
              </SheetHeader>

              <div className="flex-1 flex flex-col gap-8">
                {/* DADOS */}
                <CoachSection title="SISTEMA">
                  <DataRow label="Status" value={
                    <Badge variant={getStatusInfo(selected).variant} className="text-[9px] font-black uppercase">
                      {getStatusInfo(selected).text}
                    </Badge>
                  } />
                  <DataRow label="Assinatura" value={
                    <Badge variant={selected.subscriptionStatus === "active" ? "default" : "secondary"} className="text-[9px] font-black uppercase">
                      {selected.subscriptionStatus.replace("_", " ")}
                    </Badge>
                  } />
                  <DataRow label="Expira em" value={selected.subscriptionEndsAt ? new Date(selected.subscriptionEndsAt).toLocaleDateString() : "—"} />
                  <DataRow label="Arena" value={selected.visibleInArena ? "Visível" : "Oculto"} />
                  <DataRow label="Criado em" value={new Date(selected.createdAt).toLocaleDateString()} />
                </CoachSection>

                {/* PERFORMANCE */}
                <CoachSection title="PERFORMANCE">
                  <DataRow label="XP Semanal" value={<span className="text-[#00e5ff] font-bold">{selected.weeklyXp} XP</span>} />
                  <DataRow label="XP Mensal" value={<span>{selected.monthlyXp} XP</span>} />
                  <DataRow label="XP Total" value={<span className="text-white/40">{selected.totalXp} XP</span>} />
                  <DataRow label="Sequência" value={<span>{selected.currentStreak} dias 🔥</span>} />
                  <DataRow label="Treinos" value={String(selected.validationsTotal)} />
                  <DataRow label="Visto" value={relativeTime(selected.lastActiveAt)} />
                  <DataRow label="Avatar" value={avatarStageLabel(selected.avatarStage)} />
                </CoachSection>

                {/* AÇÕES */}
                <CoachSection title="CONTROLE">
                  {editingName ? (
                    <div className="flex gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-white/5 border-white/20 text-white text-sm h-10"
                      />
                      <Button
                        size="sm"
                        disabled={acting}
                        className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white font-bold"
                        onClick={() =>
                          act(async () => {
                            const updated = await apiRequest<Student>(
                              `/guto/coach/student/${selected.userId}`,
                              { method: "PATCH", body: JSON.stringify({ name: editName }) }
                            );
                            refreshSelected(updated);
                            setEditingName(false);
                          }, "Nome atualizado.")
                        }
                      >
                        OK
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline" size="sm"
                      className="w-full text-white/50 border-white/5 hover:border-[#00e5ff]/50 bg-transparent py-5"
                      onClick={() => setEditingName(true)}
                    >
                      ✏️ Editar Nome
                    </Button>
                  )}

                  <Button
                    variant="outline" size="sm"
                    className="w-full text-emerald-500 border-white/5 hover:border-emerald-500/50 bg-transparent py-5"
                    disabled={acting}
                    onClick={() =>
                      act(async () => {
                        const updated = await apiRequest<Student>(
                          `/auth/admin/users/${selected.userId}/subscription`,
                          { method: "PATCH", body: JSON.stringify({ extendDays: 30 }) }
                        );
                        // Refresh student view since subscription changed
                        const fullStudent = await apiRequest<Student>(`/guto/coach/student/${selected.userId}`);
                        refreshSelected(fullStudent);
                      }, "Acesso renovado por 30 dias.")
                    }
                  >
                    🔋 Renovar 30 Dias
                  </Button>

                  <Button
                    variant="outline" size="sm"
                    className={`w-full py-5 bg-transparent border-white/5 ${
                      selected.active ? "text-amber-500 hover:border-amber-500/50" : "text-emerald-500 hover:border-emerald-500/50"
                    }`}
                    disabled={acting}
                    onClick={() =>
                      act(async () => {
                        const updated = await apiRequest<Student>(
                          `/guto/coach/student/${selected.userId}/access`,
                          { method: "PATCH", body: JSON.stringify({ active: !selected.active }) }
                        );
                        refreshSelected(updated);
                      }, selected.active ? "Acesso bloqueado." : "Acesso liberado.")
                    }
                  >
                    {selected.active ? "⏸️ Pausar Acesso" : "▶️ Reativar Acesso"}
                  </Button>

                  <Button
                    variant="outline" size="sm"
                    className="w-full text-white/50 border-white/5 hover:border-white/20 bg-transparent py-5"
                    disabled={acting}
                    onClick={() =>
                      act(async () => {
                        const updated = await apiRequest<Student>(
                          `/guto/coach/student/${selected.userId}`,
                          { method: "PATCH", body: JSON.stringify({ visibleInArena: !selected.visibleInArena }) }
                        );
                        refreshSelected(updated);
                      }, selected.visibleInArena ? "Ocultado da Arena." : "Visível na Arena.")
                    }
                  >
                    {selected.visibleInArena ? "👁️‍🗨️ Ocultar na Arena" : "👁️ Mostrar na Arena"}
                  </Button>
                </CoachSection>

                {/* RESETS ESPECÍFICOS */}
                <CoachSection title="RESSETS ESPECÍFICOS">
                  {(
                    [
                      { label: "Zerar Semana", scope: "weekly" as ResetScope },
                      { label: "Zerar Mês", scope: "monthly" as ResetScope },
                      { label: "Zerar Total XP", scope: "individual" as ResetScope },
                    ]
                  ).map(({ label, scope }) => (
                    <Button
                      key={scope}
                      variant="outline" size="sm"
                      className="w-full text-white/30 border-white/5 hover:text-white hover:border-white/20 bg-transparent py-4 text-[10px] font-bold uppercase tracking-widest"
                      disabled={acting}
                      onClick={() =>
                        doConfirm(`Deseja ${label.toLowerCase()}?`, () =>
                          act(async () => {
                            await apiRequest(
                              `/guto/coach/student/${selected.userId}/reset`,
                              { method: "POST", body: JSON.stringify({ scope }) }
                            );
                            const updated = await apiRequest<Student>(
                              `/guto/coach/student/${selected.userId}`
                            );
                            refreshSelected(updated);
                          }, "Reset realizado.")
                        )
                      }
                    >
                      {label}
                    </Button>
                  ))}
                </CoachSection>

                {/* DELETE ZONE */}
                <div className="mt-auto pt-10 pb-6">
                  <Button
                    variant="outline" size="sm"
                    className="w-full border-red-500/20 text-red-500/50 hover:bg-red-500 hover:text-white transition-all font-black text-[10px] uppercase py-6 bg-transparent"
                    disabled={acting}
                    onClick={() => setDeleteConfirm(true)}
                  >
                    🔥 Excluir Aluno Permanentemente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm Generic Dialog */}
      <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <AlertDialogContent className="bg-[#0d1426] border border-white/10 text-white rounded-3xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl font-bold">{confirm?.label}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 mt-2">
              Esta ação alterará os dados do aluno no servidor. Confirmar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-white/5 border-white/5 text-white/50 hover:bg-white/10 h-12 rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white h-12 rounded-xl px-8 font-black"
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

      {/* Hard Delete Dialog */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent className="bg-[#0d1426] border border-red-500/20 text-white rounded-3xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 text-xl font-black uppercase tracking-tighter italic">PERIGO: Excluir para sempre?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 mt-3 leading-relaxed">
              Você está prestes a apagar **TODOS** os dados de <span className="text-white font-bold">{selected?.name}</span>. 
              Isso inclui memória do Guto, histórico de treinos, evolução na Arena e acesso. 
              O aluno será desconectado e precisará começar do zero se quiser voltar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex flex-col gap-2">
            <Button
              className="bg-red-600 hover:bg-red-700 text-white font-black h-14 rounded-xl text-sm"
              disabled={acting}
              onClick={async () => {
                if (!selected) return;
                setActing(true);
                try {
                  await apiRequest(
                    `/guto/coach/student/${selected.userId}/hard-delete`,
                    { method: "POST" }
                  );
                  setStudents((prev) => prev.filter((s) => s.userId !== selected.userId));
                  setSelected(null);
                  setDeleteConfirm(false);
                  toast.success("Aluno removido da existência.");
                } catch (err) {
                  toast.error("Erro ao excluir.");
                } finally {
                  setActing(false);
                }
              }}
            >
              SIM, EXCLUIR PERMANENTEMENTE
            </Button>
            <AlertDialogCancel className="bg-white/5 border-white/5 text-white/40 hover:bg-white/10 h-12 rounded-xl border-none">
              Mudei de ideia
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function RankingSection({ title, items, showStreak }: { title: string; items: RankingItem[]; showStreak?: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-white font-black text-sm uppercase tracking-[0.2em] px-2 border-l-4 border-[#00e5ff] py-1">{title}</h2>
      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-white/20 text-[10px] uppercase tracking-widest italic py-4">Ninguém pontuou neste período.</p>
        ) : (
          items.map((item) => (
            <div key={item.userId} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-[#00e5ff] font-black text-sm w-4">{item.position}º</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-bold text-sm truncate">{item.pairName || "Usuário"}</span>
                  <span className="text-white/20 text-[9px] font-mono uppercase tracking-tighter">
                    {avatarStageLabel(item.avatarStage)} {showStreak && item.currentStreak ? `· ${item.currentStreak}d 🔥` : ""}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-white font-black text-sm">{item.xp} XP</span>
                <span className="text-white/20 text-[9px] font-bold uppercase tracking-tighter">
                  {item.validatedWorkouts} Treinos
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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
    <div className={`flex flex-col gap-2 ${danger ? "opacity-80" : ""}`}>
      <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-1 ${danger ? "text-red-500/70" : "text-white/20"}`}>
        {title}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/[0.03]">
      <span className="text-white/30 text-[11px] font-medium">{label}</span>
      <div className="text-white text-[11px] font-bold">{value}</div>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────

export default function CoachPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#00e5ff] text-[10px] tracking-[0.3em] font-black uppercase animate-pulse">Sincronizando GUTO</p>
          </div>
        </div>
      }
    >
      <CoachInner />
    </Suspense>
  );
}
