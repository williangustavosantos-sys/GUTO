"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Dumbbell,
  FileVideo,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  Unlock,
  UserPlus,
  Users,
  Utensils,
} from "lucide-react";
import { toast, Toaster } from "sonner";

import { ApiError, apiRequest } from "@/lib/api/client";
import { useAuth } from "@/components/auth-provider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
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
import {
  assignStudentToCoach,
  createAdminCustomExercise,
  createAdminCoach,
  createAdminStudent,
  deleteAdminCoach,
  deleteAdminStudent,
  generateAdminStudentDiet,
  generateAdminStudentWorkout,
  getAdminCoaches,
  getAdminExerciseCatalog,
  getAdminLogs,
  getAdminStudentDetail,
  getAdminStudentDiet,
  getAdminStudentDietHistory,
  getAdminStudents,
  getAdminStudentWorkout,
  getAdminStudentWorkoutHistory,
  lockAdminStudentDiet,
  lockAdminStudentWorkout,
  pauseAdminStudent,
  reactivateAdminStudent,
  renewAdminStudent,
  resetAdminStudent,
  resetAdminStudentDiet,
  resetAdminStudentPassword,
  resetAdminStudentWorkout,
  unlockAdminStudentDiet,
  unlockAdminStudentWorkout,
  updateAdminCoach,
  updateAdminStudent,
  updateAdminStudentDiet,
  updateAdminStudentWorkout,
  type AdminCatalogExercise,
  type AdminCoach,
  type AdminLog,
  type AdminStudent,
} from "@/lib/api/admin";
import type { DietPlan, GutoMemory, GutoWorkoutExercise, GutoWorkoutPlan } from "@/lib/api/guto";

type AvatarStage = "baby" | "teen" | "adult" | "elite";
type DashboardTab = "students" | "coaches" | "arena" | "logs";
type FilterTab = "ativos" | "pausados" | "arquivados" | "todos";
type DetailTab = "resumo" | "acesso" | "calibragem" | "treino" | "dieta" | "arena" | "historico" | "seguranca";
type ResetScope = "weekly" | "monthly" | "individual" | "validationHistory" | "all";

interface RankingItem {
  position: number;
  userId: string;
  pairName: string;
  avatarStage: AvatarStage;
  xp: number;
  validatedWorkouts: number;
  status?: string;
  currentStreak?: number;
}

interface RankingsData {
  weekly: { items: RankingItem[] };
  monthly: { items: RankingItem[] };
  individual: { items: RankingItem[] };
}

interface StudentDetail {
  student: AdminStudent;
  memory: GutoMemory | null;
  workout: GutoWorkoutPlan | null;
  diet: DietPlan | null;
  logs: AdminLog[];
  workoutHistory: AdminLog[];
  dietHistory: AdminLog[];
}

type StudentDraft = {
  name: string;
  email: string;
  password: string;
  active: boolean;
  coachId: string;
};

type CoachDraft = {
  name: string;
  email: string;
  password: string;
};

type CustomExerciseDraft = {
  id: string;
  canonicalNamePt: string;
  muscleGroup: string;
  equipment: string;
  sourceFileName: string;
  videoUrl: string;
  fileSizeBytes: string;
  durationSeconds: string;
  width: string;
  height: string;
  fps: string;
  hasAudio: boolean;
};

type CalibrationDraft = {
  userAge: string;
  biologicalSex: string;
  trainingLevel: string;
  trainingGoal: string;
  preferredTrainingLocation: string;
  trainingPathology: string;
  country: string;
  heightCm: string;
  weightKg: string;
  foodRestrictions: string;
};

const SOURCE_LABEL: Record<string, string> = {
  guto_generated: "Gerado pelo GUTO",
  coach_manual: "Manual do Coach",
  mixed: "Editado pelo Coach",
};

const DETAIL_TABS: Array<{ id: DetailTab; label: string }> = [
  { id: "resumo", label: "Resumo" },
  { id: "acesso", label: "Acesso" },
  { id: "calibragem", label: "Calibragem" },
  { id: "treino", label: "Treino" },
  { id: "dieta", label: "Dieta" },
  { id: "arena", label: "Arena/XP" },
  { id: "historico", label: "Histórico" },
  { id: "seguranca", label: "Senha" },
];

const EXERCISE_VIDEO_LIMIT_COPY = "Vídeo obrigatório: MP4, até 30s, até 12MB, máximo 720p, sem áudio, caminho interno /exercise/visuals/custom/.";
const EXERCISE_VIDEO_ERROR_COPY = "Esse vídeo está pesado demais para o app. Use MP4 até 30 segundos, máximo 12MB e 720p.";

function blankCustomExerciseDraft(): CustomExerciseDraft {
  return {
    id: "",
    canonicalNamePt: "",
    muscleGroup: "peito",
    equipment: "",
    sourceFileName: "",
    videoUrl: "/exercise/visuals/custom/",
    fileSizeBytes: "",
    durationSeconds: "",
    width: "",
    height: "",
    fps: "30",
    hasAudio: false,
  };
}

function getStatusInfo(s: AdminStudent): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (s.archived) return { text: "ARQUIVADO", variant: "destructive" };
  if (!s.active) return { text: "PAUSADO", variant: "secondary" };
  if (!s.visibleInArena) return { text: "OCULTO ARENA", variant: "outline" };
  return { text: "ATIVO", variant: "default" };
}

function relativeTime(iso: string | null): string {
  if (!iso) return "-";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "hoje";
  if (days === 1) return "há 1 dia";
  return `há ${days} dias`;
}

function avatarStageLabel(stage: AvatarStage): string {
  return ({ baby: "Baby", teen: "Teen", adult: "Adult", elite: "Elite" } as Record<AvatarStage, string>)[stage] ?? stage;
}

function adminErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const suffix = error.status ? ` (${error.status})` : "";
    return `${error.message || "Backend recusou a ação"}${suffix}`;
  }
  if (error instanceof Error) return error.message;
  return "Backend recusou a ação.";
}

function sourceLabel(source?: string): string {
  return source ? SOURCE_LABEL[source] || source : "Sem origem";
}

