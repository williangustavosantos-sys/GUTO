"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Globe2, Loader2, ShieldCheck, UserCog } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { loginAdmin, loginCoach } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/client"

type AdminLang = "pt-BR" | "it-IT" | "en-US"
type LoginRole = "super" | "empresa" | "coach"

const LANGUAGES: Array<{ code: AdminLang; short: string; label: string }> = [
  { code: "pt-BR", short: "PT", label: "Português" },
  { code: "it-IT", short: "IT", label: "Italiano" },
  { code: "en-US", short: "EN", label: "English" },
]

type RoleCopy = {
  title: string
  sub: string
  emailPh: string
}

interface Copy {
  brandSub: string
  title: string
  subtitle: string
  roleLabel: string
  email: string
  password: string
  submit: string
  loading: string
  studentText: string
  studentLink: string
  restrictedStudent: string
  noAccess: string
  demoNote: string
  langLabel: string
  roles: Record<LoginRole, RoleCopy>
}

const COPY: Record<AdminLang, Copy> = {
  "pt-BR": {
    brandSub: "Sala de Controle",
    title: "Entrar no painel",
    subtitle: "Use sua conta GUTO para acessar o portal correspondente ao seu papel.",
    roleLabel: "Eu sou",
    email: "E-mail",
    password: "Senha",
    submit: "Entrar",
    loading: "Validando acesso",
    studentText: "É aluno?",
    studentLink: "Login do app",
    restrictedStudent: "Esta entrada é só para coaches e admins. Use a tela do aplicativo.",
    noAccess: "Sua conta não tem acesso ao painel.",
    demoNote: "GUTO · v0.42.7 · sa-east-1",
    langLabel: "Idioma",
    roles: {
      super: { title: "Super Admin", sub: "GUTO global", emailPh: "admin@guto.fit" },
      empresa: { title: "Empresa", sub: "Academia / time", emailPh: "operacao@empresa.fit" },
      coach: { title: "Coach", sub: "Treinador individual", emailPh: "coach@guto.fit" },
    },
  },
  "it-IT": {
    brandSub: "Sala di Controllo",
    title: "Accedi al pannello",
    subtitle: "Usa il tuo account GUTO per accedere al portale corrispondente al tuo ruolo.",
    roleLabel: "Io sono",
    email: "E-mail",
    password: "Password",
    submit: "Accedi",
    loading: "Verifica accesso",
    studentText: "Sei studente?",
    studentLink: "Login app",
    restrictedStudent: "Questo ingresso è solo per coach e admin. Usa la schermata dell'app.",
    noAccess: "Il tuo account non ha accesso al pannello.",
    demoNote: "GUTO · v0.42.7 · sa-east-1",
    langLabel: "Lingua",
    roles: {
      super: { title: "Super Admin", sub: "GUTO globale", emailPh: "admin@guto.fit" },
      empresa: { title: "Azienda", sub: "Palestra / team", emailPh: "operazioni@azienda.fit" },
      coach: { title: "Coach", sub: "Trainer individuale", emailPh: "coach@guto.fit" },
    },
  },
  "en-US": {
    brandSub: "Control Room",
    title: "Sign in to the panel",
    subtitle: "Use your GUTO account to access the portal that matches your role.",
    roleLabel: "I am",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    loading: "Validating access",
    studentText: "Are you a student?",
    studentLink: "App login",
    restrictedStudent: "This entry is for coaches and admins only. Use the app screen instead.",
    noAccess: "Your account does not have access to the panel.",
    demoNote: "GUTO · v0.42.7 · sa-east-1",
    langLabel: "Language",
    roles: {
      super: { title: "Super Admin", sub: "Global GUTO", emailPh: "admin@guto.fit" },
      empresa: { title: "Company", sub: "Gym / team", emailPh: "ops@company.fit" },
      coach: { title: "Coach", sub: "Individual trainer", emailPh: "coach@guto.fit" },
    },
  },
}

