"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { Clock } from "lucide-react"

export default function PausedAccessPage() {
  const { logout } = useAuth()
  const router = useRouter()

  return (
    <div className="sala-guto flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <div className="mb-8 flex flex-col items-center">
        <div className="guto-deboss mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <Clock className="h-10 w-10 text-[rgba(13,35,65,0.2)]" />
        </div>
        <Image
          src="/assets/guto/logo_guto.png"
          alt="GUTO"
          width={140}
          height={46}
          className="opacity-40 grayscale"
        />
      </div>

      <div className="max-w-xs space-y-4">
        <h1 className="font-mono text-xs font-black uppercase tracking-widest text-[var(--guto-navy)]">
          Acesso Pausado
        </h1>
        <p className="font-mono text-[10px] font-black uppercase leading-relaxed tracking-wider text-[rgba(13,35,65,0.5)]">
          Seu ciclo atual no GUTO encerrou ou está aguardando ativação. 
          A gente continua daqui quando você renovar.
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-4">
        <button
          onClick={() => router.push("/")}
          className="rounded-full bg-[var(--guto-cyan)] px-8 py-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[var(--guto-navy)] shadow-[0_4px_16px_rgba(82,231,255,0.3)] transition-all active:scale-95"
        >
          Tentar Novamente
        </button>
        <button
          onClick={logout}
          className="font-mono text-[9px] font-black uppercase tracking-widest text-[rgba(13,35,65,0.4)] underline"
        >
          Sair da Conta
        </button>
      </div>

      <p className="absolute bottom-8 font-mono text-[8px] font-black uppercase tracking-widest text-[rgba(13,35,65,0.2)]">
        Fale com seu coach para reativar.
      </p>
    </div>
  )
}
