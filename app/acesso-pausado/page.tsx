"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { useGutoViewport } from "@/hooks/use-guto-viewport"
import { resolveGutoLanguage } from "@/lib/guto-profile"
import { Clock } from "lucide-react"

type Lang = "pt-BR" | "it-IT" | "en-US"
type Reason = "paused" | "expired" | "deceased"

const REASON_CODES: Record<string, Reason> = {
  ACCESS_PAUSED: "paused",
  ACCESS_EXPIRED: "expired",
  SUBSCRIPTION_EXPIRED: "expired",
  GUTO_DECEASED: "deceased",
  GUTO_DEAD: "deceased",
}

function isSupportedLang(v: string): v is Lang {
  return ["pt-BR", "it-IT", "en-US"].includes(v)
}

function resolveReason(raw: string | null): Reason {
  if (!raw) return "paused"
  const upper = raw.toUpperCase()
  return REASON_CODES[upper] ?? "paused"
}

const T: Record<Lang, Record<Reason, {
  title: string
  body: string
  retry: string
  logout: string
  footer: string
}>> = {
  "pt-BR": {
    paused: {
      title: "Acesso Pausado",
      body: "Seu ciclo atual no GUTO encerrou ou está aguardando ativação. A gente continua daqui quando você renovar.",
      retry: "Tentar Novamente",
      logout: "Sair da Conta",
      footer: "Fale com seu coach para reativar.",
    },
    expired: {
      title: "Acesso Expirado",
      body: "Sua assinatura terminou. Renove para continuar treinando com o GUTO de onde parou.",
      retry: "Tentar Novamente",
      logout: "Sair da Conta",
      footer: "Fale com seu coach ou admin para renovar.",
    },
    deceased: {
      title: "O GUTO apagou",
      body: "Este acesso terminou. Para continuar, fale com o admin do GUTO.",
      retry: "Tentar Novamente",
      logout: "Sair da Conta",
      footer: "Apenas o admin pode liberar um novo acesso.",
    },
  },
  "en-US": {
    paused: {
      title: "Access Paused",
      body: "Your current GUTO cycle has ended or is waiting for activation. We pick up from here when you renew.",
      retry: "Try Again",
      logout: "Sign Out",
      footer: "Talk to your coach to reactivate.",
    },
    expired: {
      title: "Access Expired",
      body: "Your subscription has ended. Renew to keep training with GUTO right where you left off.",
      retry: "Try Again",
      logout: "Sign Out",
      footer: "Talk to your coach or admin to renew.",
    },
    deceased: {
      title: "GUTO has gone dark",
      body: "This access has ended. To continue, talk to the GUTO admin.",
      retry: "Try Again",
      logout: "Sign Out",
      footer: "Only the admin can release a new access.",
    },
  },
  "it-IT": {
    paused: {
      title: "Accesso in Pausa",
      body: "Il tuo ciclo attuale su GUTO è terminato o è in attesa di attivazione. Riprendiamo da qui quando rinnovi.",
      retry: "Riprova",
      logout: "Esci dall'account",
      footer: "Parla con il tuo coach per riattivare.",
    },
    expired: {
      title: "Accesso Scaduto",
      body: "Il tuo abbonamento è terminato. Rinnova per continuare ad allenarti con GUTO da dove avevi lasciato.",
      retry: "Riprova",
      logout: "Esci dall'account",
      footer: "Parla con il tuo coach o admin per rinnovare.",
    },
    deceased: {
      title: "GUTO si è spento",
      body: "Questo accesso è terminato. Per continuare, parla con l'admin di GUTO.",
      retry: "Riprova",
      logout: "Esci dall'account",
      footer: "Solo l'admin può rilasciare un nuovo accesso.",
    },
  },
}

function PausedAccessContent() {
  const { logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [lang, setLang] = useState<Lang>("pt-BR")
  const reason = resolveReason(searchParams.get("reason"))
  const shellRef = useRef<HTMLDivElement | null>(null)
  useGutoViewport(shellRef)

  useEffect(() => {
    if (typeof window === "undefined") return
    const fromQuery = searchParams.get("lang") ?? ""
    const onboardingLanguage = window.localStorage.getItem("guto-onboarding-language")
    const selectedLanguage = window.localStorage.getItem("guto-selected-language")
    const resolved = resolveGutoLanguage({
      scope: "private",
      onboardingLanguage: isSupportedLang(fromQuery) ? fromQuery : onboardingLanguage,
      globalStoredLanguage: selectedLanguage,
      fallbackLanguage: "pt-BR",
    })
    setLang(resolved)
    try {
      document.documentElement.lang = resolved
    } catch {
      // Document mutation can fail in obscure environments — visible copy still follows resolved.
    }
  }, [searchParams])

  const copy = T[lang][reason]

  return (
    <div ref={shellRef} className="sala-guto flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <div className="mb-8 flex flex-col items-center">
        <div className="guto-deboss mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <Clock className="h-10 w-10 text-[rgba(13,35,65,0.2)]" />
        </div>
        <Image
          src="/assets/guto/logo_guto.png"
          alt="GUTO"
          width={140}
          height={46}
          className="opacity-40 grayscale"
          style={{ height: "auto" }}
        />
      </div>

      <div className="max-w-xs space-y-4">
        <h1 className="font-mono text-xs font-black uppercase tracking-widest text-(--guto-navy)">
          {copy.title}
        </h1>
        <p className="font-mono text-[10px] font-black uppercase leading-relaxed tracking-wider text-[rgba(13,35,65,0.5)]">
          {copy.body}
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-4">
        <button
          onClick={() => router.push("/")}
          className="rounded-full bg-(--guto-cyan) px-8 py-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-(--guto-navy) shadow-[0_4px_16px_rgba(82,231,255,0.3)] transition-all active:scale-95"
        >
          {copy.retry}
        </button>
        <button
          onClick={logout}
          className="font-mono text-[9px] font-black uppercase tracking-widest text-[rgba(13,35,65,0.4)] underline"
        >
          {copy.logout}
        </button>
      </div>

      <p className="absolute bottom-8 font-mono text-[8px] font-black uppercase tracking-widest text-[rgba(13,35,65,0.2)]">
        {copy.footer}
      </p>
    </div>
  )
}

export default function PausedAccessPage() {
  return (
    <Suspense fallback={<div className="sala-guto flex min-h-dvh items-center justify-center" />}>
      <PausedAccessContent />
    </Suspense>
  )
}
