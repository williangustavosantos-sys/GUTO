"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { GutoApp } from "@/components/guto/guto-app"
import { Loader2 } from "lucide-react"

function GutoPageContent() {
  const searchParams = useSearchParams()
  const skipIntro = searchParams.get("skip-intro") === "1"
  // Auth gate is handled inside GutoApp:
  // - intro/language stages are public
  // - after language is chosen, GutoApp redirects to /login if not authenticated
  // - naming/calibration/system stages require auth
  return <GutoApp userName="" language="pt-BR" skipIntro={skipIntro} />
}

const LoadingFallback = () => (
  <div className="sala-guto flex min-h-dvh items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-[var(--guto-cyan)]" />
  </div>
)

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GutoPageContent />
    </Suspense>
  )
}
