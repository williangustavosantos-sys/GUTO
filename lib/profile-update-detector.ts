import type { SupportedLanguage } from "@/types/contract"

export type ProfileField =
  | "name"
  | "language"
  | "phone"
  | "country"
  | "age"
  | "weight"
  | "height"
  | "goal"
  | "location"
  | "pathology"
  | "foodRestrictions"

export interface ProfileUpdateIntent {
  field: ProfileField
  value: string | number
  confirmationLevel: "light" | "required"
  humanLabel: string
  humanValue: string
  blocked?: boolean
}

// ─── Value normalizers ────────────────────────────────────────────────────────

function parseNumber(raw: string): number | null {
  const n = parseFloat(raw.replace(",", ".").trim())
  return isNaN(n) ? null : n
}

function parseHeightToCm(raw: string): number | null {
  const n = parseNumber(raw)
  if (n === null) return null
  if (n >= 1 && n < 3) return Math.round(n * 100)
  if (n >= 100 && n <= 250) return Math.round(n)
  return null
}

function parseWeightKg(raw: string): number | null {
  const n = parseNumber(raw)
  if (n === null || n < 30 || n > 300) return null
  return n
}

function parseAge(raw: string): number | null {
  const n = Math.round(parseFloat(raw.replace(",", ".")))
  if (isNaN(n) || n < 14 || n > 99) return null
  return n
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function normalizeLanguage(raw: string): SupportedLanguage | null {
  const key = stripAccents(raw.toLowerCase().trim())
  const map: Record<string, SupportedLanguage> = {
    portugues: "pt-BR", brasil: "pt-BR", brasileira: "pt-BR", "pt-br": "pt-BR",
    english: "en-US", ingles: "en-US", "en-us": "en-US", en: "en-US",
    italiano: "it-IT", italian: "it-IT", "it-it": "it-IT", it: "it-IT",
  }
  return map[key] ?? null
}

type GoalKey = "fat_loss" | "muscle_gain" | "conditioning" | "mobility_health" | "consistency"
type LocationKey = "gym" | "home" | "park" | "mixed"

function normalizeGoal(raw: string): { key: GoalKey; label: string } | null {
  const s = stripAccents(raw.toLowerCase())
  if (/emagrec|perd.{0,10}gord|fat.?loss|perder peso|adelgaz|dimagrire|lose fat/.test(s))
    return { key: "fat_loss", label: "Perda de gordura" }
  if (/hipetrofi|hipertrofi|ganhar massa|muscle.?gain|ganar masa|massa muscular|crescer|ipertrofi|build muscle/.test(s))
    return { key: "muscle_gain", label: "Ganho de massa" }
  if (/condicion|acondicion|conditioning/.test(s))
    return { key: "conditioning", label: "Condicionamento" }
  if (/mobil|saude|health|salud|salute/.test(s))
    return { key: "mobility_health", label: "Saúde e mobilidade" }
  if (/consist|manter|manutencao|maintain|consistencia/.test(s))
    return { key: "consistency", label: "Consistência" }
  return null
}

function normalizeLocation(raw: string): { key: LocationKey; label: string } | null {
  const s = stripAccents(raw.toLowerCase())
  if (/academi|gym|palestra|gimnasio/.test(s)) return { key: "gym", label: "Academia" }
  if (/\bcasa\b|home/.test(s)) return { key: "home", label: "Casa" }
  if (/parque|park|parco/.test(s)) return { key: "park", label: "Parque" }
  if (/misto|mixed/.test(s)) return { key: "mixed", label: "Misto" }
  return null
}

const langLabels: Record<SupportedLanguage, string> = {
  "pt-BR": "Português",
  "en-US": "English",
  "it-IT": "Italiano",
}

// ─── Field labels (human readable, for confirmation messages) ─────────────────

const fieldHumanLabels: Record<SupportedLanguage, Record<ProfileField, string>> = {
  "pt-BR": {
    name: "nome", language: "idioma", phone: "telefone", country: "cidade/país",
    age: "idade", weight: "peso", height: "altura", goal: "objetivo",
    location: "local de treino", pathology: "limitação", foodRestrictions: "restrição alimentar",
  },
  "en-US": {
    name: "name", language: "language", phone: "phone", country: "country/city",
    age: "age", weight: "weight", height: "height", goal: "goal",
    location: "training location", pathology: "limitation", foodRestrictions: "food restriction",
  },
  "it-IT": {
    name: "nome", language: "lingua", phone: "telefono", country: "città/paese",
    age: "età", weight: "peso", height: "altezza", goal: "obiettivo",
    location: "luogo di allenamento", pathology: "limitazione", foodRestrictions: "restrizione alimentare",
  },
}

// ─── Copy strings for the profile update flow ─────────────────────────────────

export const profileUpdateCopy: Record<
  SupportedLanguage,
  {
    lightConfirm: (label: string, value: string) => string
    requiredConfirm: (label: string, value: string) => string
    success: (label: string, value: string) => string
    cancelled: string
    blocked: string
  }
> = {
  "pt-BR": {
    lightConfirm: (l, v) => `Quer que eu atualize seu ${l} para "${v}"?`,
    requiredConfirm: (l, v) => `Isso afeta seus treinos. Confirmo seu ${l} como "${v}"?`,
    success: (l, v) => `Pronto. Atualizei seu ${l} para "${v}".`,
    cancelled: "Ok, cancelei. Nenhum dado foi alterado.",
    blocked:
      "Essa ação eu não faço pelo chat. Use a tela de Configurações ou entre em contato com o suporte.",
  },
  "en-US": {
    lightConfirm: (l, v) => `Want me to update your ${l} to "${v}"?`,
    requiredConfirm: (l, v) => `This affects your training. Confirm your ${l} as "${v}"?`,
    success: (l, v) => `Done. I updated your ${l} to "${v}".`,
    cancelled: "Ok, cancelled. No data was changed.",
    blocked: "I can't do that through chat. Use the Settings screen or contact support.",
  },
  "it-IT": {
    lightConfirm: (l, v) => `Vuoi che aggiorni il tuo ${l} a "${v}"?`,
    requiredConfirm: (l, v) => `Questo influisce sul tuo allenamento. Confermo il tuo ${l} come "${v}"?`,
    success: (l, v) => `Fatto. Ho aggiornato il tuo ${l} a "${v}".`,
    cancelled: "Ok, annullato. Nessun dato è stato modificato.",
    blocked:
      "Non posso farlo tramite chat. Usa la schermata Impostazioni o contatta il supporto.",
  },
}

// ─── Confirmation / Cancellation text detection ───────────────────────────────

export function isConfirmationText(text: string): boolean {
  const s = stripAccents(text.toLowerCase().trim())
  return /^(sim|pode|isso|confirmo|ok|correto|certo|afirmativo|vai|bora|claro|exato|e isso|e isso ai|yes|yep|yeah|sure|correct|confirm|right|affirmative|si|dale|exacto|certo|confermo|esatto|claro que si|si señor|si senor)$/.test(s)
}

export function isCancellationText(text: string): boolean {
  const s = stripAccents(text.toLowerCase().trim())
  return /^(nao|nope|cancela|cancelar|cancelo|para|errado|errei|esquece|deixa|no|never mind|forget it|stop|wrong|cancel|annulla|lascia perdere|sbagliato|nein|niet)$/.test(s)
}

// ─── Blocked patterns ─────────────────────────────────────────────────────────

const blockedPatterns = [
  /(?:apaga|exclui|deleta|remove|delete|exclu[ií]r|elimina)\s+(?:minha\s+)?(?:conta|dados|perfil|account|data)/i,
  /(?:baixar?|download)\s+(?:meus\s+)?(?:dados|data)/i,
  /(?:mudar?|trocar?|alterar?)\s+(?:meu\s+)?(?:plano|assinatura|pagamento)/i,
  /(?:mudar?|trocar?|alterar?)\s+(?:meu\s+)?(?:coach|time|equipe|treinador)/i,
  /(?:apaga|exclui|remove|delete)\s+(?:tudo|everything|all)/i,
  /cancelar?\s+(?:minha\s+)?assinatura/i,
]

// ─── Main detector ────────────────────────────────────────────────────────────

export function detectProfileUpdateIntent(
  input: string,
  lang: SupportedLanguage
): ProfileUpdateIntent | null {
  const s = input.trim()
  const sl = s.toLowerCase()
  const labels = fieldHumanLabels[lang]

  // Blocked actions check first
  if (blockedPatterns.some((p) => p.test(sl))) {
    return {
      field: "name",
      value: "",
      confirmationLevel: "required",
      humanLabel: "",
      humanValue: "",
      blocked: true,
    }
  }

  // ── NAME ────────────────────────────────────────────────────────────────────
  {
    const patterns: RegExp[] = [
      /(?:muda|troca|altera|coloca|muda)\s+(?:meu\s+)?nome\s+para\s+([\wÀ-ɏ]{2,20})/i,
      /me\s+ch(?:ama?|ame|amo)\s+(?:de\s+)?([\wÀ-ɏ]{2,20})/i,
      /(?:pode\s+)?me\s+chamar\s+(?:de\s+)?([\wÀ-ɏ]{2,20})/i,
      /(?:change|update)\s+(?:my\s+)?name\s+to\s+([\w]{2,20})/i,
      /call\s+me\s+([\w]{2,20})/i,
      /(?:cambia|cambiar)\s+(?:mi\s+)?nombre\s+(?:a|por)\s+([\wÀ-ɏ]{2,20})/i,
      /(?:chiamami|chiama\s+mi)\s+([\wÀ-ɏ]{2,20})/i,
    ]
    for (const p of patterns) {
      const m = sl.match(p)
      if (m?.[1]) {
        const raw = m[1]
        const val = raw.charAt(0).toUpperCase() + raw.slice(1)
        return {
          field: "name",
          value: val,
          confirmationLevel: "light",
          humanLabel: labels.name,
          humanValue: val,
        }
      }
    }
  }

  // ── LANGUAGE ─────────────────────────────────────────────────────────────────
  {
    const patterns: RegExp[] = [
      /(?:muda|troca|coloca|altera)\s+(?:o\s+)?idioma\s+(?:para|pra)\s+(.+)/i,
      /(?:muda|coloca)\s+(?:o\s+app|tudo|interface)\s+(?:em|para|pra)\s+(.+)/i,
      /(?:quero|prefiro)\s+(?:usar|falar|ver)\s+(?:em|no|o)\s+(português|inglês|espanhol|italiano|english|spanish|italian)/i,
      /(?:change|switch)\s+(?:the\s+)?(?:language|lang)\s+to\s+(.+)/i,
      /(?:cambia|pon|coloca)\s+(?:el\s+)?idioma\s+(?:a|en)\s+(.+)/i,
      /(?:cambia|metti)\s+(?:la\s+)?lingua\s+(?:in|a)\s+(.+)/i,
      // Broader conversational patterns to prevent LLM from claiming it can't change language
      /(?:quero|gostaria\s+de|pode|podes)\s+(?:mudar|trocar|alterar|colocar)\s+(?:o\s+)?idioma\s+(?:para|pra)\s+(.+)/i,
      /(?:quero|prefiro|gostaria)\s+(?:o\s+app|tudo|ver)\s+(?:em|no|na)\s+(português|inglês|espanhol|italiano|english|spanish|italian)/i,
      /(?:coloca|muda|troca)\s+(?:para|pra)\s+(português|inglês|espanhol|italiano|english|spanish|italian)/i,
      /usar?\s+(?:o\s+app\s+)?em\s+(português|inglês|espanhol|italiano|english|spanish|italian)/i,
      /(?:set|please\s+set|can\s+you\s+set)\s+(?:the\s+)?(?:language|lang)\s+to\s+(.+)/i,
    ]
    for (const p of patterns) {
      const m = sl.match(p)
      if (m?.[1]) {
        const normalized = normalizeLanguage(m[1].trim())
        if (normalized) {
          return {
            field: "language",
            value: normalized,
            confirmationLevel: "light",
            humanLabel: labels.language,
            humanValue: langLabels[normalized],
          }
        }
      }
    }
  }

  // ── AGE ──────────────────────────────────────────────────────────────────────
  {
    const patterns: RegExp[] = [
      /(?:minha\s+)?idade\s+(?:é|esta|agora\s+é)\s+(\d+)/i,
      /tenho\s+(\d+)\s+anos(?!\s+de)/i,
      /(?:corrige|muda|atualiza|coloca)\s+(?:minha\s+)?idade\s+(?:para|pra|to)\s+(\d+)/i,
      /i(?:'m|\s+am)\s+(\d+)\s+years?\s+old/i,
      /(?:my\s+)?age\s+is\s+(\d+)/i,
      /(?:tengo|mi\s+edad\s+es)\s+(\d+)(?:\s+años?)?/i,
      /ho\s+(\d+)\s+anni?/i,
    ]
    for (const p of patterns) {
      const m = sl.match(p)
      if (m?.[1]) {
        const val = parseAge(m[1])
        if (val !== null) {
          return {
            field: "age",
            value: val,
            confirmationLevel: "required",
            humanLabel: labels.age,
            humanValue: `${val} anos`,
          }
        }
      }
    }
  }

  // ── WEIGHT ───────────────────────────────────────────────────────────────────
  {
    const patterns: RegExp[] = [
      /(?:meu\s+)?peso\s+(?:é|esta|agora\s+é|atual\s+é)\s+([\d,\.]+)\s*kg?/i,
      /(?:pesando?|peso)\s+([\d,\.]+)\s*kg/i,
      /(?:corrige|muda|atualiza|coloca)\s+(?:meu\s+)?peso\s+(?:para|pra|to)\s+([\d,\.]+)/i,
      /(?:i\s+weigh|my\s+weight\s+is)\s+([\d\.]+)\s*kg?/i,
      /(?:peso|mi\s+peso\s+es)\s+([\d,\.]+)\s*kg/i,
      /(?:il\s+mio\s+peso\s+è|peso)\s+([\d,\.]+)\s*kg/i,
    ]
    for (const p of patterns) {
      const m = sl.match(p)
      if (m?.[1]) {
        const val = parseWeightKg(m[1])
        if (val !== null) {
          return {
            field: "weight",
            value: val,
            confirmationLevel: "required",
            humanLabel: labels.weight,
            humanValue: `${val} kg`,
          }
        }
      }
    }
  }

  // ── HEIGHT ───────────────────────────────────────────────────────────────────
  {
    const patterns: RegExp[] = [
      /(?:minha\s+)?altura\s+(?:é|esta|agora\s+é)\s+([\d,\.]+)/i,
      /(?:corrige|muda|atualiza|coloca)\s+(?:minha\s+)?altura\s+(?:para|pra|to)\s+([\d,\.]+)/i,
      /mido\s+([\d,\.]+)/i,
      /(?:my\s+height\s+is)\s+([\d\.]+)/i,
      /(?:mi\s+altura\s+es|mido)\s+([\d,\.]+)/i,
      /(?:la\s+mia\s+altezza\s+è|sono\s+alto)\s+([\d,\.]+)/i,
    ]
    for (const p of patterns) {
      const m = sl.match(p)
      if (m?.[1]) {
        const val = parseHeightToCm(m[1])
        if (val !== null) {
          return {
            field: "height",
            value: val,
            confirmationLevel: "required",
            humanLabel: labels.height,
            humanValue: `${val} cm`,
          }
        }
      }
    }
  }

  // ── GOAL ─────────────────────────────────────────────────────────────────────
  {
    const patterns: RegExp[] = [
      /(?:meu\s+)?objetivo\s+(?:é|agora\s+é)\s+(.{4,50})/i,
      /(?:muda|troca|altera|coloca)\s+(?:meu\s+)?objetivo\s+(?:para|pra|to)\s+(.{4,50})/i,
      /quero\s+(emagrec|perd.{0,10}gord|ganhar massa|hipertrofi|condicion|melhorar\s+saude)/i,
      /(?:my\s+goal\s+is|i\s+want\s+to)\s+(.{4,50})/i,
      /(?:mi\s+objetivo\s+es|quiero)\s+(.{4,50})/i,
      /(?:il\s+mio\s+obiettivo\s+è|voglio)\s+(.{4,50})/i,
    ]
    for (const p of patterns) {
      const m = sl.match(p)
      if (m?.[1]) {
        const normalized = normalizeGoal(m[1].trim())
        if (normalized) {
          return {
            field: "goal",
            value: normalized.key,
            confirmationLevel: "required",
            humanLabel: labels.goal,
            humanValue: normalized.label,
          }
        }
      }
    }
  }

  // ── LOCATION ─────────────────────────────────────────────────────────────────
  {
    const patterns: RegExp[] = [
      /(?:vou|voto|vá)\s+treinar\s+(?:em|na|no)\s+(academia|casa|parque)/i,
      /(?:agora\s+)?treino\s+(?:em|na|no)\s+(academia|casa|parque)/i,
      /(?:muda|troca|coloca|altera)\s+(?:meu\s+)?(?:local\s+de\s+treino|local|treino)\s+(?:para|pra|to)\s+(.+)/i,
      /(?:i(?:'ll|\s+will)\s+train|i\s+train)\s+(?:at|in)\s+(gym|home|park)/i,
      /(?:voy\s+a\s+entrenar|entreno)\s+(?:en\s+el?|en)\s+(gimnasio|casa|parque)/i,
      /mi\s+alleno\s+(?:in\s+palestra|a\s+casa|al\s+parco)/i,
    ]
    for (const p of patterns) {
      const m = sl.match(p)
      if (m?.[1]) {
        const normalized = normalizeLocation(m[1].trim())
        if (normalized) {
          return {
            field: "location",
            value: normalized.key,
            confirmationLevel: "required",
            humanLabel: labels.location,
            humanValue: normalized.label,
          }
        }
      }
    }
  }

  // ── PATHOLOGY ────────────────────────────────────────────────────────────────
  {
    const patterns: RegExp[] = [
      /tenho\s+(?:dor|limitação|limitacao|problema|lesão|lesao)\s+(?:em|no|na|nos|nas)\s+(.{3,80})/i,
      /(?:estou\s+)?com\s+dor\s+(?:em|no|na)\s+(.{3,80})/i,
      /(?:estou\s+)?(?:machucado|lesionado)\s+(?:em|no|na|do|da)\s+(.{3,80})/i,
      /(?:corrige|muda|atualiza|coloca)\s+(?:minha\s+)?(?:limitacao|limitação|patologia)\s+(?:como|para|to)\s+(.{3,80})/i,
      /(?:i\s+have\s+pain|i(?:'m|\s+am)\s+injured)\s+(?:in|at|on)\s+(.{3,80})/i,
      /(?:tengo\s+dolor|estoy\s+lesionado)\s+en\s+(.{3,80})/i,
      /(?:ho\s+dolore|sono\s+infortunato)\s+(?:a|al|alla)\s+(.{3,80})/i,
    ]
    for (const p of patterns) {
      const m = sl.match(p)
      if (m?.[1]) {
        const val = m[1].replace(/[\.!?]+$/, "").trim()
        if (val.length >= 3 && val.length <= 120) {
          return {
            field: "pathology",
            value: val,
            confirmationLevel: "required",
            humanLabel: labels.pathology,
            humanValue: val,
          }
        }
      }
    }
  }

  // ── FOOD RESTRICTIONS / INTOLERANCES ────────────────────────────────────────
  {
    const patterns: RegExp[] = [
      /(?:tenho|sou)\s+(?:intolerante|alérgico|alergico|intollerante|allergico|intolerante|alergi[oa])\s+(?:a|ao|à|al|alla)\s+(.{2,100})/i,
      /tenho\s+restrição\s+(?:a|ao|à|para)\s+(.{2,100})/i,
      /não\s+(?:posso|consigo|tolero)\s+comer\s+(.{2,100})/i,
      /(?:sou)\s+(vegetariano|vegano|celíaco|celiaco|vegan|vegetarian)/i,
      /(?:minha\s+)?restrição\s+alimentar\s+(?:é|agora\s+é)\s+(.{2,100})/i,
      /(?:i(?:'m|\s+am))\s+(?:intolerant|allergic)\s+to\s+(.{2,100})/i,
      /(?:tengo\s+(?:intolerancia|alergia)\s+a)\s+(.{2,100})/i,
      /(?:sono\s+(?:intollerante|allergico)\s+(?:a|al|alla))\s+(.{2,100})/i,
    ]
    for (const p of patterns) {
      const m = sl.match(p)
      if (m?.[1]) {
        const val = m[1].replace(/[\.!?]+$/, "").trim()
        if (val.length >= 2 && val.length <= 150) {
          return {
            field: "foodRestrictions",
            value: val,
            confirmationLevel: "required",
            humanLabel: labels.foodRestrictions,
            humanValue: val,
          }
        }
      }
    }
  }

  // ── PHONE ────────────────────────────────────────────────────────────────────
  {
    const patterns: RegExp[] = [
      /(?:meu\s+)?(?:telefone|numero|número|celular|whatsapp)\s+(?:é|agora\s+é)\s+([\+\d][\d\s\-\(\)]{5,})/i,
      /(?:muda|atualiza|coloca)\s+(?:meu\s+)?(?:telefone|numero|número|celular)\s+(?:para|pra|to)\s+([\+\d][\d\s\-\(\)]{5,})/i,
      /(?:my\s+)?(?:phone|number|cell)\s+(?:number\s+)?(?:is)\s+([\+\d][\d\s\-\(\)]{5,})/i,
    ]
    for (const p of patterns) {
      const m = sl.match(p)
      if (m?.[1]) {
        return {
          field: "phone",
          value: m[1].trim(),
          confirmationLevel: "light",
          humanLabel: labels.phone,
          humanValue: m[1].trim(),
        }
      }
    }
  }

  // ── COUNTRY ──────────────────────────────────────────────────────────────────
  {
    const patterns: RegExp[] = [
      /(?:moro|estou\s+morando|fico|vivo)\s+(?:em|no|na|numa?)\s+(.{2,50})/i,
      /(?:mudei|me\s+mudei)\s+para\s+(.{2,50})/i,
      /(?:muda|atualiza|coloca)\s+(?:meu\s+)?(?:país|pais|cidade|localizacao|localização)\s+(?:para|pra|como)\s+(.{2,50})/i,
      /i\s+(?:live|moved)\s+(?:in|to)\s+(.{2,50})/i,
      /(?:vivo|mi\s+sono\s+trasferito)\s+(?:in|a)\s+(.{2,50})/i,
    ]
    for (const p of patterns) {
      const m = sl.match(p)
      if (m?.[1]) {
        const val = m[1].replace(/[\.!?]+$/, "").trim()
        if (val.length >= 2 && val.length <= 60) {
          return {
            field: "country",
            value: val,
            confirmationLevel: "light",
            humanLabel: labels.country,
            humanValue: val,
          }
        }
      }
    }
  }

  return null
}
