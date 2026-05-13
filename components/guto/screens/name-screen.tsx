"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Check, CheckCircle2 } from "lucide-react"
import { ParticlesBackground } from "../particles-background"

interface NameScreenProps {
  onSubmit: (name: string) => void
  language?: string
}

const localeTexts: Record<string, { complete: string; placeholder: string }> = {
  "pt-BR": { complete: "Complete.", placeholder: "Seu nome" },
  "it-IT": { complete: "Completa.", placeholder: "Il tuo nome" },
  "en-US": { complete: "Complete.", placeholder: "Your name" },
}

export function NameScreen({ onSubmit, language = "pt-BR" }: NameScreenProps) {
  const [name, setName] = useState("")
  const locale = localeTexts[language] ?? localeTexts["pt-BR"]
  const canSubmit = name.trim().length >= 2

  const displayName = useMemo(() => {
    const trimmed = name.trim()
    return trimmed.length ? trimmed : "..."
  }, [name])

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(name.trim())
  }

  return (
    <motion.section
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden px-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,0.5) 50%, rgba(226,232,240,0.3) 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ParticlesBackground />

      <div
        className="absolute inset-4 rounded-3xl opacity-20"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, oklch(0.70 0.10 200 / 0.1) 50%, transparent 100%)",
          border: "1px solid oklch(0.70 0.10 200 / 0.2)",
        }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center w-full max-w-sm"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.45 }}
      >
        <motion.span
          className="text-muted-foreground/60 text-lg mb-8 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {locale.complete}
        </motion.span>

        <motion.div
          className="text-center mb-12"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.45 }}
        >
          <h1
            className="text-5xl font-black tracking-tight"
            style={{
              background:
                "linear-gradient(180deg, #c0d0e8 0%, #7a9cc9 25%, #a8c0dc 50%, #5a7fb0 75%, #8faed0 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 2px 4px oklch(0.40 0.08 240 / 0.4))",
            }}
          >
            GUTO
          </h1>
          <span className="text-muted-foreground/50 text-lg">&</span>
          <h2
            className="text-4xl font-light italic tracking-wide max-w-[90vw]"
            style={{
              background: "linear-gradient(180deg, #b8c8d8 0%, #8aa0b8 50%, #a0b8c8 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              overflowWrap: "break-word",
            }}
          >
            {displayName}
          </h2>
        </motion.div>

        <motion.div
          className="w-full glass-strong rounded-2xl p-2 flex items-center gap-3"
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{
            boxShadow: "0 4px 30px oklch(0.60 0.12 200 / 0.15), inset 0 1px 0 white",
          }}
        >
          <div className="pl-3">
            <CheckCircle2 className="w-6 h-6 text-primary/60" />
          </div>

          <input
            type="text"
            placeholder={locale.placeholder}
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none py-3"
            autoFocus
          />

          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center transition-all disabled:opacity-30"
            whileHover={canSubmit ? { scale: 1.05, backgroundColor: "oklch(0.65 0.15 240 / 0.2)" } : {}}
            whileTap={canSubmit ? { scale: 0.95 } : {}}
            aria-label="Confirmar nome"
          >
            <Check className="w-5 h-5 text-primary" />
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.section>
  )
}