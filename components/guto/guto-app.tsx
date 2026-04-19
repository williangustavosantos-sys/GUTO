"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { BottomNavigation, TabType } from "./bottom-navigation"
import { ChatTab } from "./tabs/chat-tab"
import { PathTab } from "./tabs/path-tab"
import { EvolutionsTab } from "./tabs/evolutions-tab"
import { MissionTab } from "./tabs/mission-tab"

interface GutoAppProps {
  userName: string
  language: string
}

export function GutoApp({ userName, language }: GutoAppProps) {
  const [activeTab, setActiveTab] = useState<TabType>("guto")

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "guto":
        return <ChatTab userName={userName} language={language} />
      case "caminho":
        return <PathTab userName={userName} language={language} />
      case "evolucoes":
        return <EvolutionsTab userName={userName} language={language} />
      case "missao":
        return <MissionTab userName={userName} language={language} />
      default:
        return <ChatTab userName={userName} language={language} />
    }
  }, [activeTab, userName, language])

  return (
    <div className="relative w-full h-dvh bg-white overflow-hidden">
      <main className="relative z-10 h-full pb-[90px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {tabContent}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} language={language} />
    </div>
  )
}