"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function InvitePage() {
  const { token } = useParams() as { token: string }
  const router = useRouter()

  useEffect(() => {
    if (!token) return
    try {
      localStorage.setItem("guto-pending-invite-token", token)
    } catch {
      // Safari private mode — carry on anyway
    }
    router.replace("/")
  }, [token, router])

  return (
    <div className="sala-guto flex min-h-dvh items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--guto-cyan)]" />
    </div>
  )
}