function formatDate(value?: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function blankExercise(index = 0): GutoWorkoutExercise {
  return {
    id: `manual-${Date.now()}-${index}`,
    name: "",
    canonicalNamePt: "",
    muscleGroup: "manual",
    sets: 3,
    reps: "10-12",
    load: "",
    rest: "60s",
    restSeconds: 60,
    cue: "",
    note: "",
    alternatives: [],
    order: index + 1,
    videoUrl: "",
    videoProvider: "local",
    sourceFileName: "",
  };
}

function blankWorkout(student: AdminStudent): GutoWorkoutPlan {
  return {
    studentId: student.userId,
    title: "Treino manual",
    focus: "Treino manual",
    weekDay: "today",
    goal: student.plan || "",
    location: "gym",
    dateLabel: "Hoje",
    scheduledFor: new Date().toISOString(),
    summary: "",
    source: "coach_manual",
    lockedByCoach: true,
    manualOverride: true,
    estimatedDurationMinutes: 60,
    difficulty: "",
    coachNotes: "",
    exercises: [blankExercise()],
    blocks: [{ name: "Principal", exercises: [blankExercise()] }],
  };
}

function hasInvalidWorkoutExerciseContract(workout: GutoWorkoutPlan): boolean {
  return !workout.exercises.length || workout.exercises.some((exercise) =>
    !exercise.id ||
    exercise.id.startsWith("manual-") ||
    exercise.videoProvider !== "local" ||
    !exercise.videoUrl?.startsWith("/exercise/visuals/")
  );
}

function normalizeCatalogSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function isSafeExerciseVideoFileName(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*\.mp4$/.test(value);
}

function validateCustomExerciseDraft(draft: CustomExerciseDraft): string | null {
  const fileSizeBytes = Number(draft.fileSizeBytes);
  const durationSeconds = Number(draft.durationSeconds);
  const width = Number(draft.width);
  const height = Number(draft.height);
  const fps = Number(draft.fps);
  const sourceFileName = draft.sourceFileName.trim();
  const videoUrl = draft.videoUrl.trim();
  const longSide = Math.max(width, height);
  const shortSide = Math.min(width, height);

  if (!draft.canonicalNamePt.trim()) return "Informe o nome do exercício.";
  if (!sourceFileName || !videoUrl) return "Vídeo obrigatório: informe sourceFileName e videoUrl.";
  if (!videoUrl.startsWith("/exercise/visuals/custom/") || videoUrl.includes("..") || /\s/.test(videoUrl)) return "Use caminho interno /exercise/visuals/custom/.";
  if (!isSafeExerciseVideoFileName(sourceFileName) || !videoUrl.endsWith(`/${sourceFileName}`)) return "Use nome seguro: lowercase, sem acento, sem espaço e com hífen.";
  if (!Number.isFinite(fileSizeBytes) || !Number.isFinite(durationSeconds) || !Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(fps)) return "Preencha todos os metadados técnicos do vídeo.";
  if (fileSizeBytes <= 0 || durationSeconds <= 0 || width <= 0 || height <= 0 || fps <= 0) return "Metadados técnicos precisam ser positivos.";
  if (fileSizeBytes > 12 * 1024 * 1024 || durationSeconds > 30 || longSide > 1280 || shortSide > 720 || fps > 30 || draft.hasAudio) return EXERCISE_VIDEO_ERROR_COPY;
  if (durationSeconds < 3) return "Use vídeo com pelo menos 3 segundos.";
  return null;
}

function catalogSearchText(exercise: AdminCatalogExercise): string {
  return normalizeCatalogSearch([
    exercise.id,
    exercise.canonicalNamePt,
    ...Object.values(exercise.namesByLanguage || {}),
    ...Object.values(exercise.aliasesByLanguage || {}).flat(),
    exercise.muscleGroup,
    exercise.equipment || "",
  ].join(" "));
}

function workoutExerciseFromCatalog(
  catalogExercise: AdminCatalogExercise,
  current: GutoWorkoutExercise,
  index: number
): GutoWorkoutExercise {
  return {
    ...current,
    id: catalogExercise.id,
    name: catalogExercise.canonicalNamePt,
    canonicalNamePt: catalogExercise.canonicalNamePt,
    muscleGroup: catalogExercise.muscleGroup,
    order: current.order ?? index + 1,
    videoUrl: catalogExercise.videoUrl,
    videoProvider: "local",
    sourceFileName: catalogExercise.sourceFileName,
  };
}

function normalizeWorkoutForEditor(plan: GutoWorkoutPlan | null, student: AdminStudent): GutoWorkoutPlan {
  if (!plan) return blankWorkout(student);
  const exercises = (plan.exercises?.length ? plan.exercises : []).map((exercise, index) => ({
    ...blankExercise(index),
    ...exercise,
    order: exercise.order ?? index + 1,
    load: exercise.load ?? "",
    alternatives: exercise.alternatives ?? [],
  }));
  return {
    ...blankWorkout(student),
    ...plan,
    studentId: student.userId,
    source: plan.source || (plan.manualOverride ? "coach_manual" : "guto_generated"),
    exercises: exercises.length ? exercises : [blankExercise()],
  };
}

function blankDiet(student: AdminStudent): DietPlan {
  return {
    userId: student.userId,
    title: "Dieta manual",
    generatedAt: new Date().toISOString(),
    country: "",
    goal: "fat_loss",
    source: "coach_manual",
    lockedByCoach: true,
    manualOverride: true,
    macros: {
      bmr: 0,
      tdee: 0,
      targetKcal: 1900,
      proteinG: 150,
      carbsG: 170,
      fatG: 55,
      goal: "fat_loss",
    },
    meals: [
      {
        id: "breakfast",
        name: "Café da manhã",
        time: "07:30",
        totalKcal: 400,
        gutoNote: "",
        foods: [{ name: "Ovos", quantity: "2 unidades", kcal: 160, notes: "" }],
        alternatives: [],
      },
    ],
    foodRestrictions: "",
    coachNotes: "",
  };
}

function normalizeDietForEditor(plan: DietPlan | null, student: AdminStudent): DietPlan {
  if (!plan) return blankDiet(student);
  return {
    ...blankDiet(student),
    ...plan,
    userId: student.userId,
    source: plan.source || (plan.manualOverride ? "coach_manual" : "guto_generated"),
    macros: { ...blankDiet(student).macros, ...plan.macros },
    meals: plan.meals?.length ? plan.meals : blankDiet(student).meals,
  };
}

function calibrationFromMemory(memory: GutoMemory | null): CalibrationDraft {
  return {
    userAge: memory?.userAge ? String(memory.userAge) : "",
    biologicalSex: memory?.biologicalSex || "",
    trainingLevel: memory?.trainingLevel || "",
    trainingGoal: memory?.trainingGoal || "",
    preferredTrainingLocation: memory?.preferredTrainingLocation || "",
    trainingPathology: memory?.trainingPathology || "",
    country: memory?.country || "",
    heightCm: memory?.heightCm ? String(memory.heightCm) : "",
    weightKg: memory?.weightKg ? String(memory.weightKg) : "",
    foodRestrictions: memory?.foodRestrictions || "",
  };
}

function CoachInner() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardTab>("students");
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [coaches, setCoaches] = useState<AdminCoach[]>([]);
  const [exerciseCatalog, setExerciseCatalog] = useState<AdminCatalogExercise[]>([]);
  const [rankings, setRankings] = useState<RankingsData | null>(null);
  const [globalLogs, setGlobalLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("ativos");
  const [selectedDetail, setSelectedDetail] = useState<StudentDetail | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("resumo");
  const [workoutEditor, setWorkoutEditor] = useState<GutoWorkoutPlan | null>(null);
  const [dietEditor, setDietEditor] = useState<DietPlan | null>(null);
  const [calibrationDraft, setCalibrationDraft] = useState<CalibrationDraft>(calibrationFromMemory(null));
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [showCreateCoach, setShowCreateCoach] = useState(false);
  const [studentDraft, setStudentDraft] = useState<StudentDraft>({ name: "", email: "", password: "", active: false, coachId: "" });
  const [coachDraft, setCoachDraft] = useState<CoachDraft>({ name: "", email: "", password: "" });
  const [lastSecret, setLastSecret] = useState<string | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "coach" && user.role !== "admin" && user.role !== "super_admin"))) {
      router.push("/admin/login");
    }
  }, [authLoading, router, user]);

  const fetchStudents = useCallback(async () => {
    const data = await getAdminStudents();
    setStudents(data.students);
  }, []);

  const fetchCoaches = useCallback(async () => {
    if (!isAdmin) return;
    const data = await getAdminCoaches();
    setCoaches(data.coaches);
  }, [isAdmin]);

  const fetchExerciseCatalog = useCallback(async () => {
    const data = await getAdminExerciseCatalog();
    setExerciseCatalog(data.exercises);
  }, []);

  const fetchRankings = useCallback(async () => {
    const data = await apiRequest<RankingsData>("/guto/coach/rankings");
    setRankings(data);
  }, []);

  const fetchGlobalLogs = useCallback(async () => {
    if (!isAdmin) return;
    const data = await getAdminLogs();
    setGlobalLogs(data.logs);
  }, [isAdmin]);

  const loadBase = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await Promise.all([fetchStudents(), fetchCoaches(), fetchExerciseCatalog()]);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [fetchCoaches, fetchExerciseCatalog, fetchStudents, user]);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (activeDashboardTab === "arena") void fetchRankings().catch((error) => toast.error(adminErrorMessage(error)));
    if (activeDashboardTab === "logs") void fetchGlobalLogs().catch((error) => toast.error(adminErrorMessage(error)));
  }, [activeDashboardTab, fetchGlobalLogs, fetchRankings]);

  const refreshSelected = useCallback(async (studentId: string) => {
    const [detail, workout, diet, logs, workoutHistory, dietHistory] = await Promise.all([
      getAdminStudentDetail(studentId),
      getAdminStudentWorkout(studentId),
      getAdminStudentDiet(studentId),
      getAdminLogs(studentId),
      getAdminStudentWorkoutHistory(studentId),
      getAdminStudentDietHistory(studentId),
    ]);
    const nextDetail: StudentDetail = {
      student: detail.student,
      memory: detail.memory,
      workout: workout.workout,
      diet: diet.diet,
      logs: logs.logs,
      workoutHistory: workoutHistory.history,
      dietHistory: dietHistory.history,
    };
    setSelectedDetail(nextDetail);
    setWorkoutEditor(normalizeWorkoutForEditor(workout.workout, detail.student));
    setDietEditor(normalizeDietForEditor(diet.diet, detail.student));
    setCalibrationDraft(calibrationFromMemory(detail.memory));
    setStudents((current) => current.map((student) => student.userId === detail.student.userId ? detail.student : student));
  }, []);

  const openStudent = useCallback(async (student: AdminStudent, tab: DetailTab = "resumo") => {
    setDetailTab(tab);
    setSelectedDetail({
      student,
      memory: null,
      workout: null,
      diet: null,
      logs: [],
      workoutHistory: [],
      dietHistory: [],
    });
    try {
      await refreshSelected(student.userId);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  }, [refreshSelected]);

  const act = useCallback(async (fn: () => Promise<void>, successMsg: string) => {
    setActing(true);
    try {
      await fn();
      toast.success(successMsg);
      await fetchStudents();
      if (selectedDetail) await refreshSelected(selectedDetail.student.userId);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    } finally {
      setActing(false);
    }
  }, [fetchStudents, refreshSelected, selectedDetail]);

  const filtered = useMemo(() => students.filter((student) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || student.name.toLowerCase().includes(term) || student.userId.toLowerCase().includes(term) || student.email?.toLowerCase().includes(term);
    const matchesFilter =
      filter === "todos" ? true :
      filter === "ativos" ? student.active && !student.archived :
      filter === "pausados" ? !student.active && !student.archived :
      Boolean(student.archived);
    return matchesSearch && matchesFilter;
  }), [filter, search, students]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <p className="text-[#00e5ff] text-xs tracking-widest uppercase animate-pulse">Sincronizando painel</p>
      </div>
    );
  }

  if (!user || (user.role !== "coach" && user.role !== "admin" && user.role !== "super_admin")) return null;

  const selected = selectedDetail?.student ?? null;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white selection:bg-[#00e5ff]/30">
      <Toaster theme="dark" position="bottom-center" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0f1e]/88 px-5 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-[0.24em] text-[#00e5ff]">GUTO</span>
              <Badge variant="outline" className="h-5 border-white/15 text-[10px] font-mono text-white/50">
                {user.role.toUpperCase()}
              </Badge>
            </div>
            <p className="mt-1 font-mono text-[10px] text-white/35">{user.userId}</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setShowCreateCoach(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Criar coach
              </Button>
            )}
            <Button size="sm" className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white" onClick={() => setShowCreateStudent(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar aluno
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        {lastSecret && (
          <div className="mb-5 rounded-xl border border-[#00e5ff]/30 bg-[#00e5ff]/10 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#00e5ff]">Credencial gerada</p>
                <p className="break-all font-mono text-sm font-black text-white">{lastSecret}</p>
              </div>
              <Button variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => setLastSecret(null)}>
                Ocultar
              </Button>
            </div>
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-white/5 p-1 md:grid-cols-4">
          <DashboardButton active={activeDashboardTab === "students"} onClick={() => setActiveDashboardTab("students")} icon={<Users className="h-4 w-4" />} label="Alunos" />
          <DashboardButton active={activeDashboardTab === "coaches"} onClick={() => setActiveDashboardTab("coaches")} icon={<Shield className="h-4 w-4" />} label="Coaches" disabled={!isAdmin} />
          <DashboardButton active={activeDashboardTab === "arena"} onClick={() => setActiveDashboardTab("arena")} icon={<Activity className="h-4 w-4" />} label="Arena" />
          <DashboardButton active={activeDashboardTab === "logs"} onClick={() => setActiveDashboardTab("logs")} icon={<RefreshCw className="h-4 w-4" />} label="Histórico" disabled={!isAdmin} />
        </div>

        {activeDashboardTab === "students" && (
          <>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                placeholder="Buscar por nome, email ou ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/25 md:max-w-md"
              />
              <div className="flex flex-wrap gap-2">
                {(["ativos", "pausados", "arquivados", "todos"] as FilterTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                      filter === tab ? "border-[#00e5ff] bg-[#00e5ff] text-[#0a0f1e]" : "border-white/10 bg-white/5 text-white/45 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {filtered.map((student) => {
                const status = getStatusInfo(student);
                return (
                  <button
                    key={student.userId}
                    type="button"
                    onClick={() => void openStudent(student)}
                    className="grid gap-4 rounded-xl border border-white/7 bg-white/[0.035] p-4 text-left transition hover:border-[#00e5ff]/40 hover:bg-white/[0.06] md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,.7fr))_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="truncate text-base font-black text-white">{student.name}</span>
                        <Badge variant={status.variant} className="text-[9px] font-black uppercase">{status.text}</Badge>
                      </div>
                      <p className="truncate font-mono text-[10px] text-white/30">{student.email || student.userId}</p>
                    </div>
                    <Metric label="Coach" value={student.coachId || "-"} />
                    <Metric label="Semana" value={`${student.weeklyXp} XP`} cyan />
                    <Metric label="Mês" value={`${student.monthlyXp} XP`} />
                    <Metric label="Visto" value={relativeTime(student.lastActiveAt)} />
                    <Metric label="Plano" value={student.subscriptionStatus?.replace("_", " ") || "-"} />
                    <span className="text-right text-2xl text-white/20">›</span>
                  </button>
                );
              })}
              {!filtered.length && (
                <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-sm text-white/35">
                  Nenhum aluno encontrado.
                </div>
              )}
            </div>
          </>
        )}

        {activeDashboardTab === "coaches" && (
          <div className="grid gap-3">
            {coaches.map((coach) => (
              <div key={coach.userId} className="rounded-xl border border-white/7 bg-white/[0.035] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black text-white">{coach.name || coach.userId}</p>
                    <p className="font-mono text-[10px] text-white/35">{coach.email || coach.userId}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={() => void act(async () => {
                      const next = await updateAdminCoach(coach.userId, { active: !coach.active });
                      setCoaches((current) => current.map((item) => item.userId === coach.userId ? next.coach : item));
                    }, coach.active ? "Coach pausado." : "Coach ativo.")}>
                      {coach.active ? "Pausar" : "Ativar"}
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500 hover:text-white" disabled={acting} onClick={() => {
                      if (!window.confirm("Excluir coach? Reatribua alunos antes.")) return;
                      void act(async () => {
                        await deleteAdminCoach(coach.userId);
                        setCoaches((current) => current.filter((item) => item.userId !== coach.userId));
                      }, "Coach excluído.");
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeDashboardTab === "arena" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <RankingSection title="Ranking Semanal" items={rankings?.weekly.items || []} />
            <RankingSection title="Ranking Mensal" items={rankings?.monthly.items || []} />
            <RankingSection title="Ranking Geral" items={rankings?.individual.items || []} showStreak />
          </div>
        )}

        {activeDashboardTab === "logs" && (
          <LogList logs={globalLogs} empty="Sem logs globais." />
        )}
      </main>

      <Sheet open={!!selectedDetail} onOpenChange={(open) => { if (!open) setSelectedDetail(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto border-l border-white/10 bg-[#0d1426] p-0 text-white sm:max-w-4xl">
          {selected && selectedDetail && (
            <div className="min-h-full">
              <SheetHeader className="border-b border-white/10 px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge className="bg-[#00e5ff] text-[#0a0f1e] text-[9px] font-black">STUDENT</Badge>
                      <span className="truncate font-mono text-[10px] text-white/30">{selected.userId}</span>
                    </div>
                    <SheetTitle className="truncate text-2xl font-black text-white">{selected.name}</SheetTitle>
                  </div>
                  <Badge variant={getStatusInfo(selected).variant} className="text-[10px] font-black uppercase">{getStatusInfo(selected).text}</Badge>
                </div>
              </SheetHeader>

              <div className="sticky top-0 z-10 overflow-x-auto border-b border-white/10 bg-[#0d1426]/95 px-4 py-3 backdrop-blur">
                <div className="flex min-w-max gap-2">
                  {DETAIL_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id)}
                      className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                        detailTab === tab.id ? "bg-[#00e5ff] text-[#0a0f1e]" : "bg-white/5 text-white/45 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {detailTab === "resumo" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Panel title="Sistema">
                      <DataRow label="Status" value={<Badge variant={getStatusInfo(selected).variant}>{getStatusInfo(selected).text}</Badge>} />
                      <DataRow label="Assinatura" value={selected.subscriptionStatus?.replace("_", " ") || "-"} />
                      <DataRow label="Expira em" value={formatDate(selected.subscriptionEndsAt)} />
                      <DataRow label="Coach" value={selected.coachId || "-"} />
                      <DataRow label="Arena" value={selected.visibleInArena ? "Visível" : "Oculto"} />
                    </Panel>
                    <Panel title="Evolução">
                      <DataRow label="XP semanal" value={`${selected.weeklyXp} XP`} />
                      <DataRow label="XP mensal" value={`${selected.monthlyXp} XP`} />
                      <DataRow label="XP total" value={`${selected.totalXp} XP`} />
                      <DataRow label="Sequência" value={`${selected.currentStreak} dias`} />
                      <DataRow label="Avatar" value={avatarStageLabel(selected.avatarStage)} />
                    </Panel>
                    <Panel title="Plano oficial" className="md:col-span-2">
                      <DataRow label="Treino" value={`${sourceLabel(selectedDetail.workout?.source)}${selectedDetail.workout?.lockedByCoach ? " · bloqueado" : ""}`} />
                      <DataRow label="Dieta" value={`${sourceLabel(selectedDetail.diet?.source)}${selectedDetail.diet?.lockedByCoach ? " · bloqueada" : ""}`} />
                    </Panel>
                  </div>
                )}

                {detailTab === "acesso" && (
                  <Panel title="Controle de acesso">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <ActionButton disabled={acting} onClick={() => void act(async () => {
                        const result = selected.active ? await pauseAdminStudent(selected.userId) : await reactivateAdminStudent(selected.userId);
                        setSelectedDetail((current) => current ? { ...current, student: result.student } : current);
                      }, selected.active ? "Acesso pausado." : "Acesso reativado.")}>
                        {selected.active ? "Pausar acesso" : "Reativar acesso"}
                      </ActionButton>
                      <ActionButton disabled={acting} onClick={() => void act(async () => {
                        const result = await renewAdminStudent(selected.userId, 30);
                        setSelectedDetail((current) => current ? { ...current, student: result.student } : current);
                      }, "Acesso renovado por 30 dias.")}>
                        Renovar 30 dias
                      </ActionButton>
                      <ActionButton disabled={acting} onClick={() => void act(async () => {
                        const result = await updateAdminStudent(selected.userId, { visibleInArena: !selected.visibleInArena });
                        setSelectedDetail((current) => current ? { ...current, student: result.student } : current);
                      }, selected.visibleInArena ? "Aluno ocultado da Arena." : "Aluno visível na Arena.")}>
                        {selected.visibleInArena ? "Ocultar na Arena" : "Mostrar na Arena"}
                      </ActionButton>
                      {isAdmin && (
                        <select
                          value={selected.coachId || ""}
                          onChange={(event) => {
                            const coachId = event.target.value;
                            if (!coachId) return;
                            void act(async () => {
                              const result = await assignStudentToCoach(coachId, selected.userId);
                              setSelectedDetail((current) => current ? { ...current, student: result.student } : current);
                            }, "Aluno atribuído ao coach.");
                          }}
                          className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                        >
                          <option value="" className="bg-[#0d1426]">Atribuir coach</option>
                          {coaches.map((coach) => (
                            <option key={coach.userId} value={coach.userId} className="bg-[#0d1426]">{coach.name || coach.userId}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </Panel>
                )}

                {detailTab === "calibragem" && (
                  <Panel title="Calibragem do aluno">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Idade" value={calibrationDraft.userAge} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, userAge: value }))} />
                      <Field label="Sexo biológico" value={calibrationDraft.biologicalSex} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, biologicalSex: value }))} />
                      <Field label="Nível" value={calibrationDraft.trainingLevel} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, trainingLevel: value }))} />
                      <Field label="Objetivo" value={calibrationDraft.trainingGoal} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, trainingGoal: value }))} />
                      <Field label="Local preferido" value={calibrationDraft.preferredTrainingLocation} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, preferredTrainingLocation: value }))} />
                      <Field label="País" value={calibrationDraft.country} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, country: value }))} />
                      <Field label="Altura cm" value={calibrationDraft.heightCm} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, heightCm: value }))} />
                      <Field label="Peso kg" value={calibrationDraft.weightKg} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, weightKg: value }))} />
                      <Field label="Dor ou limitação" value={calibrationDraft.trainingPathology} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, trainingPathology: value }))} className="md:col-span-2" />
                      <Field label="Restrições alimentares" value={calibrationDraft.foodRestrictions} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, foodRestrictions: value }))} className="md:col-span-2" />
                    </div>
                    <Button className="mt-4 bg-[#00e5ff] text-[#0a0f1e] hover:bg-white" disabled={acting} onClick={() => void act(async () => {
                      await updateAdminStudent(selected.userId, {
                        calibration: {
                          ...calibrationDraft,
                          userAge: calibrationDraft.userAge ? Number(calibrationDraft.userAge) : undefined,
                          heightCm: calibrationDraft.heightCm ? Number(calibrationDraft.heightCm) : undefined,
                          weightKg: calibrationDraft.weightKg ? Number(calibrationDraft.weightKg) : undefined,
                        },
                      });
                    }, "Calibragem atualizada.")}>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar calibragem
                    </Button>
                  </Panel>
                )}

                {detailTab === "treino" && workoutEditor && (
                  <WorkoutEditor
                    student={selected}
                    value={workoutEditor}
                    exerciseCatalog={exerciseCatalog}
                    history={selectedDetail.workoutHistory}
                    acting={acting}
                    onChange={setWorkoutEditor}
                    onSave={() => void act(async () => {
                      if (hasInvalidWorkoutExerciseContract(workoutEditor)) {
                        toast.error("Escolha um exercício do catálogo oficial antes de salvar.");
                        return;
                      }
                      const source = selectedDetail.workout?.source === "guto_generated" ? "mixed" : workoutEditor.source || "coach_manual";
                      const result = await updateAdminStudentWorkout(selected.userId, { ...workoutEditor, source, blocks: [{ name: "Principal", exercises: workoutEditor.exercises }] }, "Coach/admin manual edit");
                      setWorkoutEditor(normalizeWorkoutForEditor(result.workout, selected));
                    }, "Treino oficial salvo.")}
                    onCreateManual={() => setWorkoutEditor(blankWorkout(selected))}
                    onGenerate={() => void act(async () => {
                      const result = await generateAdminStudentWorkout(selected.userId);
                      setWorkoutEditor(normalizeWorkoutForEditor(result.workout, selected));
                    }, "Treino gerado pelo GUTO.")}
                    onLock={() => void act(async () => {
                      const result = workoutEditor.lockedByCoach ? await unlockAdminStudentWorkout(selected.userId) : await lockAdminStudentWorkout(selected.userId);
                      setWorkoutEditor(normalizeWorkoutForEditor(result.workout, selected));
                    }, workoutEditor.lockedByCoach ? "GUTO liberado para atualizar treino." : "Treino bloqueado contra sobrescrita.")}
                    onReset={() => {
                      if (!window.confirm("Resetar treino oficial deste aluno?")) return;
                      void act(async () => {
                        await resetAdminStudentWorkout(selected.userId);
                        setWorkoutEditor(blankWorkout(selected));
                      }, "Treino resetado.");
                    }}
                  />
                )}

                {detailTab === "dieta" && dietEditor && (
                  <DietEditor
                    student={selected}
                    value={dietEditor}
                    history={selectedDetail.dietHistory}
                    acting={acting}
                    onChange={setDietEditor}
                    onSave={() => void act(async () => {
                      const source = selectedDetail.diet?.source === "guto_generated" ? "mixed" : dietEditor.source || "coach_manual";
                      const result = await updateAdminStudentDiet(selected.userId, { ...dietEditor, source }, "Coach/admin manual edit");
                      setDietEditor(normalizeDietForEditor(result.diet, selected));
                    }, "Dieta oficial salva.")}
                    onCreateManual={() => setDietEditor(blankDiet(selected))}
                    onGenerate={() => void act(async () => {
                      const result = await generateAdminStudentDiet(selected.userId);
                      setDietEditor(normalizeDietForEditor(result.diet, selected));
                    }, "Dieta do GUTO carregada.")}
                    onLock={() => void act(async () => {
                      const result = dietEditor.lockedByCoach ? await unlockAdminStudentDiet(selected.userId) : await lockAdminStudentDiet(selected.userId);
                      setDietEditor(normalizeDietForEditor(result.diet, selected));
                    }, dietEditor.lockedByCoach ? "GUTO liberado para atualizar dieta." : "Dieta bloqueada contra sobrescrita.")}
                    onReset={() => {
                      if (!window.confirm("Resetar dieta oficial deste aluno?")) return;
                      void act(async () => {
                        await resetAdminStudentDiet(selected.userId);
                        setDietEditor(blankDiet(selected));
                      }, "Dieta resetada.");
                    }}
                  />
                )}

                {detailTab === "arena" && (
                  <Panel title="Arena e XP">
                    <div className="grid gap-2 md:grid-cols-2">
                      {[
                        ["Resetar semana", "weekly"],
                        ["Resetar mês", "monthly"],
                        ["Resetar XP", "individual"],
                        ["Resetar histórico", "validationHistory"],
                      ].map(([label, scope]) => (
                        <ActionButton key={scope} disabled={acting} onClick={() => {
                          if (!window.confirm(`${label}?`)) return;
                          void act(async () => {
                            const result = await resetAdminStudent(selected.userId, scope as ResetScope);
                            setSelectedDetail((current) => current ? { ...current, student: result.student } : current);
                          }, "Reset executado.");
                        }}>
                          {label}
                        </ActionButton>
                      ))}
                    </div>
                  </Panel>
                )}

                {detailTab === "historico" && (
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
                )}

                {detailTab === "seguranca" && (
                  <Panel title="Segurança e senha">
                    <div className="grid gap-3 md:grid-cols-2">
                      <ActionButton disabled={acting} onClick={() => void act(async () => {
                        const result = await resetAdminStudentPassword(selected.userId);
                        setLastSecret(result.temporaryPassword || null);
                      }, "Senha temporária gerada.")}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Gerar senha temporária
                      </ActionButton>
                      {isAdmin && (
                        <ActionButton danger disabled={acting} onClick={() => {
                          if (!window.confirm("Excluir permanentemente este aluno e todos os dados vinculados?")) return;
                          void act(async () => {
                            await deleteAdminStudent(selected.userId);
                            setSelectedDetail(null);
                            setStudents((current) => current.filter((student) => student.userId !== selected.userId));
                          }, "Aluno excluído permanentemente.");
                        }}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir permanentemente
                        </ActionButton>
                      )}
                    </div>
                    {lastSecret && (
                      <div className="mt-4 rounded-lg border border-[#00e5ff]/30 bg-[#00e5ff]/10 p-4">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#00e5ff]">Senha temporária</p>
                        <p className="font-mono text-lg font-black text-white">{lastSecret}</p>
                      </div>
                    )}
                  </Panel>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CreateStudentDialog
        open={showCreateStudent}
        onOpenChange={setShowCreateStudent}
        draft={studentDraft}
        coaches={coaches}
        isAdmin={isAdmin}
        acting={acting}
        onDraftChange={setStudentDraft}
        onCreate={() => void act(async () => {
          const result = await createAdminStudent({
            name: studentDraft.name,
            email: studentDraft.email || undefined,
            password: studentDraft.password || undefined,
            active: studentDraft.active,
            coachId: studentDraft.coachId || undefined,
          });
          if (result.inviteLink) setLastSecret(result.inviteLink);
          setStudentDraft({ name: "", email: "", password: "", active: false, coachId: "" });
          setShowCreateStudent(false);
        }, "Aluno criado.")}
      />

      <CreateCoachDialog
        open={showCreateCoach}
        onOpenChange={setShowCreateCoach}
        draft={coachDraft}
        acting={acting}
        onDraftChange={setCoachDraft}
        onCreate={() => void act(async () => {
          const result = await createAdminCoach({ name: coachDraft.name, email: coachDraft.email, password: coachDraft.password || undefined });
          setCoaches((current) => [result.coach, ...current]);
          if (result.temporaryPassword) setLastSecret(result.temporaryPassword);
          setCoachDraft({ name: "", email: "", password: "" });
          setShowCreateCoach(false);
        }, "Coach criado.")}
      />
    </div>
  );
}

