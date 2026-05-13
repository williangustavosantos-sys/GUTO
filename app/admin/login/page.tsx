"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Globe2, Loader2, ShieldCheck, UserCog } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { loginAdmin, loginCoach } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/client"

type AdminLang = "pt-BR" | "it-IT" | "en-US"
type LoginMode = "admin" | "coach"

const T = {
  ink: "#04060f",
  panel: "rgba(15,22,42,0.86)",
  panelDp: "rgba(8,12,26,0.92)",
  border: "rgba(82,231,255,0.10)",
  borderHi: "rgba(82,231,255,0.26)",
  fg: "#e8f4ff",
  fg2: "rgba(232,244,255,0.60)",
  fg3: "rgba(232,244,255,0.38)",
  fg4: "rgba(232,244,255,0.18)",
  cyan: "#52e7ff",
  cyanSoft: "rgba(82,231,255,0.14)",
  cyanLine: "rgba(82,231,255,0.24)",
  bad: "#f87171",
  badS: "rgba(248,113,113,0.13)",
  mono: '"JetBrains Mono","SF Mono",Menlo,Monaco,Consolas,monospace',
} as const

const LANGUAGES: Array<{ code: AdminLang; short: string; label: string }> = [
  { code: "pt-BR", short: "PT", label: "Português" },
  { code: "it-IT", short: "IT", label: "Italiano" },
  { code: "en-US", short: "EN", label: "English" },
]

const COPY: Record<AdminLang, {
  eyebrow: string
  title: string
  subtitle: string
  admin: string
  coach: string
  email: string
  password: string
  emailPlaceholder: string
  submit: string
  loading: string
  studentText: string
  studentLink: string
  restrictedStudent: string
  noAccess: string
  language: string
  opsTitle: string
  opsOne: string
  opsTwo: string
  opsThree: string
}> = {
  "pt-BR": {
    eyebrow: "SALA DE CONTROLE",
    title: "Painel Operacional GUTO",
    subtitle: "Entrada administrativa para empresas, coaches e operação. Navegador primeiro, leitura rápida, ação sem ruído.",
    admin: "ADMIN",
    coach: "COACH",
    email: "E-mail",
    password: "Senha",
    emailPlaceholder: "admin@guto.fit",
    submit: "Entrar na Sala de Controle",
    loading: "Validando acesso",
    studentText: "Aluno?",
    studentLink: "Login do app",
    restrictedStudent: "Esta entrada é só para coaches e admin. Use a tela de aluno.",
    noAccess: "Sua conta não tem acesso à Sala de Controle.",
    language: "Idioma",
    opsTitle: "Operação protegida",
    opsOne: "Times isolados por permissão.",
    opsTwo: "Ações burocráticas restritas a admin.",
    opsThree: "Treino e dieta seguem sob controle do coach.",
  },
  "it-IT": {
    eyebrow: "SALA DI CONTROLLO",
    title: "Pannello Operativo GUTO",
    subtitle: "Accesso amministrativo per aziende, coach e operazione. Prima browser, lettura rapida, azione senza rumore.",
    admin: "ADMIN",
    coach: "COACH",
    email: "E-mail",
    password: "Password",
    emailPlaceholder: "admin@guto.fit",
    submit: "Entra nella Sala di Controllo",
    loading: "Verifica accesso",
    studentText: "Studente?",
    studentLink: "Login app",
    restrictedStudent: "Questo ingresso è solo per coach e admin. Usa la schermata studente.",
    noAccess: "Il tuo account non ha accesso alla Sala di Controllo.",
    language: "Lingua",
    opsTitle: "Operazione protetta",
    opsOne: "Team isolati per autorizzazione.",
    opsTwo: "Azioni amministrative riservate agli admin.",
    opsThree: "Allenamento e dieta restano sotto controllo del coach.",
  },
  "en-US": {
    eyebrow: "CONTROL ROOM",
    title: "GUTO Operations Panel",
    subtitle: "Administrative entry for companies, coaches and operations. Browser-first, fast reading, action without noise.",
    admin: "ADMIN",
    coach: "COACH",
    email: "Email",
    password: "Password",
    emailPlaceholder: "admin@guto.fit",
    submit: "Enter Control Room",
    loading: "Validating access",
    studentText: "Student?",
    studentLink: "App login",
    restrictedStudent: "This entry is only for coaches and admins. Use the student screen.",
    noAccess: "Your account does not have access to the Control Room.",
    language: "Language",
    opsTitle: "Protected operation",
    opsOne: "Teams isolated by permission.",
    opsTwo: "Administrative actions restricted to admins.",
    opsThree: "Workout and diet remain under coach control.",
  },
}