const ROLE_TONES: Record<LoginRole, { color: string; bg: string; bd: string; Icon: typeof ShieldCheck }> = {
  super: {
    color: "#52e7ff",
    bg: "rgba(82,231,255,0.12)",
    bd: "rgba(82,231,255,0.45)",
    Icon: ShieldCheck,
  },
  empresa: {
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    bd: "rgba(167,139,250,0.45)",
    Icon: Building2,
  },
  coach: {
    color: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
    bd: "rgba(74,222,128,0.45)",
    Icon: UserCog,
  },
}

function isAdminLang(value: string | null): value is AdminLang {
  return value === "pt-BR" || value === "it-IT" || value === "en-US"
}

export default function AdminLoginPage() {
  // Start from pt-BR on both server and client to keep hydration deterministic;
  // upgrade from localStorage once mounted.
  const [language, setLanguage] = useState<AdminLang>("pt-BR")
  useEffect(() => {
    const stored = window.localStorage.getItem("guto-admin-language")
    if (isAdminLang(stored)) setLanguage(stored)
  }, [])
  const [role, setRole] = useState<LoginRole>("super")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const router = useRouter()
  const copy = COPY[language]

  const changeLanguage = (next: AdminLang) => {
    setLanguage(next)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("guto-admin-language", next)
      // The panel uses a different storage key; mirror the choice so it's consistent post-login.
      const panelLang = next === "pt-BR" ? "pt" : next === "en-US" ? "en" : "it"
      window.localStorage.setItem("guto-panel-lang", panelLang)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      // "super" and "empresa" share the admin login endpoint — the backend returns
      // the actual role from the JWT. "coach" uses the coach login endpoint.
      const res = role === "coach" ? await loginCoach(email, password) : await loginAdmin(email, password)
      login(res)
      const actualRole = res.role
      // Painel operacional canônico = /coach (cockpit real, ligado a /admin/*),
      // que já trata super_admin, admin e coach por papel. /admin e /empresa
      // continuam como casa futura mock e não recebem o operador no fluxo P0.
      if (actualRole === "super_admin" || actualRole === "admin" || actualRole === "coach") {
        router.push("/coach")
      } else if (actualRole === "student") {
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
        background:
          "radial-gradient(ellipse 120% 80% at 50% -10%, rgba(82,231,255,0.10) 0%, transparent 55%), #070D1B",
        color: "#fff",
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      }}
    >
      {/* Decorative grid */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(82,231,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(82,231,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 30%, #000 0%, transparent 80%)",
        }}
      />

      <div
        className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-5 sm:max-w-lg sm:px-6"
        style={{ minHeight: "100dvh" }}
      >
        <header className="flex items-center justify-between gap-3 py-1">
          <div
            className="flex items-center gap-2"
            style={{ color: "rgba(255,255,255,0.45)", fontSize: 11.5 }}
          >
            <Globe2 className="h-3.5 w-3.5" style={{ color: "#52e7ff" }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {copy.langLabel}
            </span>
          </div>
          <LanguageSelector value={language} onChange={changeLanguage} />
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-8">
          <div
            className="w-full"
            style={{ animation: "panel-fade-up 400ms ease forwards", maxWidth: 440 }}
          >
            {/* Brand */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #52e7ff 0%, #0891B2 100%)",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 14px",
                  boxShadow: "0 0 32px rgba(82,231,255,0.35)",
                  color: "#04131e",
                }}
              >
                <ShieldCheck className="h-5 w-5" strokeWidth={2.4} />
              </div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Monaco, monospace',
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#fff",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                GUTO
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{copy.brandSub}</div>
            </div>

            {/* Glass card */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 20,
                padding: "26px 22px 22px",
                boxShadow:
                  "0 24px 60px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 600,
                    color: "#fff",
                    marginBottom: 4,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {copy.title}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.5 }}>
                  {copy.subtitle}
                </div>
              </div>

              {/* Role selector */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.45)",
                    marginBottom: 10,
                  }}
                >
                  {copy.roleLabel}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["super", "empresa", "coach"] as LoginRole[]).map((r) => (
                    <RoleTile
                      key={r}
                      role={r}
                      active={role === r}
                      title={copy.roles[r].title}
                      sub={copy.roles[r].sub}
                      onClick={() => setRole(r)}
                    />
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <FormField label={copy.email}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    placeholder={copy.roles[role].emailPh}
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
                  <div
                    style={{
                      marginTop: 4,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "rgba(248,113,113,0.10)",
                      border: "1px solid rgba(248,113,113,0.35)",
                      color: "#fda4a4",
                      fontSize: 12.5,
                      fontWeight: 500,
                      lineHeight: 1.4,
                    }}
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    height: 46,
                    borderRadius: 12,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    background: isLoading
                      ? "rgba(82,231,255,0.30)"
                      : "linear-gradient(135deg, #52e7ff 0%, #0891B2 100%)",
                    border: "none",
                    color: "#04131e",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    boxShadow: isLoading ? "none" : "0 0 24px rgba(82,231,255,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    transition: "all 200ms ease",
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {copy.loading}
                    </>
                  ) : (
                    copy.submit
                  )}
                </button>
              </form>

              <div
                style={{
                  marginTop: 18,
                  textAlign: "center",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.50)",
                }}
              >
                {copy.studentText}{" "}
                <a
                  href="/login"
                  style={{
                    color: "#52e7ff",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {copy.studentLink}
                </a>
              </div>
            </div>

            <div
              style={{
                textAlign: "center",
                marginTop: 20,
                fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Monaco, monospace',
                fontSize: 10,
                color: "rgba(255,255,255,0.20)",
                letterSpacing: "0.18em",
              }}
            >
              {copy.demoNote}
            </div>
          </div>
        </main>
      </div>

    </div>
  )
}

