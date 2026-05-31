"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { loginUser } from "@/lib/api/auth"
import { ApiError, getApiErrorMessage } from "@/lib/api/client"
import { gutoAudio } from "@/lib/audio-haptics"
import { resolveGutoLanguage } from "@/lib/guto-profile"
import { useGutoViewport } from "@/hooks/use-guto-viewport"
import { Loader2 } from "lucide-react"

type Lang = "pt-BR" | "it-IT" | "en-US"

const T = {
  "pt-BR": {
    subtitle: "Acesso Restrito",
    userLabel: "Usuário ou E-mail",
    userPlaceholder: "IDENTIDADE",
    passLabel: "Senha",
    passPH: "••••••••",
    cta: "ENTRAR",
    hint: "Acesso restrito. Você precisa de convite para ativar o GUTO.",
    timeoutError: "Servidor demorando. Tente novamente em instantes.",
    connectionError: "Sem conexão. Verifique sua internet.",
  },
  "it-IT": {
    subtitle: "Accesso Riservato",
    userLabel: "Utente o E-mail",
    userPlaceholder: "IDENTITÀ",
    passLabel: "Password",
    passPH: "••••••••",
    cta: "ACCEDI",
    hint: "Accesso riservato. Ti serve un invito per attivare GUTO.",
    timeoutError: "Server lento. Riprova tra un momento.",
    connectionError: "Nessuna connessione. Controlla internet.",
  },
  "en-US": {
    subtitle: "Restricted Access",
    userLabel: "User or E-mail",
    userPlaceholder: "IDENTITY",
    passLabel: "Password",
    passPH: "••••••••",
    cta: "ENTER",
    hint: "Restricted access. You need an invite to activate GUTO.",
    timeoutError: "Server is slow. Please try again in a moment.",
    connectionError: "No connection. Check your internet.",
  },
} as const

function isSupportedLang(v: string): v is Lang {
  return ["pt-BR", "it-IT", "en-US"].includes(v)
}

function LoginPageContent() {
  const searchParams = useSearchParams()
  const [emailOrId, setEmailOrId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<Lang>("pt-BR")
  const { login } = useAuth()
  const router = useRouter()
  const shellRef = useRef<HTMLDivElement | null>(null)
  useGutoViewport(shellRef)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pendingInviteToken = localStorage.getItem("guto-pending-invite-token")
      const entryMode = localStorage.getItem("guto-entry-mode")
      if (pendingInviteToken) {
        router.replace("/")
        return
      }
      if (entryMode === "invite") localStorage.removeItem("guto-entry-mode")
    }

    const fromQuery = searchParams.get("lang") ?? ""
    const onboardingLanguage = typeof window !== "undefined" ? localStorage.getItem("guto-onboarding-language") : null
    const selectedLanguage = typeof window !== "undefined" ? localStorage.getItem("guto-selected-language") : null
    const resolved = resolveGutoLanguage({
      scope: "onboarding",
      onboardingLanguage: isSupportedLang(fromQuery) ? fromQuery : onboardingLanguage,
      globalStoredLanguage: selectedLanguage,
      fallbackLanguage: "pt-BR",
    })
    setLang(resolved)
    if (typeof window !== "undefined") {
      try {
        document.documentElement.lang = resolved
        localStorage.setItem("guto-selected-language", resolved)
        localStorage.setItem("guto-onboarding-language", resolved)
      } catch {
        // Storage can be blocked in Safari private mode; the visible login language still follows resolved.
      }
    }
  }, [router, searchParams])

  const t = T[lang]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const res = await loginUser(emailOrId, password)
      if (process.env.NODE_ENV === "development") {
        console.info("[GUTO_LOGIN] login success -> resolve onboarding stage")
      }
      login(res)
      router.push("/")
    } catch (err) {
      gutoAudio.playGutoFeedback("error")
      if (err instanceof ApiError && err.code === "TIMEOUT") {
        setError(t.timeoutError)
      } else if (err instanceof ApiError && err.code === "CONNECTION_ERROR") {
        setError(t.connectionError)
      } else {
        setError(getApiErrorMessage(err, lang))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div ref={shellRef} className="sala-guto overflow-y-auto" style={{ height: "var(--guto-viewport-height, 100dvh)" }}>
      <div className="flex min-h-full flex-col items-center justify-center px-8 py-12">

        <div className="mb-12 flex w-full max-w-sm flex-col items-center px-1 text-center">
          <Image
            src="/assets/guto/logo_guto.png"
            alt="GUTO"
            width={180}
            height={60}
            priority
            className="h-auto w-[180px] max-w-[80%] drop-shadow-sm"
            style={{ height: "auto" }}
          />
          <p className="mt-4 max-w-full text-center font-mono text-[10px] font-black uppercase leading-relaxed tracking-[0.22em] text-(--guto-navy)">
            {t.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div className="guto-deboss rounded-2xl p-4">
            <label className="mb-1.5 block font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              {t.userLabel}
            </label>
            <input
              type="text"
              value={emailOrId}
              onChange={(e) => setEmailOrId(e.target.value)}
              className="w-full border-none bg-transparent font-mono text-sm font-black text-(--guto-navy) outline-none placeholder:text-[rgba(13,35,65,0.2)]"
              placeholder={t.userPlaceholder}
              required
              autoComplete="username"
            />
          </div>

          <div className="guto-deboss rounded-2xl p-4">
            <label className="mb-1.5 block font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              {t.passLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-none bg-transparent font-mono text-sm font-black text-(--guto-navy) outline-none placeholder:text-[rgba(13,35,65,0.2)]"
              placeholder={t.passPH}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-center font-mono text-[10px] font-black uppercase text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            onPointerDown={() => gutoAudio.playGutoFeedback("tap")}
            disabled={isLoading}
            className="mt-2 flex h-14 w-full items-center justify-center rounded-full bg-(--guto-cyan) font-mono text-xs font-black uppercase tracking-[0.2em] text-(--guto-navy) shadow-[0_4px_20px_rgba(82,231,255,0.3)] transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t.cta}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="font-mono text-[9px] font-black uppercase tracking-widest text-[rgba(13,35,65,0.4)]">
            {t.hint}
          </p>
        </div>

      </div>
    </div>
  )
}

const LoadingFallback = () => (
  <div className="sala-guto flex min-h-dvh items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-(--guto-cyan)" />
  </div>
)

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
