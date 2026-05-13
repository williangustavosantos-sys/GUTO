export interface VoicePackEntry {
  id: string
  variation: number
  tone?: string
  structureKey?: string
  text: string
  url: string
}

export interface VoicePackLanguage {
  intents: Record<string, VoicePackEntry[]>
}

export interface VoicePackManifest {
  version: number
  voiceId: string
  voiceVersion: string
  languages: Record<string, VoicePackLanguage>
}

export interface VoiceRuntimeState {
  recentByIntent: Record<string, string[]>
  lastByIntent: Record<string, string>
}

export type VoiceResolvedSource =
  | {
      kind: "file"
      url: string
      entry: VoicePackEntry
    }
  | {
      kind: "none"
    }

interface ResolveVoiceInput {
  intentKey: string
  lang: string
  text: string
}

const MAX_RECENT_PER_INTENT = 4

export function createInitialVoiceRuntimeState(): VoiceRuntimeState {
  return {
    recentByIntent: {},
    lastByIntent: {},
  }
}

export function normalizeVoiceRuntimeState(value: unknown): VoiceRuntimeState {
  if (!value || typeof value !== "object") return createInitialVoiceRuntimeState()

  const candidate = value as Partial<VoiceRuntimeState>
  return {
    recentByIntent: normalizeStringArrayRecord(candidate.recentByIntent),
    lastByIntent: normalizeStringRecord(candidate.lastByIntent),
  }
}

function normalizeStringRecord(value: unknown) {
  if (!value || typeof value !== "object") return {}

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([key, item]) => [key, item]),
  )
}

function normalizeStringArrayRecord(value: unknown) {
  if (!value || typeof value !== "object") return {}

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown[]>)
      .filter((entry): entry is [string, string[]] => Array.isArray(entry[1]))
      .map(([key, items]) => [key, items.filter((item): item is string => typeof item === "string")]),
  )
}

function normalizeLanguage(lang: string) {
  const normalized = lang.trim().replace("_", "-").toLowerCase()
  if (normalized === "pt" || normalized === "pt-br") return "pt-BR"
  if (normalized === "en" || normalized === "en-us") return "en-US"
  if (normalized === "it" || normalized === "it-it") return "it-IT"
  return lang
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function similarityScore(reference: string, candidate: string) {
  const referenceTerms = new Set(normalizeText(reference).split(" ").filter(Boolean))
  const candidateTerms = new Set(normalizeText(candidate).split(" ").filter(Boolean))
  if (!referenceTerms.size || !candidateTerms.size) return 0

  let intersection = 0
  for (const term of candidateTerms) {
    if (referenceTerms.has(term)) intersection += 1
  }

  return intersection / Math.max(referenceTerms.size, candidateTerms.size)
}

export class VoiceResolver {
  private state: VoiceRuntimeState

  constructor(private readonly manifest: VoicePackManifest, initialState?: VoiceRuntimeState) {
    this.state = normalizeVoiceRuntimeState(initialState)
  }

  getState() {
    return this.state
  }

  resolve(input: ResolveVoiceInput): VoiceResolvedSource {
    const entries = this.getEntries(input.lang, input.intentKey)
    if (!entries.length) return { kind: "none" }

    const recentIds = this.state.recentByIntent[input.intentKey] || []
    const candidates = entries.filter((entry) => !recentIds.includes(entry.id))
    const pool = candidates.length ? candidates : entries
    const selected = this.selectEntry(pool, input)

    this.remember(input.intentKey, selected.id)

    return {
      kind: "file",
      url: selected.url,
      entry: selected,
    }
  }

  private getEntries(lang: string, intentKey: string) {
    const normalizedLang = normalizeLanguage(lang)
    return this.manifest.languages[normalizedLang]?.intents[intentKey] || []
  }

  private selectEntry(entries: VoicePackEntry[], input: ResolveVoiceInput) {
    const lastId = this.state.lastByIntent[input.intentKey]

    return entries
      .map((entry, index) => ({
        entry,
        index,
        score: similarityScore(input.text, entry.text) + (entry.id === lastId ? -1 : 0),
      }))
      .sort((left, right) => right.score - left.score || left.index - right.index)[0].entry
  }

  private remember(intentKey: string, entryId: string) {
    const current = this.state.recentByIntent[intentKey] || []
    this.state = {
      recentByIntent: {
        ...this.state.recentByIntent,
        [intentKey]: [entryId, ...current.filter((item) => item !== entryId)].slice(0, MAX_RECENT_PER_INTENT),
      },
      lastByIntent: {
        ...this.state.lastByIntent,
        [intentKey]: entryId,
      },
    }
  }
}
