"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mic, Send } from "lucide-react"
import { GutoOfficialAvatar } from "../guto-official-avatar"
import { getLanguage, translations } from "../translations"

interface ChatTabProps {
  userName: string
  language: string
}

interface Message {
  id: string
  text: string
  isGuto: boolean
  timestamp: Date
}

export function ChatTab({ userName, language }: ChatTabProps) {
  const validLang = getLanguage(language)
  const locale = translations[validLang]
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: locale.initialMessage,
      isGuto: true,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")

  const handleSend = async () => {
    if (!input.trim()) return
    
    // ✅ FIX 3 & 4: Validar idioma antes de enviar
    const safeLanguage = getLanguage(language)
    
    const userText = input.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      isGuto: false,
      timestamp: new Date(),
    }
    
    setMessages((prev) => [...prev, userMessage])
    setInput("")

    try {
      // Chamada real para a API do Guto
      const response = await fetch("http://localhost:3001/guto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { name: userName },
          input: userText,
          language: safeLanguage,
          history: messages.map((m) => ({
            role: m.isGuto ? "model" : "user",
            parts: [{ text: m.text }],
          })),
        }),
      })

      const data = await response.json()

      const gutoMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.fala || "...",
        isGuto: true,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, gutoMessage])
    } catch (error) {
      console.error("Erro na comunicação com a API do Guto:", error)
    }
  }

  const lastGutoIndex = messages.reduce((acc, msg, idx) => msg.isGuto ? idx : acc, -1)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-center pt-4 pb-2">
        <h1 
          className="text-2xl font-black tracking-tight"
          style={{
            background: "linear-gradient(180deg, #c0d0e8 0%, #7a9cc9 25%, #a8c0dc 50%, #5a7fb0 75%, #8faed0 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          GUTO
        </h1>
        <span className="text-muted-foreground/40 mx-1 text-sm">&</span>
        <span 
          className="text-xl font-light italic"
          style={{
            background: "linear-gradient(180deg, #b8c8d8 0%, #8aa0b8 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {userName}
        </span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 flex flex-col justify-end">
        <div className="space-y-6 w-full flex flex-col justify-end min-h-full">
          {messages.map((message, index) => {
            const isGuto = message.isGuto
            const isLatestGuto = isGuto && index === lastGutoIndex

            if (isGuto) {
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center w-full"
                >
                  <div 
                    className={`text-center transition-all duration-500 px-4 ${
                      isLatestGuto 
                        ? "text-xl sm:text-2xl font-semibold text-foreground/90" 
                        : "text-sm text-foreground/40 font-medium"
                    }`}
                  >
                    {message.text}
                  </div>
                </motion.div>
              )
            } else {
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end w-full"
                >
                  <div className="bg-foreground/5 backdrop-blur-md rounded-2xl px-4 py-2 text-sm text-foreground/60 max-w-[75%] border border-foreground/5">
                    {message.text}
                  </div>
                </motion.div>
              )
            }
          })}
        </div>
      </div>

      {/* Guto Avatar Video */}
      <div className="flex justify-center py-6 shrink-0 relative z-20">
        <GutoOfficialAvatar size="xl" showPlatform={false} className="w-64 h-64" />
      </div>

      {/* Input area */}
      <div className="px-4 pb-24 shrink-0 relative z-20">
        <div 
          className="glass-strong rounded-2xl p-2 flex items-center gap-2"
          style={{
            boxShadow: "0 -4px 20px oklch(0.50 0.08 240 / 0.05)"
          }}
        >
          <button className="p-2 text-muted-foreground/50 hover:text-primary transition-colors">
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder={locale.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none py-2"
          />
          <motion.button
            onClick={handleSend}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
