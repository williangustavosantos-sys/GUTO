"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Mic, Send, Volume2, VolumeX } from "lucide-react"

import { sendGutoMessage } from "@/lib/api/guto"
import type { EvolutionStage, SupportedLanguage } from "@/types/contract"

import { GutoOfficialAvatar } from "../guto-official-avatar"
import { getLanguage, translations } from "../translations"

interface ChatTabProps {
  userName: string
  language: string
  evolution?: EvolutionStage
}

interface Message {
  id: string
  text: string
  isGuto: boolean
  timestamp: Date
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

const chatCopy: Record<SupportedLanguage, { channel: string; speaking: string }> = {
  "pt-BR": { channel: "Canal do oráculo", speaking: "falando" },
  "en-US": { channel: "Oracle channel", speaking: "speaking" },
  "es-ES": { channel: "Canal del oráculo", speaking: "hablando" },
  "it-IT": { channel: "Canale dell'oracolo", speaking: "parlando" },
}

const openingMessage: Record<SupportedLanguage, (name: string) => string> = {
  "pt-BR": (name) => `Oi ${name}, finalmente chegou. Estava te esperando!`,
  "en-US": (name) => `Hi ${name}, you finally made it. I was waiting for you!`,
  "es-ES": (name) => `Hola ${name}, por fin llegaste. Te estaba esperando!`,
  "it-IT": (name) => `Ciao ${name}, finalmente sei arrivato. Ti stavo aspettando!`,
}

function formatDisplayName(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleUpperCase()
}

export function ChatTab({ userName, language, evolution = "BABY" }: ChatTabProps) {
  const validLang = getLanguage(language)
  const locale = translations[validLang]
  const copy = chatCopy[validLang]
  const brandName = formatDisplayName(userName || "OPERADOR")
  const initialGutoMessage = openingMessage[validLang](brandName)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "guto-initial",
      text: initialGutoMessage,
      isGuto: true,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>(messages)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0]?.id !== "guto-initial") return current

      const next = [
        {
          ...current[0],
          text: initialGutoMessage,
        },
      ]
      messagesRef.current = next
      return next
    })
  }, [initialGutoMessage])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
    }
  }, [])

  const lastGutoIndex = useMemo(
    () => messages.reduce((acc, msg, index) => (msg.isGuto ? index : acc), -1),
    [messages]
  )

  const playBase64Mp3 = async (audioBase64: string) => {
    if (!audioBase64 || audioBase64.length < 100) return

    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }

      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`)
      currentAudioRef.current = audio
      setIsSpeaking(true)

      audio.onended = () => setIsSpeaking(false)
      audio.onerror = () => setIsSpeaking(false)

      await audio.play()
    } catch (error) {
      setIsSpeaking(false)
      console.error("Erro ao reproduzir áudio:", error)
    }
  }

  const synthesizeAndPlay = async (text: string, lang: SupportedLanguage) => {
    try {
      const response = await fetch(`${API_URL}/voz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: lang }),
      })

      const data = await response.json()

      if (!response.ok || !data?.audioContent) {
        console.error("Falha ao gerar voz:", data)
        return
      }

      await playBase64Mp3(data.audioContent)
    } catch (error) {
      console.error("Erro na rota /voz:", error)
    }
  }

  const sendAudio = async (blob: Blob) => {
    setIsSending(true)
    const formData = new FormData()
    formData.append("audio", blob)
    formData.append("language", language)

    try {
      const response = await fetch(`${API_URL}/guto-audio`, { method: "POST", body: formData })
      const data = await response.json()

      const gutoMessage: Message = {
        id: `g-audio-${Date.now()}`,
        text: data.fala || "Executado.",
        isGuto: true,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, gutoMessage])

      if (!isMuted && data.audioContent) {
        await playBase64Mp3(data.audioContent)
      }
    } catch (error) {
      console.error("Erro no envio do áudio:", error)
    } finally {
      setIsSending(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => audioChunksRef.current.push(event.data)
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        await sendAudio(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Erro ao acessar microfone", error)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    const userText = input.trim()
    const safeLanguage = getLanguage(language) as SupportedLanguage

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
        language: safeLanguage,
        history: messagesRef.current.map((message) => ({
          role: message.isGuto ? "model" : "user",
          parts: [{ text: message.text }],
        })),
      })

      const fala = data?.fala?.trim() || "Sem distração. Executa a próxima ação agora."

      const gutoMessage: Message = {
        id: `g-${Date.now()}`,
        text: fala,
        isGuto: true,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, gutoMessage])

      if (!isMuted) {
        await synthesizeAndPlay(fala, safeLanguage)
      }
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

  const latestGuto = messages[lastGutoIndex] ?? messages[0]
  const latestUser = [...messages].reverse().find((message) => !message.isGuto)

  return (
    <div className="relative h-full min-h-[690px] overflow-hidden">
      <div className="guto-top-strip absolute left-0 top-[1.03%] h-[9.27%] w-full border-y border-[var(--guto-cyan)]">
        <div className="guto-chat-brand" aria-label={brandName ? `GUTO e ${brandName}` : "GUTO"}>
          <img src="/assets/guto/logo_guto.png" alt="GUTO" className="guto-chat-brand-logo" />
        </div>
        {brandName && (
          <div className="guto-chat-partner">
            <span className="guto-chat-partner-amp" aria-hidden="true">
              &
            </span>
            <span className="guto-chat-partner-name">{brandName}</span>
          </div>
        )}
      </div>

      <div className="guto-chat-bubble absolute left-[21.89%] top-[13.16%] flex h-[10.98%] w-[57.71%] items-center justify-between gap-2 rounded-[18px] py-3 pl-[7.4%] pr-[15%]">
          <motion.p
            key={latestGuto.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0 flex-1 text-center font-mono text-[clamp(10px,2.8vw,13px)] font-black leading-[1.14] tracking-normal text-[var(--guto-navy)]"
          >
            {latestGuto.text}
          </motion.p>

          <button
            type="button"
            onClick={() =>
              setIsMuted((prev) => {
                const next = !prev
                if (next && currentAudioRef.current) {
                  currentAudioRef.current.pause()
                  currentAudioRef.current = null
                  setIsSpeaking(false)
                }
                return next
              })
            }
            className="absolute bottom-[5px] right-[7px] grid h-[30px] w-[29px] shrink-0 place-items-center rounded-full text-[var(--guto-cyan)]"
            aria-label={isMuted ? "Ativar som" : "Silenciar som"}
          >
            {isMuted ? <VolumeX className="h-[30px] w-[29px]" /> : <Volume2 className="h-[30px] w-[29px]" />}
          </button>
        </div>

      <div className="absolute left-[-0.8%] top-[21.5%] flex h-[63.2%] w-[101.6%] items-center justify-center">
          <GutoOfficialAvatar
            size="xl"
            showPlatform={false}
            evolution={evolution}
            className="h-full w-full"
          />
        </div>

        {latestUser && (
          <motion.div
            key={latestUser.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-1/2 top-[70.8%] max-w-[84%] -translate-x-1/2 rounded-[1.1rem] border border-white/80 bg-white/45 px-4 py-2 text-center text-xs font-semibold uppercase tracking-normal text-[rgba(13,35,65,0.58)] backdrop-blur-md"
          >
            {latestUser.text}
          </motion.div>
        )}

      <div className="absolute left-[8.46%] top-[74.94%] z-10 h-[58px] w-[81.34%]">
        <div className="guto-chat-input h-full rounded-[18px] px-3 py-2">
          <div className="flex h-full items-center gap-3">
            <motion.button
              type="button"
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerLeave={() => isRecording && stopRecording()}
              className="grid h-[30px] w-[29px] shrink-0 place-items-center rounded-full text-[var(--guto-cyan)]"
              animate={isRecording ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.8, repeat: isRecording ? Infinity : 0 }}
              aria-label="Microfone"
            >
              <Mic className="h-[30px] w-[29px]" style={{ color: isRecording ? "#c03535" : "var(--guto-cyan)" }} />
            </motion.button>

            <input
              type="text"
              placeholder={locale.placeholder.toUpperCase()}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleSend()}
              className="min-w-0 flex-1 bg-transparent text-center text-[16px] font-semibold uppercase leading-none tracking-[0.3px] text-[var(--guto-navy)] outline-none placeholder:text-[#a6aeb1]"
            />

            <motion.button
              type="button"
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="grid h-[30px] w-[29px] shrink-0 place-items-center rounded-full text-[var(--guto-cyan)] disabled:opacity-35"
              whileTap={{ scale: isSending ? 1 : 0.94 }}
              aria-label="Enviar mensagem"
            >
              {isSending ? <Loader2 className="h-[25px] w-[25px] animate-spin" /> : <Send className="h-[30px] w-[29px]" />}
            </motion.button>
          </div>
        </div>

        {isSpeaking && !isMuted && (
          <div className="mt-2 text-center font-mono text-[9px] uppercase tracking-normal text-[var(--guto-cyan)]">
            {copy.speaking}
          </div>
        )}
      </div>
    </div>
  )
}
