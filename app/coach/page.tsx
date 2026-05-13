"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Building2,
  ChevronRight,
  Copy,
  Dumbbell,
  FileVideo,
  History,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Signal,
  Trash2,
  Unlock,
  UserPlus,
  Users,
  Utensils,
  X,
  Zap,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  assignStudentToCoach,
  createAdminCoach,
  createAdminCustomExercise,
  createAdminStudent,
  createAdminTeam,
  updateAdminTeam,
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
  getAdminStudentInvite,
  getAdminStudentWorkout,
  getAdminStudentWorkoutHistory,
  getAdminStudents,
  getAdminTeamSummary,
  getAdminTeams,
  lockAdminStudentDiet,
  lockAdminStudentWorkout,
  pauseAdminStudent,
  reactivateAdminStudent,
  regenerateAdminStudentInvite,
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
  getAdminStudentWeeklyWorkout,
  updateAdminStudentWeeklyWorkout,
  getStudentWeeklyDiet,
  saveStudentWeeklyDiet,
  type AdminCatalogExercise,
  type AdminCoach,
  type AdminLog,
  type AdminStudent,
  type AdminTeam,
  type AdminTeamSummary,
  type AdminWeeklyWorkoutPlan,
  type AdminWeeklyWorkoutDays,
  type AdminWeeklyDietPlan,
  type AdminWeeklyDietDays,
  type AdminWeeklyDietDay,
  type WeekDayKey,
} from "@/lib/api/admin";
import type { DietPlan, GutoMemory, GutoWorkoutExercise, GutoWorkoutPlan } from "@/lib/api/guto";
import { formatCode, TRAINING_LOCATION_LABELS, BIOLOGICAL_SEX_LABELS, SUBSCRIPTION_STATUS_LABELS } from "@/lib/format-codes";

type AvatarStage = "baby" | "teen" | "adult" | "elite";
type DashboardTab = "students" | "coaches" | "arena" | "logs" | "teams";
type FilterTab = "ativos" | "pausados" | "arquivados" | "todos";
type DetailTab = "resumo" | "acesso" | "calibragem" | "treino" | "dieta" | "arena" | "seguranca";
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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  active: boolean;
  coachId: string;
  teamId: string;
  sex: string;
  age: string;
};

type CoachDraft = {
  name: string;
  email: string;
  password: string;
  teamId: string;
};

