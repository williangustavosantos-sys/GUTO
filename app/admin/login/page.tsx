"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { loginAdmin, loginCoach } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/client"
import { Loader2, ShieldCheck, UserCog } from "lucide-react"

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
      const res = mode === "admin"
        ? await loginAdmin(email, password)
        : await loginCoach(email, password)
      login(res)
      router.push("/coach")
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const modeActive = "flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-mono text-[10px] font-black uppercase tracking-wider transition-all bg-[var(--guto-navy)] text-[var(--guto-cyan)] border border-[var(--guto-navy)] shadow-sm"
  const modeInactive = "flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-mono text-[10px] font-black uppercase tracking-wider transition-all bg-white/60 text-[rgba(13,35,65,0.65)] border border-[rgba(13,35,65,0.18)] hover:border-[rgba(13,35,65,0.35)]"

  return (
    <div className="sala-guto flex min-h-dvh flex-col overflow-y-auto">
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12">

        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <Image
            src="/assets/guto/logo_guto.png"
            alt="GUTO"
            width={160}
            height={54}
            priority
            className="drop-shadow-sm"
          />
          <div className="mt-4 flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-[var(--guto-navy)]" />
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[var(--guto-navy)]">
              Painel de Controle
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="mb-8 flex w-full max-w-sm gap-2">
          <button onClick={() => setMode("coach")} className={mode === "coach" ? modeActive : modeInactive}>
            <UserCog className="h-3.5 w-3.5" />
            Coach
          </button>
          <button onClick={() => setMode("admin")} className={mode === "admin" ? modeActive : modeInactive}>
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div className="guto-deboss rounded-2xl p-4">
            <label className="mb-1.5 block font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-none bg-transparent font-mono text-sm font-black text-[var(--guto-navy)] outline-none placeholder:text-[rgba(13,35,65,0.2)]"
              placeholder="contato@guto.app"
              required
              autoComplete="email"
            />
          </div>

          <div className="guto-deboss rounded-2xl p-4">
            <label className="mb-1.5 block font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-none bg-transparent font-mono text-sm font-black text-[var(--guto-navy)] outline-none placeholder:text-[rgba(13,35,65,0.2)]"
              placeholder="••••••••"
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
            disabled={isLoading}
            className="mt-2 flex h-14 w-full items-center justify-center rounded-full bg-[var(--guto-navy)] font-mono text-xs font-black uppercase tracking-[0.2em] text-[var(--guto-cyan)] shadow-[0_4px_24px_rgba(13,35,65,0.25)] transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ACESSAR PAINEL"}
          </button>
        </form>

      </div>
    </div>
  )
}
