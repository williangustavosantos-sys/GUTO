"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldCheck, UserCog } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { loginAdmin, loginCoach } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/client"

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

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"admin" | "coach">("admin")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const router = useRouter()

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
        setError("Esta entrada é só para coaches e admin. Use a tela de aluno.")
      } else {
        setError("Sua conta não tem acesso à Sala de Controle.")
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        background: `
          radial-gradient(80% 60% at 0% 0%, rgba(82,231,255,0.06) 0%, transparent 60%),
          radial-gradient(60% 50% at 100% 100%, rgba(82,231,255,0.05) 0%, transparent 60%),
          ${T.ink}
        `,
        color: T.fg,
        fontFamily: T.mono,
        position: "relative",
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

      {/* Brand */}
      <div style={{ marginBottom: 32, textAlign: "center", position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 22,
            fontWeight: 900,
            color: T.cyan,
            letterSpacing: "0.32em",
            textShadow: "0 0 14px rgba(82,231,255,0.6)",
            marginBottom: 8,
          }}
        >
          GUTO
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <ShieldCheck style={{ width: 12, height: 12, color: T.cyan }} />
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 9,
              fontWeight: 900,
              color: T.cyan,
              letterSpacing: "0.34em",
              textTransform: "uppercase",
            }}
          >
            Sala de Controle
          </span>
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: T.panelDp,
          border: `1px solid ${T.borderHi}`,
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 0 40px rgba(82,231,255,0.10), 0 4px 30px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          <ModeButton active={mode === "admin"} onClick={() => setMode("admin")}>
            <ShieldCheck style={{ width: 12, height: 12 }} />
            ADMIN
          </ModeButton>
          <ModeButton active={mode === "coach"} onClick={() => setMode("coach")}>
            <UserCog style={{ width: 12, height: 12 }} />
            COACH
          </ModeButton>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormField label="E-mail">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="admin@guto.fit"
              style={fieldStyle}
            />
          </FormField>

          <FormField label="Senha">
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
                padding: "10px 14px",
                borderRadius: 8,
                background: T.badS,
                border: "1px solid rgba(248,113,113,0.30)",
                color: T.bad,
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: "0.10em",
                textAlign: "center",
              }}
            >
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 8,
              height: 48,
              borderRadius: 999,
              border: "1px solid transparent",
              background: "linear-gradient(135deg,#7df0ff,#1ec5e0)",
              color: "#04131e",
              fontFamily: T.mono,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              boxShadow: "0 0 22px rgba(82,231,255,0.30)",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isLoading ? (
              <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />
            ) : (
              "Entrar na Sala de Controle"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 32,
          fontFamily: T.mono,
          fontSize: 9,
          color: T.fg4,
          letterSpacing: "0.20em",
          textTransform: "uppercase",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        Aluno?{" "}
        <a href="/login" style={{ color: T.cyan, textDecoration: "none" }}>
          Login do app
        </a>
      </div>
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
