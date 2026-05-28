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
    biologicalSex: { male: "Masculino", female: "Feminino", other: "Outro" },
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
    biologicalSex: { male: "Male", female: "Female", other: "Other" },
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
    biologicalSex: { male: "Maschile", female: "Femminile", other: "Altro" },
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
