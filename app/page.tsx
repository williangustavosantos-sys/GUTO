"use client"

// Ponto de entrada principal da SPA - Controla a transição de telas sem recarregar rotas
import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import CapsuleDoor from "@/components/CapsuleDoor"
import { LanguageScreen } from "@/components/guto/screens/language-screen"
import { NameScreen } from "@/components/guto/screens/name-screen"
import { AgreementScreen } from "@/components/guto/screens/agreement-screen"
import { GutoApp } from "@/components/guto/guto-app"

type AppState = "splash" | "language" | "name" | "agreement" | "app"

export default function GutoPage() {
  // ✅ FIX 1: Inicializar com localStorage INLINE (não em useEffect)
  const [appState, setAppState] = useState<AppState>(() => {
    if (typeof window !== "undefined") {
      const hasAgreed = localStorage.getItem("guto_agreed")
      return hasAgreed ? "splash" : "splash"
    }
    return "splash"
  })

  const [language, setLanguage] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("guto_language") || ""
    }
    return ""
  })

  const [userName, setUserName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("guto_user_name") || ""
    }
    return ""
  })

  // Check for existing user data
  useEffect(() => {
    const savedName = localStorage.getItem("guto_user_name")
    const savedLang = localStorage.getItem("guto_language")
    const hasAgreed = localStorage.getItem("guto_agreed")

    if (savedName && savedLang && hasAgreed) {
      setUserName(savedName)
      setLanguage(savedLang)
      // Skip to app after brief splash
      setTimeout(() => setAppState("app"), 2500)
    }
  }, [])

  const handleSplashComplete = () => {
    const hasAgreed = localStorage.getItem("guto_agreed")
    if (hasAgreed) {
      setAppState("app")
    } else {
      setAppState("language")
    }
  }

  const handleLanguageSelect = (lang: string) => {
    setLanguage(lang)
    localStorage.setItem("guto_language", lang)
    setAppState("name")
  }

  const handleNameSubmit = (name: string) => {
    setUserName(name)
    localStorage.setItem("guto_user_name", name)
    setAppState("agreement")
  }

  const handleAgreementComplete = () => {
    localStorage.setItem("guto_agreed", "true")
    setAppState("app")
  }

  return (
    <AnimatePresence mode="wait">
      {appState === "splash" && (
        <CapsuleDoor key="splash" onComplete={handleSplashComplete} />
      )}
      {appState === "language" && (
        <LanguageScreen key="language" onSelect={handleLanguageSelect} selectedLanguage={language} />
      )}
      {appState === "name" && (
        <NameScreen key="name" onSubmit={handleNameSubmit} language={language} />
      )}
      {appState === "agreement" && (
        <AgreementScreen 
          key="agreement" 
          userName={userName} 
          language={language}
          onComplete={handleAgreementComplete} 
        />
      )}
      {appState === "app" && (
        <GutoApp key="app" userName={userName || "Usuário"} language={language || "pt-BR"} />
      )}
    </AnimatePresence>
  )
}
