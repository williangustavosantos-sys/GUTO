/**
 * generate-voicepack.mjs
 *
 * Lê scripts/phrases-{lang}.json, chama o backend GUTO para sintetizar
 * cada frase via Google Cloud TTS, salva os MP3s em public/voicepack/{lang}/
 * e atualiza public/voicepack/manifest.json.
 *
 * Uso:
 *   node scripts/generate-voicepack.mjs --lang pt-BR
 *   node scripts/generate-voicepack.mjs --lang pt-BR --limit 50
 *   node scripts/generate-voicepack.mjs --lang pt-BR --intent session.entry.first_time
 *
 * Variáveis de ambiente necessárias:
 *   VOICEPACK_API_URL  — URL do backend (ex: http://localhost:3001)
 *   VOICEPACK_TOKEN    — JWT de admin para autenticar nas chamadas
 *
 * CUSTO: cada síntese = ~$0.000016 no Google Cloud TTS.
 * Com 60 intents × 4 variações = 240 frases ≈ $0.004 total.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((_, i, arr) => arr[i].startsWith("--"))
    .map((arg, i, arr) => [arg.replace("--", ""), arr[i + 1]])
    .filter(([, v]) => v && !v.startsWith("--"))
)

const LANG = args.lang || "pt-BR"
const LIMIT = args.limit ? Number(args.limit) : Infinity
const ONLY_INTENT = args.intent || null

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL = process.env.VOICEPACK_API_URL || "http://localhost:3001"
const TOKEN = process.env.VOICEPACK_TOKEN || ""
const PHRASES_FILE = join(__dirname, `phrases-${LANG.toLowerCase().replace("-", "")}.json`)
const VOICEPACK_DIR = join(ROOT, "public", "voicepack", LANG)
const MANIFEST_FILE = join(ROOT, "public", "voicepack", "manifest.json")

if (!TOKEN) {
  console.error("❌ VOICEPACK_TOKEN não definido. Exporte o JWT de admin antes de rodar.")
  console.error("   export VOICEPACK_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"...\",\"password\":\"...\"}' | jq -r .token)")
  process.exit(1)
}

if (!existsSync(PHRASES_FILE)) {
  console.error(`❌ Arquivo de frases não encontrado: ${PHRASES_FILE}`)
  process.exit(1)
}

// ─── Load ─────────────────────────────────────────────────────────────────────
const phrases = JSON.parse(readFileSync(PHRASES_FILE, "utf-8"))
const manifest = JSON.parse(readFileSync(MANIFEST_FILE, "utf-8"))

if (!manifest.languages[LANG]) {
  manifest.languages[LANG] = { intents: {} }
}

// ─── Ensure output dir ───────────────────────────────────────────────────────
mkdirSync(VOICEPACK_DIR, { recursive: true })

// ─── Synthesize ───────────────────────────────────────────────────────────────
let count = 0
let skipped = 0
let errors = 0

const intentKeys = Object.keys(phrases).filter((k) => !k.startsWith("_"))
const filteredKeys = ONLY_INTENT ? intentKeys.filter((k) => k === ONLY_INTENT) : intentKeys

console.log(`\n🎙  Gerando voicepack PT-BR`)
console.log(`   Intents: ${filteredKeys.length} | Limite: ${LIMIT === Infinity ? "sem limite" : LIMIT}`)
console.log(`   Backend: ${API_URL}`)
console.log()

for (const intentKey of filteredKeys) {
  const variations = phrases[intentKey]
  if (!Array.isArray(variations)) continue

  const entries = []

  for (let i = 0; i < variations.length; i++) {
    if (count >= LIMIT) break
    const text = variations[i]
    if (!text || typeof text !== "string") continue

    // Nome do arquivo: intent normalizado + variação
    const safeKey = intentKey.replace(/\./g, "-").replace(/[^a-z0-9-]/gi, "_")
    const filename = `${safeKey}.${i + 1}.mp3`
    const filepath = join(VOICEPACK_DIR, filename)
    const publicUrl = `/voicepack/${LANG}/${filename}`

    // Pula se já existe e não é regeneração forçada
    if (existsSync(filepath) && !args.force) {
      skipped++
      entries.push({
        id: `${LANG.toLowerCase().replace("-", "")}-${safeKey}-${i + 1}`,
        variation: i + 1,
        text,
        url: publicUrl,
      })
      continue
    }

    try {
      const res = await fetch(`${API_URL}/guto/voice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ text, language: LANG }),
      })

      if (!res.ok) {
        const body = await res.text()
        console.error(`   ❌ ${intentKey}[${i + 1}] — HTTP ${res.status}: ${body.slice(0, 120)}`)
        errors++
        continue
      }

      const data = await res.json()
      const audioBase64 = data.audioContent

      if (!audioBase64) {
        console.error(`   ❌ ${intentKey}[${i + 1}] — audioContent vazio`)
        errors++
        continue
      }

      // Decodifica base64 e salva MP3
      const buffer = Buffer.from(audioBase64, "base64")
      writeFileSync(filepath, buffer)

      entries.push({
        id: `${LANG.toLowerCase().replace("-", "")}-${safeKey}-${i + 1}`,
        variation: i + 1,
        text,
        url: publicUrl,
      })

      count++
      console.log(`   ✅ ${intentKey} [${i + 1}/${variations.length}] — ${text.slice(0, 60)}`)

      // Pequena pausa entre chamadas para não saturar a API
      await new Promise((r) => setTimeout(r, 200))
    } catch (err) {
      console.error(`   ❌ ${intentKey}[${i + 1}] — ${err.message}`)
      errors++
    }
  }

  if (entries.length) {
    manifest.languages[LANG].intents[intentKey] = entries
  }
}

// ─── Salva manifest atualizado ────────────────────────────────────────────────
writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2))

console.log()
console.log(`─────────────────────────────────────────`)
console.log(`✅ Gerados:  ${count}`)
console.log(`⏭  Pulados:  ${skipped} (já existiam)`)
console.log(`❌ Erros:    ${errors}`)
console.log(`📄 Manifest: ${MANIFEST_FILE}`)
console.log()
