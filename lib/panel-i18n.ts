"use client"

import { useEffect, useState } from "react"

// Idioma do painel interno (/coach). Compartilha localStorage com a tela
// de login do painel (/admin/login) — `guto-admin-language`. Mudar lá
// reflete no /coach e vice-versa. NÃO confundir com o idioma do APP do aluno
// (chave separada: `guto-selected-language`).
export type PanelLang = "pt-BR" | "it-IT" | "en-US"

export const PANEL_LANG_STORAGE_KEY = "guto-admin-language"
export const PANEL_LANGUAGES: ReadonlyArray<{ code: PanelLang; short: string; label: string }> = [
  { code: "pt-BR", short: "PT", label: "Português" },
  { code: "en-US", short: "EN", label: "English" },
  { code: "it-IT", short: "IT", label: "Italiano" },
]

function isPanelLang(value: string | null | undefined): value is PanelLang {
  return value === "pt-BR" || value === "en-US" || value === "it-IT"
}

export function getPanelLanguage(): PanelLang {
  if (typeof window === "undefined") return "pt-BR"
  try {
    const stored = window.localStorage.getItem(PANEL_LANG_STORAGE_KEY)
    return isPanelLang(stored) ? stored : "pt-BR"
  } catch {
    return "pt-BR"
  }
}

export function setPanelLanguage(lang: PanelLang): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(PANEL_LANG_STORAGE_KEY, lang)
    // Dispatch evento custom pra outros componentes na mesma aba reagirem.
    // localStorage 'storage' event só dispara em ABAS diferentes.
    window.dispatchEvent(new CustomEvent("guto-panel-lang-change", { detail: lang }))
  } catch {
    // ignore
  }
}

export function usePanelLanguage(): [PanelLang, (next: PanelLang) => void] {
  const [lang, setLang] = useState<PanelLang>("pt-BR")

  useEffect(() => {
    setLang(getPanelLanguage())
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<PanelLang>).detail
      if (isPanelLang(detail)) setLang(detail)
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === PANEL_LANG_STORAGE_KEY && isPanelLang(event.newValue)) {
        setLang(event.newValue)
      }
    }
    window.addEventListener("guto-panel-lang-change", onChange)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("guto-panel-lang-change", onChange)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const update = (next: PanelLang) => {
    setPanelLanguage(next)
    setLang(next)
  }

  return [lang, update]
}

// ────────────────────────────────────────────────────────────────────────
// Dicionário de strings do painel. Organizado por área funcional para que
// novos rótulos sejam fáceis de adicionar sem inflar um arquivo único.
// ────────────────────────────────────────────────────────────────────────

type Dict = {
  brand: { title: string; subtitle: string }
  nav: {
    operation: string
    registry: string
    analysis: string
    system: string
    dashboard: string
    approvals: string
    companies: string
    myCompany: string
    students: string
    arena: string
    bank: string
    logs: string
    expand: string
    collapse: string
  }
  header: {
    screenTitle: {
      hoje: string
      empresas: string
      students: string
      aprovacoes: string
      banco: string
      arena: string
      logs: string
    }
    screenSub: {
      hoje: string
      empresas: string
      students: string
      aprovacoes: string
      banco: string
      arena: string
      logs: string
    }
    online: string
    companiesLabel: string
    studentsLabel: string
    pendingLabel: string
    ctaCompany: string
    ctaStudent: string
  }
  hojeScreen: {
    activeCompanies: string
    activeCompaniesSub: (n: number) => string
    activeStudents: string
    activeStudentsSub: string
    workoutsToday: string
    workoutsTodaySub: string
    criticals: string
    criticalsSub: string
    attention: string
    attentionSub: string
    needsAttentionTitle: string
    seeAll: string
    activeCompaniesTitle: string
    allOnTrack: string
    workoutDoneRelative: (rel: string) => string
    noSignal: string
    xpUnit: string
    riskOk: string
    riskAttention: string
    riskCritical: string
    riskNoSignal: string
  }
  empresasScreen: {
    searchPlaceholder: string
    filterAll: string
    filterActive: string
    filterPaused: string
    filterArchived: string
    cleanEmpty: string
    cleaningEmpty: string
    cleanEmptyConfirm: string
    cleanEmptySuccess: (n: number) => string
    cleanEmptyEmpty: string
    cleanEmptyError: string
    actions: {
      activate: string
      pause: string
      archive: string
      delete: string
      menuLabel: (name: string) => string
      changeStatusConfirm: (verb: string, name: string) => string
      changeStatusVerbActivate: string
      changeStatusVerbPause: string
      changeStatusVerbArchive: string
      changeStatusSuccess: (name: string, status: string) => string
      changeStatusError: string
      deleteConfirm: (name: string) => string
      deleteSuccess: (name: string) => string
      deleteNotEmpty: (coaches: number, students: number) => string
      deleteCoreBlocked: string
      deleteError: string
    }
    headerCompany: string
    headerStatus: string
    headerPlan: string
    headerStudents: string
    headerCoaches: string
    headerCriticals: string
    rowOpen: string
    empty: string
  }
  studentsScreen: {
    searchPlaceholder: string
    filterActive: string
    filterPaused: string
    filterArchived: string
    filterAll: string
    allCompanies: string
    allCoaches: string
    allRisks: string
    riskOk: string
    riskAttention: string
    riskCritical: string
    riskNoSignal: string
    riskOkShort: string
    riskAttentionShort: string
    riskCriticalShort: string
    riskNoSignalShort: string
    noCoach: string
    noCoachTitle: string
    inviteAction: string
    inviteCopied: string
    inviteError: string
    openStudentLabel: string
    empty: string
  }
  // ─── Drawer + tabs do aluno ─────────────────────────────────────────────
  studentDrawer: {
    role: string
    tabResumo: string
    tabCalibragem: string
    tabTreino: string
    tabDieta: string
    tabValidacoes: string
    tabHistorico: string
    tabAcesso: string
  }
  tabResumo: {
    panelOnboarding: string
    panelProfile: string
    panelEvolution: string
    panelCurrentPlan: string
    rowConsent: string
    rowSovereignName: string
    rowCalibration: string
    rowPact: string
    rowSystemActive: string
    badgeAccepted: string
    badgePending: string
    badgeYes: string
    badgeWaitingOnboarding: string
    calibComplete: string
    calibPartial: string
    calibMissing: string
    rowStatus: string
    rowEmail: string
    rowPhone: string
    rowSubscription: string
    rowExpiresAt: string
    rowCoach: string
    rowTeam: string
    rowArena: string
    arenaVisible: string
    arenaHidden: string
    rowWeeklyXp: string
    rowMonthlyXp: string
    rowTotalXp: string
    rowStreak: string
    rowValidations: string
    rowAvatar: string
    streakDays: (n: number) => string
    rowWorkout: string
    rowDiet: string
    workoutLocked: string
    dietLocked: string
    statusArchived: string
    statusPaused: string
    statusHiddenArena: string
    statusActive: string
  }
  tabHistorico: {
    panelWorkout: string
    panelDiet: string
    panelGeneral: string
    emptyWorkout: string
    emptyDiet: string
    emptyGeneral: string
  }
  tabValidacoes: {
    panelTitle: string
    loading: string
    empty: string
    loadError: string
    focusLabel: Record<string, string>
    locationLabel: Record<string, string>
    difficultyLabel: Record<"easy" | "ok" | "hard" | "pain", string>
    energyLabel: Record<"low" | "normal" | "high", string>
    xpUnit: string
    painPrefix: string
    energyPrefix: string
  }
  tabTreino: {
    panelOfficial: string
    panelHistory: string
    panelCustom: string
    panelWeekly: string
    fieldTitle: string
    fieldFocus: string
    fieldDay: string
    fieldLocation: string
    fieldDuration: string
    fieldDifficulty: string
    fieldCoachNotes: string
    fieldSets: string
    fieldReps: string
    fieldLoad: string
    fieldRest: string
    fieldCue: string
    fieldNote: string
    fieldAlternatives: string
    fieldOfficialExercise: string
    fieldCatalog: string
    fieldCustomName: string
    fieldCustomId: string
    fieldCustomGroup: string
    fieldCustomEquipment: string
    fieldCustomFile: string
    fieldCustomPath: string
    fieldCustomBytes: string
    fieldCustomDuration: string
    fieldCustomWidth: string
    fieldCustomHeight: string
    fieldCustomFps: string
    btnSave: string
    btnManual: string
    btnGenerate: string
    btnDuplicate: string
    btnLockToggleAllow: string
    btnLockToggleBlock: string
    btnReset: string
    btnSubmitCustom: string
    placeholderSearchCatalog: string
    selectLocation: string
    historyEmpty: string
    toastCustomSubmitted: string
    toastCustomError: string
    toastSavedWeekly: string
    toastWeeklySaveError: string
    todayPrefix: string
    weekDays: { full: readonly string[]; short: readonly string[] }
    duplicatedSuffix: string
  }
  arenaScreen: {
    rankingWeekly: string
    rankingMonthly: string
    rankingOverall: string
    empty: string
    positionSuffix: string
    streakSuffix: string
    xpUnit: string
  }
  logsScreen: {
    panelTitle: string
    empty: string
    sourceCoachLabel: string
    sourceCoachPrefix: string
    sourceAdminLabel: string
    sourceAdminPrefix: string
    targetLabel: string
    metadataLabel: string
    placeholderSearch: string
    filterAll: string
    bannerLocalFilter: string
    bannerLocalFilterCopy: string
    emptyRecords: string
    actionFallback: string
    paginationCopy: (shown: number, total: number) => string
  }
  aprovacoesScreen: {
    panelTitle: string
    empty: string
    btnApprove: string
    btnReject: string
    btnSeeVideo: string
    confirmReject: string
    toastApproved: string
    toastRejected: string
    requestedBy: string
    submittedAt: string
    duration: string
    sizeMb: string
    bannerTitle: string
    bannerCopy: string
    rulesTitle: string
    rule1: string
    rule2: string
    rule3: string
    rule4: string
    riskTitle: string
    riskCopy: string
    tabExercises: string
    tabFoods: string
    emptyExercises: string
    pillPending: string
    pillVideoOk: string
    pillVideoInvalid: string
    miniDuration: string
    miniSize: string
    miniResolution: string
    miniFps: string
    sentBy: (user: string, role: string, date: string) => string
    blockReasonNotValidated: string
    blockReasonTooLong: string
    rejectPrompt: string
    foodsKicker: string
    foodsTitle: string
    foodsCopy: string
  }
  bancoScreen: {
    panelTitle: string
    empty: string
    placeholderSearch: string
    countLabel: string
    actionEdit: string
    actionReview: string
    bannerTitle: string
    bannerCopy: string
    tabExercises: string
    tabFoods: string
    filterAll: string
    emptyCatalog: string
    emptyFiltered: string
    videoTitle: string
    countCopy: (shown: number, total: number) => string
    foodsKicker: string
    foodsTitle: string
    foodsCopy: string
  }
  tabDieta: {
    panelOfficial: string
    panelHistory: string
    panelWeekly: string
    fieldTitle: string
    fieldCountry: string
    fieldKcal: string
    fieldProtein: string
    fieldCarbs: string
    fieldFat: string
    fieldRestrictions: string
    fieldCoachNotes: string
    fieldMealName: string
    fieldMealTime: string
    fieldMealKcal: string
    fieldMealAlternatives: string
    placeholderFood: string
    placeholderQuantity: string
    btnSave: string
    btnManual: string
    btnGenerate: string
    btnLockToggleAllow: string
    btnLockToggleBlock: string
    btnReset: string
    historyEmpty: string
    weeklyIntro: string
    toastSavedWeekly: string
    toastWeeklySaveError: string
  }
  empresaDrawer: {
    close: string
    tabResumo: string
    tabCoaches: string
    tabAlunos: string
    tabPlano: string
    tabLogs: string
    sectionUsage: string
    sectionStatus: string
    sectionContact: string
    sectionPlanDetails: string
    rowPlan: string
    rowStatus: string
    rowCoaches: string
    rowActiveStudents: string
    rowCriticalStudents: string
    rowCreatedAt: string
    rowEmail: string
    rowPhone: string
    rowAddress: string
    rowCityCountry: string
    rowStudentLimit: string
    rowCoachLimit: string
    rowUpdatedAt: string
    unlimited: string
    btnAddCoach: string
    btnAddStudent: string
    btnRefresh: string
  }
  coachDrawer: {
    roleBadge: string
    statusActive: string
    statusPaused: string
    close: string
    tabResumo: string
    tabAlunos: string
    tabTreinos: string
    tabDietas: string
    tabLogs: string
    sectionPerformance: string
    sectionData: string
    rowActiveStudents: string
    rowCriticals: string
    rowAttention: string
    rowNoSignal: string
    rowTotalAssigned: string
    rowEmail: string
    rowPhone: string
    rowStatus: string
    rowCreatedAt: string
    emptyNoStudents: string
    emptyQueue: string
    lastValidation: (rel: string) => string
    editWorkout: string
    editDiet: string
    emptyLogs: string
    logActionFallback: string
    logTargetPrefix: string
    riskOkShort: string
    riskAttentionShort: string
    riskCriticalShort: string
    riskNoSignalShort: string
  }
  dialogs: {
    createStudent: {
      badge: string
      title: string
      description: string
      fieldName: string
      fieldEmail: string
      fieldPhone: string
      fieldPassword: string
      fieldCompany: string
      fieldCoach: string
      fieldSex: string
      fieldAge: string
      placeholderName: string
      placeholderEmail: string
      placeholderPhone: string
      placeholderPassword: string
      placeholderAge: string
      selectCompany: string
      selectCoach: string
      noCoachInTeamHint: string
      cancel: string
      create: string
      creating: string
      lockedTeamHint: (teamName: string) => string
    }
    createCoach: {
      badge: string
      title: string
      description: string
      fieldName: string
      fieldEmail: string
      fieldPassword: string
      fieldCompany: string
      placeholderName: string
      placeholderEmail: string
      placeholderPassword: string
      selectCompany: string
      cancel: string
      create: string
      creating: string
    }
    createTeam: {
      badge: string
      title: string
      description: string
      fieldName: string
      fieldPlan: string
      fieldMaxStudents: string
      fieldMaxCoaches: string
      fieldEmail: string
      fieldPhone: string
      fieldAddress: string
      fieldCity: string
      fieldCountry: string
      fieldStatus: string
      placeholderName: string
      placeholderEmail: string
      placeholderPhone: string
      placeholderAddress: string
      placeholderCity: string
      placeholderCountry: string
      planStart: string
      planPro: string
      planElite: string
      planCustom: string
      cancel: string
      create: string
      creating: string
    }
  }
  tabCalibragem: {
    panelTitle: string
    fieldBiologicalSex: string
    fieldAge: string
    fieldTrainingLevel: string
    fieldGoal: string
    fieldPreferredLocation: string
    fieldCountry: string
    fieldCity: string
    fieldHeightCm: string
    fieldWeightKg: string
    fieldPathology: string
    fieldFoodRestrictions: string
    selectPlaceholder: string
    placeholderAge: string
    placeholderCountry: string
    placeholderCity: string
    placeholderHeight: string
    placeholderWeight: string
    placeholderPathology: string
    placeholderFoodRestrictions: string
    saveBtn: string
    toastSaved: string
    biologicalSex: Record<string, string>
    trainingLevel: Record<string, string>
    trainingGoal: Record<string, string>
    trainingLocation: Record<string, string>
  }
  tabAcesso: {
    panelControl: string
    panelInvite: string
    panelSecurity: string
    btnPause: string
    btnReactivate: string
    btnRenew30: string
    btnArenaHide: string
    btnArenaShow: string
    assignCoachPlaceholder: string
    btnViewInvite: string
    btnRegenInvite: string
    btnResetPassword: string
    btnDelete: string
    confirmRegen: string
    confirmDelete: string
    toastPaused: string
    toastReactivated: string
    toastRenewed: string
    toastArenaHidden: string
    toastArenaShown: string
    toastCoachAssigned: string
    toastInviteLoaded: string
    toastInviteUnavailable: string
    toastInviteRegenerated: string
    toastLinkCopied: string
    toastPasswordGenerated: string
    toastDeleted: string
    tempPasswordLabel: string
  }
}

