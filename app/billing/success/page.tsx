"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CheckCircle2, Loader2 } from "lucide-react"
import { getBillingStatus } from "@/lib/api/billing"

export default function BillingSuccessPage() {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    const max = 10

    async function poll() {
      try {
        const status = await getBillingStatus()
        if (status.active && !cancelled) {
          setConfirmed(true)
          return
        }
      } catch {
        // ignore — webhook may not have fired yet
      }
      if (cancelled) return
      attempts++
      if (attempts < max) setTimeout(poll, 1500)
      else if (!cancelled) setConfirmed(true)
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="sala-guto flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <div className="mb-8 flex flex-col items-center">
        <div className="guto-deboss mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          {confirmed
            ? <CheckCircle2 className="h-10 w-10 text-[var(--guto-cyan)]" />
            : <Loader2 className="h-10 w-10 animate-spin text-[rgba(13,35,65,0.3)]" />}
        </div>
        <Image src="/assets/guto/logo_guto.png" alt="GUTO" width={140} height={46} />
      </div>

      <div className="max-w-xs space-y-4">
        <h1 className="font-mono text-xs font-black uppercase tracking-widest text-[var(--guto-navy)]">
          {confirmed ? "Dupla ativada" : "Confirmando pagamento"}
        </h1>
        <p className="font-mono text-[10px] font-black uppercase leading-relaxed tracking-wider text-[rgba(13,35,65,0.5)]">
          {confirmed
            ? "Tô vivo, tô aqui. Bora começar."
            : "Aguarde uns segundos. Vai dar tudo certo."}
        </p>
      </div>

      <button
        onClick={() => router.push("/")}
        disabled={!confirmed}
        className="mt-12 rounded-full bg-[var(--guto-cyan)] px-8 py-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[var(--guto-navy)] shadow-[0_4px_16px_rgba(82,231,255,0.3)] transition-all active:scale-95 disabled:opacity-40"
      >
        Entrar no GUTO
      </button>
    </div>
  )
}
