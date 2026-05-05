"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { loginUser } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/client"
import { gutoAudio } from "@/lib/audio-haptics"
import { Loader2 } from "lucide-react"

type Lang = "pt-BR" | "it-IT" | "en-US" | "es-ES"

const T = {
  "pt-BR": {
    subtitle: "Acesso Restrito",
    userLabel: "Usuário ou E-mail",
    userPlaceholder: "IDENTIDADE",
    passLabel: "Senha",
    passPH: "••••••••",
    cta: "ENTRAR",
    hint: "Acesso restrito. Você precisa de convite para ativar o GUTO.",
  },
  "it-IT": {
    subtitle: "Accesso Riservato",
    userLabel: "Utente o E-mail",
    userPlaceholder: "IDENTITÀ",
    passLabel: "Password",
    passPH: "••••••••",
    cta: "ACCEDI",
    hint: "Accesso riservato. Ti serve un invito per attivare GUTO.",
  },
  "en-US": {
    subtitle: "Restricted Access",
    userLabel: "User or E-mail",
    userPlaceholder: "IDENTITY",
    passLabel: "Password",
    passPH: "••••••••",
    cta: "ENTER",
    hint: "Restricted access. You need an invite to activate GUTO.",
  },
  "es-ES": {
    subtitle: "Acceso Restringido",
    userLabel: "Usuario o E-mail",
    userPlaceholder: "IDENTIDAD",
    passLabel: "Contraseña",
    passPH: "••••••••",
    cta: "ENTRAR",
    hint: "Acceso restringido. Necesitas una invitación para activar GUTO.",
  },
} as const

function isSupportedLang(v: string): v is Lang {
  return ["pt-BR", "it-IT", "en-US", "es-ES"].includes(v)
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
    const fromStorage = typeof window !== "undefined"
      ? localStorage.getItem("guto-selected-language") ?? ""
      : ""
    const resolved = isSupportedLang(fromQuery)
      ? fromQuery
      : isSupportedLang(fromStorage)
        ? fromStorage
        : "pt-BR"
    setLang(resolved)
  }, [router, searchParams])

  const t = T[lang]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const res = await loginUser(emailOrId, password)
      login(res)
      router.push("/")
    } catch (err) {
      gutoAudio.playGutoFeedback("error")
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="sala-guto flex min-h-dvh flex-col overflow-y-auto">
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12">

        <div className="mb-12 flex flex-col items-center">
          <Image
            src="/assets/guto/logo_guto.png"
            alt="GUTO"
            width={180}
            height={60}
            priority
            className="drop-shadow-sm"
          />
          <p className="mt-4 font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[var(--guto-navy)]">
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
              className="w-full border-none bg-transparent font-mono text-sm font-black text-[var(--guto-navy)] outline-none placeholder:text-[rgba(13,35,65,0.2)]"
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
              className="w-full border-none bg-transparent font-mono text-sm font-black text-[var(--guto-navy)] outline-none placeholder:text-[rgba(13,35,65,0.2)]"
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
            className="mt-2 flex h-14 w-full items-center justify-center rounded-full bg-[var(--guto-cyan)] font-mono text-xs font-black uppercase tracking-[0.2em] text-[var(--guto-navy)] shadow-[0_4px_20px_rgba(82,231,255,0.3)] transition-all active:scale-95 disabled:opacity-50"
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
    <Loader2 className="h-8 w-8 animate-spin text-[var(--guto-cyan)]" />
  </div>
)

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
