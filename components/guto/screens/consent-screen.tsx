"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, Brain, Shield } from "lucide-react"
import Link from "next/link"

interface ConsentScreenProps {
  language?: string
  onComplete: () => void
}

const consentCopy: Record<string, {
  headline: string
  subtext: string
  aiTitle: string
  aiBody: string
  dataTitle: string
  dataBody: string
  safetyTitle: string
  safetyBody: string
  checkHealth: string
  checkTerms: string
  termsLabel: string
  and: string
  privacyLabel: string
  cta: string
}> = {
  "pt-BR": {
    headline: "Antes de começar",
    subtext: "Leia e confirme abaixo para continuar.",
    aiTitle: "O GUTO é uma IA",
    aiBody: "O GUTO é um assistente digital com inteligência artificial. Ele ajuda com treino, dieta e rotina, mas não substitui avaliação médica, nutricional ou profissional presencial.",
    dataTitle: "Uso de dados de saúde e fitness",
    dataBody: "Para gerar treinos, dietas e acompanhamento, o GUTO usa dados como peso, altura, objetivo, limitações, patologias, restrições alimentares e histórico de treino.",
    safetyTitle: "Responsabilidade",
    safetyBody: "Se você sentir dor, tontura, mal-estar ou tiver condição médica, interrompa o treino e procure um profissional.",
    checkHealth: "Li e aceito que o GUTO use meus dados de saúde/fitness para gerar treino, dieta e acompanhamento.",
    checkTerms: "Li e aceito os",
    termsLabel: "Termos de Uso",
    and: "e a",
    privacyLabel: "Política de Privacidade",
    cta: "Continuar",
  },
  "en-US": {
    headline: "Before you start",
    subtext: "Read and confirm below to continue.",
    aiTitle: "GUTO is an AI",
    aiBody: "GUTO is a digital assistant powered by artificial intelligence. It helps with training, diet, and routine, but does not replace medical, nutritional, or in-person professional evaluation.",
    dataTitle: "Use of health & fitness data",
    dataBody: "To generate workouts, diets, and tracking, GUTO uses data such as weight, height, goals, limitations, pathologies, dietary restrictions, and training history.",
    safetyTitle: "Responsibility",
    safetyBody: "If you feel pain, dizziness, discomfort, or have a medical condition, stop training and seek a professional.",
    checkHealth: "I have read and accept that GUTO may use my health/fitness data to generate training, diet, and tracking.",
    checkTerms: "I have read and accept the",
    termsLabel: "Terms of Use",
    and: "and the",
    privacyLabel: "Privacy Policy",
    cta: "Continue",
  },
  "it-IT": {
    headline: "Prima di iniziare",
    subtext: "Leggi e conferma qui sotto per continuare.",
    aiTitle: "GUTO è una IA",
    aiBody: "GUTO è un assistente digitale con intelligenza artificiale. Aiuta con allenamento, dieta e routine, ma non sostituisce la valutazione medica, nutrizionale o professionale in presenza.",
    dataTitle: "Uso dei dati di salute e fitness",
    dataBody: "Per generare allenamenti, diete e monitoraggio, GUTO utilizza dati come peso, altezza, obiettivi, limitazioni, patologie, restrizioni alimentari e storico degli allenamenti.",
    safetyTitle: "Responsabilità",
    safetyBody: "Se senti dolore, vertigini, malessere o hai una condizione medica, interrompi l'allenamento e rivolgiti a un professionista.",
    checkHealth: "Ho letto e accetto che GUTO utilizzi i miei dati di salute/fitness per generare allenamenti, dieta e monitoraggio.",
    checkTerms: "Ho letto e accetto i",
    termsLabel: "Termini di Utilizzo",
    and: "e la",
    privacyLabel: "Informativa sulla Privacy",
    cta: "Continua",
  },
}

function ConsentCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      className="flex cursor-pointer items-start gap-3"
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") onChange(!checked) }}
    >
      <div
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors"
        style={
          checked
            ? { borderColor: "var(--guto-cyan)", background: "var(--guto-cyan)" }
            : { borderColor: "rgba(13,35,65,0.2)", background: "white" }
        }
      >
        {checked && (
          <svg viewBox="0 0 10 8" className="h-3 w-3" fill="none" stroke="var(--guto-navy)" strokeWidth="2">
            <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="select-none text-sm leading-relaxed text-[rgba(13,35,65,0.75)]">{children}</span>
    </div>
  )
}

export function ConsentScreen({ language = "pt-BR", onComplete }: ConsentScreenProps) {
  const t = consentCopy[language] ?? consentCopy["pt-BR"]
  const [checkHealth, setCheckHealth] = useState(false)
  const [checkTerms, setCheckTerms] = useState(false)
  const canContinue = checkHealth && checkTerms

  return (
    <motion.section
      className="absolute inset-0 z-30 flex flex-col overflow-y-auto bg-white px-6 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-6">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[rgba(13,35,65,0.35)]">GUTO</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight" style={{ color: "var(--guto-navy)" }}>
          {t.headline}
        </h1>
        <p className="mt-1 text-sm text-[rgba(13,35,65,0.55)]">{t.subtext}</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-[rgba(13,35,65,0.08)] bg-[rgba(13,35,65,0.02)] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4 opacity-50" style={{ color: "var(--guto-navy)" }} />
            <p className="font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              {t.aiTitle}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-[rgba(13,35,65,0.7)]">{t.aiBody}</p>
        </div>

        <div className="rounded-2xl border border-[rgba(13,35,65,0.08)] bg-[rgba(13,35,65,0.02)] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 opacity-50" style={{ color: "var(--guto-navy)" }} />
            <p className="font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              {t.dataTitle}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-[rgba(13,35,65,0.7)]">{t.dataBody}</p>
        </div>

        <div className="rounded-2xl border border-[rgba(82,231,255,0.3)] bg-[rgba(82,231,255,0.04)] p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--guto-cyan)" }} />
            <p className="font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              {t.safetyTitle}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-[rgba(13,35,65,0.7)]">{t.safetyBody}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <ConsentCheckbox checked={checkHealth} onChange={setCheckHealth}>
          {t.checkHealth}
        </ConsentCheckbox>

        <ConsentCheckbox checked={checkTerms} onChange={setCheckTerms}>
          {t.checkTerms}{" "}
          <Link
            href={`/terms?lang=${language}`}
            target="_blank"
            rel="noopener"
            className="font-semibold underline"
            style={{ color: "var(--guto-navy)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {t.termsLabel}
          </Link>{" "}
          {t.and}{" "}
          <Link
            href={`/privacy?lang=${language}`}
            target="_blank"
            rel="noopener"
            className="font-semibold underline"
            style={{ color: "var(--guto-navy)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {t.privacyLabel}
          </Link>
          .
        </ConsentCheckbox>
      </div>

      <div className="mt-8 pb-6">
        <button
          type="button"
          onClick={canContinue ? onComplete : undefined}
          disabled={!canContinue}
          className={`w-full rounded-full py-4 font-mono text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
            canContinue ? "cursor-pointer active:scale-95" : "cursor-not-allowed"
          }`}
          style={
            canContinue
              ? {
                  background: "var(--guto-cyan)",
                  color: "var(--guto-navy)",
                  boxShadow: "0 4px 16px rgba(82,231,255,0.3)",
                }
              : {
                  background: "rgba(13,35,65,0.06)",
                  color: "rgba(13,35,65,0.3)",
                }
          }
        >
          {t.cta}
        </button>
      </div>
    </motion.section>
  )
}