function isAdminLang(value: string | null): value is AdminLang {
  return value === "pt-BR" || value === "it-IT" || value === "en-US"
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<LoginMode>("admin")
  const [language, setLanguage] = useState<AdminLang>(() => {
    if (typeof window === "undefined") return "pt-BR"
    const stored = window.localStorage.getItem("guto-admin-language")
    return isAdminLang(stored) ? stored : "pt-BR"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const router = useRouter()
  const copy = COPY[language]

  const changeLanguage = (next: AdminLang) => {
    setLanguage(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("guto-admin-language", next)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const res = mode === "admin" ? await loginAdmin(email, password) : await loginCoach(email, password)
      login(res)

      // Redirect por role:
      //  - super_admin / admin → Sala de Controle (/coach é a rota host)
      //  - coach              → /coach (a UI ajusta automaticamente, sidebar restrita)
      //  - student            → erro: aluno deve usar /login
      const role = res.role
      if (role === "super_admin" || role === "admin" || role === "coach") {
        router.push("/coach")
      } else if (role === "student") {
        setError(copy.restrictedStudent)
      } else {
        setError(copy.noAccess)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{
        background: `
          radial-gradient(80% 60% at 0% 0%, rgba(82,231,255,0.06) 0%, transparent 60%),
          radial-gradient(60% 50% at 100% 100%, rgba(82,231,255,0.05) 0%, transparent 60%),
          ${T.ink}
        `,
        color: T.fg,
        fontFamily: T.mono,
      }}
    >
      {/* scanlines */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(0deg, rgba(82,231,255,0.018) 0px, rgba(82,231,255,0.018) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "screen",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-6 py-5 lg:px-10">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.34em] text-[#52e7ff]">{copy.eyebrow}</p>
            <p className="mt-1 truncate font-mono text-lg font-black uppercase tracking-[0.24em] text-white">GUTO</p>
          </div>
          <LanguageSelector value={language} label={copy.language} onChange={changeLanguage} />
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1fr_460px] lg:py-12">
          <section className="hidden lg:block">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#52e7ff]/25 bg-[#52e7ff]/10 px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-[#52e7ff]" />
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#9cf5ff]">{copy.opsTitle}</span>
              </div>
              <h1 className="text-balance font-mono text-5xl font-black uppercase leading-tight tracking-normal text-white">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-xl font-mono text-sm leading-7 text-white/55">
                {copy.subtitle}
              </p>
              <div className="mt-8 grid max-w-2xl gap-3">
                {[copy.opsOne, copy.opsTwo, copy.opsThree].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 border-l border-[#52e7ff]/35 bg-white/[0.035] px-4 py-3">
                    <span className="font-mono text-xs font-black text-[#52e7ff]">0{index + 1}</span>
                    <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-white/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="w-full">
            <div className="mb-5 lg:hidden">
              <h1 className="font-mono text-2xl font-black uppercase tracking-normal text-white">{copy.title}</h1>
              <p className="mt-2 font-mono text-xs leading-6 text-white/50">{copy.subtitle}</p>
            </div>
            <div
              className="w-full border border-[#52e7ff]/25 bg-[#080c1a]/95 p-5 shadow-[0_0_40px_rgba(82,231,255,0.10),0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur md:p-8"
              style={{ borderRadius: 8 }}
            >
              <div className="mb-6 grid grid-cols-2 gap-2">
                <ModeButton active={mode === "admin"} onClick={() => setMode("admin")}>
                  <ShieldCheck style={{ width: 12, height: 12 }} />
                  {copy.admin}
                </ModeButton>
                <ModeButton active={mode === "coach"} onClick={() => setMode("coach")}>
                  <UserCog style={{ width: 12, height: 12 }} />
                  {copy.coach}
                </ModeButton>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-4">
                <FormField label={copy.email}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    placeholder={copy.emailPlaceholder}
                    style={fieldStyle}
                  />
                </FormField>

                <FormField label={copy.password}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    style={fieldStyle}
                  />
                </FormField>

                {error && (
                  <div className="border border-red-400/30 bg-red-400/10 px-4 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.10em] text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 flex h-12 items-center justify-center gap-2 bg-[#52e7ff] font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#04131e] shadow-[0_0_22px_rgba(82,231,255,0.30)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ borderRadius: 8 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />
                      {copy.loading}
                    </>
                  ) : (
                    copy.submit
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-white/10 pt-5 text-center font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/25">
                {copy.studentText}{" "}
                <a href="/login" className="text-[#52e7ff] no-underline hover:text-white">
                  {copy.studentLink}
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

function LanguageSelector({
  value,
  label,
  onChange,
}: {
  value: AdminLang
  label: string
  onChange: (value: AdminLang) => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] p-1">
      <div className="hidden items-center gap-2 px-2 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-white/35 sm:flex">
        <Globe2 className="h-3.5 w-3.5 text-[#52e7ff]" />
        {label}
      </div>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => onChange(lang.code)}
          title={lang.label}
          className={`h-8 min-w-9 rounded px-2 font-mono text-[10px] font-black uppercase transition ${
            value === lang.code ? "bg-[#52e7ff] text-[#04131e]" : "text-white/45 hover:bg-white/10 hover:text-white"
          }`}
        >
          {lang.short}
        </button>
      ))}
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        height: 36,
        borderRadius: 10,
        cursor: "pointer",
        border: active ? `1px solid ${T.cyan}` : `1px solid ${T.border}`,
        background: active ? T.cyanSoft : "transparent",
        color: active ? T.cyan : T.fg3,
        fontFamily: T.mono,
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {children}
    </button>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 9,
          fontWeight: 900,
          color: T.fg3,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

const fieldStyle: React.CSSProperties = {
  height: 44,
  padding: "0 14px",
  background: "rgba(0,0,0,0.40)",
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.45)",
  color: T.fg,
  fontFamily: T.mono,
  fontSize: 13,
  outline: "none",
}
