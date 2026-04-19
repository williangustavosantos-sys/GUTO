"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence } from "framer-motion"
import CapsuleDoor from "@/components/CapsuleDoor"
import { LanguageScreen } from "@/components/guto/screens/language-screen"
import { NameScreen } from "@/components/guto/screens/name-screen"
import { AgreementScreen } from "@/components/guto/screens/agreement-screen"
import { GutoApp } from "@/components/guto/guto-app"

type AppState = "splash" | "language" | "name" | "agreement" | "app"

const STORAGE_KEYS = {
  agreed: "guto_agreed",
  language: "guto_language",
  userName: "guto_user_name",
} as const

export default function GutoPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [appState, setAppState] = useState<AppState>("splash")
  const [language, setLanguage] = useState("")
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const savedName = localStorage.getItem(STORAGE_KEYS.userName) || ""
    const savedLang = localStorage.getItem(STORAGE_KEYS.language) || ""
    const hasAgreed = localStorage.getItem(STORAGE_KEYS.agreed) === "true"

    setUserName(savedName)
    setLanguage(savedLang)
    setAppState("splash")
    setIsHydrated(true)

    // decisão real acontece no onComplete da cápsula
    // (respeita seu ritual de entrada)
    if (!hasAgreed) return
  }, [])

  const safeLanguage = useMemo(() => language || "pt-BR", [language])
  const safeUserName = useMemo(() => userName || "Usuário", [userName])

  const handleSplashComplete = () => {
    const hasAgreed = localStorage.getItem(STORAGE_KEYS.agreed) === "true"
    if (hasAgreed) {
      setAppState("app")
      return
    }
    setAppState("language")
  }

  const handleLanguageSelect = (lang: string) => {
    setLanguage(lang)
    localStorage.setItem(STORAGE_KEYS.language, lang)
    setAppState("name")
  }

  const handleNameSubmit = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setUserName(trimmed)
    localStorage.setItem(STORAGE_KEYS.userName, trimmed)
    setAppState("agreement")
  }

  const handleAgreementComplete = () => {
    localStorage.setItem(STORAGE_KEYS.agreed, "true")
    setAppState("app")
  }

  if (!isHydrated) return null

  return (
    <AnimatePresence mode="wait">
      {appState === "splash" && (
        <CapsuleDoor key="splash" onComplete={handleSplashComplete} />
      )}

      {appState === "language" && (
        <LanguageScreen
          key="language"
          onSelect={handleLanguageSelect}
          selectedLanguage={language}
        />
      )}

      {appState === "name" && (
        <NameScreen key="name" onSubmit={handleNameSubmit} language={safeLanguage} />
      )}

      {appState === "agreement" && (
        <AgreementScreen
          key="agreement"
          userName={safeUserName}
          language={safeLanguage}
          onComplete={handleAgreementComplete}
        />
      )}

      {appState === "app" && (
        <GutoApp key="app" userName={safeUserName} language={safeLanguage} />
      )}
    </AnimatePresence>
  )
}