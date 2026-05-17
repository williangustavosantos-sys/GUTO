"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

const PENDING_INVITE_TOKEN_KEY = "guto-pending-invite-token"
const ENTRY_MODE_KEY = "guto-entry-mode"

export default function InvitePage() {
  const { token } = useParams() as { token: string }
  const router = useRouter()

  useEffect(() => {
    if (!token) return
    try {
      localStorage.setItem(PENDING_INVITE_TOKEN_KEY, token)
      localStorage.setItem(ENTRY_MODE_KEY, "invite")
    } catch {
      // Safari private mode — carry on anyway
    }
    router.replace("/")
  }, [token, router])

  return (
    <div className="sala-guto flex min-h-dvh items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-(--guto-cyan)" />
    </div>
  )
}