function LanguageSelector({
  value,
  onChange,
}: {
  value: AdminLang
  onChange: (value: AdminLang) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      {LANGUAGES.map((lang) => {
        const active = value === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => onChange(lang.code)}
            title={lang.label}
            style={{
              height: 30,
              padding: "0 11px",
              borderRadius: 8,
              cursor: "pointer",
              background: active ? "rgba(82,231,255,0.14)" : "transparent",
              border: `1px solid ${active ? "rgba(82,231,255,0.40)" : "rgba(255,255,255,0.10)"}`,
              color: active ? "#52e7ff" : "rgba(255,255,255,0.55)",
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              letterSpacing: "0.02em",
            }}
          >
            {lang.short}
          </button>
        )
      })}
    </div>
  )
}

function RoleTile({
  role,
  active,
  title,
  sub,
  onClick,
}: {
  role: LoginRole
  active: boolean
  title: string
  sub: string
  onClick: () => void
}) {
  const tone = ROLE_TONES[role]
  const { Icon } = tone
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "14px 8px",
        borderRadius: 12,
        cursor: "pointer",
        background: active ? tone.bg : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? tone.bd : "rgba(255,255,255,0.08)"}`,
        color: active ? tone.color : "rgba(255,255,255,0.65)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        transition: "all 160ms ease",
        textAlign: "center",
        minWidth: 0,
      }}
    >
      <Icon className="h-[18px] w-[18px]" />
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: active ? 600 : 500,
            lineHeight: 1.2,
            marginBottom: 3,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: active ? `${tone.color}b3` : "rgba(255,255,255,0.32)",
            lineHeight: 1.3,
          }}
        >
          {sub}
        </div>
      </div>
    </button>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 500,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.02em",
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
  background: "rgba(0,0,0,0.30)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  color: "#fff",
  fontSize: 14,
  outline: "none",
  width: "100%",
}
