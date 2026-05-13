import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const ROOT_DIR = process.cwd()
const OUT_DIR = "public/voicepack/language-samples"
const MODEL = process.env.GUTO_TTS_MODEL || "gemini-3.1-flash-tts-preview"
const VOICE_ID = process.env.GUTO_VOICE_ID || "Puck"
const REQUEST_DELAY_MS = Number.parseInt(process.env.GUTO_TTS_REQUEST_DELAY_MS || "70000", 10)
const MAX_RETRIES = Number.parseInt(process.env.GUTO_TTS_MAX_RETRIES || "1", 10)
const LANG_FILTER = (process.env.GUTO_SAMPLE_LANGS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean)
const API_KEY =
  process.env.GEMINI_API_KEY ||
  (await readEnvValue("../guto-backend/.env", "GEMINI_API_KEY")) ||
  (await readEnvValue(".env.local", "GEMINI_API_KEY"))

const SAMPLES = [
  {
    lang: "pt-BR",
    label: "Português",
    text: "Estamos juntos nessa. Bora iniciar, hoje a gente não falha.",
    prompt:
      "Fale em português brasileiro como um parceiro de treino direto e leal. Natural, firme, sem voz de narrador, sem tom de comercial. Diga exatamente:",
  },
  {
    lang: "en-US",
    label: "English",
    text: "I’m with you on this. Start strong. We don’t fold today.",
    prompt:
      "Speak natural American English like a direct training partner. Short, confident, loyal, not motivational-speaker style, not robotic, not translated. Say exactly:",
  },
  {
    lang: "it-IT",
    label: "Italiano",
    text: "Ci sono con te. Partiamo forte. Oggi non molliamo.",
    prompt:
      "Parla in italiano naturale come un compagno di allenamento diretto e leale. Breve, fermo, niente tono pubblicitario o traduzione letterale. Di esattamente:",
  },
]

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

async function generateAudio(sample, attempt = 0) {
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
                text: `${sample.prompt} "${sample.text}"`,
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
    return generateAudio(sample, attempt + 1)
  }

  if (!response.ok) {
    throw new Error(`Gemini TTS failed (${response.status}): ${JSON.stringify(payload.error || payload)}`)
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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

async function writeIndex(entries) {
  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GUTO Puck Language Samples</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 32px; color: #06111f; background: #f7fbff; }
      h1 { margin: 0 0 8px; }
      p { color: #425466; }
      section { display: grid; gap: 16px; margin-top: 24px; }
      article { padding: 16px; border: 1px solid #c8d7e6; border-radius: 12px; background: white; }
      strong { display: block; margin-bottom: 8px; }
      audio { width: 100%; margin-top: 8px; }
      .meta { font-size: 12px; color: #66788a; }
    </style>
  </head>
  <body>
    <h1>GUTO Puck Language Samples</h1>
    <p>Teste se a voz mantém identidade nos 4 idiomas sem soar traduzida.</p>
    <section>
      ${entries
        .map(
          (entry) => `<article>
        <strong>${entry.label} · ${entry.lang} · ${entry.voice}</strong>
        <div>${escapeHtml(entry.text)}</div>
        <audio controls src="./${entry.file.split("/").pop()}"></audio>
        <div class="meta">${entry.file}</div>
      </article>`,
        )
        .join("\n")}
    </section>
  </body>
</html>
`

  await writeFile(join(OUT_DIR, "index.html"), html)
  await writeFile(join(OUT_DIR, "index.json"), `${JSON.stringify(entries, null, 2)}\n`)
}

async function main() {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY não encontrada.")
  }

  await mkdir(OUT_DIR, { recursive: true })
  const entries = []
  const selectedSamples = LANG_FILTER.length
    ? SAMPLES.filter((sample) => LANG_FILTER.includes(sample.lang))
    : SAMPLES

  for (const sample of selectedSamples) {
    const fileName = `${safeFilePart(VOICE_ID)}_${safeFilePart(sample.lang)}_${hashText(sample.text)}.wav`
    const filePath = join(OUT_DIR, fileName)
    const publicPath = `/voicepack/language-samples/${fileName}`

    if (!existsSync(filePath)) {
      try {
        console.log(`gerando ${sample.lang}: ${sample.text}`)
        const pcm = await generateAudio(sample)
        await writeFile(filePath, pcmToWav(pcm))
        await sleep(REQUEST_DELAY_MS)
      } catch (error) {
        console.error(`falhou ${sample.lang}: ${error.message || error}`)
        entries.push({
          ...sample,
          voice: VOICE_ID,
          model: MODEL,
          file: publicPath,
          status: "failed",
          error: error.message || String(error),
        })
        continue
      }
    } else {
      console.log(`skip: ${fileName}`)
    }

    entries.push({
      ...sample,
      voice: VOICE_ID,
      model: MODEL,
      file: publicPath,
      status: "ready",
    })
  }

  await writeIndex(entries)
  console.log(`samples prontos: ${OUT_DIR}/index.html`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
