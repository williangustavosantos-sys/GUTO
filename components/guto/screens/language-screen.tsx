"use client"

import { motion } from "framer-motion"
import { ParticlesBackground } from "../particles-background"

interface LanguageScreenProps {
  onSelect?: (lang: string) => void
  selectedLanguage?: string
}

const languages = [
  { code: "pt-BR", name: "Português", flag: "🇧🇷" },
  { code: "it-IT", name: "Italiano", flag: "🇮🇹" },
  { code: "es-ES", name: "Español", flag: "🇪🇸" },
  { code: "en-US", name: "English", flag: "🇺🇸" },
]

export function LanguageScreen({ onSelect, selectedLanguage }: LanguageScreenProps) {

  return (
    <motion.div 
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden px-6"
      style={{
        background: "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,0.5) 50%, rgba(226,232,240,0.3) 100%)"
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ParticlesBackground />

      {/* Background frame effect */}
      <div 
        className="absolute inset-4 rounded-3xl opacity-20"
        style={{
          background: "linear-gradient(180deg, transparent 0%, oklch(0.70 0.10 200 / 0.1) 50%, transparent 100%)",
          border: "1px solid oklch(0.70 0.10 200 / 0.2)"
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-sm space-y-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {languages.map((lang, index) => {
          const isSelected = selectedLanguage === lang.code
          return (
            <motion.button
              key={lang.code}
              onClick={() => onSelect && onSelect(lang.code)}
              className={`w-full glass-strong rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isSelected 
                  ? "border-2 border-blue-500 shadow-lg shadow-blue-500/30" 
                  : "border border-transparent"
              }`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ 
                boxShadow: "0 8px 30px oklch(0.60 0.12 200 / 0.2)" 
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-12 h-8 rounded-lg overflow-hidden flex items-center justify-center text-2xl bg-white shadow-inner">
                {lang.flag}
              </div>
              <span className={`text-xl font-semibold ${
                isSelected ? "text-blue-600" : "text-foreground/80"
              }`}>
                {lang.name}
              </span>
            </motion.button>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
