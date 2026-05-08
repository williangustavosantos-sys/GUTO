"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { createCheckoutSession, type BillingPlan } from "@/lib/api/billing"
import { getApiErrorMessage } from "@/lib/api/client"

interface Plan {
  key: BillingPlan
  title: string
  badge?: string
  price: string
  cadence: string
  highlight?: boolean
}

const PLANS: Plan[] = [
  { key: "monthly", title: "Mensal", price: "R$ 39,90", cadence: "por mês", highlight: false },
  { key: "annual", title: "Anual", price: "R$ 349,90", cadence: "por ano", highlight: true, badge: "Economia de 27%" },
  { key: "beta", title: "Beta 200", price: "R$ 199,90", cadence: "ano inteiro", highlight: false, badge: "Apenas duplas inaugurais" },
]

export default function PricingPage() {
  const router = useRouter()
  const [busyPlan, setBusyPlan] = useState<BillingPlan | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(plan: BillingPlan) {
    if (busyPlan) return
    setBusyPlan(plan)
    setError(null)
    try {
      const { url } = await createCheckoutSession(plan)
      if (url) {
        window.location.href = url
      } else {
        setError("Não foi possível iniciar o checkout.")
        setBusyPlan(null)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
      setBusyPlan(null)
    }
  }

  return (
    <div className="sala-guto min-h-dvh px-6 py-10">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <Image src="/assets/guto/logo_guto.png" alt="GUTO" width={120} height={40} className="mb-8" />
        <h1 className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[var(--guto-navy)]">A dupla começa aqui</h1>
        <p className="mt-3 font-mono text-[10px] font-black uppercase leading-relaxed tracking-[0.12em] text-[rgba(13,35,65,0.55)]">
          Escolha o plano. Cancela quando quiser.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3">
          {PLANS.map((plan) => {
            const isBusy = busyPlan === plan.key
            const baseClass = plan.highlight
              ? "border border-[var(--guto-cyan)] bg-white shadow-[0_8px_24px_rgba(82,231,255,0.18)]"
              : "border border-[rgba(13,35,65,0.1)] bg-white/70"
            return (
              <button
                key={plan.key}
                type="button"
                disabled={Boolean(busyPlan)}
                onClick={() => handleSelect(plan.key)}
                className={`flex flex-col gap-1 rounded-[1.5rem] px-6 py-5 text-left transition-all active:scale-[0.99] disabled:opacity-50 ${baseClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--guto-navy)]">{plan.title}</span>
                  {plan.badge && (
                    <span className="rounded-full bg-[var(--guto-cyan)]/30 px-3 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-[var(--guto-navy)]">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-black text-[var(--guto-navy)]">{plan.price}</span>
                  <span className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[rgba(13,35,65,0.45)]">{plan.cadence}</span>
                </div>
                {isBusy && (
                  <div className="mt-2 flex items-center gap-2 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[var(--guto-navy)]">
                    <Loader2 className="h-3 w-3 animate-spin" /> Abrindo checkout...
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <p className="mt-5 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[rgba(200,30,30,0.85)]">{error}</p>
        )}

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-8 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[rgba(13,35,65,0.4)] underline"
        >
          Voltar
        </button>

        <p className="mt-10 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-[rgba(13,35,65,0.3)] leading-relaxed">
          Pagamento processado com segurança pela Stripe. Cancele a qualquer momento pelo portal de assinatura.
        </p>
      </div>
    </div>
  )
}
