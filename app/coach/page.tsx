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
  Globe2,
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

type AdminPanelLanguage = "pt-BR" | "it-IT" | "en-US";

const ADMIN_PANEL_LANGUAGE_KEY = "guto-admin-language";
const ADMIN_PANEL_LANGUAGES: Array<{ code: AdminPanelLanguage; short: string; label: string }> = [
  { code: "pt-BR", short: "PT", label: "Português" },
  { code: "it-IT", short: "IT", label: "Italiano" },
  { code: "en-US", short: "EN", label: "English" },
];

function isAdminPanelLanguage(value: string | null): value is AdminPanelLanguage {
  return value === "pt-BR" || value === "it-IT" || value === "en-US";
}

const ADMIN_PANEL_COPY = {
  "pt-BR": {
    loading: "Sincronizando painel",
    controlRoom: "Sala de controle",
    hierarchy: "Hierarquia",
    teamNotSelected: "Time não selecionado",
    activeStudents: "alunos ativos",
    selectTeam: "Selecione um time",
    clearSelectedTeam: "Limpar time selecionado",
    nav: { students: "ALUNOS", coaches: "COACHES", arena: "ARENA", logs: "HISTÓRICO", teams: "TIMES" },
    detailTabs: { resumo: "Resumo", acesso: "Acesso", calibragem: "Calibragem", treino: "Treino", dieta: "Dieta", arena: "Arena/XP", seguranca: "Senha" },
    meta: {
      students: ["SALA DE CONTROLE / ALUNOS", "Alunos", "Base operacional · {scope} · ação rápida"],
      coaches: ["SALA DE CONTROLE / COACHES", "Coaches", "Operadores limitados · permissões e vínculo com alunos"],
      arena: ["SALA DE CONTROLE / ARENA", "Arena", "XP semanal e mensal por time · ranking individual global"],
      logs: ["SALA DE CONTROLE / HISTÓRICO", "Histórico", "Auditoria das ações críticas do painel"],
      teams: ["SALA DE CONTROLE / TIMES", "Times", "Empresas, planos e limites B2B"],
      scopeSuper: "super admin",
      scopeOperation: "operação",
    },
    telemetry: { sys: "SYS", students: "ALUNOS", active: "ATIVOS", filters: "FILTROS" },
    status: { archived: "ARQUIVADO", paused: "PAUSADO", hiddenArena: "OCULTO ARENA", active: "ATIVO" },
    source: { guto_generated: "Gerado pelo GUTO", coach_manual: "Manual do Coach", mixed: "Editado pelo Coach", none: "Sem origem" },
    common: {
      student: "Aluno", students: "Alunos", coach: "Coach", coaches: "Coaches", team: "Time", teams: "Times",
      status: "Status", email: "Email", phone: "Telefone", subscription: "Assinatura", expiresAt: "Expira em",
      arena: "Arena", visible: "Visível", hidden: "Oculto", workout: "Treino", diet: "Dieta", password: "Senha",
      cancel: "Cancelar", create: "Criar", save: "Salvar", saving: "Salvando...", edit: "Editar",
      select: "Selecionar", deselect: "Desselecionar", selected: "SELECIONADO", reactivate: "Reativar", archive: "Arquivar",
      delete: "Excluir", open: "Abrir", invite: "Convite", clear: "Limpar", search: "Buscar", clean: "limpo",
      plan: "Plano", role: "Role", archived: "Arquivados", unlimited: "Ilimitado", none: "-", today: "hoje",
      updatedAt: "Última atualização", by: "por", noRanking: "Sem ranking.", action: "ação",
    },
    filters: {
      title: "Filtros", foundSingular: "aluno encontrado", foundPlural: "alunos encontrados",
      active: "ativos", paused: "pausados", archived: "arquivados", all: "todos",
      searchPlaceholder: "Buscar nome, email, telefone ou ID", allCoaches: "Todos os coaches",
      sexAll: "Sexo: todos", paymentAll: "Pagamento: todos", minAge: "Idade mín.", maxAge: "Idade máx.",
      activeCount: "filtros ativos", resultSingular: "resultado na visão atual", resultPlural: "resultados na visão atual",
    },
    mural: {
      kicker: "Mural operacional", title: "Painel de alunos e accountability", unavailable: "Resumo do Time indisponível.",
      limitReached: "Limite do plano atingido. Atualize o plano GUTO Time para cadastrar mais {target}.",
    },
    table: {
      empty: "Nenhum aluno encontrado.", student: "Aluno", status: "Status", coach: "Coach", phone: "Telefone",
      week: "Semana", month: "Mês", lastAccess: "Último acesso", subscription: "Assinatura", invite: "Convite", open: "Abrir",
      seen: "Visto",
    },
    relative: { today: "hoje", oneDay: "há 1 dia", manyDays: "há {days} dias" },
    human: {
      active: "Ativo", paused: "Pausado", archived: "Arquivado", paid: "Pago", unpaid: "Pendente",
      pending_payment: "Pagamento pendente", trial: "Teste", expired: "Expirado", cancelled: "Cancelado",
      muscle_gain: "Ganho de massa", fat_loss: "Perda de gordura", conditioning: "Condicionamento",
      mobility_health: "Saúde e mobilidade", consistency: "Consistência", maintenance: "Manutenção",
      endurance: "Resistência", flexibility: "Flexibilidade", general_fitness: "Condicionamento geral", rehabilitation: "Reabilitação",
      gym: "Academia", home: "Em casa", park: "Ao ar livre", mixed: "Variado",
      start: "GUTO Time Start", pro: "GUTO Time Pro", elite: "GUTO Time Elite", custom: "Custom",
      male: "Masculino", female: "Feminino", other: "Outro",
    },
    errors: {
      planLimit: "Limite do plano GUTO Time atingido.", forbidden: "Você não tem acesso a este aluno.",
      backendRejected: "Backend recusou a ação.", name: "Informe o nome.", lastName: "Informe o sobrenome.",
      email: "Informe um email válido.", phone: "Informe um telefone válido.", team: "Selecione um Time.",
      videoName: "Informe o nome do exercício.", videoRequired: "Vídeo obrigatório: informe sourceFileName e videoUrl.",
      videoPath: "Use caminho interno /exercise/visuals/custom/.", videoSafeName: "Use nome seguro: lowercase, sem acento, sem espaço e com hífen.",
      videoMeta: "Preencha todos os metadados técnicos do vídeo.", videoPositive: "Metadados técnicos precisam ser positivos.",
      videoLimit: "Esse vídeo está pesado demais para o app. Use MP4 até 30 segundos, máximo 12MB e 720p.",
      videoMin: "Use vídeo com pelo menos 3 segundos.",
    },
    actions: {
      credentialGenerated: "Credencial gerada", hide: "Ocultar", linkCopied: "Link copiado.",
      inviteCopyFailed: "Não foi possível copiar o convite.", coachPaused: "Coach pausado.", coachActive: "Coach ativo.",
      deleteCoachConfirm: "Excluir coach? Reatribua alunos antes.", coachDeleted: "Coach excluído.",
      teamUpdated: "Time atualizado.", teamReactivated: "Time reativado.", teamArchived: "Time arquivado.",
      studentCreated: "Aluno criado.", coachCreated: "Coach criado.", teamCreated: "Time criado.",
    },
    sheet: {
      system: "Sistema", evolution: "Evolução", officialPlan: "Plano oficial", accessControl: "Controle de acesso",
      accessInvite: "Convite de acesso", pauseAccess: "Pausar acesso", reactivateAccess: "Reativar acesso",
      renew30: "Renovar 30 dias", hideArena: "Ocultar na Arena", showArena: "Mostrar na Arena",
      assignCoach: "Atribuir coach", viewInvite: "Ver convite atual", regenerateInvite: "Regenerar convite",
      inviteUnavailable: "Link não disponível. Use regenerar para criar um novo convite.",
      regenerateInviteConfirm: "Regenerar convite? O link anterior deixa de funcionar.",
      accessPaused: "Acesso pausado.", accessReactivated: "Acesso reativado.", accessRenewed: "Acesso renovado por 30 dias.",
      hiddenFromArena: "Aluno ocultado da Arena.", visibleInArena: "Aluno visível na Arena.", inviteLoaded: "Convite carregado.",
      newInvite: "Novo convite gerado.", calibration: "Calibragem do aluno", saveCalibration: "Salvar calibragem",
      calibrationSaved: "Calibragem atualizada.", officialWorkout: "Treino oficial", weeklyPlan: "Plano semanal",
      officialDiet: "Dieta oficial", weeklyDiet: "Plano semanal", catalogRequired: "Escolha um exercício do catálogo oficial antes de salvar.",
      workoutSaved: "Treino oficial salvo.", workoutGenerated: "Treino gerado pelo GUTO.", gutoCanUpdateWorkout: "GUTO liberado para atualizar treino.",
      workoutLocked: "Treino bloqueado contra sobrescrita.", resetWorkoutConfirm: "Resetar treino oficial deste aluno?", workoutReset: "Treino resetado.",
      dietSaved: "Dieta oficial salva.", dietGenerated: "Dieta do GUTO carregada.", gutoCanUpdateDiet: "GUTO liberado para atualizar dieta.",
      dietLocked: "Dieta bloqueada contra sobrescrita.", resetDietConfirm: "Resetar dieta oficial deste aluno?", dietReset: "Dieta resetada.",
      arenaXp: "Arena e XP", resetWeek: "Resetar semana", resetMonth: "Resetar mês", resetXp: "Resetar XP",
      resetHistory: "Resetar histórico", resetDone: "Reset executado.", tempPassword: "Senha temporária",
      generateTempPassword: "Gerar senha temporária", tempPasswordGenerated: "Senha temporária gerada.",
      criticalZone: "Zona crítica", permanentDelete: "Excluir permanentemente",
      permanentDeleteConfirm: "Excluir permanentemente este aluno e todos os dados vinculados?",
      permanentDeleted: "Aluno excluído permanentemente.",
      permanentDeleteHelp: "A exclusão permanente apaga dados vinculados do aluno. Use somente quando a empresa pedir remoção definitiva.",
    },
    calibration: {
      age: "Idade", sex: "Sexo biológico", level: "Nível", goal: "Objetivo", location: "Local preferido",
      country: "País", height: "Altura cm", weight: "Peso kg", pathology: "Dor ou limitação", foodRestrictions: "Restrições alimentares",
    },
    workout: {
      weeklySaved: "Plano semanal salvo.", weeklySaveError: "Erro ao salvar plano semanal.", weeklyTitle: "Plano semanal",
      weeklyHelp: "Monte o treino de cada dia. O aluno verá apenas o treino do dia atual no app.",
      dayWorkout: "Treino do dia", todayLabel: "Hoje", mainBlock: "Principal", restDay: "Descanso / sem treino",
      focus: "Foco do dia", coachNotes: "Notas do coach", focusPlaceholder: "Ex: Peito + tríceps", notesPlaceholder: "Observações opcionais",
      sets: "Séries", reps: "Reps", load: "Carga", rest: "Descanso", technique: "Técnica", movementNote: "Observação do movimento",
      substitutions: "Substituições", searchCatalog: "Buscar exercício no catálogo...", catalog: "Catálogo", addWorkout: "Adicionar treino",
      removeDay: "Remover dia", saveWeekly: "Salvar plano semanal", title: "Título", muscleFocus: "Grupo muscular / foco",
      day: "Dia", location: "Local", select: "Selecionar", duration: "Duração estimada", difficulty: "Dificuldade",
      saveChanges: "Salvar alterações", createManual: "Criar treino manual", generateGuto: "Gerar com GUTO",
      history: "Histórico", allowGuto: "Permitir GUTO atualizar", lockGuto: "Bloquear alterações automáticas",
      reset: "Resetar treino", addNewExercise: "Adicionar novo exercício", officialName: "Nome oficial", optionalId: "ID opcional",
      group: "Grupo", equipment: "Equipamento", safeMp4: "Arquivo MP4 seguro", internalPath: "Caminho interno",
      durationSeconds: "Duração s", hasAudio: "Vídeo tem áudio", sendApproval: "Enviar para aprovação",
      approvalSent: "Exercício enviado para aprovação técnica.", studentExercises: "Exercícios de {name}",
      officialExercise: "Exercício oficial", searchOfficial: "Pesquisar no catálogo oficial", notChosen: "Não escolhido",
      notFound: "Exercício não encontrado no catálogo. Para usar este exercício, ele precisa ser adicionado ao catálogo oficial com vídeo local validado.",
      chooseBeforeSave: "Escolha um exercício do catálogo oficial antes de salvar.", noEquipment: "sem equipamento",
      interval: "Intervalo", addExercise: "Adicionar exercício", workoutHistory: "Histórico do treino", noWorkoutHistory: "Sem histórico de treino.",
      videoLimitCopy: "Vídeo obrigatório: MP4, até 30s, até 12MB, máximo 720p, sem áudio, caminho interno /exercise/visuals/custom/.",
      videoNoUpload: "Não há upload real aqui: o vídeo precisa estar previamente otimizado e disponível no caminho interno controlado.",
    },
    diet: {
      weeklySaved: "Plano semanal de dieta salvo.", weeklySaveError: "Erro ao salvar plano semanal de dieta.",
      weeklyTitle: "Plano semanal de dieta", weeklyHelp: "Monte a dieta de cada dia. Campos em branco não serão salvos. O aluno verá a dieta do dia atual via integração futura.",
      noDiet: "Sem dieta programada", filled: "preenchido", breakfast: "Café da manhã", lunch: "Almoço", dinner: "Jantar", snacks: "Lanches",
      hydration: "Hidratação", notes: "Observações", caloriesEstimate: "Estimativa calórica (kcal)", proteinEstimate: "Estimativa proteína (g)",
      clearDay: "Limpar dia", saveWeekly: "Salvar plano semanal", breakfastPlaceholder: "Ex: Aveia com banana, ovo mexido...",
      lunchPlaceholder: "Ex: Frango grelhado, arroz, legumes...", dinnerPlaceholder: "Ex: Sopa de legumes, peixe grelhado...",
      snacksPlaceholder: "Ex: Iogurte, fruta, castanhas...", hydrationPlaceholder: "Ex: 2,5 litros de água",
      notesPlaceholder: "Ex: Evitar açúcar refinado após as 18h...", caloriesPlaceholder: "Ex: 2200", proteinPlaceholder: "Ex: 160",
      officialDiet: "Dieta oficial", title: "Título", country: "País", calories: "Calorias", protein: "Proteína g",
      carbs: "Carbo g", fat: "Gordura g", restrictions: "Restrições", coachNotes: "Notas do coach",
      bmr: "BMR calculado", tdee: "TDEE estimado", target: "Meta da dieta", foodsTotal: "Total dos alimentos",
      missing: "Faltam", exceeded: "Excedeu", matched: "Fechado com a meta",
      mismatchToast: "A dieta precisa fechar em {target} kcal. Ajuste {delta} kcal antes de salvar.",
      mismatchHelp: "O backend também vai recusar esta dieta enquanto o total dos alimentos não bater exatamente com a meta calórica.",
      saveChanges: "Salvar alterações", createManual: "Criar dieta manual", generateGuto: "Gerar com GUTO", history: "Histórico",
      allowGuto: "Permitir GUTO atualizar", lockGuto: "Bloquear alterações automáticas", reset: "Resetar dieta",
      mealsOf: "Refeições de {name}", meal: "Refeição", time: "Horário", calculatedKcal: "Kcal calculadas",
      substitutions: "Substituições", food: "Alimento", quantity: "Quantidade", observation: "Observação",
      addFood: "Adicionar alimento", addMeal: "Adicionar refeição", newMeal: "Nova refeição",
      dietHistory: "Histórico da dieta", noDietHistory: "Sem histórico de dieta.",
    },
    planStatus: { locked: "Bloqueado contra GUTO", unlocked: "GUTO pode atualizar" },
    rankings: { weekly: "Ranking Semanal", monthly: "Ranking Mensal", general: "Ranking Geral" },
    dialogs: {
      createStudent: "Criar aluno", studentDesc: "Cria acesso real no backend. Sem senha, o backend gera convite.",
      firstName: "Nome", lastName: "Sobrenome", validEmail: "Use um email real. Exemplo: aluno@email.com.",
      validPhone: "Use um telefone real com DDD. Sequências como 111 não entram.", sex: "Sexo", male: "Masculino",
      female: "Feminino", preferNot: "Prefiro não dizer", age: "Idade", optionalPassword: "Senha inicial opcional",
      selectTeam: "Selecione um Time *", responsibleCoach: "Coach responsável", activateNow: "Ativar acesso agora",
      createCoach: "Criar coach", coachDesc: "Somente super admin/admin pode criar coach.", name: "Nome", optionalCoachPassword: "Senha opcional",
      createTeam: "Criar Time", teamDesc: "Cria um novo GUTO Time. Somente super admin.", teamName: "Nome do Time",
      maxStudents: "Máx. alunos (vazio = ilimitado)", maxCoaches: "Máx. coaches (vazio = ilimitado)",
    },
    days: {
      monday: ["Segunda-feira", "Seg"], tuesday: ["Terça-feira", "Ter"], wednesday: ["Quarta-feira", "Qua"],
      thursday: ["Quinta-feira", "Qui"], friday: ["Sexta-feira", "Sex"], saturday: ["Sábado", "Sáb"], sunday: ["Domingo", "Dom"],
      today: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
    },
  },
  "it-IT": {
    loading: "Sincronizzazione pannello",
    controlRoom: "Sala controllo",
    hierarchy: "Gerarchia",
    teamNotSelected: "Team non selezionato",
    activeStudents: "studenti attivi",
    selectTeam: "Seleziona un team",
    clearSelectedTeam: "Rimuovi team selezionato",
    nav: { students: "STUDENTI", coaches: "COACH", arena: "ARENA", logs: "STORICO", teams: "TEAM" },
    detailTabs: { resumo: "Riepilogo", acesso: "Accesso", calibragem: "Calibrazione", treino: "Allenamento", dieta: "Dieta", arena: "Arena/XP", seguranca: "Sicurezza" },
    meta: {
      students: ["SALA CONTROLLO / STUDENTI", "Studenti", "Base operativa · {scope} · azione rapida"],
      coaches: ["SALA CONTROLLO / COACH", "Coach", "Operatori limitati · permessi e assegnazioni studenti"],
      arena: ["SALA CONTROLLO / ARENA", "Arena", "XP settimanale e mensile per team · classifica individuale globale"],
      logs: ["SALA CONTROLLO / STORICO", "Storico", "Audit delle azioni critiche del pannello"],
      teams: ["SALA CONTROLLO / TEAM", "Team", "Aziende, piani e limiti B2B"],
      scopeSuper: "super admin",
      scopeOperation: "operatività",
    },
    telemetry: { sys: "SYS", students: "STUDENTI", active: "ATTIVI", filters: "FILTRI" },
    status: { archived: "ARCHIVIATO", paused: "IN PAUSA", hiddenArena: "NASCOSTO ARENA", active: "ATTIVO" },
    source: { guto_generated: "Generato da GUTO", coach_manual: "Manuale del coach", mixed: "Modificato dal coach", none: "Origine assente" },
    common: {
      student: "Studente", students: "Studenti", coach: "Coach", coaches: "Coach", team: "Team", teams: "Team",
      status: "Stato", email: "Email", phone: "Telefono", subscription: "Abbonamento", expiresAt: "Scade il",
      arena: "Arena", visible: "Visibile", hidden: "Nascosto", workout: "Allenamento", diet: "Dieta", password: "Password",
      cancel: "Annulla", create: "Crea", save: "Salva", saving: "Salvataggio...", edit: "Modifica",
      select: "Seleziona", deselect: "Deseleziona", selected: "SELEZIONATO", reactivate: "Riattiva", archive: "Archivia",
      delete: "Elimina", open: "Apri", invite: "Invito", clear: "Pulisci", search: "Cerca", clean: "pulito",
      plan: "Piano", role: "Ruolo", archived: "Archiviati", unlimited: "Illimitato", none: "-", today: "oggi",
      updatedAt: "Ultimo aggiornamento", by: "da", noRanking: "Nessuna classifica.", action: "azione",
    },
    filters: {
      title: "Filtri", foundSingular: "studente trovato", foundPlural: "studenti trovati",
      active: "attivi", paused: "in pausa", archived: "archiviati", all: "tutti",
      searchPlaceholder: "Cerca nome, email, telefono o ID", allCoaches: "Tutti i coach",
      sexAll: "Sesso: tutti", paymentAll: "Pagamento: tutti", minAge: "Età min.", maxAge: "Età max",
      activeCount: "filtri attivi", resultSingular: "risultato nella vista attuale", resultPlural: "risultati nella vista attuale",
    },
    mural: {
      kicker: "Muro operativo", title: "Pannello studenti e accountability", unavailable: "Riepilogo team non disponibile.",
      limitReached: "Limite del piano raggiunto. Aggiorna il piano GUTO Time per registrare altri {target}.",
    },
    table: {
      empty: "Nessuno studente trovato.", student: "Studente", status: "Stato", coach: "Coach", phone: "Telefono",
      week: "Settimana", month: "Mese", lastAccess: "Ultimo accesso", subscription: "Abbonamento", invite: "Invito", open: "Apri",
      seen: "Visto",
    },
    relative: { today: "oggi", oneDay: "1 giorno fa", manyDays: "{days} giorni fa" },
    human: {
      active: "Attivo", paused: "In pausa", archived: "Archiviato", paid: "Pagato", unpaid: "In sospeso",
      pending_payment: "Pagamento in sospeso", trial: "Prova", expired: "Scaduto", cancelled: "Annullato",
      muscle_gain: "Aumento massa", fat_loss: "Dimagrimento", conditioning: "Condizionamento",
      mobility_health: "Mobilità e salute", consistency: "Costanza", maintenance: "Mantenimento",
      endurance: "Resistenza", flexibility: "Flessibilità", general_fitness: "Fitness generale", rehabilitation: "Riabilitazione",
      gym: "Palestra", home: "Casa", park: "All'aperto", mixed: "Misto",
      start: "GUTO Time Start", pro: "GUTO Time Pro", elite: "GUTO Time Elite", custom: "Personalizzato",
      male: "Maschile", female: "Femminile", other: "Altro",
    },
    errors: {
      planLimit: "Limite del piano GUTO Time raggiunto.", forbidden: "Non hai accesso a questo studente.",
      backendRejected: "Il backend ha rifiutato l'azione.", name: "Inserisci il nome.", lastName: "Inserisci il cognome.",
      email: "Inserisci un'email valida.", phone: "Inserisci un numero di telefono valido.", team: "Seleziona un Team.",
      videoName: "Inserisci il nome dell'esercizio.", videoRequired: "Video obbligatorio: inserisci sourceFileName e videoUrl.",
      videoPath: "Usa il percorso interno /exercise/visuals/custom/.", videoSafeName: "Usa un nome sicuro: minuscolo, senza accenti, senza spazi e con trattini.",
      videoMeta: "Compila tutti i metadati tecnici del video.", videoPositive: "I metadati tecnici devono essere positivi.",
      videoLimit: "Questo video è troppo pesante per l'app. Usa MP4 fino a 30 secondi, massimo 12MB e 720p.",
      videoMin: "Usa un video di almeno 3 secondi.",
    },
    actions: {
      credentialGenerated: "Credenziale generata", hide: "Nascondi", linkCopied: "Link copiato.",
      inviteCopyFailed: "Impossibile copiare l'invito.", coachPaused: "Coach messo in pausa.", coachActive: "Coach attivato.",
      deleteCoachConfirm: "Eliminare il coach? Riassegna prima gli studenti.", coachDeleted: "Coach eliminato.",
      teamUpdated: "Team aggiornato.", teamReactivated: "Team riattivato.", teamArchived: "Team archiviato.",
      studentCreated: "Studente creato.", coachCreated: "Coach creato.", teamCreated: "Team creato.",
    },
    sheet: {
      system: "Sistema", evolution: "Evoluzione", officialPlan: "Piano ufficiale", accessControl: "Controllo accesso",
      accessInvite: "Invito di accesso", pauseAccess: "Metti accesso in pausa", reactivateAccess: "Riattiva accesso",
      renew30: "Rinnova 30 giorni", hideArena: "Nascondi in Arena", showArena: "Mostra in Arena",
      assignCoach: "Assegna coach", viewInvite: "Vedi invito attuale", regenerateInvite: "Rigenera invito",
      inviteUnavailable: "Link non disponibile. Usa rigenera per creare un nuovo invito.",
      regenerateInviteConfirm: "Rigenerare l'invito? Il link precedente smetterà di funzionare.",
      accessPaused: "Accesso messo in pausa.", accessReactivated: "Accesso riattivato.", accessRenewed: "Accesso rinnovato per 30 giorni.",
      hiddenFromArena: "Studente nascosto dall'Arena.", visibleInArena: "Studente visibile in Arena.", inviteLoaded: "Invito caricato.",
      newInvite: "Nuovo invito generato.", calibration: "Calibrazione studente", saveCalibration: "Salva calibrazione",
      calibrationSaved: "Calibrazione aggiornata.", officialWorkout: "Allenamento ufficiale", weeklyPlan: "Piano settimanale",
      officialDiet: "Dieta ufficiale", weeklyDiet: "Piano settimanale", catalogRequired: "Scegli un esercizio dal catalogo ufficiale prima di salvare.",
      workoutSaved: "Allenamento ufficiale salvato.", workoutGenerated: "Allenamento generato da GUTO.", gutoCanUpdateWorkout: "GUTO può aggiornare l'allenamento.",
      workoutLocked: "Allenamento protetto da sovrascrittura.", resetWorkoutConfirm: "Resettare l'allenamento ufficiale di questo studente?", workoutReset: "Allenamento resettato.",
      dietSaved: "Dieta ufficiale salvata.", dietGenerated: "Dieta GUTO caricata.", gutoCanUpdateDiet: "GUTO può aggiornare la dieta.",
      dietLocked: "Dieta protetta da sovrascrittura.", resetDietConfirm: "Resettare la dieta ufficiale di questo studente?", dietReset: "Dieta resettata.",
      arenaXp: "Arena e XP", resetWeek: "Reset settimana", resetMonth: "Reset mese", resetXp: "Reset XP",
      resetHistory: "Reset storico", resetDone: "Reset eseguito.", tempPassword: "Password temporanea",
      generateTempPassword: "Genera password temporanea", tempPasswordGenerated: "Password temporanea generata.",
      criticalZone: "Zona critica", permanentDelete: "Elimina definitivamente",
      permanentDeleteConfirm: "Eliminare definitivamente questo studente e tutti i dati collegati?",
      permanentDeleted: "Studente eliminato definitivamente.",
      permanentDeleteHelp: "L'eliminazione permanente cancella i dati collegati dello studente. Usala solo quando l'azienda richiede la rimozione definitiva.",
    },
    calibration: {
      age: "Età", sex: "Sesso biologico", level: "Livello", goal: "Obiettivo", location: "Luogo preferito",
      country: "Paese", height: "Altezza cm", weight: "Peso kg", pathology: "Dolore o limitazione", foodRestrictions: "Restrizioni alimentari",
    },
    workout: {
      weeklySaved: "Piano settimanale salvato.", weeklySaveError: "Errore durante il salvataggio del piano settimanale.", weeklyTitle: "Piano settimanale",
      weeklyHelp: "Costruisci l'allenamento di ogni giorno. Lo studente vedrà nell'app solo l'allenamento del giorno corrente.",
      dayWorkout: "Allenamento del giorno", todayLabel: "Oggi", mainBlock: "Principale", restDay: "Riposo / nessun allenamento",
      focus: "Focus del giorno", coachNotes: "Note del coach", focusPlaceholder: "Es: Petto + tricipiti", notesPlaceholder: "Note opzionali",
      sets: "Serie", reps: "Ripetizioni", load: "Carico", rest: "Recupero", technique: "Tecnica", movementNote: "Nota sul movimento",
      substitutions: "Sostituzioni", searchCatalog: "Cerca esercizio nel catalogo...", catalog: "Catalogo", addWorkout: "Aggiungi allenamento",
      removeDay: "Rimuovi giorno", saveWeekly: "Salva piano settimanale", title: "Titolo", muscleFocus: "Gruppo muscolare / focus",
      day: "Giorno", location: "Luogo", select: "Seleziona", duration: "Durata stimata", difficulty: "Difficoltà",
      saveChanges: "Salva modifiche", createManual: "Crea allenamento manuale", generateGuto: "Genera con GUTO",
      history: "Storico", allowGuto: "Permetti a GUTO di aggiornare", lockGuto: "Blocca modifiche automatiche",
      reset: "Reset allenamento", addNewExercise: "Aggiungi nuovo esercizio", officialName: "Nome ufficiale", optionalId: "ID opzionale",
      group: "Gruppo", equipment: "Attrezzatura", safeMp4: "File MP4 sicuro", internalPath: "Percorso interno",
      durationSeconds: "Durata s", hasAudio: "Il video ha audio", sendApproval: "Invia per approvazione",
      approvalSent: "Esercizio inviato per approvazione tecnica.", studentExercises: "Esercizi di {name}",
      officialExercise: "Esercizio ufficiale", searchOfficial: "Cerca nel catalogo ufficiale", notChosen: "Non scelto",
      notFound: "Esercizio non trovato nel catalogo. Per usarlo, deve essere aggiunto al catalogo ufficiale con video locale validato.",
      chooseBeforeSave: "Scegli un esercizio dal catalogo ufficiale prima di salvare.", noEquipment: "senza attrezzatura",
      interval: "Intervallo", addExercise: "Aggiungi esercizio", workoutHistory: "Storico allenamento", noWorkoutHistory: "Nessuno storico allenamento.",
      videoLimitCopy: "Video obbligatorio: MP4, fino a 30s, fino a 12MB, massimo 720p, senza audio, percorso interno /exercise/visuals/custom/.",
      videoNoUpload: "Qui non c'è upload reale: il video deve essere già ottimizzato e disponibile nel percorso interno controllato.",
    },
    diet: {
      weeklySaved: "Piano settimanale dieta salvato.", weeklySaveError: "Errore durante il salvataggio del piano settimanale dieta.",
      weeklyTitle: "Piano settimanale dieta", weeklyHelp: "Costruisci la dieta di ogni giorno. I campi vuoti non saranno salvati. Lo studente vedrà la dieta del giorno tramite integrazione futura.",
      noDiet: "Nessuna dieta programmata", filled: "compilato", breakfast: "Colazione", lunch: "Pranzo", dinner: "Cena", snacks: "Spuntini",
      hydration: "Idratazione", notes: "Note", caloriesEstimate: "Stima calorie (kcal)", proteinEstimate: "Stima proteine (g)",
      clearDay: "Pulisci giorno", saveWeekly: "Salva piano settimanale", breakfastPlaceholder: "Es: Avena con banana, uova strapazzate...",
      lunchPlaceholder: "Es: Pollo alla griglia, riso, verdure...", dinnerPlaceholder: "Es: Zuppa di verdure, pesce alla griglia...",
      snacksPlaceholder: "Es: Yogurt, frutta, frutta secca...", hydrationPlaceholder: "Es: 2,5 litri d'acqua",
      notesPlaceholder: "Es: Evitare zucchero raffinato dopo le 18...", caloriesPlaceholder: "Es: 2200", proteinPlaceholder: "Es: 160",
      officialDiet: "Dieta ufficiale", title: "Titolo", country: "Paese", calories: "Calorie", protein: "Proteine g",
      carbs: "Carboidrati g", fat: "Grassi g", restrictions: "Restrizioni", coachNotes: "Note del coach",
      bmr: "BMR calcolato", tdee: "TDEE stimato", target: "Obiettivo dieta", foodsTotal: "Totale alimenti",
      missing: "Mancano", exceeded: "Superato di", matched: "Allineato all'obiettivo",
      mismatchToast: "La dieta deve chiudere a {target} kcal. Correggi {delta} kcal prima di salvare.",
      mismatchHelp: "Anche il backend rifiuterà questa dieta finché il totale degli alimenti non corrisponde esattamente all'obiettivo calorico.",
      saveChanges: "Salva modifiche", createManual: "Crea dieta manuale", generateGuto: "Genera con GUTO", history: "Storico",
      allowGuto: "Permetti a GUTO di aggiornare", lockGuto: "Blocca modifiche automatiche", reset: "Reset dieta",
      mealsOf: "Pasti di {name}", meal: "Pasto", time: "Orario", calculatedKcal: "Kcal calcolate",
      substitutions: "Sostituzioni", food: "Alimento", quantity: "Quantità", observation: "Nota",
      addFood: "Aggiungi alimento", addMeal: "Aggiungi pasto", newMeal: "Nuovo pasto",
      dietHistory: "Storico dieta", noDietHistory: "Nessuno storico dieta.",
    },
    planStatus: { locked: "Bloccato contro GUTO", unlocked: "GUTO può aggiornare" },
    rankings: { weekly: "Classifica settimanale", monthly: "Classifica mensile", general: "Classifica generale" },
    dialogs: {
      createStudent: "Crea studente", studentDesc: "Crea accesso reale nel backend. Senza password, il backend genera un invito.",
      firstName: "Nome", lastName: "Cognome", validEmail: "Usa un'email reale. Esempio: studente@email.com.",
      validPhone: "Usa un numero reale con prefisso. Sequenze come 111 non entrano.", sex: "Sesso", male: "Maschile",
      female: "Femminile", preferNot: "Preferisco non dirlo", age: "Età", optionalPassword: "Password iniziale opzionale",
      selectTeam: "Seleziona un Team *", responsibleCoach: "Coach responsabile", activateNow: "Attiva accesso ora",
      createCoach: "Crea coach", coachDesc: "Solo super admin/admin può creare coach.", name: "Nome", optionalCoachPassword: "Password opzionale",
      createTeam: "Crea Team", teamDesc: "Crea un nuovo GUTO Time. Solo super admin.", teamName: "Nome del Team",
      maxStudents: "Max studenti (vuoto = illimitato)", maxCoaches: "Max coach (vuoto = illimitato)",
    },
    days: {
      monday: ["Lunedì", "Lun"], tuesday: ["Martedì", "Mar"], wednesday: ["Mercoledì", "Mer"],
      thursday: ["Giovedì", "Gio"], friday: ["Venerdì", "Ven"], saturday: ["Sabato", "Sab"], sunday: ["Domenica", "Dom"],
      today: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
    },
  },
  "en-US": {
    loading: "Syncing panel",
    controlRoom: "Control room",
    hierarchy: "Hierarchy",
    teamNotSelected: "No team selected",
    activeStudents: "active students",
    selectTeam: "Select a team",
    clearSelectedTeam: "Clear selected team",
    nav: { students: "STUDENTS", coaches: "COACHES", arena: "ARENA", logs: "HISTORY", teams: "TEAMS" },
    detailTabs: { resumo: "Summary", acesso: "Access", calibragem: "Calibration", treino: "Workout", dieta: "Diet", arena: "Arena/XP", seguranca: "Security" },
    meta: {
      students: ["CONTROL ROOM / STUDENTS", "Students", "Operational base · {scope} · fast action"],
      coaches: ["CONTROL ROOM / COACHES", "Coaches", "Limited operators · permissions and student assignments"],
      arena: ["CONTROL ROOM / ARENA", "Arena", "Weekly and monthly XP by team · global individual ranking"],
      logs: ["CONTROL ROOM / HISTORY", "History", "Audit trail for critical panel actions"],
      teams: ["CONTROL ROOM / TEAMS", "Teams", "Companies, plans and B2B limits"],
      scopeSuper: "super admin",
      scopeOperation: "operation",
    },
    telemetry: { sys: "SYS", students: "STUDENTS", active: "ACTIVE", filters: "FILTERS" },
    status: { archived: "ARCHIVED", paused: "PAUSED", hiddenArena: "HIDDEN ARENA", active: "ACTIVE" },
    source: { guto_generated: "Generated by GUTO", coach_manual: "Coach manual", mixed: "Edited by coach", none: "No source" },
    common: {
      student: "Student", students: "Students", coach: "Coach", coaches: "Coaches", team: "Team", teams: "Teams",
      status: "Status", email: "Email", phone: "Phone", subscription: "Subscription", expiresAt: "Expires on",
      arena: "Arena", visible: "Visible", hidden: "Hidden", workout: "Workout", diet: "Diet", password: "Password",
      cancel: "Cancel", create: "Create", save: "Save", saving: "Saving...", edit: "Edit",
      select: "Select", deselect: "Deselect", selected: "SELECTED", reactivate: "Reactivate", archive: "Archive",
      delete: "Delete", open: "Open", invite: "Invite", clear: "Clear", search: "Search", clean: "clean",
      plan: "Plan", role: "Role", archived: "Archived", unlimited: "Unlimited", none: "-", today: "today",
      updatedAt: "Last update", by: "by", noRanking: "No ranking yet.", action: "action",
    },
    filters: {
      title: "Filters", foundSingular: "student found", foundPlural: "students found",
      active: "active", paused: "paused", archived: "archived", all: "all",
      searchPlaceholder: "Search name, email, phone or ID", allCoaches: "All coaches",
      sexAll: "Sex: all", paymentAll: "Payment: all", minAge: "Min. age", maxAge: "Max. age",
      activeCount: "active filters", resultSingular: "result in current view", resultPlural: "results in current view",
    },
    mural: {
      kicker: "Operations board", title: "Student and accountability panel", unavailable: "Team summary unavailable.",
      limitReached: "Plan limit reached. Upgrade the GUTO Time plan to register more {target}.",
    },
    table: {
      empty: "No students found.", student: "Student", status: "Status", coach: "Coach", phone: "Phone",
      week: "Week", month: "Month", lastAccess: "Last access", subscription: "Subscription", invite: "Invite", open: "Open",
      seen: "Seen",
    },
    relative: { today: "today", oneDay: "1 day ago", manyDays: "{days} days ago" },
    human: {
      active: "Active", paused: "Paused", archived: "Archived", paid: "Paid", unpaid: "Pending",
      pending_payment: "Payment pending", trial: "Trial", expired: "Expired", cancelled: "Cancelled",
      muscle_gain: "Muscle gain", fat_loss: "Fat loss", conditioning: "Conditioning",
      mobility_health: "Mobility and health", consistency: "Consistency", maintenance: "Maintenance",
      endurance: "Endurance", flexibility: "Flexibility", general_fitness: "General fitness", rehabilitation: "Rehabilitation",
      gym: "Gym", home: "Home", park: "Outdoors", mixed: "Mixed",
      start: "GUTO Time Start", pro: "GUTO Time Pro", elite: "GUTO Time Elite", custom: "Custom",
      male: "Male", female: "Female", other: "Other",
    },
    errors: {
      planLimit: "GUTO Time plan limit reached.", forbidden: "You do not have access to this student.",
      backendRejected: "The backend rejected the action.", name: "Enter the first name.", lastName: "Enter the last name.",
      email: "Enter a valid email.", phone: "Enter a valid phone number.", team: "Select a Team.",
      videoName: "Enter the exercise name.", videoRequired: "Video required: enter sourceFileName and videoUrl.",
      videoPath: "Use the internal path /exercise/visuals/custom/.", videoSafeName: "Use a safe name: lowercase, no accents, no spaces, with hyphens.",
      videoMeta: "Fill in all technical video metadata.", videoPositive: "Technical metadata must be positive.",
      videoLimit: "This video is too heavy for the app. Use MP4 up to 30 seconds, maximum 12MB and 720p.",
      videoMin: "Use a video of at least 3 seconds.",
    },
    actions: {
      credentialGenerated: "Credential generated", hide: "Hide", linkCopied: "Link copied.",
      inviteCopyFailed: "Could not copy the invite.", coachPaused: "Coach paused.", coachActive: "Coach active.",
      deleteCoachConfirm: "Delete coach? Reassign students first.", coachDeleted: "Coach deleted.",
      teamUpdated: "Team updated.", teamReactivated: "Team reactivated.", teamArchived: "Team archived.",
      studentCreated: "Student created.", coachCreated: "Coach created.", teamCreated: "Team created.",
    },
    sheet: {
      system: "System", evolution: "Evolution", officialPlan: "Official plan", accessControl: "Access control",
      accessInvite: "Access invite", pauseAccess: "Pause access", reactivateAccess: "Reactivate access",
      renew30: "Renew 30 days", hideArena: "Hide in Arena", showArena: "Show in Arena",
      assignCoach: "Assign coach", viewInvite: "View current invite", regenerateInvite: "Regenerate invite",
      inviteUnavailable: "Link unavailable. Use regenerate to create a new invite.",
      regenerateInviteConfirm: "Regenerate invite? The previous link will stop working.",
      accessPaused: "Access paused.", accessReactivated: "Access reactivated.", accessRenewed: "Access renewed for 30 days.",
      hiddenFromArena: "Student hidden from Arena.", visibleInArena: "Student visible in Arena.", inviteLoaded: "Invite loaded.",
      newInvite: "New invite generated.", calibration: "Student calibration", saveCalibration: "Save calibration",
      calibrationSaved: "Calibration updated.", officialWorkout: "Official workout", weeklyPlan: "Weekly plan",
      officialDiet: "Official diet", weeklyDiet: "Weekly plan", catalogRequired: "Choose an exercise from the official catalog before saving.",
      workoutSaved: "Official workout saved.", workoutGenerated: "Workout generated by GUTO.", gutoCanUpdateWorkout: "GUTO can update the workout.",
      workoutLocked: "Workout protected from overwrites.", resetWorkoutConfirm: "Reset this student's official workout?", workoutReset: "Workout reset.",
      dietSaved: "Official diet saved.", dietGenerated: "GUTO diet loaded.", gutoCanUpdateDiet: "GUTO can update the diet.",
      dietLocked: "Diet protected from overwrites.", resetDietConfirm: "Reset this student's official diet?", dietReset: "Diet reset.",
      arenaXp: "Arena and XP", resetWeek: "Reset week", resetMonth: "Reset month", resetXp: "Reset XP",
      resetHistory: "Reset history", resetDone: "Reset completed.", tempPassword: "Temporary password",
      generateTempPassword: "Generate temporary password", tempPasswordGenerated: "Temporary password generated.",
      criticalZone: "Critical zone", permanentDelete: "Delete permanently",
      permanentDeleteConfirm: "Permanently delete this student and all linked data?",
      permanentDeleted: "Student permanently deleted.",
      permanentDeleteHelp: "Permanent deletion erases linked student data. Use it only when the company requests definitive removal.",
    },
    calibration: {
      age: "Age", sex: "Biological sex", level: "Level", goal: "Goal", location: "Preferred location",
      country: "Country", height: "Height cm", weight: "Weight kg", pathology: "Pain or limitation", foodRestrictions: "Food restrictions",
    },
    workout: {
      weeklySaved: "Weekly plan saved.", weeklySaveError: "Error saving weekly plan.", weeklyTitle: "Weekly plan",
      weeklyHelp: "Build each day's workout. The student will only see the current day's workout in the app.",
      dayWorkout: "Day workout", todayLabel: "Today", mainBlock: "Main", restDay: "Rest / no workout",
      focus: "Day focus", coachNotes: "Coach notes", focusPlaceholder: "Ex: Chest + triceps", notesPlaceholder: "Optional notes",
      sets: "Sets", reps: "Reps", load: "Load", rest: "Rest", technique: "Technique", movementNote: "Movement note",
      substitutions: "Substitutions", searchCatalog: "Search exercise catalog...", catalog: "Catalog", addWorkout: "Add workout",
      removeDay: "Remove day", saveWeekly: "Save weekly plan", title: "Title", muscleFocus: "Muscle group / focus",
      day: "Day", location: "Location", select: "Select", duration: "Estimated duration", difficulty: "Difficulty",
      saveChanges: "Save changes", createManual: "Create manual workout", generateGuto: "Generate with GUTO",
      history: "History", allowGuto: "Allow GUTO to update", lockGuto: "Lock automatic changes",
      reset: "Reset workout", addNewExercise: "Add new exercise", officialName: "Official name", optionalId: "Optional ID",
      group: "Group", equipment: "Equipment", safeMp4: "Safe MP4 file", internalPath: "Internal path",
      durationSeconds: "Duration s", hasAudio: "Video has audio", sendApproval: "Send for approval",
      approvalSent: "Exercise sent for technical approval.", studentExercises: "{name}'s exercises",
      officialExercise: "Official exercise", searchOfficial: "Search the official catalog", notChosen: "Not selected",
      notFound: "Exercise not found in the catalog. To use it, it must be added to the official catalog with a validated local video.",
      chooseBeforeSave: "Choose an exercise from the official catalog before saving.", noEquipment: "no equipment",
      interval: "Rest interval", addExercise: "Add exercise", workoutHistory: "Workout history", noWorkoutHistory: "No workout history.",
      videoLimitCopy: "Video required: MP4, up to 30s, up to 12MB, maximum 720p, no audio, internal path /exercise/visuals/custom/.",
      videoNoUpload: "There is no real upload here: the video must already be optimized and available in the controlled internal path.",
    },
    diet: {
      weeklySaved: "Weekly diet plan saved.", weeklySaveError: "Error saving weekly diet plan.",
      weeklyTitle: "Weekly diet plan", weeklyHelp: "Build each day's diet. Blank fields will not be saved. The student will see the daily diet through a future integration.",
      noDiet: "No diet scheduled", filled: "filled", breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snacks: "Snacks",
      hydration: "Hydration", notes: "Notes", caloriesEstimate: "Calorie estimate (kcal)", proteinEstimate: "Protein estimate (g)",
      clearDay: "Clear day", saveWeekly: "Save weekly plan", breakfastPlaceholder: "Ex: Oats with banana, scrambled eggs...",
      lunchPlaceholder: "Ex: Grilled chicken, rice, vegetables...", dinnerPlaceholder: "Ex: Vegetable soup, grilled fish...",
      snacksPlaceholder: "Ex: Yogurt, fruit, nuts...", hydrationPlaceholder: "Ex: 2.5 liters of water",
      notesPlaceholder: "Ex: Avoid refined sugar after 6 PM...", caloriesPlaceholder: "Ex: 2200", proteinPlaceholder: "Ex: 160",
      officialDiet: "Official diet", title: "Title", country: "Country", calories: "Calories", protein: "Protein g",
      carbs: "Carbs g", fat: "Fat g", restrictions: "Restrictions", coachNotes: "Coach notes",
      bmr: "Calculated BMR", tdee: "Estimated TDEE", target: "Diet target", foodsTotal: "Food total",
      missing: "Missing", exceeded: "Exceeded by", matched: "Matched to target",
      mismatchToast: "The diet must close at {target} kcal. Adjust {delta} kcal before saving.",
      mismatchHelp: "The backend will also reject this diet while the food total does not exactly match the calorie target.",
      saveChanges: "Save changes", createManual: "Create manual diet", generateGuto: "Generate with GUTO", history: "History",
      allowGuto: "Allow GUTO to update", lockGuto: "Lock automatic changes", reset: "Reset diet",
      mealsOf: "{name}'s meals", meal: "Meal", time: "Time", calculatedKcal: "Calculated kcal",
      substitutions: "Substitutions", food: "Food", quantity: "Quantity", observation: "Note",
      addFood: "Add food", addMeal: "Add meal", newMeal: "New meal",
      dietHistory: "Diet history", noDietHistory: "No diet history.",
    },
    planStatus: { locked: "Locked against GUTO", unlocked: "GUTO can update" },
    rankings: { weekly: "Weekly ranking", monthly: "Monthly ranking", general: "Overall ranking" },
    dialogs: {
      createStudent: "Create student", studentDesc: "Creates real backend access. Without a password, the backend generates an invite.",
      firstName: "First name", lastName: "Last name", validEmail: "Use a real email. Example: student@email.com.",
      validPhone: "Use a real phone number with area code. Sequences like 111 are not accepted.", sex: "Sex", male: "Male",
      female: "Female", preferNot: "Prefer not to say", age: "Age", optionalPassword: "Optional initial password",
      selectTeam: "Select a Team *", responsibleCoach: "Responsible coach", activateNow: "Activate access now",
      createCoach: "Create coach", coachDesc: "Only super admin/admin can create a coach.", name: "Name", optionalCoachPassword: "Optional password",
      createTeam: "Create Team", teamDesc: "Creates a new GUTO Time. Super admin only.", teamName: "Team name",
      maxStudents: "Max students (blank = unlimited)", maxCoaches: "Max coaches (blank = unlimited)",
    },
    days: {
      monday: ["Monday", "Mon"], tuesday: ["Tuesday", "Tue"], wednesday: ["Wednesday", "Wed"],
      thursday: ["Thursday", "Thu"], friday: ["Friday", "Fri"], saturday: ["Saturday", "Sat"], sunday: ["Sunday", "Sun"],
      today: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
  },
} as const;

type AdminPanelCopy = (typeof ADMIN_PANEL_COPY)[AdminPanelLanguage];

function copyText(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);
}