const PT: Dict = {
  brand: { title: "GUTO", subtitle: "Sala de Controle" },
  nav: {
    operation: "Operação", registry: "Cadastros", analysis: "Análise", system: "Sistema",
    dashboard: "Dashboard", approvals: "Aprovações", companies: "Empresas",
    myCompany: "Minha Empresa", students: "Alunos", arena: "Arena", bank: "Banco GUTO",
    logs: "Logs", expand: "Expandir", collapse: "Recolher",
  },
  header: {
    screenTitle: {
      hoje: "Hoje", empresas: "Empresas", students: "Alunos", aprovacoes: "Aprovações",
      banco: "Banco do GUTO", arena: "Arena", logs: "Logs",
    },
    screenSub: {
      hoje: "Visão geral operacional",
      empresas: "Cadastros / clientes B2B",
      students: "Todos os alunos do seu escopo",
      aprovacoes: "Itens pendentes para o catálogo GUTO",
      banco: "Catálogo aprovado · treinos e dietas",
      arena: "Ranking competitivo",
      logs: "Auditoria do sistema",
    },
    online: "ONLINE",
    companiesLabel: "Empresas",
    studentsLabel: "Alunos",
    pendingLabel: "Pend.",
    ctaCompany: "+ Empresa",
    ctaStudent: "+ Aluno",
  },
  hojeScreen: {
    activeCompanies: "Empresas ativas",
    activeCompaniesSub: (n) => `${n} cliente(s) cadastrada(s)`,
    activeStudents: "Ativos",
    activeStudentsSub: "alunos com acesso",
    workoutsToday: "Treinos hoje",
    workoutsTodaySub: "validações no dia",
    criticals: "Críticos",
    criticalsSub: "6+ dias parado",
    attention: "Atenção",
    attentionSub: "3-5 dias parado",
    needsAttentionTitle: "ALUNOS QUE PRECISAM DE ATENÇÃO",
    seeAll: "Ver todos",
    activeCompaniesTitle: "EMPRESAS ATIVAS",
    allOnTrack: "Todos em dia.",
    workoutDoneRelative: (rel) => `último treino ${rel}`,
    noSignal: "sem sinal",
    xpUnit: "XP",
    riskOk: "EM DIA", riskAttention: "ATENÇÃO", riskCritical: "CRÍTICO", riskNoSignal: "SEM SINAL",
  },
  empresasScreen: {
    searchPlaceholder: "Buscar empresa…",
    filterAll: "Todas",
    filterActive: "Ativas",
    filterPaused: "Pausadas",
    filterArchived: "Arquivadas",
    cleanEmpty: "Limpar vazias",
    cleaningEmpty: "Limpando…",
    cleanEmptyConfirm: "Remover empresas VAZIAS (sem coaches e sem alunos)? GUTO_CORE e empresas com membros são preservadas. Ação não destrutiva de dados de alunos.",
    cleanEmptySuccess: (n) => `${n} empresa(s) vazia(s) removida(s).`,
    cleanEmptyEmpty: "Nenhuma empresa vazia encontrada.",
    cleanEmptyError: "Não foi possível limpar empresas vazias.",
    actions: {
      activate: "Reativar",
      pause: "Pausar",
      archive: "Arquivar",
      delete: "Excluir",
      menuLabel: (name) => `Ações da empresa ${name}`,
      changeStatusConfirm: (verb, name) => `${verb} a empresa "${name}"?`,
      changeStatusVerbActivate: "Reativar",
      changeStatusVerbPause: "Pausar",
      changeStatusVerbArchive: "Arquivar",
      changeStatusSuccess: (name, status) => `Empresa "${name}" agora está ${status}.`,
      changeStatusError: "Não foi possível alterar o status da empresa.",
      deleteConfirm: (name) => `Excluir a empresa "${name}" definitivamente? Esta ação não pode ser desfeita.`,
      deleteSuccess: (name) => `Empresa "${name}" excluída.`,
      deleteNotEmpty: (c, s) => `Não dá pra excluir: ${c} coach(es) e ${s} aluno(s) vinculado(s). Realoque ou arquive antes.`,
      deleteCoreBlocked: "A empresa interna GUTO_CORE não pode ser removida.",
      deleteError: "Não foi possível excluir a empresa.",
    },
    headerCompany: "EMPRESA / ID",
    headerStatus: "STATUS",
    headerPlan: "PLANO",
    headerStudents: "ALUNOS",
    headerCoaches: "COACHES",
    headerCriticals: "CRÍTICOS",
    rowOpen: "Abrir",
    empty: "Nenhuma empresa encontrada.",
  },
  studentsScreen: {
    searchPlaceholder: "Buscar nome, email ou telefone…",
    filterActive: "Ativos",
    filterPaused: "Pausados",
    filterArchived: "Arquivados",
    filterAll: "Todos",
    allCompanies: "Todas as empresas",
    allCoaches: "Todos os coaches",
    allRisks: "Todos os riscos",
    riskOk: "Em dia",
    riskAttention: "Atenção",
    riskCritical: "Crítico",
    riskNoSignal: "Sem sinal",
    riskOkShort: "EM DIA",
    riskAttentionShort: "ATENÇÃO",
    riskCriticalShort: "CRÍTICO",
    riskNoSignalShort: "S/SINAL",
    noCoach: "⚠ SEM COACH",
    noCoachTitle: "Aluno sem coach atribuído — atenção operacional",
    inviteAction: "Convite",
    inviteCopied: "Link copiado.",
    inviteError: "Não foi possível copiar o convite.",
    openStudentLabel: "Abrir aluno",
    empty: "Nenhum aluno encontrado.",
  },
  studentDrawer: {
    role: "ALUNO",
    tabResumo: "Resumo", tabCalibragem: "Calibragem", tabTreino: "Treino",
    tabDieta: "Dieta", tabValidacoes: "Validações", tabHistorico: "Histórico", tabAcesso: "Acesso",
  },
  tabResumo: {
    panelOnboarding: "Onboarding", panelProfile: "Perfil",
    panelEvolution: "Evolução", panelCurrentPlan: "Plano atual",
    rowConsent: "Consentimento", rowSovereignName: "Nome soberano",
    rowCalibration: "Calibragem", rowPact: "Pacto", rowSystemActive: "Sistema ativo",
    badgeAccepted: "Aceito", badgePending: "Pendente", badgeYes: "Sim",
    badgeWaitingOnboarding: "Aguardando onboarding",
    calibComplete: "Completa", calibPartial: "Parcial", calibMissing: "Pendente",
    rowStatus: "Status", rowEmail: "Email", rowPhone: "Telefone",
    rowSubscription: "Assinatura", rowExpiresAt: "Expira em", rowCoach: "Coach",
    rowTeam: "Time", rowArena: "Arena",
    arenaVisible: "Visível", arenaHidden: "Oculto",
    rowWeeklyXp: "XP semanal", rowMonthlyXp: "XP mensal", rowTotalXp: "XP total",
    rowStreak: "Sequência", rowValidations: "Validações", rowAvatar: "Avatar",
    streakDays: (n) => `${n} dias`,
    rowWorkout: "Treino", rowDiet: "Dieta",
    workoutLocked: "bloqueado", dietLocked: "bloqueada",
    statusArchived: "ARQUIVADO", statusPaused: "PAUSADO",
    statusHiddenArena: "OCULTO ARENA", statusActive: "ATIVO",
  },
  tabHistorico: {
    panelWorkout: "Treino", panelDiet: "Dieta", panelGeneral: "Geral",
    emptyWorkout: "Sem alterações de treino.",
    emptyDiet: "Sem alterações de dieta.",
    emptyGeneral: "Sem histórico.",
  },
  tabValidacoes: {
    panelTitle: "Validações de treino (últimas 5)",
    loading: "Carregando…",
    empty: "Sem validações registradas ainda.",
    loadError: "Não foi possível carregar as validações.",
    focusLabel: {
      chest_triceps: "Peito · tríceps", back_biceps: "Costas · bíceps",
      legs_core: "Pernas · core", shoulders_abs: "Ombros · abdômen",
      full_body: "Corpo inteiro",
    },
    locationLabel: { gym: "Academia", home: "Casa", park: "Parque" },
    difficultyLabel: { easy: "Leve", ok: "Na medida", hard: "Pesado", pain: "Dor" },
    energyLabel: { low: "Baixa", normal: "Normal", high: "Alta" },
    xpUnit: "XP",
    painPrefix: "dor:",
    energyPrefix: "energia:",
  },
  tabTreino: {
    panelOfficial: "Treino oficial",
    panelHistory: "Histórico do treino",
    panelCustom: "Enviar exercício personalizado",
    panelWeekly: "Plano semanal de treino",
    fieldTitle: "Título", fieldFocus: "Foco / grupo muscular",
    fieldDay: "Dia", fieldLocation: "Local",
    fieldDuration: "Duração estimada (min)", fieldDifficulty: "Dificuldade",
    fieldCoachNotes: "Observações do coach",
    fieldSets: "Séries", fieldReps: "Reps", fieldLoad: "Carga",
    fieldRest: "Intervalo", fieldCue: "Técnica", fieldNote: "Observação",
    fieldAlternatives: "Substituições",
    fieldOfficialExercise: "Exercício oficial", fieldCatalog: "Catálogo",
    fieldCustomName: "Nome oficial", fieldCustomId: "ID opcional",
    fieldCustomGroup: "Grupo", fieldCustomEquipment: "Equipamento",
    fieldCustomFile: "Arquivo MP4 seguro", fieldCustomPath: "Caminho interno",
    fieldCustomBytes: "Bytes", fieldCustomDuration: "Duração s",
    fieldCustomWidth: "Width", fieldCustomHeight: "Height", fieldCustomFps: "FPS",
    btnSave: "Salvar", btnManual: "Treino manual", btnGenerate: "Gerar com GUTO",
    btnDuplicate: "Duplicar",
    btnLockToggleAllow: "Permitir GUTO atualizar",
    btnLockToggleBlock: "Bloquear auto-atualização",
    btnReset: "Resetar treino",
    btnSubmitCustom: "Enviar para aprovação",
    placeholderSearchCatalog: "Pesquisar catálogo",
    selectLocation: "Selecionar",
    historyEmpty: "Sem histórico de treino.",
    toastCustomSubmitted: "Exercício enviado para aprovação técnica.",
    toastCustomError: "Erro no vídeo.",
    toastSavedWeekly: "Plano semanal salvo.",
    toastWeeklySaveError: "Erro ao salvar plano semanal.",
    todayPrefix: "Hoje",
    weekDays: {
      full: ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"],
      short: ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],
    },
    duplicatedSuffix: "cópia",
  },
  arenaScreen: {
    rankingWeekly: "RANKING SEMANAL",
    rankingMonthly: "RANKING MENSAL",
    rankingOverall: "RANKING GERAL",
    empty: "Sem ranking.",
    positionSuffix: "º",
    streakSuffix: "d",
    xpUnit: "XP",
  },
  logsScreen: {
    panelTitle: "Logs do sistema",
    empty: "Sem ações registradas.",
    sourceCoachLabel: "coach", sourceCoachPrefix: "Coach ·",
    sourceAdminLabel: "admin", sourceAdminPrefix: "Admin ·",
    targetLabel: "alvo:", metadataLabel: "meta:",
    placeholderSearch: "Buscar ação, ator ou alvo…",
    filterAll: "Todas",
    bannerLocalFilter: "FILTRO LOCAL",
    bannerLocalFilterCopy: "backend ainda só filtra por targetUserId. Filtros server-side por data, ação e severidade chegam no PR #5.",
    emptyRecords: "Sem registros.",
    actionFallback: "ação",
    paginationCopy: (shown: number, total: number) => `mostrando primeiros ${shown} de ${total} registros`,
  },
  aprovacoesScreen: {
    panelTitle: "Aprovações de exercício",
    empty: "Sem aprovações pendentes.",
    btnApprove: "Aprovar", btnReject: "Rejeitar",
    btnSeeVideo: "Ver vídeo",
    confirmReject: "Recusar este exercício?",
    toastApproved: "Exercício aprovado.",
    toastRejected: "Exercício recusado.",
    requestedBy: "Solicitado por:", submittedAt: "Enviado em:",
    duration: "Duração:", sizeMb: "Tamanho:",
    bannerTitle: "Apenas admin / super admin aprova. Coaches só sugerem.",
    bannerCopy: "Itens aprovados entram no Banco do GUTO e podem ser usados em treinos / dietas futuros.",
    rulesTitle: "REGRAS DO VÍDEO",
    rule1: "✓ Vídeo obrigatório",
    rule2: "✓ Formato MP4 recomendado",
    rule3: "✓ Duração máxima 15 segundos",
    rule4: "✓ Aprovação obrigatória de admin / super_admin",
    riskTitle: "RISCO PENDENTE",
    riskCopy: "backend hoje aceita até 30s (MAX_DURATION_SECONDS=30). CEREBROGUTO precisa apertar o limite para 15s antes da próxima safra de exercícios entrar.",
    tabExercises: "Exercícios pendentes", tabFoods: "Alimentos pendentes",
    emptyExercises: "Tudo em ordem. Sem exercícios aguardando aprovação.",
    pillPending: "PENDENTE", pillVideoOk: "VÍDEO OK", pillVideoInvalid: "VÍDEO INVÁLIDO",
    miniDuration: "DURAÇÃO", miniSize: "TAMANHO",
    miniResolution: "RESOLUÇÃO", miniFps: "FPS",
    sentBy: (user, role, date) => `enviado por ${user} · ${role} · ${date}`,
    blockReasonNotValidated: "Vídeo precisa passar validação técnica do backend",
    blockReasonTooLong: "Vídeo acima de 15 segundos — limite atual da Sala de Controle",
    rejectPrompt: "Motivo da rejeição (opcional):",
    foodsKicker: "ENDPOINT PENDENTE",
    foodsTitle: "Catálogo de alimentos ainda não existe no backend.",
    foodsCopy: "Aprovações de alimentos (com idiomas PT/IT/EN/ES, país, macros, alérgenos e restrições) chegam no PR #4, junto com o modelo de alimento, CRUD do catálogo e fluxo de sugestão por coach. Por enquanto, esta aba fica visível só para mostrar que o lugar dela existe.",
  },
  bancoScreen: {
    panelTitle: "Banco GUTO",
    empty: "Catálogo vazio.",
    placeholderSearch: "Buscar exercício…",
    countLabel: "exercícios no catálogo",
    actionEdit: "Editar", actionReview: "Revisar",
    bannerTitle: "Catálogo aprovado · usado pelo GUTO em treinos e dietas.",
    bannerCopy: "Aprovações pendentes ficam na tela Aprovações. Aqui é só leitura por enquanto — edição/desativação vem em PR posterior.",
    tabExercises: "Exercícios", tabFoods: "Alimentos",
    filterAll: "Todos",
    emptyCatalog: "Catálogo vazio. Aguardando exercícios aprovados.",
    emptyFiltered: "Nenhum exercício encontrado com esses filtros.",
    videoTitle: "Ver vídeo",
    countCopy: (shown: number, total: number) => `${shown} de ${total} exercícios aprovados`,
    foodsKicker: "ENDPOINT PENDENTE",
    foodsTitle: "Catálogo de alimentos pendente de backend.",
    foodsCopy: "Modelo de alimento (idiomas PT/IT/EN/ES, país, macros, alérgenos, restrições) + CRUD do catálogo entram no PR #4.",
  },
  tabDieta: {
    panelOfficial: "Dieta oficial",
    panelHistory: "Histórico da dieta",
    panelWeekly: "Plano semanal de dieta",
    fieldTitle: "Título", fieldCountry: "País", fieldKcal: "Calorias (kcal)",
    fieldProtein: "Proteína (g)", fieldCarbs: "Carbo (g)", fieldFat: "Gordura (g)",
    fieldRestrictions: "Restrições", fieldCoachNotes: "Notas do coach",
    fieldMealName: "Refeição", fieldMealTime: "Horário",
    fieldMealKcal: "Kcal total", fieldMealAlternatives: "Substituições",
    placeholderFood: "Alimento", placeholderQuantity: "Quantidade",
    btnSave: "Salvar", btnManual: "Dieta manual", btnGenerate: "Gerar com GUTO",
    btnLockToggleAllow: "Permitir GUTO atualizar",
    btnLockToggleBlock: "Bloquear auto-atualização",
    btnReset: "Resetar dieta",
    historyEmpty: "Sem histórico de dieta.",
    weeklyIntro: "Monte a dieta de cada dia. O aluno verá a dieta do dia atual.",
    toastSavedWeekly: "Plano semanal de dieta salvo.",
    toastWeeklySaveError: "Erro ao salvar plano semanal de dieta.",
  },
  empresaDrawer: {
    close: "Fechar",
    tabResumo: "Resumo", tabCoaches: "Coaches", tabAlunos: "Alunos",
    tabPlano: "Plano", tabLogs: "Logs",
    sectionUsage: "USO ATUAL", sectionStatus: "STATUS",
    sectionContact: "CONTATO", sectionPlanDetails: "DETALHES DO PLANO",
    rowPlan: "Plano", rowStatus: "Status", rowCoaches: "Coaches",
    rowActiveStudents: "Alunos ativos", rowCriticalStudents: "Alunos críticos",
    rowCreatedAt: "Criada em", rowEmail: "E-mail", rowPhone: "Telefone",
    rowAddress: "Endereço", rowCityCountry: "Cidade / País",
    rowStudentLimit: "Limite alunos", rowCoachLimit: "Limite coaches",
    rowUpdatedAt: "Atualizada em",
    unlimited: "ilimitado",
    btnAddCoach: "+ Coach", btnAddStudent: "+ Aluno", btnRefresh: "Atualizar",
  },
  coachDrawer: {
    roleBadge: "COACH",
    statusActive: "ATIVO", statusPaused: "PAUSADO",
    close: "Fechar",
    tabResumo: "RESUMO", tabAlunos: "ALUNOS", tabTreinos: "TREINOS",
    tabDietas: "DIETAS", tabLogs: "LOGS",
    sectionPerformance: "DESEMPENHO", sectionData: "DADOS",
    rowActiveStudents: "Alunos ativos", rowCriticals: "Críticos",
    rowAttention: "Atenção", rowNoSignal: "Sem sinal",
    rowTotalAssigned: "Total atribuídos",
    rowEmail: "E-mail", rowPhone: "Telefone", rowStatus: "Status",
    rowCreatedAt: "Criado em",
    emptyNoStudents: "Este coach não tem alunos atribuídos.",
    emptyQueue: "Sem alunos para este coach.",
    lastValidation: (rel) => `última validação ${rel}`,
    editWorkout: "Editar treino ›", editDiet: "Editar dieta ›",
    emptyLogs: "Sem ações registradas.",
    logActionFallback: "ação", logTargetPrefix: "alvo ·",
    riskOkShort: "EM DIA", riskAttentionShort: "ATENÇÃO",
    riskCriticalShort: "CRÍTICO", riskNoSignalShort: "SEM SINAL",
  },
  dialogs: {
    createStudent: {
      badge: "CRIAR ALUNO",
      title: "Novo aluno",
      description: "Cadastre um aluno e gere o convite de acesso.",
      fieldName: "Nome", fieldEmail: "E-mail", fieldPhone: "Telefone",
      fieldPassword: "Senha (opcional)", fieldCompany: "Empresa",
      fieldCoach: "Coach", fieldSex: "Sexo biológico", fieldAge: "Idade",
      placeholderName: "Nome completo do aluno",
      placeholderEmail: "aluno@email.com",
      placeholderPhone: "(11) 90000-0000",
      placeholderPassword: "Deixe em branco para enviar convite",
      placeholderAge: "Ex: 28",
      selectCompany: "Selecionar empresa…",
      selectCoach: "Selecionar coach…",
      noCoachInTeamHint: "Esta empresa ainda não tem coaches. Crie um coach antes de criar o aluno.",
      cancel: "Cancelar", create: "Criar aluno", creating: "Criando…",
      lockedTeamHint: (name) => `Empresa fixada: ${name}`,
    },
    createCoach: {
      badge: "CRIAR COACH",
      title: "Novo coach",
      description: "Cadastre um coach dentro de uma empresa.",
      fieldName: "Nome", fieldEmail: "E-mail",
      fieldPassword: "Senha (opcional)", fieldCompany: "Empresa",
      placeholderName: "Nome completo do coach",
      placeholderEmail: "coach@email.com",
      placeholderPassword: "Deixe em branco para enviar convite",
      selectCompany: "Selecionar empresa…",
      cancel: "Cancelar", create: "Criar coach", creating: "Criando…",
    },
    createTeam: {
      badge: "CRIAR EMPRESA",
      title: "Nova empresa",
      description: "Cadastre uma empresa cliente (B2B).",
      fieldName: "Nome da empresa", fieldPlan: "Plano",
      fieldMaxStudents: "Máx. alunos", fieldMaxCoaches: "Máx. coaches",
      fieldEmail: "E-mail de contato", fieldPhone: "Telefone",
      fieldAddress: "Endereço", fieldCity: "Cidade",
      fieldCountry: "País", fieldStatus: "Status",
      placeholderName: "Ex: Studio Vertice",
      placeholderEmail: "contato@empresa.com",
      placeholderPhone: "(11) 0000-0000",
      placeholderAddress: "Rua, número, bairro",
      placeholderCity: "São Paulo",
      placeholderCountry: "BR",
      planStart: "Start", planPro: "Pro", planElite: "Elite", planCustom: "Custom",
      cancel: "Cancelar", create: "Criar empresa", creating: "Criando…",
    },
  },
  tabCalibragem: {
    panelTitle: "Calibragem do aluno",
    fieldBiologicalSex: "Sexo biológico",
    fieldAge: "Idade",
    fieldTrainingLevel: "Nível de treino",
    fieldGoal: "Objetivo",
    fieldPreferredLocation: "Local preferido",
    fieldCountry: "País",
    fieldCity: "Cidade",
    fieldHeightCm: "Altura (cm)",
    fieldWeightKg: "Peso (kg)",
    fieldPathology: "Dor ou limitação",
    fieldFoodRestrictions: "Restrições alimentares",
    selectPlaceholder: "Selecionar",
    placeholderAge: "Ex: 28",
    placeholderCountry: "Ex: BR",
    placeholderCity: "Ex: São Paulo",
    placeholderHeight: "Ex: 175",
    placeholderWeight: "Ex: 80",
    placeholderPathology: "Ex: dor no joelho",
    placeholderFoodRestrictions: "Ex: sem lactose",
    saveBtn: "Salvar calibragem",
    toastSaved: "Calibragem atualizada.",
    biologicalSex: { male: "Masculino", female: "Feminino" },
    trainingLevel: {
      beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado",
      returning: "Retornando", consistent: "Consistente",
    },
    trainingGoal: {
      muscle_gain: "Ganho de massa", fat_loss: "Perda de gordura",
      endurance: "Resistência", flexibility: "Flexibilidade",
      general_fitness: "Condicionamento geral", rehabilitation: "Reabilitação",
      maintenance: "Manutenção", conditioning: "Condicionamento",
      mobility_health: "Saúde e mobilidade", consistency: "Consistência",
    },
    trainingLocation: {
      gym: "Academia", home: "Em casa", park: "Ao ar livre", mixed: "Variado",
    },
  },
  tabAcesso: {
    panelControl: "Controle de acesso", panelInvite: "Convite de acesso", panelSecurity: "Segurança",
    btnPause: "Pausar acesso", btnReactivate: "Reativar acesso",
    btnRenew30: "Renovar 30 dias",
    btnArenaHide: "Ocultar na Arena", btnArenaShow: "Mostrar na Arena",
    assignCoachPlaceholder: "Atribuir coach…",
    btnViewInvite: "Ver convite atual", btnRegenInvite: "Regenerar convite",
    btnResetPassword: "Gerar senha temporária",
    btnDelete: "Excluir permanentemente",
    confirmRegen: "Regenerar convite? O link anterior deixa de funcionar.",
    confirmDelete: "Excluir permanentemente este aluno e todos os dados vinculados?",
    toastPaused: "Acesso pausado.",
    toastReactivated: "Acesso reativado.",
    toastRenewed: "Acesso renovado por 30 dias.",
    toastArenaHidden: "Aluno ocultado da Arena.",
    toastArenaShown: "Aluno visível na Arena.",
    toastCoachAssigned: "Aluno atribuído ao coach.",
    toastInviteLoaded: "Convite carregado.",
    toastInviteUnavailable: "Link não disponível. Use regenerar para criar um novo.",
    toastInviteRegenerated: "Novo convite gerado.",
    toastLinkCopied: "Link copiado!",
    toastPasswordGenerated: "Senha temporária gerada.",
    toastDeleted: "Aluno excluído permanentemente.",
    tempPasswordLabel: "Senha temporária",
  },
}

