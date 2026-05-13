import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const ROOT_DIR = process.cwd()
const PHRASES_FILE = "scripts/phrases-ptbr.json"
const OUT_DIR = "public/voicepack/ptbr"
const REPORT_FILE = "public/voicepack/ptbr-generation-report.json"
const MODEL = process.env.GUTO_TTS_MODEL || "gemini-3.1-flash-tts-preview"
const VOICE_ID = process.env.GUTO_VOICE_ID || "Puck"
const REQUEST_DELAY_MS = Number.parseInt(process.env.GUTO_TTS_REQUEST_DELAY_MS || "70000", 10)
const MAX_RETRIES = Number.parseInt(process.env.GUTO_TTS_MAX_RETRIES || "2", 10)
const START_INDEX = Number.parseInt(process.env.GUTO_TTS_START_INDEX || "0", 10)
const LIMIT = Number.parseInt(process.env.GUTO_TTS_LIMIT || "0", 10)
const NEXT_MISSING = process.env.GUTO_TTS_NEXT_MISSING === "1"
const REPORT_ONLY = process.env.GUTO_TTS_REPORT_ONLY === "1"
const API_KEY =
  process.env.GEMINI_API_KEY ||
  (await readEnvValue("../guto-backend/.env", "GEMINI_API_KEY")) ||
  (await readEnvValue(".env.local", "GEMINI_API_KEY"))

const STYLE_PROMPT = [
  "Fale em português brasileiro como o GUTO.",
  "O GUTO é um parceiro de treino leal, direto e presente.",
  "Tom central: estamos juntos nessa; bora iniciar; hoje a gente não falha.",
  "Voz natural, firme, curta, com energia de parceiro que treina junto.",
  "Não soe como GPS, atendente, narrador motivacional ou capitão agressivo.",
  "Diga exatamente a frase abaixo.",
].join(" ")

function hashText(text) {
  return createHash("sha1").update(text).digest("hex").slice(0, 12)
}

function safeFilePart(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
}