function getDetailTabs(isAdmin: boolean, copy: AdminPanelCopy): Array<{ id: DetailTab; label: string }> {
  const allTabs: Array<{ id: DetailTab; label: string }> = [
    { id: "resumo", label: copy.detailTabs.resumo },
    { id: "calibragem", label: copy.detailTabs.calibragem },
    { id: "treino", label: copy.detailTabs.treino },
    { id: "dieta", label: copy.detailTabs.dieta },
  ];
  if (isAdmin) {
    allTabs.splice(1, 0, { id: "acesso", label: copy.detailTabs.acesso });
    allTabs.push({ id: "arena", label: copy.detailTabs.arena });
    allTabs.push({ id: "seguranca", label: copy.detailTabs.seguranca });
  }
  return allTabs;
}

function dashboardScreenMeta(tab: DashboardTab, isSuperAdmin: boolean, copy: AdminPanelCopy): { kicker: string; title: string; subtitle: string } {
  const scope = isSuperAdmin ? copy.meta.scopeSuper : copy.meta.scopeOperation;
  const map = {
    students: copy.meta.students,
    coaches: copy.meta.coaches,
    arena: copy.meta.arena,
    logs: copy.meta.logs,
    teams: copy.meta.teams,
  };
  const [kicker, title, subtitle] = map[tab];
  return { kicker, title, subtitle: subtitle.replace("{scope}", scope) };
}

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