const EN: Dict = {
  brand: { title: "GUTO", subtitle: "Control Room" },
  nav: {
    operation: "Operation", registry: "Registry", analysis: "Analysis", system: "System",
    dashboard: "Dashboard", approvals: "Approvals", companies: "Companies",
    myCompany: "My Company", students: "Students", arena: "Arena", bank: "GUTO Bank",
    logs: "Logs", expand: "Expand", collapse: "Collapse",
  },
  header: {
    screenTitle: {
      hoje: "Today", empresas: "Companies", students: "Students", aprovacoes: "Approvals",
      banco: "GUTO Bank", arena: "Arena", logs: "Logs",
    },
    screenSub: {
      hoje: "Operational overview",
      empresas: "Registry / B2B clients",
      students: "All students in your scope",
      aprovacoes: "Pending items for the GUTO catalog",
      banco: "Approved catalog · workouts and diets",
      arena: "Competitive ranking",
      logs: "System audit",
    },
    online: "ONLINE",
    companiesLabel: "Companies",
    studentsLabel: "Students",
    pendingLabel: "Pend.",
    ctaCompany: "+ Company",
    ctaStudent: "+ Student",
  },
  hojeScreen: {
    activeCompanies: "Active companies",
    activeCompaniesSub: (n) => `${n} client(s) registered`,
    activeStudents: "Active",
    activeStudentsSub: "students with access",
    workoutsToday: "Workouts today",
    workoutsTodaySub: "validations today",
    criticals: "Critical",
    criticalsSub: "6+ idle days",
    attention: "Attention",
    attentionSub: "3-5 idle days",
    needsAttentionTitle: "STUDENTS WHO NEED ATTENTION",
    seeAll: "See all",
    activeCompaniesTitle: "ACTIVE COMPANIES",
    allOnTrack: "All on track.",
    workoutDoneRelative: (rel) => `last workout ${rel}`,
    noSignal: "no signal",
    xpUnit: "XP",
    riskOk: "ON TRACK", riskAttention: "ATTENTION", riskCritical: "CRITICAL", riskNoSignal: "NO SIGNAL",
  },
  empresasScreen: {
    searchPlaceholder: "Search company…",
    filterAll: "All",
    filterActive: "Active",
    filterPaused: "Paused",
    filterArchived: "Archived",
    cleanEmpty: "Clean empty",
    cleaningEmpty: "Cleaning…",
    cleanEmptyConfirm: "Remove EMPTY companies (no coaches, no students)? GUTO_CORE and companies with members are preserved. Non-destructive action.",
    cleanEmptySuccess: (n) => `${n} empty company(ies) removed.`,
    cleanEmptyEmpty: "No empty company found.",
    cleanEmptyError: "Could not clean empty companies.",
    actions: {
      activate: "Reactivate",
      pause: "Pause",
      archive: "Archive",
      delete: "Delete",
      menuLabel: (name) => `Actions for company ${name}`,
      changeStatusConfirm: (verb, name) => `${verb} company "${name}"?`,
      changeStatusVerbActivate: "Reactivate",
      changeStatusVerbPause: "Pause",
      changeStatusVerbArchive: "Archive",
      changeStatusSuccess: (name, status) => `Company "${name}" is now ${status}.`,
      changeStatusError: "Could not change company status.",
      deleteConfirm: (name) => `Permanently delete company "${name}"? This cannot be undone.`,
      deleteSuccess: (name) => `Company "${name}" deleted.`,
      deleteNotEmpty: (c, s) => `Can't delete: ${c} coach(es) and ${s} student(s) attached. Reassign or archive them first.`,
      deleteCoreBlocked: "The internal GUTO_CORE company cannot be removed.",
      deleteError: "Could not delete the company.",
    },
    headerCompany: "COMPANY / ID",
    headerStatus: "STATUS",
    headerPlan: "PLAN",
    headerStudents: "STUDENTS",
    headerCoaches: "COACHES",
    headerCriticals: "CRITICAL",
    rowOpen: "Open",
    empty: "No company found.",
  },
  studentsScreen: {
    searchPlaceholder: "Search name, email or phone…",
    filterActive: "Active",
    filterPaused: "Paused",
    filterArchived: "Archived",
    filterAll: "All",
    allCompanies: "All companies",
    allCoaches: "All coaches",
    allRisks: "All risks",
    riskOk: "On track",
    riskAttention: "Attention",
    riskCritical: "Critical",
    riskNoSignal: "No signal",
    riskOkShort: "ON TRACK",
    riskAttentionShort: "ATTENTION",
    riskCriticalShort: "CRITICAL",
    riskNoSignalShort: "NO SIGNAL",
    noCoach: "⚠ NO COACH",
    noCoachTitle: "Student without a coach assigned — operational attention",
    inviteAction: "Invite",
    inviteCopied: "Link copied.",
    inviteError: "Could not copy the invite.",
    openStudentLabel: "Open student",
    empty: "No student found.",
  },
  studentDrawer: {
    role: "STUDENT",
    tabResumo: "Summary", tabCalibragem: "Calibration", tabTreino: "Workout",
    tabDieta: "Diet", tabValidacoes: "Validations", tabHistorico: "History", tabAcesso: "Access",
  },
  tabResumo: {
    panelOnboarding: "Onboarding", panelProfile: "Profile",
    panelEvolution: "Evolution", panelCurrentPlan: "Current plan",
    rowConsent: "Consent", rowSovereignName: "Sovereign name",
    rowCalibration: "Calibration", rowPact: "Pact", rowSystemActive: "System active",
    badgeAccepted: "Accepted", badgePending: "Pending", badgeYes: "Yes",
    badgeWaitingOnboarding: "Waiting onboarding",
    calibComplete: "Complete", calibPartial: "Partial", calibMissing: "Pending",
    rowStatus: "Status", rowEmail: "Email", rowPhone: "Phone",
    rowSubscription: "Subscription", rowExpiresAt: "Expires on", rowCoach: "Coach",
    rowTeam: "Team", rowArena: "Arena",
    arenaVisible: "Visible", arenaHidden: "Hidden",
    rowWeeklyXp: "Weekly XP", rowMonthlyXp: "Monthly XP", rowTotalXp: "Total XP",
    rowStreak: "Streak", rowValidations: "Validations", rowAvatar: "Avatar",
    streakDays: (n) => `${n} days`,
    rowWorkout: "Workout", rowDiet: "Diet",
    workoutLocked: "locked", dietLocked: "locked",
    statusArchived: "ARCHIVED", statusPaused: "PAUSED",
    statusHiddenArena: "ARENA HIDDEN", statusActive: "ACTIVE",
  },
  tabHistorico: {
    panelWorkout: "Workout", panelDiet: "Diet", panelGeneral: "General",
    emptyWorkout: "No workout changes.",
    emptyDiet: "No diet changes.",
    emptyGeneral: "No history.",
  },
  tabValidacoes: {
    panelTitle: "Workout validations (last 5)",
    loading: "Loading…",
    empty: "No validations recorded yet.",
    loadError: "Could not load validations.",
    focusLabel: {
      chest_triceps: "Chest · triceps", back_biceps: "Back · biceps",
      legs_core: "Legs · core", shoulders_abs: "Shoulders · abs",
      full_body: "Full body",
    },
    locationLabel: { gym: "Gym", home: "Home", park: "Park" },
    difficultyLabel: { easy: "Easy", ok: "Right dose", hard: "Heavy", pain: "Pain" },
    energyLabel: { low: "Low", normal: "Normal", high: "High" },
    xpUnit: "XP",
    painPrefix: "pain:",
    energyPrefix: "energy:",
  },
  tabTreino: {
    panelOfficial: "Official workout",
    panelHistory: "Workout history",
    panelCustom: "Submit custom exercise",
    panelWeekly: "Weekly workout plan",
    fieldTitle: "Title", fieldFocus: "Focus / muscle group",
    fieldDay: "Day", fieldLocation: "Location",
    fieldDuration: "Est. duration (min)", fieldDifficulty: "Difficulty",
    fieldCoachNotes: "Coach notes",
    fieldSets: "Sets", fieldReps: "Reps", fieldLoad: "Load",
    fieldRest: "Rest", fieldCue: "Cue", fieldNote: "Note",
    fieldAlternatives: "Alternatives",
    fieldOfficialExercise: "Official exercise", fieldCatalog: "Catalog",
    fieldCustomName: "Official name", fieldCustomId: "Optional ID",
    fieldCustomGroup: "Group", fieldCustomEquipment: "Equipment",
    fieldCustomFile: "Safe MP4 file", fieldCustomPath: "Internal path",
    fieldCustomBytes: "Bytes", fieldCustomDuration: "Duration s",
    fieldCustomWidth: "Width", fieldCustomHeight: "Height", fieldCustomFps: "FPS",
    btnSave: "Save", btnManual: "Manual workout", btnGenerate: "Generate with GUTO",
    btnDuplicate: "Duplicate",
    btnLockToggleAllow: "Allow GUTO to update",
    btnLockToggleBlock: "Block auto-update",
    btnReset: "Reset workout",
    btnSubmitCustom: "Submit for approval",
    placeholderSearchCatalog: "Search catalog",
    selectLocation: "Select",
    historyEmpty: "No workout history.",
    toastCustomSubmitted: "Exercise submitted for technical approval.",
    toastCustomError: "Video error.",
    toastSavedWeekly: "Weekly plan saved.",
    toastWeeklySaveError: "Error saving weekly plan.",
    todayPrefix: "Today",
    weekDays: {
      full: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
      short: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
    },
    duplicatedSuffix: "copy",
  },
  arenaScreen: {
    rankingWeekly: "WEEKLY RANKING",
    rankingMonthly: "MONTHLY RANKING",
    rankingOverall: "OVERALL RANKING",
    empty: "No ranking.",
    positionSuffix: "",
    streakSuffix: "d",
    xpUnit: "XP",
  },
  logsScreen: {
    panelTitle: "System logs",
    empty: "No actions recorded.",
    sourceCoachLabel: "coach", sourceCoachPrefix: "Coach ·",
    sourceAdminLabel: "admin", sourceAdminPrefix: "Admin ·",
    targetLabel: "target:", metadataLabel: "meta:",
    placeholderSearch: "Search action, actor or target…",
    filterAll: "All",
    bannerLocalFilter: "LOCAL FILTER",
    bannerLocalFilterCopy: "backend still filters by targetUserId only. Server-side filters by date, action and severity coming in PR #5.",
    emptyRecords: "No records.",
    actionFallback: "action",
    paginationCopy: (shown: number, total: number) => `showing first ${shown} of ${total} records`,
  },
  aprovacoesScreen: {
    panelTitle: "Exercise approvals",
    empty: "No pending approvals.",
    btnApprove: "Approve", btnReject: "Reject",
    btnSeeVideo: "View video",
    confirmReject: "Reject this exercise?",
    toastApproved: "Exercise approved.",
    toastRejected: "Exercise rejected.",
    requestedBy: "Requested by:", submittedAt: "Submitted at:",
    duration: "Duration:", sizeMb: "Size:",
    bannerTitle: "Only admin / super admin can approve. Coaches only suggest.",
    bannerCopy: "Approved items enter the GUTO Bank and can be used in future workouts / diets.",
    rulesTitle: "VIDEO RULES",
    rule1: "✓ Video required",
    rule2: "✓ MP4 format recommended",
    rule3: "✓ Max duration 15 seconds",
    rule4: "✓ Admin / super_admin approval required",
    riskTitle: "PENDING RISK",
    riskCopy: "backend currently accepts up to 30s (MAX_DURATION_SECONDS=30). CEREBROGUTO needs to tighten the limit to 15s before the next batch of exercises comes in.",
    tabExercises: "Pending exercises", tabFoods: "Pending foods",
    emptyExercises: "All clear. No exercises awaiting approval.",
    pillPending: "PENDING", pillVideoOk: "VIDEO OK", pillVideoInvalid: "VIDEO INVALID",
    miniDuration: "DURATION", miniSize: "SIZE",
    miniResolution: "RESOLUTION", miniFps: "FPS",
    sentBy: (user, role, date) => `sent by ${user} · ${role} · ${date}`,
    blockReasonNotValidated: "Video needs to pass backend technical validation",
    blockReasonTooLong: "Video over 15 seconds — current Control Room limit",
    rejectPrompt: "Rejection reason (optional):",
    foodsKicker: "ENDPOINT PENDING",
    foodsTitle: "Food catalog doesn't exist in backend yet.",
    foodsCopy: "Food approvals (with PT/IT/EN/ES languages, country, macros, allergens and restrictions) coming in PR #4, along with the food model, catalog CRUD and coach suggestion flow. For now, this tab is visible just to show its place exists.",
  },
  bancoScreen: {
    panelTitle: "GUTO Bank",
    empty: "Catalog is empty.",
    placeholderSearch: "Search exercise…",
    countLabel: "exercises in catalog",
    actionEdit: "Edit", actionReview: "Review",
    bannerTitle: "Approved catalog · used by GUTO in workouts and diets.",
    bannerCopy: "Pending approvals are in the Approvals screen. Read-only here for now — edit/disable comes in a later PR.",
    tabExercises: "Exercises", tabFoods: "Foods",
    filterAll: "All",
    emptyCatalog: "Catalog empty. Waiting for approved exercises.",
    emptyFiltered: "No exercise matches these filters.",
    videoTitle: "View video",
    countCopy: (shown: number, total: number) => `${shown} of ${total} approved exercises`,
    foodsKicker: "ENDPOINT PENDING",
    foodsTitle: "Food catalog pending backend.",
    foodsCopy: "Food model (PT/IT/EN/ES languages, country, macros, allergens, restrictions) + catalog CRUD coming in PR #4.",
  },
  tabDieta: {
    panelOfficial: "Official diet",
    panelHistory: "Diet history",
    panelWeekly: "Weekly diet plan",
    fieldTitle: "Title", fieldCountry: "Country", fieldKcal: "Calories (kcal)",
    fieldProtein: "Protein (g)", fieldCarbs: "Carbs (g)", fieldFat: "Fat (g)",
    fieldRestrictions: "Restrictions", fieldCoachNotes: "Coach notes",
    fieldMealName: "Meal", fieldMealTime: "Time",
    fieldMealKcal: "Total kcal", fieldMealAlternatives: "Alternatives",
    placeholderFood: "Food", placeholderQuantity: "Quantity",
    btnSave: "Save", btnManual: "Manual diet", btnGenerate: "Generate with GUTO",
    btnLockToggleAllow: "Allow GUTO to update",
    btnLockToggleBlock: "Block auto-update",
    btnReset: "Reset diet",
    historyEmpty: "No diet history.",
    weeklyIntro: "Build the diet for each day. The student sees today's diet.",
    toastSavedWeekly: "Weekly diet plan saved.",
    toastWeeklySaveError: "Error saving weekly diet plan.",
  },
  empresaDrawer: {
    close: "Close",
    tabResumo: "Summary", tabCoaches: "Coaches", tabAlunos: "Students",
    tabPlano: "Plan", tabLogs: "Logs",
    sectionUsage: "CURRENT USAGE", sectionStatus: "STATUS",
    sectionContact: "CONTACT", sectionPlanDetails: "PLAN DETAILS",
    rowPlan: "Plan", rowStatus: "Status", rowCoaches: "Coaches",
    rowActiveStudents: "Active students", rowCriticalStudents: "Critical students",
    rowCreatedAt: "Created at", rowEmail: "Email", rowPhone: "Phone",
    rowAddress: "Address", rowCityCountry: "City / Country",
    rowStudentLimit: "Student limit", rowCoachLimit: "Coach limit",
    rowUpdatedAt: "Updated at",
    unlimited: "unlimited",
    btnAddCoach: "+ Coach", btnAddStudent: "+ Student", btnRefresh: "Refresh",
  },
  coachDrawer: {
    roleBadge: "COACH",
    statusActive: "ACTIVE", statusPaused: "PAUSED",
    close: "Close",
    tabResumo: "SUMMARY", tabAlunos: "STUDENTS", tabTreinos: "WORKOUTS",
    tabDietas: "DIETS", tabLogs: "LOGS",
    sectionPerformance: "PERFORMANCE", sectionData: "DATA",
    rowActiveStudents: "Active students", rowCriticals: "Critical",
    rowAttention: "Attention", rowNoSignal: "No signal",
    rowTotalAssigned: "Total assigned",
    rowEmail: "Email", rowPhone: "Phone", rowStatus: "Status",
    rowCreatedAt: "Created at",
    emptyNoStudents: "This coach has no students assigned.",
    emptyQueue: "No students for this coach.",
    lastValidation: (rel) => `last validation ${rel}`,
    editWorkout: "Edit workout ›", editDiet: "Edit diet ›",
    emptyLogs: "No actions recorded.",
    logActionFallback: "action", logTargetPrefix: "target ·",
    riskOkShort: "ON TRACK", riskAttentionShort: "ATTENTION",
    riskCriticalShort: "CRITICAL", riskNoSignalShort: "NO SIGNAL",
  },
  dialogs: {
    createStudent: {
      badge: "NEW STUDENT",
      title: "New student",
      description: "Register a student and generate the access invite.",
      fieldName: "Name", fieldEmail: "Email", fieldPhone: "Phone",
      fieldPassword: "Password (optional)", fieldCompany: "Company",
      fieldCoach: "Coach", fieldSex: "Biological sex", fieldAge: "Age",
      placeholderName: "Student full name",
      placeholderEmail: "student@email.com",
      placeholderPhone: "+1 555 000 0000",
      placeholderPassword: "Leave empty to send invite",
      placeholderAge: "e.g. 28",
      selectCompany: "Select company…",
      selectCoach: "Select coach…",
      noCoachInTeamHint: "This company has no coaches yet. Create a coach before creating a student.",
      cancel: "Cancel", create: "Create student", creating: "Creating…",
      lockedTeamHint: (name) => `Company locked: ${name}`,
    },
    createCoach: {
      badge: "NEW COACH",
      title: "New coach",
      description: "Register a coach inside a company.",
      fieldName: "Name", fieldEmail: "Email",
      fieldPassword: "Password (optional)", fieldCompany: "Company",
      placeholderName: "Coach full name",
      placeholderEmail: "coach@email.com",
      placeholderPassword: "Leave empty to send invite",
      selectCompany: "Select company…",
      cancel: "Cancel", create: "Create coach", creating: "Creating…",
    },
    createTeam: {
      badge: "NEW COMPANY",
      title: "New company",
      description: "Register a B2B client company.",
      fieldName: "Company name", fieldPlan: "Plan",
      fieldMaxStudents: "Max students", fieldMaxCoaches: "Max coaches",
      fieldEmail: "Contact email", fieldPhone: "Phone",
      fieldAddress: "Address", fieldCity: "City",
      fieldCountry: "Country", fieldStatus: "Status",
      placeholderName: "e.g. Studio Vertice",
      placeholderEmail: "contact@company.com",
      placeholderPhone: "+1 555 000 0000",
      placeholderAddress: "Street, number, district",
      placeholderCity: "New York",
      placeholderCountry: "US",
      planStart: "Start", planPro: "Pro", planElite: "Elite", planCustom: "Custom",
      cancel: "Cancel", create: "Create company", creating: "Creating…",
    },
  },
  tabCalibragem: {
    panelTitle: "Student calibration",
    fieldBiologicalSex: "Biological sex",
    fieldAge: "Age",
    fieldTrainingLevel: "Training level",
    fieldGoal: "Goal",
    fieldPreferredLocation: "Preferred location",
    fieldCountry: "Country",
    fieldCity: "City",
    fieldHeightCm: "Height (cm)",
    fieldWeightKg: "Weight (kg)",
    fieldPathology: "Pain or limitation",
    fieldFoodRestrictions: "Food restrictions",
    selectPlaceholder: "Select",
    placeholderAge: "e.g. 28",
    placeholderCountry: "e.g. US",
    placeholderCity: "e.g. New York",
    placeholderHeight: "e.g. 175",
    placeholderWeight: "e.g. 80",
    placeholderPathology: "e.g. knee pain",
    placeholderFoodRestrictions: "e.g. no lactose",
    saveBtn: "Save calibration",
    toastSaved: "Calibration updated.",
    biologicalSex: { male: "Male", female: "Female" },
    trainingLevel: {
      beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced",
      returning: "Returning", consistent: "Consistent",
    },
    trainingGoal: {
      muscle_gain: "Muscle gain", fat_loss: "Fat loss",
      endurance: "Endurance", flexibility: "Flexibility",
      general_fitness: "General fitness", rehabilitation: "Rehabilitation",
      maintenance: "Maintenance", conditioning: "Conditioning",
      mobility_health: "Mobility & health", consistency: "Consistency",
    },
    trainingLocation: {
      gym: "Gym", home: "Home", park: "Outdoors", mixed: "Mixed",
    },
  },
  tabAcesso: {
    panelControl: "Access control", panelInvite: "Access invite", panelSecurity: "Security",
    btnPause: "Pause access", btnReactivate: "Reactivate access",
    btnRenew30: "Renew 30 days",
    btnArenaHide: "Hide from Arena", btnArenaShow: "Show in Arena",
    assignCoachPlaceholder: "Assign coach…",
    btnViewInvite: "View current invite", btnRegenInvite: "Regenerate invite",
    btnResetPassword: "Generate temporary password",
    btnDelete: "Delete permanently",
    confirmRegen: "Regenerate invite? The previous link stops working.",
    confirmDelete: "Permanently delete this student and all linked data?",
    toastPaused: "Access paused.",
    toastReactivated: "Access reactivated.",
    toastRenewed: "Access renewed for 30 days.",
    toastArenaHidden: "Student hidden from Arena.",
    toastArenaShown: "Student visible in Arena.",
    toastCoachAssigned: "Student assigned to coach.",
    toastInviteLoaded: "Invite loaded.",
    toastInviteUnavailable: "Link not available. Use regenerate to create a new one.",
    toastInviteRegenerated: "New invite generated.",
    toastLinkCopied: "Link copied!",
    toastPasswordGenerated: "Temporary password generated.",
    toastDeleted: "Student deleted permanently.",
    tempPasswordLabel: "Temporary password",
  },
}

