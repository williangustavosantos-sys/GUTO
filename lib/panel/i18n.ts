"use client"

// Minimal i18n for the panel surfaces. Mirrors the key namespace from
// design_handoff_guto_coach_panel/i18n.jsx but only ships the keys the
// shell + first screens use. Extend as more screens land.

import { createContext, useCallback, useContext, useEffect, useState } from "react"

export type PanelLang = "pt" | "en" | "it"

const STORAGE_KEY = "guto-panel-lang"

const DICT: Record<PanelLang, Record<string, string>> = {
  pt: {
    "app.sala": "Sala de Controle",
    "app.empresa": "Empresa Portal",
    "app.coach": "Coach Portal",

    "nav.ops": "Operação",
    "nav.cadastros": "Cadastros",
    "nav.conteudo": "Conteúdo",
    "nav.analise": "Análise",
    "nav.minha_empresa": "Minha Empresa",

    "nav.hoje": "Hoje",
    "nav.inicio": "Início",
    "nav.aprovacoes": "Aprovações",
    "nav.empresas": "Empresas",
    "nav.coaches": "Coaches",
    "nav.alunos": "Alunos",
    "nav.meus_alunos": "Meus Alunos",
    "nav.visao_geral": "Visão Geral",
    "nav.treinos": "Treinos",
    "nav.dietas": "Dietas",
    "nav.arena": "Arena",
    "nav.logs": "Logs",

    "screen.hoje.t": "Hoje",
    "screen.hoje.s": "Visão geral do dia",
    "screen.visao_geral.t": "Visão Geral",
    "screen.visao_geral.s": "Status do portal",
    "screen.empresas.t": "Empresas",
    "screen.empresas.s": "Gestão de clientes",
    "screen.alunos.t": "Alunos",
    "screen.alunos.s": "Base global da plataforma",
    "screen.coaches.t": "Coaches",
    "screen.coaches.s": "Equipe operacional",
    "screen.treinos.t": "Treinos",
    "screen.treinos.s": "Fila de revisão",
    "screen.dietas.t": "Dietas",
    "screen.dietas.s": "Fila de revisão",
    "screen.aprovacoes.t": "Aprovações",
    "screen.aprovacoes.s": "Catálogo pendente",
    "screen.arena.t": "Arena",
    "screen.arena.s": "Rankings globais",
    "screen.logs.t": "Logs",
    "screen.logs.s": "Auditoria",
    "screen.meus_alunos.t": "Meus Alunos",
    "screen.meus_alunos.s": "Sua carteira",

    "btn.nova_empresa": "Nova empresa",
    "btn.novo_coach": "Novo coach",
    "btn.novo_aluno": "Novo aluno",
    "btn.ver_todos": "Ver todos",
    "btn.ver_todas": "Ver todas",

    "misc.sys_online": "Sistema OK",
    "misc.pendentes": "pendentes",

    "kpi.empresas_ativas": "Empresas ativas",
    "kpi.alunos_ativos": "Alunos ativos",
    "kpi.criticos": "Críticos",
    "kpi.pendentes": "Pendentes",
    "kpi.sub.cadastradas": "{n} cadastradas",
    "kpi.sub.acesso_liberado": "com acesso liberado",
    "kpi.sub.validacoes_dia": "validações no dia",
    "kpi.sub.7d_parado": "7+ dias parado",
    "kpi.sub.catalogo_aguardando": "catálogo aguardando",

    "card.precisam_atencao": "Alunos que precisam de atenção",
    "card.precisam_atencao.sub.zero": "Todos em dia.",
    "card.precisam_atencao.sub.n": "{n} aluno fora do ritmo",
    "card.precisam_atencao.sub.np": "{n} alunos fora do ritmo",
    "card.empresas_ativas": "Empresas ativas",
    "card.empresas_ativas.sub": "{a} de {b} operando",

    "risk.ok": "Em dia",
    "risk.atencao": "Atenção",
    "risk.critico": "Crítico",
    "risk.sem-sinal": "Sem sinal",
    "risk.pausado": "Pausado",

    "list.ultimo_treino": "último treino {t}",
    "list.sem_sinal": "sem sinal",

    "footer.role.super": "Super",
    "footer.role.admin": "Admin",
    "footer.role.coach": "Coach",
  },

  en: {
    "app.sala": "Control Room",
    "app.empresa": "Company Portal",
    "app.coach": "Coach Portal",

    "nav.ops": "Operations",
    "nav.cadastros": "Records",
    "nav.conteudo": "Content",
    "nav.analise": "Analytics",
    "nav.minha_empresa": "My Company",

    "nav.hoje": "Today",
    "nav.inicio": "Home",
    "nav.aprovacoes": "Approvals",
    "nav.empresas": "Companies",
    "nav.coaches": "Coaches",
    "nav.alunos": "Students",
    "nav.meus_alunos": "My Students",
    "nav.visao_geral": "Overview",
    "nav.treinos": "Workouts",
    "nav.dietas": "Diets",
    "nav.arena": "Arena",
    "nav.logs": "Logs",

    "screen.hoje.t": "Today",
    "screen.hoje.s": "Daily overview",
    "screen.visao_geral.t": "Overview",
    "screen.visao_geral.s": "Portal status",
    "screen.empresas.t": "Companies",
    "screen.empresas.s": "Client management",
    "screen.alunos.t": "Students",
    "screen.alunos.s": "Platform-wide roster",
    "screen.coaches.t": "Coaches",
    "screen.coaches.s": "Ops team",
    "screen.treinos.t": "Workouts",
    "screen.treinos.s": "Review queue",
    "screen.dietas.t": "Diets",
    "screen.dietas.s": "Review queue",
    "screen.aprovacoes.t": "Approvals",
    "screen.aprovacoes.s": "Pending catalogue",
    "screen.arena.t": "Arena",
    "screen.arena.s": "Global rankings",
    "screen.logs.t": "Logs",
    "screen.logs.s": "Audit trail",
    "screen.meus_alunos.t": "My Students",
    "screen.meus_alunos.s": "Your roster",

    "btn.nova_empresa": "New company",
    "btn.novo_coach": "New coach",
    "btn.novo_aluno": "New student",
    "btn.ver_todos": "View all",
    "btn.ver_todas": "View all",

    "misc.sys_online": "System OK",
    "misc.pendentes": "pending",

    "kpi.empresas_ativas": "Active companies",
    "kpi.alunos_ativos": "Active students",
    "kpi.criticos": "Critical",
    "kpi.pendentes": "Pending",
    "kpi.sub.cadastradas": "{n} registered",
    "kpi.sub.acesso_liberado": "with access",
    "kpi.sub.validacoes_dia": "validations today",
    "kpi.sub.7d_parado": "7+ days inactive",
    "kpi.sub.catalogo_aguardando": "catalogue waiting",

    "card.precisam_atencao": "Students needing attention",
    "card.precisam_atencao.sub.zero": "All on track.",
    "card.precisam_atencao.sub.n": "{n} student off pace",
    "card.precisam_atencao.sub.np": "{n} students off pace",
    "card.empresas_ativas": "Active companies",
    "card.empresas_ativas.sub": "{a} of {b} running",

    "risk.ok": "On track",
    "risk.atencao": "Attention",
    "risk.critico": "Critical",
    "risk.sem-sinal": "No signal",
    "risk.pausado": "Paused",

    "list.ultimo_treino": "last workout {t}",
    "list.sem_sinal": "no signal",

    "footer.role.super": "Super",
    "footer.role.admin": "Admin",
    "footer.role.coach": "Coach",
  },

  it: {
    "app.sala": "Sala di Controllo",
    "app.empresa": "Portale Azienda",
    "app.coach": "Portale Coach",

    "nav.ops": "Operazioni",
    "nav.cadastros": "Anagrafiche",
    "nav.conteudo": "Contenuto",
    "nav.analise": "Analisi",
    "nav.minha_empresa": "La mia Azienda",

    "nav.hoje": "Oggi",
    "nav.inicio": "Home",
    "nav.aprovacoes": "Approvazioni",
    "nav.empresas": "Aziende",
    "nav.coaches": "Coach",
    "nav.alunos": "Studenti",
    "nav.meus_alunos": "I Miei Studenti",
    "nav.visao_geral": "Panoramica",
    "nav.treinos": "Allenamenti",
    "nav.dietas": "Diete",
    "nav.arena": "Arena",
    "nav.logs": "Log",

    "screen.hoje.t": "Oggi",
    "screen.hoje.s": "Panoramica del giorno",
    "screen.visao_geral.t": "Panoramica",
    "screen.visao_geral.s": "Stato del portale",
    "screen.empresas.t": "Aziende",
    "screen.empresas.s": "Gestione clienti",
    "screen.alunos.t": "Studenti",
    "screen.alunos.s": "Base globale",
    "screen.coaches.t": "Coach",
    "screen.coaches.s": "Team operativo",
    "screen.treinos.t": "Allenamenti",
    "screen.treinos.s": "Coda di revisione",
    "screen.dietas.t": "Diete",
    "screen.dietas.s": "Coda di revisione",
    "screen.aprovacoes.t": "Approvazioni",
    "screen.aprovacoes.s": "Catalogo in attesa",
    "screen.arena.t": "Arena",
    "screen.arena.s": "Classifiche globali",
    "screen.logs.t": "Log",
    "screen.logs.s": "Audit",
    "screen.meus_alunos.t": "I Miei Studenti",
    "screen.meus_alunos.s": "Il tuo portfolio",

    "btn.nova_empresa": "Nuova azienda",
    "btn.novo_coach": "Nuovo coach",
    "btn.novo_aluno": "Nuovo studente",
    "btn.ver_todos": "Vedi tutti",
    "btn.ver_todas": "Vedi tutte",

    "misc.sys_online": "Sistema OK",
    "misc.pendentes": "in attesa",

    "kpi.empresas_ativas": "Aziende attive",
    "kpi.alunos_ativos": "Studenti attivi",
    "kpi.criticos": "Critici",
    "kpi.pendentes": "In attesa",
    "kpi.sub.cadastradas": "{n} registrate",
    "kpi.sub.acesso_liberado": "con accesso attivo",
    "kpi.sub.validacoes_dia": "validazioni oggi",
    "kpi.sub.7d_parado": "7+ giorni inattivi",
    "kpi.sub.catalogo_aguardando": "catalogo in attesa",

    "card.precisam_atencao": "Studenti da seguire",
    "card.precisam_atencao.sub.zero": "Tutti in regola.",
    "card.precisam_atencao.sub.n": "{n} studente fuori ritmo",
    "card.precisam_atencao.sub.np": "{n} studenti fuori ritmo",
    "card.empresas_ativas": "Aziende attive",
    "card.empresas_ativas.sub": "{a} di {b} operative",

    "risk.ok": "In regola",
    "risk.atencao": "Attenzione",
    "risk.critico": "Critico",
    "risk.sem-sinal": "Nessun segnale",
    "risk.pausado": "In pausa",

    "list.ultimo_treino": "ultimo allenamento {t}",
    "list.sem_sinal": "nessun segnale",

    "footer.role.super": "Super",
    "footer.role.admin": "Admin",
    "footer.role.coach": "Coach",
  },
}

function readStoredLang(): PanelLang {
  if (typeof window === "undefined") return "pt"
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === "pt" || raw === "en" || raw === "it") return raw
  return "pt"
}

function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""))
}

interface PanelI18nContextValue {
  lang: PanelLang
  setLang: (l: PanelLang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

export const PanelI18nContext = createContext<PanelI18nContextValue | null>(null)

export function usePanelI18n(): PanelI18nContextValue {
  const ctx = useContext(PanelI18nContext)
  if (!ctx) throw new Error("usePanelI18n must be used inside <PanelI18nProvider>")
  return ctx
}

export function usePanelI18nState() {
  const [lang, setLangState] = useState<PanelLang>("pt")
  useEffect(() => {
    setLangState(readStoredLang())
  }, [])
  const setLang = useCallback((next: PanelLang) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const tpl = DICT[lang][key] ?? DICT.pt[key] ?? key
      return format(tpl, vars)
    },
    [lang],
  )
  return { lang, setLang, t }
}