function pcmToWav(pcm, sampleRate = 24_000, channels = 1, bitDepth = 16) {
  const byteRate = (sampleRate * channels * bitDepth) / 8
  const blockAlign = (channels * bitDepth) / 8
  const dataSize = pcm.length
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write("RIFF", 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write("WAVE", 8)
  buffer.write("fmt ", 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitDepth, 34)
  buffer.write("data", 36)
  buffer.writeUInt32LE(dataSize, 40)
  pcm.copy(buffer, 44)

  return buffer
}

async function readEnvValue(fileName, key) {
  const filePath = join(ROOT_DIR, fileName)
  if (!existsSync(filePath)) return ""

  const raw = await readFile(filePath, "utf8")
  const line = raw
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item && !item.startsWith("#") && item.startsWith(`${key}=`))

  if (!line) return ""
  return line.slice(key.length + 1).replace(/^["']|["']$/g, "")
}

async function generateAudio(text, attempt = 0) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${STYLE_PROMPT}\n\nFrase: "${text}"`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: VOICE_ID,
              },
            },
          },
        },
        model: MODEL,
      }),
    },
  )

  const payload = await response.json()
  if (response.status === 429) {
    if (attempt >= MAX_RETRIES) {
      throw new Error(`Gemini TTS quota bloqueada depois de ${MAX_RETRIES} retries.`)
    }

    const retryMs = extractRetryDelayMs(payload) || 60_000
    console.log(`limite Gemini TTS. aguardando ${Math.ceil(retryMs / 1000)}s...`)
    await sleep(retryMs + 1_000)
    return generateAudio(text, attempt + 1)
  }

  if (!response.ok) {
    throw new Error(
      `Gemini TTS failed (${response.status}): ${JSON.stringify(payload.error || payload)}`,
    )
  }

  const data =
    payload.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ||
    payload.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data

  if (!data) {
    throw new Error(`Gemini TTS returned no audio: ${JSON.stringify(payload).slice(0, 500)}`)
  }

  return Buffer.from(data, "base64")
}

function extractRetryDelayMs(payload) {
  const details = payload?.error?.details || payload?.details || []
  const retry = details.find((item) => item?.retryDelay || item?.["@type"]?.includes("RetryInfo"))
  const value = retry?.retryDelay
  if (!value) return null

  const seconds = Number.parseFloat(String(value).replace("s", ""))
  if (!Number.isFinite(seconds)) return null
  return Math.ceil(seconds * 1000)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function assertStaticPhrase(text) {
  if (/\{[a-zA-Z]/.test(text)) {
    throw new Error(`frase com slot dinâmico não pode virar áudio fixo: ${text}`)
  }
}

async function main() {
  if (!API_KEY && !REPORT_ONLY) {
    throw new Error(
      "GEMINI_API_KEY não encontrada. Coloque no ambiente ou em guto-app-v0/.env.local.",
    )
  }

  const allPhrases = JSON.parse(await readFile(PHRASES_FILE, "utf8"))
  const requestedPhrases =
    LIMIT > 0 ? allPhrases.slice(START_INDEX, START_INDEX + LIMIT) : allPhrases.slice(START_INDEX)
  const phrases = NEXT_MISSING ? requestedPhrases.filter((phrase) => {
    const textHash = hashText(phrase.text)
    const intentFilePart = safeFilePart(phrase.intentKey)
    const fileName = `${intentFilePart}_v${phrase.variation}_${textHash}.wav`
    return !existsSync(join(OUT_DIR, fileName))
  }).slice(0, 1) : requestedPhrases
  const report = []

  await mkdir(OUT_DIR, { recursive: true })

  for (const phrase of phrases) {
    assertStaticPhrase(phrase.text)

    const textHash = hashText(phrase.text)
    const intentFilePart = safeFilePart(phrase.intentKey)
    const fileName = `${intentFilePart}_v${phrase.variation}_${textHash}.wav`
    const filePath = join(OUT_DIR, fileName)

    if (REPORT_ONLY) {
      report.push({
        ...phrase,
        file: `/voicepack/ptbr/${fileName}`,
        status: existsSync(filePath) ? "ready" : "missing",
      })
      continue
    }

    if (!existsSync(filePath)) {
      try {
        console.log(`gerando ${VOICE_ID}: ${phrase.intentKey} v${phrase.variation} - ${phrase.text}`)
        const pcm = await generateAudio(phrase.text)
        await writeFile(filePath, pcmToWav(pcm))
        await sleep(REQUEST_DELAY_MS)
      } catch (error) {
        console.error(`falhou: ${phrase.intentKey} v${phrase.variation}`)
        console.error(error.message || error)
        report.push({ ...phrase, file: `/voicepack/ptbr/${fileName}`, status: "failed" })
        continue
      }
    } else {
      console.log(`skip: ${fileName}`)
    }

    report.push({ ...phrase, file: `/voicepack/ptbr/${fileName}`, status: "ready" })
  }

  await writeFile(
    REPORT_FILE,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        model: MODEL,
        voiceId: VOICE_ID,
        ready: report.filter((item) => item.status === "ready").length,
        failed: report.filter((item) => item.status === "failed").length,
        entries: report,
      },
      null,
      2,
    )}\n`,
  )

  console.log(`voicepack PT-BR lote: ${report.filter((item) => item.status === "ready").length}/${phrases.length}`)
  console.log(`faltando no lote: ${report.filter((item) => item.status === "missing" || item.status === "failed").length}`)
  console.log(`lote: start=${START_INDEX}, limit=${LIMIT || "all"}, total=${allPhrases.length}`)
  if (NEXT_MISSING && phrases.length === 0) {
    console.log("nenhuma fala faltante encontrada no recorte solicitado")
  }
  console.log(`relatório: ${REPORT_FILE}`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
