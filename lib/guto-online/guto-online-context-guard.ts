/**
 * GUTO Online — Context Guard
 * --------------------------------------------------------------------------
 * No GUTO Online, o GUTO não vira chat livre. Ele está em modo treino. Se o
 * usuário falar sobre dieta, italiano, viagem, política ou qualquer assunto
 * fora do treino, o GUTO responde curto, segura o foco e oferece continuar
 * no chat normal depois.
 *
 * Classificação de intenção:
 *   - swap_equipment   → "tá ocupado, sem máquina, tem que trocar"
 *   - pain             → "doeu, dor, fisgada, travou"
 *   - fatigue          → "tô morto, sem ar, falhei"
 *   - doubt_execution  → "como faz isso, tô em dúvida da execução"
 *   - off_topic        → qualquer outro assunto (dieta, viagem, política…)
 *   - emotional        → "tô mal, tô triste, tô desanimado"
 *   - noisy_unclear    → vazio / ruído / palavra solta
 *   - command_*        → comandos diretos (feito, pausa, continua, finaliza)
 *   - unknown          → entrou mas não bateu em nada acima
 *
 * O guard também devolve uma resposta padronizada, pronta para falar/exibir
 * sem precisar bater no backend. Quando o backend está disponível, ele
 * substitui a resposta padrão por uma mais contextual — mas o usuário nunca
 * fica sem retorno imediato.
 */

import type { GutoQuickTalkIntent } from "./guto-online-types"

// ─── Padrões por idioma ─────────────────────────────────────────────────────

interface ContextPatterns {
  setDone: RegExp
  pause: RegExp
  resume: RegExp
  finish: RegExp
  pain: RegExp
  swap: RegExp
  fatigue: RegExp
  doubt: RegExp
  emotional: RegExp
  offTopic: RegExp
}