type TeamDraft = {
  name: string;
  plan: "start" | "pro" | "elite" | "custom";
  maxStudents: string;
  maxCoaches: string;
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

type DashboardNavItem = {
  id: DashboardTab;
  label: string;
  icon: ReactNode;
  badge?: ReactNode;
};

const SOURCE_LABEL: Record<string, string> = {
  guto_generated: "Gerado pelo GUTO",
  coach_manual: "Manual do Coach",
  mixed: "Editado pelo Coach",
};

function getDetailTabs(isAdmin: boolean): Array<{ id: DetailTab; label: string }> {
  const allTabs: Array<{ id: DetailTab; label: string }> = [
    { id: "resumo", label: "Resumo" },
    { id: "calibragem", label: "Calibragem" },
    { id: "treino", label: "Treino" },
    { id: "dieta", label: "Dieta" },
  ];
  if (isAdmin) {
    allTabs.splice(1, 0, { id: "acesso", label: "Acesso" });
    allTabs.push({ id: "arena", label: "Arena/XP" });
    allTabs.push({ id: "seguranca", label: "Senha" });
  }
  return allTabs;
}

function dashboardScreenMeta(tab: DashboardTab, isSuperAdmin: boolean): { kicker: string; title: string; subtitle: string } {
  const scope = isSuperAdmin ? "super admin" : "operação";
  const map: Record<DashboardTab, { kicker: string; title: string; subtitle: string }> = {
    students: { kicker: "SALA DE CONTROLE / ALUNOS", title: "Alunos", subtitle: `Base operacional · ${scope} · ação rápida` },
    coaches: { kicker: "SALA DE CONTROLE / COACHES", title: "Coaches", subtitle: "Operadores limitados · permissões e vínculo com alunos" },
    arena: { kicker: "SALA DE CONTROLE / ARENA", title: "Arena", subtitle: "XP semanal e mensal por time · ranking individual global" },
    logs: { kicker: "SALA DE CONTROLE / HISTÓRICO", title: "Histórico", subtitle: "Auditoria das ações críticas do painel" },
    teams: { kicker: "SALA DE CONTROLE / TIMES", title: "Times", subtitle: "Empresas, planos e limites B2B" },
  };
  return map[tab];
}

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
    const code = error.details && typeof error.details === "object" && "code" in error.details ? String(error.details.code) : "";
    if (code === "GUTO_TEAM_PLAN_LIMIT_REACHED") return "Limite do plano GUTO Time atingido.";
    if (error.status === 403) return "Você não tem acesso a este aluno.";
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

function coachLabel(student: AdminStudent, coaches: AdminCoach[]): string {
  if (student.coachName) return student.coachName;
  const coach = coaches.find((item) => item.userId === student.coachId);
  return coach?.name || coach?.email || student.coachId || "-";
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

function formatHuman(val: string | null | undefined): string {
  if (!val) return "-";
  const m: Record<string, string> = {
    active: "Ativo",
    paused: "Pausado",
    archived: "Arquivado",
    paid: "Pago",
    unpaid: "Pendente",
    pending_payment: "Pagamento pendente",
    trial: "Teste",
    expired: "Expirado",
    cancelled: "Cancelado",
    muscle_gain: "Ganho de massa",
    fat_loss: "Perda de gordura",
    conditioning: "Condicionamento",
    mobility_health: "Saúde e mobilidade",
    consistency: "Consistência",
    maintenance: "Manutenção",
    gym: "Academia",
    home: "Casa",
    park: "Parque",
    mixed: "Misto",
    start: "GUTO Time Start",
    pro: "GUTO Time Pro",
    elite: "GUTO Time Elite",
    custom: "Custom",
  };
  return m[val] ?? val.replace(/_/g, " ");
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidPhone(value: string): boolean {
  const digits = phoneDigits(value);
  return digits.length >= 8 && digits.length <= 15 && !/^(\d)\1+$/.test(digits);
}

function studentDraftError(draft: StudentDraft, isSuperAdmin: boolean): string | null {
  if (!draft.firstName.trim()) return "Informe o nome.";
  if (!draft.lastName.trim()) return "Informe o sobrenome.";
  if (!isValidEmail(draft.email)) return "Informe um email válido.";
  if (!isValidPhone(draft.phone)) return "Informe um telefone válido.";
  if (isSuperAdmin && !draft.teamId) return "Selecione um Time.";
  return null;
}

function CoachInner() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardTab>("students");
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [coaches, setCoaches] = useState<AdminCoach[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [teamSummary, setTeamSummary] = useState<AdminTeamSummary | null>(null);
  const [teamSummaryError, setTeamSummaryError] = useState<string | null>(null);
  const [exerciseCatalog, setExerciseCatalog] = useState<AdminCatalogExercise[]>([]);
  const [rankings, setRankings] = useState<RankingsData | null>(null);
  const [globalLogs, setGlobalLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("ativos");
  const [coachFilter, setCoachFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [minAgeFilter, setMinAgeFilter] = useState("");
  const [maxAgeFilter, setMaxAgeFilter] = useState("");
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<StudentDetail | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("resumo");
  const [workoutEditor, setWorkoutEditor] = useState<GutoWorkoutPlan | null>(null);
  const [weeklyWorkoutPlan, setWeeklyWorkoutPlan] = useState<AdminWeeklyWorkoutPlan | null>(null);
  const [treinoSubTab, setTreinoSubTab] = useState<"oficial" | "semana">("oficial");
  const [dietaSubTab, setDietaSubTab] = useState<"oficial" | "semanal">("oficial");
  const [weeklyDietPlan, setWeeklyDietPlan] = useState<AdminWeeklyDietPlan | null>(null);
  const [dietEditor, setDietEditor] = useState<DietPlan | null>(null);
  const [calibrationDraft, setCalibrationDraft] = useState<CalibrationDraft>(calibrationFromMemory(null));
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [showCreateCoach, setShowCreateCoach] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [studentDraft, setStudentDraft] = useState<StudentDraft>({ firstName: "", lastName: "", email: "", phone: "", password: "", active: false, coachId: "", teamId: "", sex: "", age: "" });
  const [coachDraft, setCoachDraft] = useState<CoachDraft>({ name: "", email: "", password: "", teamId: "" });
  const [teamDraft, setTeamDraft] = useState<TeamDraft>({ name: "", plan: "pro", maxStudents: "", maxCoaches: "" });
  const [lastSecret, setLastSecret] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamDraft, setEditTeamDraft] = useState<TeamDraft>({ name: "", plan: "pro", maxStudents: "", maxCoaches: "" });

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";
  const studentLimitReached = Boolean(teamSummary && teamSummary.limits.maxStudents !== null && teamSummary.usage.students >= teamSummary.limits.maxStudents);
  const coachLimitReached = Boolean(teamSummary && teamSummary.limits.maxCoaches !== null && teamSummary.usage.coaches >= teamSummary.limits.maxCoaches);
  const superAdminNeedsTeam = isSuperAdmin && !selectedTeamId;
  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;
  const detailTabs = useMemo(() => getDetailTabs(isAdmin), [isAdmin]);
  const activeFilterCount = [
    search,
    filter !== "ativos" ? filter : "",
    isAdmin ? coachFilter : "",
    genderFilter,
    subscriptionStatusFilter,
    minAgeFilter,
    maxAgeFilter,
  ].filter(Boolean).length;
  const studentSnapshot = useMemo(() => ({
    active: students.filter((student) => student.active && !student.archived).length,
    paused: students.filter((student) => !student.active && !student.archived).length,
    archived: students.filter((student) => student.archived).length,
    visibleArena: students.filter((student) => student.visibleInArena && !student.archived).length,
  }), [students]);
  const dashboardNavItems = useMemo<DashboardNavItem[]>(() => {
    const items: DashboardNavItem[] = [
      { id: "students", label: "ALUNOS", icon: <Users className="h-4 w-4" />, badge: studentSnapshot.active },
      { id: "arena", label: "ARENA", icon: <Activity className="h-4 w-4" /> },
    ];
    if (isAdmin) {
      items.splice(1, 0, { id: "coaches", label: "COACHES", icon: <Shield className="h-4 w-4" />, badge: coaches.length || undefined });
      items.push({ id: "logs", label: "HISTÓRICO", icon: <History className="h-4 w-4" /> });
    }
    if (isSuperAdmin) {
      items.push({ id: "teams", label: "TIMES", icon: <Building2 className="h-4 w-4" />, badge: teams.length || undefined });
    }
    return items;
  }, [coaches.length, isAdmin, isSuperAdmin, studentSnapshot.active, teams.length]);
  const screenMeta = dashboardScreenMeta(activeDashboardTab, isSuperAdmin);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "coach" && user.role !== "admin" && user.role !== "super_admin"))) {
      router.push("/admin/login");
    }
  }, [authLoading, router, user]);

  const fetchStudents = useCallback(async () => {
    const data = await getAdminStudents({
      search,
      coachId: isAdmin ? coachFilter : "",
      gender: genderFilter,
      minAge: minAgeFilter,
      maxAge: maxAgeFilter,
      status:
        filter === "ativos" ? "active" :
        filter === "pausados" ? "paused" :
        filter === "arquivados" ? "archived" :
        "",
      subscriptionStatus: subscriptionStatusFilter,
    });
    setStudents(data.students);
  }, [coachFilter, filter, genderFilter, isAdmin, maxAgeFilter, minAgeFilter, search, subscriptionStatusFilter]);

  const fetchTeamSummary = useCallback(async () => {
    try {
      const data = await getAdminTeamSummary();
      setTeamSummary(data);
      setTeamSummaryError(null);
    } catch (error) {
      setTeamSummaryError(adminErrorMessage(error));
    }
  }, []);

  const fetchCoaches = useCallback(async () => {
    if (!isAdmin) return;
    const data = await getAdminCoaches();
    setCoaches(data.coaches);
  }, [isAdmin]);

  const fetchTeams = useCallback(async () => {
    if (!isSuperAdmin) return;
    const data = await getAdminTeams();
    setTeams(data.teams);
  }, [isSuperAdmin]);

  const fetchExerciseCatalog = useCallback(async () => {
    const data = await getAdminExerciseCatalog();
    setExerciseCatalog(data.exercises);
  }, []);

  const fetchRankings = useCallback(async () => {
    const query = isSuperAdmin && selectedTeamId ? `?teamId=${encodeURIComponent(selectedTeamId)}` : "";
    const data = await apiRequest<RankingsData>(`/guto/coach/rankings${query}`);
    setRankings(data);
  }, [isSuperAdmin, selectedTeamId]);

  const fetchGlobalLogs = useCallback(async () => {
    if (!isAdmin) return;
    const data = await getAdminLogs();
    setGlobalLogs(data.logs);
  }, [isAdmin]);

  const loadBase = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await Promise.all([fetchCoaches(), fetchExerciseCatalog(), fetchTeamSummary(), fetchTeams()]);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [fetchCoaches, fetchExerciseCatalog, fetchTeamSummary, fetchTeams, user]);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (!user) return;
    void fetchStudents().catch((error) => toast.error(adminErrorMessage(error)));
  }, [fetchStudents, user]);

  useEffect(() => {
    if (activeDashboardTab === "arena") void fetchRankings().catch((error) => toast.error(adminErrorMessage(error)));
    if (activeDashboardTab === "logs") void fetchGlobalLogs().catch((error) => toast.error(adminErrorMessage(error)));
  }, [activeDashboardTab, fetchGlobalLogs, fetchRankings]);

  useEffect(() => {
    if (detailTabs.some((tab) => tab.id === detailTab)) return;
    setDetailTab("resumo");
  }, [detailTab, detailTabs]);

  useEffect(() => {
    if (isAdmin || activeDashboardTab === "students" || activeDashboardTab === "arena") return;
    setActiveDashboardTab("students");
  }, [activeDashboardTab, isAdmin]);

  const clearStudentFilters = useCallback(() => {
    setSearch("");
    setFilter("ativos");
    setCoachFilter("");
    setGenderFilter("");
    setSubscriptionStatusFilter("");
    setMinAgeFilter("");
    setMaxAgeFilter("");
  }, []);

  const refreshSelected = useCallback(async (studentId: string) => {
    const [detail, workout, weeklyWorkout, diet, weeklyDiet, logs, workoutHistory, dietHistory] = await Promise.all([
      getAdminStudentDetail(studentId),
      getAdminStudentWorkout(studentId),
      getAdminStudentWeeklyWorkout(studentId),
      getAdminStudentDiet(studentId),
      getStudentWeeklyDiet(studentId),
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
    setWeeklyWorkoutPlan(weeklyWorkout.weeklyWorkout);
    setWeeklyDietPlan(weeklyDiet.weeklyDiet);
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

  const copyStudentInvite = useCallback(async (student: AdminStudent) => {
    try {
      const result = await getAdminStudentInvite(student.userId);
      const link = result.inviteLink ?? (await regenerateAdminStudentInvite(student.userId)).inviteLink;
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar o convite.");
    }
  }, []);

  const act = useCallback(async (fn: () => Promise<void>, successMsg: string) => {
    setActing(true);
    try {
      await fn();
      toast.success(successMsg);
      await Promise.all([fetchStudents(), fetchTeamSummary()]);
      if (selectedDetail) await refreshSelected(selectedDetail.student.userId);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    } finally {
      setActing(false);
    }
  }, [fetchStudents, fetchTeamSummary, refreshSelected, selectedDetail]);

  const filtered = useMemo(() => students, [students]);

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
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-[#04060f] text-[#e8f4ff] selection:bg-[#52e7ff]/30"
      style={{ fontFamily: "\"JetBrains Mono\", \"SF Mono\", Menlo, Monaco, Consolas, monospace" }}
    >
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(80%_60%_at_0%_0%,rgba(82,231,255,0.05)_0%,transparent_60%),radial-gradient(60%_50%_at_100%_100%,rgba(82,231,255,0.04)_0%,transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40 [background:repeating-linear-gradient(0deg,rgba(82,231,255,0.018)_0px,rgba(82,231,255,0.018)_1px,transparent_1px,transparent_3px)]" />
      <Toaster theme="dark" position="bottom-center" />

      <div className="relative z-10 flex h-screen overflow-hidden">
        <AdminSidebar
          items={dashboardNavItems}
          activeTab={activeDashboardTab}
          onSelect={setActiveDashboardTab}
          role={user.role}
          userId={user.userId}
          teamName={selectedTeam?.name || teamSummary?.team.name}
          studentCount={studentSnapshot.active}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminShellHeader
            meta={screenMeta}
            role={user.role}
            selectedTeam={selectedTeam}
            needsTeam={superAdminNeedsTeam}
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
            studentLimitReached={studentLimitReached}
            coachLimitReached={coachLimitReached}
            onClearTeam={() => setSelectedTeamId(null)}
            onCreateTeam={() => setShowCreateTeam(true)}
            onCreateCoach={() => {
              setCoachDraft({ name: "", email: "", password: "", teamId: selectedTeamId || "" });
              setShowCreateCoach(true);
            }}
            onCreateStudent={() => {
              setStudentDraft({ firstName: "", lastName: "", email: "", phone: "", password: "", active: false, coachId: "", teamId: selectedTeamId || "", sex: "", age: "" });
              setShowCreateStudent(true);
            }}
            telemetry={{
              sys: "ONLINE",
              students: String(students.length),
              active: String(studentSnapshot.active),
              filters: String(activeFilterCount || 0),
            }}
          />

          <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 lg:px-7 lg:py-6">
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

        <div className="mb-5 grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <section className="rounded-lg border border-white/8 bg-white/[0.035] p-4">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#00e5ff]">Mural operacional</p>
                <h1 className="mt-1 text-xl font-black text-white">Painel de alunos e accountability</h1>
              </div>
              <p className="font-mono text-[10px] text-white/35">{filtered.length} resultado{filtered.length === 1 ? "" : "s"} na visão atual</p>
            </div>
            {teamSummary ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                <MetricCard label="Time" value={teamSummary.team.name} cyan className="lg:col-span-2" />
                <MetricCard label="Plano" value={formatHuman(teamSummary.team.planLabel)} />
                <MetricCard label="Alunos" value={`${teamSummary.usage.students} / ${teamSummary.limits.maxStudents ?? "∞"}`} />
                <MetricCard label="Ativos" value={studentSnapshot.active} />
                <MetricCard label="Pausados" value={studentSnapshot.paused} />
                <MetricCard label="Arena" value={studentSnapshot.visibleArena} />
              </div>
            ) : (
              <p className="text-xs text-white/35">{teamSummaryError || "Resumo do Time indisponível."}</p>
            )}
            {(studentLimitReached || coachLimitReached) && (
              <p className="mt-3 text-xs font-bold text-[#00e5ff]">
                Limite do plano atingido. Atualize o plano GUTO Time para cadastrar mais {studentLimitReached ? "alunos" : "coaches"}.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-white/8 bg-white/[0.035] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">Escopo</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Metric label="Role" value={user.role.toUpperCase()} cyan />
              <Metric label="Coaches" value={`${teamSummary?.usage.coaches ?? "-"} / ${teamSummary?.limits.maxCoaches ?? "∞"}`} />
              <Metric label="Arquivados" value={studentSnapshot.archived} />
              <Metric label="Filtros" value={activeFilterCount || "limpo"} />
            </div>
          </section>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto rounded-[14px] border border-[#52e7ff]/10 bg-[#0f162a]/80 p-1 lg:hidden">
          {dashboardNavItems.map((item) => (
            <DashboardButton
              key={item.id}
              active={activeDashboardTab === item.id}
              onClick={() => setActiveDashboardTab(item.id)}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </div>

        {activeDashboardTab === "students" && (
          <>
            <div className="mb-4 rounded-lg border border-white/8 bg-white/[0.035] p-4">
              <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Filtros</p>
                  <p className="mt-1 text-sm font-bold text-white">{filtered.length} aluno{filtered.length === 1 ? "" : "s"} encontrado{filtered.length === 1 ? "" : "s"}</p>
                </div>
                <div className="flex flex-row flex-wrap gap-2">
                  {(["ativos", "pausados", "arquivados", "todos"] as FilterTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilter(tab)}
                      className={`flex-none rounded-md border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                        filter === tab ? "border-[#00e5ff] bg-[#00e5ff] text-[#0a0f1e]" : "border-white/10 bg-white/5 text-white/45 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearStudentFilters}
                      className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/55 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                      Limpar
                    </button>
                  )}
                </div>
              </div>
              <div className={`grid gap-2 md:grid-cols-2 ${isAdmin ? "xl:grid-cols-[minmax(260px,1.3fr)_repeat(5,minmax(120px,1fr))]" : "xl:grid-cols-[minmax(260px,1.3fr)_repeat(4,minmax(120px,1fr))]"}`}>
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                  <Input
                    placeholder="Buscar nome, email, telefone ou ID"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-10 border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/25"
                  />
                </label>
                {isAdmin && (
                  <select value={coachFilter} onChange={(event) => setCoachFilter(event.target.value)} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
                    <option value="" className="bg-[#0d1426]">Todos os coaches</option>
                    {coaches.map((coach) => <option key={coach.userId} value={coach.userId} className="bg-[#0d1426]">{coach.name || coach.email || coach.userId}</option>)}
                  </select>
                )}
                <select value={genderFilter} onChange={(event) => setGenderFilter(event.target.value)} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
                  <option value="" className="bg-[#0d1426]">Sexo: todos</option>
                  {Object.entries(BIOLOGICAL_SEX_LABELS).map(([code, label]) => (
                    <option key={code} value={code} className="bg-[#0d1426]">{label}</option>
                  ))}
                </select>
                <select value={subscriptionStatusFilter} onChange={(event) => setSubscriptionStatusFilter(event.target.value)} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
                  <option value="" className="bg-[#0d1426]">Pagamento: todos</option>
                  {Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([code, label]) => (
                    <option key={code} value={code} className="bg-[#0d1426]">{label}</option>
                  ))}
                </select>
                <Input type="number" inputMode="numeric" placeholder="Idade mín." value={minAgeFilter} onChange={(event) => setMinAgeFilter(event.target.value)} className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/25" />
                <Input type="number" inputMode="numeric" placeholder="Idade máx." value={maxAgeFilter} onChange={(event) => setMaxAgeFilter(event.target.value)} className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/25" />
              </div>
            </div>

            <div className="hidden lg:block">
              <StudentDesktopTable students={filtered} coaches={coaches} onOpen={(student) => void openStudent(student)} onCopyInvite={(student) => void copyStudentInvite(student)} />
            </div>
            <div className="grid gap-3 lg:hidden">
              <StudentMobileCards students={filtered} coaches={coaches} onOpen={(student) => void openStudent(student)} onCopyInvite={(student) => void copyStudentInvite(student)} />
            </div>
          </>
        )}

        {isAdmin && activeDashboardTab === "coaches" && (
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

        {isAdmin && activeDashboardTab === "logs" && (
          <LogList logs={globalLogs} empty="Sem logs globais." />
        )}

        {activeDashboardTab === "teams" && isSuperAdmin && (
          <div className="grid gap-3">
            {!selectedTeamId && (
              <div className="rounded-xl border border-[#00e5ff]/20 bg-[#00e5ff]/5 p-3 text-center text-[10px] font-bold text-[#00e5ff]/70">
                Selecione um Time abaixo para criar coaches e alunos nele.
              </div>
            )}
            {teams.map((team) => {
              const isSelected = selectedTeamId === team.id;
              const isEditing = editingTeamId === team.id;
              return (
                <div
                  key={team.id}
                  className={`rounded-xl border p-4 transition ${isSelected ? "border-[#00e5ff]/50 bg-[#00e5ff]/[0.06]" : "border-white/7 bg-white/[0.035]"}`}
                >
                  {isEditing ? (
                    <div className="grid gap-3">
                      <Field label="Nome" value={editTeamDraft.name} onChange={(name) => setEditTeamDraft((d) => ({ ...d, name }))} />
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">Plano</span>
                        <select
                          value={editTeamDraft.plan}
                          onChange={(e) => setEditTeamDraft((d) => ({ ...d, plan: e.target.value as TeamDraft["plan"] }))}
                          className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                        >
                          <option value="start" className="bg-[#0d1426]">GUTO Time Start</option>
                          <option value="pro" className="bg-[#0d1426]">GUTO Time Pro</option>
                          <option value="elite" className="bg-[#0d1426]">GUTO Time Elite</option>
                          <option value="custom" className="bg-[#0d1426]">Custom</option>
                        </select>
                      </label>
                      {editTeamDraft.plan === "custom" && (
                        <>
                          <Field label="Máx. alunos (vazio = ilimitado)" value={editTeamDraft.maxStudents} onChange={(v) => setEditTeamDraft((d) => ({ ...d, maxStudents: v }))} />
                          <Field label="Máx. coaches (vazio = ilimitado)" value={editTeamDraft.maxCoaches} onChange={(v) => setEditTeamDraft((d) => ({ ...d, maxCoaches: v }))} />
                        </>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" disabled={acting} onClick={() => void act(async () => {
                          const customLimits = editTeamDraft.plan === "custom" ? {
                            maxStudents: editTeamDraft.maxStudents ? Number(editTeamDraft.maxStudents) || null : null,
                            maxCoaches: editTeamDraft.maxCoaches ? Number(editTeamDraft.maxCoaches) || null : null,
                          } : undefined;
                          const result = await updateAdminTeam(team.id, { name: editTeamDraft.name, plan: editTeamDraft.plan, customLimits });
                          setTeams((current) => current.map((t) => t.id === team.id ? result.team : t));
                          setEditingTeamId(null);
                        }, "Time atualizado.")} className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white">
                          <Save className="mr-1 h-3 w-3" /> Salvar
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => setEditingTeamId(null)}>
                          Cancelar
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white/50 hover:text-white" disabled={acting} onClick={() => void act(async () => {
                          const next = team.status === "archived" ? "active" : "archived";
                          const result = await updateAdminTeam(team.id, { status: next });
                          setTeams((current) => current.map((t) => t.id === team.id ? result.team : t));
                          setEditingTeamId(null);
                        }, team.status === "archived" ? "Time reativado." : "Time arquivado.")}>
                          {team.status === "archived" ? "Reativar" : "Arquivar"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <p className={`font-black ${isSelected ? "text-[#00e5ff]" : "text-white"}`}>{team.name}</p>
                          {isSelected && <Badge className="bg-[#00e5ff] text-[#0a0f1e] text-[9px] font-black">SELECIONADO</Badge>}
                        </div>
                        <p className="font-mono text-[10px] text-white/35">{team.id} · {formatHuman(team.plan)}</p>
                        {team.customLimits && (
                          <p className="mt-1 font-mono text-[10px] text-white/25">
                            Alunos: {team.customLimits.maxStudents ?? "Ilimitado"} · Coaches: {team.customLimits.maxCoaches ?? "Ilimitado"}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={team.status === "active" ? "default" : "secondary"} className="text-[10px] font-black uppercase">
                          {formatHuman(team.status)}
                        </Badge>
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => {
                          setEditingTeamId(team.id);
                          setEditTeamDraft({ name: team.name, plan: team.plan, maxStudents: String(team.customLimits?.maxStudents ?? ""), maxCoaches: String(team.customLimits?.maxCoaches ?? "") });
                        }}>
                          Editar
                        </Button>
                        <Button size="sm" className={isSelected ? "bg-white/10 text-white" : "bg-[#00e5ff] text-[#0a0f1e] hover:bg-white"} onClick={() => {
                          setSelectedTeamId(isSelected ? null : team.id);
                          if (!isSelected) {
                            setStudentDraft((d) => ({ ...d, teamId: team.id }));
                            setCoachDraft((d) => ({ ...d, teamId: team.id }));
                          }
                        }}>
                          {isSelected ? "Desselecionar" : "Selecionar"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!teams.length && (
              <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-sm text-white/35">
                Nenhum Time cadastrado. Clique em "Criar Time" para começar.
              </div>
            )}
          </div>
        )}
          </main>
        </div>
      </div>

      <Sheet open={!!selectedDetail} onOpenChange={(open) => { if (!open) setSelectedDetail(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto border-l border-white/10 bg-[#0d1426] p-0 text-white sm:max-w-5xl">
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
                  {detailTabs.map((tab) => (
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
                      <DataRow label="Email" value={selected.email || "-"} />
                      <DataRow label="Telefone" value={selected.phone || "-"} />
                      <DataRow label="Assinatura" value={formatHuman(selected.subscriptionStatus)} />
                      <DataRow label="Expira em" value={formatDate(selected.subscriptionEndsAt)} />
                      <DataRow label="Coach" value={coachLabel(selected, coaches)} />
                      {user.role === "super_admin" && <DataRow label="Time" value={teams.find((t) => t.id === selected.teamId)?.name || selected.teamId || "-"} />}
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

                {isAdmin && detailTab === "acesso" && (
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
                          className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-center text-xs font-bold text-white hover:bg-white/10"
                        >
                          <option value="" className="bg-[#0d1426]">Atribuir coach</option>
                          {coaches.map((coach) => (
                            <option key={coach.userId} value={coach.userId} className="bg-[#0d1426]">{coach.name || coach.userId}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="mt-4 border-t border-white/8 pt-4">
                      <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/30">Convite de acesso</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <ActionButton disabled={acting} onClick={() => void act(async () => {
                          const result = await getAdminStudentInvite(selected.userId);
                          if (result.inviteLink) {
                            setLastSecret(result.inviteLink);
                          } else {
                            toast.info(result.message || "Link não disponível. Use regenerar para criar um novo convite.");
                          }
                        }, "Convite carregado.")}>
                          Ver convite atual
                        </ActionButton>
                        <ActionButton disabled={acting} onClick={() => {
                          if (!window.confirm("Regenerar convite? O link anterior deixa de funcionar.")) return;
                          void act(async () => {
                            const result = await regenerateAdminStudentInvite(selected.userId);
                            setLastSecret(result.inviteLink);
                          }, "Novo convite gerado.");
                        }}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerar convite
                        </ActionButton>
                      </div>
                      {lastSecret?.startsWith("http") && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#00e5ff]/30 bg-[#00e5ff]/10 p-3">
                          <p className="min-w-0 flex-1 break-all font-mono text-xs text-white">{lastSecret}</p>
                          <Button size="sm" variant="outline" className="shrink-0 border-white/10 bg-white/5 text-white" onClick={() => { void navigator.clipboard.writeText(lastSecret); toast.success("Link copiado!"); }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
                  <div className="space-y-3">
                    <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                      {(["oficial", "semana"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setTreinoSubTab(tab)}
                          className={`flex-1 rounded-md py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${treinoSubTab === tab ? "bg-[#00e5ff] text-[#0a0f1e]" : "text-white/50 hover:text-white"}`}
                        >
                          {tab === "oficial" ? "Treino oficial" : "Plano semanal"}
                        </button>
                      ))}
                    </div>

                    {treinoSubTab === "oficial" && (
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

                    {treinoSubTab === "semana" && (
                      <WeeklyWorkoutEditor
                        student={selected}
                        weeklyPlan={weeklyWorkoutPlan}
                        exerciseCatalog={exerciseCatalog}
                        acting={acting}
                        onSave={async (days) => {
                          const result = await updateAdminStudentWeeklyWorkout(selected.userId, days);
                          setWeeklyWorkoutPlan(result.weeklyWorkout);
                        }}
                      />
                    )}
                  </div>
                )}

                {detailTab === "dieta" && dietEditor && (
                  <div className="space-y-3">
                    <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                      {(["oficial", "semanal"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setDietaSubTab(tab)}
                          className={`flex-1 rounded-md py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${dietaSubTab === tab ? "bg-[#00e5ff] text-[#0a0f1e]" : "text-white/50 hover:text-white"}`}
                        >
                          {tab === "oficial" ? "Dieta oficial" : "Plano semanal"}
                        </button>
                      ))}
                    </div>

                    {dietaSubTab === "oficial" && (
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

                    {dietaSubTab === "semanal" && (
                      <WeeklyDietEditor
                        student={selected}
                        weeklyPlan={weeklyDietPlan}
                        acting={acting}
                        onSave={async (days) => {
                          const result = await saveStudentWeeklyDiet(selected.userId, days);
                          setWeeklyDietPlan(result.weeklyDiet);
                        }}
                      />
                    )}
                  </div>
                )}

                {isAdmin && detailTab === "arena" && (
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

                {isAdmin && detailTab === "seguranca" && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Panel title="Senha temporária">
                      <div className="grid gap-3">
                        <ActionButton disabled={acting} onClick={() => void act(async () => {
                          const result = await resetAdminStudentPassword(selected.userId);
                          setLastSecret(result.temporaryPassword || null);
                        }, "Senha temporária gerada.")}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Gerar senha temporária
                        </ActionButton>
                        {lastSecret && (
                          <div className="rounded-lg border border-[#00e5ff]/30 bg-[#00e5ff]/10 p-4">
                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#00e5ff]">Senha temporária</p>
                            <p className="font-mono text-lg font-black text-white">{lastSecret}</p>
                          </div>
                        )}
                      </div>
                    </Panel>
                    <Panel title="Zona crítica">
                      <div className="grid gap-3">
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
                        <p className="text-xs font-bold leading-relaxed text-white/35">A exclusão permanente apaga dados vinculados do aluno. Use somente quando a empresa pedir remoção definitiva.</p>
                      </div>
                    </Panel>
                  </div>
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
        teams={teams}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        acting={acting}
        limitReached={studentLimitReached}
        onDraftChange={setStudentDraft}
        onCreate={() => void act(async () => {
          const result = await createAdminStudent({
            firstName: studentDraft.firstName,
            lastName: studentDraft.lastName,
            name: `${studentDraft.firstName.trim()} ${studentDraft.lastName.trim()}`.trim(),
            email: studentDraft.email || undefined,
            phone: studentDraft.phone || undefined,
            password: studentDraft.password || undefined,
            active: studentDraft.active,
            coachId: studentDraft.coachId || undefined,
            teamId: studentDraft.teamId || undefined,
            biologicalSex: studentDraft.sex || undefined,
            age: studentDraft.age ? parseInt(studentDraft.age) || undefined : undefined,
          });
          if (result.inviteLink) setLastSecret(result.inviteLink);
          setStudentDraft({ firstName: "", lastName: "", email: "", phone: "", password: "", active: false, coachId: "", teamId: "", sex: "", age: "" });
          setShowCreateStudent(false);
        }, "Aluno criado.")}
      />

      <CreateCoachDialog
        open={showCreateCoach}
        onOpenChange={setShowCreateCoach}
        draft={coachDraft}
        teams={teams}
        isSuperAdmin={isSuperAdmin}
        acting={acting}
        limitReached={coachLimitReached}
        onDraftChange={setCoachDraft}
        onCreate={() => void act(async () => {
          const result = await createAdminCoach({
            name: coachDraft.name,
            email: coachDraft.email,
            password: coachDraft.password || undefined,
            teamId: coachDraft.teamId || undefined,
          });
          setCoaches((current) => [result.coach, ...current]);
          if (result.temporaryPassword) setLastSecret(result.temporaryPassword);
          setCoachDraft({ name: "", email: "", password: "", teamId: "" });
          setShowCreateCoach(false);
        }, "Coach criado.")}
      />

      <CreateTeamDialog
        open={showCreateTeam}
        onOpenChange={setShowCreateTeam}
        draft={teamDraft}
        acting={acting}
        onDraftChange={setTeamDraft}
        onCreate={() => void act(async () => {
          const customLimits = teamDraft.plan === "custom" ? {
            maxStudents: teamDraft.maxStudents ? Number(teamDraft.maxStudents) || null : null,
            maxCoaches: teamDraft.maxCoaches ? Number(teamDraft.maxCoaches) || null : null,
          } : undefined;
          const result = await createAdminTeam({ name: teamDraft.name, plan: teamDraft.plan, customLimits });
          setTeams((current) => [...current, result.team]);
          setSelectedTeamId(result.team.id);
          setStudentDraft((d) => ({ ...d, teamId: result.team.id }));
          setCoachDraft((d) => ({ ...d, teamId: result.team.id }));
          setTeamDraft({ name: "", plan: "pro", maxStudents: "", maxCoaches: "" });
          setShowCreateTeam(false);
        }, "Time criado.")}
      />
    </div>
  );
}

function AdminSidebar({
  items,
  activeTab,
  onSelect,
  role,
  userId,
  teamName,
  studentCount,
}: {
  items: DashboardNavItem[];
  activeTab: DashboardTab;
  onSelect: (tab: DashboardTab) => void;
  role: string;
  userId: string;
  teamName?: string;
  studentCount: number;
}) {
  const validationError = studentDraftError(draft, isSuperAdmin);
  return (
    <aside className="hidden h-screen w-[232px] shrink-0 flex-col overflow-hidden border-r border-[#52e7ff]/10 bg-[#040710]/95 lg:flex">
      <div className="h-[72px] shrink-0 border-b border-[#52e7ff]/10 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(82,231,255,0.08)_0%,rgba(82,231,255,0)_70%)] px-4 py-3">
        <div className="text-[18px] font-black leading-none tracking-[0.34em] text-[#52e7ff] drop-shadow-[0_0_8px_rgba(82,231,255,0.45)]">GUTO</div>
        <div className="mt-2 text-[8px] font-black uppercase tracking-[0.30em] text-[#52e7ff]/85">Sala de controle</div>
      </div>

      <div className="shrink-0 border-b border-[#52e7ff]/10 px-4 py-3">
        <div className="mb-2 text-[8px] font-black uppercase tracking-[0.30em] text-white/20">Hierarquia</div>
        <div className="space-y-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/32">
          <div className="text-[#52e7ff]">{role.replace("_", " ")}</div>
          <div>{teamName || "Time não selecionado"}</div>
          <div className="text-white/22">{studentCount} alunos ativos</div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto py-3">
        {items.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex h-10 w-full items-center gap-3 border-r-2 px-4 text-left text-[10px] font-black uppercase tracking-[0.22em] transition ${
                active
                  ? "border-[#52e7ff] bg-[#52e7ff]/14 text-[#52e7ff]"
                  : "border-transparent text-white/35 hover:bg-white/[0.03] hover:text-white/70"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badge !== undefined && (
                <span className={`rounded-full border px-2 py-0.5 text-[9px] tracking-normal ${active ? "border-[#52e7ff]/30 text-[#52e7ff]" : "border-white/10 text-white/30"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-[#52e7ff]/10 bg-black/30 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80]" />
          <span className="truncate text-[10px] font-black text-white/65">{userId}</span>
        </div>
        <Badge variant="outline" className="border-[#52e7ff]/25 bg-[#52e7ff]/10 text-[9px] font-black uppercase tracking-[0.18em] text-[#52e7ff]">
          {role.toUpperCase()}
        </Badge>
      </div>
    </aside>
  );
}

function AdminShellHeader({
  meta,
  role,
  selectedTeam,
  needsTeam,
  isAdmin,
  isSuperAdmin,
  studentLimitReached,
  coachLimitReached,
  telemetry,
  onClearTeam,
  onCreateTeam,
  onCreateCoach,
  onCreateStudent,
}: {
  meta: { kicker: string; title: string; subtitle: string };
  role: string;
  selectedTeam: AdminTeam | null;
  needsTeam: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  studentLimitReached: boolean;
  coachLimitReached: boolean;
  telemetry: { sys: string; students: string; active: string; filters: string };
  onClearTeam: () => void;
  onCreateTeam: () => void;
  onCreateCoach: () => void;
  onCreateStudent: () => void;
}) {
  return (
    <header className="h-auto shrink-0 border-b border-[#52e7ff]/10 bg-[#080e1c]/90 backdrop-blur-md lg:h-16">
      <div className="flex min-h-16 min-w-0 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:py-0">
        <div className="flex min-w-0 items-center gap-4">
          <div className="lg:hidden">
            <div className="text-sm font-black tracking-[0.30em] text-[#52e7ff]">GUTO</div>
            <div className="mt-1 text-[8px] font-black uppercase tracking-[0.24em] text-white/25">{role.toUpperCase()}</div>
          </div>
          <div className="hidden h-9 w-px bg-[#52e7ff]/10 lg:block" />
          <div className="min-w-0">
            <div className="mb-1 text-[8px] font-black uppercase tracking-[0.34em] text-[#52e7ff]">{meta.kicker}</div>
            <div className="truncate text-lg font-black leading-none text-white">{meta.title}</div>
          </div>
          <div className="hidden h-9 w-px bg-[#52e7ff]/10 xl:block" />
          <div className="hidden max-w-[360px] text-[10px] font-medium tracking-[0.08em] text-white/32 xl:block">{meta.subtitle}</div>
        </div>

        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <TelemetryStamp icon={<Signal className="h-3 w-3" />} label="SYS" value={telemetry.sys} tone="ok" />
          <div className="hidden 2xl:block">
            <TelemetryStamp icon={<Users className="h-3 w-3" />} label="ALUNOS" value={telemetry.students} />
          </div>
          <div className="hidden 2xl:block">
            <TelemetryStamp icon={<Zap className="h-3 w-3" />} label="ATIVOS" value={telemetry.active} />
          </div>
          <div className="hidden 2xl:block">
            <TelemetryStamp icon={<Search className="h-3 w-3" />} label="FILTROS" value={telemetry.filters} />
          </div>

          {(isSuperAdmin || isAdmin) && <div className="mx-1 h-6 w-px shrink-0 bg-[#52e7ff]/10" />}

          {isSuperAdmin && selectedTeam && (
            <div className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#52e7ff]/25 bg-[#52e7ff]/10 px-3">
              <Building2 className="h-3.5 w-3.5 text-[#52e7ff]" />
              <span className="max-w-[180px] truncate text-[10px] font-black text-[#52e7ff]">{selectedTeam.name}</span>
              <button type="button" onClick={onClearTeam} className="text-[#52e7ff]/55 hover:text-[#52e7ff]" aria-label="Limpar time selecionado">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {isSuperAdmin && !selectedTeam && (
            <span className="shrink-0 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
              Selecione um time
            </span>
          )}

          {isSuperAdmin && (
            <Button size="sm" variant="outline" className="h-9 shrink-0 rounded-full border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-white hover:bg-white/10" onClick={onCreateTeam}>
              <Building2 className="mr-2 h-3.5 w-3.5" />
              Time
            </Button>
          )}

          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 shrink-0 rounded-full border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-white hover:bg-white/10 disabled:opacity-30"
              disabled={coachLimitReached || needsTeam}
              title={needsTeam ? "Selecione um Time antes de criar coach." : undefined}
              onClick={onCreateCoach}
            >
              <UserPlus className="mr-2 h-3.5 w-3.5" />
              Coach
            </Button>
          )}

          <Button
            size="sm"
            className="h-9 shrink-0 rounded-full bg-[#52e7ff] px-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#04131e] shadow-[0_0_18px_rgba(82,231,255,0.28)] hover:bg-white disabled:opacity-30"
            disabled={studentLimitReached || needsTeam}
            title={needsTeam ? "Selecione um Time antes de criar aluno." : undefined}
            onClick={onCreateStudent}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Aluno
          </Button>
        </div>
      </div>
    </header>
  );
}

function TelemetryStamp({ icon, label, value, tone = "cyan" }: { icon: ReactNode; label: string; value: ReactNode; tone?: "cyan" | "ok" | "warn" | "bad" }) {
  const color = tone === "ok" ? "text-[#4ade80]" : tone === "warn" ? "text-[#fbbf24]" : tone === "bad" ? "text-[#f87171]" : "text-[#52e7ff]";
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#52e7ff]/10 bg-black/30 px-2.5">
      <span className={color}>{icon}</span>
      <span className="text-[8px] font-black uppercase tracking-[0.22em] text-white/22">{label}</span>
      <span className={`text-[10px] font-black ${color}`}>{value}</span>
    </div>
  );
}

function DashboardButton({ active, onClick, icon, label, disabled }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 min-w-[124px] shrink-0 items-center justify-center gap-2 rounded-[10px] px-3 text-[10px] font-black uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-25 ${
        active ? "bg-[#52e7ff] text-[#04131e]" : "text-white/45 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MetricCard({ label, value, cyan, className = "" }: { label: string; value: ReactNode; cyan?: boolean; className?: string }) {
  return (
    <div className={`min-w-0 rounded-[14px] border border-[#52e7ff]/10 bg-black/20 p-3 shadow-[0_4px_20px_rgba(0,0,0,0.22)] ${className}`}>
      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-white/25">{label}</p>
      <p className={`truncate text-sm font-black ${cyan ? "text-[#52e7ff]" : "text-white"}`} title={typeof value === "string" ? value : undefined}>{value}</p>
    </div>
  );
}

function StudentDesktopTable({
  students,
  coaches,
  onOpen,
  onCopyInvite,
}: {
  students: AdminStudent[];
  coaches: AdminCoach[];
  onOpen: (student: AdminStudent) => void;
  onCopyInvite: (student: AdminStudent) => void;
}) {
  if (!students.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 p-12 text-center text-sm text-white/35">
        Nenhum aluno encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[14px] border border-[#52e7ff]/10 bg-[#0f162a]/80 shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur">
      <Table className="min-w-[1120px]">
        <TableHeader>
          <TableRow className="border-[#52e7ff]/10 hover:bg-transparent">
            <TableHead className="h-10 pl-4 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">Aluno</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">Status</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">Coach</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">Telefone</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">Semana</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">Mês</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">Último acesso</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">Assinatura</TableHead>
            <TableHead className="h-10 text-right text-[9px] font-black uppercase tracking-[0.24em] text-white/28">Convite</TableHead>
            <TableHead className="h-10 pr-4 text-right text-[9px] font-black uppercase tracking-[0.24em] text-white/28">Abrir</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const status = getStatusInfo(student);
            return (
              <TableRow key={student.userId} className="border-[#52e7ff]/[0.08] hover:bg-[#52e7ff]/[0.045]">
                <TableCell className="max-w-[280px] pl-4">
                  <button type="button" onClick={() => onOpen(student)} className="block min-w-0 text-left">
                    <span className="block truncate text-sm font-black text-white">{student.name}</span>
                    <span className="block truncate font-mono text-[10px] text-white/30">{student.email || student.userId}</span>
                  </button>
                </TableCell>
                <TableCell><Badge variant={status.variant} className="text-[9px] font-black uppercase">{status.text}</Badge></TableCell>
                <TableCell className="max-w-[160px] truncate text-xs font-bold text-white/65">{coachLabel(student, coaches)}</TableCell>
                <TableCell className="font-mono text-xs text-white/55">{student.phone || "-"}</TableCell>
                <TableCell className="font-mono text-xs font-black text-[#00e5ff]">{student.weeklyXp} XP</TableCell>
                <TableCell className="font-mono text-xs text-white/65">{student.monthlyXp} XP</TableCell>
                <TableCell className="font-mono text-xs text-white/55">{relativeTime(student.lastActiveAt)}</TableCell>
                <TableCell className="max-w-[140px] truncate text-xs text-white/65">{formatHuman(student.subscriptionStatus)}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" className="h-8 rounded-lg border-white/10 bg-white/5 px-2 text-white/60 hover:text-[#52e7ff]" onClick={() => onCopyInvite(student)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <Button size="sm" className="h-8 rounded-lg bg-[#52e7ff] px-2 text-[#04131e] hover:bg-white" onClick={() => onOpen(student)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function StudentMobileCards({
  students,
  coaches,
  onOpen,
  onCopyInvite,
}: {
  students: AdminStudent[];
  coaches: AdminCoach[];
  onOpen: (student: AdminStudent) => void;
  onCopyInvite: (student: AdminStudent) => void;
}) {
  if (!students.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 p-10 text-center text-sm text-white/35">
        Nenhum aluno encontrado.
      </div>
    );
  }

  return (
    <>
      {students.map((student) => {
        const status = getStatusInfo(student);
        return (
          <div key={student.userId} className="rounded-lg border border-white/8 bg-white/[0.035] p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <button type="button" onClick={() => onOpen(student)} className="min-w-0 text-left">
                <span className="block truncate text-base font-black text-white">{student.name}</span>
                <span className="block truncate font-mono text-[10px] text-white/30">{student.email || student.userId}</span>
              </button>
              <Badge variant={status.variant} className="shrink-0 text-[9px] font-black uppercase">{status.text}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Coach" value={coachLabel(student, coaches)} />
              <Metric label="Telefone" value={student.phone || "-"} />
              <Metric label="Semana" value={`${student.weeklyXp} XP`} cyan />
              <Metric label="Mês" value={`${student.monthlyXp} XP`} />
              <Metric label="Visto" value={relativeTime(student.lastActiveAt)} />
              <Metric label="Plano" value={formatHuman(student.subscriptionStatus)} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" className="border-white/10 bg-white/5 text-white/65" onClick={() => onCopyInvite(student)}>
                <Copy className="mr-2 h-4 w-4" />
                Convite
              </Button>
              <Button className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white" onClick={() => onOpen(student)}>
                Abrir
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </>
  );
}

function Metric({ label, value, cyan }: { label: string; value: ReactNode; cyan?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-white/20">{label}</p>
      <p className={`overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs font-bold ${cyan ? "text-[#00e5ff]" : "text-white/60"}`} title={typeof value === "string" ? value : undefined}>{value}</p>
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

const WEEK_DAYS: { key: WeekDayKey; label: string; short: string }[] = [
  { key: "monday",    label: "Segunda-feira", short: "Seg" },
  { key: "tuesday",  label: "Terça-feira",   short: "Ter" },
  { key: "wednesday",label: "Quarta-feira",  short: "Qua" },
  { key: "thursday", label: "Quinta-feira",  short: "Qui" },
  { key: "friday",   label: "Sexta-feira",   short: "Sex" },
  { key: "saturday", label: "Sábado",        short: "Sáb" },
  { key: "sunday",   label: "Domingo",       short: "Dom" },
];

function WeeklyWorkoutEditor({
  student,
  weeklyPlan,
  exerciseCatalog,
  acting,
  onSave,
}: {
  student: AdminStudent;
  weeklyPlan: AdminWeeklyWorkoutPlan | null;
  exerciseCatalog: AdminCatalogExercise[];
  acting: boolean;
  onSave: (days: AdminWeeklyWorkoutDays) => Promise<void>;
}) {
  const [days, setDays] = useState<AdminWeeklyWorkoutDays>(() => weeklyPlan?.days ?? {});
  const [expandedDay, setExpandedDay] = useState<WeekDayKey | null>(null);
  const [daySearch, setDaySearch] = useState<Record<WeekDayKey, string>>({} as Record<WeekDayKey, string>);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDays(weeklyPlan?.days ?? {});
  }, [weeklyPlan]);

  function blankDayPlan(): GutoWorkoutPlan {
    return {
      studentId: student.userId,
      title: "Treino do dia",
      focus: "Treino do dia",
      dateLabel: "Hoje",
      scheduledFor: new Date().toISOString(),
      summary: "",
      source: "coach_manual",
      lockedByCoach: true,
      manualOverride: true,
      exercises: [],
      blocks: [],
    };
  }

	  function setDayPlan(day: WeekDayKey, plan: GutoWorkoutPlan | undefined) {
	    setDays((current) => {
	      const next = { ...current };
      if (plan === undefined) {
        delete next[day];
      } else {
        next[day] = plan;
      }
      return next;
	    });
	  }

	  function planWithExercises(plan: GutoWorkoutPlan, exercises: GutoWorkoutExercise[]): GutoWorkoutPlan {
	    const orderedExercises = exercises.map((exercise, index) => ({ ...exercise, order: index + 1 }));
	    return { ...plan, exercises: orderedExercises, blocks: [{ name: "Principal", exercises: orderedExercises }] };
	  }

  function addExerciseToDayFromCatalog(day: WeekDayKey, catalog: AdminCatalogExercise) {
    const current = days[day] ?? blankDayPlan();
    const index = current.exercises.length;
    const exercise = workoutExerciseFromCatalog(catalog, blankExercise(index), index);
    setDayPlan(day, { ...current, exercises: [...current.exercises, exercise], blocks: [{ name: "Principal", exercises: [...current.exercises, exercise] }] });
    setDaySearch((s) => ({ ...s, [day]: "" }));
  }

	  function removeExerciseFromDay(day: WeekDayKey, index: number) {
	    const current = days[day];
	    if (!current) return;
	    const exercises = current.exercises.filter((_, i) => i !== index);
	    setDayPlan(day, planWithExercises(current, exercises));
	  }

	  function updateExerciseInDay(day: WeekDayKey, index: number, patch: Partial<GutoWorkoutExercise>) {
	    const current = days[day];
	    if (!current) return;
	    const exercises = current.exercises.map((exercise, i) => i === index ? { ...exercise, ...patch } : exercise);
	    setDayPlan(day, planWithExercises(current, exercises));
	  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(days);
      toast.success("Plano semanal salvo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar plano semanal.");
    } finally {
      setSaving(false);
    }
  }

  const searchFor = (day: WeekDayKey) => normalizeCatalogSearch(daySearch[day] ?? "");

  return (
    <Panel title="Plano semanal">
      <p className="mb-4 text-[11px] text-white/40">Monte o treino de cada dia. O aluno verá apenas o treino do dia atual no app.</p>

      <div className="space-y-2">
        {WEEK_DAYS.map(({ key, label, short }) => {
          const plan = days[key];
          const isExpanded = expandedDay === key;
          const exerciseCount = plan?.exercises?.length ?? 0;
          const focusLabel = plan?.focus || plan?.title || "";
          const query = searchFor(key);
          const catalogResults = query.length >= 2
            ? exerciseCatalog.filter((e) => catalogSearchText(e).includes(query)).slice(0, 8)
            : [];

          return (
            <div key={key} className="rounded-lg border border-white/10 bg-white/5">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                onClick={() => setExpandedDay(isExpanded ? null : key)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 text-[11px] font-black uppercase tracking-widest text-white/40">{short}</span>
                  <span className="text-sm font-semibold text-white">{label}</span>
                  {plan && exerciseCount > 0 && (
                    <span className="rounded-full bg-[#00e5ff]/15 px-2 py-0.5 text-[10px] font-bold text-[#00e5ff]">
                      {exerciseCount} ex.
                    </span>
                  )}
                  {plan && focusLabel && (
                    <span className="hidden truncate text-xs text-white/40 sm:block">{focusLabel}</span>
                  )}
                  {!plan && (
                    <span className="text-xs text-white/25">Descanso / sem treino</span>
                  )}
                </div>
                <span className="text-white/30">{isExpanded ? "▲" : "▼"}</span>
              </button>

              {isExpanded && (
                <div className="border-t border-white/8 px-4 pb-4 pt-3 space-y-3">
                  {plan && (
                    <>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">Foco do dia</span>
                          <Input
                            value={plan.focus || ""}
                            onChange={(e) => setDayPlan(key, { ...plan, focus: e.target.value, title: e.target.value })}
                            placeholder="Ex: Peito + tríceps"
                            className="h-9 border-white/10 bg-white/5 text-sm text-white"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">Notas do coach</span>
                          <Input
                            value={plan.coachNotes || ""}
                            onChange={(e) => setDayPlan(key, { ...plan, coachNotes: e.target.value })}
                            placeholder="Observações opcionais"
                            className="h-9 border-white/10 bg-white/5 text-sm text-white"
                          />
                        </label>
                      </div>

	                      {plan.exercises.length > 0 && (
	                        <div className="space-y-2">
	                          {plan.exercises.map((ex, i) => (
	                            <div key={`${ex.id}-${i}`} className="rounded-md border border-white/8 bg-black/15 p-3">
	                              <div className="mb-3 flex items-start justify-between gap-3">
	                                <div className="min-w-0">
	                                  <p className="truncate text-sm font-black text-white">{ex.name || ex.canonicalNamePt || ex.id}</p>
	                                  <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-widest text-white/30">{ex.muscleGroup || "catalogo"} · {ex.id}</p>
	                                </div>
	                                <button
	                                  onClick={() => removeExerciseFromDay(key, i)}
	                                  className="shrink-0 rounded-md border border-red-500/25 bg-red-500/10 p-2 text-red-300 hover:bg-red-500 hover:text-white"
	                                  aria-label="Remover exercício"
	                                >
	                                  <Trash2 className="h-3.5 w-3.5" />
	                                </button>
	                              </div>
	                              <div className="grid gap-2 md:grid-cols-4">
	                                <Field label="Séries" value={String(ex.sets || "")} onChange={(sets) => updateExerciseInDay(key, i, { sets: Number(sets) || 0 })} />
	                                <Field label="Reps" value={String(ex.reps || "")} onChange={(reps) => updateExerciseInDay(key, i, { reps })} />
	                                <Field label="Carga" value={String(ex.load || "")} onChange={(load) => updateExerciseInDay(key, i, { load })} />
	                                <Field label="Descanso" value={ex.rest || ""} onChange={(rest) => updateExerciseInDay(key, i, { rest })} />
	                                <Field label="Técnica" value={ex.cue || ""} onChange={(cue) => updateExerciseInDay(key, i, { cue })} className="md:col-span-2" />
	                                <Field label="Observação do movimento" value={ex.note || ""} onChange={(note) => updateExerciseInDay(key, i, { note })} className="md:col-span-2" />
	                                <Field label="Substituições" value={(ex.alternatives || []).join(", ")} onChange={(alternatives) => updateExerciseInDay(key, i, { alternatives: alternatives.split(",").map((item) => item.trim()).filter(Boolean) })} className="md:col-span-4" />
	                              </div>
	                            </div>
	                          ))}
	                        </div>
	                      )}
                    </>
                  )}

                  <div className="relative">
                    <Input
                      value={daySearch[key] ?? ""}
                      onChange={(e) => setDaySearch((s) => ({ ...s, [key]: e.target.value }))}
                      placeholder="Buscar exercício no catálogo…"
                      className="h-9 border-white/10 bg-white/5 text-sm text-white"
                    />
                    {catalogResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-10 z-20 rounded-lg border border-white/10 bg-[#0d1426] shadow-xl">
                        {catalogResults.map((catalog) => (
                          <button
                            key={catalog.id}
	                            className="flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left text-xs hover:bg-white/5"
	                            onClick={() => addExerciseToDayFromCatalog(key, catalog)}
	                          >
	                            <span className="min-w-0 flex-1 truncate font-medium text-white">{catalog.canonicalNamePt}</span>
	                            <span className="shrink-0 text-white/35">{catalog.muscleGroup}</span>
	                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!plan && (
	                      <Button size="sm" variant="outline" className="border-[#00e5ff]/30 bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20" onClick={() => setDayPlan(key, blankDayPlan())}>
	                        <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar treino
	                      </Button>
	                    )}
	                    {plan && (
	                      <Button size="sm" variant="outline" className="border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white" onClick={() => setDayPlan(key, undefined)}>
	                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover dia
	                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-white/8 pt-4">
        <Button
          className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white"
          disabled={acting || saving}
          onClick={() => void handleSave()}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando…" : "Salvar plano semanal"}
        </Button>
        {weeklyPlan?.updatedAt && (
          <p className="mt-2 text-[10px] text-white/30">
            Última atualização: {new Date(weeklyPlan.updatedAt).toLocaleString("pt-BR")}
          </p>
        )}
      </div>
    </Panel>
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
	  const [showHistory, setShowHistory] = useState(false);

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
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">Dia</span>
            <select value={value.weekDay || "today"} onChange={(e) => onChange({ ...value, weekDay: e.target.value })} className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
              {[["Domingo","Domingo"],["Segunda-feira","Segunda-feira"],["Terça-feira","Terça-feira"],["Quarta-feira","Quarta-feira"],["Quinta-feira","Quinta-feira"],["Sexta-feira","Sexta-feira"],["Sábado","Sábado"]].map(([val, label]) => <option key={val} value={val} className="bg-[#0d1426]">{label}</option>)}
              <option value="today" className="bg-[#0d1426]">Hoje ({["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][new Date().getDay()]})</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">Local</span>
            <select value={value.location || ""} onChange={(e) => onChange({ ...value, location: e.target.value })} className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
              <option value="" className="bg-[#0d1426]">Selecionar</option>
              {Object.entries(TRAINING_LOCATION_LABELS).map(([code, label]) => <option key={code} value={code} className="bg-[#0d1426]">{label}</option>)}
            </select>
          </label>
          <Field label="Duração estimada" value={String(value.estimatedDurationMinutes || "")} onChange={(estimatedDurationMinutes) => onChange({ ...value, estimatedDurationMinutes: Number(estimatedDurationMinutes) || undefined })} />
          <Field label="Dificuldade" value={value.difficulty || ""} onChange={(difficulty) => onChange({ ...value, difficulty })} />
          <Field label="Observações do coach" value={value.coachNotes || ""} onChange={(coachNotes) => onChange({ ...value, coachNotes, summary: coachNotes || value.summary })} className="md:col-span-2" />
        </div>

	        <div className="mt-4 flex flex-wrap gap-2">
	          <Button className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white" disabled={acting} onClick={onSave}><Save className="mr-2 h-4 w-4" />Salvar alterações</Button>
	          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onCreateManual}><Dumbbell className="mr-2 h-4 w-4" />Criar treino manual</Button>
	          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onGenerate}><RefreshCw className="mr-2 h-4 w-4" />Gerar com GUTO</Button>
	          <Button variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => setShowHistory((current) => !current)}><History className="mr-2 h-4 w-4" />Histórico</Button>
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
	                      className="min-w-0 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-left hover:border-[#00e5ff]/45"
	                    >
	                      <span className="block truncate text-xs font-black text-white">{item.canonicalNamePt}</span>
	                      <span className="block truncate font-mono text-[9px] uppercase tracking-widest text-white/35">{item.muscleGroup} · {item.id}</span>
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
	                  <div className="h-[96px] overflow-hidden rounded-md border border-[#00e5ff]/30 bg-black/20">
	                    <video src={selectedCatalogExercise.videoUrl} muted loop playsInline controls preload="metadata" className="h-full w-full object-contain" />
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
	                <Field label="Observação do movimento" value={exercise.note || ""} onChange={(note) => updateExercise(index, { note })} className="md:col-span-2" />
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

	      {showHistory && (
	        <Panel title="Histórico do treino">
	          <LogList logs={history} empty="Sem histórico de treino." />
	        </Panel>
	      )}
	    </div>
	  );
	}

// ─── Weekly Diet Editor ────────────────────────────────────────────────────────

const DIET_WEEK_DAYS: Array<{ key: WeekDayKey; label: string }> = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

function dietDaySummary(day?: AdminWeeklyDietDay): string {
  if (!day) return "Sem dieta programada";
  const meals = [day.breakfast && "café", day.lunch && "almoço", day.dinner && "jantar", day.snacks && "lanches"].filter(Boolean);
  const parts: string[] = [];
  if (meals.length) parts.push(meals.join(", "));
  if (day.caloriesEstimate) parts.push(`${day.caloriesEstimate} kcal`);
  if (day.notes) parts.push("obs.");
  return parts.length ? parts.join(" · ") : "Preenchido";
}

function blankDietDay(): AdminWeeklyDietDay {
  return { breakfast: "", lunch: "", dinner: "", snacks: "", hydration: "", notes: "" };
}

function WeeklyDietEditor({
  student,
  weeklyPlan,
  acting,
  onSave,
}: {
  student: AdminStudent;
  weeklyPlan: AdminWeeklyDietPlan | null;
  acting: boolean;
  onSave: (days: AdminWeeklyDietDays) => Promise<void>;
}) {
  const [days, setDays] = useState<AdminWeeklyDietDays>(() => weeklyPlan?.days ?? {});
  const [expandedDay, setExpandedDay] = useState<WeekDayKey | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDays(weeklyPlan?.days ?? {});
  }, [weeklyPlan]);

  function setDayField(day: WeekDayKey, field: keyof AdminWeeklyDietDay, value: string | number | undefined) {
    setDays((current) => {
      const existing = current[day] ?? blankDietDay();
      return { ...current, [day]: { ...existing, [field]: value } };
    });
  }

  function clearDay(day: WeekDayKey) {
    setDays((current) => {
      const next = { ...current };
      delete next[day];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(days);
      toast.success("Plano semanal de dieta salvo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar plano semanal de dieta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Plano semanal de dieta">
      <p className="mb-4 text-[11px] text-white/40">Monte a dieta de cada dia. Campos em branco não serão salvos. O aluno verá a dieta do dia atual via integração futura.</p>
      <div className="space-y-2">
        {DIET_WEEK_DAYS.map(({ key, label }) => {
          const dayData = days[key];
          const isExpanded = expandedDay === key;
          const summary = dietDaySummary(dayData);

          return (
            <div key={key} className="rounded-lg border border-white/10 bg-white/5">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                onClick={() => setExpandedDay(isExpanded ? null : key)}
              >
                <div>
                  <span className="text-sm font-bold text-white">{label}</span>
                  {dayData && <span className="ml-2 text-[11px] text-[#00e5ff]">preenchido</span>}
                </div>
                <span className="text-[11px] text-white/40">{isExpanded ? "▲" : "▼"}</span>
              </button>
              {!isExpanded && (
                <p className="px-4 pb-2 text-[11px] text-white/30">{summary}</p>
              )}
              {isExpanded && (
                <div className="border-t border-white/10 px-4 pb-4 pt-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">Café da manhã</label>
                      <textarea
                        value={dayData?.breakfast ?? ""}
                        onChange={(e) => setDayField(key, "breakfast", e.target.value)}
                        rows={2}
                        placeholder="Ex: Aveia com banana, ovo mexido..."
                        className="w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">Almoço</label>
                      <textarea
                        value={dayData?.lunch ?? ""}
                        onChange={(e) => setDayField(key, "lunch", e.target.value)}
                        rows={2}
                        placeholder="Ex: Frango grelhado, arroz, legumes..."
                        className="w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">Jantar</label>
                      <textarea
                        value={dayData?.dinner ?? ""}
                        onChange={(e) => setDayField(key, "dinner", e.target.value)}
                        rows={2}
                        placeholder="Ex: Sopa de legumes, peixe grelhado..."
                        className="w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">Lanches</label>
                      <textarea
                        value={dayData?.snacks ?? ""}
                        onChange={(e) => setDayField(key, "snacks", e.target.value)}
                        rows={2}
                        placeholder="Ex: Iogurte, fruta, castanhas..."
                        className="w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">Hidratação</label>
                      <input
                        type="text"
                        value={dayData?.hydration ?? ""}
                        onChange={(e) => setDayField(key, "hydration", e.target.value)}
                        placeholder="Ex: 2,5 litros de água"
                        className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">Observações</label>
                      <textarea
                        value={dayData?.notes ?? ""}
                        onChange={(e) => setDayField(key, "notes", e.target.value)}
                        rows={2}
                        placeholder="Ex: Evitar açúcar refinado após as 18h..."
                        className="w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">Estimativa calórica (kcal)</label>
                      <input
                        type="number"
                        value={dayData?.caloriesEstimate ?? ""}
                        onChange={(e) => setDayField(key, "caloriesEstimate", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Ex: 2200"
                        min={0}
                        className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">Estimativa proteína (g)</label>
                      <input
                        type="number"
                        value={dayData?.proteinEstimate ?? ""}
                        onChange={(e) => setDayField(key, "proteinEstimate", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Ex: 160"
                        min={0}
                        className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      className="border-red-500/30 bg-transparent text-red-300 text-xs"
                      onClick={() => clearDay(key)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Limpar dia
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white"
          disabled={acting || saving}
          onClick={() => void handleSave()}
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar plano semanal
        </Button>
      </div>
      {weeklyPlan && (
        <p className="mt-2 text-[10px] text-white/30">
          Última atualização: {new Date(weeklyPlan.updatedAt).toLocaleString("pt-BR")} por {weeklyPlan.updatedBy}
        </p>
      )}
    </Panel>
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
  teams,
  isAdmin,
  isSuperAdmin,
  acting,
  limitReached,
  onDraftChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: StudentDraft;
  coaches: AdminCoach[];
  teams: AdminTeam[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  acting: boolean;
  limitReached: boolean;
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome" value={draft.firstName} onChange={(firstName) => onDraftChange({ ...draft, firstName })} />
            <Field label="Sobrenome" value={draft.lastName} onChange={(lastName) => onDraftChange({ ...draft, lastName })} />
          </div>
          <Field label="Email" value={draft.email} onChange={(email) => onDraftChange({ ...draft, email })} />
          {draft.email && !isValidEmail(draft.email) && <p className="-mt-2 text-[11px] font-bold text-red-300">Use um email real. Exemplo: aluno@email.com.</p>}
          <Field label="Telefone" value={draft.phone} onChange={(phone) => onDraftChange({ ...draft, phone })} />
          {draft.phone && !isValidPhone(draft.phone) && <p className="-mt-2 text-[11px] font-bold text-red-300">Use um telefone real com DDD. Sequências como 111 não entram.</p>}
          <div className="grid grid-cols-2 gap-3">
            <select value={draft.sex} onChange={(e) => onDraftChange({ ...draft, sex: e.target.value })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
              <option value="" className="bg-[#0d1426]">Sexo</option>
              <option value="male" className="bg-[#0d1426]">Masculino</option>
              <option value="female" className="bg-[#0d1426]">Feminino</option>
              <option value="prefer_not_to_say" className="bg-[#0d1426]">Prefiro não dizer</option>
            </select>
            <Field label="Idade" value={draft.age} onChange={(age) => onDraftChange({ ...draft, age })} />
          </div>
          <Field label="Senha inicial opcional" value={draft.password} onChange={(password) => onDraftChange({ ...draft, password })} />
          {isSuperAdmin && (
            draft.teamId && teams.find((t) => t.id === draft.teamId) ? (
              <div className="flex items-center gap-2 rounded-md border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-3 py-2">
                <Building2 className="h-3.5 w-3.5 text-[#00e5ff]" />
                <span className="text-sm font-bold text-[#00e5ff]">{teams.find((t) => t.id === draft.teamId)?.name}</span>
              </div>
            ) : (
              <select value={draft.teamId} onChange={(event) => onDraftChange({ ...draft, teamId: event.target.value })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="" className="bg-[#0d1426]">Selecione um Time *</option>
                {teams.map((team) => <option key={team.id} value={team.id} className="bg-[#0d1426]">{team.name}</option>)}
              </select>
            )
          )}
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
          {validationError && <p className="text-xs font-bold text-red-300">{validationError}</p>}
          {limitReached && <p className="text-xs font-bold text-[#00e5ff]">Limite do plano atingido. Atualize o plano GUTO Time para cadastrar mais alunos.</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white">Cancelar</AlertDialogCancel>
          <Button disabled={acting || limitReached || Boolean(validationError)} onClick={onCreate} className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white">Criar</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CreateCoachDialog({
  open,
  onOpenChange,
  draft,
  teams,
  isSuperAdmin,
  acting,
  limitReached,
  onDraftChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: CoachDraft;
  teams: AdminTeam[];
  isSuperAdmin: boolean;
  acting: boolean;
  limitReached: boolean;
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
          {isSuperAdmin && (
            draft.teamId && teams.find((t) => t.id === draft.teamId) ? (
              <div className="flex items-center gap-2 rounded-md border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-3 py-2">
                <Building2 className="h-3.5 w-3.5 text-[#00e5ff]" />
                <span className="text-sm font-bold text-[#00e5ff]">{teams.find((t) => t.id === draft.teamId)?.name}</span>
              </div>
            ) : (
              <select value={draft.teamId} onChange={(event) => onDraftChange({ ...draft, teamId: event.target.value })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="" className="bg-[#0d1426]">Selecione um Time *</option>
                {teams.map((team) => <option key={team.id} value={team.id} className="bg-[#0d1426]">{team.name}</option>)}
              </select>
            )
          )}
          {limitReached && <p className="text-xs font-bold text-[#00e5ff]">Limite do plano atingido. Atualize o plano GUTO Time para cadastrar mais coaches.</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white">Cancelar</AlertDialogCancel>
          <Button disabled={acting || limitReached || !draft.name.trim() || !draft.email.trim() || (isSuperAdmin && !draft.teamId)} onClick={onCreate} className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white">Criar coach</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CreateTeamDialog({
  open,
  onOpenChange,
  draft,
  acting,
  onDraftChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: TeamDraft;
  acting: boolean;
  onDraftChange: (draft: TeamDraft) => void;
  onCreate: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10 bg-[#0d1426] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Criar Time</AlertDialogTitle>
          <AlertDialogDescription className="text-white/45">Cria um novo GUTO Time. Somente super admin.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-3">
          <Field label="Nome do Time" value={draft.name} onChange={(name) => onDraftChange({ ...draft, name })} />
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">Plano</span>
            <select
              value={draft.plan}
              onChange={(event) => onDraftChange({ ...draft, plan: event.target.value as TeamDraft["plan"] })}
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
            >
              <option value="start" className="bg-[#0d1426]">GUTO Time Start</option>
              <option value="pro" className="bg-[#0d1426]">GUTO Time Pro</option>
              <option value="elite" className="bg-[#0d1426]">GUTO Time Elite</option>
              <option value="custom" className="bg-[#0d1426]">Custom</option>
            </select>
          </label>
          {draft.plan === "custom" && (
            <>
              <Field label="Máx. alunos (vazio = ilimitado)" value={draft.maxStudents} onChange={(maxStudents) => onDraftChange({ ...draft, maxStudents })} />
              <Field label="Máx. coaches (vazio = ilimitado)" value={draft.maxCoaches} onChange={(maxCoaches) => onDraftChange({ ...draft, maxCoaches })} />
            </>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white">Cancelar</AlertDialogCancel>
          <Button disabled={acting || !draft.name.trim()} onClick={onCreate} className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white">
            <Building2 className="mr-2 h-4 w-4" />
            Criar Time
          </Button>
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
