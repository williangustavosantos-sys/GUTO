"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Play, Square, RefreshCcw } from "lucide-react"

import { gutoVoice, type GutoVoiceResult, type GutoVoiceSource } from "@/lib/guto-voice/guto-voice-service"

const sampleByLanguage: Record<string, string> = {
  "pt-BR": "Estamos juntos nessa. Bora iniciar, hoje a gente não falha.",
  "en-US": "I’m with you on this. Start strong. We don’t fold today.",
  "it-IT": "Ci sono con te. Partiamo forte. Oggi non molliamo.",
}

type CacheInspection = Awaited<ReturnType<typeof gutoVoice.inspect>>

export default function VoiceDevPage() {
  const [language, setLanguage] = useState("pt-BR")
  const [source, setSource] = useState<GutoVoiceSource>("chat")
  const [intentKey, setIntentKey] = useState("")
  const [preferStatic, setPreferStatic] = useState(false)
  const [allowRemoteSynthesis, setAllowRemoteSynthesis] = useState(true)
  const [text, setText] = useState(sampleByLanguage["pt-BR"])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<GutoVoiceResult | null>(null)
  const [inspection, setInspection] = useState<CacheInspection>(null)

  const statusLabel = useMemo(() => {
    if (!result) return "Aguardando teste"
    if (result.mode === "static-file") return "Arquivo premium"
    if (result.mode === "local-cache") return "Banco local"
    if (result.mode === "remote-saved") return "Gerou e salvou"
    if (result.mode === "browser-fallback") return "Fallback navegador"
    return "Sem áudio"
  }, [result])

  const refreshInspection = useCallback(async () => {
    setInspection(await gutoVoice.inspect(text, language))
  }, [language, text])

  useEffect(() => {
    void refreshInspection()
  }, [refreshInspection])

  return (
    <main className="min-h-screen bg-[#f7fbff] px-5 py-8 text-[#07182f]">
      <div className="mx-auto max-w-2xl">
        <header>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-cyan-500">
            GUTO VOICE LAB
          </p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-[0.04em]">
            Banco de voz
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Teste se a fala vem de arquivo premium, cache local, backend ou fallback do navegador.
          </p>
        </header>

        <section className="mt-6 space-y-4 rounded-2xl border border-white bg-white/70 p-4 shadow-[0_18px_60px_rgba(13,35,65,0.08)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Idioma
              </span>
              <select
                value={language}
                onChange={(event) => {
                  const next = event.target.value
                  setLanguage(next)
                  setText(sampleByLanguage[next] || sampleByLanguage["pt-BR"])
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
              >
                <option value="pt-BR">pt-BR</option>
                <option value="en-US">en-US</option>
                <option value="it-IT">it-IT</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Origem
              </span>
              <select
                value={source}
                onChange={(event) => setSource(event.target.value as GutoVoiceSource)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
              >
                <option value="chat">chat</option>
                <option value="online">online</option>
                <option value="system">system</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Intent opcional
            </span>
            <input
              value={intentKey}
              onChange={(event) => setIntentKey(event.target.value)}
              placeholder="session.entry.first_time"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
            />
          </label>

          <label className="grid gap-1">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Frase
            </span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={4}
              className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold leading-relaxed"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={preferStatic}
                onChange={(event) => setPreferStatic(event.target.checked)}
              />
              tentar VoicePack premium
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={allowRemoteSynthesis}
                onChange={(event) => setAllowRemoteSynthesis(event.target.checked)}
              />
              permitir backend /voz
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  const output = await gutoVoice.speak({
                    text,
                    language,
                    source,
                    intentKey: intentKey.trim() || undefined,
                    preferStatic,
                    allowRemoteSynthesis,
                  })
                  setResult(output)
                  await refreshInspection()
                } finally {
                  setBusy(false)
                }
              }}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-slate-950 disabled:opacity-40"
            >
              <Play className="h-4 w-4" />
              {busy ? "tocando" : "tocar GUTO"}
            </button>
            <button
              type="button"
              onClick={() => gutoVoice.stop()}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-mono text-[11px] font-black uppercase tracking-[0.16em]"
            >
              <Square className="h-4 w-4" />
              parar
            </button>
            <button
              type="button"
              onClick={refreshInspection}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-mono text-[11px] font-black uppercase tracking-[0.16em]"
            >
              <RefreshCcw className="h-4 w-4" />
              cache
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-white bg-white/70 p-4 shadow-[0_18px_60px_rgba(13,35,65,0.06)]">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500">
            Resultado
          </p>
          <h2 className="mt-2 text-lg font-black uppercase">{statusLabel}</h2>
          <pre className="mt-3 max-h-[22rem] overflow-auto rounded-xl bg-slate-950 p-3 text-xs leading-relaxed text-cyan-100">
            {JSON.stringify({ result, inspection }, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  )
}