function getStatusInfo(s: AdminStudent, copy: AdminPanelCopy): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (s.archived) return { text: copy.status.archived, variant: "destructive" };
  if (!s.active) return { text: copy.status.paused, variant: "secondary" };
  if (!s.visibleInArena) return { text: copy.status.hiddenArena, variant: "outline" };
  return { text: copy.status.active, variant: "default" };
}

function relativeTime(iso: string | null, copy: AdminPanelCopy): string {
  if (!iso) return copy.common.none;
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return copy.relative.today;
  if (days === 1) return copy.relative.oneDay;
  return copyText(copy.relative.manyDays, { days });
}

function avatarStageLabel(stage: AvatarStage): string {
  return ({ baby: "Baby", teen: "Teen", adult: "Adult", elite: "Elite" } as Record<AvatarStage, string>)[stage] ?? stage;
}

function adminErrorMessage(error: unknown, copy: AdminPanelCopy = ADMIN_PANEL_COPY["pt-BR"]): string {
  if (error instanceof ApiError) {
    const code = error.details && typeof error.details === "object" && "code" in error.details ? String(error.details.code) : "";
    if (code === "GUTO_TEAM_PLAN_LIMIT_REACHED") return copy.errors.planLimit;
    if (error.status === 403) return copy.errors.forbidden;
    const suffix = error.status ? ` (${error.status})` : "";
    return `${error.message || copy.errors.backendRejected}${suffix}`;
  }
  if (error instanceof Error) return error.message;
  return copy.errors.backendRejected;
}

