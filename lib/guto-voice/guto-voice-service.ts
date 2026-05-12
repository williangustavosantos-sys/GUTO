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

function speakWithBrowser(text: string, language: string) {
  return new Promise<void>((resolve) => {
    if (!isBrowser() || !window.speechSynthesis || !text.trim()) {
      resolve()
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language
    utterance.rate = 1.04
    utterance.pitch = 0.96
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
    window.speechSynthesis.speak(utterance)
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

  async speak(options: SpeakGutoOptions) {
    const {
      text,
      language,
      intentKey,
      source = "system",
      preferStatic = true,
      allowRemoteSynthesis = true,
      onStart,
      onEnd,
    } = options

    if (!isBrowser() || !text.trim()) return

    onStart?.()
    this.stop()

    try {
      if (intentKey && preferStatic) {
        const resolver = this.getResolver()
        const voiceSource = resolver.resolve({ intentKey, lang: language, text })
        saveVoiceState(resolver.getState())

        if (voiceSource.kind === "file") {
          const played = await this.playFile(voiceSource.url)
          if (played) return
        }
      }

      const cacheKey = await this.cacheKey({ text, language })
      const cached = await getCachedAudio(cacheKey)
      if (cached) {
        await touchCachedAudio(cached)
        await this.playBlob(cached.blob)
        return
      }

      if (allowRemoteSynthesis && isRemoteCacheable(text)) {
        const generated = await this.generateRemoteAudio({ text, language, source, cacheKey })
        if (generated) {
          await this.playBlob(generated.blob)
          return
        }
      }

      await speakWithBrowser(text, language)
    } finally {
      onEnd?.()
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
      const record: GutoVoiceBankRecord = {
        key: cacheKey,
        textHash: await sha1(normalizeTextForHash(text)),
        text: normalizeTextForHash(text),
        language,
        voiceId: getVoiceId(),
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
