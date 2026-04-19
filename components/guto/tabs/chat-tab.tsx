"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Mic, Send } from "lucide-react"
import { GutoOfficialAvatar } from "../guto-official-avatar"
import { getLanguage, translations } from "../translations"
import { sendGutoMessage, type SupportedLanguage } from "@/lib/guto"

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export function ChatTab({ userName, language }: ChatTabProps) {
  const validLang = getLanguage(language)
  const locale = translations[validLang]

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "guto-initial",
      text: locale.initialMessage,
      isGuto: true,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  const lastGutoIndex = useMemo(
    () => messages.reduce((acc, msg, idx) => (msg.isGuto ? idx : acc), -1),
    [messages]
  )

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    const userText = input.trim()
    const safeLanguage = getLanguage(language)

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      text: userText,
      isGuto: false,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsSending(true)

    try {
      const data = await sendGutoMessage({
        profile: { name: userName || "Usuário" },
        input: userText,
        language: safeLanguage as SupportedLanguage,
        history: messagesRef.current.map((m) => ({
          role: m.isGuto ? "model" : "user",
          parts: [{ text: m.text }],
        })),
      })

      const gutoMessage: Message = {
        id: `g-${Date.now()}`,
        text: data?.fala?.trim() || "Sem desculpa. Executa a próxima ação agora.",
        isGuto: true,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, gutoMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `g-err-${Date.now()}`,
          text: "Perdi conexão por um momento. Reorganiza e me envia de novo em 1 frase.",
          isGuto: true,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-center pt-4 pb-2">
        <h1
          className="text-2xl font-black tracking-tight"
          style={{
            background:
              "linear-gradient(180deg, #c0d0e8 0%, #7a9cc9 25%, #a8c0dc 50%, #5a7fb0 75%, #8faed0 100%)",
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 flex flex-col justify-end">
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
            }

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
          })}
        </div>
      </div>

      {/* Avatar */}
      <div className="flex justify-center py-6 shrink-0 relative z-20">
        <GutoOfficialAvatar size="xl" showPlatform={false} className="w-64 h-64" />
      </div>

      {/* Input */}
      <div className="px-4 pb-24 shrink-0 relative z-20">
        <div
          className="glass-strong rounded-2xl p-2 flex items-center gap-2"
          style={{ boxShadow: "0 -4px 20px oklch(0.50 0.08 240 / 0.05)" }}
        >
          <button
            type="button"
            className="p-2 text-muted-foreground/50 hover:text-primary transition-colors"
            aria-label="Microfone"
          >
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
            type="button"
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-50"
            whileHover={{ scale: isSending ? 1 : 1.05 }}
            whileTap={{ scale: isSending ? 1 : 0.95 }}
            aria-label="Enviar mensagem"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </div>
  )
}