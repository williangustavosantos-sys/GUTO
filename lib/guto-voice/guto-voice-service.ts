"use client"

import manifest from "@/public/voicepack/manifest.json"
import { API_URL } from "@/lib/api/client"
import {
  VoiceResolver,
  type VoicePackManifest,
  type VoiceRuntimeState,
  createInitialVoiceRuntimeState,
  normalizeVoiceRuntimeState,
} from "@/lib/guto-online/voice-resolver"

export type GutoVoiceSource = "chat" | "online" | "system"

export interface SpeakGutoOptions {
  text: string
  language: string
  intentKey?: string
  source?: GutoVoiceSource
  preferStatic?: boolean
  allowRemoteSynthesis?: boolean
  onStart?: () => void
  onEnd?: () => void
}

export interface GutoVoiceBankRecord {
  key: string
  textHash: string
  text: string
  language: string
  voiceId: string
  voiceVersion: string
  source: GutoVoiceSource
  provider: "backend-voz"
  blob: Blob
  contentType: string
  createdAt: number
  lastUsedAt: number
  hitCount: number
}

export type GutoVoiceMode = "static-file" | "local-cache" | "remote-saved" | "browser-fallback" | "silent"

export interface GutoVoiceResult {
  mode: GutoVoiceMode
  cacheKey?: string
  file?: string
  textHash?: string
  voiceId: string
  voiceVersion: string
  contentType?: string
}

const VOICE_HISTORY_KEY = "guto.voice.history.v1"
const DB_NAME = "guto-voice-bank"
const DB_VERSION = 1
const AUDIO_STORE = "audio"
const MAX_REMOTE_TEXT_LENGTH = 240

function isBrowser() {
  return typeof window !== "undefined"
}

function getVoiceId() {
  return String((manifest as VoicePackManifest).voiceId || "GUTO")
}

function getVoiceVersion() {
  return String((manifest as VoicePackManifest).voiceVersion || "v1")
}

function loadVoiceState(): VoiceRuntimeState {
  if (!isBrowser()) return createInitialVoiceRuntimeState()
  try {
    return normalizeVoiceRuntimeState(JSON.parse(window.localStorage.getItem(VOICE_HISTORY_KEY) || "null"))
  } catch {
    return createInitialVoiceRuntimeState()
  }
}

function saveVoiceState(state: VoiceRuntimeState) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(VOICE_HISTORY_KEY, JSON.stringify(state))
  } catch {
    // Anti-repetition history is non-critical.
  }
}