function sourceLabel(source: string | undefined, copy: AdminPanelCopy): string {
  return source ? copy.source[source as keyof typeof copy.source] || source : copy.source.none;
}

function formatDate(value: string | null | undefined, language: AdminPanelLanguage): string {
  return value ? new Date(value).toLocaleDateString(language) : ADMIN_PANEL_COPY[language].common.none;
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

function blankWorkout(student: AdminStudent, copy: AdminPanelCopy = ADMIN_PANEL_COPY["pt-BR"]): GutoWorkoutPlan {
  return {
    studentId: student.userId,
    title: copy.workout.createManual,
    focus: copy.workout.createManual,
    weekDay: "today",
    goal: student.plan || "",
    location: "gym",
    dateLabel: copy.workout.todayLabel,
    scheduledFor: new Date().toISOString(),
    summary: "",
    source: "coach_manual",
    lockedByCoach: true,
    manualOverride: true,
    estimatedDurationMinutes: 60,
    difficulty: "",
    coachNotes: "",
    exercises: [blankExercise()],
    blocks: [{ name: copy.workout.mainBlock, exercises: [blankExercise()] }],
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

function validateCustomExerciseDraft(draft: CustomExerciseDraft, copy: AdminPanelCopy): string | null {
  const fileSizeBytes = Number(draft.fileSizeBytes);
  const durationSeconds = Number(draft.durationSeconds);
  const width = Number(draft.width);
  const height = Number(draft.height);
  const fps = Number(draft.fps);
  const sourceFileName = draft.sourceFileName.trim();
  const videoUrl = draft.videoUrl.trim();
  const longSide = Math.max(width, height);
  const shortSide = Math.min(width, height);

  if (!draft.canonicalNamePt.trim()) return copy.errors.videoName;
  if (!sourceFileName || !videoUrl) return copy.errors.videoRequired;
  if (!videoUrl.startsWith("/exercise/visuals/custom/") || videoUrl.includes("..") || /\s/.test(videoUrl)) return copy.errors.videoPath;
  if (!isSafeExerciseVideoFileName(sourceFileName) || !videoUrl.endsWith(`/${sourceFileName}`)) return copy.errors.videoSafeName;
  if (!Number.isFinite(fileSizeBytes) || !Number.isFinite(durationSeconds) || !Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(fps)) return copy.errors.videoMeta;
  if (fileSizeBytes <= 0 || durationSeconds <= 0 || width <= 0 || height <= 0 || fps <= 0) return copy.errors.videoPositive;
  if (fileSizeBytes > 12 * 1024 * 1024 || durationSeconds > 30 || longSide > 1280 || shortSide > 720 || fps > 30 || draft.hasAudio) return copy.errors.videoLimit;
  if (durationSeconds < 3) return copy.errors.videoMin;
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
  index: number,
  language: AdminPanelLanguage = "pt-BR"
): GutoWorkoutExercise {
  const localizedName = catalogExercise.namesByLanguage?.[language] || catalogExercise.canonicalNamePt;
  return {
    ...current,
    id: catalogExercise.id,
    name: localizedName,
    canonicalNamePt: catalogExercise.canonicalNamePt,
    muscleGroup: catalogExercise.muscleGroup,
    order: current.order ?? index + 1,
    videoUrl: catalogExercise.videoUrl,
    videoProvider: "local",
    sourceFileName: catalogExercise.sourceFileName,
  };
}

function normalizeWorkoutForEditor(plan: GutoWorkoutPlan | null, student: AdminStudent, copy: AdminPanelCopy = ADMIN_PANEL_COPY["pt-BR"]): GutoWorkoutPlan {
  if (!plan) return blankWorkout(student, copy);
  const exercises = (plan.exercises?.length ? plan.exercises : []).map((exercise, index) => ({
    ...blankExercise(index),
    ...exercise,
    order: exercise.order ?? index + 1,
    load: exercise.load ?? "",
    alternatives: exercise.alternatives ?? [],
  }));
  return {
    ...blankWorkout(student, copy),
    ...plan,
    studentId: student.userId,
    source: plan.source || (plan.manualOverride ? "coach_manual" : "guto_generated"),
    exercises: exercises.length ? exercises : [blankExercise()],
  };
}

function blankDiet(student: AdminStudent, copy: AdminPanelCopy = ADMIN_PANEL_COPY["pt-BR"]): DietPlan {
  return {
    userId: student.userId,
    title: copy.diet.createManual,
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
	        name: copy.diet.breakfast,
	        time: "07:30",
	        totalKcal: 160,
	        gutoNote: "",
	        foods: [{ name: copy.diet.food, quantity: "2", kcal: 160, notes: "" }],
	        alternatives: [],
      },
    ],
    foodRestrictions: "",
    coachNotes: "",
	  };
	}

function mealFoodKcalTotal(meal: DietPlan["meals"][number]): number {
  return Math.round((meal.foods || []).reduce((sum, food) => sum + (Number(food.kcal) || 0), 0));
}

function syncMealKcal(meal: DietPlan["meals"][number]): DietPlan["meals"][number] {
  const totalKcal = mealFoodKcalTotal(meal);
  return { ...meal, totalKcal };
}

function dietFoodKcalTotal(plan: DietPlan): number {
  return plan.meals.reduce((sum, meal) => sum + mealFoodKcalTotal(meal), 0);
}

function normalizeDietForEditor(plan: DietPlan | null, student: AdminStudent, copy: AdminPanelCopy = ADMIN_PANEL_COPY["pt-BR"]): DietPlan {
	  if (!plan) return blankDiet(student, copy);
	  return {
    ...blankDiet(student, copy),
    ...plan,
    userId: student.userId,
    source: plan.source || (plan.manualOverride ? "coach_manual" : "guto_generated"),
    macros: { ...blankDiet(student, copy).macros, ...plan.macros },
	    meals: (plan.meals?.length ? plan.meals : blankDiet(student, copy).meals).map(syncMealKcal),
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

function formatHuman(val: string | null | undefined, copy: AdminPanelCopy): string {
  if (!val) return copy.common.none;
  return copy.human[val as keyof typeof copy.human] ?? val.replace(/_/g, " ");
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

function studentDraftError(draft: StudentDraft, isSuperAdmin: boolean, copy: AdminPanelCopy): string | null {
  if (!draft.firstName.trim()) return copy.errors.name;
  if (!draft.lastName.trim()) return copy.errors.lastName;
  if (!isValidEmail(draft.email)) return copy.errors.email;
  if (!isValidPhone(draft.phone)) return copy.errors.phone;
  if (isSuperAdmin && !draft.teamId) return copy.errors.team;
  return null;
}

function CoachInner() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [adminLanguage, setAdminLanguage] = useState<AdminPanelLanguage>("pt-BR");
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
  const copy = ADMIN_PANEL_COPY[adminLanguage];
  const studentLimitReached = Boolean(teamSummary && teamSummary.limits.maxStudents !== null && teamSummary.usage.students >= teamSummary.limits.maxStudents);
  const coachLimitReached = Boolean(teamSummary && teamSummary.limits.maxCoaches !== null && teamSummary.usage.coaches >= teamSummary.limits.maxCoaches);
  const superAdminNeedsTeam = isSuperAdmin && !selectedTeamId;
  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;
  const detailTabs = useMemo(() => getDetailTabs(isAdmin, copy), [copy, isAdmin]);
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
      { id: "students", label: copy.nav.students, icon: <Users className="h-4 w-4" />, badge: studentSnapshot.active },
      { id: "arena", label: copy.nav.arena, icon: <Activity className="h-4 w-4" /> },
    ];
    if (isAdmin) {
      items.splice(1, 0, { id: "coaches", label: copy.nav.coaches, icon: <Shield className="h-4 w-4" />, badge: coaches.length || undefined });
      items.push({ id: "logs", label: copy.nav.logs, icon: <History className="h-4 w-4" /> });
    }
    if (isSuperAdmin) {
      items.push({ id: "teams", label: copy.nav.teams, icon: <Building2 className="h-4 w-4" />, badge: teams.length || undefined });
    }
    return items;
  }, [coaches.length, copy, isAdmin, isSuperAdmin, studentSnapshot.active, teams.length]);
  const screenMeta = dashboardScreenMeta(activeDashboardTab, isSuperAdmin, copy);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(ADMIN_PANEL_LANGUAGE_KEY) : null;
    if (isAdminPanelLanguage(saved)) setAdminLanguage(saved);
  }, [copy]);

  const changeAdminLanguage = useCallback((language: AdminPanelLanguage) => {
    setAdminLanguage(language);
    window.localStorage.setItem(ADMIN_PANEL_LANGUAGE_KEY, language);
  }, []);

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
      setTeamSummaryError(adminErrorMessage(error, copy));
    }
  }, [copy]);

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
      toast.error(adminErrorMessage(error, copy));
    } finally {
      setLoading(false);
    }
  }, [copy, fetchCoaches, fetchExerciseCatalog, fetchTeamSummary, fetchTeams, user]);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (!user) return;
    void fetchStudents().catch((error) => toast.error(adminErrorMessage(error, copy)));
  }, [copy, fetchStudents, user]);

  useEffect(() => {
    if (activeDashboardTab === "arena") void fetchRankings().catch((error) => toast.error(adminErrorMessage(error, copy)));
    if (activeDashboardTab === "logs") void fetchGlobalLogs().catch((error) => toast.error(adminErrorMessage(error, copy)));
  }, [activeDashboardTab, copy, fetchGlobalLogs, fetchRankings]);

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
    setWorkoutEditor(normalizeWorkoutForEditor(workout.workout, detail.student, copy));
    setWeeklyWorkoutPlan(weeklyWorkout.weeklyWorkout);
    setWeeklyDietPlan(weeklyDiet.weeklyDiet);
    setDietEditor(normalizeDietForEditor(diet.diet, detail.student, copy));
    setCalibrationDraft(calibrationFromMemory(detail.memory));
    setStudents((current) => current.map((student) => student.userId === detail.student.userId ? detail.student : student));
  }, [copy]);

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
      toast.error(adminErrorMessage(error, copy));
    }
  }, [copy, refreshSelected]);

  const copyStudentInvite = useCallback(async (student: AdminStudent) => {
    try {
      const result = await getAdminStudentInvite(student.userId);
      const link = result.inviteLink ?? (await regenerateAdminStudentInvite(student.userId)).inviteLink;
      await navigator.clipboard.writeText(link);
      toast.success(copy.actions.linkCopied);
    } catch {
      toast.error(copy.actions.inviteCopyFailed);
    }
  }, [copy]);

  const act = useCallback(async (fn: () => Promise<void>, successMsg: string) => {
    setActing(true);
    try {
      await fn();
      toast.success(successMsg);
      await Promise.all([fetchStudents(), fetchTeamSummary()]);
      if (selectedDetail) await refreshSelected(selectedDetail.student.userId);
    } catch (error) {
      toast.error(adminErrorMessage(error, copy));
    } finally {
      setActing(false);
    }
  }, [copy, fetchStudents, fetchTeamSummary, refreshSelected, selectedDetail]);

  const filtered = useMemo(() => students, [students]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <p className="text-[#00e5ff] text-xs tracking-widest uppercase animate-pulse">{copy.loading}</p>
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
          copy={copy}
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
            language={adminLanguage}
            copy={copy}
            onLanguageChange={changeAdminLanguage}
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
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#00e5ff]">{copy.actions.credentialGenerated}</p>
                <p className="break-all font-mono text-sm font-black text-white">{lastSecret}</p>
              </div>
              <Button variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => setLastSecret(null)}>
                {copy.actions.hide}
              </Button>
            </div>
          </div>
        )}

        <div className="mb-5 grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <section className="rounded-lg border border-white/8 bg-white/[0.035] p-4">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#00e5ff]">{copy.mural.kicker}</p>
                <h1 className="mt-1 text-xl font-black text-white">{copy.mural.title}</h1>
              </div>
              <p className="font-mono text-[10px] text-white/35">{filtered.length} {filtered.length === 1 ? copy.filters.resultSingular : copy.filters.resultPlural}</p>
            </div>
            {teamSummary ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                <MetricCard label={copy.common.team} value={teamSummary.team.name} cyan className="lg:col-span-2" />
                <MetricCard label={copy.common.plan} value={formatHuman(teamSummary.team.planLabel, copy)} />
                <MetricCard label={copy.common.students} value={`${teamSummary.usage.students} / ${teamSummary.limits.maxStudents ?? "∞"}`} />
                <MetricCard label={copy.status.active} value={studentSnapshot.active} />
                <MetricCard label={copy.status.paused} value={studentSnapshot.paused} />
                <MetricCard label={copy.common.arena} value={studentSnapshot.visibleArena} />
              </div>
            ) : (
              <p className="text-xs text-white/35">{teamSummaryError || copy.mural.unavailable}</p>
            )}
            {(studentLimitReached || coachLimitReached) && (
              <p className="mt-3 text-xs font-bold text-[#00e5ff]">
                {copyText(copy.mural.limitReached, { target: studentLimitReached ? copy.common.students.toLowerCase() : copy.common.coaches.toLowerCase() })}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-white/8 bg-white/[0.035] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">{adminLanguage === "pt-BR" ? "Escopo" : adminLanguage === "it-IT" ? "Ambito" : "Scope"}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Metric label={copy.common.role} value={user.role.toUpperCase()} cyan />
              <Metric label={copy.common.coaches} value={`${teamSummary?.usage.coaches ?? "-"} / ${teamSummary?.limits.maxCoaches ?? "∞"}`} />
              <Metric label={copy.common.archived} value={studentSnapshot.archived} />
              <Metric label={copy.telemetry.filters} value={activeFilterCount || copy.common.clean} />
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
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">{copy.filters.title}</p>
                  <p className="mt-1 text-sm font-bold text-white">{filtered.length} {filtered.length === 1 ? copy.filters.foundSingular : copy.filters.foundPlural}</p>
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
                      {tab === "ativos" ? copy.filters.active : tab === "pausados" ? copy.filters.paused : tab === "arquivados" ? copy.filters.archived : copy.filters.all}
                    </button>
                  ))}
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearStudentFilters}
                      className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/55 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                      {copy.common.clear}
                    </button>
                  )}
                </div>
              </div>
              <div className={`grid gap-2 md:grid-cols-2 ${isAdmin ? "xl:grid-cols-[minmax(260px,1.3fr)_repeat(5,minmax(120px,1fr))]" : "xl:grid-cols-[minmax(260px,1.3fr)_repeat(4,minmax(120px,1fr))]"}`}>
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                  <Input
                    placeholder={copy.filters.searchPlaceholder}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-10 border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/25"
                  />
                </label>
                {isAdmin && (
                  <select value={coachFilter} onChange={(event) => setCoachFilter(event.target.value)} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
                    <option value="" className="bg-[#0d1426]">{copy.filters.allCoaches}</option>
                    {coaches.map((coach) => <option key={coach.userId} value={coach.userId} className="bg-[#0d1426]">{coach.name || coach.email || coach.userId}</option>)}
                  </select>
                )}
                <select value={genderFilter} onChange={(event) => setGenderFilter(event.target.value)} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
                  <option value="" className="bg-[#0d1426]">{copy.filters.sexAll}</option>
                  {["male", "female", "other"].map((code) => (
                    <option key={code} value={code} className="bg-[#0d1426]">{formatHuman(code, copy)}</option>
                  ))}
                </select>
                <select value={subscriptionStatusFilter} onChange={(event) => setSubscriptionStatusFilter(event.target.value)} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
                  <option value="" className="bg-[#0d1426]">{copy.filters.paymentAll}</option>
                  {["active", "pending_payment", "cancelled", "paused", "trial", "expired"].map((code) => (
                    <option key={code} value={code} className="bg-[#0d1426]">{formatHuman(code, copy)}</option>
                  ))}
                </select>
                <Input type="number" inputMode="numeric" placeholder={copy.filters.minAge} value={minAgeFilter} onChange={(event) => setMinAgeFilter(event.target.value)} className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/25" />
                <Input type="number" inputMode="numeric" placeholder={copy.filters.maxAge} value={maxAgeFilter} onChange={(event) => setMaxAgeFilter(event.target.value)} className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/25" />
              </div>
            </div>

            <div className="hidden lg:block">
              <StudentDesktopTable students={filtered} coaches={coaches} copy={copy} onOpen={(student) => void openStudent(student)} onCopyInvite={(student) => void copyStudentInvite(student)} />
            </div>
            <div className="grid gap-3 lg:hidden">
              <StudentMobileCards students={filtered} coaches={coaches} copy={copy} onOpen={(student) => void openStudent(student)} onCopyInvite={(student) => void copyStudentInvite(student)} />
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
                    }, coach.active ? copy.actions.coachPaused : copy.actions.coachActive)}>
                      {coach.active ? copy.status.paused : copy.status.active}
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500 hover:text-white" disabled={acting} onClick={() => {
                      if (!window.confirm(copy.actions.deleteCoachConfirm)) return;
                      void act(async () => {
                        await deleteAdminCoach(coach.userId);
                        setCoaches((current) => current.filter((item) => item.userId !== coach.userId));
                      }, copy.actions.coachDeleted);
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
            <RankingSection title={copy.rankings.weekly} items={rankings?.weekly.items || []} copy={copy} />
            <RankingSection title={copy.rankings.monthly} items={rankings?.monthly.items || []} copy={copy} />
            <RankingSection title={copy.rankings.general} items={rankings?.individual.items || []} copy={copy} showStreak />
          </div>
        )}

        {isAdmin && activeDashboardTab === "logs" && (
          <LogList logs={globalLogs} empty={adminLanguage === "pt-BR" ? "Sem logs globais." : adminLanguage === "it-IT" ? "Nessun log globale." : "No global logs."} copy={copy} language={adminLanguage} />
        )}

        {activeDashboardTab === "teams" && isSuperAdmin && (
          <div className="grid gap-3">
            {!selectedTeamId && (
              <div className="rounded-xl border border-[#00e5ff]/20 bg-[#00e5ff]/5 p-3 text-center text-[10px] font-bold text-[#00e5ff]/70">
                {adminLanguage === "pt-BR" ? "Selecione um Time abaixo para criar coaches e alunos nele." : adminLanguage === "it-IT" ? "Seleziona un Team qui sotto per creare coach e studenti al suo interno." : "Select a Team below before creating coaches and students in it."}
              </div>
            )}
            {teams.map((team) => {
              const isSelected = selectedTeamId === team.id;
              const isEditing = editingTeamId === team.id;
              return (
                <div
                  key={team.id}
                  className={`rounded-xl border p-4 transition ${isSelected ? "border-[#00e5ff]/50 bg-[#00e5ff]/6" : "border-white/7 bg-white/[0.035]"}`}
                >
                  {isEditing ? (
                    <div className="grid gap-3">
                      <Field label={copy.dialogs.name} value={editTeamDraft.name} onChange={(name) => setEditTeamDraft((d) => ({ ...d, name }))} />
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">{copy.common.plan}</span>
                        <select
                          value={editTeamDraft.plan}
                          onChange={(e) => setEditTeamDraft((d) => ({ ...d, plan: e.target.value as TeamDraft["plan"] }))}
                          className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                        >
                          <option value="start" className="bg-[#0d1426]">GUTO Time Start</option>
                          <option value="pro" className="bg-[#0d1426]">GUTO Time Pro</option>
                          <option value="elite" className="bg-[#0d1426]">GUTO Time Elite</option>
                          <option value="custom" className="bg-[#0d1426]">{formatHuman("custom", copy)}</option>
                        </select>
                      </label>
                      {editTeamDraft.plan === "custom" && (
                        <>
                          <Field label={copy.dialogs.maxStudents} value={editTeamDraft.maxStudents} onChange={(v) => setEditTeamDraft((d) => ({ ...d, maxStudents: v }))} />
                          <Field label={copy.dialogs.maxCoaches} value={editTeamDraft.maxCoaches} onChange={(v) => setEditTeamDraft((d) => ({ ...d, maxCoaches: v }))} />
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
                        }, copy.actions.teamUpdated)} className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white">
                          <Save className="mr-1 h-3 w-3" /> {copy.common.save}
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => setEditingTeamId(null)}>
                          {copy.common.cancel}
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white/50 hover:text-white" disabled={acting} onClick={() => void act(async () => {
                          const next = team.status === "archived" ? "active" : "archived";
                          const result = await updateAdminTeam(team.id, { status: next });
                          setTeams((current) => current.map((t) => t.id === team.id ? result.team : t));
                          setEditingTeamId(null);
                        }, team.status === "archived" ? copy.actions.teamReactivated : copy.actions.teamArchived)}>
                          {team.status === "archived" ? copy.common.reactivate : copy.common.archive}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <p className={`font-black ${isSelected ? "text-[#00e5ff]" : "text-white"}`}>{team.name}</p>
                          {isSelected && <Badge className="bg-[#00e5ff] text-[#0a0f1e] text-[9px] font-black">{copy.common.selected}</Badge>}
                        </div>
                        <p className="font-mono text-[10px] text-white/35">{team.id} · {formatHuman(team.plan, copy)}</p>
                        {team.customLimits && (
                          <p className="mt-1 font-mono text-[10px] text-white/25">
                            {copy.common.students}: {team.customLimits.maxStudents ?? copy.common.unlimited} · {copy.common.coaches}: {team.customLimits.maxCoaches ?? copy.common.unlimited}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={team.status === "active" ? "default" : "secondary"} className="text-[10px] font-black uppercase">
                          {formatHuman(team.status, copy)}
                        </Badge>
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => {
                          setEditingTeamId(team.id);
                          setEditTeamDraft({ name: team.name, plan: team.plan, maxStudents: String(team.customLimits?.maxStudents ?? ""), maxCoaches: String(team.customLimits?.maxCoaches ?? "") });
                        }}>
                          {copy.common.edit}
                        </Button>
                        <Button size="sm" className={isSelected ? "bg-white/10 text-white" : "bg-[#00e5ff] text-[#0a0f1e] hover:bg-white"} onClick={() => {
                          setSelectedTeamId(isSelected ? null : team.id);
                          if (!isSelected) {
                            setStudentDraft((d) => ({ ...d, teamId: team.id }));
                            setCoachDraft((d) => ({ ...d, teamId: team.id }));
                          }
                        }}>
                          {isSelected ? copy.common.deselect : copy.common.select}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!teams.length && (
              <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-sm text-white/35">
                {adminLanguage === "pt-BR" ? "Nenhum Time cadastrado. Clique em \"Criar Time\" para começar." : adminLanguage === "it-IT" ? "Nessun Team registrato. Clicca su \"Crea Team\" per iniziare." : "No Team registered. Click \"Create Team\" to start."}
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
                      <Badge className="bg-[#00e5ff] text-[#0a0f1e] text-[9px] font-black">{copy.common.student}</Badge>
                      <span className="truncate font-mono text-[10px] text-white/30">{selected.userId}</span>
                    </div>
                    <SheetTitle className="truncate text-2xl font-black text-white">{selected.name}</SheetTitle>
                  </div>
                  <Badge variant={getStatusInfo(selected, copy).variant} className="text-[10px] font-black uppercase">{getStatusInfo(selected, copy).text}</Badge>
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
                    <Panel title={copy.sheet.system}>
                      <DataRow label={copy.common.status} value={<Badge variant={getStatusInfo(selected, copy).variant}>{getStatusInfo(selected, copy).text}</Badge>} />
                      <DataRow label={copy.common.email} value={selected.email || copy.common.none} />
                      <DataRow label={copy.common.phone} value={selected.phone || copy.common.none} />
                      <DataRow label={copy.common.subscription} value={formatHuman(selected.subscriptionStatus, copy)} />
                      <DataRow label={copy.common.expiresAt} value={formatDate(selected.subscriptionEndsAt, adminLanguage)} />
                      <DataRow label={copy.common.coach} value={coachLabel(selected, coaches)} />
                      {user.role === "super_admin" && <DataRow label={copy.common.team} value={teams.find((t) => t.id === selected.teamId)?.name || selected.teamId || copy.common.none} />}
                      <DataRow label={copy.common.arena} value={selected.visibleInArena ? copy.common.visible : copy.common.hidden} />
                    </Panel>
                    <Panel title={copy.sheet.evolution}>
                      <DataRow label={`${copy.table.week} XP`} value={`${selected.weeklyXp} XP`} />
                      <DataRow label={`${copy.table.month} XP`} value={`${selected.monthlyXp} XP`} />
                      <DataRow label="XP total" value={`${selected.totalXp} XP`} />
                      <DataRow label={adminLanguage === "pt-BR" ? "Sequência" : adminLanguage === "it-IT" ? "Serie" : "Streak"} value={`${selected.currentStreak}d`} />
                      <DataRow label="Avatar" value={avatarStageLabel(selected.avatarStage)} />
                    </Panel>
                    <Panel title={copy.sheet.officialPlan} className="md:col-span-2">
                      <DataRow label={copy.common.workout} value={`${sourceLabel(selectedDetail.workout?.source, copy)}${selectedDetail.workout?.lockedByCoach ? ` · ${copy.planStatus.locked}` : ""}`} />
                      <DataRow label={copy.common.diet} value={`${sourceLabel(selectedDetail.diet?.source, copy)}${selectedDetail.diet?.lockedByCoach ? ` · ${copy.planStatus.locked}` : ""}`} />
                    </Panel>
                  </div>
                )}

                {isAdmin && detailTab === "acesso" && (
                  <Panel title={copy.sheet.accessControl}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <ActionButton disabled={acting} onClick={() => void act(async () => {
                        const result = selected.active ? await pauseAdminStudent(selected.userId) : await reactivateAdminStudent(selected.userId);
                        setSelectedDetail((current) => current ? { ...current, student: result.student } : current);
                      }, selected.active ? copy.sheet.accessPaused : copy.sheet.accessReactivated)}>
                        {selected.active ? copy.sheet.pauseAccess : copy.sheet.reactivateAccess}
                      </ActionButton>
                      <ActionButton disabled={acting} onClick={() => void act(async () => {
                        const result = await renewAdminStudent(selected.userId, 30);
                        setSelectedDetail((current) => current ? { ...current, student: result.student } : current);
                      }, copy.sheet.accessRenewed)}>
                        {copy.sheet.renew30}
                      </ActionButton>
                      <ActionButton disabled={acting} onClick={() => void act(async () => {
                        const result = await updateAdminStudent(selected.userId, { visibleInArena: !selected.visibleInArena });
                        setSelectedDetail((current) => current ? { ...current, student: result.student } : current);
                      }, selected.visibleInArena ? copy.sheet.hiddenFromArena : copy.sheet.visibleInArena)}>
                        {selected.visibleInArena ? copy.sheet.hideArena : copy.sheet.showArena}
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
                            }, adminLanguage === "pt-BR" ? "Aluno atribuído ao coach." : adminLanguage === "it-IT" ? "Studente assegnato al coach." : "Student assigned to coach.");
                          }}
                          className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-center text-xs font-bold text-white hover:bg-white/10"
                        >
                          <option value="" className="bg-[#0d1426]">{copy.sheet.assignCoach}</option>
                          {coaches.map((coach) => (
                            <option key={coach.userId} value={coach.userId} className="bg-[#0d1426]">{coach.name || coach.userId}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="mt-4 border-t border-white/8 pt-4">
                      <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/30">{copy.sheet.accessInvite}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <ActionButton disabled={acting} onClick={() => void act(async () => {
                          const result = await getAdminStudentInvite(selected.userId);
                          if (result.inviteLink) {
                            setLastSecret(result.inviteLink);
                          } else {
                            toast.info(result.message || copy.sheet.inviteUnavailable);
                          }
                        }, copy.sheet.inviteLoaded)}>
                          {copy.sheet.viewInvite}
                        </ActionButton>
                        <ActionButton disabled={acting} onClick={() => {
                          if (!window.confirm(copy.sheet.regenerateInviteConfirm)) return;
                          void act(async () => {
                            const result = await regenerateAdminStudentInvite(selected.userId);
                            setLastSecret(result.inviteLink);
                          }, copy.sheet.newInvite);
                        }}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {copy.sheet.regenerateInvite}
                        </ActionButton>
                      </div>
                      {lastSecret?.startsWith("http") && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#00e5ff]/30 bg-[#00e5ff]/10 p-3">
                          <p className="min-w-0 flex-1 break-all font-mono text-xs text-white">{lastSecret}</p>
                          <Button size="sm" variant="outline" className="shrink-0 border-white/10 bg-white/5 text-white" onClick={() => { void navigator.clipboard.writeText(lastSecret); toast.success(copy.actions.linkCopied); }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Panel>
                )}

                {detailTab === "calibragem" && (
                  <Panel title={copy.sheet.calibration}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label={copy.calibration.age} value={calibrationDraft.userAge} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, userAge: value }))} />
                      <Field label={copy.calibration.sex} value={calibrationDraft.biologicalSex} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, biologicalSex: value }))} />
                      <Field label={copy.calibration.level} value={calibrationDraft.trainingLevel} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, trainingLevel: value }))} />
                      <Field label={copy.calibration.goal} value={calibrationDraft.trainingGoal} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, trainingGoal: value }))} />
                      <Field label={copy.calibration.location} value={calibrationDraft.preferredTrainingLocation} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, preferredTrainingLocation: value }))} />
                      <Field label={copy.calibration.country} value={calibrationDraft.country} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, country: value }))} />
                      <Field label={copy.calibration.height} value={calibrationDraft.heightCm} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, heightCm: value }))} />
                      <Field label={copy.calibration.weight} value={calibrationDraft.weightKg} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, weightKg: value }))} />
                      <Field label={copy.calibration.pathology} value={calibrationDraft.trainingPathology} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, trainingPathology: value }))} className="md:col-span-2" />
                      <Field label={copy.calibration.foodRestrictions} value={calibrationDraft.foodRestrictions} onChange={(value) => setCalibrationDraft((draft) => ({ ...draft, foodRestrictions: value }))} className="md:col-span-2" />
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
                    }, copy.sheet.calibrationSaved)}>
                      <Save className="mr-2 h-4 w-4" />
                      {copy.sheet.saveCalibration}
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
                          {tab === "oficial" ? copy.sheet.officialWorkout : copy.sheet.weeklyPlan}
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
                            toast.error(copy.sheet.catalogRequired);
                            return;
                          }
                          const source = selectedDetail.workout?.source === "guto_generated" ? "mixed" : workoutEditor.source || "coach_manual";
                          const result = await updateAdminStudentWorkout(selected.userId, { ...workoutEditor, source, blocks: [{ name: copy.workout.mainBlock, exercises: workoutEditor.exercises }] }, "Coach/admin manual edit");
                          setWorkoutEditor(normalizeWorkoutForEditor(result.workout, selected, copy));
                        }, copy.sheet.workoutSaved)}
                        onCreateManual={() => setWorkoutEditor(blankWorkout(selected, copy))}
                        onGenerate={() => void act(async () => {
                          const result = await generateAdminStudentWorkout(selected.userId);
                          setWorkoutEditor(normalizeWorkoutForEditor(result.workout, selected, copy));
                        }, copy.sheet.workoutGenerated)}
                        onLock={() => void act(async () => {
                          const result = workoutEditor.lockedByCoach ? await unlockAdminStudentWorkout(selected.userId) : await lockAdminStudentWorkout(selected.userId);
                          setWorkoutEditor(normalizeWorkoutForEditor(result.workout, selected, copy));
                        }, workoutEditor.lockedByCoach ? copy.sheet.gutoCanUpdateWorkout : copy.sheet.workoutLocked)}
                        onReset={() => {
                          if (!window.confirm(copy.sheet.resetWorkoutConfirm)) return;
                          void act(async () => {
                            await resetAdminStudentWorkout(selected.userId);
                            setWorkoutEditor(blankWorkout(selected, copy));
                          }, copy.sheet.workoutReset);
                        }}
                        copy={copy}
                        language={adminLanguage}
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
                        copy={copy}
                        language={adminLanguage}
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
                          {tab === "oficial" ? copy.sheet.officialDiet : copy.sheet.weeklyDiet}
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
                          setDietEditor(normalizeDietForEditor(result.diet, selected, copy));
                        }, copy.sheet.dietSaved)}
                        onCreateManual={() => setDietEditor(blankDiet(selected, copy))}
                        onGenerate={() => void act(async () => {
                          const result = await generateAdminStudentDiet(selected.userId);
                          setDietEditor(normalizeDietForEditor(result.diet, selected, copy));
                        }, copy.sheet.dietGenerated)}
                        onLock={() => void act(async () => {
                          const result = dietEditor.lockedByCoach ? await unlockAdminStudentDiet(selected.userId) : await lockAdminStudentDiet(selected.userId);
                          setDietEditor(normalizeDietForEditor(result.diet, selected, copy));
                        }, dietEditor.lockedByCoach ? copy.sheet.gutoCanUpdateDiet : copy.sheet.dietLocked)}
                        onReset={() => {
                          if (!window.confirm(copy.sheet.resetDietConfirm)) return;
                          void act(async () => {
                            await resetAdminStudentDiet(selected.userId);
                            setDietEditor(blankDiet(selected, copy));
                          }, copy.sheet.dietReset);
                        }}
                        copy={copy}
                        language={adminLanguage}
                      />
                    )}

                    {dietaSubTab === "semanal" && (
                      <WeeklyDietEditor
                        weeklyPlan={weeklyDietPlan}
                        acting={acting}
                        onSave={async (days) => {
                          const result = await saveStudentWeeklyDiet(selected.userId, days);
                          setWeeklyDietPlan(result.weeklyDiet);
                        }}
                        copy={copy}
                        language={adminLanguage}
                      />
                    )}
                  </div>
                )}

                {isAdmin && detailTab === "arena" && (
                  <Panel title={copy.sheet.arenaXp}>
                    <div className="grid gap-2 md:grid-cols-2">
                      {[
                        [copy.sheet.resetWeek, "weekly"],
                        [copy.sheet.resetMonth, "monthly"],
                        [copy.sheet.resetXp, "individual"],
                        [copy.sheet.resetHistory, "validationHistory"],
                      ].map(([label, scope]) => (
                        <ActionButton key={scope} disabled={acting} onClick={() => {
                          if (!window.confirm(`${label}?`)) return;
                          void act(async () => {
                            const result = await resetAdminStudent(selected.userId, scope as ResetScope);
                            setSelectedDetail((current) => current ? { ...current, student: result.student } : current);
                          }, copy.sheet.resetDone);
                        }}>
                          {label}
                        </ActionButton>
                      ))}
                    </div>
                  </Panel>
                )}

                {isAdmin && detailTab === "seguranca" && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Panel title={copy.sheet.tempPassword}>
                      <div className="grid gap-3">
                        <ActionButton disabled={acting} onClick={() => void act(async () => {
                          const result = await resetAdminStudentPassword(selected.userId);
                          setLastSecret(result.temporaryPassword || null);
                        }, copy.sheet.tempPasswordGenerated)}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          {copy.sheet.generateTempPassword}
                        </ActionButton>
                        {lastSecret && (
                          <div className="rounded-lg border border-[#00e5ff]/30 bg-[#00e5ff]/10 p-4">
                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#00e5ff]">{copy.sheet.tempPassword}</p>
                            <p className="font-mono text-lg font-black text-white">{lastSecret}</p>
                          </div>
                        )}
                      </div>
                    </Panel>
                    {isSuperAdmin && (
                      <Panel title={copy.sheet.criticalZone}>
                        <div className="grid gap-3">
                          <ActionButton danger disabled={acting} onClick={() => {
                            if (!window.confirm(copy.sheet.permanentDeleteConfirm)) return;
                            void act(async () => {
                              await deleteAdminStudent(selected.userId);
                              setSelectedDetail(null);
                              setStudents((current) => current.filter((student) => student.userId !== selected.userId));
                            }, copy.sheet.permanentDeleted);
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {copy.sheet.permanentDelete}
                          </ActionButton>
                          <p className="text-xs font-bold leading-relaxed text-white/35">{copy.sheet.permanentDeleteHelp}</p>
                        </div>
                      </Panel>
                    )}
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
        copy={copy}
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
          if (result.temporaryPassword) setLastSecret(result.temporaryPassword);
          else if (result.inviteLink) setLastSecret(result.inviteLink);
          setStudentDraft({ firstName: "", lastName: "", email: "", phone: "", password: "", active: false, coachId: "", teamId: "", sex: "", age: "" });
          setShowCreateStudent(false);
        }, copy.actions.studentCreated)}
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
        copy={copy}
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
        }, copy.actions.coachCreated)}
      />

      <CreateTeamDialog
        open={showCreateTeam}
        onOpenChange={setShowCreateTeam}
        draft={teamDraft}
        acting={acting}
        onDraftChange={setTeamDraft}
        copy={copy}
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
        }, copy.actions.teamCreated)}
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
  copy,
}: {
  items: DashboardNavItem[];
  activeTab: DashboardTab;
  onSelect: (tab: DashboardTab) => void;
  role: string;
  userId: string;
  teamName?: string;
  studentCount: number;
  copy: AdminPanelCopy;
}) {
  return (
    <aside className="hidden h-screen w-[232px] shrink-0 flex-col overflow-hidden border-r border-[#52e7ff]/10 bg-[#040710]/95 lg:flex">
      <div className="h-[72px] shrink-0 border-b border-[#52e7ff]/10 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(82,231,255,0.08)_0%,rgba(82,231,255,0)_70%)] px-4 py-3">
        <div className="text-[18px] font-black leading-none tracking-[0.34em] text-[#52e7ff] drop-shadow-[0_0_8px_rgba(82,231,255,0.45)]">GUTO</div>
        <div className="mt-2 text-[8px] font-black uppercase tracking-[0.30em] text-[#52e7ff]/85">{copy.controlRoom}</div>
      </div>

      <div className="shrink-0 border-b border-[#52e7ff]/10 px-4 py-3">
        <div className="mb-2 text-[8px] font-black uppercase tracking-[0.30em] text-white/20">{copy.hierarchy}</div>
        <div className="space-y-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/32">
          <div className="text-[#52e7ff]">{role.replace("_", " ")}</div>
          <div>{teamName || copy.teamNotSelected}</div>
          <div className="text-white/22">{studentCount} {copy.activeStudents}</div>
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
                  : "border-transparent text-white/35 hover:bg-white/3 hover:text-white/70"
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
  language,
  copy,
  onLanguageChange,
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
  language: AdminPanelLanguage;
  copy: AdminPanelCopy;
  onLanguageChange: (language: AdminPanelLanguage) => void;
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
          <AdminLanguageSelector language={language} onChange={onLanguageChange} />
          <TelemetryStamp icon={<Signal className="h-3 w-3" />} label={copy.telemetry.sys} value={telemetry.sys} tone="ok" />
          <div className="hidden 2xl:block">
            <TelemetryStamp icon={<Users className="h-3 w-3" />} label={copy.telemetry.students} value={telemetry.students} />
          </div>
          <div className="hidden 2xl:block">
            <TelemetryStamp icon={<Zap className="h-3 w-3" />} label={copy.telemetry.active} value={telemetry.active} />
          </div>
          <div className="hidden 2xl:block">
            <TelemetryStamp icon={<Search className="h-3 w-3" />} label={copy.telemetry.filters} value={telemetry.filters} />
          </div>

          {(isSuperAdmin || isAdmin) && <div className="mx-1 h-6 w-px shrink-0 bg-[#52e7ff]/10" />}

          {isSuperAdmin && selectedTeam && (
            <div className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#52e7ff]/25 bg-[#52e7ff]/10 px-3">
              <Building2 className="h-3.5 w-3.5 text-[#52e7ff]" />
              <span className="max-w-[180px] truncate text-[10px] font-black text-[#52e7ff]">{selectedTeam.name}</span>
              <button type="button" onClick={onClearTeam} className="text-[#52e7ff]/55 hover:text-[#52e7ff]" aria-label={copy.clearSelectedTeam}>
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {isSuperAdmin && !selectedTeam && (
            <span className="shrink-0 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
              {copy.selectTeam}
            </span>
          )}

          {isSuperAdmin && (
            <Button size="sm" variant="outline" className="h-9 shrink-0 rounded-full border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-white hover:bg-white/10" onClick={onCreateTeam}>
              <Building2 className="mr-2 h-3.5 w-3.5" />
              {copy.common.team}
            </Button>
          )}

          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 shrink-0 rounded-full border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-white hover:bg-white/10 disabled:opacity-30"
              disabled={coachLimitReached || needsTeam}
              title={needsTeam ? copy.selectTeam : undefined}
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
            title={needsTeam ? copy.selectTeam : undefined}
            onClick={onCreateStudent}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            {copy.common.student}
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

function AdminLanguageSelector({ language, onChange }: { language: AdminPanelLanguage; onChange: (language: AdminPanelLanguage) => void }) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-1 rounded-lg border border-[#52e7ff]/10 bg-black/30 px-1.5">
      <Globe2 className="h-3.5 w-3.5 text-[#52e7ff]" />
      {ADMIN_PANEL_LANGUAGES.map((item) => (
        <button
          key={item.code}
          type="button"
          title={item.label}
          onClick={() => onChange(item.code)}
          className={`rounded-md px-2 py-1 text-[9px] font-black tracking-[0.12em] transition ${
            language === item.code ? "bg-[#52e7ff] text-[#04131e]" : "text-white/35 hover:bg-white/5 hover:text-white"
          }`}
        >
          {item.short}
        </button>
      ))}
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
  copy,
  onOpen,
  onCopyInvite,
}: {
  students: AdminStudent[];
  coaches: AdminCoach[];
  copy: AdminPanelCopy;
  onOpen: (student: AdminStudent) => void;
  onCopyInvite: (student: AdminStudent) => void;
}) {
  if (!students.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 p-12 text-center text-sm text-white/35">
        {copy.table.empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[14px] border border-[#52e7ff]/10 bg-[#0f162a]/80 shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur">
      <Table className="min-w-[1120px]">
        <TableHeader>
          <TableRow className="border-[#52e7ff]/10 hover:bg-transparent">
            <TableHead className="h-10 pl-4 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">{copy.table.student}</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">{copy.table.status}</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">{copy.table.coach}</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">{copy.table.phone}</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">{copy.table.week}</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">{copy.table.month}</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">{copy.table.lastAccess}</TableHead>
            <TableHead className="h-10 text-[9px] font-black uppercase tracking-[0.24em] text-white/28">{copy.table.subscription}</TableHead>
            <TableHead className="h-10 text-right text-[9px] font-black uppercase tracking-[0.24em] text-white/28">{copy.table.invite}</TableHead>
            <TableHead className="h-10 pr-4 text-right text-[9px] font-black uppercase tracking-[0.24em] text-white/28">{copy.table.open}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const status = getStatusInfo(student, copy);
            return (
              <TableRow key={student.userId} className="border-[#52e7ff]/8 hover:bg-[#52e7ff]/4.5">
                <TableCell className="max-w-[280px] pl-4">
                  <button type="button" onClick={() => onOpen(student)} className="block min-w-0 text-left">
                    <span className="block truncate text-sm font-black text-white">{student.name}</span>
                    <span className="block truncate font-mono text-[10px] text-white/30">{student.email || student.userId}</span>
                  </button>
                </TableCell>
                <TableCell><Badge variant={status.variant} className="text-[9px] font-black uppercase">{status.text}</Badge></TableCell>
                <TableCell className="max-w-[160px] truncate text-xs font-bold text-white/65">{coachLabel(student, coaches)}</TableCell>
                <TableCell className="font-mono text-xs text-white/55">{student.phone || copy.common.none}</TableCell>
                <TableCell className="font-mono text-xs font-black text-[#00e5ff]">{student.weeklyXp} XP</TableCell>
                <TableCell className="font-mono text-xs text-white/65">{student.monthlyXp} XP</TableCell>
                <TableCell className="font-mono text-xs text-white/55">{relativeTime(student.lastActiveAt, copy)}</TableCell>
                <TableCell className="max-w-[140px] truncate text-xs text-white/65">{formatHuman(student.subscriptionStatus, copy)}</TableCell>
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
  copy,
  onOpen,
  onCopyInvite,
}: {
  students: AdminStudent[];
  coaches: AdminCoach[];
  copy: AdminPanelCopy;
  onOpen: (student: AdminStudent) => void;
  onCopyInvite: (student: AdminStudent) => void;
}) {
  if (!students.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 p-10 text-center text-sm text-white/35">
        {copy.table.empty}
      </div>
    );
  }

  return (
    <>
      {students.map((student) => {
        const status = getStatusInfo(student, copy);
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
              <Metric label={copy.table.coach} value={coachLabel(student, coaches)} />
              <Metric label={copy.table.phone} value={student.phone || copy.common.none} />
              <Metric label={copy.table.week} value={`${student.weeklyXp} XP`} cyan />
              <Metric label={copy.table.month} value={`${student.monthlyXp} XP`} />
              <Metric label={copy.table.seen} value={relativeTime(student.lastActiveAt, copy)} />
              <Metric label={copy.common.plan} value={formatHuman(student.subscriptionStatus, copy)} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" className="border-white/10 bg-white/5 text-white/65" onClick={() => onCopyInvite(student)}>
                <Copy className="mr-2 h-4 w-4" />
                {copy.common.invite}
              </Button>
              <Button className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white" onClick={() => onOpen(student)}>
                {copy.common.open}
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
    <div className="flex items-center justify-between gap-4 border-b border-white/4 py-2.5 last:border-0">
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

const WEEK_DAY_KEYS: WeekDayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function WeeklyWorkoutEditor({
  student,
  weeklyPlan,
  exerciseCatalog,
  acting,
  onSave,
  copy,
  language,
}: {
  student: AdminStudent;
  weeklyPlan: AdminWeeklyWorkoutPlan | null;
  exerciseCatalog: AdminCatalogExercise[];
  acting: boolean;
  onSave: (days: AdminWeeklyWorkoutDays) => Promise<void>;
  copy: AdminPanelCopy;
  language: AdminPanelLanguage;
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
      title: copy.workout.dayWorkout,
      focus: copy.workout.dayWorkout,
      dateLabel: copy.workout.todayLabel,
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
	    return { ...plan, exercises: orderedExercises, blocks: [{ name: copy.workout.mainBlock, exercises: orderedExercises }] };
	  }

  function addExerciseToDayFromCatalog(day: WeekDayKey, catalog: AdminCatalogExercise) {
    const current = days[day] ?? blankDayPlan();
    const index = current.exercises.length;
    const exercise = workoutExerciseFromCatalog(catalog, blankExercise(index), index, language);
    setDayPlan(day, { ...current, exercises: [...current.exercises, exercise], blocks: [{ name: copy.workout.mainBlock, exercises: [...current.exercises, exercise] }] });
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
      toast.success(copy.workout.weeklySaved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.workout.weeklySaveError);
    } finally {
      setSaving(false);
    }
  }

  const searchFor = (day: WeekDayKey) => normalizeCatalogSearch(daySearch[day] ?? "");

  return (
    <Panel title={copy.workout.weeklyTitle}>
      <p className="mb-4 text-[11px] text-white/40">{copy.workout.weeklyHelp}</p>

      <div className="space-y-2">
        {WEEK_DAY_KEYS.map((key) => {
          const [label, short] = copy.days[key];
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
                    <span className="text-xs text-white/25">{copy.workout.restDay}</span>
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
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">{copy.workout.focus}</span>
                          <Input
                            value={plan.focus || ""}
                            onChange={(e) => setDayPlan(key, { ...plan, focus: e.target.value, title: e.target.value })}
                            placeholder={copy.workout.focusPlaceholder}
                            className="h-9 border-white/10 bg-white/5 text-sm text-white"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">{copy.workout.coachNotes}</span>
                          <Input
                            value={plan.coachNotes || ""}
                            onChange={(e) => setDayPlan(key, { ...plan, coachNotes: e.target.value })}
                            placeholder={copy.workout.notesPlaceholder}
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
	                                  <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-widest text-white/30">{ex.muscleGroup || copy.workout.catalog} · {ex.id}</p>
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
	                                <Field label={copy.workout.sets} value={String(ex.sets || "")} onChange={(sets) => updateExerciseInDay(key, i, { sets: Number(sets) || 0 })} />
	                                <Field label={copy.workout.reps} value={String(ex.reps || "")} onChange={(reps) => updateExerciseInDay(key, i, { reps })} />
	                                <Field label={copy.workout.load} value={String(ex.load || "")} onChange={(load) => updateExerciseInDay(key, i, { load })} />
	                                <Field label={copy.workout.rest} value={ex.rest || ""} onChange={(rest) => updateExerciseInDay(key, i, { rest })} />
	                                <Field label={copy.workout.technique} value={ex.cue || ""} onChange={(cue) => updateExerciseInDay(key, i, { cue })} className="md:col-span-2" />
	                                <Field label={copy.workout.movementNote} value={ex.note || ""} onChange={(note) => updateExerciseInDay(key, i, { note })} className="md:col-span-2" />
	                                <Field label={copy.workout.substitutions} value={(ex.alternatives || []).join(", ")} onChange={(alternatives) => updateExerciseInDay(key, i, { alternatives: alternatives.split(",").map((item) => item.trim()).filter(Boolean) })} className="md:col-span-4" />
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
                      placeholder={copy.workout.searchCatalog}
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
	                            <span className="min-w-0 flex-1 truncate font-medium text-white">{catalog.namesByLanguage?.[language] || catalog.canonicalNamePt}</span>
	                            <span className="shrink-0 text-white/35">{catalog.muscleGroup}</span>
	                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!plan && (
	                      <Button size="sm" variant="outline" className="border-[#00e5ff]/30 bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20" onClick={() => setDayPlan(key, blankDayPlan())}>
	                        <Plus className="mr-1 h-3.5 w-3.5" /> {copy.workout.addWorkout}
	                      </Button>
	                    )}
	                    {plan && (
	                      <Button size="sm" variant="outline" className="border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white" onClick={() => setDayPlan(key, undefined)}>
	                        <Trash2 className="mr-1 h-3.5 w-3.5" /> {copy.workout.removeDay}
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
          {saving ? copy.common.saving : copy.workout.saveWeekly}
        </Button>
        {weeklyPlan?.updatedAt && (
          <p className="mt-2 text-[10px] text-white/30">
            {copy.common.updatedAt}: {new Date(weeklyPlan.updatedAt).toLocaleString(language)}
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
  copy,
  language,
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
  copy: AdminPanelCopy;
  language: AdminPanelLanguage;
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
        i === index ? workoutExerciseFromCatalog(catalogExercise, exercise, index, language) : exercise
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
    const validationError = validateCustomExerciseDraft(customExerciseDraft, copy);
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
      toast.success(copy.workout.approvalSent);
      setCustomExerciseDraft(blankCustomExerciseDraft());
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message || copy.errors.videoLimit : adminErrorMessage(error, copy));
    } finally {
      setCreatingCustomExercise(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Panel title={copy.workout.weeklyTitle === copy.sheet.weeklyPlan ? copy.sheet.officialWorkout : copy.sheet.officialWorkout}>
        <PlanStatus source={value.source} locked={value.lockedByCoach} copy={copy} />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label={copy.workout.title} value={value.title || ""} onChange={(title) => onChange({ ...value, title, focus: title || value.focus })} />
          <Field label={copy.workout.muscleFocus} value={value.focus || ""} onChange={(focus) => onChange({ ...value, focus })} />
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">{copy.workout.day}</span>
            <select value={value.weekDay || "today"} onChange={(e) => onChange({ ...value, weekDay: e.target.value })} className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
              {WEEK_DAY_KEYS.map((day) => <option key={day} value={copy.days[day][0]} className="bg-[#0d1426]">{copy.days[day][0]}</option>)}
              <option value="today" className="bg-[#0d1426]">{copy.workout.todayLabel} ({copy.days.today[new Date().getDay()]})</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">{copy.workout.location}</span>
            <select value={value.location || ""} onChange={(e) => onChange({ ...value, location: e.target.value })} className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
              <option value="" className="bg-[#0d1426]">{copy.workout.select}</option>
              {["gym", "home", "park", "mixed"].map((code) => <option key={code} value={code} className="bg-[#0d1426]">{formatHuman(code, copy)}</option>)}
            </select>
          </label>
          <Field label={copy.workout.duration} value={String(value.estimatedDurationMinutes || "")} onChange={(estimatedDurationMinutes) => onChange({ ...value, estimatedDurationMinutes: Number(estimatedDurationMinutes) || undefined })} />
          <Field label={copy.workout.difficulty} value={value.difficulty || ""} onChange={(difficulty) => onChange({ ...value, difficulty })} />
          <Field label={copy.workout.coachNotes} value={value.coachNotes || ""} onChange={(coachNotes) => onChange({ ...value, coachNotes, summary: coachNotes || value.summary })} className="md:col-span-2" />
        </div>

	        <div className="mt-4 flex flex-wrap gap-2">
	          <Button className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white" disabled={acting} onClick={onSave}><Save className="mr-2 h-4 w-4" />{copy.workout.saveChanges}</Button>
	          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onCreateManual}><Dumbbell className="mr-2 h-4 w-4" />{copy.workout.createManual}</Button>
	          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onGenerate}><RefreshCw className="mr-2 h-4 w-4" />{copy.workout.generateGuto}</Button>
	          <Button variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => setShowHistory((current) => !current)}><History className="mr-2 h-4 w-4" />{copy.workout.history}</Button>
	          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onLock}>{value.lockedByCoach ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}{value.lockedByCoach ? copy.workout.allowGuto : copy.workout.lockGuto}</Button>
	          <Button variant="outline" className="border-red-500/30 bg-transparent text-red-300" disabled={acting} onClick={onReset}><Trash2 className="mr-2 h-4 w-4" />{copy.workout.reset}</Button>
	        </div>
      </Panel>

      <Panel title={copy.workout.addNewExercise}>
        <div className="mb-4 rounded-md border border-[#00e5ff]/25 bg-[#00e5ff]/10 px-3 py-2">
          <p className="text-xs font-bold text-[#baf7ff]">{copy.workout.videoLimitCopy}</p>
          <p className="mt-1 text-[11px] text-white/40">{copy.workout.videoNoUpload}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label={copy.workout.officialName} value={customExerciseDraft.canonicalNamePt} onChange={(canonicalNamePt) => updateCustomExerciseDraft({ canonicalNamePt })} className="md:col-span-2" />
          <Field label={copy.workout.optionalId} value={customExerciseDraft.id} onChange={(id) => updateCustomExerciseDraft({ id })} />
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">{copy.workout.group}</span>
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
          <Field label={copy.workout.equipment} value={customExerciseDraft.equipment} onChange={(equipment) => updateCustomExerciseDraft({ equipment })} />
          <Field label={copy.workout.safeMp4} value={customExerciseDraft.sourceFileName} onChange={(sourceFileName) => updateCustomExerciseDraft({ sourceFileName })} />
          <Field label={copy.workout.internalPath} value={customExerciseDraft.videoUrl} onChange={(videoUrl) => updateCustomExerciseDraft({ videoUrl })} className="md:col-span-2" />
          <Field label="Bytes" value={customExerciseDraft.fileSizeBytes} onChange={(fileSizeBytes) => updateCustomExerciseDraft({ fileSizeBytes })} />
          <Field label={copy.workout.durationSeconds} value={customExerciseDraft.durationSeconds} onChange={(durationSeconds) => updateCustomExerciseDraft({ durationSeconds })} />
          <Field label="Width" value={customExerciseDraft.width} onChange={(width) => updateCustomExerciseDraft({ width })} />
          <Field label="Height" value={customExerciseDraft.height} onChange={(height) => updateCustomExerciseDraft({ height })} />
          <Field label="FPS" value={customExerciseDraft.fps} onChange={(fps) => updateCustomExerciseDraft({ fps })} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-white/55">
          <input type="checkbox" checked={customExerciseDraft.hasAudio} onChange={(event) => updateCustomExerciseDraft({ hasAudio: event.target.checked })} />
          {copy.workout.hasAudio}
        </label>
        <Button className="mt-4 bg-[#00e5ff] text-[#0a0f1e] hover:bg-white" disabled={acting || creatingCustomExercise} onClick={() => void submitCustomExercise()}>
          <FileVideo className="mr-2 h-4 w-4" />
          {copy.workout.sendApproval}
        </Button>
      </Panel>

      <Panel title={copyText(copy.workout.studentExercises, { name: student.name })}>
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
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">{copy.workout.officialExercise}</span>
                  <Input
                    value={searchTerm}
                    onChange={(event) => setExerciseSearch((current) => ({ ...current, [index]: event.target.value }))}
                    placeholder={selectedCatalogExercise ? selectedCatalogExercise.namesByLanguage?.[language] || selectedCatalogExercise.canonicalNamePt : copy.workout.searchOfficial}
                    className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                  />
                </label>
                <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-white/30">{copy.workout.catalog}</span>
                  <span className={selectedCatalogExercise ? "text-xs font-black text-[#00e5ff]" : "text-xs font-black text-red-300"}>
                    {selectedCatalogExercise ? selectedCatalogExercise.id : copy.workout.notChosen}
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
	                      className="min-w-0 rounded-md border border-white/10 bg-white/4 px-3 py-2 text-left hover:border-[#00e5ff]/45"
	                    >
	                      <span className="block truncate text-xs font-black text-white">{item.namesByLanguage?.[language] || item.canonicalNamePt}</span>
	                      <span className="block truncate font-mono text-[9px] uppercase tracking-widest text-white/35">{item.muscleGroup} · {item.id}</span>
	                    </button>
	                  ))}
                </div>
              )}
              {normalizedSearch && matches.length === 0 && (
                <p className="mb-3 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {copy.workout.notFound}
                </p>
              )}
              {needsCatalogSelection && !normalizedSearch && (
                <p className="mb-3 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {copy.workout.chooseBeforeSave}
                </p>
              )}
              {selectedCatalogExercise && (
                <div className="mb-3 grid gap-2 md:grid-cols-[7rem_1fr]">
	                  <div className="h-[96px] overflow-hidden rounded-md border border-[#00e5ff]/30 bg-black/20">
	                    <video src={selectedCatalogExercise.videoUrl} muted loop playsInline controls preload="metadata" className="h-full w-full object-contain" />
	                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2">
                    <p className="text-sm font-black text-white">{selectedCatalogExercise.namesByLanguage?.[language] || selectedCatalogExercise.canonicalNamePt}</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-white/35">
                      {selectedCatalogExercise.muscleGroup} · {selectedCatalogExercise.equipment || copy.workout.noEquipment}
                    </p>
                    <p className="mt-1 break-all font-mono text-[9px] text-white/25">{selectedCatalogExercise.videoUrl}</p>
                  </div>
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-4">
                <Field label={copy.workout.sets} value={String(exercise.sets)} onChange={(sets) => updateExercise(index, { sets: Number(sets) || 0 })} />
                <Field label={copy.workout.reps} value={String(exercise.reps)} onChange={(reps) => updateExercise(index, { reps })} />
                <Field label={copy.workout.load} value={String(exercise.load || "")} onChange={(load) => updateExercise(index, { load })} />
                <Field label={copy.workout.interval} value={exercise.rest} onChange={(rest) => updateExercise(index, { rest })} />
                <Field label={copy.workout.technique} value={exercise.cue || ""} onChange={(cue) => updateExercise(index, { cue })} className="md:col-span-2" />
	                <Field label={copy.workout.movementNote} value={exercise.note || ""} onChange={(note) => updateExercise(index, { note })} className="md:col-span-2" />
                <Field label={copy.workout.substitutions} value={(exercise.alternatives || []).join(", ")} onChange={(alternatives) => updateExercise(index, { alternatives: alternatives.split(",").map((item) => item.trim()).filter(Boolean) })} className="md:col-span-4" />
              </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-4 border-white/10 bg-white/5 text-white" onClick={() => onChange({ ...value, exercises: [...value.exercises, blankExercise(value.exercises.length)] })}>
          <Plus className="mr-2 h-4 w-4" />
          {copy.workout.addExercise}
        </Button>
      </Panel>

	      {showHistory && (
	        <Panel title={copy.workout.workoutHistory}>
	          <LogList logs={history} empty={copy.workout.noWorkoutHistory} copy={copy} language={language} />
	        </Panel>
	      )}
	    </div>
	  );
	}

// ─── Weekly Diet Editor ────────────────────────────────────────────────────────

function dietDaySummary(day: AdminWeeklyDietDay | undefined, copy: AdminPanelCopy): string {
  if (!day) return copy.diet.noDiet;
  const meals = [day.breakfast && copy.diet.breakfast, day.lunch && copy.diet.lunch, day.dinner && copy.diet.dinner, day.snacks && copy.diet.snacks].filter(Boolean);
  const parts: string[] = [];
  if (meals.length) parts.push(meals.join(", "));
  if (day.caloriesEstimate) parts.push(`${day.caloriesEstimate} kcal`);
  if (day.notes) parts.push(copy.diet.notes);
  return parts.length ? parts.join(" · ") : copy.diet.filled;
}

function blankDietDay(): AdminWeeklyDietDay {
  return { breakfast: "", lunch: "", dinner: "", snacks: "", hydration: "", notes: "" };
}

function WeeklyDietEditor({
  weeklyPlan,
  acting,
  onSave,
  copy,
  language,
}: {
  weeklyPlan: AdminWeeklyDietPlan | null;
  acting: boolean;
  onSave: (days: AdminWeeklyDietDays) => Promise<void>;
  copy: AdminPanelCopy;
  language: AdminPanelLanguage;
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
      toast.success(copy.diet.weeklySaved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.diet.weeklySaveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title={copy.diet.weeklyTitle}>
      <p className="mb-4 text-[11px] text-white/40">{copy.diet.weeklyHelp}</p>
      <div className="space-y-2">
        {WEEK_DAY_KEYS.map((key) => {
          const [label] = copy.days[key];
          const dayData = days[key];
          const isExpanded = expandedDay === key;
          const summary = dietDaySummary(dayData, copy);

          return (
            <div key={key} className="rounded-lg border border-white/10 bg-white/5">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                onClick={() => setExpandedDay(isExpanded ? null : key)}
              >
                <div>
                  <span className="text-sm font-bold text-white">{label}</span>
                  {dayData && <span className="ml-2 text-[11px] text-[#00e5ff]">{copy.diet.filled}</span>}
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
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">{copy.diet.breakfast}</label>
                      <textarea
                        value={dayData?.breakfast ?? ""}
                        onChange={(e) => setDayField(key, "breakfast", e.target.value)}
                        rows={2}
                        placeholder={copy.diet.breakfastPlaceholder}
                        className="w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">{copy.diet.lunch}</label>
                      <textarea
                        value={dayData?.lunch ?? ""}
                        onChange={(e) => setDayField(key, "lunch", e.target.value)}
                        rows={2}
                        placeholder={copy.diet.lunchPlaceholder}
                        className="w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">{copy.diet.dinner}</label>
                      <textarea
                        value={dayData?.dinner ?? ""}
                        onChange={(e) => setDayField(key, "dinner", e.target.value)}
                        rows={2}
                        placeholder={copy.diet.dinnerPlaceholder}
                        className="w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">{copy.diet.snacks}</label>
                      <textarea
                        value={dayData?.snacks ?? ""}
                        onChange={(e) => setDayField(key, "snacks", e.target.value)}
                        rows={2}
                        placeholder={copy.diet.snacksPlaceholder}
                        className="w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">{copy.diet.hydration}</label>
                      <input
                        type="text"
                        value={dayData?.hydration ?? ""}
                        onChange={(e) => setDayField(key, "hydration", e.target.value)}
                        placeholder={copy.diet.hydrationPlaceholder}
                        className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">{copy.diet.notes}</label>
                      <textarea
                        value={dayData?.notes ?? ""}
                        onChange={(e) => setDayField(key, "notes", e.target.value)}
                        rows={2}
                        placeholder={copy.diet.notesPlaceholder}
                        className="w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">{copy.diet.caloriesEstimate}</label>
                      <input
                        type="number"
                        value={dayData?.caloriesEstimate ?? ""}
                        onChange={(e) => setDayField(key, "caloriesEstimate", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder={copy.diet.caloriesPlaceholder}
                        min={0}
                        className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00e5ff]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-white/40">{copy.diet.proteinEstimate}</label>
                      <input
                        type="number"
                        value={dayData?.proteinEstimate ?? ""}
                        onChange={(e) => setDayField(key, "proteinEstimate", e.target.value ? Number(e.target.value) : undefined)}
                        placeholder={copy.diet.proteinPlaceholder}
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
                      {copy.diet.clearDay}
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
          {copy.diet.saveWeekly}
        </Button>
      </div>
      {weeklyPlan && (
        <p className="mt-2 text-[10px] text-white/30">
          {copy.common.updatedAt}: {new Date(weeklyPlan.updatedAt).toLocaleString(language)} {copy.common.by} {weeklyPlan.updatedBy}
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
  copy,
  language,
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
  copy: AdminPanelCopy;
  language: AdminPanelLanguage;
	}) {
	  const [showHistory, setShowHistory] = useState(false);
	  const targetKcal = Math.round(Number(value.macros.targetKcal) || 0);
	  const foodTotalKcal = dietFoodKcalTotal(value);
	  const calorieDelta = targetKcal - foodTotalKcal;
	  const calorieMismatch = targetKcal > 0 && calorieDelta !== 0;

	  const updateMeal = (index: number, patch: Partial<DietPlan["meals"][number]>) => {
	    onChange({ ...value, meals: value.meals.map((meal, i) => i === index ? syncMealKcal({ ...meal, ...patch }) : meal) });
	  };
	  const updateFood = (mealIndex: number, foodIndex: number, patch: Partial<DietPlan["meals"][number]["foods"][number]>) => {
	    onChange({
	      ...value,
	      meals: value.meals.map((meal, i) => {
	        if (i !== mealIndex) return meal;
	        const foods = meal.foods.map((food, j) => j === foodIndex ? { ...food, ...patch } : food);
	        return syncMealKcal({ ...meal, foods });
	      }),
	    });
	  };

	  const handleSave = () => {
	    if (calorieMismatch) {
	      toast.error(copyText(copy.diet.mismatchToast, { target: targetKcal, delta: Math.abs(calorieDelta) }));
	      return;
	    }
	    onSave();
	  };

  return (
    <div className="grid gap-4">
      <Panel title={copy.diet.officialDiet}>
        <PlanStatus source={value.source} locked={value.lockedByCoach} copy={copy} />
	        <div className="mt-4 grid gap-3 md:grid-cols-3">
	          <Field label={copy.diet.title} value={value.title || ""} onChange={(title) => onChange({ ...value, title })} className="md:col-span-2" />
	          <Field label={copy.diet.country} value={value.country || ""} onChange={(country) => onChange({ ...value, country })} />
	          <Field label={copy.diet.calories} value={String(value.macros.targetKcal)} onChange={(targetKcal) => onChange({ ...value, macros: { ...value.macros, targetKcal: Number(targetKcal) || 0 } })} />
          <Field label={copy.diet.protein} value={String(value.macros.proteinG)} onChange={(proteinG) => onChange({ ...value, macros: { ...value.macros, proteinG: Number(proteinG) || 0 } })} />
          <Field label={copy.diet.carbs} value={String(value.macros.carbsG)} onChange={(carbsG) => onChange({ ...value, macros: { ...value.macros, carbsG: Number(carbsG) || 0 } })} />
          <Field label={copy.diet.fat} value={String(value.macros.fatG)} onChange={(fatG) => onChange({ ...value, macros: { ...value.macros, fatG: Number(fatG) || 0 } })} />
          <Field label={copy.diet.restrictions} value={value.foodRestrictions || ""} onChange={(foodRestrictions) => onChange({ ...value, foodRestrictions })} />
	          <Field label={copy.diet.coachNotes} value={value.coachNotes || ""} onChange={(coachNotes) => onChange({ ...value, coachNotes })} />
	        </div>
	        <div className="mt-4 grid gap-3 md:grid-cols-4">
	          <div className="rounded-lg border border-white/8 bg-black/15 p-3">
	            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{copy.diet.bmr}</p>
	            <p className="mt-1 font-mono text-xl font-black text-white">{Math.round(Number(value.macros.bmr) || 0)} kcal</p>
	          </div>
	          <div className="rounded-lg border border-white/8 bg-black/15 p-3">
	            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{copy.diet.tdee}</p>
	            <p className="mt-1 font-mono text-xl font-black text-white">{Math.round(Number(value.macros.tdee) || 0)} kcal</p>
	          </div>
	          <div className="rounded-lg border border-[#00e5ff]/25 bg-[#00e5ff]/10 p-3">
	            <p className="text-[10px] font-black uppercase tracking-widest text-[#91f4ff]">{copy.diet.target}</p>
	            <p className="mt-1 font-mono text-xl font-black text-[#00e5ff]">{targetKcal} kcal</p>
	          </div>
	          <div className={`rounded-lg border p-3 ${calorieMismatch ? "border-red-500/30 bg-red-500/10" : "border-emerald-400/25 bg-emerald-400/10"}`}>
	            <p className={`text-[10px] font-black uppercase tracking-widest ${calorieMismatch ? "text-red-200" : "text-emerald-200"}`}>{copy.diet.foodsTotal}</p>
	            <p className="mt-1 font-mono text-xl font-black text-white">{foodTotalKcal} kcal</p>
	            <p className={`mt-1 text-[10px] font-bold ${calorieMismatch ? "text-red-200" : "text-emerald-200"}`}>
	              {calorieMismatch ? `${calorieDelta > 0 ? copy.diet.missing : copy.diet.exceeded} ${Math.abs(calorieDelta)} kcal` : copy.diet.matched}
	            </p>
	          </div>
	        </div>
	        <div className="mt-4 flex flex-wrap gap-2">
	          <Button className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white disabled:opacity-45" disabled={acting || calorieMismatch} onClick={handleSave}><Save className="mr-2 h-4 w-4" />{copy.diet.saveChanges}</Button>
	          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onCreateManual}><Utensils className="mr-2 h-4 w-4" />{copy.diet.createManual}</Button>
	          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onGenerate}><RefreshCw className="mr-2 h-4 w-4" />{copy.diet.generateGuto}</Button>
	          <Button variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => setShowHistory((current) => !current)}><History className="mr-2 h-4 w-4" />{copy.diet.history}</Button>
	          <Button variant="outline" className="border-white/10 bg-white/5 text-white" disabled={acting} onClick={onLock}>{value.lockedByCoach ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}{value.lockedByCoach ? copy.diet.allowGuto : copy.diet.lockGuto}</Button>
	          <Button variant="outline" className="border-red-500/30 bg-transparent text-red-300" disabled={acting} onClick={onReset}><Trash2 className="mr-2 h-4 w-4" />{copy.diet.reset}</Button>
	        </div>
	        {calorieMismatch && (
	          <p className="mt-3 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200">
	            {copy.diet.mismatchHelp}
	          </p>
	        )}
	      </Panel>

      <Panel title={copyText(copy.diet.mealsOf, { name: student.name })}>
        <div className="grid gap-3">
          {value.meals.map((meal, mealIndex) => (
            <div key={`${meal.id}-${mealIndex}`} className="rounded-lg border border-white/8 bg-black/15 p-3">
              <div className="grid gap-3 md:grid-cols-4">
                <Field label={copy.diet.meal} value={meal.name} onChange={(name) => updateMeal(mealIndex, { name })} className="md:col-span-2" />
                <Field label={copy.diet.time} value={meal.time} onChange={(time) => updateMeal(mealIndex, { time })} />
	                <div className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-2">
	                  <span className="block text-[10px] font-black uppercase tracking-widest text-white/30">{copy.diet.calculatedKcal}</span>
	                  <span className="font-mono text-sm font-black text-[#00e5ff]">{mealFoodKcalTotal(meal)} kcal</span>
	                </div>
	                <Field label={copy.diet.substitutions} value={(meal.alternatives || []).join(", ")} onChange={(alternatives) => updateMeal(mealIndex, { alternatives: alternatives.split(",").map((item) => item.trim()).filter(Boolean) })} className="md:col-span-4" />
	              </div>
	              <div className="mt-3 grid gap-2">
	                {meal.foods.map((food, foodIndex) => (
	                  <div key={`${food.name}-${foodIndex}`} className="grid gap-2 rounded-md bg-white/[0.035] p-2 md:grid-cols-[1fr_1fr_.6fr_1fr_auto]">
	                    <Input value={food.name} onChange={(event) => updateFood(mealIndex, foodIndex, { name: event.target.value })} placeholder={copy.diet.food} className="border-white/10 bg-white/5 text-white" />
	                    <Input value={food.quantity} onChange={(event) => updateFood(mealIndex, foodIndex, { quantity: event.target.value })} placeholder={copy.diet.quantity} className="border-white/10 bg-white/5 text-white" />
	                    <Input value={String(food.kcal || "")} onChange={(event) => updateFood(mealIndex, foodIndex, { kcal: Number(event.target.value) || 0 })} placeholder="kcal" className="border-white/10 bg-white/5 text-white" />
	                    <Input value={food.notes || ""} onChange={(event) => updateFood(mealIndex, foodIndex, { notes: event.target.value })} placeholder={copy.diet.observation} className="border-white/10 bg-white/5 text-white" />
	                    <Button variant="outline" className="border-red-500/30 bg-transparent text-red-300" onClick={() => updateMeal(mealIndex, { foods: meal.foods.filter((_, index) => index !== foodIndex) })}><Trash2 className="h-4 w-4" /></Button>
	                  </div>
	                ))}
              </div>
              <Button variant="outline" className="mt-3 border-white/10 bg-white/5 text-white" onClick={() => updateMeal(mealIndex, { foods: [...meal.foods, { name: "", quantity: "", kcal: 0, notes: "" }] })}>
                <Plus className="mr-2 h-4 w-4" />
                {copy.diet.addFood}
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-4 border-white/10 bg-white/5 text-white" onClick={() => onChange({ ...value, meals: [...value.meals, { id: `meal-${Date.now()}`, name: copy.diet.newMeal, time: "", totalKcal: 0, gutoNote: "", foods: [] }] })}>
          <Plus className="mr-2 h-4 w-4" />
          {copy.diet.addMeal}
        </Button>
      </Panel>

	      {showHistory && (
	        <Panel title={copy.diet.dietHistory}>
	          <LogList logs={history} empty={copy.diet.noDietHistory} copy={copy} language={language} />
	        </Panel>
	      )}
	    </div>
	  );
	}

function PlanStatus({ source, locked, copy }: { source?: string; locked?: boolean; copy: AdminPanelCopy }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className="border-[#00e5ff]/35 text-[#00e5ff]">{sourceLabel(source, copy)}</Badge>
      <Badge variant={locked ? "default" : "secondary"}>{locked ? copy.planStatus.locked : copy.planStatus.unlocked}</Badge>
    </div>
  );
}

function LogList({ logs, empty, copy, language }: { logs: AdminLog[]; empty: string; copy: AdminPanelCopy; language: AdminPanelLanguage }) {
  if (!logs.length) return <p className="text-sm text-white/35">{empty}</p>;
  return (
    <div className="grid gap-2">
      {logs.slice(0, 80).map((log, index) => (
        <div key={log.id || index} className="rounded-lg border border-white/7 bg-black/15 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-white">{log.action || copy.common.action}</span>
            <span className="font-mono text-[10px] text-white/35">{log.timestamp ? new Date(log.timestamp).toLocaleString(language) : copy.common.none}</span>
          </div>
          <p className="mt-1 font-mono text-[10px] text-white/35">{log.actorRole || copy.common.none} · {log.actorUserId || copy.common.none}</p>
        </div>
      ))}
    </div>
  );
}

function RankingSection({ title, items, copy, showStreak }: { title: string; items: RankingItem[]; copy: AdminPanelCopy; showStreak?: boolean }) {
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
        {!items.length && <p className="text-sm text-white/35">{copy.common.noRanking}</p>}
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
  copy,
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
  copy: AdminPanelCopy;
  onCreate: () => void;
}) {
  const validationError = studentDraftError(draft, isSuperAdmin, copy);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10 bg-[#0d1426] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.dialogs.createStudent}</AlertDialogTitle>
          <AlertDialogDescription className="text-white/45">{copy.dialogs.studentDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={copy.dialogs.firstName} value={draft.firstName} onChange={(firstName) => onDraftChange({ ...draft, firstName })} />
            <Field label={copy.dialogs.lastName} value={draft.lastName} onChange={(lastName) => onDraftChange({ ...draft, lastName })} />
          </div>
          <Field label={copy.common.email} value={draft.email} onChange={(email) => onDraftChange({ ...draft, email })} />
          {draft.email && !isValidEmail(draft.email) && <p className="-mt-2 text-[11px] font-bold text-red-300">{copy.dialogs.validEmail}</p>}
          <Field label={copy.common.phone} value={draft.phone} onChange={(phone) => onDraftChange({ ...draft, phone })} />
          {draft.phone && !isValidPhone(draft.phone) && <p className="-mt-2 text-[11px] font-bold text-red-300">{copy.dialogs.validPhone}</p>}
          <div className="grid grid-cols-2 gap-3">
            <select value={draft.sex} onChange={(e) => onDraftChange({ ...draft, sex: e.target.value })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
              <option value="" className="bg-[#0d1426]">{copy.dialogs.sex}</option>
              <option value="male" className="bg-[#0d1426]">{copy.dialogs.male}</option>
              <option value="female" className="bg-[#0d1426]">{copy.dialogs.female}</option>
            </select>
            <Field label={copy.dialogs.age} value={draft.age} onChange={(age) => onDraftChange({ ...draft, age })} />
          </div>
          <Field label={copy.dialogs.optionalPassword} value={draft.password} onChange={(password) => onDraftChange({ ...draft, password })} />
          {isSuperAdmin && (
            draft.teamId && teams.find((t) => t.id === draft.teamId) ? (
              <div className="flex items-center gap-2 rounded-md border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-3 py-2">
                <Building2 className="h-3.5 w-3.5 text-[#00e5ff]" />
                <span className="text-sm font-bold text-[#00e5ff]">{teams.find((t) => t.id === draft.teamId)?.name}</span>
              </div>
            ) : (
              <select value={draft.teamId} onChange={(event) => onDraftChange({ ...draft, teamId: event.target.value })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="" className="bg-[#0d1426]">{copy.dialogs.selectTeam}</option>
                {teams.map((team) => <option key={team.id} value={team.id} className="bg-[#0d1426]">{team.name}</option>)}
              </select>
            )
          )}
          {isAdmin && (
            <select value={draft.coachId} onChange={(event) => onDraftChange({ ...draft, coachId: event.target.value })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
              <option value="" className="bg-[#0d1426]">{copy.dialogs.responsibleCoach}</option>
              {coaches.map((coach) => <option key={coach.userId} value={coach.userId} className="bg-[#0d1426]">{coach.name || coach.userId}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm text-white/60">
            <input type="checkbox" checked={draft.active} onChange={(event) => onDraftChange({ ...draft, active: event.target.checked })} />
            {copy.dialogs.activateNow}
          </label>
          {validationError && <p className="text-xs font-bold text-red-300">{validationError}</p>}
          {limitReached && <p className="text-xs font-bold text-[#00e5ff]">{copyText(copy.mural.limitReached, { target: copy.common.students.toLowerCase() })}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white">{copy.common.cancel}</AlertDialogCancel>
          <Button disabled={acting || limitReached || Boolean(validationError)} onClick={onCreate} className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white">{copy.common.create}</Button>
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
  copy,
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
  copy: AdminPanelCopy;
  onCreate: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10 bg-[#0d1426] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.dialogs.createCoach}</AlertDialogTitle>
          <AlertDialogDescription className="text-white/45">{copy.dialogs.coachDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-3">
          <Field label={copy.dialogs.name} value={draft.name} onChange={(name) => onDraftChange({ ...draft, name })} />
          <Field label={copy.common.email} value={draft.email} onChange={(email) => onDraftChange({ ...draft, email })} />
          <Field label={copy.dialogs.optionalCoachPassword} value={draft.password} onChange={(password) => onDraftChange({ ...draft, password })} />
          {isSuperAdmin && (
            draft.teamId && teams.find((t) => t.id === draft.teamId) ? (
              <div className="flex items-center gap-2 rounded-md border border-[#00e5ff]/30 bg-[#00e5ff]/10 px-3 py-2">
                <Building2 className="h-3.5 w-3.5 text-[#00e5ff]" />
                <span className="text-sm font-bold text-[#00e5ff]">{teams.find((t) => t.id === draft.teamId)?.name}</span>
              </div>
            ) : (
              <select value={draft.teamId} onChange={(event) => onDraftChange({ ...draft, teamId: event.target.value })} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white">
                <option value="" className="bg-[#0d1426]">{copy.dialogs.selectTeam}</option>
                {teams.map((team) => <option key={team.id} value={team.id} className="bg-[#0d1426]">{team.name}</option>)}
              </select>
            )
          )}
          {limitReached && <p className="text-xs font-bold text-[#00e5ff]">{copyText(copy.mural.limitReached, { target: copy.common.coaches.toLowerCase() })}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white">{copy.common.cancel}</AlertDialogCancel>
          <Button disabled={acting || limitReached || !draft.name.trim() || !draft.email.trim() || (isSuperAdmin && !draft.teamId)} onClick={onCreate} className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white">{copy.dialogs.createCoach}</Button>
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
  copy,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: TeamDraft;
  acting: boolean;
  onDraftChange: (draft: TeamDraft) => void;
  copy: AdminPanelCopy;
  onCreate: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10 bg-[#0d1426] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.dialogs.createTeam}</AlertDialogTitle>
          <AlertDialogDescription className="text-white/45">{copy.dialogs.teamDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-3">
          <Field label={copy.dialogs.teamName} value={draft.name} onChange={(name) => onDraftChange({ ...draft, name })} />
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-white/30">{copy.common.plan}</span>
            <select
              value={draft.plan}
              onChange={(event) => onDraftChange({ ...draft, plan: event.target.value as TeamDraft["plan"] })}
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
            >
              <option value="start" className="bg-[#0d1426]">GUTO Time Start</option>
              <option value="pro" className="bg-[#0d1426]">GUTO Time Pro</option>
              <option value="elite" className="bg-[#0d1426]">GUTO Time Elite</option>
              <option value="custom" className="bg-[#0d1426]">{formatHuman("custom", copy)}</option>
            </select>
          </label>
          {draft.plan === "custom" && (
            <>
              <Field label={copy.dialogs.maxStudents} value={draft.maxStudents} onChange={(maxStudents) => onDraftChange({ ...draft, maxStudents })} />
              <Field label={copy.dialogs.maxCoaches} value={draft.maxCoaches} onChange={(maxCoaches) => onDraftChange({ ...draft, maxCoaches })} />
            </>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white">{copy.common.cancel}</AlertDialogCancel>
          <Button disabled={acting || !draft.name.trim()} onClick={onCreate} className="bg-[#00e5ff] text-[#0a0f1e] hover:bg-white">
            <Building2 className="mr-2 h-4 w-4" />
            {copy.dialogs.createTeam}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function CoachPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-[#00e5ff]">GUTO</div>}>
      <CoachInner />
    </Suspense>
  );
}