function DashboardButton({ active, onClick, icon, label, disabled }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-md px-3 py-3 text-[10px] font-black uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-25 ${
        active ? "bg-[#00e5ff] text-[#0a0f1e]" : "text-white/45 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Metric({ label, value, cyan }: { label: string; value: ReactNode; cyan?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-white/20">{label}</p>
      <p className={`truncate font-mono text-xs font-bold ${cyan ? "text-[#00e5ff]" : "text-white/60"}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-white/8 bg-white/[0.035] p-4 ${className}`}>
      <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-[#00e5ff]">{title}</h3>
      {children}
    </section>
  );
}

function DataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] py-2.5 last:border-0">
      <span className="text-xs text-white/35">{label}</span>
      <div className="text-right text-xs font-bold text-white">{value}</div>
    </div>
  );
}

function ActionButton({ children, onClick, disabled, danger }: { children: ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={`h-11 justify-center border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10 ${danger ? "border-red-500/30 text-red-300 hover:bg-red-500 hover:text-white" : ""}`}
    >
      {children}
    </Button>
  );
}

function Field({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-10 border-white/10 bg-white/5 text-white" />
    </label>
  );
}

function WorkoutEditor({
  student,
  value,
  exerciseCatalog,
  history,
  acting,
  onChange,
  onSave,
  onCreateManual,
  onGenerate,
  onLock,
  onReset,
}: {
  student: AdminStudent;
  value: GutoWorkoutPlan;
  exerciseCatalog: AdminCatalogExercise[];
  history: AdminLog[];
  acting: boolean;
  onChange: (value: GutoWorkoutPlan) => void;
  onSave: () => void;
  onCreateManual: () => void;
  onGenerate: () => void;
  onLock: () => void;
  onReset: () => void;
}) {
  const [exerciseSearch, setExerciseSearch] = useState<Record<number, string>>({});
  const [customExerciseDraft, setCustomExerciseDraft] = useState<CustomExerciseDraft>(blankCustomExerciseDraft());
  const [creatingCustomExercise, setCreatingCustomExercise] = useState(false);

  const updateExercise = (index: number, patch: Partial<GutoWorkoutExercise>) => {
    onChange({ ...value, exercises: value.exercises.map((exercise, i) => i === index ? { ...exercise, ...patch } : exercise) });
  };

  const selectCatalogExercise = (index: number, catalogExercise: AdminCatalogExercise) => {
    onChange({
      ...value,
      exercises: value.exercises.map((exercise, i) =>
        i === index ? workoutExerciseFromCatalog(catalogExercise, exercise, index) : exercise
      ),
    });
    setExerciseSearch((current) => ({ ...current, [index]: "" }));
  };

  const removeExercise = (index: number) => {
    onChange({ ...value, exercises: value.exercises.filter((_, i) => i !== index) });
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    const next = [...value.exercises];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...value, exercises: next.map((exercise, i) => ({ ...exercise, order: i + 1 })) });
  };

  const updateCustomExerciseDraft = (patch: Partial<CustomExerciseDraft>) => {
    setCustomExerciseDraft((draft) => ({ ...draft, ...patch }));
  };

  const submitCustomExercise = async () => {
    const validationError = validateCustomExerciseDraft(customExerciseDraft);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setCreatingCustomExercise(true);
    try {
      await createAdminCustomExercise({
        id: customExerciseDraft.id.trim() || undefined,
        canonicalNamePt: customExerciseDraft.canonicalNamePt.trim(),
        muscleGroup: customExerciseDraft.muscleGroup,
        equipment: customExerciseDraft.equipment.trim() || undefined,
        sourceFileName: customExerciseDraft.sourceFileName.trim(),
        videoUrl: customExerciseDraft.videoUrl.trim(),
        fileSizeBytes: Number(customExerciseDraft.fileSizeBytes),
        durationSeconds: Number(customExerciseDraft.durationSeconds),
        width: Number(customExerciseDraft.width),
        height: Number(customExerciseDraft.height),
        fps: Number(customExerciseDraft.fps),
        mimeType: "video/mp4",
        hasAudio: customExerciseDraft.hasAudio,
      });
      toast.success("Exercício enviado para aprovação técnica.");
      setCustomExerciseDraft(blankCustomExerciseDraft());
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message || EXERCISE_VIDEO_ERROR_COPY : adminErrorMessage(error));
    } finally {
      setCreatingCustomExercise(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Panel title="Treino oficial">
        <PlanStatus source={value.source} locked={value.lockedByCoach} />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Título" value={value.title || ""} onChange={(title) => onChange({ ...value, title, focus: title || value.focus })} />
          <Field label="Grupo muscular / foco" value={value.focus || ""} onChange={(focus) => onChange({ ...value, focus })} />
          <Field label="Dia" value={value.weekDay || ""} onChange={(weekDay) => onChange({ ...value, weekDay })} />
          <Field label="Local" value={value.location || ""} onChange={(location) => onChange({ ...value, location })} />
          <Field label="Duração estimada" value={String(value.estimatedDurationMinutes || "")} onChange={(estimatedDurationMinutes) => onChange({ ...value, estimatedDurationMinutes: Number(estimatedDurationMinutes) || undefined })} />
          <Field label="Dificuldade" value={value.difficulty || ""} onChange={(difficulty) => onChange({ ...value, difficulty })} />
          <Field label="Observações do coach" value={value.coachNotes || ""} onChange={(coachNotes) => onChange({ ...value, coachNotes, summary: coachNotes || value.summary })} className="md:col-span-2" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white" disabled={acting} onClick={onSave}><Save className="mr-2 h-4 w-4" />Salvar alterações</Button>
          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onCreateManual}><Dumbbell className="mr-2 h-4 w-4" />Criar treino manual</Button>
          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onGenerate}><RefreshCw className="mr-2 h-4 w-4" />Gerar com GUTO</Button>
          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={() => onChange({ ...value, title: `${value.title || value.focus} cópia`, source: "coach_manual", lockedByCoach: true })}>Duplicar treino</Button>
          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onLock}>{value.lockedByCoach ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}{value.lockedByCoach ? "Permitir GUTO atualizar" : "Bloquear alterações automáticas"}</Button>
          <Button variant="outline" className="border-red-500/30 bg-transparent text-red-300" disabled={acting} onClick={onReset}><Trash2 className="mr-2 h-4 w-4" />Resetar treino</Button>
        </div>
      </Panel>

      <Panel title="Adicionar novo exercício">
        <div className="mb-4 rounded-md border border-[#00e5ff]/25 bg-[#00e5ff]/10 px-3 py-2">
          <p className="text-xs font-bold text-[#baf7ff]">{EXERCISE_VIDEO_LIMIT_COPY}</p>
          <p className="mt-1 text-[11px] text-white/40">Não há upload real aqui: o vídeo precisa estar previamente otimizado e disponível no caminho interno controlado.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Nome oficial" value={customExerciseDraft.canonicalNamePt} onChange={(canonicalNamePt) => updateCustomExerciseDraft({ canonicalNamePt })} className="md:col-span-2" />
          <Field label="ID opcional" value={customExerciseDraft.id} onChange={(id) => updateCustomExerciseDraft({ id })} />
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">Grupo</span>
            <select
              value={customExerciseDraft.muscleGroup}
              onChange={(event) => updateCustomExerciseDraft({ muscleGroup: event.target.value })}
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
            >
              {["aquecimento", "peito", "costas", "ombro", "bracos", "pernas", "abdomen"].map((group) => (
                <option key={group} value={group} className="bg-[#0d1426]">{group}</option>
              ))}
            </select>
          </label>
          <Field label="Equipamento" value={customExerciseDraft.equipment} onChange={(equipment) => updateCustomExerciseDraft({ equipment })} />
          <Field label="Arquivo MP4 seguro" value={customExerciseDraft.sourceFileName} onChange={(sourceFileName) => updateCustomExerciseDraft({ sourceFileName })} />
          <Field label="Caminho interno" value={customExerciseDraft.videoUrl} onChange={(videoUrl) => updateCustomExerciseDraft({ videoUrl })} className="md:col-span-2" />
          <Field label="Bytes" value={customExerciseDraft.fileSizeBytes} onChange={(fileSizeBytes) => updateCustomExerciseDraft({ fileSizeBytes })} />
          <Field label="Duração s" value={customExerciseDraft.durationSeconds} onChange={(durationSeconds) => updateCustomExerciseDraft({ durationSeconds })} />
          <Field label="Width" value={customExerciseDraft.width} onChange={(width) => updateCustomExerciseDraft({ width })} />
          <Field label="Height" value={customExerciseDraft.height} onChange={(height) => updateCustomExerciseDraft({ height })} />
          <Field label="FPS" value={customExerciseDraft.fps} onChange={(fps) => updateCustomExerciseDraft({ fps })} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-white/55">
          <input type="checkbox" checked={customExerciseDraft.hasAudio} onChange={(event) => updateCustomExerciseDraft({ hasAudio: event.target.checked })} />
          Vídeo tem áudio
        </label>
        <Button className="mt-4 bg-[#00e5ff] text-[#0a0f1e] hover:bg-white" disabled={acting || creatingCustomExercise} onClick={() => void submitCustomExercise()}>
          <FileVideo className="mr-2 h-4 w-4" />
          Enviar para aprovação
        </Button>
      </Panel>

      <Panel title={`Exercícios de ${student.name}`}>
        <div className="grid gap-3">
          {value.exercises.map((exercise, index) => (
            <div key={`${exercise.id}-${index}`} className="rounded-lg border border-white/8 bg-black/15 p-3">
              {(() => {
                const selectedCatalogExercise = exerciseCatalog.find((item) => item.id === exercise.id);
                const searchTerm = exerciseSearch[index] ?? "";
                const normalizedSearch = normalizeCatalogSearch(searchTerm);
                const matches = normalizedSearch
                  ? exerciseCatalog
                      .filter((item) => catalogSearchText(item).includes(normalizedSearch))
                      .slice(0, 8)
                  : [];
                const needsCatalogSelection = !selectedCatalogExercise;

                return (
                  <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-white/35">#{index + 1}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-8 border-white/10 bg-white/5 text-white" onClick={() => moveExercise(index, -1)}>↑</Button>
                  <Button size="sm" variant="outline" className="h-8 border-white/10 bg-white/5 text-white" onClick={() => moveExercise(index, 1)}>↓</Button>
                  <Button size="sm" variant="outline" className="h-8 border-red-500/30 bg-transparent text-red-300" onClick={() => removeExercise(index)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="mb-3 grid gap-2 md:grid-cols-[1fr_7rem]">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">Exercício oficial</span>
                  <Input
                    value={searchTerm}
                    onChange={(event) => setExerciseSearch((current) => ({ ...current, [index]: event.target.value }))}
                    placeholder={selectedCatalogExercise ? selectedCatalogExercise.canonicalNamePt : "Pesquisar no catálogo oficial"}
                    className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                  />
                </label>
                <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-white/30">Catálogo</span>
                  <span className={selectedCatalogExercise ? "text-xs font-black text-[#00e5ff]" : "text-xs font-black text-red-300"}>
                    {selectedCatalogExercise ? selectedCatalogExercise.id : "Não escolhido"}
                  </span>
                </div>
              </div>
              {matches.length > 0 && (
                <div className="mb-3 grid gap-1.5">
                  {matches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectCatalogExercise(index, item)}
                      className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-left hover:border-[#00e5ff]/45"
                    >
                      <span className="block text-xs font-black text-white">{item.canonicalNamePt}</span>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-white/35">{item.muscleGroup} · {item.id}</span>
                    </button>
                  ))}
                </div>
              )}
              {normalizedSearch && matches.length === 0 && (
                <p className="mb-3 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  Exercício não encontrado no catálogo. Para usar este exercício, ele precisa ser adicionado ao catálogo oficial com vídeo local validado.
                </p>
              )}
              {needsCatalogSelection && !normalizedSearch && (
                <p className="mb-3 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  Escolha um exercício do catálogo oficial antes de salvar.
                </p>
              )}
              {selectedCatalogExercise && (
                <div className="mb-3 grid gap-2 md:grid-cols-[7rem_1fr]">
                  <div className="h-[76px] overflow-hidden rounded-md border border-[#00e5ff]/30 bg-black/20">
                    <video src={selectedCatalogExercise.videoUrl} muted loop playsInline preload="metadata" className="h-full w-full object-contain" />
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2">
                    <p className="text-sm font-black text-white">{selectedCatalogExercise.canonicalNamePt}</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-white/35">
                      {selectedCatalogExercise.muscleGroup} · {selectedCatalogExercise.equipment || "sem equipamento"}
                    </p>
                    <p className="mt-1 break-all font-mono text-[9px] text-white/25">{selectedCatalogExercise.videoUrl}</p>
                  </div>
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-4">
                <Field label="Séries" value={String(exercise.sets)} onChange={(sets) => updateExercise(index, { sets: Number(sets) || 0 })} />
                <Field label="Reps" value={String(exercise.reps)} onChange={(reps) => updateExercise(index, { reps })} />
                <Field label="Carga" value={String(exercise.load || "")} onChange={(load) => updateExercise(index, { load })} />
                <Field label="Intervalo" value={exercise.rest} onChange={(rest) => updateExercise(index, { rest })} />
                <Field label="Técnica" value={exercise.cue || ""} onChange={(cue) => updateExercise(index, { cue })} className="md:col-span-2" />
                <Field label="Observação" value={exercise.note || ""} onChange={(note) => updateExercise(index, { note })} className="md:col-span-2" />
                <Field label="Substituições" value={(exercise.alternatives || []).join(", ")} onChange={(alternatives) => updateExercise(index, { alternatives: alternatives.split(",").map((item) => item.trim()).filter(Boolean) })} className="md:col-span-4" />
              </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-4 border-white/10 bg-white/5 text-white" onClick={() => onChange({ ...value, exercises: [...value.exercises, blankExercise(value.exercises.length)] })}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar exercício
        </Button>
      </Panel>

      <Panel title="Histórico do treino">
        <LogList logs={history} empty="Sem histórico de treino." />
      </Panel>
    </div>
  );
}

function DietEditor({
  student,
  value,
  history,
  acting,
  onChange,
  onSave,
  onCreateManual,
  onGenerate,
  onLock,
  onReset,
}: {
  student: AdminStudent;
  value: DietPlan;
  history: AdminLog[];
  acting: boolean;
  onChange: (value: DietPlan) => void;
  onSave: () => void;
  onCreateManual: () => void;
  onGenerate: () => void;
  onLock: () => void;
  onReset: () => void;
}) {
  const updateMeal = (index: number, patch: Partial<DietPlan["meals"][number]>) => {
    onChange({ ...value, meals: value.meals.map((meal, i) => i === index ? { ...meal, ...patch } : meal) });
  };
  const updateFood = (mealIndex: number, foodIndex: number, patch: Partial<DietPlan["meals"][number]["foods"][number]>) => {
    onChange({
      ...value,
      meals: value.meals.map((meal, i) => i === mealIndex
        ? { ...meal, foods: meal.foods.map((food, j) => j === foodIndex ? { ...food, ...patch } : food) }
        : meal),
    });
  };

  return (
    <div className="grid gap-4">
      <Panel title="Dieta oficial">
        <PlanStatus source={value.source} locked={value.lockedByCoach} />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Field label="Título" value={value.title || ""} onChange={(title) => onChange({ ...value, title })} className="md:col-span-2" />
          <Field label="País" value={value.country || ""} onChange={(country) => onChange({ ...value, country })} />
          <Field label="Calorias" value={String(value.macros.targetKcal)} onChange={(targetKcal) => onChange({ ...value, macros: { ...value.macros, targetKcal: Number(targetKcal) || 0 } })} />
          <Field label="Proteína g" value={String(value.macros.proteinG)} onChange={(proteinG) => onChange({ ...value, macros: { ...value.macros, proteinG: Number(proteinG) || 0 } })} />
          <Field label="Carbo g" value={String(value.macros.carbsG)} onChange={(carbsG) => onChange({ ...value, macros: { ...value.macros, carbsG: Number(carbsG) || 0 } })} />
          <Field label="Gordura g" value={String(value.macros.fatG)} onChange={(fatG) => onChange({ ...value, macros: { ...value.macros, fatG: Number(fatG) || 0 } })} />
          <Field label="Restrições" value={value.foodRestrictions || ""} onChange={(foodRestrictions) => onChange({ ...value, foodRestrictions })} />
          <Field label="Notas do coach" value={value.coachNotes || ""} onChange={(coachNotes) => onChange({ ...value, coachNotes })} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white" disabled={acting} onClick={onSave}><Save className="mr-2 h-4 w-4" />Salvar alterações</Button>
          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onCreateManual}><Utensils className="mr-2 h-4 w-4" />Criar dieta manual</Button>
          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onGenerate}><RefreshCw className="mr-2 h-4 w-4" />Gerar com GUTO</Button>
          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onLock}>{value.lockedByCoach ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}{value.lockedByCoach ? "Permitir GUTO atualizar" : "Bloquear alterações automáticas"}</Button>
          <Button variant="outline" className="border-red-500/30 bg-transparent text-red-300" disabled={acting} onClick={onReset}><Trash2 className="mr-2 h-4 w-4" />Resetar dieta</Button>
        </div>
      </Panel>

      <Panel title={`Refeições de ${student.name}`}>
        <div className="grid gap-3">
          {value.meals.map((meal, mealIndex) => (
            <div key={`${meal.id}-${mealIndex}`} className="rounded-lg border border-white/8 bg-black/15 p-3">
              <div className="grid gap-3 md:grid-cols-4">
                <Field label="Refeição" value={meal.name} onChange={(name) => updateMeal(mealIndex, { name })} className="md:col-span-2" />
                <Field label="Horário" value={meal.time} onChange={(time) => updateMeal(mealIndex, { time })} />
                <Field label="Kcal" value={String(meal.totalKcal)} onChange={(totalKcal) => updateMeal(mealIndex, { totalKcal: Number(totalKcal) || 0 })} />
                <Field label="Substituições" value={(meal.alternatives || []).join(", ")} onChange={(alternatives) => updateMeal(mealIndex, { alternatives: alternatives.split(",").map((item) => item.trim()).filter(Boolean) })} className="md:col-span-4" />
              </div>
              <div className="mt-3 grid gap-2">
                {meal.foods.map((food, foodIndex) => (
                  <div key={`${food.name}-${foodIndex}`} className="grid gap-2 rounded-md bg-white/[0.035] p-2 md:grid-cols-[1fr_1fr_.6fr_auto]">
                    <Input value={food.name} onChange={(event) => updateFood(mealIndex, foodIndex, { name: event.target.value })} placeholder="Alimento" className="border-white/10 bg-white/5 text-white" />
                    <Input value={food.quantity} onChange={(event) => updateFood(mealIndex, foodIndex, { quantity: event.target.value })} placeholder="Quantidade" className="border-white/10 bg-white/5 text-white" />
                    <Input value={String(food.kcal || "")} onChange={(event) => updateFood(mealIndex, foodIndex, { kcal: Number(event.target.value) || 0 })} placeholder="kcal" className="border-white/10 bg-white/5 text-white" />
                    <Button variant="outline" className="border-red-500/30 bg-transparent text-red-300" onClick={() => updateMeal(mealIndex, { foods: meal.foods.filter((_, index) => index !== foodIndex) })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-3 border-white/10 bg-white/5 text-white" onClick={() => updateMeal(mealIndex, { foods: [...meal.foods, { name: "", quantity: "", kcal: 0, notes: "" }] })}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar alimento
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-4 border-white/10 bg-white/5 text-white" onClick={() => onChange({ ...value, meals: [...value.meals, { id: `meal-${Date.now()}`, name: "Nova refeição", time: "", totalKcal: 0, gutoNote: "", foods: [] }] })}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar refeição
        </Button>
      </Panel>

      <Panel title="Histórico da dieta">
        <LogList logs={history} empty="Sem histórico de dieta." />
      </Panel>
    </div>
  );
}

function PlanStatus({ source, locked }: { source?: string; locked?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className="border-[#00e5ff]/35 text-[#00e5ff]">{sourceLabel(source)}</Badge>
      <Badge variant={locked ? "default" : "secondary"}>{locked ? "Bloqueado contra GUTO" : "GUTO pode atualizar"}</Badge>
    </div>
  );
}

function LogList({ logs, empty }: { logs: AdminLog[]; empty: string }) {
  if (!logs.length) return <p className="text-sm text-white/35">{empty}</p>;
  return (
    <div className="grid gap-2">
      {logs.slice(0, 80).map((log, index) => (
        <div key={log.id || index} className="rounded-lg border border-white/7 bg-black/15 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-white">{log.action || "ação"}</span>
            <span className="font-mono text-[10px] text-white/35">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}</span>
          </div>
          <p className="mt-1 font-mono text-[10px] text-white/35">{log.actorRole || "-"} · {log.actorUserId || "-"}</p>
        </div>
      ))}
    </div>
  );
}

function RankingSection({ title, items, showStreak }: { title: string; items: RankingItem[]; showStreak?: boolean }) {
  return (
    <Panel title={title}>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.userId} className="flex items-center justify-between rounded-lg bg-black/15 p-3">
            <div>
              <p className="font-bold text-white">{item.position}º {item.pairName}</p>
              <p className="font-mono text-[10px] text-white/35">{avatarStageLabel(item.avatarStage)}{showStreak && item.currentStreak ? ` · ${item.currentStreak}d` : ""}</p>
            </div>
            <p className="font-mono text-sm font-black text-[#00e5ff]">{item.xp} XP</p>
          </div>
        ))}
        {!items.length && <p className="text-sm text-white/35">Sem ranking.</p>}
      </div>
    </Panel>
  );
}

function CreateStudentDialog({
  open,
  onOpenChange,
  draft,
  coaches,
  isAdmin,
  acting,
  onDraftChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: StudentDraft;
  coaches: AdminCoach[];
  isAdmin: boolean;
  acting: boolean;
  onDraftChange: (draft: StudentDraft) => void;
  onCreate: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10 bg-[#0d1426] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Criar aluno</AlertDialogTitle>
          <AlertDialogDescription className="text-white/45">Cria acesso real no backend. Sem senha, o backend gera convite.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-3">
          <Field label="Nome" value={draft.name} onChange={(name) => onDraftChange({ ...draft, name })} />
          <Field label="Email" value={draft.email} onChange={(email) => onDraftChange({ ...draft, email })} />
          <Field label="Senha inicial opcional" value={draft.password} onChange={(password) => onDraftChange({ ...draft, password })} />
          {isAdmin && (
            <select value={draft.coachId} onChange={(event) => onDraftChange({ ...draft, coachId: event.target.value })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
              <option value="" className="bg-[#0d1426]">Coach responsável</option>
              {coaches.map((coach) => <option key={coach.userId} value={coach.userId} className="bg-[#0d1426]">{coach.name || coach.userId}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm text-white/60">
            <input type="checkbox" checked={draft.active} onChange={(event) => onDraftChange({ ...draft, active: event.target.checked })} />
            Ativar acesso agora
          </label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white">Cancelar</AlertDialogCancel>
          <Button disabled={acting || !draft.name.trim()} onClick={onCreate} className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white">Criar</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CreateCoachDialog({
  open,
  onOpenChange,
  draft,
  acting,
  onDraftChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: CoachDraft;
  acting: boolean;
  onDraftChange: (draft: CoachDraft) => void;
  onCreate: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10 bg-[#0d1426] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Criar coach</AlertDialogTitle>
          <AlertDialogDescription className="text-white/45">Somente super admin/admin pode criar coach.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-3">
          <Field label="Nome" value={draft.name} onChange={(name) => onDraftChange({ ...draft, name })} />
          <Field label="Email" value={draft.email} onChange={(email) => onDraftChange({ ...draft, email })} />
          <Field label="Senha opcional" value={draft.password} onChange={(password) => onDraftChange({ ...draft, password })} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white">Cancelar</AlertDialogCancel>
          <Button disabled={acting || !draft.name.trim() || !draft.email.trim()} onClick={onCreate} className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white">Criar coach</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function CoachPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-[#00e5ff]">Sincronizando GUTO</div>}>
      <CoachInner />
    </Suspense>
  );
}