function normalizeTextForHash(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

async function sha1(value: string) {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest("SHA-1", data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function base64ToBlob(base64: string, contentType = "audio/mpeg") {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new Blob([bytes], { type: contentType })
}

function openVoiceDb(): Promise<IDBDatabase | null> {
  if (!isBrowser() || !window.indexedDB) return Promise.resolve(null)

  return new Promise((resolve) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: "key" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
  })
}

async function getCachedAudio(key: string): Promise<GutoVoiceBankRecord | null> {
  const db = await openVoiceDb()
  if (!db) return null

  return new Promise((resolve) => {
    const transaction = db.transaction(AUDIO_STORE, "readonly")
    const request = transaction.objectStore(AUDIO_STORE).get(key)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => resolve(null)
  })
}

async function saveCachedAudio(record: GutoVoiceBankRecord) {
  const db = await openVoiceDb()
  if (!db) return

  await new Promise<void>((resolve) => {
    const transaction = db.transaction(AUDIO_STORE, "readwrite")
    transaction.objectStore(AUDIO_STORE).put(record)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => resolve()
  })
}

async function touchCachedAudio(record: GutoVoiceBankRecord) {
  await saveCachedAudio({
    ...record,
    lastUsedAt: Date.now(),
    hitCount: record.hitCount + 1,
  })
}

/**
 * Picks the best available browser voice for the language.
 * Priority: male voices (by name heuristic) matching the language code first,
 * then any matching language voice, then system default.
 * This avoids the default female voice (e.g. Google Maps "Alice") on most devices.
 */
function pickBrowserVoice(language: string): SpeechSynthesisVoice | null {
  if (!isBrowser() || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null

  const langCode = language.toLowerCase().replace("_", "-")
  const baseLang = langCode.split("-")[0]

  // Male-sounding name keywords (heuristic across pt-BR, en-US, it-IT)
  const maleKeywords = /male|masculino|homem|uomo|reed|daniel|jorge|mark|google uk english male|alex|diego|luciano|andrés/i

  const exactMatch = voices.filter((v) => v.lang.toLowerCase().replace("_", "-") === langCode)
  const baseMatch = voices.filter((v) => v.lang.toLowerCase().startsWith(baseLang))

  const preferMale = (list: SpeechSynthesisVoice[]) =>
    list.find((v) => maleKeywords.test(v.name)) ?? list[0] ?? null

  return preferMale(exactMatch) ?? preferMale(baseMatch) ?? null
}

function speakWithBrowser(text: string, language: string) {
  return new Promise<void>((resolve) => {
    if (!isBrowser() || !window.speechSynthesis || !text.trim()) {
      resolve()
      return
    }

    const doSpeak = () => {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language
      utterance.rate = 1.04
      utterance.pitch = 0.82  // slightly lower pitch for a less feminine sound
      const selectedVoice = pickBrowserVoice(language)
      if (selectedVoice) utterance.voice = selectedVoice
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.speak(utterance)
    }

    // Voices may not be loaded yet on first call — wait for them
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      doSpeak()
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null
        doSpeak()
      }
      // Safety timeout: speak even if onvoiceschanged never fires
      setTimeout(doSpeak, 500)
    }
  })
}

function isRemoteCacheable(text: string) {
  const normalized = normalizeTextForHash(text)
  if (!normalized || normalized.length > MAX_REMOTE_TEXT_LENGTH) return false
  if (/[{}]/.test(normalized)) return false
  return true
}

class GutoVoiceService {
  private resolver: VoiceResolver | null = null
  private currentAudio: HTMLAudioElement | null = null

  private getResolver() {
    if (!this.resolver) {
      this.resolver = new VoiceResolver(manifest as VoicePackManifest, loadVoiceState())
    }
    return this.resolver
  }

  stop() {
    if (!isBrowser()) return
    window.speechSynthesis?.cancel()
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio = null
    }
  }

  async speak(options: SpeakGutoOptions): Promise<GutoVoiceResult> {
    const {
      text,
      language,
      intentKey,
      source = "system",
      preferStatic = false,
      allowRemoteSynthesis = true,
      onStart,
      onEnd,
    } = options

    if (!isBrowser() || !text.trim()) {
      return {
        mode: "silent",
        voiceId: getVoiceId(),
        voiceVersion: getVoiceVersion(),
      }
    }

    onStart?.()
    this.stop()

    try {
      if (intentKey && preferStatic) {
        const resolver = this.getResolver()
        const voiceSource = resolver.resolve({ intentKey, lang: language, text })
        saveVoiceState(resolver.getState())

        if (voiceSource.kind === "file") {
          const played = await this.playFile(voiceSource.url)
          if (played) {
            return {
              mode: "static-file",
              file: voiceSource.url,
              voiceId: getVoiceId(),
              voiceVersion: getVoiceVersion(),
            }
          }
        }
      }

      const cacheKey = await this.cacheKey({ text, language })
      const cached = await getCachedAudio(cacheKey)
      if (cached) {
        await touchCachedAudio(cached)
        await this.playBlob(cached.blob)
        return {
          mode: "local-cache",
          cacheKey,
          textHash: cached.textHash,
          voiceId: cached.voiceId,
          voiceVersion: cached.voiceVersion,
          contentType: cached.contentType,
        }
      }

      if (allowRemoteSynthesis && isRemoteCacheable(text)) {
        const generated = await this.generateRemoteAudio({ text, language, source, cacheKey })
        if (generated) {
          await this.playBlob(generated.blob)
          return {
            mode: "remote-saved",
            cacheKey,
            textHash: generated.textHash,
            voiceId: generated.voiceId,
            voiceVersion: generated.voiceVersion,
            contentType: generated.contentType,
          }
        }
      }

      await speakWithBrowser(text, language)
      return {
        mode: "browser-fallback",
        cacheKey: await this.cacheKey({ text, language }),
        textHash: await sha1(normalizeTextForHash(text)),
        voiceId: getVoiceId(),
        voiceVersion: getVoiceVersion(),
      }
    } finally {
      onEnd?.()
    }
  }

  async inspect(text: string, language: string) {
    if (!isBrowser() || !text.trim()) return null
    const cacheKey = await this.cacheKey({ text, language })
    const cached = await getCachedAudio(cacheKey)
    return {
      cacheKey,
      cached: Boolean(cached),
      textHash: await sha1(normalizeTextForHash(text)),
      voiceId: getVoiceId(),
      voiceVersion: getVoiceVersion(),
      contentType: cached?.contentType,
      hitCount: cached?.hitCount ?? 0,
      createdAt: cached?.createdAt,
      lastUsedAt: cached?.lastUsedAt,
    }
  }

  private async cacheKey({ text, language }: { text: string; language: string }) {
    const normalizedText = normalizeTextForHash(text)
    const textHash = await sha1(normalizedText)
    return `${language}:${getVoiceId()}:${getVoiceVersion()}:${textHash}`
  }

  private async generateRemoteAudio({
    text,
    language,
    source,
    cacheKey,
  }: {
    text: string
    language: string
    source: GutoVoiceSource
    cacheKey: string
  }): Promise<GutoVoiceBankRecord | null> {
    try {
      const token = window.localStorage.getItem("guto-auth-token")
      const response = await fetch(`${API_URL}/voz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, language }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.audioContent) return null

      const contentType = typeof data.mimeType === "string" ? data.mimeType : "audio/mpeg"
      const voiceUsed = typeof data.voiceUsed === "string" && data.voiceUsed.trim() ? data.voiceUsed : getVoiceId()
      const record: GutoVoiceBankRecord = {
        key: cacheKey,
        textHash: await sha1(normalizeTextForHash(text)),
        text: normalizeTextForHash(text),
        language,
        voiceId: voiceUsed,
        voiceVersion: getVoiceVersion(),
        source,
        provider: "backend-voz",
        blob: base64ToBlob(data.audioContent, contentType),
        contentType,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        hitCount: 0,
      }
      await saveCachedAudio(record)
      return record
    } catch (error) {
      console.warn("[GUTO_VOICE] remote_synthesis_unavailable", { language, source, error })
      return null
    }
  }

  private playFile(url: string) {
    return new Promise<boolean>((resolve) => {
      try {
        const audio = new Audio(url)
        this.currentAudio = audio
        audio.onended = () => resolve(true)
        audio.onerror = () => resolve(false)
        void audio.play().catch(() => resolve(false))
      } catch {
        resolve(false)
      }
    })
  }

  private playBlob(blob: Blob) {
    return new Promise<void>((resolve) => {
      const url = URL.createObjectURL(blob)
      try {
        const audio = new Audio(url)
        this.currentAudio = audio
        const cleanup = () => {
          URL.revokeObjectURL(url)
          resolve()
        }
        audio.onended = cleanup
        audio.onerror = cleanup
        void audio.play().catch(cleanup)
      } catch {
        URL.revokeObjectURL(url)
        resolve()
      }
    })
  }
}

export const gutoVoice = new GutoVoiceService()
