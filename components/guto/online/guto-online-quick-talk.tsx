"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Keyboard, Mic, MicOff, MessageCircle, Send, X } from "lucide-react"

import {
  classifyQuickTalk,
  voiceFailureText,
  type ContextClassification,
} from "@/lib/guto-online/guto-online-context-guard"

interface GutoOnlineQuickTalkProps {
  open: boolean
  language: string
  userName?: string
  initialMode?: "voice" | "text"
  /**
   * Linha que o GUTO vai dizer como resposta (preenchida depois de classifyQuickTalk).
   * Permite mostrar a resposta antes do "Entendi, continuar".
   */
  responseLine?: string
  /**
   * Disparado quando o usuário envia texto/voz transcrita.
   * O componente já passa a classificação por context-guard pronta.
   */
  onSubmit: (input: { text: string; mode: "voice" | "text"; classification: ContextClassification }) => void
  /**
   * Disparado quando o usuário toca "Entendi, continuar".
   */
  onResume: () => void
  /**
   * Disparado quando o usuário toca "Cancelar".
   */
  onCancel: () => void
  /**
   * Avisado quando o reconhecimento de voz falha por barulho/sem permissão.
   * A UI mostra o texto humano apropriado.
   */
  onVoiceFailed?: () => void
}

type RecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string }
  }>
}

const COPY: Record<string, {
  title: (name: string) => string
  pushToTalk: string
  releaseToSend: string
  typeFast: string
  cancel: string
  send: string
  resume: string
  placeholder: string
  switchToText: string
  switchToVoice: string
  noisy: string
}> = {
  "pt-BR": {
    title: (name) => `Fala comigo, ${name}.`,
    pushToTalk: "Segurar para falar",
    releaseToSend: "Solta para enviar",
    typeFast: "Digitar rápido",
    cancel: "Cancelar",
    send: "Enviar",
    resume: "Entendi, continuar",
    placeholder: "Digita aqui rapidinho…",
    switchToText: "Trocar para texto",
    switchToVoice: "Trocar para voz",
    noisy: "Tá muito barulho. Digita aí.",
  },
  "en-US": {
    title: (name) => `Talk to me, ${name}.`,
    pushToTalk: "Hold to speak",
    releaseToSend: "Release to send",
    typeFast: "Type fast",
    cancel: "Cancel",
    send: "Send",
    resume: "Got it, continue",
    placeholder: "Type it here quick…",
    switchToText: "Switch to text",
    switchToVoice: "Switch to voice",
    noisy: "Too noisy. Type instead.",
  },
  "it-IT": {
    title: (name) => `Parlami, ${name}.`,
    pushToTalk: "Tieni premuto",
    releaseToSend: "Rilascia per inviare",
    typeFast: "Scrivi veloce",
    cancel: "Annulla",
    send: "Invia",
    resume: "Capito, continua",
    placeholder: "Scrivi qui veloce…",
    switchToText: "Passa al testo",
    switchToVoice: "Passa alla voce",
    noisy: "Troppo rumore. Scrivi pure.",
  },
}

function pickCopy(language: string) {
  if (language in COPY) return COPY[language]
  const prefix = language.split("-")[0]
  const found = Object.keys(COPY).find((key) => key.startsWith(prefix))
  return found ? COPY[found] : COPY["pt-BR"]
}

/**
 * Quick Talk Mode.
 *
 * Fluxo:
 *   Falar com GUTO  →  fala/digita  →  classifica  →  responde  →  Entendi, continuar
 *
 * O componente classifica localmente via context-guard. O pai pode usar a
 * intenção para disparar eventos (PAIN_REPORTED, SWAP_REQUESTED, etc.) e
 * eventualmente enriquecer a resposta com IA — mas a primeira resposta
 * vem instantânea, sem depender da rede.
 */
