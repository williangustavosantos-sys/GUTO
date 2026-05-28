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