const PATTERNS: Record<string, ContextPatterns> = {
  "pt-BR": {
    setDone: /(serie feita|série feita|feito|fiz|terminei|acabei|fechei|aquecimento (feito|finalizado))/,
    pause:   /(pausa|para|espera|peraí|peraí)/,
    resume:  /(continua|voltei|segue|bora|retoma|tô de volta)/,
    finish:  /(finaliza|encerra|acabou|chega por hoje)/,
    pain:    /(doeu|doendo|dor|fisgada|pontada|travou|incomod|estralou|machucou|latejand)/,
    swap:    /(ocupad|ocupado|troca|trocar|substitui|sem maquina|sem máquina|sem equipamento|nao tem|não tem|tá em uso|esta em uso|ta usando|está usando|outro lá)/,
    fatigue: /(pesad|cansad|sem ar|sem folego|sem fôlego|falhei|to morto|tô morto|morto|exausto|esgotad|nao aguent|não aguent|to bagaceira|tô bagaceira)/,
    doubt:   /(como faz|como faço|nao sei|não sei|tenho duvida|tenho dúvida|qual a execu|qual e a execu|qual é a execu|forma certa|jeito certo|movimento correto|tá certo isso)/,
    emotional: /(to mal|tô mal|to triste|tô triste|to desanimad|tô desanimad|to sem vontade|tô sem vontade|deprim|ansios|estress|estafad|to acabad|tô acabad)/,
    offTopic: /(dieta|comida|comi|comer|jantar|almoço|cafe|café|italian|ingles|inglês|trabalho|reuniao|reunião|namorad|familia|família|filme|viagem|politic|polític|economia|noticia|notícia|tempo|chuva|cidade|carro|onibus|ônibus|metro|metrô|série de tv|netflix)/,
  },
  "en-US": {
    setDone: /(set done|set's done|done|finished|completed|i did it|all done|warm.?up done|got it|nailed it)/,
    pause:   /(pause|stop|wait|hold on|hold up|gimme a sec)/,
    resume:  /(continue|resume|i.m back|let.s go|let me go|keep going|ready)/,
    finish:  /(finish|end|done for today|wrap up|that.s it|call it)/,
    pain:    /(hurt|hurts|pain|ache|twinge|pulled|strain|sore|tweak|pop)/,
    swap:    /(busy|taken|swap|switch|substitute|no machine|no equipment|occupied|in use|someone.s on it)/,
    fatigue: /(heavy|tired|gassed|out of breath|failed|exhausted|can.t|smoked|cooked|wiped)/,
    doubt:   /(how do i|how to|not sure|i.m unsure|correct form|right form|technique|am i doing this right)/,
    emotional: /(feel bad|feeling bad|sad|depressed|anxious|burned out|burnt out|tired emotionally|stressed|rough day|bad day)/,
    offTopic: /(diet|food|breakfast|lunch|dinner|coffee|italian|english class|work|meeting|girlfriend|boyfriend|family|movie|trip|politics|economy|news|weather|rain|city|car|bus|subway|netflix|series|game)/,
  },
  "it-IT": {
    setDone: /(serie fatta|finito|ho finito|completato|fatto|riscaldamento (fatto|finito)|chiusa|chiuso)/,
    pause:   /(pausa|fermati|aspetta|un attimo|attimo)/,
    resume:  /(continua|sono tornato|dai|riprendi|forza|pronto|si torna)/,
    finish:  /(finisci|chiudi|basta per oggi|stop|smettiamo)/,
    pain:    /(fa male|dolore|fitta|fitto|stirato|distorto|fastidio|tirato|si è bloccato)/,
    swap:    /(occupato|cambio|cambia|sostituisci|senza macchina|non c.è|in uso|c.è qualcuno)/,
    fatigue: /(pesante|stanco|senza fiato|ho fallito|non ce la faccio|esausto|cotto|distrutto)/,
    doubt:   /(come si fa|come faccio|non sono sicuro|forma corretta|tecnica|lo sto facendo bene)/,
    emotional: /(mi sento male|triste|depresso|ansioso|stressato|giornata di merda|giornata storta)/,
    offTopic: /(dieta|cibo|colazione|pranzo|cena|caffè|inglese|lavoro|riunione|ragazza|ragazzo|famiglia|film|viaggio|politica|economia|notizie|tempo|pioggia|città|auto|autobus|metro|serie tv|netflix)/,
  },
}

function getPatterns(language: string): ContextPatterns {
  if (language in PATTERNS) return PATTERNS[language]
  const prefix = language.split("-")[0]
  const found = Object.keys(PATTERNS).find((key) => key.startsWith(prefix))
  return found ? PATTERNS[found] : PATTERNS["pt-BR"]
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// ─── Respostas por idioma ───────────────────────────────────────────────────

interface ContextResponses {
  offTopic: (userName: string) => string
  emotional: (userName: string) => string
  noisy: (userName: string) => string
  doubt: (userName: string) => string
  unknown: (userName: string) => string
}

const RESPONSES: Record<string, ContextResponses> = {
  "pt-BR": {
    // GUTO falando como parceiro de academia brasileiro. Usa "tô", "tu", "a gente".
    offTopic: (name) =>
      `${name}, agora eu tô contigo no treino. Isso a gente vê no chat depois. Me diz: série feita, pausa ou troca?`,
    emotional: (name) =>
      `${name}, ouvi. Então decide comigo: pauso o treino ou seguimos uma série mais leve?`,
    noisy: (name) =>
      `${name}, não tô te escutando direito por causa do barulho. Digita aí rapidinho que a gente continua.`,
    doubt: (name) =>
      `Tranquilo, ${name}. Movimento controlado, sem trancar a respiração. Se sentir estranho, pausa e me chama.`,
    unknown: (name) =>
      `${name}, não peguei o que tu falou. Me diz curto: é dor, troca, série feita ou pausa?`,
  },
  "en-US": {
    // GUTO as an American gym buddy. Direct, warm, no fluff.
    offTopic: (name) =>
      `${name}, I'm with you in this workout right now. We'll hit that in the chat later. Tell me: set done, pause, or swap?`,
    emotional: (name) =>
      `${name}, I hear you. Call it with me: pause the workout or run a lighter set?`,
    noisy: (name) =>
      `${name}, can't hear you over the noise. Type it real quick and we keep moving.`,
    doubt: (name) =>
      `No worries, ${name}. Controlled move, steady breath. If something feels off, pause and call me.`,
    unknown: (name) =>
      `${name}, didn't catch that. Short answer: pain, swap, set done, or pause?`,
  },
  "it-IT": {
    // GUTO come un amico in palestra. Usa "dai", "tranquillo", tono diretto ma caldo.
    offTopic: (name) =>
      `${name}, adesso sono qui con te nell'allenamento. Lo vediamo in chat dopo. Dimmi: serie fatta, pausa o cambio?`,
    emotional: (name) =>
      `${name}, ti ho sentito. Decidi con me: metto in pausa o facciamo una serie leggera?`,
    noisy: (name) =>
      `${name}, con questo rumore non ti sento bene. Scrivi qui veloce e andiamo avanti.`,
    doubt: (name) =>
      `Tranquillo, ${name}. Movimento controllato, respira. Se senti che non torna, fermati e chiamami.`,
    unknown: (name) =>
      `${name}, non ho capito. Risposta breve: dolore, cambio, serie fatta o pausa?`,
  },
}

function getResponses(language: string): ContextResponses {
  if (language in RESPONSES) return RESPONSES[language]
  const prefix = language.split("-")[0]
  const found = Object.keys(RESPONSES).find((key) => key.startsWith(prefix))
  return found ? RESPONSES[found] : RESPONSES["pt-BR"]
}

// ─── Resultado da classificação ─────────────────────────────────────────────

export interface ContextClassification {
  intent: GutoQuickTalkIntent
  reply: string
  intentKey: string  // chave para o voicepack
  shouldRedirect: boolean  // off-topic / emocional / dúvida geral → curto e foco no treino
  shouldOfferChatLater: boolean  // off-topic → "vê no chat depois"
}

export interface ClassifyContextInput {
  rawText: string
  language: string
  userName?: string
}

export function classifyQuickTalk(input: ClassifyContextInput): ContextClassification {
  const userName =
    input.userName?.trim() ||
    (input.language.startsWith("pt")
      ? "parceiro"
      : input.language.startsWith("it")
        ? "amico"
        : "buddy")
  const responses = getResponses(input.language)
  const text = normalize(input.rawText)

  if (!text) {
    return {
      intent: "noisy_unclear",
      reply: responses.noisy(userName),
      intentKey: "online.voice.noisy",
      shouldRedirect: false,
      shouldOfferChatLater: false,
    }
  }

  const patterns = getPatterns(input.language)

  // Comandos diretos têm prioridade absoluta.
  if (patterns.setDone.test(text)) {
    return {
      intent: "command_set_done",
      reply: "",
      intentKey: "online.command.set_done",
      shouldRedirect: false,
      shouldOfferChatLater: false,
    }
  }
  if (patterns.pause.test(text)) {
    return {
      intent: "command_pause",
      reply: "",
      intentKey: "online.command.pause",
      shouldRedirect: false,
      shouldOfferChatLater: false,
    }
  }
  if (patterns.resume.test(text)) {
    return {
      intent: "command_resume",
      reply: "",
      intentKey: "online.command.resume",
      shouldRedirect: false,
      shouldOfferChatLater: false,
    }
  }
  if (patterns.finish.test(text)) {
    return {
      intent: "command_finish",
      reply: "",
      intentKey: "online.command.finish",
      shouldRedirect: false,
      shouldOfferChatLater: false,
    }
  }

  // Pain / swap / fatigue — exceções de treino que o GUTO trata in-place.
  if (patterns.pain.test(text)) {
    return {
      intent: "pain",
      reply: "",
      intentKey: "online.exception.pain",
      shouldRedirect: false,
      shouldOfferChatLater: false,
    }
  }
  if (patterns.swap.test(text)) {
    return {
      intent: "swap_equipment",
      reply: "",
      intentKey: "online.exception.swap",
      shouldRedirect: false,
      shouldOfferChatLater: false,
    }
  }
  if (patterns.fatigue.test(text)) {
    return {
      intent: "fatigue",
      reply: "",
      intentKey: "online.exception.fatigue",
      shouldRedirect: false,
      shouldOfferChatLater: false,
    }
  }
  if (patterns.doubt.test(text)) {
    return {
      intent: "doubt_execution",
      reply: responses.doubt(userName),
      intentKey: "online.exception.doubt",
      shouldRedirect: true,
      shouldOfferChatLater: false,
    }
  }
  if (patterns.emotional.test(text)) {
    return {
      intent: "emotional",
      reply: responses.emotional(userName),
      intentKey: "online.exception.emotional",
      shouldRedirect: true,
      shouldOfferChatLater: true,
    }
  }
  if (patterns.offTopic.test(text)) {
    return {
      intent: "off_topic",
      reply: responses.offTopic(userName),
      intentKey: "online.exception.off_topic",
      shouldRedirect: true,
      shouldOfferChatLater: true,
    }
  }

  return {
    intent: "unknown",
    reply: responses.unknown(userName),
    intentKey: "online.exception.unknown",
    shouldRedirect: true,
    shouldOfferChatLater: false,
  }
}

// ─── Texto humano quando voz falha ──────────────────────────────────────────

export function voiceFailureText(language: string, userName?: string): string {
  const name = userName?.trim() || (language.startsWith("pt") ? "parceiro" : language.startsWith("it") ? "amico" : "buddy")
  return getResponses(language).noisy(name)
}
