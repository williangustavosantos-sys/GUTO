"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { XCircle } from "lucide-react"

export default function BillingCancelPage() {
  const router = useRouter()
  return (
    <div className="sala-guto flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <div className="mb-8 flex flex-col items-center">
        <div className="guto-deboss mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <XCircle className="h-10 w-10 text-[rgba(13,35,65,0.25)]" />
        </div>
        <Image src="/assets/guto/logo_guto.png" alt="GUTO" width={140} height={46} className="opacity-50" style={{ height: "auto" }} />
      </div>

      <div className="max-w-xs space-y-4">
        <h1 className="font-mono text-xs font-black uppercase tracking-widest text-(--guto-navy)">
          Pagamento cancelado
        </h1>
        <p className="font-mono text-[10px] font-black uppercase leading-relaxed tracking-wider text-[rgba(13,35,65,0.5)]">
          Sem pressão. Quando estiver pronto, é só voltar.
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-3">
        <button
          onClick={() => router.push("/billing/pricing")}
          className="rounded-full bg-(--guto-cyan) px-8 py-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-(--guto-navy) shadow-[0_4px_16px_rgba(82,231,255,0.3)] transition-all active:scale-95"
        >
          Ver planos novamente
        </button>
        <button
          onClick={() => router.push("/")}
          className="font-mono text-[9px] font-black uppercase tracking-widest text-[rgba(13,35,65,0.4)] underline"
        >
          Voltar para o início
        </button>
      </div>
    </div>
  )
}