export function GutoOnlineQuickTalk({
  open,
  language,
  userName,
  initialMode = "voice",
  responseLine,
  onSubmit,
  onResume,
  onCancel,
  onVoiceFailed,
}: GutoOnlineQuickTalkProps) {
  const copy = pickCopy(language)
  const [mode, setMode] = useState<"voice" | "text">(initialMode)
  const [pressing, setPressing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [typed, setTyped] = useState("")
  const [showNoisy, setShowNoisy] = useState(false)
  const recognitionRef = useRef<RecognitionLike | null>(null)
  const finalTranscriptRef = useRef("")

  const ensureRecognition = useCallback(() => {
    if (typeof window === "undefined") return null
    if (recognitionRef.current) return recognitionRef.current

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) return null
    // BrowserSpeechRecognition (declarado globalmente em chat-tab.tsx) tem assinaturas
    // de evento diferentes da nossa RecognitionLike. Cast via unknown porque os tipos
    // não se sobrepõem suficientemente para TS aceitar o cast direto.
    const recognition = new Ctor() as unknown as RecognitionLike
    recognition.lang = language
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let finalText = ""
      let interim = ""
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      finalTranscriptRef.current = finalText.trim() || finalTranscriptRef.current
      setTranscript((finalText || interim).trim())
    }
    recognition.onerror = () => {
      setShowNoisy(true)
      onVoiceFailed?.()
    }
    recognition.onend = () => {
      setPressing(false)
    }
    recognitionRef.current = recognition
    return recognition
  }, [language, onVoiceFailed])

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // já parado
    }
  }, [])

  useEffect(() => {
    if (!open) {
      stopRecognition()
      setMode(initialMode)
      setTranscript("")
      setTyped("")
      setShowNoisy(false)
      finalTranscriptRef.current = ""
    }
  }, [open, initialMode, stopRecognition])

  const startListening = useCallback(() => {
    const recognition = ensureRecognition()
    if (!recognition) {
      setMode("text")
      setShowNoisy(true)
      onVoiceFailed?.()
      return
    }
    setShowNoisy(false)
    setTranscript("")
    finalTranscriptRef.current = ""
    setPressing(true)
    try {
      recognition.start()
    } catch {
      // já iniciado
    }
  }, [ensureRecognition, onVoiceFailed])

  const submitVoice = useCallback(() => {
    stopRecognition()
    setPressing(false)
    const text = (finalTranscriptRef.current || transcript || "").trim()
    if (!text) {
      setShowNoisy(true)
      onVoiceFailed?.()
      return
    }
    const classification = classifyQuickTalk({ rawText: text, language, userName })
    onSubmit({ text, mode: "voice", classification })
  }, [language, onSubmit, onVoiceFailed, stopRecognition, transcript, userName])

  const submitText = useCallback(() => {
    const text = typed.trim()
    if (!text) return
    const classification = classifyQuickTalk({ rawText: text, language, userName })
    onSubmit({ text, mode: "text", classification })
    setTyped("")
  }, [language, onSubmit, typed, userName])

  const headline = useMemo(
    () => copy.title(userName?.trim() || (language.startsWith("pt") ? "parceiro" : language.startsWith("it") ? "amico" : "buddy")),
    [copy, language, userName],
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-[rgba(13,35,65,0.46)] backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-t-[1.5rem] border border-white/80 bg-white/95 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-30px_80px_rgba(13,35,65,0.18)]">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[var(--guto-cyan)]">
              {language.startsWith("it") ? "Parla con GUTO" : language.startsWith("en") ? "Talk with GUTO" : "Falar com GUTO"}
            </p>
            <h2 className="mt-1 text-[1.05rem] font-black leading-tight tracking-[0.02em] text-[var(--guto-navy)]">
              {headline}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={copy.cancel}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/55"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {showNoisy && (
          <p className="mt-3 rounded-[0.95rem] border border-[rgba(213,142,42,0.28)] bg-[rgba(213,142,42,0.1)] px-3 py-2 text-[12px] font-bold text-[rgba(13,35,65,0.84)]">
            {voiceFailureText(language, userName) || copy.noisy}
          </p>
        )}

        {responseLine && (
          <section className="mt-3 rounded-[1rem] border border-[rgba(82,231,255,0.32)] bg-[rgba(82,231,255,0.08)] p-3">
            <p className="font-mono text-[8px] font-black uppercase tracking-[0.18em] text-[rgba(13,35,65,0.5)]">GUTO</p>
            <p className="mt-1 text-[13px] font-bold leading-snug text-[rgba(13,35,65,0.86)]">{responseLine}</p>
          </section>
        )}

        {mode === "voice" ? (
          <section className="mt-4 flex flex-col items-center gap-3">
            <button
              type="button"
              onPointerDown={startListening}
              onPointerUp={submitVoice}
              onPointerCancel={() => {
                stopRecognition()
                setPressing(false)
              }}
              onPointerLeave={() => {
                if (pressing) submitVoice()
              }}
              className={[
                "flex h-20 w-full max-w-xs items-center justify-center gap-2 rounded-[1.4rem] font-mono text-[11px] font-black uppercase tracking-[0.18em] transition-colors",
                pressing
                  ? "border border-[rgba(82,231,255,0.7)] bg-[rgba(82,231,255,0.22)] text-[var(--guto-navy)]"
                  : "border border-white/70 bg-white/65 text-[var(--guto-navy)]",
              ].join(" ")}
            >
              {pressing ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {pressing ? copy.releaseToSend : copy.pushToTalk}
            </button>

            {transcript && (
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[rgba(13,35,65,0.5)]">
                {transcript}
              </p>
            )}

            <button
              type="button"
              onClick={() => setMode("text")}
              className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--guto-cyan)] underline-offset-4 hover:underline"
            >
              <Keyboard className="h-3.5 w-3.5" />
              {copy.switchToText}
            </button>
          </section>
        ) : (
          <section className="mt-4 flex flex-col gap-2">
            <textarea
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={copy.placeholder}
              rows={3}
              className="w-full resize-none rounded-[1rem] border border-white/70 bg-white/65 p-3 text-[14px] font-medium text-[var(--guto-navy)] outline-none placeholder:text-[rgba(13,35,65,0.4)] focus:border-[rgba(82,231,255,0.6)]"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode("voice")}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--guto-cyan)] underline-offset-4 hover:underline"
              >
                <Mic className="h-3.5 w-3.5" />
                {copy.switchToVoice}
              </button>
              <button
                type="button"
                onClick={submitText}
                disabled={!typed.trim()}
                className="flex h-11 items-center gap-2 rounded-[1rem] border border-[rgba(82,231,255,0.55)] bg-[rgba(82,231,255,0.16)] px-4 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[var(--guto-navy)] disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                {copy.send}
              </button>
            </div>
          </section>
        )}

        <footer className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-white/70 bg-white/55 font-mono text-[10px] font-black uppercase tracking-[0.14em]"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            onClick={onResume}
            disabled={!responseLine}
            className="flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-[rgba(82,231,255,0.55)] bg-[rgba(82,231,255,0.16)] font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[var(--guto-navy)] disabled:opacity-40"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {copy.resume}
          </button>
        </footer>
      </div>
    </div>
  )
}
