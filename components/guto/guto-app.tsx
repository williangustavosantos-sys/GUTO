"use client"

import { useState } from "react"
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

  const tabComponents: Record<TabType, React.ReactNode> = {
    guto: <ChatTab userName={userName} language={language} />,
    caminho: <PathTab userName={userName} language={language} />,
    evolucoes: <EvolutionsTab userName={userName} language={language} />,
    missao: <MissionTab userName={userName} language={language} />,
  }

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">

      {/* Main content */}
      <main className="relative z-10 h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {tabComponents[activeTab]}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} language={language} />

      {/* ✅ FIX 5: Reset button (debug/recovery) */}
      <button 
        onClick={() => {
          localStorage.clear()
          window.location.reload()
        }}
        style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px',
          zIndex: 50
        }}
        className="text-xs bg-gray-800 text-white px-3 py-1 rounded opacity-50 hover:opacity-100 transition-opacity"
        title="Limpar dados e recomeçar"
      >
        🔄 Reset
      </button>
    </div>
  )
}
