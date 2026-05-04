"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { getInvite, claimInvite } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/client"
import { Loader2, CheckCircle2 } from "lucide-react"

type Lang = "pt-BR" | "it-IT" | "en-US" | "es-ES"

const T = {
  "pt-BR": {
    greetingPrefix: "Olá,",
    invited: "Você foi convidado para entrar no GUTO.",
    createPass: "Criar Senha",
    confirmPass: "Confirmar Senha",
    mismatch: "As senhas não coincidem.",
    tooShort: "A senha deve ter pelo menos 6 caracteres.",
    cta: "ATIVAR MEU GUTO",
    activated: "CONTA ATIVADA COM SUCESSO.",
    starting: "Iniciando sistema...",
    back: "Voltar para o Início",
    chooseLanguage: "Escolha seu idioma",
  },
  "it-IT": {
    greetingPrefix: "Ciao,",
    invited: "Sei stato invitato a entrare in GUTO.",
    createPass: "Crea Password",
    confirmPass: "Conferma Password",
    mismatch: "Le password non corrispondono.",
    tooShort: "La password deve avere almeno 6 caratteri.",
    cta: "ATTIVA IL MIO GUTO",
    activated: "ACCOUNT ATTIVATO CON SUCCESSO.",
    starting: "Avvio sistema...",
    back: "Torna all'Inizio",
    chooseLanguage: "Scegli la tua lingua",
  },
  "en-US": {
    greetingPrefix: "Hi,",
    invited: "You've been invited to join GUTO.",
    createPass: "Create Password",
    confirmPass: "Confirm Password",
    mismatch: "Passwords don't match.",
    tooShort: "Password must be at least 6 characters.",
    cta: "ACTIVATE MY GUTO",
    activated: "ACCOUNT ACTIVATED SUCCESSFULLY.",
    starting: "Starting system...",
    back: "Back to Start",
    chooseLanguage: "Choose your language",
  },
  "es-ES": {
    greetingPrefix: "Hola,",
    invited: "Has sido invitado a unirte a GUTO.",
    createPass: "Crear Contraseña",
    confirmPass: "Confirmar Contraseña",
    mismatch: "Las contraseñas no coinciden.",
    tooShort: "La contraseña debe tener al menos 6 caracteres.",
    cta: "ACTIVAR MI GUTO",
    activated: "CUENTA ACTIVADA CON ÉXITO.",
    starting: "Iniciando sistema...",
    back: "Volver al Inicio",
    chooseLanguage: "Elige tu idioma",
  },
} as const

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },
  { code: "it-IT", label: "Italiano", flag: "🇮🇹" },
  { code: "en-US", label: "English", flag: "🇺🇸" },
  { code: "es-ES", label: "Español", flag: "🇪🇸" },
]

function isSupportedLang(v: string): v is Lang {
  return ["pt-BR", "it-IT", "en-US", "es-ES"].includes(v)
}

export default function InvitePage() {
  const { token } = useParams() as { token: string }
  const [inviteData, setInviteData] = useState<{ name: string } | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [lang, setLang] = useState<Lang | null>(null)

  const { login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const stored = typeof window !== "undefined"
      ? localStorage.getItem("guto-selected-language") ?? ""
      : ""
    if (isSupportedLang(stored)) setLang(stored)
  }, [])

  useEffect(() => {
    if (!token) return
    getInvite(token)
      .then((data) => {
        setInviteData(data)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(getApiErrorMessage(err))
        setIsLoading(false)
      })
  }, [token])

  const selectLang = (l: Lang) => {
    localStorage.setItem("guto-selected-language", l)
    setLang(l)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = T[lang ?? "pt-BR"]
    if (password !== confirmPassword) {
      setError(t.mismatch)
      return
    }
    if (password.length < 6) {
      setError(t.tooShort)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await claimInvite(token, password)
      setSuccess(true)
      setTimeout(() => {
        login(res)
        router.push("/")
      }, 2000)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="sala-guto flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--guto-cyan)]" />
      </div>
    )
  }

  if (error && !inviteData) {
    const t = T[lang ?? "pt-BR"]
    return (
      <div className="sala-guto flex min-h-dvh flex-col items-center justify-center px-8 text-center">
        <p className="font-mono text-xs font-black uppercase text-red-500">{error}</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-8 font-mono text-[10px] font-black uppercase tracking-widest text-[var(--guto-cyan)] underline"
        >
          {t.back}
        </button>
      </div>
    )
  }

  if (!lang) {
    return (
      <div className="sala-guto flex min-h-dvh flex-col items-center justify-center px-8">
        <div className="mb-10 flex flex-col items-center">
          <Image
            src="/assets/guto/logo_guto.png"
            alt="GUTO"
            width={140}
            height={47}
            priority
            className="drop-shadow-sm"
          />
        </div>
        <p className="mb-6 font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[var(--guto-navy)]">
          Choose your language
        </p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => selectLang(l.code)}
              className="flex h-12 items-center gap-3 rounded-full bg-white/60 px-5 font-mono text-xs font-black uppercase tracking-wider text-[var(--guto-navy)] border border-[rgba(13,35,65,0.18)] transition-all active:scale-95 hover:border-[rgba(13,35,65,0.35)]"
            >
              <span className="text-base">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const t = T[lang]

  return (
    <div className="sala-guto flex min-h-dvh flex-col overflow-y-auto">
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12">

        <div className="mb-10 flex flex-col items-center text-center">
          <div className="guto-deboss mb-6 flex h-16 w-16 items-center justify-center rounded-full">
            <Image
              src="/icon-guto.svg"
              alt="GUTO"
              width={32}
              height={32}
              className="opacity-80"
            />
          </div>
          <h1 className="font-mono text-sm font-black uppercase tracking-[0.1em] text-[var(--guto-navy)]">
            {t.greetingPrefix} <span className="text-[var(--guto-cyan)]">{inviteData?.name}</span>
          </h1>
          <p className="mt-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.4)]">
            {t.invited}
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center space-y-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-mono text-[11px] font-black uppercase tracking-widest text-[var(--guto-navy)]">
              {t.activated}
            </p>
            <p className="font-mono text-[9px] font-black uppercase tracking-widest text-[rgba(13,35,65,0.4)]">
              {t.starting}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
            <div className="guto-deboss rounded-2xl p-4">
              <label className="mb-1.5 block font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
                {t.createPass}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-none bg-transparent font-mono text-sm font-black text-[var(--guto-navy)] outline-none placeholder:text-[rgba(13,35,65,0.2)]"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="guto-deboss rounded-2xl p-4">
              <label className="mb-1.5 block font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
                {t.confirmPass}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border-none bg-transparent font-mono text-sm font-black text-[var(--guto-navy)] outline-none placeholder:text-[rgba(13,35,65,0.2)]"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-center font-mono text-[10px] font-black uppercase text-red-500">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex h-14 w-full items-center justify-center rounded-full bg-[var(--guto-cyan)] font-mono text-xs font-black uppercase tracking-[0.2em] text-[var(--guto-navy)] shadow-[0_4px_20px_rgba(82,231,255,0.3)] transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t.cta}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