const IT: Dict = {
  brand: { title: "GUTO", subtitle: "Sala di Controllo" },
  nav: {
    operation: "Operazioni", registry: "Anagrafiche", analysis: "Analisi", system: "Sistema",
    dashboard: "Dashboard", approvals: "Approvazioni", companies: "Aziende",
    myCompany: "La mia Azienda", students: "Allievi", arena: "Arena", bank: "Banca GUTO",
    logs: "Log", expand: "Espandi", collapse: "Riduci",
  },
  header: {
    screenTitle: {
      hoje: "Oggi", empresas: "Aziende", students: "Allievi", aprovacoes: "Approvazioni",
      banco: "Banca del GUTO", arena: "Arena", logs: "Log",
    },
    screenSub: {
      hoje: "Panoramica operativa",
      empresas: "Anagrafica / clienti B2B",
      students: "Tutti gli allievi del tuo ambito",
      aprovacoes: "Voci in sospeso per il catalogo GUTO",
      banco: "Catalogo approvato · allenamenti e diete",
      arena: "Classifica competitiva",
      logs: "Audit di sistema",
    },
    online: "ONLINE",
    companiesLabel: "Aziende",
    studentsLabel: "Allievi",
    pendingLabel: "Sosp.",
    ctaCompany: "+ Azienda",
    ctaStudent: "+ Allievo",
  },
  hojeScreen: {
    activeCompanies: "Aziende attive",
    activeCompaniesSub: (n) => `${n} cliente/i registrato/i`,
    activeStudents: "Attivi",
    activeStudentsSub: "allievi con accesso",
    workoutsToday: "Allenamenti oggi",
    workoutsTodaySub: "convalide nel giorno",
    criticals: "Critici",
    criticalsSub: "6+ giorni fermi",
    attention: "Attenzione",
    attentionSub: "3-5 giorni fermi",
    needsAttentionTitle: "ALLIEVI CHE RICHIEDONO ATTENZIONE",
    seeAll: "Vedi tutti",
    activeCompaniesTitle: "AZIENDE ATTIVE",
    allOnTrack: "Tutti in regola.",
    workoutDoneRelative: (rel) => `ultimo allenamento ${rel}`,
    noSignal: "nessun segnale",
    xpUnit: "XP",
    riskOk: "IN REGOLA", riskAttention: "ATTENZIONE", riskCritical: "CRITICO", riskNoSignal: "NESSUN SEGNALE",
  },
  empresasScreen: {
    searchPlaceholder: "Cerca azienda…",
    filterAll: "Tutte",
    filterActive: "Attive",
    filterPaused: "In pausa",
    filterArchived: "Archiviate",
    cleanEmpty: "Pulisci vuote",
    cleaningEmpty: "Pulizia…",
    cleanEmptyConfirm: "Rimuovere le aziende VUOTE (senza coach e senza allievi)? GUTO_CORE e aziende con membri sono preservate. Azione non distruttiva.",
    cleanEmptySuccess: (n) => `${n} azienda/e vuota/e rimossa/e.`,
    cleanEmptyEmpty: "Nessuna azienda vuota trovata.",
    cleanEmptyError: "Impossibile pulire le aziende vuote.",
    actions: {
      activate: "Riattiva",
      pause: "Metti in pausa",
      archive: "Archivia",
      delete: "Elimina",
      menuLabel: (name) => `Azioni per l'azienda ${name}`,
      changeStatusConfirm: (verb, name) => `${verb} l'azienda "${name}"?`,
      changeStatusVerbActivate: "Riattivare",
      changeStatusVerbPause: "Mettere in pausa",
      changeStatusVerbArchive: "Archiviare",
      changeStatusSuccess: (name, status) => `L'azienda "${name}" ora è ${status}.`,
      changeStatusError: "Impossibile modificare lo stato dell'azienda.",
      deleteConfirm: (name) => `Eliminare definitivamente l'azienda "${name}"? L'azione è irreversibile.`,
      deleteSuccess: (name) => `Azienda "${name}" eliminata.`,
      deleteNotEmpty: (c, s) => `Non si può eliminare: ${c} coach e ${s} allievi collegati. Riassegna o archivia prima.`,
      deleteCoreBlocked: "L'azienda interna GUTO_CORE non può essere rimossa.",
      deleteError: "Impossibile eliminare l'azienda.",
    },
    headerCompany: "AZIENDA / ID",
    headerStatus: "STATO",
    headerPlan: "PIANO",
    headerStudents: "ALLIEVI",
    headerCoaches: "COACH",
    headerCriticals: "CRITICI",
    rowOpen: "Apri",
    empty: "Nessuna azienda trovata.",
  },
  studentsScreen: {
    searchPlaceholder: "Cerca nome, email o telefono…",
    filterActive: "Attivi",
    filterPaused: "In pausa",
    filterArchived: "Archiviati",
    filterAll: "Tutti",
    allCompanies: "Tutte le aziende",
    allCoaches: "Tutti i coach",
    allRisks: "Tutti i rischi",
    riskOk: "In regola",
    riskAttention: "Attenzione",
    riskCritical: "Critico",
    riskNoSignal: "Nessun segnale",
    riskOkShort: "IN REGOLA",
    riskAttentionShort: "ATTENZIONE",
    riskCriticalShort: "CRITICO",
    riskNoSignalShort: "NO SEGN.",
    noCoach: "⚠ SENZA COACH",
    noCoachTitle: "Allievo senza coach assegnato — attenzione operativa",
    inviteAction: "Invito",
    inviteCopied: "Link copiato.",
    inviteError: "Impossibile copiare l'invito.",
    openStudentLabel: "Apri allievo",
    empty: "Nessun allievo trovato.",
  },
  studentDrawer: {
    role: "ALLIEVO",
    tabResumo: "Riepilogo", tabCalibragem: "Calibrazione", tabTreino: "Allenamento",
    tabDieta: "Dieta", tabValidacoes: "Convalide", tabHistorico: "Cronologia", tabAcesso: "Accesso",
  },
  tabResumo: {
    panelOnboarding: "Onboarding", panelProfile: "Profilo",
    panelEvolution: "Evoluzione", panelCurrentPlan: "Piano attuale",
    rowConsent: "Consenso", rowSovereignName: "Nome sovrano",
    rowCalibration: "Calibrazione", rowPact: "Patto", rowSystemActive: "Sistema attivo",
    badgeAccepted: "Accettato", badgePending: "In sospeso", badgeYes: "Sì",
    badgeWaitingOnboarding: "In attesa di onboarding",
    calibComplete: "Completa", calibPartial: "Parziale", calibMissing: "In sospeso",
    rowStatus: "Stato", rowEmail: "Email", rowPhone: "Telefono",
    rowSubscription: "Abbonamento", rowExpiresAt: "Scade il", rowCoach: "Coach",
    rowTeam: "Team", rowArena: "Arena",
    arenaVisible: "Visibile", arenaHidden: "Nascosto",
    rowWeeklyXp: "XP settimanale", rowMonthlyXp: "XP mensile", rowTotalXp: "XP totale",
    rowStreak: "Sequenza", rowValidations: "Convalide", rowAvatar: "Avatar",
    streakDays: (n) => `${n} giorni`,
    rowWorkout: "Allenamento", rowDiet: "Dieta",
    workoutLocked: "bloccato", dietLocked: "bloccata",
    statusArchived: "ARCHIVIATO", statusPaused: "IN PAUSA",
    statusHiddenArena: "NASCOSTO ARENA", statusActive: "ATTIVO",
  },
  tabHistorico: {
    panelWorkout: "Allenamento", panelDiet: "Dieta", panelGeneral: "Generale",
    emptyWorkout: "Nessuna modifica dell'allenamento.",
    emptyDiet: "Nessuna modifica della dieta.",
    emptyGeneral: "Nessuna cronologia.",
  },
  tabValidacoes: {
    panelTitle: "Convalide di allenamento (ultime 5)",
    loading: "Caricamento…",
    empty: "Nessuna convalida registrata.",
    loadError: "Impossibile caricare le convalide.",
    focusLabel: {
      chest_triceps: "Petto · tricipiti", back_biceps: "Schiena · bicipiti",
      legs_core: "Gambe · core", shoulders_abs: "Spalle · addome",
      full_body: "Corpo intero",
    },
    locationLabel: { gym: "Palestra", home: "Casa", park: "Parco" },
    difficultyLabel: { easy: "Leggero", ok: "Giusto", hard: "Pesante", pain: "Dolore" },
    energyLabel: { low: "Bassa", normal: "Normale", high: "Alta" },
    xpUnit: "XP",
    painPrefix: "dolore:",
    energyPrefix: "energia:",
  },
  tabTreino: {
    panelOfficial: "Allenamento ufficiale",
    panelHistory: "Cronologia allenamento",
    panelCustom: "Invia esercizio personalizzato",
    panelWeekly: "Piano settimanale di allenamento",
    fieldTitle: "Titolo", fieldFocus: "Focus / gruppo muscolare",
    fieldDay: "Giorno", fieldLocation: "Luogo",
    fieldDuration: "Durata stimata (min)", fieldDifficulty: "Difficoltà",
    fieldCoachNotes: "Note del coach",
    fieldSets: "Serie", fieldReps: "Rip", fieldLoad: "Carico",
    fieldRest: "Recupero", fieldCue: "Tecnica", fieldNote: "Nota",
    fieldAlternatives: "Alternative",
    fieldOfficialExercise: "Esercizio ufficiale", fieldCatalog: "Catalogo",
    fieldCustomName: "Nome ufficiale", fieldCustomId: "ID opzionale",
    fieldCustomGroup: "Gruppo", fieldCustomEquipment: "Attrezzo",
    fieldCustomFile: "File MP4 sicuro", fieldCustomPath: "Percorso interno",
    fieldCustomBytes: "Byte", fieldCustomDuration: "Durata s",
    fieldCustomWidth: "Width", fieldCustomHeight: "Height", fieldCustomFps: "FPS",
    btnSave: "Salva", btnManual: "Allenamento manuale", btnGenerate: "Genera con GUTO",
    btnDuplicate: "Duplica",
    btnLockToggleAllow: "Consenti aggiornamento GUTO",
    btnLockToggleBlock: "Blocca auto-aggiornamento",
    btnReset: "Reset allenamento",
    btnSubmitCustom: "Invia per approvazione",
    placeholderSearchCatalog: "Cerca catalogo",
    selectLocation: "Seleziona",
    historyEmpty: "Nessuna cronologia di allenamento.",
    toastCustomSubmitted: "Esercizio inviato per approvazione tecnica.",
    toastCustomError: "Errore nel video.",
    toastSavedWeekly: "Piano settimanale salvato.",
    toastWeeklySaveError: "Errore nel salvataggio del piano.",
    todayPrefix: "Oggi",
    weekDays: {
      full: ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"],
      short: ["Dom","Lun","Mar","Mer","Gio","Ven","Sab"],
    },
    duplicatedSuffix: "copia",
  },
  arenaScreen: {
    rankingWeekly: "CLASSIFICA SETTIMANALE",
    rankingMonthly: "CLASSIFICA MENSILE",
    rankingOverall: "CLASSIFICA GENERALE",
    empty: "Nessuna classifica.",
    positionSuffix: "º",
    streakSuffix: "g",
    xpUnit: "XP",
  },
  logsScreen: {
    panelTitle: "Log di sistema",
    empty: "Nessuna azione registrata.",
    sourceCoachLabel: "coach", sourceCoachPrefix: "Coach ·",
    sourceAdminLabel: "admin", sourceAdminPrefix: "Admin ·",
    targetLabel: "target:", metadataLabel: "meta:",
    placeholderSearch: "Cerca azione, autore o target…",
    filterAll: "Tutte",
    bannerLocalFilter: "FILTRO LOCALE",
    bannerLocalFilterCopy: "il backend filtra ancora solo per targetUserId. Filtri server-side per data, azione e severità arrivano nel PR #5.",
    emptyRecords: "Nessun record.",
    actionFallback: "azione",
    paginationCopy: (shown: number, total: number) => `mostrando primi ${shown} di ${total} record`,
  },
  aprovacoesScreen: {
    panelTitle: "Approvazioni esercizi",
    empty: "Nessuna approvazione in sospeso.",
    btnApprove: "Approva", btnReject: "Rifiuta",
    btnSeeVideo: "Vedi video",
    confirmReject: "Rifiutare questo esercizio?",
    toastApproved: "Esercizio approvato.",
    toastRejected: "Esercizio rifiutato.",
    requestedBy: "Richiesto da:", submittedAt: "Inviato il:",
    duration: "Durata:", sizeMb: "Dimensione:",
    bannerTitle: "Solo admin / super admin approva. I coach solo suggeriscono.",
    bannerCopy: "Gli elementi approvati entrano nella Banca del GUTO e possono essere usati in allenamenti / diete futuri.",
    rulesTitle: "REGOLE DEL VIDEO",
    rule1: "✓ Video obbligatorio",
    rule2: "✓ Formato MP4 raccomandato",
    rule3: "✓ Durata massima 15 secondi",
    rule4: "✓ Approvazione obbligatoria di admin / super_admin",
    riskTitle: "RISCHIO IN SOSPESO",
    riskCopy: "il backend oggi accetta fino a 30s (MAX_DURATION_SECONDS=30). CEREBROGUTO deve stringere il limite a 15s prima che entri la prossima ondata di esercizi.",
    tabExercises: "Esercizi in sospeso", tabFoods: "Alimenti in sospeso",
    emptyExercises: "Tutto in ordine. Nessun esercizio in attesa di approvazione.",
    pillPending: "IN SOSPESO", pillVideoOk: "VIDEO OK", pillVideoInvalid: "VIDEO NON VALIDO",
    miniDuration: "DURATA", miniSize: "DIMENSIONE",
    miniResolution: "RISOLUZIONE", miniFps: "FPS",
    sentBy: (user, role, date) => `inviato da ${user} · ${role} · ${date}`,
    blockReasonNotValidated: "Il video deve passare la validazione tecnica del backend",
    blockReasonTooLong: "Video oltre 15 secondi — limite attuale della Sala di Controllo",
    rejectPrompt: "Motivo del rifiuto (opzionale):",
    foodsKicker: "ENDPOINT IN SOSPESO",
    foodsTitle: "Il catalogo di alimenti non esiste ancora nel backend.",
    foodsCopy: "Le approvazioni di alimenti (con lingue PT/IT/EN/ES, paese, macros, allergeni e restrizioni) arrivano nel PR #4, insieme al modello di alimento, CRUD del catalogo e flusso di suggerimento per coach. Per ora, questa scheda è visibile solo per mostrare che esiste il suo posto.",
  },
  bancoScreen: {
    panelTitle: "Banca GUTO",
    empty: "Catalogo vuoto.",
    placeholderSearch: "Cerca esercizio…",
    countLabel: "esercizi nel catalogo",
    actionEdit: "Modifica", actionReview: "Rivedi",
    bannerTitle: "Catalogo approvato · usato dal GUTO in allenamenti e diete.",
    bannerCopy: "Le approvazioni in sospeso sono nella schermata Approvazioni. Qui è solo lettura per ora — modifica/disattivazione arriva in un PR successivo.",
    tabExercises: "Esercizi", tabFoods: "Alimenti",
    filterAll: "Tutti",
    emptyCatalog: "Catalogo vuoto. In attesa di esercizi approvati.",
    emptyFiltered: "Nessun esercizio trovato con questi filtri.",
    videoTitle: "Vedi video",
    countCopy: (shown: number, total: number) => `${shown} di ${total} esercizi approvati`,
    foodsKicker: "ENDPOINT IN SOSPESO",
    foodsTitle: "Catalogo di alimenti in attesa del backend.",
    foodsCopy: "Modello di alimento (lingue PT/IT/EN/ES, paese, macros, allergeni, restrizioni) + CRUD del catalogo arrivano nel PR #4.",
  },
  tabDieta: {
    panelOfficial: "Dieta ufficiale",
    panelHistory: "Cronologia dieta",
    panelWeekly: "Piano settimanale della dieta",
    fieldTitle: "Titolo", fieldCountry: "Paese", fieldKcal: "Calorie (kcal)",
    fieldProtein: "Proteine (g)", fieldCarbs: "Carbo (g)", fieldFat: "Grassi (g)",
    fieldRestrictions: "Restrizioni", fieldCoachNotes: "Note del coach",
    fieldMealName: "Pasto", fieldMealTime: "Orario",
    fieldMealKcal: "Kcal totali", fieldMealAlternatives: "Alternative",
    placeholderFood: "Alimento", placeholderQuantity: "Quantità",
    btnSave: "Salva", btnManual: "Dieta manuale", btnGenerate: "Genera con GUTO",
    btnLockToggleAllow: "Consenti aggiornamento GUTO",
    btnLockToggleBlock: "Blocca auto-aggiornamento",
    btnReset: "Reset dieta",
    historyEmpty: "Nessuna cronologia di dieta.",
    weeklyIntro: "Componi la dieta di ogni giorno. L'allievo vedrà la dieta del giorno.",
    toastSavedWeekly: "Piano settimanale di dieta salvato.",
    toastWeeklySaveError: "Errore nel salvataggio del piano settimanale di dieta.",
  },
  empresaDrawer: {
    close: "Chiudi",
    tabResumo: "Riepilogo", tabCoaches: "Coach", tabAlunos: "Allievi",
    tabPlano: "Piano", tabLogs: "Log",
    sectionUsage: "USO ATTUALE", sectionStatus: "STATO",
    sectionContact: "CONTATTO", sectionPlanDetails: "DETTAGLI DEL PIANO",
    rowPlan: "Piano", rowStatus: "Stato", rowCoaches: "Coach",
    rowActiveStudents: "Allievi attivi", rowCriticalStudents: "Allievi critici",
    rowCreatedAt: "Creata il", rowEmail: "Email", rowPhone: "Telefono",
    rowAddress: "Indirizzo", rowCityCountry: "Città / Paese",
    rowStudentLimit: "Limite allievi", rowCoachLimit: "Limite coach",
    rowUpdatedAt: "Aggiornata il",
    unlimited: "illimitato",
    btnAddCoach: "+ Coach", btnAddStudent: "+ Allievo", btnRefresh: "Aggiorna",
  },
  coachDrawer: {
    roleBadge: "COACH",
    statusActive: "ATTIVO", statusPaused: "IN PAUSA",
    close: "Chiudi",
    tabResumo: "RIEPILOGO", tabAlunos: "ALLIEVI", tabTreinos: "ALLENAMENTI",
    tabDietas: "DIETE", tabLogs: "LOG",
    sectionPerformance: "PRESTAZIONI", sectionData: "DATI",
    rowActiveStudents: "Allievi attivi", rowCriticals: "Critici",
    rowAttention: "Attenzione", rowNoSignal: "Nessun segnale",
    rowTotalAssigned: "Totale assegnati",
    rowEmail: "Email", rowPhone: "Telefono", rowStatus: "Stato",
    rowCreatedAt: "Creato il",
    emptyNoStudents: "Questo coach non ha allievi assegnati.",
    emptyQueue: "Nessun allievo per questo coach.",
    lastValidation: (rel) => `ultima convalida ${rel}`,
    editWorkout: "Modifica allenamento ›", editDiet: "Modifica dieta ›",
    emptyLogs: "Nessuna azione registrata.",
    logActionFallback: "azione", logTargetPrefix: "target ·",
    riskOkShort: "IN REGOLA", riskAttentionShort: "ATTENZIONE",
    riskCriticalShort: "CRITICO", riskNoSignalShort: "NO SEGN.",
  },
  dialogs: {
    createStudent: {
      badge: "NUOVO ALLIEVO",
      title: "Nuovo allievo",
      description: "Registra un allievo e genera l'invito di accesso.",
      fieldName: "Nome", fieldEmail: "Email", fieldPhone: "Telefono",
      fieldPassword: "Password (opzionale)", fieldCompany: "Azienda",
      fieldCoach: "Coach", fieldSex: "Sesso biologico", fieldAge: "Età",
      placeholderName: "Nome completo dell'allievo",
      placeholderEmail: "allievo@email.com",
      placeholderPhone: "+39 333 0000 000",
      placeholderPassword: "Lascia vuoto per inviare l'invito",
      placeholderAge: "Es: 28",
      selectCompany: "Seleziona azienda…",
      selectCoach: "Seleziona coach…",
      noCoachInTeamHint: "Questa azienda non ha ancora coach. Crea un coach prima di creare un allievo.",
      cancel: "Annulla", create: "Crea allievo", creating: "Creazione…",
      lockedTeamHint: (name) => `Azienda bloccata: ${name}`,
    },
    createCoach: {
      badge: "NUOVO COACH",
      title: "Nuovo coach",
      description: "Registra un coach all'interno di un'azienda.",
      fieldName: "Nome", fieldEmail: "Email",
      fieldPassword: "Password (opzionale)", fieldCompany: "Azienda",
      placeholderName: "Nome completo del coach",
      placeholderEmail: "coach@email.com",
      placeholderPassword: "Lascia vuoto per inviare l'invito",
      selectCompany: "Seleziona azienda…",
      cancel: "Annulla", create: "Crea coach", creating: "Creazione…",
    },
    createTeam: {
      badge: "NUOVA AZIENDA",
      title: "Nuova azienda",
      description: "Registra un'azienda cliente B2B.",
      fieldName: "Nome dell'azienda", fieldPlan: "Piano",
      fieldMaxStudents: "Max allievi", fieldMaxCoaches: "Max coach",
      fieldEmail: "Email di contatto", fieldPhone: "Telefono",
      fieldAddress: "Indirizzo", fieldCity: "Città",
      fieldCountry: "Paese", fieldStatus: "Stato",
      placeholderName: "Es: Studio Vertice",
      placeholderEmail: "contatto@azienda.com",
      placeholderPhone: "+39 0000 000 000",
      placeholderAddress: "Via, numero, quartiere",
      placeholderCity: "Roma",
      placeholderCountry: "IT",
      planStart: "Start", planPro: "Pro", planElite: "Elite", planCustom: "Custom",
      cancel: "Annulla", create: "Crea azienda", creating: "Creazione…",
    },
  },
  tabCalibragem: {
    panelTitle: "Calibrazione dell'allievo",
    fieldBiologicalSex: "Sesso biologico",
    fieldAge: "Età",
    fieldTrainingLevel: "Livello di allenamento",
    fieldGoal: "Obiettivo",
    fieldPreferredLocation: "Luogo preferito",
    fieldCountry: "Paese",
    fieldCity: "Città",
    fieldHeightCm: "Altezza (cm)",
    fieldWeightKg: "Peso (kg)",
    fieldPathology: "Dolore o limitazione",
    fieldFoodRestrictions: "Restrizioni alimentari",
    selectPlaceholder: "Seleziona",
    placeholderAge: "Es: 28",
    placeholderCountry: "Es: IT",
    placeholderCity: "Es: Roma",
    placeholderHeight: "Es: 175",
    placeholderWeight: "Es: 80",
    placeholderPathology: "Es: dolore al ginocchio",
    placeholderFoodRestrictions: "Es: senza lattosio",
    saveBtn: "Salva calibrazione",
    toastSaved: "Calibrazione aggiornata.",
    biologicalSex: { male: "Maschile", female: "Femminile" },
    trainingLevel: {
      beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzato",
      returning: "Di ritorno", consistent: "Costante",
    },
    trainingGoal: {
      muscle_gain: "Aumento massa", fat_loss: "Perdita grasso",
      endurance: "Resistenza", flexibility: "Flessibilità",
      general_fitness: "Forma fisica generale", rehabilitation: "Riabilitazione",
      maintenance: "Mantenimento", conditioning: "Condizionamento",
      mobility_health: "Mobilità e salute", consistency: "Costanza",
    },
    trainingLocation: {
      gym: "Palestra", home: "Casa", park: "All'aperto", mixed: "Misto",
    },
  },
  tabAcesso: {
    panelControl: "Controllo accesso", panelInvite: "Invito di accesso", panelSecurity: "Sicurezza",
    btnPause: "Metti in pausa", btnReactivate: "Riattiva accesso",
    btnRenew30: "Rinnova 30 giorni",
    btnArenaHide: "Nascondi dall'Arena", btnArenaShow: "Mostra in Arena",
    assignCoachPlaceholder: "Assegna coach…",
    btnViewInvite: "Vedi invito attuale", btnRegenInvite: "Rigenera invito",
    btnResetPassword: "Genera password temporanea",
    btnDelete: "Elimina definitivamente",
    confirmRegen: "Rigenerare l'invito? Il link precedente smette di funzionare.",
    confirmDelete: "Eliminare definitivamente questo allievo e tutti i dati collegati?",
    toastPaused: "Accesso in pausa.",
    toastReactivated: "Accesso riattivato.",
    toastRenewed: "Accesso rinnovato per 30 giorni.",
    toastArenaHidden: "Allievo nascosto dall'Arena.",
    toastArenaShown: "Allievo visibile in Arena.",
    toastCoachAssigned: "Allievo assegnato al coach.",
    toastInviteLoaded: "Invito caricato.",
    toastInviteUnavailable: "Link non disponibile. Usa rigenera per crearne uno nuovo.",
    toastInviteRegenerated: "Nuovo invito generato.",
    toastLinkCopied: "Link copiato!",
    toastPasswordGenerated: "Password temporanea generata.",
    toastDeleted: "Allievo eliminato definitivamente.",
    tempPasswordLabel: "Password temporanea",
  },
}

const DICT: Record<PanelLang, Dict> = { "pt-BR": PT, "en-US": EN, "it-IT": IT }

export function usePanelI18n(): { lang: PanelLang; setLang: (next: PanelLang) => void; t: Dict } {
  const [lang, setLang] = usePanelLanguage()
  return { lang, setLang, t: DICT[lang] }
}

// Acesso direto fora de componente React (utilitários, helpers que recebem
// language como parâmetro). NÃO usar em componente — use o hook acima.
export function panelDict(lang: PanelLang): Dict {
  return DICT[lang]
}
